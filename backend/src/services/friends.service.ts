import { Friend, IFriend } from '../models/Friend';
import { FriendRequest, IFriendRequest } from '../models/FriendRequest';
import { User, IUser } from '../models/User';
import { logger } from '../utils/logger';

export class FriendsService {
  /**
   * Send a friend request
   */
  async sendFriendRequest(fromUserId: string, toEmail: string): Promise<IFriendRequest> {
    // Find the recipient by email
    const toUser = await User.findOne({ email: toEmail.toLowerCase() });

    if (!toUser) {
      throw new Error('User not found with that email address');
    }

    if (fromUserId === toUser._id.toString()) {
      throw new Error('You cannot send a friend request to yourself');
    }

    // Check if they are already friends
    const alreadyFriends = await this.areFriends(fromUserId, toUser._id.toString());
    if (alreadyFriends) {
      throw new Error('You are already friends with this user');
    }

    // Check if there's already a pending request (either direction)
    const existingRequest = await FriendRequest.findOne({
      $or: [
        { from: fromUserId, to: toUser._id, status: 'pending' },
        { from: toUser._id, to: fromUserId, status: 'pending' },
      ],
    });

    if (existingRequest) {
      if (existingRequest.from.toString() === fromUserId) {
        throw new Error('You already sent a friend request to this user');
      } else {
        throw new Error('This user already sent you a friend request. Check your pending requests!');
      }
    }

    // Create the friend request
    const friendRequest = await FriendRequest.create({
      from: fromUserId,
      to: toUser._id,
      status: 'pending',
    });

    logger.info(`Friend request sent from ${fromUserId} to ${toUser._id}`);

    // Populate and return
    return friendRequest.populate(['from', 'to'], 'name email avatar');
  }

  /**
   * Accept a friend request
   */
  async acceptFriendRequest(requestId: string, userId: string): Promise<IFriend> {
    const request = await FriendRequest.findById(requestId);

    if (!request) {
      throw new Error('Friend request not found');
    }

    if (request.to.toString() !== userId) {
      throw new Error('You can only accept friend requests sent to you');
    }

    if (request.status !== 'pending') {
      throw new Error('This friend request is no longer pending');
    }

    // Update the request status
    request.status = 'accepted';
    await request.save();

    // Create the friendship (always store with smaller ID first for consistency)
    const user1 = request.from.toString() < request.to.toString() ? request.from : request.to;
    const user2 = request.from.toString() < request.to.toString() ? request.to : request.from;

    const friendship = await Friend.create({
      user1,
      user2,
    });

    logger.info(`Friend request ${requestId} accepted, friendship created between ${user1} and ${user2}`);

    return friendship.populate(['user1', 'user2'], 'name email avatar');
  }

  /**
   * Decline a friend request
   */
  async declineFriendRequest(requestId: string, userId: string): Promise<void> {
    const request = await FriendRequest.findById(requestId);

    if (!request) {
      throw new Error('Friend request not found');
    }

    if (request.to.toString() !== userId) {
      throw new Error('You can only decline friend requests sent to you');
    }

    if (request.status !== 'pending') {
      throw new Error('This friend request is no longer pending');
    }

    // Update the request status
    request.status = 'declined';
    await request.save();

    logger.info(`Friend request ${requestId} declined by ${userId}`);
  }

  /**
   * Cancel a sent friend request
   */
  async cancelFriendRequest(requestId: string, userId: string): Promise<void> {
    const request = await FriendRequest.findById(requestId);

    if (!request) {
      throw new Error('Friend request not found');
    }

    if (request.from.toString() !== userId) {
      throw new Error('You can only cancel friend requests you sent');
    }

    if (request.status !== 'pending') {
      throw new Error('This friend request is no longer pending');
    }

    // Delete the request
    await FriendRequest.findByIdAndDelete(requestId);

    logger.info(`Friend request ${requestId} cancelled by ${userId}`);
  }

  /**
   * Get pending friend requests for a user
   */
  async getPendingRequests(userId: string): Promise<IFriendRequest[]> {
    return FriendRequest.find({
      to: userId,
      status: 'pending',
    })
      .populate('from', 'name email avatar')
      .sort({ createdAt: -1 });
  }

  /**
   * Get sent friend requests by a user
   */
  async getSentRequests(userId: string): Promise<IFriendRequest[]> {
    return FriendRequest.find({
      from: userId,
      status: 'pending',
    })
      .populate('to', 'name email avatar')
      .sort({ createdAt: -1 });
  }

  /**
   * Get all friends for a user
   */
  async getFriends(userId: string): Promise<Array<IUser>> {
    const friendships = await Friend.find({
      $or: [{ user1: userId }, { user2: userId }],
    })
      .populate('user1', 'name email avatar')
      .populate('user2', 'name email avatar');

    // Extract the friend user (not the current user)
    return friendships.map((friendship) => {
      const friend1 = friendship.user1 as unknown as IUser;
      const friend2 = friendship.user2 as unknown as IUser;
      return friend1._id.toString() === userId ? friend2 : friend1;
    });
  }

  /**
   * Remove a friend
   */
  async removeFriend(userId: string, friendId: string): Promise<void> {
    const result = await Friend.findOneAndDelete({
      $or: [
        { user1: userId, user2: friendId },
        { user1: friendId, user2: userId },
      ],
    });

    if (!result) {
      throw new Error('Friendship not found');
    }

    logger.info(`Friendship removed between ${userId} and ${friendId}`);
  }

  /**
   * Check if two users are friends
   */
  async areFriends(userId1: string, userId2: string): Promise<boolean> {
    const count = await Friend.countDocuments({
      $or: [
        { user1: userId1, user2: userId2 },
        { user1: userId2, user2: userId1 },
      ],
    });
    return count > 0;
  }

  /**
   * Search for users by email (only returns friends or users with pending requests)
   */
  async searchUsers(currentUserId: string, searchQuery: string): Promise<Array<IUser & { friendshipStatus?: string }>> {
    // Search for users by email
    const users = await User.find({
      email: { $regex: searchQuery, $options: 'i' },
      _id: { $ne: currentUserId }, // Exclude current user
    })
      .limit(10)
      .select('name email avatar');

    // For each user, check friendship status
    const usersWithStatus = await Promise.all(
      users.map(async (user) => {
        const isFriend = await this.areFriends(currentUserId, user._id.toString());

        if (isFriend) {
          return { ...user.toObject(), friendshipStatus: 'friends' };
        }

        // Check for pending request (either direction)
        const pendingRequest = await FriendRequest.findOne({
          $or: [
            { from: currentUserId, to: user._id, status: 'pending' },
            { from: user._id, to: currentUserId, status: 'pending' },
          ],
        });

        if (pendingRequest) {
          if (pendingRequest.from.toString() === currentUserId) {
            return { ...user.toObject(), friendshipStatus: 'request_sent' };
          } else {
            return { ...user.toObject(), friendshipStatus: 'request_received' };
          }
        }

        return { ...user.toObject(), friendshipStatus: 'none' };
      })
    );

    return usersWithStatus;
  }
}

export const friendsService = new FriendsService();

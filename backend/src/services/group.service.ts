import { Group, IGroup } from '../models/Group';
import { Expense } from '../models/Expense';
import { Balance } from '../models/Balance';
import { NotFoundError, ForbiddenError, BadRequestError } from '../middleware/errorHandler';
import { logger } from '../utils/logger';
import { v4 as uuidv4 } from 'uuid';
import { redisClient } from '../config/redis';

export class GroupService {
  /**
   * Create a new group
   */
  async createGroup(
    userId: string,
    name: string,
    theme: 'poker' | 'classic' | 'minimal' = 'poker',
    currency: string = 'USD'
  ): Promise<IGroup> {
    const group = await Group.create({
      name,
      theme,
      currency,
      members: [
        {
          userId,
          seatPosition: 0,
          joinedAt: new Date(),
        },
      ],
    });

    logger.info(`Group created: ${group._id} by user ${userId}`);

    return group;
  }

  /**
   * Get user's groups
   */
  async getUserGroups(userId: string): Promise<IGroup[]> {
    const groups = await Group.find({ 'members.userId': userId })
      .populate('members.userId', 'name email avatar')
      .sort({ createdAt: -1 });

    return groups;
  }

  /**
   * Get group by ID
   */
  async getGroupById(userId: string, groupId: string): Promise<IGroup> {
    const group = await Group.findById(groupId).populate('members.userId', 'name email avatar');

    if (!group) {
      throw new NotFoundError('Group not found');
    }

    // Verify user is member
    const isMember = group.members.some((m) => m.userId._id.toString() === userId);
    if (!isMember) {
      throw new ForbiddenError('You are not a member of this group');
    }

    return group;
  }

  /**
   * Generate group invite token
   */
  async generateInviteToken(userId: string, groupId: string): Promise<string> {
    const group = await Group.findById(groupId);

    if (!group) {
      throw new NotFoundError('Group not found');
    }

    // Verify user is member
    const isMember = group.members.some((m) => m.userId.toString() === userId);
    if (!isMember) {
      throw new ForbiddenError('You are not a member of this group');
    }

    const inviteToken = uuidv4();

    // Store invite token in Redis (expires in 7 days)
    await redisClient.setEx(`invite:${inviteToken}`, 604800, groupId);

    logger.info(`Invite token generated for group ${groupId}`);

    return inviteToken;
  }

  /**
   * Join group via invite token
   */
  async joinGroup(userId: string, inviteToken: string): Promise<IGroup> {
    const groupId = await redisClient.get(`invite:${inviteToken}`);

    if (!groupId) {
      throw new BadRequestError('Invalid or expired invite link');
    }

    const group = await Group.findById(groupId);

    if (!group) {
      throw new NotFoundError('Group not found');
    }

    // Check if already a member
    const isMember = group.members.some((m) => m.userId.toString() === userId);
    if (isMember) {
      throw new BadRequestError('You are already a member of this group');
    }

    // Check seat limit (max 8 seats)
    if (group.members.length >= 8) {
      throw new BadRequestError('Group is full (max 8 members)');
    }

    // Find next available seat
    const usedSeats = group.members.map((m) => m.seatPosition);
    let nextSeat = 0;
    for (let i = 0; i < 8; i++) {
      if (!usedSeats.includes(i)) {
        nextSeat = i;
        break;
      }
    }

    // Add member
    group.members.push({
      userId: userId as any,
      seatPosition: nextSeat,
      joinedAt: new Date(),
    });

    await group.save();

    logger.info(`User ${userId} joined group ${groupId}`);

    return group;
  }

  /**
   * Update group settings
   */
  async updateGroup(
    userId: string,
    groupId: string,
    updates: { name?: string; theme?: string; currency?: string }
  ): Promise<IGroup> {
    const group = await Group.findById(groupId);

    if (!group) {
      throw new NotFoundError('Group not found');
    }

    // Verify user is member
    const isMember = group.members.some((m) => m.userId.toString() === userId);
    if (!isMember) {
      throw new ForbiddenError('You are not a member of this group');
    }

    Object.assign(group, updates);
    await group.save();

    logger.info(`Group ${groupId} updated by user ${userId}`);

    return group;
  }

  /**
   * Leave group
   */
  async leaveGroup(userId: string, groupId: string): Promise<void> {
    const group = await Group.findById(groupId);

    if (!group) {
      throw new NotFoundError('Group not found');
    }

    // Remove user from members
    group.members = group.members.filter((m) => m.userId.toString() !== userId);

    if (group.members.length === 0) {
      // Delete group if no members left
      await Group.findByIdAndDelete(groupId);
      logger.info(`Group ${groupId} deleted (no members left)`);
    } else {
      await group.save();
      logger.info(`User ${userId} left group ${groupId}`);
    }
  }

  /**
   * Add a member to the group (must be friends with the inviter)
   */
  async addMember(inviterId: string, groupId: string, newMemberId: string): Promise<IGroup> {
    const group = await Group.findById(groupId).populate('members.userId', 'name email avatar');

    if (!group) {
      throw new NotFoundError('Group not found');
    }

    // Check if inviter is a member of the group
    const inviterIsMember = group.members.some((m) => m.userId._id.toString() === inviterId);
    if (!inviterIsMember) {
      throw new ForbiddenError('You must be a member of the group to invite others');
    }

    // Check if the new member is already in the group
    const alreadyMember = group.members.some((m) => m.userId._id.toString() === newMemberId);
    if (alreadyMember) {
      throw new BadRequestError('User is already a member of this group');
    }

    // Check if they are friends using the Friend model
    const { Friend } = await import('../models/Friend');
    const areFriends = await Friend.countDocuments({
      $or: [
        { user1: inviterId, user2: newMemberId },
        { user1: newMemberId, user2: inviterId },
      ],
    }) > 0;

    if (!areFriends) {
      throw new ForbiddenError('You can only add friends to your groups');
    }

    // Verify the user exists
    const { User } = await import('../models/User');
    const userExists = await User.findById(newMemberId);
    if (!userExists) {
      throw new NotFoundError('User not found');
    }

    // Add the new member with the next seat position
    const nextSeatPosition = group.members.length;
    group.members.push({
      userId: newMemberId,
      seatPosition: nextSeatPosition,
      joinedAt: new Date(),
    } as any);

    await group.save();

    logger.info(`Member ${newMemberId} added to group ${groupId} by ${inviterId}`);

    // Return populated group
    return await Group.findById(groupId).populate('members.userId', 'name email avatar') as IGroup;
  }

  /**
   * Remove member from group (creator only)
   */
  async removeMember(userId: string, groupId: string, memberId: string): Promise<IGroup> {
    const group = await Group.findById(groupId).populate('members.userId', 'name email avatar');

    if (!group) {
      throw new NotFoundError('Group not found');
    }

    // Check if user is the creator (first member)
    if (group.members.length === 0 || group.members[0].userId._id.toString() !== userId) {
      throw new ForbiddenError('Only the group creator can remove members');
    }

    // Cannot remove the creator
    if (memberId === userId) {
      throw new BadRequestError('Cannot remove yourself as the creator. Delete the group instead.');
    }

    // Check if member exists in group
    const memberExists = group.members.some((m) => m.userId._id.toString() === memberId);
    if (!memberExists) {
      throw new NotFoundError('Member not found in this group');
    }

    // Remove the member
    group.members = group.members.filter((m) => m.userId._id.toString() !== memberId);
    await group.save();

    logger.info(`Member ${memberId} removed from group ${groupId} by creator ${userId}`);

    // Return populated group
    return await Group.findById(groupId).populate('members.userId', 'name email avatar') as IGroup;
  }

  /**
   * Delete entire group (creator only)
   */
  async deleteGroup(userId: string, groupId: string): Promise<void> {
    const group = await Group.findById(groupId);

    if (!group) {
      throw new NotFoundError('Group not found');
    }

    // Check if user is the creator (first member)
    if (group.members.length === 0 || group.members[0].userId.toString() !== userId) {
      throw new ForbiddenError('Only the group creator can delete the group');
    }

    // Delete all associated expenses
    await Expense.deleteMany({ groupId });

    // Delete all associated balances
    await Balance.deleteMany({ groupId });

    // Delete the group
    await Group.findByIdAndDelete(groupId);

    logger.info(`Group ${groupId} deleted by creator ${userId}`);
  }
}

export const groupService = new GroupService();

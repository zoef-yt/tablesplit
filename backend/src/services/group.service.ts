import { Group, IGroup } from '../models/Group';
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
}

export const groupService = new GroupService();

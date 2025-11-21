import crypto from 'crypto';
import { Invite, IInvite } from '../models/Invite';
import { InviteAuditLog } from '../models/InviteAuditLog';
import { Expense } from '../models/Expense';
import { Group } from '../models/Group';
import { User } from '../models/User';
import { Friend } from '../models/Friend';
import { Balance } from '../models/Balance';
import { emailService } from './email.service';
import { logger } from '../utils/logger';

class BadRequestError extends Error {
  statusCode = 400;
  constructor(message: string) {
    super(message);
    this.name = 'BadRequestError';
  }
}

class NotFoundError extends Error {
  statusCode = 404;
  constructor(message: string) {
    super(message);
    this.name = 'NotFoundError';
  }
}

class ForbiddenError extends Error {
  statusCode = 403;
  constructor(message: string) {
    super(message);
    this.name = 'ForbiddenError';
  }
}

export class InviteService {
  /**
   * Create an invite for a non-registered email
   */
  async createInvite(
    inviterId: string,
    email: string,
    groupId: string,
    expenseId?: string
  ): Promise<{ invite: IInvite; token: string }> {
    // 1. Normalize email
    const normalizedEmail = email.toLowerCase().trim();

    // 2. Check if user already exists
    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      throw new BadRequestError('User already registered. Add them directly to the group.');
    }

    // 3. Verify inviter is member of the group
    const group = await Group.findById(groupId);
    if (!group) {
      throw new NotFoundError('Group not found');
    }

    const isMember = group.members.some((m) => m.userId.toString() === inviterId);
    if (!isMember) {
      throw new ForbiddenError('You are not a member of this group');
    }

    // 4. Check for existing pending invite
    const existingInvite = await Invite.findOne({
      email: normalizedEmail,
      groupId,
      status: 'pending',
    });

    if (existingInvite) {
      // Return existing invite without creating a new one
      logger.info(`Existing pending invite found for ${normalizedEmail} in group ${groupId}`);
      return { invite: existingInvite, token: '' };
    }

    // 5. Rate limit check
    await this.checkRateLimit(inviterId);

    // 6. Generate token and hash
    const token = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

    // 7. Create invite
    const invite = await Invite.create({
      email: normalizedEmail,
      invitedBy: inviterId,
      groupId,
      expenseId,
      tokenHash,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
    });

    // 8. Create audit log
    await this.createAuditLog(invite._id.toString(), 'created', inviterId);

    // 9. Get inviter info and send email
    const inviter = await User.findById(inviterId);
    if (inviter) {
      // Send invite email asynchronously
      this.sendInviteEmail(
        normalizedEmail,
        token,
        inviter.name,
        group.name,
        expenseId
      ).catch((err) => {
        logger.error(`Failed to send invite email to ${normalizedEmail}:`, err);
      });
    }

    logger.info(`Invite created for ${normalizedEmail} to group ${groupId} by ${inviterId}`);

    return { invite, token };
  }

  /**
   * Send invite email
   */
  private async sendInviteEmail(
    email: string,
    token: string,
    inviterName: string,
    groupName: string,
    expenseId?: string
  ): Promise<void> {
    let expenseDescription: string | undefined;
    let expenseAmount: number | undefined;
    let userShare: number | undefined;

    if (expenseId) {
      const expense = await Expense.findById(expenseId);
      if (expense) {
        expenseDescription = expense.description;
        expenseAmount = expense.amount;
        // Find the pending split for this email
        const pendingSplit = expense.splits.find(
          (s) => s.pendingEmail === email.toLowerCase()
        );
        if (pendingSplit) {
          userShare = pendingSplit.amount;
        }
      }
    }

    await emailService.sendSplitInvite(
      email,
      inviterName,
      groupName,
      token,
      expenseDescription,
      expenseAmount,
      userShare
    );

    // Log that email was sent
    const invite = await Invite.findOne({ email: email.toLowerCase(), tokenHash: crypto.createHash('sha256').update(token).digest('hex') });
    if (invite) {
      await this.createAuditLog(invite._id.toString(), 'sent');
    }
  }

  /**
   * Process pending invites when user signs up
   */
  async processSignupInvites(userId: string, email: string): Promise<number> {
    const normalizedEmail = email.toLowerCase().trim();

    // Find all pending invites for this email
    const pendingInvites = await Invite.find({
      email: normalizedEmail,
      status: 'pending',
      expiresAt: { $gt: new Date() },
    });

    let processedCount = 0;

    for (const invite of pendingInvites) {
      try {
        // 1. Convert pending splits to real user
        await Expense.updateMany(
          {
            groupId: invite.groupId,
            'splits.pendingEmail': normalizedEmail,
          },
          {
            $set: {
              'splits.$[elem].userId': userId,
              'splits.$[elem].status': 'active',
              'splits.$[elem].pendingEmail': null,
            },
          },
          {
            arrayFilters: [{ 'elem.pendingEmail': normalizedEmail }],
          }
        );

        // 2. Add user to group if not already a member
        const group = await Group.findById(invite.groupId);
        if (group) {
          const isMember = group.members.some((m) => m.userId.toString() === userId);
          if (!isMember) {
            await Group.findByIdAndUpdate(
              invite.groupId,
              {
                $addToSet: {
                  members: {
                    userId,
                    joinedAt: new Date(),
                    role: 'member',
                  },
                },
              }
            );
          }
        }

        // 3. Create friend connection with inviter
        await this.createFriendConnection(userId, invite.invitedBy.toString());

        // 4. Update invite status
        invite.status = 'accepted';
        invite.acceptedAt = new Date();
        invite.acceptedBy = userId as any;
        await invite.save();

        // 5. Create audit log
        await this.createAuditLog(invite._id.toString(), 'accepted', userId);

        // 6. Initialize balance for new member
        await Balance.findOneAndUpdate(
          { groupId: invite.groupId, userId },
          { balance: 0, lastUpdated: new Date() },
          { upsert: true }
        );

        processedCount++;
        logger.info(`Processed invite ${invite._id} for user ${userId}`);
      } catch (error) {
        logger.error(`Failed to process invite ${invite._id}:`, error);
      }
    }

    return processedCount;
  }

  /**
   * Create friend connection between two users
   */
  private async createFriendConnection(userId1: string, userId2: string): Promise<void> {
    // Check if already friends
    const existingFriend = await Friend.findOne({
      $or: [
        { user1: userId1, user2: userId2 },
        { user1: userId2, user2: userId1 },
      ],
    });

    if (existingFriend) {
      return; // Already friends
    }

    // Create friendship (smaller ID first for consistency)
    const user1 = userId1 < userId2 ? userId1 : userId2;
    const user2 = userId1 < userId2 ? userId2 : userId1;

    await Friend.create({ user1, user2 });
    logger.info(`Friend connection created between ${userId1} and ${userId2}`);
  }

  /**
   * Rate limit invites per user
   */
  private async checkRateLimit(userId: string): Promise<void> {
    const recentInvites = await Invite.countDocuments({
      invitedBy: userId,
      createdAt: { $gt: new Date(Date.now() - 24 * 60 * 60 * 1000) },
    });

    if (recentInvites >= 20) {
      throw new BadRequestError('Too many invites sent. Please wait 24 hours.');
    }
  }

  /**
   * Get pending invites for a group
   */
  async getGroupInvites(userId: string, groupId: string): Promise<IInvite[]> {
    // Verify user is member of group
    const group = await Group.findById(groupId);
    if (!group) {
      throw new NotFoundError('Group not found');
    }

    const isMember = group.members.some((m) => m.userId.toString() === userId);
    if (!isMember) {
      throw new ForbiddenError('You are not a member of this group');
    }

    return Invite.find({
      groupId,
      status: 'pending',
    })
      .populate('invitedBy', 'name email avatar')
      .sort({ createdAt: -1 });
  }

  /**
   * Get invites sent by current user
   */
  async getSentInvites(userId: string): Promise<IInvite[]> {
    return Invite.find({
      invitedBy: userId,
    })
      .populate('groupId', 'name')
      .sort({ createdAt: -1 });
  }

  /**
   * Resend invite email
   */
  async resendInvite(inviteId: string, userId: string): Promise<void> {
    const invite = await Invite.findById(inviteId);
    if (!invite) {
      throw new NotFoundError('Invite not found');
    }

    if (invite.invitedBy.toString() !== userId) {
      throw new ForbiddenError('You can only resend invites you created');
    }

    if (invite.status !== 'pending') {
      throw new BadRequestError('This invite is no longer pending');
    }

    // Generate new token
    const token = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

    // Update invite with new token and expiration
    invite.tokenHash = tokenHash;
    invite.expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    await invite.save();

    // Get inviter and group info
    const inviter = await User.findById(userId);
    const group = await Group.findById(invite.groupId);

    if (inviter && group) {
      await emailService.sendSplitInvite(
        invite.email,
        token,
        inviter.name,
        group.name,
        undefined,
        undefined,
        undefined
      );
    }

    await this.createAuditLog(inviteId, 'resent', userId);
    logger.info(`Invite ${inviteId} resent by ${userId}`);
  }

  /**
   * Cancel an invite
   */
  async cancelInvite(inviteId: string, userId: string): Promise<void> {
    const invite = await Invite.findById(inviteId);
    if (!invite) {
      throw new NotFoundError('Invite not found');
    }

    if (invite.invitedBy.toString() !== userId) {
      throw new ForbiddenError('You can only cancel invites you created');
    }

    if (invite.status !== 'pending') {
      throw new BadRequestError('This invite is no longer pending');
    }

    // Update status
    invite.status = 'cancelled';
    await invite.save();

    // Remove pending splits for this email
    await Expense.updateMany(
      {
        groupId: invite.groupId,
        'splits.pendingEmail': invite.email,
      },
      {
        $pull: { splits: { pendingEmail: invite.email } },
      }
    );

    await this.createAuditLog(inviteId, 'cancelled', userId);
    logger.info(`Invite ${inviteId} cancelled by ${userId}`);
  }

  /**
   * Accept invite by token (for direct link acceptance)
   */
  async acceptInviteByToken(token: string, userId: string): Promise<IInvite> {
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

    const invite = await Invite.findOne({
      tokenHash,
      status: 'pending',
      expiresAt: { $gt: new Date() },
    });

    if (!invite) {
      throw new BadRequestError('Invalid or expired invite');
    }

    // Verify the user's email matches the invite
    const user = await User.findById(userId);
    if (!user || user.email.toLowerCase() !== invite.email) {
      throw new BadRequestError('This invite is for a different email address');
    }

    // Process this single invite
    await this.processSignupInvites(userId, invite.email);

    return invite;
  }

  /**
   * Allow invitee to opt out and delete their data
   */
  async optOut(email: string): Promise<void> {
    const normalizedEmail = email.toLowerCase().trim();

    // Delete all pending invites
    const deletedInvites = await Invite.find({
      email: normalizedEmail,
      status: 'pending',
    });

    for (const invite of deletedInvites) {
      await this.createAuditLog(invite._id.toString(), 'cancelled', undefined, {
        reason: 'opt_out',
      });
    }

    await Invite.deleteMany({
      email: normalizedEmail,
      status: 'pending',
    });

    // Remove from pending splits
    await Expense.updateMany(
      { 'splits.pendingEmail': normalizedEmail },
      { $pull: { splits: { pendingEmail: normalizedEmail } } }
    );

    logger.info(`User ${normalizedEmail} opted out of invites`);
  }

  /**
   * Create audit log entry
   */
  private async createAuditLog(
    inviteId: string,
    action: 'created' | 'sent' | 'resent' | 'accepted' | 'expired' | 'cancelled',
    performedBy?: string,
    metadata?: Record<string, any>
  ): Promise<void> {
    await InviteAuditLog.create({
      inviteId,
      action,
      performedBy,
      metadata,
    });
  }

  /**
   * Get invite by token (for verification during signup)
   */
  async getInviteByToken(token: string): Promise<IInvite | null> {
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

    return Invite.findOne({
      tokenHash,
      status: 'pending',
      expiresAt: { $gt: new Date() },
    }).populate('groupId', 'name');
  }

  /**
   * Clean up expired invites (can be run as a cron job)
   */
  async cleanupExpiredInvites(): Promise<number> {
    const expiredInvites = await Invite.find({
      status: 'pending',
      expiresAt: { $lt: new Date() },
    });

    for (const invite of expiredInvites) {
      invite.status = 'expired';
      await invite.save();
      await this.createAuditLog(invite._id.toString(), 'expired');
    }

    logger.info(`Cleaned up ${expiredInvites.length} expired invites`);
    return expiredInvites.length;
  }
}

export const inviteService = new InviteService();

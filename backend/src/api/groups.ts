import { Router, Response } from 'express';
import { groupService } from '../services/group.service';
import { emailService } from '../services/email.service';
import { authenticateToken, AuthRequest } from '../middleware/auth';
import { validate, schemas } from '../middleware/validation';

const router = Router();

// All routes require authentication
router.use(authenticateToken);

/**
 * POST /api/groups
 * Create a new group
 */
router.post('/', validate(schemas.createGroup), async (req: AuthRequest, res: Response, next) => {
  try {
    const { name, theme, currency } = req.body;

    const group = await groupService.createGroup(req.userId!, name, theme, currency);

    res.status(201).json({
      success: true,
      data: group,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/groups
 * Get user's groups
 */
router.get('/', async (req: AuthRequest, res: Response, next) => {
  try {
    const groups = await groupService.getUserGroups(req.userId!);

    res.json({
      success: true,
      data: groups,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/groups/:id
 * Get group by ID
 */
router.get('/:id', async (req: AuthRequest, res: Response, next) => {
  try {
    const { id } = req.params;

    const group = await groupService.getGroupById(req.userId!, id);

    res.json({
      success: true,
      data: group,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * PUT /api/groups/:id
 * Update group
 */
router.put('/:id', async (req: AuthRequest, res: Response, next) => {
  try {
    const { id } = req.params;
    const { name, theme, currency } = req.body;

    const group = await groupService.updateGroup(req.userId!, id, { name, theme, currency });

    res.json({
      success: true,
      data: group,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/groups/:id/invite
 * Generate invite link
 */
router.post('/:id/invite', async (req: AuthRequest, res: Response, next) => {
  try {
    const { id } = req.params;
    const { email, inviterName } = req.body;

    const inviteToken = await groupService.generateInviteToken(req.userId!, id);
    const group = await groupService.getGroupById(req.userId!, id);

    if (email) {
      // Send invite email
      await emailService.sendGroupInvite(email, inviterName, group.name, inviteToken);
    }

    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    const inviteLink = `${frontendUrl}/groups/join/${inviteToken}`;

    res.json({
      success: true,
      data: { inviteToken, inviteLink },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/groups/join/:token
 * Join group via invite
 */
router.post('/join/:token', async (req: AuthRequest, res: Response, next) => {
  try {
    const { token } = req.params;

    const group = await groupService.joinGroup(req.userId!, token);

    res.json({
      success: true,
      data: group,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * DELETE /api/groups/:id/leave
 * Leave group
 */
router.delete('/:id/leave', async (req: AuthRequest, res: Response, next) => {
  try {
    const { id } = req.params;

    await groupService.leaveGroup(req.userId!, id);

    res.json({
      success: true,
      message: 'Left group successfully',
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/groups/:id/members
 * Add a member to the group directly (must be friends)
 */
router.post('/:id/members', async (req: AuthRequest, res: Response, next) => {
  try {
    const { id } = req.params;
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({
        success: false,
        error: 'User ID is required',
      });
    }

    const group = await groupService.addMember(req.userId!, id, userId);

    res.json({
      success: true,
      data: group,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * DELETE /api/groups/:id/members/:memberId
 * Remove member from group (creator only)
 */
router.delete('/:id/members/:memberId', async (req: AuthRequest, res: Response, next) => {
  try {
    const { id, memberId } = req.params;

    const group = await groupService.removeMember(req.userId!, id, memberId);

    res.json({
      success: true,
      data: group,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * DELETE /api/groups/:id
 * Delete entire group (creator only)
 */
router.delete('/:id', async (req: AuthRequest, res: Response, next) => {
  try {
    const { id } = req.params;

    await groupService.deleteGroup(req.userId!, id);

    res.json({
      success: true,
      message: 'Group deleted successfully',
    });
  } catch (error) {
    next(error);
  }
});

export default router;

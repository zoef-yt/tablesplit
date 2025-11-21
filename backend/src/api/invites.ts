import { Router, Response } from 'express';
import { inviteService } from '../services/invite.service';
import { authenticateToken, AuthRequest } from '../middleware/auth';
import { logger } from '../utils/logger';

const router = Router();

// All routes require authentication
router.use(authenticateToken);

/**
 * POST /api/invites
 * Create a new invite for a non-registered email
 */
router.post('/', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { email, groupId, expenseId } = req.body;

    if (!email || !groupId) {
      res.status(400).json({
        success: false,
        error: 'Email and groupId are required',
      });
      return;
    }

    const result = await inviteService.createInvite(
      req.userId!,
      email,
      groupId,
      expenseId
    );

    res.status(201).json({
      success: true,
      data: result.invite,
      message: result.token ? 'Invite created and email sent' : 'Invite already exists',
    });
  } catch (error) {
    logger.error('Error creating invite:', error);
    const statusCode = (error as any).statusCode || 500;
    res.status(statusCode).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create invite',
    });
  }
});

/**
 * GET /api/invites/group/:groupId
 * Get pending invites for a group
 */
router.get('/group/:groupId', async (req: AuthRequest, res: Response) => {
  try {
    const { groupId } = req.params;

    const invites = await inviteService.getGroupInvites(req.userId!, groupId);

    res.json({
      success: true,
      data: invites,
    });
  } catch (error) {
    logger.error('Error getting group invites:', error);
    const statusCode = (error as any).statusCode || 500;
    res.status(statusCode).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get invites',
    });
  }
});

/**
 * GET /api/invites/sent
 * Get invites sent by current user
 */
router.get('/sent', async (req: AuthRequest, res: Response) => {
  try {
    const invites = await inviteService.getSentInvites(req.userId!);

    res.json({
      success: true,
      data: invites,
    });
  } catch (error) {
    logger.error('Error getting sent invites:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get sent invites',
    });
  }
});

/**
 * POST /api/invites/:inviteId/resend
 * Resend invite email
 */
router.post('/:inviteId/resend', async (req: AuthRequest, res: Response) => {
  try {
    const { inviteId } = req.params;

    await inviteService.resendInvite(inviteId, req.userId!);

    res.json({
      success: true,
      message: 'Invite resent successfully',
    });
  } catch (error) {
    logger.error('Error resending invite:', error);
    const statusCode = (error as any).statusCode || 500;
    res.status(statusCode).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to resend invite',
    });
  }
});

/**
 * DELETE /api/invites/:inviteId
 * Cancel an invite
 */
router.delete('/:inviteId', async (req: AuthRequest, res: Response) => {
  try {
    const { inviteId } = req.params;

    await inviteService.cancelInvite(inviteId, req.userId!);

    res.json({
      success: true,
      message: 'Invite cancelled successfully',
    });
  } catch (error) {
    logger.error('Error cancelling invite:', error);
    const statusCode = (error as any).statusCode || 500;
    res.status(statusCode).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to cancel invite',
    });
  }
});

/**
 * POST /api/invites/accept
 * Accept invite by token (for logged-in users)
 */
router.post('/accept', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { token } = req.body;

    if (!token) {
      res.status(400).json({
        success: false,
        error: 'Token is required',
      });
      return;
    }

    const invite = await inviteService.acceptInviteByToken(token, req.userId!);

    res.json({
      success: true,
      data: {
        groupId: invite.groupId,
      },
      message: 'Invite accepted successfully',
    });
  } catch (error) {
    logger.error('Error accepting invite:', error);
    const statusCode = (error as any).statusCode || 500;
    res.status(statusCode).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to accept invite',
    });
  }
});

/**
 * GET /api/invites/verify/:token
 * Verify invite token (for signup flow)
 */
router.get('/verify/:token', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { token } = req.params;

    const invite = await inviteService.getInviteByToken(token);

    if (!invite) {
      res.status(404).json({
        success: false,
        error: 'Invalid or expired invite',
      });
      return;
    }

    res.json({
      success: true,
      data: {
        email: invite.email,
        groupName: (invite.groupId as any).name,
      },
    });
  } catch (error) {
    logger.error('Error verifying invite:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to verify invite',
    });
  }
});

export default router;

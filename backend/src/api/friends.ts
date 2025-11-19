import { Router } from 'express';
import { friendsService } from '../services/friends.service';
import { authenticateToken, AuthRequest } from '../middleware/auth';
import { logger } from '../utils/logger';

const router = Router();

// All routes require authentication
router.use(authenticateToken);

/**
 * Send a friend request
 * POST /api/friends/request
 */
router.post('/request', async (req: AuthRequest, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    const friendRequest = await friendsService.sendFriendRequest(req.userId!, email);

    return res.status(201).json(friendRequest);
  } catch (error) {
    logger.error('Error sending friend request:', error);
    return res.status(400).json({
      error: error instanceof Error ? error.message : 'Failed to send friend request',
    });
  }
});

/**
 * Accept a friend request
 * POST /api/friends/request/:requestId/accept
 */
router.post('/request/:requestId/accept', async (req: AuthRequest, res) => {
  try {
    const { requestId } = req.params;
    const friendship = await friendsService.acceptFriendRequest(requestId, req.userId!);

    return res.json(friendship);
  } catch (error) {
    logger.error('Error accepting friend request:', error);
    return res.status(400).json({
      error: error instanceof Error ? error.message : 'Failed to accept friend request',
    });
  }
});

/**
 * Decline a friend request
 * POST /api/friends/request/:requestId/decline
 */
router.post('/request/:requestId/decline', async (req: AuthRequest, res) => {
  try {
    const { requestId } = req.params;
    await friendsService.declineFriendRequest(requestId, req.userId!);

    return res.json({ message: 'Friend request declined' });
  } catch (error) {
    logger.error('Error declining friend request:', error);
    return res.status(400).json({
      error: error instanceof Error ? error.message : 'Failed to decline friend request',
    });
  }
});

/**
 * Cancel a sent friend request
 * DELETE /api/friends/request/:requestId
 */
router.delete('/request/:requestId', async (req: AuthRequest, res) => {
  try {
    const { requestId } = req.params;
    await friendsService.cancelFriendRequest(requestId, req.userId!);

    return res.json({ message: 'Friend request cancelled' });
  } catch (error) {
    logger.error('Error cancelling friend request:', error);
    return res.status(400).json({
      error: error instanceof Error ? error.message : 'Failed to cancel friend request',
    });
  }
});

/**
 * Get pending friend requests
 * GET /api/friends/requests/pending
 */
router.get('/requests/pending', async (req: AuthRequest, res) => {
  try {
    const requests = await friendsService.getPendingRequests(req.userId!);
    return res.json(requests);
  } catch (error) {
    logger.error('Error fetching pending requests:', error);
    return res.status(500).json({ error: 'Failed to fetch pending requests' });
  }
});

/**
 * Get sent friend requests
 * GET /api/friends/requests/sent
 */
router.get('/requests/sent', async (req: AuthRequest, res) => {
  try {
    const requests = await friendsService.getSentRequests(req.userId!);
    return res.json(requests);
  } catch (error) {
    logger.error('Error fetching sent requests:', error);
    return res.status(500).json({ error: 'Failed to fetch sent requests' });
  }
});

/**
 * Search for users
 * GET /api/friends/search?q=email
 */
router.get('/search', async (req: AuthRequest, res) => {
  try {
    const { q } = req.query;

    if (!q || typeof q !== 'string') {
      return res.status(400).json({ error: 'Search query is required' });
    }

    const users = await friendsService.searchUsers(req.userId!, q);
    return res.json(users);
  } catch (error) {
    logger.error('Error searching users:', error);
    return res.status(500).json({ error: 'Failed to search users' });
  }
});

/**
 * Get all friends
 * GET /api/friends
 */
router.get('/', async (req: AuthRequest, res) => {
  try {
    const friends = await friendsService.getFriends(req.userId!);
    return res.json(friends);
  } catch (error) {
    logger.error('Error fetching friends:', error);
    return res.status(500).json({ error: 'Failed to fetch friends' });
  }
});

/**
 * Remove a friend
 * DELETE /api/friends/:friendId
 */
router.delete('/:friendId', async (req: AuthRequest, res) => {
  try {
    const { friendId } = req.params;
    await friendsService.removeFriend(req.userId!, friendId);

    return res.json({ message: 'Friend removed successfully' });
  } catch (error) {
    logger.error('Error removing friend:', error);
    return res.status(400).json({
      error: error instanceof Error ? error.message : 'Failed to remove friend',
    });
  }
});

export default router;

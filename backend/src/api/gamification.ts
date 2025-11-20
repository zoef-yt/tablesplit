import { Router, Response } from 'express';
import { gamificationService, BADGES, ACHIEVEMENTS } from '../services/gamification.service';
import { authenticateToken, AuthRequest } from '../middleware/auth';
import { logger } from '../utils/logger';

const router = Router();

// All routes require authentication
router.use(authenticateToken);

/**
 * Get current user's gamification profile
 * GET /api/gamification/profile
 */
router.get('/profile', async (req: AuthRequest, res: Response) => {
  try {
    const profile = await gamificationService.getProfile(req.userId!);
    return res.json(profile);
  } catch (error) {
    logger.error('Error fetching gamification profile:', error);
    return res.status(500).json({ error: 'Failed to fetch profile' });
  }
});

/**
 * Get another user's gamification profile
 * GET /api/gamification/profile/:userId
 */
router.get('/profile/:userId', async (req: AuthRequest, res: Response) => {
  try {
    const { userId } = req.params;
    const profile = await gamificationService.getProfile(userId);
    return res.json(profile);
  } catch (error) {
    logger.error('Error fetching user gamification profile:', error);
    return res.status(500).json({ error: 'Failed to fetch profile' });
  }
});

/**
 * Get leaderboard
 * GET /api/gamification/leaderboard
 */
router.get('/leaderboard', async (req: AuthRequest, res: Response) => {
  try {
    const type = (req.query.type as 'xp' | 'settlements' | 'streaks') || 'xp';
    const limit = parseInt(req.query.limit as string) || 10;

    const leaderboard = await gamificationService.getLeaderboard(type, limit);
    return res.json(leaderboard);
  } catch (error) {
    logger.error('Error fetching leaderboard:', error);
    return res.status(500).json({ error: 'Failed to fetch leaderboard' });
  }
});

/**
 * Get all available badges
 * GET /api/gamification/badges
 */
router.get('/badges', async (_req: AuthRequest, res: Response) => {
  try {
    return res.json(BADGES);
  } catch (error) {
    logger.error('Error fetching badges:', error);
    return res.status(500).json({ error: 'Failed to fetch badges' });
  }
});

/**
 * Get all achievements
 * GET /api/gamification/achievements
 */
router.get('/achievements', async (_req: AuthRequest, res: Response) => {
  try {
    const achievements = Object.entries(ACHIEVEMENTS).map(([id, achievement]) => ({
      id,
      name: achievement.name,
      description: achievement.description,
      xpReward: achievement.xpReward,
    }));
    return res.json(achievements);
  } catch (error) {
    logger.error('Error fetching achievements:', error);
    return res.status(500).json({ error: 'Failed to fetch achievements' });
  }
});

/**
 * Equip a title
 * POST /api/gamification/equip/title
 */
router.post('/equip/title', async (req: AuthRequest, res: Response) => {
  try {
    const { title } = req.body;

    if (!title) {
      return res.status(400).json({ error: 'Title is required' });
    }

    await gamificationService.equipTitle(req.userId!, title);
    return res.json({ success: true, message: 'Title equipped!' });
  } catch (error) {
    logger.error('Error equipping title:', error);
    if (error instanceof Error && error.message === 'Title not unlocked') {
      return res.status(403).json({ error: 'You have not unlocked this title yet' });
    }
    return res.status(500).json({ error: 'Failed to equip title' });
  }
});

/**
 * Equip a badge
 * POST /api/gamification/equip/badge
 */
router.post('/equip/badge', async (req: AuthRequest, res: Response) => {
  try {
    const { badgeId } = req.body;

    if (!badgeId) {
      return res.status(400).json({ error: 'Badge ID is required' });
    }

    await gamificationService.equipBadge(req.userId!, badgeId);
    return res.json({ success: true, message: 'Badge equipped!' });
  } catch (error) {
    logger.error('Error equipping badge:', error);
    if (error instanceof Error && error.message === 'Badge not unlocked') {
      return res.status(403).json({ error: 'You have not unlocked this badge yet' });
    }
    return res.status(500).json({ error: 'Failed to equip badge' });
  }
});

/**
 * Get user's rank in leaderboard
 * GET /api/gamification/rank
 */
router.get('/rank', async (req: AuthRequest, res: Response) => {
  try {
    const stats = await gamificationService.getOrCreateStats(req.userId!);

    // Count users with more XP
    const { UserStats } = await import('../models/UserStats');
    const rank = await UserStats.countDocuments({ xp: { $gt: stats.xp } }) + 1;

    return res.json({
      rank,
      xp: stats.xp,
      level: stats.level,
      title: stats.equippedTitle,
    });
  } catch (error) {
    logger.error('Error fetching rank:', error);
    return res.status(500).json({ error: 'Failed to fetch rank' });
  }
});

export default router;

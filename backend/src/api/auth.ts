import { Router, Response } from 'express';
import { authService } from '../services/auth.service';
import { emailService } from '../services/email.service';
import { authenticateToken, AuthRequest } from '../middleware/auth';
import { validate, schemas } from '../middleware/validation';
import { logger } from '../utils/logger';

const router = Router();

/**
 * POST /api/auth/login
 * Login with email and password
 */
router.post('/login', validate(schemas.login), async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!password) {
      // If no password provided, send magic link
      const token = await authService.requestMagicLink(email);
      await emailService.sendMagicLink(email, token);

      res.json({
        success: true,
        message: 'Magic link sent to your email',
        requiresPassword: false,
      });
      return;
    }

    const { user, token } = await authService.login(email, password);

    res.json({
      success: true,
      data: { user, token },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/auth/magic-link
 * Request magic link
 */
router.post('/magic-link', validate(schemas.magicLink), async (req, res, next) => {
  try {
    const { email } = req.body;

    const token = await authService.requestMagicLink(email);
    await emailService.sendMagicLink(email, token);

    res.json({
      success: true,
      message: 'Magic link sent to your email',
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/auth/verify/:token
 * Verify magic link token
 */
router.get('/verify/:token', async (req, res, next) => {
  try {
    const { token } = req.params;

    const { user, token: jwtToken } = await authService.verifyMagicLink(token);

    res.json({
      success: true,
      data: { user, token: jwtToken },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/auth/set-password
 * Set password for current user
 */
router.post('/set-password', authenticateToken, async (req: AuthRequest, res: Response, next) => {
  try {
    const { password } = req.body;

    if (!password || password.length < 6) {
      res.status(400).json({
        success: false,
        error: 'Password must be at least 6 characters',
      });
      return;
    }

    await authService.setPassword(req.userId!, password);

    res.json({
      success: true,
      message: 'Password set successfully',
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/auth/me
 * Get current user
 */
router.get('/me', authenticateToken, async (req: AuthRequest, res: Response, next) => {
  try {
    const user = await authService.getUserById(req.userId!);

    res.json({
      success: true,
      data: user,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * PUT /api/auth/profile
 * Update user profile
 */
router.put('/profile', authenticateToken, async (req: AuthRequest, res: Response, next) => {
  try {
    const { name, avatar } = req.body;

    const user = await authService.updateProfile(req.userId!, { name, avatar });

    res.json({
      success: true,
      data: user,
    });
  } catch (error) {
    next(error);
  }
});

export default router;

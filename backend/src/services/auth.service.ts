import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { User, IUser } from '../models/User';
import { redisClient } from '../config/redis';
import { UnauthorizedError, BadRequestError, ConflictError } from '../middleware/errorHandler';
import { logger } from '../utils/logger';
import { env } from '../config/env';
import { emailService } from './email.service';
import { inviteService } from './invite.service';

const JWT_SECRET = env.JWT_SECRET;
const MAGIC_LINK_EXPIRY = env.MAGIC_LINK_EXPIRY;
const SESSION_EXPIRY = env.SESSION_EXPIRY;

export class AuthService {
  /**
   * Sign up with email, name, and password
   */
  async signup(email: string, name: string, password: string): Promise<{ user: IUser; token: string }> {
    const normalizedEmail = email.toLowerCase();

    // Check if user already exists
    const existingUser = await User.findOne({ email: normalizedEmail });

    if (existingUser) {
      throw new ConflictError('User with this email already exists');
    }

    if (password.length < 6) {
      throw new BadRequestError('Password must be at least 6 characters');
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 12);

    // Create new user
    const user = await User.create({
      email: normalizedEmail,
      name,
      passwordHash,
    });

    logger.info(`New user signed up: ${user._id}`);

    // Process pending invites for this email (don't block signup if it fails)
    inviteService.processSignupInvites(user._id.toString(), normalizedEmail).then((count) => {
      if (count > 0) {
        logger.info(`Processed ${count} pending invites for new user ${user._id}`);
      }
    }).catch((error) => {
      logger.error('Failed to process pending invites:', error);
    });

    // Send welcome email (don't block signup if it fails)
    emailService.sendWelcomeEmail(user.email, user.name).catch((error) => {
      logger.error('Failed to send welcome email:', error);
      // Don't throw - we don't want to fail signup if email fails
    });

    // Generate JWT token
    const token = this.generateToken(user._id.toString());

    return { user, token };
  }

  /**
   * Login with email and password
   */
  async login(email: string, password: string): Promise<{ user: IUser; token: string }> {
    const user = await User.findOne({ email: email.toLowerCase() });

    if (!user) {
      throw new UnauthorizedError('Invalid email or password');
    }

    if (!user.passwordHash) {
      throw new BadRequestError('Please use magic link login or set a password first');
    }

    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);

    if (!isPasswordValid) {
      throw new UnauthorizedError('Invalid email or password');
    }

    // Update last active
    user.lastActive = new Date();
    await user.save();

    // Generate JWT token
    const token = this.generateToken(user._id.toString());

    return { user, token };
  }

  /**
   * Request magic link
   */
  async requestMagicLink(email: string): Promise<string> {
    const normalizedEmail = email.toLowerCase();

    // Find or create user
    let user = await User.findOne({ email: normalizedEmail });
    let isNewUser = false;

    if (!user) {
      // Create new user with email as name (can be updated later)
      user = await User.create({
        email: normalizedEmail,
        name: normalizedEmail.split('@')[0],
      });
      logger.info(`New user created: ${user._id}`);
      isNewUser = true;
    }

    // Generate magic link token
    const magicToken = uuidv4();

    // Store token in Redis with user ID
    await redisClient.setEx(
      `magic:${magicToken}`,
      MAGIC_LINK_EXPIRY,
      user._id.toString()
    );

    logger.info(`Magic link token generated for user: ${user._id}`);

    // Send welcome email for new users (don't block if it fails)
    if (isNewUser) {
      emailService.sendWelcomeEmail(user.email, user.name).catch((error) => {
        logger.error('Failed to send welcome email:', error);
      });
    }

    return magicToken;
  }

  /**
   * Verify magic link token
   */
  async verifyMagicLink(token: string): Promise<{ user: IUser; token: string }> {
    const userId = await redisClient.get(`magic:${token}`);

    if (!userId) {
      throw new UnauthorizedError('Invalid or expired magic link');
    }

    const user = await User.findById(userId);

    if (!user) {
      throw new UnauthorizedError('User not found');
    }

    // Delete the magic token (one-time use)
    await redisClient.del(`magic:${token}`);

    // Update last active
    user.lastActive = new Date();
    await user.save();

    // Generate JWT token
    const jwtToken = this.generateToken(user._id.toString());

    logger.info(`Magic link verified for user: ${user._id}`);

    return { user, token: jwtToken };
  }

  /**
   * Set password for user (for subsequent logins)
   */
  async setPassword(userId: string, password: string): Promise<void> {
    if (password.length < 6) {
      throw new BadRequestError('Password must be at least 6 characters');
    }

    const passwordHash = await bcrypt.hash(password, 12);

    await User.findByIdAndUpdate(userId, { passwordHash });

    logger.info(`Password set for user: ${userId}`);
  }

  /**
   * Update user profile
   */
  async updateProfile(
    userId: string,
    updates: { name?: string; avatar?: string; upiId?: string }
  ): Promise<IUser> {
    const user = await User.findByIdAndUpdate(
      userId,
      { $set: updates },
      { new: true, runValidators: true }
    );

    if (!user) {
      throw new UnauthorizedError('User not found');
    }

    return user;
  }

  /**
   * Generate JWT token
   */
  private generateToken(userId: string): string {
    return jwt.sign({ userId }, JWT_SECRET, {
      expiresIn: `${SESSION_EXPIRY}s`,
    });
  }

  /**
   * Verify JWT token
   */
  verifyToken(token: string): { userId: string } {
    try {
      return jwt.verify(token, JWT_SECRET) as { userId: string };
    } catch (error) {
      throw new UnauthorizedError('Invalid or expired token');
    }
  }

  /**
   * Get user by ID
   */
  async getUserById(userId: string): Promise<IUser> {
    const user = await User.findById(userId);

    if (!user) {
      throw new UnauthorizedError('User not found');
    }

    return user;
  }
}

export const authService = new AuthService();

import { UserStats, IUserStats } from '../models/UserStats';
import { logger } from '../utils/logger';

// XP rewards for different actions
const XP_REWARDS = {
  ADD_EXPENSE: 10,
  SETTLE_DEBT: 25,
  RECEIVE_SETTLEMENT: 5,
  CREATE_GROUP: 20,
  JOIN_GROUP: 10,
  INVITE_FRIEND: 30,
  FRIEND_ACCEPTED: 15,
  FIRST_EXPENSE: 50,
  SETTLE_ON_TIME: 10, // Bonus
  SETTLE_SAME_DAY: 20, // Bonus
  STREAK_BONUS: 5, // Per day of streak
};

// Level thresholds - exponential curve
const calculateLevelFromXP = (xp: number): number => {
  // Level = floor(sqrt(xp / 100)) + 1
  // Level 1: 0 XP, Level 2: 100 XP, Level 3: 400 XP, Level 4: 900 XP, etc.
  return Math.floor(Math.sqrt(xp / 100)) + 1;
};

const calculateXPForLevel = (level: number): number => {
  return Math.pow(level - 1, 2) * 100;
};

// Fun titles based on level
const TITLES: { [key: number]: string } = {
  1: 'Newbie Splitter',
  2: 'Penny Counter',
  3: 'Bill Buddy',
  4: 'Split Apprentice',
  5: 'Fair Sharer',
  6: 'Money Mediator',
  7: 'Debt Detective',
  8: 'Balance Keeper',
  9: 'Settlement Sage',
  10: 'Split Samurai',
  15: 'Money Maestro',
  20: 'Legendary Ledger',
  25: 'The Equalizer',
  30: 'Split Sovereign',
  40: 'Mythic Mathematician',
  50: 'Divine Divider',
};

// All available badges with fun descriptions
export const BADGES = {
  // Starter badges
  newcomer: {
    id: 'newcomer',
    name: 'Fresh Meat',
    description: 'Welcome to the split side!',
    icon: '🐣',
    rarity: 'common',
  },
  first_blood: {
    id: 'first_blood',
    name: 'First Blood',
    description: 'Added your first expense',
    icon: '🩸',
    rarity: 'common',
  },

  // Settlement badges
  quick_draw: {
    id: 'quick_draw',
    name: 'Quick Draw',
    description: 'Settled a debt within 1 hour',
    icon: '⚡',
    rarity: 'rare',
  },
  speed_demon: {
    id: 'speed_demon',
    name: 'Speed Demon',
    description: 'Settled within 10 minutes',
    icon: '👹',
    rarity: 'epic',
  },
  on_time_hero: {
    id: 'on_time_hero',
    name: 'On-Time Hero',
    description: 'Settled 10 debts on time',
    icon: '🦸',
    rarity: 'rare',
  },

  // Streak badges
  streak_starter: {
    id: 'streak_starter',
    name: 'Streak Starter',
    description: '3-day settle streak',
    icon: '🔥',
    rarity: 'common',
  },
  on_fire: {
    id: 'on_fire',
    name: 'On Fire',
    description: '7-day settle streak',
    icon: '🔥🔥',
    rarity: 'rare',
  },
  unstoppable: {
    id: 'unstoppable',
    name: 'Unstoppable',
    description: '30-day settle streak',
    icon: '💥',
    rarity: 'legendary',
  },

  // Amount badges
  big_spender: {
    id: 'big_spender',
    name: 'Big Spender',
    description: 'Split a bill over ₹10,000',
    icon: '💸',
    rarity: 'rare',
  },
  whale: {
    id: 'whale',
    name: 'Whale',
    description: 'Split a bill over ₹50,000',
    icon: '🐋',
    rarity: 'epic',
  },
  penny_pincher: {
    id: 'penny_pincher',
    name: 'Penny Pincher',
    description: 'Split a bill under ₹10',
    icon: '🪙',
    rarity: 'rare',
  },

  // Social badges
  social_butterfly: {
    id: 'social_butterfly',
    name: 'Social Butterfly',
    description: 'Have 10 friends',
    icon: '🦋',
    rarity: 'rare',
  },
  influencer: {
    id: 'influencer',
    name: 'Influencer',
    description: 'Invited 5 friends who joined',
    icon: '⭐',
    rarity: 'epic',
  },
  party_starter: {
    id: 'party_starter',
    name: 'Party Starter',
    description: 'Created 5 groups',
    icon: '🎉',
    rarity: 'rare',
  },

  // Volume badges
  centurion: {
    id: 'centurion',
    name: 'Centurion',
    description: 'Added 100 expenses',
    icon: '💯',
    rarity: 'epic',
  },
  millionaire: {
    id: 'millionaire',
    name: 'Millionaire',
    description: 'Split over ₹10,00,000 total',
    icon: '🤑',
    rarity: 'legendary',
  },

  // Fun/Easter egg badges
  night_owl: {
    id: 'night_owl',
    name: 'Night Owl',
    description: 'Settled a debt at 3 AM',
    icon: '🦉',
    rarity: 'rare',
  },
  early_bird: {
    id: 'early_bird',
    name: 'Early Bird',
    description: 'Settled a debt at 5 AM',
    icon: '🐦',
    rarity: 'rare',
  },
  weekend_warrior: {
    id: 'weekend_warrior',
    name: 'Weekend Warrior',
    description: 'Settled debts on 10 weekends',
    icon: '⚔️',
    rarity: 'rare',
  },
  perfectionist: {
    id: 'perfectionist',
    name: 'Perfectionist',
    description: 'Split a bill to exact paise',
    icon: '🎯',
    rarity: 'epic',
  },

  // Category badges
  foodie: {
    id: 'foodie',
    name: 'Foodie',
    description: 'Split 50 restaurant bills',
    icon: '🍕',
    rarity: 'rare',
  },
  globetrotter: {
    id: 'globetrotter',
    name: 'Globetrotter',
    description: 'Split 20 trip expenses',
    icon: '✈️',
    rarity: 'rare',
  },
  homebody: {
    id: 'homebody',
    name: 'Homebody',
    description: 'Split 12 rent payments',
    icon: '🏠',
    rarity: 'rare',
  },
};

// Achievements with requirements
export const ACHIEVEMENTS = {
  // Progression achievements
  level_5: {
    id: 'level_5',
    name: 'Getting Started',
    description: 'Reach level 5',
    xpReward: 100,
    requirement: (stats: IUserStats) => stats.level >= 5,
  },
  level_10: {
    id: 'level_10',
    name: 'Making Progress',
    description: 'Reach level 10',
    xpReward: 250,
    requirement: (stats: IUserStats) => stats.level >= 10,
  },
  level_25: {
    id: 'level_25',
    name: 'Split Master',
    description: 'Reach level 25',
    xpReward: 500,
    requirement: (stats: IUserStats) => stats.level >= 25,
  },

  // Expense achievements
  first_expense: {
    id: 'first_expense',
    name: 'Baby Steps',
    description: 'Add your first expense',
    xpReward: 50,
    requirement: (stats: IUserStats) => stats.totalExpensesAdded >= 1,
  },
  expenses_10: {
    id: 'expenses_10',
    name: 'Getting the Hang of It',
    description: 'Add 10 expenses',
    xpReward: 100,
    requirement: (stats: IUserStats) => stats.totalExpensesAdded >= 10,
  },
  expenses_50: {
    id: 'expenses_50',
    name: 'Expense Expert',
    description: 'Add 50 expenses',
    xpReward: 250,
    requirement: (stats: IUserStats) => stats.totalExpensesAdded >= 50,
  },
  expenses_100: {
    id: 'expenses_100',
    name: 'Century Club',
    description: 'Add 100 expenses',
    xpReward: 500,
    requirement: (stats: IUserStats) => stats.totalExpensesAdded >= 100,
  },

  // Settlement achievements
  first_settle: {
    id: 'first_settle',
    name: 'Debt Free',
    description: 'Make your first settlement',
    xpReward: 50,
    requirement: (stats: IUserStats) => stats.totalSettlementsMade >= 1,
  },
  settle_10: {
    id: 'settle_10',
    name: 'Reliable Payer',
    description: 'Make 10 settlements',
    xpReward: 150,
    requirement: (stats: IUserStats) => stats.totalSettlementsMade >= 10,
  },
  settle_50: {
    id: 'settle_50',
    name: 'Settlement King',
    description: 'Make 50 settlements',
    xpReward: 400,
    requirement: (stats: IUserStats) => stats.totalSettlementsMade >= 50,
  },

  // Streak achievements
  streak_7: {
    id: 'streak_7',
    name: 'Week Warrior',
    description: 'Maintain a 7-day settle streak',
    xpReward: 200,
    requirement: (stats: IUserStats) => stats.longestSettleStreak >= 7,
  },
  streak_30: {
    id: 'streak_30',
    name: 'Month of Discipline',
    description: 'Maintain a 30-day settle streak',
    xpReward: 1000,
    requirement: (stats: IUserStats) => stats.longestSettleStreak >= 30,
  },

  // Social achievements
  friends_5: {
    id: 'friends_5',
    name: 'Squad Goals',
    description: 'Invite 5 friends',
    xpReward: 150,
    requirement: (stats: IUserStats) => stats.friendsInvited >= 5,
  },
  groups_3: {
    id: 'groups_3',
    name: 'Community Builder',
    description: 'Create 3 groups',
    xpReward: 100,
    requirement: (stats: IUserStats) => stats.groupsCreated >= 3,
  },

  // Amount achievements
  split_10k: {
    id: 'split_10k',
    name: 'Five Figures',
    description: 'Split ₹10,000 total',
    xpReward: 100,
    requirement: (stats: IUserStats) => stats.totalAmountSplit >= 10000,
  },
  split_100k: {
    id: 'split_100k',
    name: 'Six Figures',
    description: 'Split ₹1,00,000 total',
    xpReward: 500,
    requirement: (stats: IUserStats) => stats.totalAmountSplit >= 100000,
  },
  split_1m: {
    id: 'split_1m',
    name: 'Seven Figures',
    description: 'Split ₹10,00,000 total',
    xpReward: 2000,
    requirement: (stats: IUserStats) => stats.totalAmountSplit >= 1000000,
  },
};

class GamificationService {
  /**
   * Get or create user stats
   */
  async getOrCreateStats(userId: string): Promise<IUserStats> {
    let stats = await UserStats.findOne({ userId });

    if (!stats) {
      stats = await UserStats.create({ userId });
      logger.info(`Created new stats for user ${userId}`);
    }

    return stats;
  }

  /**
   * Award XP and check for level up
   */
  async awardXP(userId: string, amount: number, reason: string): Promise<{
    newXP: number;
    newLevel: number;
    leveledUp: boolean;
    newTitle?: string;
  }> {
    const stats = await this.getOrCreateStats(userId);
    const oldLevel = stats.level;

    stats.xp += amount;
    stats.level = calculateLevelFromXP(stats.xp);

    const leveledUp = stats.level > oldLevel;
    let newTitle: string | undefined;

    if (leveledUp) {
      // Check for new title
      const availableTitles = Object.keys(TITLES)
        .map(Number)
        .filter(lvl => lvl <= stats.level)
        .sort((a, b) => b - a);

      if (availableTitles.length > 0) {
        const highestTitle = TITLES[availableTitles[0]];
        if (highestTitle !== stats.equippedTitle) {
          newTitle = highestTitle;
          // Auto-equip new highest title
          stats.equippedTitle = highestTitle;
        }
      }

      logger.info(`User ${userId} leveled up to ${stats.level}! Reason: ${reason}`);
    }

    await stats.save();

    return {
      newXP: stats.xp,
      newLevel: stats.level,
      leveledUp,
      newTitle,
    };
  }

  /**
   * Track expense added
   */
  async trackExpenseAdded(userId: string, amount: number, category?: string): Promise<void> {
    const stats = await this.getOrCreateStats(userId);

    stats.totalExpensesAdded += 1;
    stats.totalAmountSplit += amount;

    // Track largest/smallest
    if (amount > stats.largestExpenseAdded) {
      stats.largestExpenseAdded = amount;
    }
    if (amount < stats.smallestExpenseAdded) {
      stats.smallestExpenseAdded = amount;
    }

    // Track categories
    if (category) {
      const lowerCategory = category.toLowerCase();
      if (lowerCategory.includes('food') || lowerCategory.includes('restaurant') || lowerCategory.includes('dinner')) {
        stats.splitBillsAtRestaurants += 1;
      } else if (lowerCategory.includes('trip') || lowerCategory.includes('travel') || lowerCategory.includes('hotel')) {
        stats.splitBillsForTrips += 1;
      } else if (lowerCategory.includes('rent') || lowerCategory.includes('utilities')) {
        stats.splitBillsForRent += 1;
      }
    }

    await stats.save();

    // Award XP
    let xp = XP_REWARDS.ADD_EXPENSE;
    if (stats.totalExpensesAdded === 1) {
      xp += XP_REWARDS.FIRST_EXPENSE;
    }

    await this.awardXP(userId, xp, 'expense_added');

    // Check achievements
    await this.checkAchievements(userId);

    // Check badges
    await this.checkBadges(userId);
  }

  /**
   * Track settlement made
   */
  async trackSettlementMade(
    userId: string,
    amount: number,
    createdAt: Date = new Date()
  ): Promise<void> {
    const stats = await this.getOrCreateStats(userId);
    const now = new Date();

    stats.totalSettlementsMade += 1;
    stats.totalAmountSettled += amount;

    // Calculate settlement time in hours
    const settlementTime = (now.getTime() - createdAt.getTime()) / (1000 * 60 * 60);

    // Update fastest settlement
    if (settlementTime < stats.fastestSettlement) {
      stats.fastestSettlement = settlementTime;
    }

    // Update average
    const totalSettlements = stats.totalSettlementsMade;
    stats.averageSettlementTime =
      (stats.averageSettlementTime * (totalSettlements - 1) + settlementTime) / totalSettlements;

    // Track on-time vs late (48 hours threshold)
    if (settlementTime <= 48) {
      stats.onTimeSettlements += 1;
    } else {
      stats.lateSettlements += 1;
    }

    // Update streak
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (stats.lastSettleDate) {
      const lastSettle = new Date(stats.lastSettleDate);
      lastSettle.setHours(0, 0, 0, 0);

      const daysDiff = Math.floor((today.getTime() - lastSettle.getTime()) / (1000 * 60 * 60 * 24));

      if (daysDiff === 1) {
        // Consecutive day
        stats.currentSettleStreak += 1;
      } else if (daysDiff > 1) {
        // Streak broken
        stats.currentSettleStreak = 1;
      }
      // daysDiff === 0 means same day, don't change streak
    } else {
      stats.currentSettleStreak = 1;
    }

    stats.lastSettleDate = now;

    if (stats.currentSettleStreak > stats.longestSettleStreak) {
      stats.longestSettleStreak = stats.currentSettleStreak;
    }

    await stats.save();

    // Calculate XP with bonuses
    let xp = XP_REWARDS.SETTLE_DEBT;

    if (settlementTime <= 24) {
      xp += XP_REWARDS.SETTLE_ON_TIME;
    }
    if (settlementTime <= 1) {
      xp += XP_REWARDS.SETTLE_SAME_DAY;
    }

    // Streak bonus
    xp += stats.currentSettleStreak * XP_REWARDS.STREAK_BONUS;

    await this.awardXP(userId, xp, 'settlement_made');

    // Check achievements and badges
    await this.checkAchievements(userId);
    await this.checkBadges(userId);
  }

  /**
   * Track settlement received
   */
  async trackSettlementReceived(userId: string, amount: number): Promise<void> {
    const stats = await this.getOrCreateStats(userId);

    stats.totalSettlementsReceived += 1;
    stats.totalAmountReceived += amount;

    await stats.save();
    await this.awardXP(userId, XP_REWARDS.RECEIVE_SETTLEMENT, 'settlement_received');
  }

  /**
   * Track group created
   */
  async trackGroupCreated(userId: string): Promise<void> {
    const stats = await this.getOrCreateStats(userId);
    stats.groupsCreated += 1;
    await stats.save();

    await this.awardXP(userId, XP_REWARDS.CREATE_GROUP, 'group_created');
    await this.checkAchievements(userId);
    await this.checkBadges(userId);
  }

  /**
   * Track group joined
   */
  async trackGroupJoined(userId: string): Promise<void> {
    const stats = await this.getOrCreateStats(userId);
    stats.groupsJoined += 1;
    await stats.save();

    await this.awardXP(userId, XP_REWARDS.JOIN_GROUP, 'group_joined');
  }

  /**
   * Track friend invited
   */
  async trackFriendInvited(userId: string): Promise<void> {
    const stats = await this.getOrCreateStats(userId);
    stats.friendsInvited += 1;
    await stats.save();

    await this.awardXP(userId, XP_REWARDS.INVITE_FRIEND, 'friend_invited');
    await this.checkAchievements(userId);
    await this.checkBadges(userId);
  }

  /**
   * Track friend request accepted
   */
  async trackFriendAccepted(userId: string): Promise<void> {
    await this.awardXP(userId, XP_REWARDS.FRIEND_ACCEPTED, 'friend_accepted');
  }

  /**
   * Check and unlock achievements
   */
  async checkAchievements(userId: string): Promise<string[]> {
    const stats = await this.getOrCreateStats(userId);
    const newlyUnlocked: string[] = [];

    for (const [id, achievement] of Object.entries(ACHIEVEMENTS)) {
      if (!stats.unlockedAchievements.includes(id) && achievement.requirement(stats)) {
        stats.unlockedAchievements.push(id);
        newlyUnlocked.push(id);

        // Award XP for achievement
        stats.xp += achievement.xpReward;
        stats.level = calculateLevelFromXP(stats.xp);

        logger.info(`User ${userId} unlocked achievement: ${achievement.name}`);
      }
    }

    if (newlyUnlocked.length > 0) {
      await stats.save();
    }

    return newlyUnlocked;
  }

  /**
   * Check and unlock badges
   */
  async checkBadges(userId: string): Promise<string[]> {
    const stats = await this.getOrCreateStats(userId);
    const newlyUnlocked: string[] = [];

    // Check various badge conditions
    const badgeChecks: { [key: string]: boolean } = {
      first_blood: stats.totalExpensesAdded >= 1,
      quick_draw: stats.fastestSettlement <= 1,
      speed_demon: stats.fastestSettlement <= (10 / 60), // 10 minutes
      on_time_hero: stats.onTimeSettlements >= 10,
      streak_starter: stats.longestSettleStreak >= 3,
      on_fire: stats.longestSettleStreak >= 7,
      unstoppable: stats.longestSettleStreak >= 30,
      big_spender: stats.largestExpenseAdded >= 10000,
      whale: stats.largestExpenseAdded >= 50000,
      penny_pincher: stats.smallestExpenseAdded <= 10 && stats.smallestExpenseAdded > 0,
      party_starter: stats.groupsCreated >= 5,
      centurion: stats.totalExpensesAdded >= 100,
      millionaire: stats.totalAmountSplit >= 1000000,
      foodie: stats.splitBillsAtRestaurants >= 50,
      globetrotter: stats.splitBillsForTrips >= 20,
      homebody: stats.splitBillsForRent >= 12,
    };

    for (const [badgeId, condition] of Object.entries(badgeChecks)) {
      if (condition && !stats.unlockedAchievements.includes(badgeId)) {
        stats.unlockedAchievements.push(badgeId);
        newlyUnlocked.push(badgeId);
        logger.info(`User ${userId} unlocked badge: ${BADGES[badgeId as keyof typeof BADGES]?.name}`);
      }
    }

    if (newlyUnlocked.length > 0) {
      await stats.save();
    }

    return newlyUnlocked;
  }

  /**
   * Get user's full gamification profile
   */
  async getProfile(userId: string): Promise<{
    stats: IUserStats;
    currentTitle: string;
    nextLevel: number;
    xpForNextLevel: number;
    xpProgress: number;
    availableTitles: string[];
    unlockedBadges: typeof BADGES[keyof typeof BADGES][];
    achievements: { id: string; name: string; description: string; unlocked: boolean }[];
  }> {
    const stats = await this.getOrCreateStats(userId);

    const nextLevel = stats.level + 1;
    const currentLevelXP = calculateXPForLevel(stats.level);
    const nextLevelXP = calculateXPForLevel(nextLevel);
    const xpProgress = ((stats.xp - currentLevelXP) / (nextLevelXP - currentLevelXP)) * 100;

    // Get available titles
    const availableTitles = Object.entries(TITLES)
      .filter(([lvl]) => Number(lvl) <= stats.level)
      .map(([, title]) => title);

    // Get unlocked badges
    const unlockedBadges = stats.unlockedAchievements
      .filter(id => BADGES[id as keyof typeof BADGES])
      .map(id => BADGES[id as keyof typeof BADGES]);

    // Get achievements with unlock status
    const achievements = Object.entries(ACHIEVEMENTS).map(([id, achievement]) => ({
      id,
      name: achievement.name,
      description: achievement.description,
      unlocked: stats.unlockedAchievements.includes(id),
    }));

    return {
      stats,
      currentTitle: stats.equippedTitle,
      nextLevel,
      xpForNextLevel: nextLevelXP,
      xpProgress,
      availableTitles,
      unlockedBadges,
      achievements,
    };
  }

  /**
   * Get leaderboard
   */
  async getLeaderboard(type: 'xp' | 'settlements' | 'streaks' = 'xp', limit: number = 10): Promise<any[]> {
    let sortField: string;

    switch (type) {
      case 'settlements':
        sortField = 'totalSettlementsMade';
        break;
      case 'streaks':
        sortField = 'longestSettleStreak';
        break;
      default:
        sortField = 'xp';
    }

    const leaderboard = await UserStats.find()
      .sort({ [sortField]: -1 })
      .limit(limit)
      .populate('userId', 'name avatar email');

    return leaderboard.map((entry, index) => ({
      rank: index + 1,
      user: entry.userId,
      xp: entry.xp,
      level: entry.level,
      title: entry.equippedTitle,
      badge: entry.equippedBadge,
      value: entry[sortField as keyof IUserStats],
    }));
  }

  /**
   * Equip a title
   */
  async equipTitle(userId: string, title: string): Promise<void> {
    const stats = await this.getOrCreateStats(userId);

    // Check if user has unlocked this title
    const availableTitles = Object.entries(TITLES)
      .filter(([lvl]) => Number(lvl) <= stats.level)
      .map(([, t]) => t);

    if (!availableTitles.includes(title)) {
      throw new Error('Title not unlocked');
    }

    stats.equippedTitle = title;
    await stats.save();
  }

  /**
   * Equip a badge
   */
  async equipBadge(userId: string, badgeId: string): Promise<void> {
    const stats = await this.getOrCreateStats(userId);

    if (!stats.unlockedAchievements.includes(badgeId)) {
      throw new Error('Badge not unlocked');
    }

    stats.equippedBadge = badgeId;
    await stats.save();
  }
}

export const gamificationService = new GamificationService();
export { XP_REWARDS, TITLES };

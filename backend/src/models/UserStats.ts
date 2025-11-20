import mongoose, { Document, Schema, Types } from 'mongoose';

export interface IUserStats extends Document {
  _id: Types.ObjectId;
  userId: Types.ObjectId;

  // XP and Level
  xp: number;
  level: number;

  // Core Stats
  totalExpensesAdded: number;
  totalAmountSplit: number;
  totalSettlementsMade: number;
  totalSettlementsReceived: number;
  totalAmountSettled: number;
  totalAmountReceived: number;

  // Streaks
  currentSettleStreak: number;
  longestSettleStreak: number;
  lastSettleDate: Date | null;
  currentActiveStreak: number;
  longestActiveStreak: number;
  lastActiveDate: Date | null;

  // Social Stats
  friendsInvited: number;
  groupsCreated: number;
  groupsJoined: number;

  // Speed Stats
  fastestSettlement: number; // in hours
  averageSettlementTime: number; // in hours
  onTimeSettlements: number;
  lateSettlements: number;

  // Fun Stats
  splitBillsAtRestaurants: number;
  splitBillsForTrips: number;
  splitBillsForRent: number;
  largestExpenseAdded: number;
  smallestExpenseAdded: number;
  mostFrequentSplitPartner: Types.ObjectId | null;

  // Achievements unlocked (array of achievement IDs)
  unlockedAchievements: string[];

  // Equipped items
  equippedTitle: string;
  equippedBadge: string;

  createdAt: Date;
  updatedAt: Date;
}

const userStatsSchema = new Schema<IUserStats>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },

    // XP and Level
    xp: { type: Number, default: 0 },
    level: { type: Number, default: 1 },

    // Core Stats
    totalExpensesAdded: { type: Number, default: 0 },
    totalAmountSplit: { type: Number, default: 0 },
    totalSettlementsMade: { type: Number, default: 0 },
    totalSettlementsReceived: { type: Number, default: 0 },
    totalAmountSettled: { type: Number, default: 0 },
    totalAmountReceived: { type: Number, default: 0 },

    // Streaks
    currentSettleStreak: { type: Number, default: 0 },
    longestSettleStreak: { type: Number, default: 0 },
    lastSettleDate: { type: Date, default: null },
    currentActiveStreak: { type: Number, default: 0 },
    longestActiveStreak: { type: Number, default: 0 },
    lastActiveDate: { type: Date, default: null },

    // Social Stats
    friendsInvited: { type: Number, default: 0 },
    groupsCreated: { type: Number, default: 0 },
    groupsJoined: { type: Number, default: 0 },

    // Speed Stats
    fastestSettlement: { type: Number, default: Infinity },
    averageSettlementTime: { type: Number, default: 0 },
    onTimeSettlements: { type: Number, default: 0 },
    lateSettlements: { type: Number, default: 0 },

    // Fun Stats
    splitBillsAtRestaurants: { type: Number, default: 0 },
    splitBillsForTrips: { type: Number, default: 0 },
    splitBillsForRent: { type: Number, default: 0 },
    largestExpenseAdded: { type: Number, default: 0 },
    smallestExpenseAdded: { type: Number, default: Infinity },
    mostFrequentSplitPartner: { type: Schema.Types.ObjectId, ref: 'User', default: null },

    // Achievements
    unlockedAchievements: [{ type: String }],

    // Equipped items
    equippedTitle: { type: String, default: 'Newbie Splitter' },
    equippedBadge: { type: String, default: 'newcomer' },
  },
  {
    timestamps: true,
  }
);

// Index for quick lookups
userStatsSchema.index({ userId: 1 });
userStatsSchema.index({ xp: -1 }); // For leaderboards
userStatsSchema.index({ level: -1 });

export const UserStats = mongoose.model<IUserStats>('UserStats', userStatsSchema);

import mongoose, { Document, Schema, Types } from 'mongoose';

export interface IFriend extends Document {
  _id: Types.ObjectId;
  user1: Types.ObjectId; // First user in the friendship
  user2: Types.ObjectId; // Second user in the friendship
  createdAt: Date;
}

const friendSchema = new Schema<IFriend>(
  {
    user1: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    user2: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index to prevent duplicate friendships and enable efficient queries
friendSchema.index({ user1: 1, user2: 1 }, { unique: true });

// Helper method to check if two users are friends
friendSchema.statics.areFriends = async function(userId1: string, userId2: string): Promise<boolean> {
  const count = await this.countDocuments({
    $or: [
      { user1: userId1, user2: userId2 },
      { user1: userId2, user2: userId1 },
    ],
  });
  return count > 0;
};

// Helper method to get all friends for a user
friendSchema.statics.getFriendsForUser = async function(userId: string): Promise<IFriend[]> {
  return this.find({
    $or: [
      { user1: userId },
      { user2: userId },
    ],
  })
    .populate('user1', 'name email avatar')
    .populate('user2', 'name email avatar')
    .sort({ createdAt: -1 });
};

export const Friend = mongoose.model<IFriend>('Friend', friendSchema);

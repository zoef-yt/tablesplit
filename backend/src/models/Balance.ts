import mongoose, { Document, Schema, Types } from 'mongoose';

export interface IBalance extends Document {
  _id: Types.ObjectId;
  groupId: Types.ObjectId;
  userId: Types.ObjectId;
  balance: number; // positive = owed TO user, negative = user owes
  lastUpdated: Date;
}

const balanceSchema = new Schema<IBalance>(
  {
    groupId: {
      type: Schema.Types.ObjectId,
      ref: 'Group',
      required: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    balance: {
      type: Number,
      required: true,
      default: 0,
    },
    lastUpdated: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index for efficient lookups
balanceSchema.index({ groupId: 1, userId: 1 }, { unique: true });
balanceSchema.index({ groupId: 1 });

export const Balance = mongoose.model<IBalance>('Balance', balanceSchema);

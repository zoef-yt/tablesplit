import mongoose, { Document, Schema, Types } from 'mongoose';

export interface ISettlement extends Document {
  _id: Types.ObjectId;
  groupId: Types.ObjectId;
  fromUserId: Types.ObjectId; // Person who made the payment
  toUserId: Types.ObjectId;    // Person who received the payment
  amount: number;
  paymentMethod?: 'UPI' | 'Cash' | 'Bank Transfer' | 'Other'; // Optional
  notes?: string; // Optional notes
  settledAt: Date;
}

const settlementSchema = new Schema<ISettlement>(
  {
    groupId: {
      type: Schema.Types.ObjectId,
      ref: 'Group',
      required: true,
    },
    fromUserId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    toUserId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    paymentMethod: {
      type: String,
      enum: ['UPI', 'Cash', 'Bank Transfer', 'Other'],
      required: false,
    },
    notes: {
      type: String,
      required: false,
    },
    settledAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for efficient lookups
settlementSchema.index({ groupId: 1, settledAt: -1 });
settlementSchema.index({ fromUserId: 1 });
settlementSchema.index({ toUserId: 1 });

export const Settlement = mongoose.model<ISettlement>('Settlement', settlementSchema);

import mongoose, { Document, Schema, Types } from 'mongoose';

export interface IInvite extends Document {
  _id: Types.ObjectId;
  email: string;                    // Normalized email (lowercase, trimmed)
  invitedBy: Types.ObjectId;        // User who sent invite
  groupId: Types.ObjectId;          // Group the invite is for
  expenseId?: Types.ObjectId;       // Optional: specific expense
  tokenHash: string;                // Hashed token for email verification
  status: 'pending' | 'accepted' | 'expired' | 'cancelled';
  expiresAt: Date;                  // Token expiration (7 days)
  createdAt: Date;
  acceptedAt?: Date;
  acceptedBy?: Types.ObjectId;      // User who accepted (after signup)
}

const inviteSchema = new Schema<IInvite>(
  {
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    invitedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    groupId: {
      type: Schema.Types.ObjectId,
      ref: 'Group',
      required: true,
      index: true,
    },
    expenseId: {
      type: Schema.Types.ObjectId,
      ref: 'Expense',
    },
    tokenHash: {
      type: String,
      required: true,
      index: true,
    },
    status: {
      type: String,
      enum: ['pending', 'accepted', 'expired', 'cancelled'],
      default: 'pending',
      index: true,
    },
    expiresAt: {
      type: Date,
      required: true,
      index: true,
    },
    acceptedAt: {
      type: Date,
    },
    acceptedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  {
    timestamps: true,
  }
);

// Compound indexes for efficient lookups
inviteSchema.index({ email: 1, groupId: 1, status: 1 });
inviteSchema.index({ invitedBy: 1, status: 1 });
inviteSchema.index({ groupId: 1, status: 1 });

export const Invite = mongoose.model<IInvite>('Invite', inviteSchema);

import mongoose, { Document, Schema, Types } from 'mongoose';

export interface IFriendRequest extends Document {
  _id: Types.ObjectId;
  from: Types.ObjectId; // User who sent the request
  to: Types.ObjectId; // User who receives the request
  status: 'pending' | 'accepted' | 'declined';
  createdAt: Date;
  updatedAt: Date;
}

const friendRequestSchema = new Schema<IFriendRequest>(
  {
    from: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    to: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    status: {
      type: String,
      enum: ['pending', 'accepted', 'declined'],
      default: 'pending',
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index to prevent duplicate friend requests
friendRequestSchema.index({ from: 1, to: 1 }, { unique: true });

// Index for querying pending requests
friendRequestSchema.index({ to: 1, status: 1 });

export const FriendRequest = mongoose.model<IFriendRequest>('FriendRequest', friendRequestSchema);

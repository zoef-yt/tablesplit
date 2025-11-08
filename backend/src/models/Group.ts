import mongoose, { Document, Schema, Types } from 'mongoose';

interface IGroupMember {
  userId: Types.ObjectId;
  seatPosition: number;
  joinedAt: Date;
}

export interface IGroup extends Document {
  name: string;
  theme: 'poker' | 'classic' | 'minimal';
  members: IGroupMember[];
  currency: string;
  createdAt: Date;
}

const groupMemberSchema = new Schema<IGroupMember>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    seatPosition: {
      type: Number,
      required: true,
      min: 0,
      max: 7,
    },
    joinedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: false }
);

const groupSchema = new Schema<IGroup>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    theme: {
      type: String,
      enum: ['poker', 'classic', 'minimal'],
      default: 'poker',
    },
    members: [groupMemberSchema],
    currency: {
      type: String,
      default: 'USD',
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for faster queries
groupSchema.index({ 'members.userId': 1 });
groupSchema.index({ createdAt: -1 });

export const Group = mongoose.model<IGroup>('Group', groupSchema);

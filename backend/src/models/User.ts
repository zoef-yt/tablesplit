import mongoose, { Document, Schema } from 'mongoose';

export interface IUser extends Document {
  email: string;
  name: string;
  avatar?: string;
  passwordHash?: string;
  upiId?: string; // For Indian UPI payments (e.g., user@paytm, user@phonepe)
  createdAt: Date;
  lastActive: Date;
}

const userSchema = new Schema<IUser>(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    avatar: {
      type: String,
      required: false,
    },
    passwordHash: {
      type: String,
      required: false, // Optional for magic link users
    },
    upiId: {
      type: String,
      required: false,
      trim: true,
      lowercase: true,
      match: /^[\w.-]+@[\w.-]+$/, // Basic UPI ID validation (user@provider)
    },
    lastActive: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// Index for faster lookups
userSchema.index({ email: 1 });

export const User = mongoose.model<IUser>('User', userSchema);

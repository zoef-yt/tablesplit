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
      // UPI ID format: username@provider (e.g., john.doe@paytm, alice123@phonepe)
      // Username: 2-256 chars (alphanumeric, dots, hyphens)
      // Provider: 3-64 chars (letters only, starting with letter)
      match: /^[a-zA-Z0-9.-]{2,256}@[a-zA-Z][a-zA-Z]{2,64}$/,
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

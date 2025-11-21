import mongoose, { Document, Schema, Types } from 'mongoose';

interface IExpenseSplit {
  userId?: Types.ObjectId;          // Real user (optional if pending)
  pendingEmail?: string;            // Email for pending participant
  amount: number;
  percentage: number;
  status: 'active' | 'pending';     // pending = waiting for signup
}

export interface IExpense extends Document {
  _id: Types.ObjectId;
  groupId: Types.ObjectId;
  description: string;
  amount: number;
  paidBy: Types.ObjectId;
  splits: IExpenseSplit[];
  category?: string;
  date: Date;
  createdAt: Date;
}

const expenseSplitSchema = new Schema<IExpenseSplit>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: false,  // Optional if pending
    },
    pendingEmail: {
      type: String,
      lowercase: true,
      trim: true,
    },
    amount: {
      type: Number,
      required: true,
    },
    percentage: {
      type: Number,
      required: true,
    },
    status: {
      type: String,
      enum: ['active', 'pending'],
      default: 'active',
    },
  },
  { _id: false }
);

const expenseSchema = new Schema<IExpense>(
  {
    groupId: {
      type: Schema.Types.ObjectId,
      ref: 'Group',
      required: true,
      index: true,
    },
    description: {
      type: String,
      required: true,
      trim: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    paidBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    splits: [expenseSplitSchema],
    category: {
      type: String,
      required: false,
    },
    date: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for faster queries
expenseSchema.index({ groupId: 1, createdAt: -1 });
expenseSchema.index({ paidBy: 1 });
expenseSchema.index({ 'splits.userId': 1 });
expenseSchema.index({ 'splits.pendingEmail': 1 });

export const Expense = mongoose.model<IExpense>('Expense', expenseSchema);

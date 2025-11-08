import mongoose, { Document, Schema, Types } from 'mongoose';

interface IExpenseSplit {
  userId: Types.ObjectId;
  amount: number;
  percentage: number;
}

export interface IExpense extends Document {
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
      required: true,
    },
    amount: {
      type: Number,
      required: true,
    },
    percentage: {
      type: Number,
      required: true,
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

export const Expense = mongoose.model<IExpense>('Expense', expenseSchema);

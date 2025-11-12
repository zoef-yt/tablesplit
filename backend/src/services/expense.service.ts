import { Expense, IExpense } from '../models/Expense';
import { Balance } from '../models/Balance';
import { Group } from '../models/Group';
import { NotFoundError, ForbiddenError } from '../middleware/errorHandler';
import { logger } from '../utils/logger';
import mongoose from 'mongoose';

interface Settlement {
  from: string;
  to: string;
  amount: number;
}

export class ExpenseService {
  /**
   * Create expense with equal split
   */
  async createExpense(
    userId: string,
    groupId: string,
    description: string,
    amount: number,
    paidBy: string,
    selectedMembers: string[],
    category?: string
  ): Promise<{ expense: IExpense; updatedBalances: any[] }> {
    const group = await Group.findById(groupId);

    if (!group) {
      throw new NotFoundError('Group not found');
    }

    // Verify user is member of group
    const isMember = group.members.some((m) => m.userId.toString() === userId);
    if (!isMember) {
      throw new ForbiddenError('You are not a member of this group');
    }

    // Calculate equal splits
    const splits = this.equalSplit(amount, selectedMembers);

    // Create expense
    const expense = await Expense.create({
      groupId,
      description,
      amount,
      paidBy,
      splits,
      category,
      date: new Date(),
    });

    // Update balances atomically
    const updatedBalances = await this.updateBalances(groupId, paidBy, splits);

    logger.info(`Expense created: ${expense._id} in group ${groupId}`);

    return { expense, updatedBalances };
  }

  /**
   * Get expenses for a group
   */
  async getGroupExpenses(userId: string, groupId: string): Promise<IExpense[]> {
    const group = await Group.findById(groupId);

    if (!group) {
      throw new NotFoundError('Group not found');
    }

    // Verify user is member
    const isMember = group.members.some((m) => m.userId.toString() === userId);
    if (!isMember) {
      throw new ForbiddenError('You are not a member of this group');
    }

    const expenses = await Expense.find({ groupId })
      .populate('paidBy', 'name email avatar')
      .populate('splits.userId', 'name email avatar')
      .sort({ createdAt: -1 })
      .limit(100);

    return expenses;
  }

  /**
   * Get balances for a group
   */
  async getGroupBalances(userId: string, groupId: string) {
    const group = await Group.findById(groupId);

    if (!group) {
      throw new NotFoundError('Group not found');
    }

    // Verify user is member
    const isMember = group.members.some((m) => m.userId.toString() === userId);
    if (!isMember) {
      throw new ForbiddenError('You are not a member of this group');
    }

    const balances = await Balance.find({ groupId })
      .populate('userId', 'name email avatar')
      .sort({ balance: -1 });

    return balances;
  }

  /**
   * Calculate settlement (debt simplification)
   */
  async calculateSettlement(userId: string, groupId: string): Promise<Settlement[]> {
    const balances = await this.getGroupBalances(userId, groupId);

    return this.simplifyDebts(
      balances.map((b) => ({
        userId: b.userId.toString(),
        balance: b.balance,
      }))
    );
  }

  /**
   * Record settlement payment
   */
  async recordSettlement(
    userId: string,
    groupId: string,
    fromUserId: string,
    toUserId: string,
    amount: number
  ): Promise<any[]> {
    const group = await Group.findById(groupId);

    if (!group) {
      throw new NotFoundError('Group not found');
    }

    // Verify user is member
    const isMember = group.members.some((m) => m.userId.toString() === userId);
    if (!isMember) {
      throw new ForbiddenError('You are not a member of this group');
    }

    // Update balances
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      // Decrease balance for payer (from)
      await Balance.findOneAndUpdate(
        { groupId, userId: fromUserId },
        { $inc: { balance: amount }, lastUpdated: new Date() },
        { upsert: true, session }
      );

      // Increase balance for payee (to)
      await Balance.findOneAndUpdate(
        { groupId, userId: toUserId },
        { $inc: { balance: -amount }, lastUpdated: new Date() },
        { upsert: true, session }
      );

      await session.commitTransaction();

      logger.info(`Settlement recorded: ${fromUserId} paid ${toUserId} ${amount} in group ${groupId}`);

      // Return updated balances
      const updatedBalances = await this.getGroupBalances(userId, groupId);
      return updatedBalances;
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }

  /**
   * Equal split calculation
   */
  private equalSplit(
    amount: number,
    userIds: string[]
  ): Array<{ userId: string; amount: number; percentage: number }> {
    const perPerson = amount / userIds.length;
    const percentage = 100 / userIds.length;

    return userIds.map((userId) => ({
      userId,
      amount: perPerson,
      percentage,
    }));
  }

  /**
   * Update balances after expense creation
   */
  private async updateBalances(
    groupId: string,
    paidBy: string,
    splits: Array<{ userId: string; amount: number }>
  ) {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const updates = [];

      for (const split of splits) {
        if (split.userId === paidBy) {
          // Payer's balance increases by (total - their share)
          const netChange = splits.reduce((sum, s) => sum + s.amount, 0) - split.amount;
          updates.push(
            Balance.findOneAndUpdate(
              { groupId, userId: split.userId },
              { $inc: { balance: netChange }, lastUpdated: new Date() },
              { upsert: true, new: true, session }
            )
          );
        } else {
          // Others' balance decreases by their share
          updates.push(
            Balance.findOneAndUpdate(
              { groupId, userId: split.userId },
              { $inc: { balance: -split.amount }, lastUpdated: new Date() },
              { upsert: true, new: true, session }
            )
          );
        }
      }

      const results = await Promise.all(updates);

      await session.commitTransaction();
      return results;
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }

  /**
   * Debt simplification algorithm (Min Cash Flow)
   */
  private simplifyDebts(
    balances: Array<{ userId: string; balance: number }>
  ): Settlement[] {
    const creditors = balances.filter((b) => b.balance > 0.01);
    const debtors = balances.filter((b) => b.balance < -0.01);
    const transactions: Settlement[] = [];

    // Sort by amount (descending)
    creditors.sort((a, b) => b.balance - a.balance);
    debtors.sort((a, b) => a.balance - b.balance);

    let i = 0;
    let j = 0;

    while (i < creditors.length && j < debtors.length) {
      const creditor = creditors[i];
      const debtor = debtors[j];

      const amount = Math.min(creditor.balance, Math.abs(debtor.balance));

      transactions.push({
        from: debtor.userId,
        to: creditor.userId,
        amount: parseFloat(amount.toFixed(2)),
      });

      creditor.balance -= amount;
      debtor.balance += amount;

      if (creditor.balance < 0.01) i++;
      if (Math.abs(debtor.balance) < 0.01) j++;
    }

    return transactions;
  }
}

export const expenseService = new ExpenseService();

import { Expense, IExpense } from '../models/Expense';
import { Balance, IBalance } from '../models/Balance';
import { Settlement as SettlementModel, ISettlement } from '../models/Settlement';
import { Group } from '../models/Group';
import { NotFoundError, ForbiddenError } from '../middleware/errorHandler';
import { logger } from '../utils/logger';
import { Types } from 'mongoose';

interface CalculatedSettlement {
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
  ): Promise<{ expense: IExpense; updatedBalances: IBalance[] }> {
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

    // Populate expense with user information before returning
    await expense.populate('paidBy', 'name email avatar');
    await expense.populate('splits.userId', 'name email avatar');

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
  async calculateSettlement(userId: string, groupId: string): Promise<CalculatedSettlement[]> {
    const balances = await this.getGroupBalances(userId, groupId);

    return this.simplifyDebts(
      balances.map((b) => ({
        // Extract _id from populated userId or use string directly
        userId: typeof b.userId === 'object' && b.userId._id ? b.userId._id.toString() : b.userId.toString(),
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
    amount: number,
    paymentMethod?: 'UPI' | 'Cash' | 'Bank Transfer' | 'Other',
    notes?: string
  ): Promise<{ updatedBalances: IBalance[]; settlement: ISettlement }> {
    const group = await Group.findById(groupId);

    if (!group) {
      throw new NotFoundError('Group not found');
    }

    // Verify user is member
    const isMember = group.members.some((m) => m.userId.toString() === userId);
    if (!isMember) {
      throw new ForbiddenError('You are not a member of this group');
    }

    // Create settlement record
    const settlement = await SettlementModel.create({
      groupId,
      fromUserId,
      toUserId,
      amount,
      paymentMethod,
      notes,
      settledAt: new Date(),
    });

    // Populate user details
    await settlement.populate('fromUserId', 'name email avatar');
    await settlement.populate('toUserId', 'name email avatar');

    // Update balances
    // Decrease balance for payer (from)
    await Balance.findOneAndUpdate(
      { groupId, userId: fromUserId },
      { $inc: { balance: amount }, lastUpdated: new Date() },
      { upsert: true }
    );

    // Increase balance for payee (to)
    await Balance.findOneAndUpdate(
      { groupId, userId: toUserId },
      { $inc: { balance: -amount }, lastUpdated: new Date() },
      { upsert: true }
    );

    logger.info(`Settlement recorded: ${fromUserId} paid ${toUserId} ${amount} in group ${groupId} via ${paymentMethod || 'unknown method'}`);

    // Return updated balances and settlement
    const updatedBalances = await this.getGroupBalances(userId, groupId);
    return { updatedBalances, settlement };
  }

  /**
   * Get settlement history for a group
   */
  async getSettlementHistory(userId: string, groupId: string): Promise<ISettlement[]> {
    const group = await Group.findById(groupId);

    if (!group) {
      throw new NotFoundError('Group not found');
    }

    // Verify user is member
    const isMember = group.members.some((m) => m.userId.toString() === userId);
    if (!isMember) {
      throw new ForbiddenError('You are not a member of this group');
    }

    // Get all settlements for this group, sorted by most recent first
    const settlements = await SettlementModel.find({ groupId })
      .populate('fromUserId', 'name email avatar')
      .populate('toUserId', 'name email avatar')
      .sort({ settledAt: -1 });

    return settlements;
  }

  /**
   * Delete an expense
   */
  async deleteExpense(
    userId: string,
    expenseId: string
  ): Promise<{ deletedExpense: IExpense; updatedBalances: IBalance[] }> {
    const expense = await Expense.findById(expenseId);

    if (!expense) {
      throw new NotFoundError('Expense not found');
    }

    // Verify user is the one who paid (only they can delete)
    if (expense.paidBy.toString() !== userId) {
      throw new ForbiddenError('Only the person who paid can delete this expense');
    }

    const groupId = expense.groupId.toString();

    // Verify user is member of group
    const group = await Group.findById(groupId);
    if (!group) {
      throw new NotFoundError('Group not found');
    }

    const isMember = group.members.some((m) => m.userId.toString() === userId);
    if (!isMember) {
      throw new ForbiddenError('You are not a member of this group');
    }

    // Reverse the balance changes
    const splitsAsStrings = expense.splits.map(s => ({
      userId: s.userId.toString(),
      amount: s.amount
    }));
    await this.reverseBalances(groupId, expense.paidBy.toString(), splitsAsStrings);

    // Delete the expense
    await Expense.findByIdAndDelete(expenseId);

    logger.info(`Expense deleted: ${expenseId} from group ${groupId}`);

    // Return updated balances
    const updatedBalances = await this.getGroupBalances(userId, groupId);
    return { deletedExpense: expense, updatedBalances };
  }

  /**
   * Update an expense
   */
  async updateExpense(
    userId: string,
    expenseId: string,
    description?: string,
    amount?: number,
    category?: string,
    selectedMembers?: string[]
  ): Promise<{ expense: IExpense; updatedBalances: IBalance[] }> {
    const expense = await Expense.findById(expenseId);

    if (!expense) {
      throw new NotFoundError('Expense not found');
    }

    // Verify user is the one who paid (only they can edit)
    if (expense.paidBy.toString() !== userId) {
      throw new ForbiddenError('Only the person who paid can edit this expense');
    }

    const groupId = expense.groupId.toString();

    // Verify user is member of group
    const group = await Group.findById(groupId);
    if (!group) {
      throw new NotFoundError('Group not found');
    }

    const isMember = group.members.some((m) => m.userId.toString() === userId);
    if (!isMember) {
      throw new ForbiddenError('You are not a member of this group');
    }

    // Reverse old balance changes
    const oldSplitsAsStrings = expense.splits.map(s => ({
      userId: s.userId.toString(),
      amount: s.amount
    }));
    await this.reverseBalances(groupId, expense.paidBy.toString(), oldSplitsAsStrings);

    // Update expense fields
    if (description !== undefined) expense.description = description;
    if (category !== undefined) expense.category = category;

    // Recalculate splits if amount or members changed
    if (amount !== undefined || selectedMembers !== undefined) {
      const newAmount = amount !== undefined ? amount : expense.amount;
      const newMembers = selectedMembers !== undefined ? selectedMembers : expense.splits.map(s => s.userId.toString());

      expense.amount = newAmount;
      const newSplits = this.equalSplit(newAmount, newMembers);

      // Convert to ObjectId types for Mongoose
      expense.splits = newSplits.map(s => ({
        userId: new Types.ObjectId(s.userId),
        amount: s.amount,
        percentage: s.percentage
      }));
    }

    // Apply new balance changes
    const newSplitsAsStrings = expense.splits.map(s => ({
      userId: s.userId.toString(),
      amount: s.amount
    }));
    await this.updateBalances(groupId, expense.paidBy.toString(), newSplitsAsStrings);

    // Save expense
    await expense.save();

    // Populate expense with user information
    await expense.populate('paidBy', 'name email avatar');
    await expense.populate('splits.userId', 'name email avatar');

    logger.info(`Expense updated: ${expenseId} in group ${groupId}`);

    // Return updated balances
    const updatedBalances = await this.getGroupBalances(userId, groupId);
    return { expense, updatedBalances };
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
  ): Promise<IBalance[]> {
    const updates = [];

    for (const split of splits) {
      if (split.userId === paidBy) {
        // Payer's balance increases by (total - their share)
        const netChange = splits.reduce((sum, s) => sum + s.amount, 0) - split.amount;
        updates.push(
          Balance.findOneAndUpdate(
            { groupId, userId: split.userId },
            { $inc: { balance: netChange }, lastUpdated: new Date() },
            { upsert: true, new: true }
          )
        );
      } else {
        // Others' balance decreases by their share
        updates.push(
          Balance.findOneAndUpdate(
            { groupId, userId: split.userId },
            { $inc: { balance: -split.amount }, lastUpdated: new Date() },
            { upsert: true, new: true }
          )
        );
      }
    }

    const results = await Promise.all(updates);
    return results;
  }

  /**
   * Reverse balances (for expense deletion or before update)
   */
  private async reverseBalances(
    groupId: string,
    paidBy: string,
    splits: Array<{ userId: string; amount: number }>
  ): Promise<void> {
    const updates = [];

    for (const split of splits) {
      const userId = split.userId;

      if (userId === paidBy) {
        // Reverse payer's balance (subtract the net change)
        const netChange = splits.reduce((sum, s) => sum + s.amount, 0) - split.amount;
        updates.push(
          Balance.findOneAndUpdate(
            { groupId, userId },
            { $inc: { balance: -netChange }, lastUpdated: new Date() },
            { upsert: true }
          )
        );
      } else {
        // Reverse others' balance (add back their share)
        updates.push(
          Balance.findOneAndUpdate(
            { groupId, userId },
            { $inc: { balance: split.amount }, lastUpdated: new Date() },
            { upsert: true }
          )
        );
      }
    }

    await Promise.all(updates);
  }

  /**
   * Debt simplification algorithm (Min Cash Flow)
   */
  private simplifyDebts(
    balances: Array<{ userId: string; balance: number }>
  ): CalculatedSettlement[] {
    const creditors = balances.filter((b) => b.balance > 0.01);
    const debtors = balances.filter((b) => b.balance < -0.01);
    const transactions: CalculatedSettlement[] = [];

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

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

    logger.info(`Calculating settlements for group ${groupId}`);
    logger.info(`Balances: ${JSON.stringify(balances.map(b => ({
      userId: typeof b.userId === 'object' && b.userId._id ? b.userId._id.toString() : b.userId.toString(),
      balance: b.balance
    })))}`);

    const settlements = this.simplifyDebts(
      balances.map((b) => ({
        // Extract _id from populated userId or use string directly
        userId: typeof b.userId === 'object' && b.userId._id ? b.userId._id.toString() : b.userId.toString(),
        balance: b.balance,
      }))
    );

    logger.info(`Calculated settlements: ${JSON.stringify(settlements)}`);
    return settlements;
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

    // Reverse the balance changes by recalculating from scratch after deletion
    const splitsAsStrings = expense.splits.map(s => ({
      userId: s.userId.toString(),
      amount: s.amount
    }));
    await this.reverseBalances(groupId, expense.paidBy.toString(), splitsAsStrings);

    // Delete the expense
    await Expense.findByIdAndDelete(expenseId);

    // Recalculate ALL balances from scratch
    const expenses = await Expense.find({ groupId });
    const userBalances = new Map<string, number>();

    for (const exp of expenses) {
      const expPaidBy = exp.paidBy.toString();
      for (const split of exp.splits) {
        const splitUserId = split.userId.toString();
        if (!userBalances.has(splitUserId)) {
          userBalances.set(splitUserId, 0);
        }
        if (splitUserId === expPaidBy) {
          const netChange = exp.amount - split.amount;
          userBalances.set(splitUserId, userBalances.get(splitUserId)! + netChange);
        } else {
          userBalances.set(splitUserId, userBalances.get(splitUserId)! - split.amount);
        }
      }
    }

    // Update balances
    const balanceUpdates = [];
    for (const [userId, balance] of userBalances.entries()) {
      balanceUpdates.push(
        Balance.findOneAndUpdate(
          { groupId, userId },
          { balance, lastUpdated: new Date() },
          { upsert: true }
        )
      );
    }
    await Promise.all(balanceUpdates);

    logger.info(`Expense deleted: ${expenseId} from group ${groupId} - balances recalculated`);

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

    // Save expense first
    await expense.save();

    // Recalculate ALL balances from scratch (more reliable than incremental)
    const expenses = await Expense.find({ groupId });
    const userBalances = new Map<string, number>();

    for (const exp of expenses) {
      const expPaidBy = exp.paidBy.toString();
      for (const split of exp.splits) {
        const splitUserId = split.userId.toString();
        if (!userBalances.has(splitUserId)) {
          userBalances.set(splitUserId, 0);
        }
        if (splitUserId === expPaidBy) {
          const netChange = exp.amount - split.amount;
          userBalances.set(splitUserId, userBalances.get(splitUserId)! + netChange);
        } else {
          userBalances.set(splitUserId, userBalances.get(splitUserId)! - split.amount);
        }
      }
    }

    // Update balances
    const balanceUpdates = [];
    for (const [userId, balance] of userBalances.entries()) {
      balanceUpdates.push(
        Balance.findOneAndUpdate(
          { groupId, userId },
          { balance, lastUpdated: new Date() },
          { upsert: true }
        )
      );
    }
    await Promise.all(balanceUpdates);

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
   * Now uses a more reliable approach: recalculate from all expenses
   */
  private async updateBalances(
    groupId: string,
    _paidBy: string,
    _splits: Array<{ userId: string; amount: number }>
  ): Promise<IBalance[]> {
    // Instead of incremental updates, recalculate all balances from scratch
    // This prevents race conditions and ensures accuracy
    const expenses = await Expense.find({ groupId });
    const userBalances = new Map<string, number>();

    // Calculate balances from all expenses
    for (const expense of expenses) {
      const expensePaidBy = expense.paidBy.toString();

      for (const split of expense.splits) {
        const splitUserId = split.userId.toString();

        if (!userBalances.has(splitUserId)) {
          userBalances.set(splitUserId, 0);
        }

        if (splitUserId === expensePaidBy) {
          // Payer: balance increases by (total - their share)
          const netChange = expense.amount - split.amount;
          userBalances.set(splitUserId, userBalances.get(splitUserId)! + netChange);
        } else {
          // Others: balance decreases by their share
          userBalances.set(splitUserId, userBalances.get(splitUserId)! - split.amount);
        }
      }
    }

    // Update all balances in database
    const updates = [];
    for (const [userId, balance] of userBalances.entries()) {
      updates.push(
        Balance.findOneAndUpdate(
          { groupId, userId },
          { balance, lastUpdated: new Date() },
          { upsert: true, new: true }
        ).populate('userId', 'name email avatar')
      );
    }

    const results = await Promise.all(updates);

    logger.info(`Updated balances for group ${groupId} using full recalculation`);

    return results;
  }

  /**
   * Reverse balances (for expense deletion or before update)
   * Now uses full recalculation instead of incremental changes
   */
  private async reverseBalances(
    groupId: string,
    _paidBy: string,
    _splits: Array<{ userId: string; amount: number }>
  ): Promise<void> {
    // After reversal, we'll do a full recalculation anyway
    // So this is just a placeholder - the real work happens in updateBalances
    logger.info(`Preparing to recalculate balances after expense modification in group ${groupId}`);
  }

  /**
   * Debt simplification algorithm (Min Cash Flow)
   */
  private simplifyDebts(
    balances: Array<{ userId: string; balance: number }>
  ): CalculatedSettlement[] {
    logger.info(`Starting debt simplification with balances: ${JSON.stringify(balances)}`);

    const creditors = balances.filter((b) => b.balance > 0.01);
    const debtors = balances.filter((b) => b.balance < -0.01);
    const transactions: CalculatedSettlement[] = [];

    logger.info(`Creditors (owed money): ${JSON.stringify(creditors)}`);
    logger.info(`Debtors (owe money): ${JSON.stringify(debtors)}`);

    // Sort by amount (descending)
    creditors.sort((a, b) => b.balance - a.balance);
    debtors.sort((a, b) => a.balance - b.balance);

    let i = 0;
    let j = 0;

    while (i < creditors.length && j < debtors.length) {
      const creditor = creditors[i];
      const debtor = debtors[j];

      const amount = Math.min(creditor.balance, Math.abs(debtor.balance));

      logger.info(`Creating transaction: ${debtor.userId} -> ${creditor.userId}: ₹${amount.toFixed(2)}`);

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

    logger.info(`Final settlements: ${JSON.stringify(transactions)}`);
    return transactions;
  }

  /**
   * Recalculate all balances from scratch
   */
  async recalculateBalances(userId: string, groupId: string): Promise<{
    oldBalances: IBalance[];
    newBalances: IBalance[];
    fixed: boolean;
  }> {
    const group = await Group.findById(groupId);

    if (!group) {
      throw new NotFoundError('Group not found');
    }

    // Verify user is member
    const isMember = group.members.some((m) => m.userId.toString() === userId);
    if (!isMember) {
      throw new ForbiddenError('You are not a member of this group');
    }

    // Get old balances
    const oldBalances = await this.getGroupBalances(userId, groupId);

    // Get all expenses
    const expenses = await Expense.find({ groupId }).sort({ createdAt: 1 });

    // Calculate fresh balances
    const userBalances = new Map<string, number>();

    for (const expense of expenses) {
      const paidById = expense.paidBy.toString();

      for (const split of expense.splits) {
        const splitUserId = split.userId.toString();

        if (!userBalances.has(splitUserId)) {
          userBalances.set(splitUserId, 0);
        }

        if (splitUserId === paidById) {
          // Payer: balance increases by (total - their share)
          const netChange = expense.amount - split.amount;
          userBalances.set(splitUserId, userBalances.get(splitUserId)! + netChange);
        } else {
          // Others: balance decreases by their share
          userBalances.set(splitUserId, userBalances.get(splitUserId)! - split.amount);
        }
      }
    }

    // Update all balances in database
    const updates = [];
    for (const [userId, balance] of userBalances.entries()) {
      updates.push(
        Balance.findOneAndUpdate(
          { groupId, userId },
          { balance, lastUpdated: new Date() },
          { upsert: true, new: true }
        )
      );
    }

    await Promise.all(updates);

    // Get new balances
    const newBalances = await this.getGroupBalances(userId, groupId);

    logger.info(`Recalculated balances for group ${groupId}`);
    logger.info(`Old balances: ${JSON.stringify(oldBalances.map(b => ({ userId: b.userId, balance: b.balance })))}`);
    logger.info(`New balances: ${JSON.stringify(newBalances.map(b => ({ userId: b.userId, balance: b.balance })))}`);

    return {
      oldBalances,
      newBalances,
      fixed: true
    };
  }

  /**
   * Get analytics for a group
   */
  async getGroupAnalytics(userId: string, groupId: string): Promise<{
    categoryBreakdown: Array<{ category: string; total: number; count: number }>;
    topPayers: Array<{ userId: string; userName: string; totalPaid: number; expenseCount: number }>;
    topExpenses: Array<{ description: string; amount: number; category: string; date: Date; paidBy: string }>;
    monthlyTrends: Array<{ month: string; total: number; count: number }>;
    userStats: {
      totalPaid: number;
      totalOwed: number;
      shareOfTotal: number;
      expenseCount: number;
    };
    groupTotals: {
      totalExpenses: number;
      expenseCount: number;
      averageExpense: number;
      memberCount: number;
    };
  }> {
    const group = await Group.findById(groupId);

    if (!group) {
      throw new NotFoundError('Group not found');
    }

    // Verify user is member
    const isMember = group.members.some((m) => m.userId.toString() === userId);
    if (!isMember) {
      throw new ForbiddenError('You are not a member of this group');
    }

    // Get all expenses for the group
    const expenses = await Expense.find({ groupId })
      .populate('paidBy', 'name email')
      .sort({ date: -1 });

    // Calculate category breakdown
    const categoryMap = new Map<string, { total: number; count: number }>();
    expenses.forEach((expense) => {
      const category = expense.category || 'Uncategorized';
      const existing = categoryMap.get(category) || { total: 0, count: 0 };
      categoryMap.set(category, {
        total: existing.total + expense.amount,
        count: existing.count + 1,
      });
    });
    const categoryBreakdown = Array.from(categoryMap.entries()).map(([category, data]) => ({
      category,
      total: data.total,
      count: data.count,
    }));

    // Calculate top payers
    const payerMap = new Map<string, { userName: string; totalPaid: number; expenseCount: number }>();
    expenses.forEach((expense) => {
      const paidBy = typeof expense.paidBy === 'object' && expense.paidBy && 'name' in expense.paidBy ? expense.paidBy : null;
      const payerId = paidBy?._id?.toString() || (typeof expense.paidBy === 'object' && expense.paidBy ? expense.paidBy.toString() : 'unknown');
      const payerName: string = paidBy && 'name' in paidBy ? String(paidBy.name) : 'Unknown';

      const existing = payerMap.get(payerId) || { userName: payerName, totalPaid: 0, expenseCount: 0 };
      payerMap.set(payerId, {
        userName: payerName,
        totalPaid: existing.totalPaid + expense.amount,
        expenseCount: existing.expenseCount + 1,
      });
    });
    const topPayers = Array.from(payerMap.entries())
      .map(([userId, data]) => ({
        userId,
        userName: data.userName,
        totalPaid: data.totalPaid,
        expenseCount: data.expenseCount,
      }))
      .sort((a, b) => b.totalPaid - a.totalPaid)
      .slice(0, 5);

    // Get top expenses
    const topExpenses = expenses
      .slice(0, 10)
      .map((expense) => {
        const paidBy = typeof expense.paidBy === 'object' && expense.paidBy && 'name' in expense.paidBy ? expense.paidBy : null;
        const payerName: string = paidBy && 'name' in paidBy ? String(paidBy.name) : 'Unknown';
        return {
          description: expense.description,
          amount: expense.amount,
          category: expense.category || 'Uncategorized',
          date: expense.date,
          paidBy: payerName,
        };
      });

    // Calculate monthly trends (last 6 months)
    const monthlyMap = new Map<string, { total: number; count: number }>();
    const now = new Date();
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(now.getMonth() - 6);

    expenses
      .filter((expense) => expense.date >= sixMonthsAgo)
      .forEach((expense) => {
        const monthKey = `${expense.date.getFullYear()}-${String(expense.date.getMonth() + 1).padStart(2, '0')}`;
        const existing = monthlyMap.get(monthKey) || { total: 0, count: 0 };
        monthlyMap.set(monthKey, {
          total: existing.total + expense.amount,
          count: existing.count + 1,
        });
      });

    const monthlyTrends = Array.from(monthlyMap.entries())
      .map(([month, data]) => ({
        month,
        total: data.total,
        count: data.count,
      }))
      .sort((a, b) => a.month.localeCompare(b.month));

    // Calculate user stats
    const userPaidExpenses = expenses.filter((expense) => {
      const paidBy = typeof expense.paidBy === 'object' && expense.paidBy && 'name' in expense.paidBy ? expense.paidBy : null;
      const payerId = paidBy?._id?.toString() || (typeof expense.paidBy === 'object' && expense.paidBy ? expense.paidBy.toString() : '');
      return payerId === userId;
    });
    const totalPaid = userPaidExpenses.reduce((sum, expense) => sum + expense.amount, 0);

    // Calculate how much user owes (from their splits)
    let totalOwed = 0;
    expenses.forEach((expense) => {
      const userSplit = expense.splits.find((split) => {
        if (!split.userId) return false;
        const splitUserId = typeof split.userId === 'object' && split.userId && '_id' in split.userId
          ? split.userId._id?.toString()
          : String(split.userId);
        return splitUserId === userId;
      });
      if (userSplit) {
        totalOwed += userSplit.amount;
      }
    });

    const groupTotal = expenses.reduce((sum, expense) => sum + expense.amount, 0);
    const shareOfTotal = groupTotal > 0 ? (totalPaid / groupTotal) * 100 : 0;

    // Group totals
    const groupTotals = {
      totalExpenses: groupTotal,
      expenseCount: expenses.length,
      averageExpense: expenses.length > 0 ? groupTotal / expenses.length : 0,
      memberCount: group.members.length,
    };

    return {
      categoryBreakdown,
      topPayers,
      topExpenses,
      monthlyTrends,
      userStats: {
        totalPaid,
        totalOwed,
        shareOfTotal,
        expenseCount: userPaidExpenses.length,
      },
      groupTotals,
    };
  }
}

export const expenseService = new ExpenseService();

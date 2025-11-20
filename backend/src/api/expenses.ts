import { Router, Response } from 'express';
import { expenseService } from '../services/expense.service';
import { authenticateToken, AuthRequest } from '../middleware/auth';
import { validate, schemas } from '../middleware/validation';
import { io } from '../index';

const router = Router();

// All routes require authentication
router.use(authenticateToken);

/**
 * POST /api/expenses
 * Create a new expense
 */
router.post('/', validate(schemas.createExpense), async (req: AuthRequest, res: Response, next) => {
  try {
    const { groupId, description, amount, paidBy, selectedMembers, category } = req.body;

    const result = await expenseService.createExpense(
      req.userId!,
      groupId,
      description,
      amount,
      paidBy,
      selectedMembers,
      category
    );

    // Emit real-time update to all clients in the group
    io.to(`group:${groupId}`).emit('expense:created', {
      expense: result.expense,
      updatedBalances: result.updatedBalances,
    });

    res.status(201).json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/expenses/group/:groupId
 * Get expenses for a group
 */
router.get('/group/:groupId', async (req: AuthRequest, res: Response, next) => {
  try {
    const { groupId } = req.params;

    const expenses = await expenseService.getGroupExpenses(req.userId!, groupId);

    res.json({
      success: true,
      data: expenses,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/expenses/group/:groupId/balances
 * Get balances for a group
 */
router.get('/group/:groupId/balances', async (req: AuthRequest, res: Response, next) => {
  try {
    const { groupId } = req.params;

    const balances = await expenseService.getGroupBalances(req.userId!, groupId);

    res.json({
      success: true,
      data: balances,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/expenses/group/:groupId/settlement
 * Get settlement calculation
 */
router.get('/group/:groupId/settlement', async (req: AuthRequest, res: Response, next) => {
  try {
    const { groupId } = req.params;

    const settlements = await expenseService.calculateSettlement(req.userId!, groupId);

    res.json({
      success: true,
      data: settlements,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/expenses/group/:groupId/settle
 * Record settlement payment
 */
router.post('/group/:groupId/settle', async (req: AuthRequest, res: Response, next) => {
  try {
    const { groupId } = req.params;
    const { from, to, amount, paymentMethod, notes } = req.body;

    const result = await expenseService.recordSettlement(
      req.userId!,
      groupId,
      from,
      to,
      amount,
      paymentMethod,
      notes
    );

    // Emit real-time update to all clients in the group
    io.to(`group:${groupId}`).emit('payment:settled', {
      from,
      to,
      amount,
    });

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/expenses/group/:groupId/settlement-history
 * Get settlement history for a group
 */
router.get('/group/:groupId/settlement-history', async (req: AuthRequest, res: Response, next) => {
  try {
    const { groupId } = req.params;

    const history = await expenseService.getSettlementHistory(req.userId!, groupId);

    res.json({
      success: true,
      data: history,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * DELETE /api/expenses/:id
 * Delete an expense
 */
router.delete('/:id', async (req: AuthRequest, res: Response, next) => {
  try {
    const { id } = req.params;

    const result = await expenseService.deleteExpense(req.userId!, id);

    // Emit real-time update to all clients in the group
    if (result.deletedExpense) {
      io.to(`group:${result.deletedExpense.groupId}`).emit('expense:deleted', {
        expenseId: id,
        updatedBalances: result.updatedBalances,
      });
    }

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * PUT /api/expenses/:id
 * Update an expense
 */
router.put('/:id', async (req: AuthRequest, res: Response, next) => {
  try {
    const { id } = req.params;
    const { description, amount, category, selectedMembers } = req.body;

    const result = await expenseService.updateExpense(
      req.userId!,
      id,
      description,
      amount,
      category,
      selectedMembers
    );

    // Emit real-time update to all clients in the group
    if (result.expense) {
      io.to(`group:${result.expense.groupId}`).emit('expense:updated', {
        expense: result.expense,
        updatedBalances: result.updatedBalances,
      });
    }

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/expenses/group/:groupId/analytics
 * Get analytics for a group
 */
router.get('/group/:groupId/analytics', async (req: AuthRequest, res: Response, next) => {
  try {
    const { groupId } = req.params;

    const analytics = await expenseService.getGroupAnalytics(req.userId!, groupId);

    res.json({
      success: true,
      data: analytics,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/expenses/group/:groupId/debug
 * Debug endpoint to see all expenses and calculations
 */
router.get('/group/:groupId/debug', async (req: AuthRequest, res: Response, next) => {
  try {
    const { groupId } = req.params;

    const expenses = await expenseService.getGroupExpenses(req.userId!, groupId);
    const balances = await expenseService.getGroupBalances(req.userId!, groupId);
    const settlements = await expenseService.calculateSettlement(req.userId!, groupId);

    // Manual calculation
    const userBalances: Record<string, { name: string; balance: number }> = {};

    for (const expense of expenses) {
      const paidByObj = expense.paidBy as any;
      const paidById = paidByObj?._id?.toString() || paidByObj?.toString() || '';

      for (const split of expense.splits) {
        const userIdObj = split.userId as any;
        const userId = userIdObj?._id?.toString() || userIdObj?.toString() || '';
        const userName = userIdObj?.name || 'Unknown';

        if (!userBalances[userId]) {
          userBalances[userId] = { name: userName, balance: 0 };
        }

        if (userId === paidById) {
          // Payer: balance increases by (total - their share)
          const netChange = expense.amount - split.amount;
          userBalances[userId].balance += netChange;
        } else {
          // Others: balance decreases by their share
          userBalances[userId].balance -= split.amount;
        }
      }
    }

    res.json({
      success: true,
      data: {
        expenses: expenses.map(e => {
          const paidByObj = e.paidBy as any;
          return {
            description: e.description,
            amount: e.amount,
            paidBy: paidByObj?.name || 'Unknown',
            splits: e.splits.map(s => {
              const userObj = s.userId as any;
              return {
                user: userObj?.name || 'Unknown',
                amount: s.amount,
                percentage: s.percentage
              };
            }),
            date: e.createdAt
          };
        }),
        balances: balances.map(b => {
          const userObj = b.userId as any;
          return {
            user: userObj?.name || 'Unknown',
            balance: b.balance
          };
        }),
        calculatedBalances: Object.values(userBalances),
        settlements: settlements.map(s => ({
          from: s.from,
          to: s.to,
          amount: s.amount
        })),
        mismatch: Object.values(userBalances).some(u => {
          const dbBalance = balances.find(b => {
            const userObj = b.userId as any;
            const userId = userObj?._id?.toString() || userObj?.toString() || '';
            return userId === Object.keys(userBalances).find(k => userBalances[k].name === u.name);
          });
          return dbBalance ? Math.abs(dbBalance.balance - u.balance) > 0.01 : true;
        })
      }
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/expenses/group/:groupId/recalculate-balances
 * Recalculate all balances from scratch (fix corrupted balances)
 */
router.post('/group/:groupId/recalculate-balances', async (req: AuthRequest, res: Response, next) => {
  try {
    const { groupId } = req.params;

    const result = await expenseService.recalculateBalances(req.userId!, groupId);

    res.json({
      success: true,
      message: 'Balances recalculated successfully',
      data: result
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/expenses/group/:groupId/summary
 * Get expense summary for printable report
 */
router.get('/group/:groupId/summary', async (req: AuthRequest, res: Response, next) => {
  try {
    const { groupId } = req.params;

    const summary = await expenseService.getExpenseSummary(req.userId!, groupId);

    res.json({
      success: true,
      data: summary,
    });
  } catch (error) {
    next(error);
  }
});

export default router;

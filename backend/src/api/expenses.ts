import { Router, Response } from 'express';
import { expenseService } from '../services/expense.service';
import { authenticateToken, AuthRequest } from '../middleware/auth';
import { validate, schemas } from '../middleware/validation';

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
    const { from, to, amount } = req.body;

    const updatedBalances = await expenseService.recordSettlement(
      req.userId!,
      groupId,
      from,
      to,
      amount
    );

    res.json({
      success: true,
      data: updatedBalances,
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

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
});

export default router;

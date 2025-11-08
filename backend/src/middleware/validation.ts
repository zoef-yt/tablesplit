import Joi from 'joi';
import { Request, Response, NextFunction } from 'express';
import { BadRequestError } from './errorHandler';

export function validate(schema: Joi.ObjectSchema) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const { error } = schema.validate(req.body, { abortEarly: false });

    if (error) {
      const message = error.details.map((d) => d.message).join(', ');
      next(new BadRequestError(message));
      return;
    }

    next();
  };
}

// Common validation schemas
export const schemas = {
  login: Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().min(6),
  }),

  magicLink: Joi.object({
    email: Joi.string().email().required(),
  }),

  createGroup: Joi.object({
    name: Joi.string().min(1).max(100).required(),
    theme: Joi.string().valid('poker', 'classic', 'minimal').default('poker'),
    currency: Joi.string().length(3).default('USD'),
  }),

  createExpense: Joi.object({
    groupId: Joi.string().required(),
    description: Joi.string().min(1).max(200).required(),
    amount: Joi.number().positive().required(),
    paidBy: Joi.string().required(),
    splitMethod: Joi.string().valid('equal', 'percentage', 'custom').default('equal'),
    splits: Joi.array().items(
      Joi.object({
        userId: Joi.string().required(),
        amount: Joi.number().positive(),
        percentage: Joi.number().min(0).max(100),
      })
    ),
    selectedMembers: Joi.array().items(Joi.string()),
    category: Joi.string().max(50),
  }),
};

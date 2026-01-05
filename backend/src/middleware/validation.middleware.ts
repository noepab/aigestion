// src/middleware/validation.middleware.ts
import { Request, Response, NextFunction } from 'express';
import { z, ZodSchema } from 'zod';

export const validate = (schema: ZodSchema<any>) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      const errors = result.error.format();
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors,
      });
    }
    // attach parsed data to request for typed usage
    (req as any).validatedBody = result.data;
    next();
  };
};
// Basic schemas for auth
const authSchemas = {
  register: z.object({
    email: z.string().email(),
    password: z.string().min(6),
    name: z.string().optional(),
  }),
  login: z.object({
    email: z.string().email(),
    password: z.string(),
  }),
};

export const schemas = {
  auth: authSchemas,
};

export const validateBody = validate;

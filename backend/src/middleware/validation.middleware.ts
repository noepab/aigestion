import type { NextFunction, Request, Response } from 'express-serve-static-core';
import { z, type AnyZodObject } from 'zod';

export interface ValidationSchema {
  body?: AnyZodObject;
  query?: AnyZodObject;
  params?: AnyZodObject;
}

/**
 * Enhanced validation middleware that supports validating body, query, and params.
 * Throws ZodError to be caught by the global errorHandler.
 */
export const validate = (schema: ValidationSchema) => {
  return async (req: Request, _res: Response, next: NextFunction) => {
    try {
      if (schema.body) {
        req.body = await schema.body.parseAsync(req.body);
      }
      if (schema.query) {
        req.query = (await schema.query.parseAsync(req.query)) as any;
      }
      if (schema.params) {
        req.params = (await schema.params.parseAsync(req.params)) as any;
      }
      next();
    } catch (error) {
      next(error);
    }
  };
};

/**
 * Legacy wrappers for backward compatibility if needed, or specific use cases.
 */
export const validateBody = (schema: AnyZodObject) => validate({ body: schema });
export const validateQuery = (schema: AnyZodObject) => validate({ query: schema });
export const validateParams = (schema: AnyZodObject) => validate({ params: schema });

// Estandarización de esquemas comunes
export const schemas = {
  common: {
    id: z.object({
      id: z.string().regex(/^\d+$/, 'Invalid ID format'),
    }),
  },
  auth: {
    register: z.object({
      email: z.string().email(),
      password: z
        .string()
        .min(12)
        .regex(
          /^(?=.*[0-9])(?=.*[!@#$%^&*])/,
          'Password must include number and special character',
        ),
      name: z.string().min(2),
    }),
    login: z.object({
      email: z.string().email(),
      password: z
        .string()
        .min(12)
        .regex(
          /^(?=.*[0-9])(?=.*[!@#$%^&*])/,
          'Password must include number and special character',
        ),
    }),
    enable2FA: z.object({
      userId: z.string().uuid(),
    }),
    verify2FA: z.object({
      userId: z.string().uuid(),
      token: z.string().min(6).max(6),
    }),
  },
  user: {
    create: z.object({
      name: z.string().min(1),
      email: z.string().email(),
      password: z
        .string()
        .min(12)
        .regex(/^(?=.*[0-9])(?=.*[!@#$%^&*])/, 'Password must include number and special character')
        .optional(),
    }),
    update: z.object({
      name: z.string().min(1).optional(),
      email: z.string().email().optional(),
      password: z
        .string()
        .min(12)
        .regex(/^(?=.*[0-9])(?=.*[!@#$%^&*])/, 'Password must include number and special character')
        .optional(),
    }),
  },
  ai: {
    prompt: z.object({
      prompt: z.string().min(1),
    }),
  },
  pagination: z.object({
    page: z.string().regex(/^\d+$/).transform(Number).optional(),
    limit: z.string().regex(/^\d+$/).transform(Number).optional(),
  }),
};

export type RegisterDto = z.infer<typeof schemas.auth.register>;
export type LoginDto = z.infer<typeof schemas.auth.login>;
export type CreateUserDto = z.infer<typeof schemas.user.create>;
export type UpdateUserDto = z.infer<typeof schemas.user.update>;
export type AIPromptDto = z.infer<typeof schemas.ai.prompt>;

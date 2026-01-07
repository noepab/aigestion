import type { NextFunction, Request, Response } from 'express-serve-static-core';
import { container, TYPES } from '../config/inversify.config';
import { AppError } from '../utils/errors';
import { validate, schemas, validateParams } from '../middleware/validation.middleware';
import { UserService } from '../services/user.service';
import { buildResponse } from '../common/response-builder';

const userService = container.get<UserService>(TYPES.UserService);

export const createUser = [
  validate({ body: schemas.user.create }),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = await userService.create(req.body);
      res.status(201).json(buildResponse(user, 201, (req as any).requestId));
    } catch (err) {
      next(err);
    }
  },
];

export const getAllUsers = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { page = 1, limit = 10 } = (req as any).pagination || {};
    const allUsers = await userService.findAll();
    const total = allUsers.length;
    const start = (page - 1) * limit;
    const data = allUsers.slice(start, start + limit);

    const response = {
      data,
      pagination: { page, limit, total },
    };
    res.json(buildResponse(response, 200, (req as any).requestId));
  } catch (err) {
    next(err);
  }
};

export const getUserById = [
  validateParams(schemas.common.id),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const user = await userService.findById(id);
      if (!user) {
        return next(new AppError('User not found', 404, 'NOT_FOUND'));
      }
      res.json(buildResponse(user, 200, (req as any).requestId));
    } catch (err) {
      next(err);
    }
  },
];

export const updateUser = [
  validateParams(schemas.common.id),
  validate({ body: schemas.user.update }),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const user = await userService.update(id, req.body);
      if (!user) {
        return next(new AppError('User not found', 404, 'NOT_FOUND'));
      }
      res.json(buildResponse(user, 200, (req as any).requestId));
    } catch (err) {
      next(err);
    }
  },
];

export const deleteUser = [
  validateParams(schemas.common.id),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const success = await userService.delete(id);
      if (!success) {
        return next(new AppError('User not found', 404, 'NOT_FOUND'));
      }
      res.json(buildResponse({ message: 'User deleted' }, 200, (req as any).requestId));
    } catch (err) {
      next(err);
    }
  },
];

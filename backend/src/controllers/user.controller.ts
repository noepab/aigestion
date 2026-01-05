// src/controllers/user.controller.ts
import { buildResponse, buildError } from '../common/response-builder';
import { Request, Response, NextFunction } from 'express';
import { UserService } from '../services/user.service';
import { validate } from '../middleware/validation.middleware';
import { CreateUserDto, UpdateUserDto } from '../dto/dtoSchemas';

const userService = new UserService();

export const createUser = [
  validate(CreateUserDto),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = (req as any).validatedBody as CreateUserDto;
      const user = await userService.create(data);
      res.status(201).json(buildResponse(user, 201, (req as any).requestId));
    } catch (err) {
      next(err);
    }
  },
];

export const getAllUsers = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const users = await userService.findAll();
    res.json(buildResponse(users, 200, (req as any).requestId));
  } catch (err) {
    next(err);
  }
};

export const getUserById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = await userService.findById(req.params.id);
    if (!user) {
      return res.status(404).json(buildError('User not found', 'NOT_FOUND', 404, (req as any).requestId));
    }
    res.json(buildResponse(user, 200, (req as any).requestId));
  } catch (err) {
    next(err);
  }
};

export const updateUser = [
  validate(UpdateUserDto),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = (req as any).validatedBody as UpdateUserDto;
      const user = await userService.update(req.params.id, data);
      if (!user) {
        return res.status(404).json(buildError('User not found', 'NOT_FOUND', 404, (req as any).requestId));
      }
      res.json(buildResponse(user, 200, (req as any).requestId));
    } catch (err) {
      next(err);
    }
  },
];

export const deleteUser = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const success = await userService.delete(req.params.id);
    if (!success) {
      return res.status(404).json(buildError('User not found', 'NOT_FOUND', 404, (req as any).requestId));
    }
    res.json(buildResponse({ message: 'User deleted' }, 200, (req as any).requestId));
  } catch (err) {
    next(err);
  }
};

import bcrypt from 'bcryptjs';
import type { NextFunction, Request, Response } from 'express-serve-static-core';
import jwt from 'jsonwebtoken';

import { buildResponse } from '../common/response-builder';
import { config } from '../config';
import { container } from '../config/inversify.config';
import { User } from '../models/User';
import { AuthService } from '../services/auth.service';
import { Enable2FAUseCase } from '../application/usecases/Enable2FAUseCase';
import { Verify2FAUseCase } from '../application/usecases/Verify2FAUseCase';
import { TYPES } from '../types';
import { AppError } from '../utils/errors';
import { validate, schemas } from '../middleware/validation.middleware';

// Helper to set refresh token cookie
const setRefreshTokenCookie = (res: Response, token: string) => {
  res.cookie('refresh_token', token, {
    httpOnly: true,
    secure: config.env === 'production',
    sameSite: 'strict',
    maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
  });
};

export const register = [
  validate({ body: schemas.auth.register }),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const authService = container.get<AuthService>(TYPES.AuthService);
      const { user, token, refreshToken } = await authService.register(req.body);

      // No devolver la contraseña en la respuesta
      const userResponse: any = user.toObject();
      delete userResponse.password;
      delete userResponse.refreshTokens; // Don't send DB array to client

      setRefreshTokenCookie(res, refreshToken);

      res.status(201).json(buildResponse({ user: userResponse, token }, 201, (req as any).requestId));
    } catch (error) {
      next(error);
    }
  },
];

export const login = [
  validate({ body: schemas.auth.login }),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const authService = container.get<AuthService>(TYPES.AuthService);
      const { email, password } = req.body;
      const ip = req.ip;
      const userAgent = req.headers['user-agent'];

      const { user, token, refreshToken } = await authService.login({ email, password, ip, userAgent });

      const userResponse: any = user.toObject();
      delete userResponse.password;
      delete userResponse.refreshTokens;

      setRefreshTokenCookie(res, refreshToken);

      res.status(200).json(buildResponse({ user: userResponse, token }, 200, (req as any).requestId));
    } catch (error) {
      next(error);
    }
  },
];

export const refresh = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const refreshToken = req.cookies['refresh_token'];
    if (!refreshToken) {
      throw new AppError('Refresh Token Required', 401, 'REFRESH_TOKEN_REQUIRED');
    }

    const authService = container.get<AuthService>(TYPES.AuthService);
    const ip = req.ip || 'unknown';
    const userAgent = req.headers['user-agent'] || 'unknown';

    const { user, accessToken, refreshToken: newRefreshToken } = await authService.refreshToken(refreshToken, ip, userAgent);

    setRefreshTokenCookie(res, newRefreshToken);

    res.status(200).json(buildResponse({ accessToken }, 200, (req as any).requestId));
  } catch (error) {
    // If refresh fails (security reuse, expired), clear cookie
    res.clearCookie('refresh_token');
    next(error);
  }
};

export const logout = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const refreshToken = req.cookies['refresh_token'];
    if (refreshToken) {
      // @ts-ignore
      const authService = container.get<AuthService>(TYPES.AuthService);
      await authService.logout(refreshToken);
    }

    res.clearCookie('refresh_token');
    res.status(200).json(buildResponse({ message: 'Logged out successfully' }, 200, (req as any).requestId));
  } catch (error) {
    next(error);
  }
};

export const getMe = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.user) {
      return next(new AppError('Usuario no autenticado', 401, 'UNAUTHORIZED'));
    }
    const user = await User.findById(req.user.id).select('-password');

    if (!user) {
      return next(new AppError('Usuario no encontrado', 404, 'NOT_FOUND'));
    }

    res.status(200).json(buildResponse(user, 200, (req as any).requestId));
  } catch (error) {
    next(error);
  }
};

// Enable 2FA
export const enable2FA = [
  validate({ body: schemas.auth.enable2FA }),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const enable2FAUseCase = container.get<Enable2FAUseCase>(TYPES.Enable2FAUseCase);
      const { userId } = req.body;
      const result = await enable2FAUseCase.execute(userId);
      res.status(200).json(buildResponse(result, 200, (req as any).requestId));
    } catch (error) {
      next(error);
    }
  },
];

// Verify 2FA token
export const verify2FA = [
  validate({ body: schemas.auth.verify2FA }),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const verify2FAUseCase = container.get<Verify2FAUseCase>(TYPES.Verify2FAUseCase);
      const { userId, token } = req.body;
      await verify2FAUseCase.execute(userId, token);
      res.status(200).json(buildResponse({ success: true }, 200, (req as any).requestId));
    } catch (error) {
      next(error);
    }
  },
];

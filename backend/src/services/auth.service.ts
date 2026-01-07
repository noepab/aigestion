import bcrypt from 'bcryptjs';
import { injectable, inject } from 'inversify';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { RegisterUserUseCase } from '../application/usecases/RegisterUserUseCase';
import { LoginUserUseCase } from '../application/usecases/LoginUserUseCase';

import { config } from '../config';
import { IUser, User } from '../models/User';

import { TYPES } from '../types';
import { IUserRepository } from '../infrastructure/repository/UserRepository';
import { AppError } from '../utils/errors';


@injectable()
export class AuthService {
  constructor(
    @inject(TYPES.UserRepository) private userRepository: IUserRepository,
    @inject(TYPES.RegisterUserUseCase) private registerUseCase: RegisterUserUseCase,
    @inject(TYPES.LoginUserUseCase) private loginUseCase: LoginUserUseCase
  ) { }

  /**
   * Register a new user
   */
  async register(data: { name: string; email: string; password: string }): Promise<{ user: IUser; token: string; refreshToken: string }> {
    // Delegate to RegisterUserUseCase
    return this.registerUseCase.execute(data);
  }

  /**
   * Login user
   */
  async login(data: { email: string; password: string; ip?: string; userAgent?: string }): Promise<{ user: IUser; token: string; refreshToken: string }> {
    // Delegate to LoginUserUseCase
    return this.loginUseCase.execute(data);
  }

  /**
   * Get user profile
   */
  async getUserProfile(userId: string): Promise<IUser | null> {
    return User.findById(userId).select('-password');
  }

  /**
   * Refresh Token
   */
  async refreshToken(token: string, ip: string, userAgent: string): Promise<{ user: IUser; accessToken: string; refreshToken: string }> {
    const user = await User.findOne({ 'refreshTokens.token': token });

    if (!user) {
      // REUSE DETECTION: If we can't find the token, it might have been rotated already.
      // If we decode it and find a valid familyId, we must invalidate the whole family.
      try {
        const decoded: any = jwt.verify(token, config.jwt.secret);
        if (decoded.familyId) {
          // This is a "Reused Token"! Danger!
          // Find the user who owns this familyId
          const compromisedUser = await User.findOne({ 'refreshTokens.familyId': decoded.familyId });
          if (compromisedUser) {
            // Invalidate ALL tokens for this family
            compromisedUser.refreshTokens = compromisedUser.refreshTokens.filter(t => t.familyId !== decoded.familyId);
            await compromisedUser.save();
            throw new Error('REFRESH_TOKEN_REUSE_DETECTED');
          }
        }
      } catch (err) {
        // Ignore verify errors, just throw invalid
      }
      throw new Error('INVALID_REFRESH_TOKEN');
    }

    // Token found. Verify it's valid and not expired.
    const currentToken = user.refreshTokens.find(t => t.token === token);

    if (!currentToken) {
      throw new Error('INVALID_REFRESH_TOKEN'); // Should not happen given query
    }

    // Check expiry
    if (new Date() > currentToken.expires) {
      // Remove expired token
      user.refreshTokens = user.refreshTokens.filter(t => t.token !== token);
      await user.save();
      throw new Error('REFRESH_TOKEN_EXPIRED');
    }

    // Rotate: Replace old token with new one in the same family
    const newFamilyId = currentToken.familyId; // Keep family ID
    const newRefreshToken = this.generateRefreshTokenString(user, newFamilyId);

    // Remove used token and add new one
    user.refreshTokens = user.refreshTokens.filter(t => t.token !== token);
    user.refreshTokens.push({
      token: newRefreshToken,
      expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      familyId: newFamilyId,
      ip,
      userAgent,
      createdAt: new Date()
    });

    // Clean up old tokens (optional limit)
    if (user.refreshTokens.length > 50) {
      user.refreshTokens = user.refreshTokens.slice(-50);
    }

    await user.save();

    const accessToken = this.generateToken(user, { ip, userAgent });
    return { user, accessToken, refreshToken: newRefreshToken };
  }

  private generateToken(user: IUser, fingerprint?: { ip?: string; userAgent?: string }): string {
    const payload: any = {
      id: user._id,
      email: user.email,
      role: user.role,
    };

    if (fingerprint) {
      payload.fingerprint = {
        ip: fingerprint.ip || 'unknown',
        userAgent: fingerprint.userAgent || 'unknown',
      };
    }

    return jwt.sign(payload, config.jwt.secret, { expiresIn: config.jwt.expiresIn as any });
  }

  generateRefreshTokenString(user: IUser, familyId?: string): string {
    const payload = {
      id: user._id,
      familyId: familyId || crypto.randomUUID(), // New family if not provided
      type: 'refresh'
    };
    return jwt.sign(payload, config.jwt.secret, { expiresIn: '7d' });
  }

  async logout(refreshToken: string): Promise<void> {
    await User.updateOne(
      { 'refreshTokens.token': refreshToken },
      { $pull: { refreshTokens: { token: refreshToken } } }
    );
  }
}

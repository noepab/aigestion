import { injectable, inject } from 'inversify';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { IUserRepository } from '../../infrastructure/repository/UserRepository';
import { TYPES } from '../../types';
import { AppError } from '../../utils/errors';
import { config } from '../../config';
import { User } from '../../models/User';

@injectable()
export class LoginUserUseCase {
  constructor(@inject(TYPES.UserRepository) private userRepository: IUserRepository) {}

  async execute(data: { email: string; password: string; ip?: string; userAgent?: string }) {
    const { email, password, ip, userAgent } = data;
    const user = await this.userRepository.findByEmail(email);
    if (!user) {
      throw new AppError('Credenciales inválidas', 401, 'AUTH_ERROR');
    }
    // lock check
    if (user.lockUntil && user.lockUntil > new Date()) {
      throw new AppError('Credenciales inválidas', 401, 'AUTH_ERROR');
    }
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      user.loginAttempts = (user.loginAttempts || 0) + 1;
      if (user.loginAttempts >= 5) {
        user.lockUntil = new Date(Date.now() + 30 * 60 * 1000);
        user.loginAttempts = 0;
      }
      await user.save();
      throw new AppError('Credenciales inválidas', 401, 'AUTH_ERROR');
    }
    // success reset attempts
    user.loginAttempts = 0;
    user.lockUntil = undefined;
    user.lastLogin = new Date();
    const token = this.generateToken(user, { ip, userAgent });
    const refreshToken = this.generateRefreshTokenString(user);
    user.refreshTokens.push({
      token: refreshToken,
      expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      familyId: crypto.randomUUID(),
      ip: ip || 'unknown',
      userAgent: userAgent || 'unknown',
      createdAt: new Date(),
    });
    if (user.refreshTokens.length > 10) {
      user.refreshTokens = user.refreshTokens.slice(-10);
    }
    await user.save();
    return { user, token, refreshToken };
  }

  private generateToken(user: any, fingerprint?: { ip?: string; userAgent?: string }): string {
    const payload: any = { id: user._id, email: user.email, role: user.role };
    if (fingerprint) {
      payload.fingerprint = {
        ip: fingerprint.ip || 'unknown',
        userAgent: fingerprint.userAgent || 'unknown',
      };
    }
    return jwt.sign(payload, config.jwt.secret, { expiresIn: config.jwt.expiresIn as any });
  }

  private generateRefreshTokenString(user: any, familyId?: string): string {
    const payload = { id: user._id, familyId: familyId || crypto.randomUUID(), type: 'refresh' };
    return jwt.sign(payload, config.jwt.secret, { expiresIn: '7d' });
  }
}

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
export class RegisterUserUseCase {
  constructor(@inject(TYPES.UserRepository) private userRepository: IUserRepository) {}

  async execute(data: { name: string; email: string; password: string }) {
    const { name, email, password } = data;
    const existingUser = await this.userRepository.findByEmail(email);
    if (existingUser) {
      throw new AppError('El correo electrónico ya está registrado', 400, 'AUTH_ERROR');
    }
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    const user = new User({ name, email, password: hashedPassword, role: 'user' });
    await this.userRepository.create(user);
    const token = this.generateToken(user);
    const refreshToken = this.generateRefreshTokenString(user);
    user.refreshTokens = [
      {
        token: refreshToken,
        expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        familyId: crypto.randomUUID(),
        ip: '127.0.0.1',
        userAgent: 'unknown',
        createdAt: new Date(),
      },
    ];
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

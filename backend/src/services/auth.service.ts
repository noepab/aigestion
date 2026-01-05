import { injectable } from 'inversify';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { User, IUser } from '../models/User';
import { config } from '../config';

@injectable()
export class AuthService {
  /**
   * Register a new user
   */
  async register(data: { name: string; email: string; password: string }): Promise<{ user: IUser; token: string }> {
    const { name, email, password } = data;

    // Check existing
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      throw new Error('EMAIL_EXISTS');
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create user
    const user = new User({
      name,
      email,
      password: hashedPassword,
      role: 'user',
    });

    await user.save();

    // Generate Token
    const token = this.generateToken(user);

    return { user, token };
  }

  /**
   * Login user
   */
  async login(data: { email: string; password: string; ip?: string; userAgent?: string }): Promise<{ user: IUser; token: string }> {
    const { email, password, ip, userAgent } = data;

    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      throw new Error('INVALID_CREDENTIALS');
    }

    // Check lock
    if (user.lockUntil && user.lockUntil > new Date()) {
      const remainingMinutes = Math.ceil((user.lockUntil.getTime() - Date.now()) / 60000);
      throw new Error(`ACCOUNT_LOCKED:${remainingMinutes}`);
    }

    // Check password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      user.loginAttempts += 1;
      if (user.loginAttempts >= 5) {
        user.lockUntil = new Date(Date.now() + 30 * 60 * 1000); // 30 min lock
        user.loginAttempts = 0;
      }
      await user.save();
      throw new Error('INVALID_CREDENTIALS');
    }

    // Success
    user.loginAttempts = 0;
    user.lockUntil = undefined;
    user.lastLogin = new Date();
    await user.save();

    // Generate Token with fingerprint
    const token = this.generateToken(user, { ip, userAgent });

    return { user, token };
  }

  /**
   * Get user profile
   */
  async getUserProfile(userId: string): Promise<IUser | null> {
    return User.findById(userId).select('-password');
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
}

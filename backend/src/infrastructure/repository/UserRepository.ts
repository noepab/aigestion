// src/infrastructure/repository/UserRepository.ts

import { IUser } from '../../models/User';
import { BaseRepository } from './BaseRepository';

export interface IUserRepository extends BaseRepository<IUser> {
  findByEmail(email: string): Promise<IUser | null>;
}

export class UserRepository extends BaseRepository<IUser> implements IUserRepository {
  constructor() {
    super();
    const defaultUser1: IUser = {
      id: '1',
      name: 'Test User',
      email: 'bob@example.com',
      password: 'hashedpassword',
      role: 'user',
      isMfaEnabled: false,
      loginAttempts: 0,
      tokenVersion: 0,
      lastPasswordChange: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
      refreshTokens: [],
    } as IUser;
    const defaultUser2: IUser = {
      ...defaultUser1,
      id: '2',
      email: 'test@example.com',
    } as IUser;
    super.create(defaultUser1.id, defaultUser1);
    super.create(defaultUser2.id, defaultUser2);
  }

  async findByEmail(email: string): Promise<IUser | null> {
    // In-memory implementation for now, will be replaced by Mongoose
    const users = await this.findAll();
    return users.find(u => u.email === email) || null;
  }
}

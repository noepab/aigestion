import { inject, injectable } from 'inversify';
import { CreateUserDto, UpdateUserDto } from '../middleware/validation.middleware';
import type { IUserRepository } from '../infrastructure/repository/UserRepository';
import { IUser, User } from '../models/User';
import { TYPES } from '../types';

@injectable()
export class UserService {
  constructor(@inject(TYPES.UserRepository) private userRepository: IUserRepository) {}

  async create(data: CreateUserDto): Promise<IUser> {
    const user = new User(data);
    return this.userRepository.create(user);
  }

  async findAll(): Promise<IUser[]> {
    return this.userRepository.findAll();
  }

  async findById(id: string): Promise<IUser | null> {
    return this.userRepository.findById(id);
  }

  async findByEmail(email: string): Promise<IUser | null> {
    return this.userRepository.findByEmail(email);
  }

  async update(id: string, data: UpdateUserDto): Promise<IUser | null> {
    return this.userRepository.update(id, data as Partial<IUser>);
  }

  async delete(id: string): Promise<boolean> {
    return this.userRepository.delete(id);
  }
}

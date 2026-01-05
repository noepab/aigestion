// src/services/user.service.ts
import { v4 as uuidv4 } from 'uuid';
import { CreateUserDto, UpdateUserDto } from '../dto/dtoSchemas';

export interface User {
  id: string;
  name: string;
  email: string;
  password: string; // In real apps, hash this!
}

export class UserService {
  private users: User[] = [];

  async create(data: CreateUserDto): Promise<User> {
    const user: User = { id: uuidv4(), ...data };
    this.users.push(user);
    return user;
  }

  async findAll(): Promise<User[]> {
    return this.users;
  }

  async findById(id: string): Promise<User | null> {
    return this.users.find(u => u.id === id) || null;
  }

  async update(id: string, data: UpdateUserDto): Promise<User | null> {
    const user = await this.findById(id);
    if (!user) return null;
    Object.assign(user, data);
    return user;
  }

  async delete(id: string): Promise<boolean> {
    const index = this.users.findIndex(u => u.id === id);
    if (index === -1) return false;
    this.users.splice(index, 1);
    return true;
  }
}

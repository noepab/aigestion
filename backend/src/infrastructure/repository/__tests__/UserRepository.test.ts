// src/infrastructure/repository/__tests__/UserRepository.test.ts
import { UserRepository } from '../../repository/UserRepository';
import { IUser } from '../../../models/User';

describe('UserRepository', () => {
  let repo: UserRepository;

  beforeEach(() => {
    repo = new UserRepository();
  });

  it('should create and retrieve a user by id', async () => {
    const user: IUser = {
      id: 'custom-id',
      name: 'Alice',
      email: 'alice@example.com',
      password: 'hashed',
      role: 'user',
      isMfaEnabled: false,
      loginAttempts: 0,
      tokenVersion: 0,
      lastPasswordChange: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
      refreshTokens: [],
    } as IUser;
    await repo.create(user.id, user);
    const found = await repo.findById(user.id);
    expect(found).toEqual(user);
  });

  it('should find a user by email', async () => {
    const email = 'bob@example.com';
    const user = await repo.findByEmail(email);
    expect(user).not.toBeNull();
    expect(user?.email).toBe(email);
  });

  it('should update a user', async () => {
    const user = await repo.findByEmail('test@example.com');
    expect(user).not.toBeNull();
    const updated = await repo.update(user!.id, { name: 'Updated Name' });
    expect(updated?.name).toBe('Updated Name');
  });

  it('should delete a user', async () => {
    const user = await repo.findByEmail('test@example.com');
    expect(user).not.toBeNull();
    const result = await repo.delete(user!.id);
    expect(result).toBe(true);
    const after = await repo.findById(user!.id);
    expect(after).toBeNull();
  });
});

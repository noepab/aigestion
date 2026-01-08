import bcrypt from 'bcryptjs';
import { Request, Response } from 'express-serve-static-core';
import jwt from 'jsonwebtoken';
import { mockRequest as createMockRequest, mockResponse as createMockResponse } from '../../../../tests/__mocks__/express';

import { getMe, login, register, refresh, logout } from '../../controllers/auth.controller';
import { User } from '../../models/User';
import { logger } from '../../utils/logger';
import { container } from '../../config/inversify.config';
import { TYPES } from '../../types';
import { AuthService } from '../../services/auth.service';
import { IUserRepository } from '../../infrastructure/repository/UserRepository';

// Mock models and utilities
jest.mock('../../models/User', () => {
  const mockUserConstructor = jest.fn();
  (mockUserConstructor as any).findOne = jest.fn();
  return { User: mockUserConstructor };
});
jest.mock('jsonwebtoken');
jest.mock('bcryptjs');
jest.mock('../../utils/logger', () => ({
  logger: {
    error: jest.fn(),
    info: jest.fn(),
  },
}));

// Mock crypto
const mockRandomUUID = jest.fn().mockReturnValue('mock-uuid');
Object.defineProperty(global, 'crypto', {
  value: {
    randomUUID: mockRandomUUID
  }
});

describe('Auth Controller', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let jsonMock: jest.Mock;
  let statusMock: jest.Mock;
  let cookieMock: jest.Mock;
  let clearCookieMock: jest.Mock;

  // Mock Repository
  const mockUserRepo = {
    create: jest.fn(),
    findByEmail: jest.fn(),
    findById: jest.fn(),
    findAll: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  };

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();

    jsonMock = jest.fn();
    statusMock = jest.fn().mockReturnThis();
    cookieMock = jest.fn().mockReturnThis();
    clearCookieMock = jest.fn().mockReturnThis();
    mockResponse = createMockResponse({
      status: statusMock,
      json: jsonMock,
      cookie: cookieMock,
      clearCookie: clearCookieMock
    });

    mockUserRepo.create.mockReset();
    mockUserRepo.findByEmail.mockReset();

    // Setup Container Mocks
    container.snapshot();
    container.unbind(TYPES.UserRepository);
    container.bind<any>(TYPES.UserRepository).toConstantValue(mockUserRepo);

    // Force AuthService to reload with new Repo mock
    container.unbind(TYPES.AuthService);
    container.bind<AuthService>(TYPES.AuthService).to(AuthService).inSingletonScope();
  });

  afterEach(() => {
    container.restore();
    });

  describe('register', () => {
    const registerHandler = Array.isArray(register) ? register[register.length - 1] : register;

    it('should return 400 if user already exists', async () => {
      mockRequest = createMockRequest({ body: { email: 'exists@example.com', password: 'AIGestion123!', name: 'Test' } });

        // Repo finds user
        mockUserRepo.findByEmail.mockResolvedValue({ email: 'exists@example.com' });

        const next = jest.fn();
        await registerHandler(mockRequest as Request, mockResponse as Response, next);

        expect(next).toHaveBeenCalledWith(expect.objectContaining({
          message: 'El correo electrónico ya está registrado',
          statusCode: 400
        }));
      });

    it('should register a new user successfully', async () => {
      const userData = { email: 'new@example.com', password: 'AIGestion123!', name: 'New User' };
        mockRequest = createMockRequest({ body: userData, requestId: 'req_123' } as any);

        // Repo does not find user
        mockUserRepo.findByEmail.mockResolvedValue(null);

        (bcrypt.genSalt as jest.Mock).mockResolvedValue('salt');
        (bcrypt.hash as jest.Mock).mockResolvedValue('hashed_password');
        (jwt.sign as jest.Mock).mockReturnValue('fake_token');

        const mockUserInstance = {
          _id: 'user_id',
          email: userData.email,
          name: userData.name,
          role: 'user',
          save: jest.fn().mockResolvedValue(true),
            toObject: jest.fn().mockReturnValue({ _id: 'user_id', email: userData.email, name: userData.name, role: 'user', password: 'hashed_password' }),
            refreshTokens: []
          };

        // Mock User constructor to return our instance (AuthService does new User)
        (User as unknown as jest.Mock).mockImplementation(() => mockUserInstance);

        // Repo create returns user (AuthService logic currently assumes create returns void or user but relies on user instance created before)
        // AuthService calls repo.create(user)
        mockUserRepo.create.mockResolvedValue(mockUserInstance);

        const next = jest.fn();
        await registerHandler(mockRequest as Request, mockResponse as Response, next);

        // Expect successful response
        expect(statusMock).toHaveBeenCalledWith(201);
        expect(jsonMock).toHaveBeenCalledWith(expect.objectContaining({
            data: expect.objectContaining({
              token: 'fake_token'
            })
          }));

        // Verify repo usage
        expect(mockUserRepo.findByEmail).toHaveBeenCalledWith(userData.email);
        expect(mockUserRepo.create).toHaveBeenCalled();
      });
  });

  describe('login', () => {
    const loginHandler = Array.isArray(login) ? login[login.length - 1] : login;

    it('should return 401 for invalid credentials (user not found)', async () => {
      mockRequest = createMockRequest({ body: { email: 'wrong@example.com', password: 'AIGestion123!' } });

      // Repo returns null
      mockUserRepo.findByEmail.mockResolvedValue(null);

      const next = jest.fn();
      await loginHandler(mockRequest as Request, mockResponse as Response, next);

        expect(next).toHaveBeenCalledWith(expect.objectContaining({
          message: 'Credenciales inválidas',
          statusCode: 401
        }));
      });

    it('should lock account after 5 failed attempts', async () => {
      const mockUser = {
        email: 'test@example.com',
        password: 'hashed_password',
        loginAttempts: 4,
          lockUntil: undefined,
          save: jest.fn().mockResolvedValue(true),
          refreshTokens: []
        };

      mockRequest = createMockRequest({ body: { email: 'test@example.com', password: 'wrongPassword123!' } });

        // Repo returns user
        mockUserRepo.findByEmail.mockResolvedValue(mockUser);

        // Bcrypt compare fails
        (bcrypt.compare as jest.Mock).mockResolvedValue(false);

        const next = jest.fn();
        await loginHandler(mockRequest as Request, mockResponse as Response, next);

        // Verify logic
        expect(mockUser.loginAttempts).toBe(0); // Reset for locking (AuthService sets to 0 when locking)
        expect((mockUser as any).lockUntil).toBeDefined();
        expect(mockUser.save).toHaveBeenCalled();
        expect(next).toHaveBeenCalledWith(expect.objectContaining({
          message: 'Credenciales inválidas',
          statusCode: 401
        }));
      });

    it('should login successfully and reset attempts', async () => {
      const mockUser = {
        _id: 'user_id',
        email: 'test@example.com',
        password: 'hashed_password',
        role: 'user',
        loginAttempts: 2,
        save: jest.fn().mockResolvedValue(true),
          toObject: jest.fn().mockReturnValue({ _id: 'user_id', email: 'test@example.com', role: 'user' }),
          refreshTokens: []
        };

      mockRequest = createMockRequest({ body: { email: 'test@example.com', password: 'AIGestion123!' }, ip: '1.2.3.4', headers: {}, requestId: 'req_123' } as any);

        mockUserRepo.findByEmail.mockResolvedValue(mockUser);

        (bcrypt.compare as jest.Mock).mockResolvedValue(true);
        (jwt.sign as jest.Mock).mockReturnValue('auth_token');

        const next = jest.fn();
        await loginHandler(mockRequest as Request, mockResponse as Response, next);

        expect(mockUser.loginAttempts).toBe(0);
        expect(mockUser.save).toHaveBeenCalled(); // Reset attempts
        expect(statusMock).toHaveBeenCalledWith(200);
        expect(jsonMock).toHaveBeenCalledWith(expect.objectContaining({
            data: expect.objectContaining({ token: 'auth_token' })
          }));
      });
  });
});

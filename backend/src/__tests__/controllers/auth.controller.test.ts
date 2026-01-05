import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { register, login, getMe } from '../../controllers/auth.controller';
import { User } from '../../models/User';
import { logger } from '../../utils/logger';

// Mock models and utilities
jest.mock('../../models/User');
jest.mock('jsonwebtoken');
jest.mock('bcryptjs');
jest.mock('../../utils/logger', () => ({
  logger: {
    error: jest.fn(),
    info: jest.fn(),
  },
}));

describe('Auth Controller', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let jsonMock: jest.Mock;
  let statusMock: jest.Mock;

  beforeEach(() => {
    jsonMock = jest.fn();
    statusMock = jest.fn().mockReturnThis();
    mockResponse = {
      status: statusMock,
      json: jsonMock,
    };
    jest.clearAllMocks();
  });

  describe('register', () => {
    it('should return 400 if required fields are missing', async () => {
      mockRequest = { body: { email: 'test@example.com' } };
      await register(mockRequest as Request, mockResponse as Response);
      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith(expect.objectContaining({
        success: false,
        message: 'Por favor, proporcione email, contraseña y nombre'
      }));
    });

    it('should return 400 if user already exists', async () => {
      mockRequest = { body: { email: 'exists@example.com', password: 'password', name: 'Test' } };
      (User.findOne as jest.Mock).mockResolvedValue({ email: 'exists@example.com' });

      await register(mockRequest as Request, mockResponse as Response);
      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith(expect.objectContaining({
        message: 'El correo electrónico ya está registrado'
      }));
    });

    it('should register a new user successfully', async () => {
      const userData = { email: 'new@example.com', password: 'password', name: 'New User' };
      mockRequest = { body: userData };

      (User.findOne as jest.Mock).mockResolvedValue(null);
      (bcrypt.genSalt as jest.Mock).mockResolvedValue('salt');
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashed_password');
      (jwt.sign as jest.Mock).mockReturnValue('fake_token');

      const mockUserInstance = {
        _id: 'user_id',
        email: userData.email,
        name: userData.name,
        role: 'user',
        save: jest.fn().mockResolvedValue(true),
        toObject: jest.fn().mockReturnValue({ _id: 'user_id', email: userData.email, name: userData.name, role: 'user', password: 'hashed_password' })
      };

      (User as unknown as jest.Mock).mockImplementation(() => mockUserInstance);

      await register(mockRequest as Request, mockResponse as Response);

      expect(statusMock).toHaveBeenCalledWith(201);
      expect(jsonMock).toHaveBeenCalledWith(expect.objectContaining({
        success: true,
        data: expect.objectContaining({
          token: 'fake_token'
        })
      }));
    });
  });

  describe('login', () => {
    it('should return 401 for invalid credentials', async () => {
      mockRequest = { body: { email: 'wrong@example.com', password: 'wrong' } };
      (User.findOne as jest.Mock).mockReturnValue({
        select: jest.fn().mockResolvedValue(null)
      });

      await login(mockRequest as Request, mockResponse as Response);
      expect(statusMock).toHaveBeenCalledWith(401);
    });

    it('should lock account after 5 failed attempts', async () => {
      const mockUser = {
        email: 'test@example.com',
        password: 'hashed_password',
        loginAttempts: 4,
        save: jest.fn().mockResolvedValue(true),
      };

      mockRequest = { body: { email: 'test@example.com', password: 'wrong' } };
      (User.findOne as jest.Mock).mockReturnValue({
        select: jest.fn().mockResolvedValue(mockUser)
      });
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      await login(mockRequest as Request, mockResponse as Response);

      expect(mockUser.loginAttempts).toBe(0); // Reset for locking
      expect((mockUser as any).lockUntil).toBeDefined();
      expect(statusMock).toHaveBeenCalledWith(401);
    });

    it('should login successfully and reset attempts', async () => {
      const mockUser = {
        _id: 'user_id',
        email: 'test@example.com',
        password: 'hashed_password',
        role: 'user',
        loginAttempts: 2,
        save: jest.fn().mockResolvedValue(true),
        toObject: jest.fn().mockReturnValue({ _id: 'user_id', email: 'test@example.com', role: 'user' })
      };

      mockRequest = { body: { email: 'test@example.com', password: 'correct' }, ip: '1.2.3.4', headers: {} };
      (User.findOne as jest.Mock).mockReturnValue({
        select: jest.fn().mockResolvedValue(mockUser)
      });
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      (jwt.sign as jest.Mock).mockReturnValue('auth_token');

      await login(mockRequest as Request, mockResponse as Response);

      expect(mockUser.loginAttempts).toBe(0);
      expect(statusMock).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith(expect.objectContaining({
        success: true,
        data: expect.objectContaining({ token: 'auth_token' })
      }));
    });
  });
});

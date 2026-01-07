import 'reflect-metadata';
import { Verify2FAUseCase } from '../Verify2FAUseCase';
import { TwoFactorService } from '../../services/twoFactor.service';
import { User } from '../../models/User';
import { AppError } from '../../utils/errors';

jest.mock('../../services/twoFactor.service');
jest.mock('../../models/User');

const MockTwoFactorService = TwoFactorService as jest.MockedClass<typeof TwoFactorService>;
const MockUser = User as jest.MockedClass<typeof User>;

describe('Verify2FAUseCase', () => {
  const userId = '12345';
  const token = '123456';
  const secret = 'SECRET';

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should throw if user not found', async () => {
    MockUser.findById = jest.fn().mockResolvedValue(null);
    const useCase = new Verify2FAUseCase(new MockTwoFactorService());
    await expect(useCase.execute(userId, token)).rejects.toThrow(AppError);
  });

  it('should throw if 2FA not enabled', async () => {
    const userMock = { twoFactorSecret: undefined } as any;
    MockUser.findById = jest.fn().mockResolvedValue(userMock);
    const useCase = new Verify2FAUseCase(new MockTwoFactorService());
    await expect(useCase.execute(userId, token)).rejects.toThrow(AppError);
  });

  it('should verify token and enable MFA', async () => {
    const saveMock = jest.fn().mockResolvedValue(undefined);
    const userMock = {
      twoFactorSecret: secret,
      isMfaEnabled: false,
      save: saveMock,
    } as any;
    MockUser.findById = jest.fn().mockResolvedValue(userMock);
    const mockServiceInstance = new MockTwoFactorService();
    mockServiceInstance.verifyToken = jest.fn().mockReturnValue(true);

    const useCase = new Verify2FAUseCase(mockServiceInstance);
    await useCase.execute(userId, token);
    expect(mockServiceInstance.verifyToken).toHaveBeenCalledWith(secret, token);
    expect(userMock.isMfaEnabled).toBe(true);
    expect(saveMock).toHaveBeenCalled();
  });
});

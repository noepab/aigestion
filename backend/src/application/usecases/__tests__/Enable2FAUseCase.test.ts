import 'reflect-metadata';
import { Enable2FAUseCase } from '../Enable2FAUseCase';
import { TwoFactorService } from '../../../services/twoFactor.service';
import { User } from '../../../models/User';
import { AppError } from '../../../utils/errors';

jest.mock('../../../services/twoFactor.service');
jest.mock('../../../models/User');

const MockTwoFactorService = TwoFactorService as jest.MockedClass<typeof TwoFactorService>;
const MockUser = User as jest.MockedClass<typeof User>;

describe('Enable2FAUseCase', () => {
  const userId = '12345';
  const email = 'test@example.com';
  const secret = 'SECRET';
  const qrCode = 'data:image/png;base64,QR';

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should throw if user not found', async () => {
    MockUser.findById = jest.fn().mockResolvedValue(null);
    const useCase = new Enable2FAUseCase(new MockTwoFactorService());
    await expect(useCase.execute(userId)).rejects.toThrow(AppError);
  });

  it('should generate secret and QR code and save user', async () => {
    const saveMock = jest.fn().mockResolvedValue(undefined);
    const userMock = {
      _id: userId,
      email,
      save: saveMock,
    } as any;
    MockUser.findById = jest.fn().mockResolvedValue(userMock);
    const mockServiceInstance = new MockTwoFactorService();
    mockServiceInstance.generateSecret = jest.fn().mockReturnValue(secret);
    mockServiceInstance.generateQrCode = jest.fn().mockResolvedValue(qrCode);

    const useCase = new Enable2FAUseCase(mockServiceInstance);
    const result = await useCase.execute(userId);
    expect(result).toEqual({ secret, qrCode });
    expect(mockServiceInstance.generateSecret).toHaveBeenCalledWith(email);
    expect(mockServiceInstance.generateQrCode).toHaveBeenCalledWith(secret, email);
    expect(userMock.twoFactorSecret).toBe(secret);
    expect(userMock.isMfaEnabled).toBe(false);
    expect(saveMock).toHaveBeenCalled();
  });
});

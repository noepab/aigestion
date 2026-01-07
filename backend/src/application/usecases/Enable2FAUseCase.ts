import { injectable, inject } from 'inversify';
import { TYPES } from '../../types';
import { User } from '../../models/User';
import { TwoFactorService } from '../../services/twoFactor.service';
import { AppError } from '../../utils/errors';

@injectable()
export class Enable2FAUseCase {
    constructor(
        @inject(TYPES.TwoFactorService) private twoFactorService: TwoFactorService,
    ) { }

    async execute(userId: string): Promise<{ secret: string; qrCode: string }> {
        const user = await User.findById(userId);
        if (!user) {
            throw new AppError('User not found', 404, 'USER_NOT_FOUND');
        }
        const secret = this.twoFactorService.generateSecret(user.email);
        const qrCode = await this.twoFactorService.generateQrCode(secret, user.email);
        user.twoFactorSecret = secret;
        user.isMfaEnabled = false; // will be true after verification
        await user.save();
        return { secret, qrCode };
    }
}

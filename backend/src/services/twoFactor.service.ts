import { injectable } from 'inversify';
import { authenticator } from 'otplib';
import QRCode from 'qrcode';

@injectable()
export class TwoFactorService {
  // Generate a new secret for a user
  generateSecret(_email: string): string {
    return authenticator.generateSecret();
  }

  // Return a data‑URL QR code image for the secret (compatible with Google Authenticator)
  async generateQrCode(secret: string, email: string): Promise<string> {
    const otpauth = authenticator.keyuri(email, 'AIGestion', secret);
    return QRCode.toDataURL(otpauth);
  }

  // Verify a provided OTP code against the stored secret
  verifyToken(secret: string, token: string): boolean {
    return authenticator.check(token, secret);
  }
}

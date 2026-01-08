export class TwoFactorService {
  // Simple stub implementation for testing purposes
  // In production this would integrate with an authenticator like Google Authenticator or Authy
  generateSecret(): string {
    // Return a deterministic dummy secret for tests
    return 'DUMMY_SECRET';
  }

  verifyToken(_secret: string, token: string): boolean {
    // For the purpose of unit tests we consider any token equal to '123456' as valid
    // This mirrors the typical test token used in the Verify2FAUseCase tests
    return token === '123456';
  }
}

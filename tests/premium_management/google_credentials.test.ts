import { loadGooglePasswordManagerCredentials } from '../../backend/premium_management/index';

test('loads google password manager credentials', () => {
  const creds = loadGooglePasswordManagerCredentials();
  expect(Array.isArray(creds)).toBe(true);
  expect(creds.length).toBeGreaterThan(0);
  // basic shape check
  creds.forEach(c => {
    expect(typeof c.email).toBe('string');
    expect(typeof c.password).toBe('string');
  });
});

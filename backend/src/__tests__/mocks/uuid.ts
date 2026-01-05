import { jest } from '@jest/globals';

export const v4 = jest.fn(() => '12345678-1234-1234-1234-123456789012');
export const v1 = jest.fn(() => 'test-uuid-v1');

export default {
  v4,
  v1,
};

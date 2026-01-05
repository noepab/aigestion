import type { Config } from '@jest/types';

const config: Config.InitialOptions = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src'],
  testMatch: ['**/__tests__/**/*.test.ts'],
  moduleFileExtensions: ['ts', 'js', 'json', 'node'],
  collectCoverage: true,
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov'],
  coveragePathIgnorePatterns: ['/node_modules/', '/dist/', '/src/__tests__/'],
  setupFilesAfterEnv: ['<rootDir>/src/__tests__/setup.ts'],
  setupFiles: ['<rootDir>/src/__tests__/env-setup.ts'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^redis$': '<rootDir>/src/__tests__/mocks/redis.ts',
    '^hpp$': '<rootDir>/src/__tests__/mocks/hpp.ts',
    '^formidable$': '<rootDir>/node_modules/formidable/dist/index.cjs',
    '^fast-safe-stringify$': '<rootDir>/node_modules/fast-safe-stringify/index.js',
    '^.*?/cache/redis$': '<rootDir>/src/__tests__/mocks/redis.ts',
    '^.*?/cache/redisCache$': '<rootDir>/src/__tests__/mocks/redis.ts',
    '^.*?/queue/rabbitmq$': '<rootDir>/src/__tests__/mocks/rabbitmq.ts',
    '^uuid$': '<rootDir>/src/__tests__/mocks/uuid.ts',
  },
  transformIgnorePatterns: ['node_modules/(?!(.pnpm)/)'],
  transform: {
    '^.+\\.tsx?$': [
      'ts-jest',
      {
        tsconfig: 'tsconfig.test.json',
        isolatedModules: true, // Speed up tests and avoid type checking freezes
      },
    ],
  },
  testTimeout: 10000,
  verbose: true,
  forceExit: true,
  detectOpenHandles: true,
};

export default config;

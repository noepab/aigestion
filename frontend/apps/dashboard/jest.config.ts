// jest.config.ts
import type { Config } from 'jest';

const config: Config = {
    preset: 'ts-jest',
    testEnvironment: 'jsdom',
    moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
    setupFilesAfterEnv: ['<rootDir>/src/setupTests.ts'],
    transform: {
        '^.+\\.(ts|tsx)$': 'ts-jest',
    },
    // Transform ESM modules like uuid that use ES syntax
    transformIgnorePatterns: ['node_modules/(?!uuid)'],
    // Map TypeScript path alias @shared/* to the shared folder
    moduleNameMapper: {
        '^@shared/(.*)$': '<rootDir>/../../shared/$1',
        '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
    },
    testMatch: ['**/__tests__/**/*.test.(ts|tsx)'],
};
export default config;

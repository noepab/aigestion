import { vi } from 'vitest';

// Shim Jest globals for compatibility
(global as any).jest = {
    fn: vi.fn,
    spyOn: vi.spyOn,
    mock: vi.mock,
    restoreAllMocks: vi.restoreAllMocks,
    clearAllMocks: vi.clearAllMocks,
    resetAllMocks: vi.resetAllMocks,
    useFakeTimers: vi.useFakeTimers,
    useRealTimers: vi.useRealTimers,
    setSystemTime: vi.setSystemTime,
    advanceTimersByTime: vi.advanceTimersByTime,
    requireActual: vi.importActual,
};

// Mock Redis Package
vi.mock('redis', () => ({
    createClient: vi.fn(() => ({
        connect: vi.fn().mockResolvedValue(undefined),
        on: vi.fn(),
        get: vi.fn().mockResolvedValue(null),
        set: vi.fn().mockResolvedValue('OK'),
        quit: vi.fn().mockResolvedValue('OK'),
        disconnect: vi.fn().mockResolvedValue('OK'),
    })),
}));

// Keeping local path mock just in case, but package mock should trump it
vi.mock('../cache/redis', () => ({
    getRedisClient: vi.fn(() => ({
        connect: vi.fn().mockResolvedValue(undefined),
        on: vi.fn(),
        get: vi.fn().mockResolvedValue(null),
        set: vi.fn().mockResolvedValue('OK'),
        quit: vi.fn().mockResolvedValue('OK'),
    })),
    getCache: vi.fn().mockResolvedValue(null),
    setCache: vi.fn().mockResolvedValue(true),
    closeRedis: vi.fn().mockResolvedValue(undefined),
}));

// Mock RabbitMQ
vi.mock('../queue/rabbitmq', () => ({
    getRabbitMQChannel: vi.fn(),
}));

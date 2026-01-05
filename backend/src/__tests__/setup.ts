console.log('🔵 [DEBUG] setup.ts: Starting...');
import { jest } from '@jest/globals';

// Mock redis module to avoid real connection in tests
jest.mock('redis', () => ({
  createClient: () => ({
    sendCommand: jest.fn().mockResolvedValue('OK'),
    connect: jest.fn().mockResolvedValue(undefined),
    disconnect: jest.fn().mockResolvedValue(undefined),
  }),
}));

// Mock Redis client to avoid real connections in tests
jest.mock('../cache/redis');

// Configuración global para los tests
// Hooks globales para Jest
afterEach(() => {
  jest.clearAllMocks();
});

// Mock de la conexión de Mongoose
// Mock de la conexión de Mongoose
const mockMongoose = {
  connection: {
    readyState: 1,
    db: {
      command: jest.fn().mockImplementation(() => Promise.resolve({ ok: 1 })),
      collections: jest.fn().mockImplementation(() => Promise.resolve([])),
      listCollections: jest
        .fn()
        .mockReturnValue({ toArray: jest.fn().mockImplementation(() => Promise.resolve([])) }),
    },
    host: 'localhost',
    name: 'test-db',
    version: '6.0.0',
    close: jest.fn(),
  },
  models: {},
  version: '6.0.0',
  mongo: { version: '5.0.0' },
  connect: jest.fn().mockImplementation(() => Promise.resolve()),
  Schema: class {
    methods: any = {};
    statics: any = {};
    pre() {}
    post() {}
    plugin() {}
    set() {}
    get() {}
    virtual() {}
    index() { }
  },
  model: jest.fn(),
  disconnect: jest.fn(),
};

jest.mock('mongoose', () => mockMongoose);

// Mock robusto de process.memoryUsage compatible con Node.js >=18
const originalMemoryUsage = process.memoryUsage;
const mockMemoryUsage = jest.fn().mockReturnValue({
  rss: 12345678,
  heapTotal: 1234567,
  heapUsed: 123456,
  external: 12345,
  arrayBuffers: 1234,
});
Object.defineProperty(process, 'memoryUsage', {
  value: mockMemoryUsage,
  configurable: true,
});

// Restaurar la implementación original después de los tests
afterAll(() => {
  process.memoryUsage = originalMemoryUsage;
});

export { mockMongoose };

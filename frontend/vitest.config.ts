import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

process.env.NODE_ENV = 'development';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export default defineConfig({
  root: __dirname,
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: [resolve(__dirname, 'vitest.setup.ts')],
    pool: 'forks',
    poolOptions: {
      forks: {
        execArgv: ['--no-webstorage']
      }
    },
    env: {
      RTL_SKIP_AUTO_CLEANUP: 'true',
      NODE_ENV: 'development'
    },
    deps: {
      optimizer: {
        web: {
          enabled: false
        }
      }
    },
    coverage: {
      reporter: ['text', 'json', 'html'],
    },
    include: ['**/*.{test,spec}.{ts,tsx,js,jsx}'],
    exclude: ['**/node_modules/**', '**/dist/**', '**/cypress/**', '**/.{idea,git,cache,output,temp}/**'],
  },
});

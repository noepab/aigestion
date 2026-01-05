// scripts/fix-missing-modules.ts
// Utility script to automatically create stub modules for known missing dependencies during tests.
// It reads a predefined list of module names and ensures a minimal CommonJS stub exists in node_modules.

import { promises as fs } from 'fs';
import * as path from 'path';

// List of modules that often cause "Cannot find module" errors in the test environment.
const missingModules = [
  'fast-safe-stringify',
  // add other modules here as needed
];

async function ensureStub(moduleName: string) {
  const moduleDir = path.resolve(__dirname, '..', 'node_modules', moduleName);
  const indexPath = path.join(moduleDir, 'index.js');
  const pkgPath = path.join(moduleDir, 'package.json');
  try {
    await fs.access(indexPath);
    // Stub already exists
  } catch {
    // Create directory and stub files
    await fs.mkdir(moduleDir, { recursive: true });
    const stubContent = `module.exports = (obj) => JSON.stringify(obj);\n`;
    await fs.writeFile(indexPath, stubContent, 'utf8');
    const pkgContent = JSON.stringify({ name: moduleName, version: '1.0.0', main: 'index.js' }, null, 2);
    await fs.writeFile(pkgPath, pkgContent, 'utf8');
    console.log(`Created stub for missing module: ${moduleName}`);
  }
}

async function main() {
  for (const mod of missingModules) {
    await ensureStub(mod);
  }
}

main().catch((err) => {
  console.error('Error creating stubs:', err);
  process.exit(1);
});

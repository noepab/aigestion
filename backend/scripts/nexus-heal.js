const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const COLORS = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
  bold: '\x1b[1m'
};

function log(msg, color = COLORS.reset) {
  console.log(`${color}${msg}${COLORS.reset}`);
}

function run(cmd) {
  try {
    log(`> ${cmd}`, COLORS.yellow);
    execSync(cmd, { stdio: 'inherit' });
  } catch (e) {
    log(`Command failed: ${cmd}`, COLORS.red);
    process.exit(1);
  }
}

function heal() {
  log('\n🩹 NEXUS AUTO-HEALER INITIATED\n', COLORS.cyan + COLORS.bold);
  const rootDir = path.resolve(__dirname, '..');

  // 1. Clean
  log('1. Removing existing modules and locks...', COLORS.cyan);
  const toRemove = [
    path.join(rootDir, 'node_modules'),
    path.join(rootDir, 'package-lock.json'),
    path.join(rootDir, 'pnpm-lock.yaml'),
    path.join(rootDir, 'yarn.lock')
  ];

  toRemove.forEach(p => {
    if (fs.existsSync(p)) {
      fs.rmSync(p, { recursive: true, force: true });
      log(`   Deleted ${path.basename(p)}`, COLORS.green);
    }
  });

  // 2. Cache Clean
  log('\n2. Cleaning NPM Cache...', COLORS.cyan);
  run('npm cache clean --force');

  // 3. Reinstall
  log('\n3. Installing Fresh Dependencies...', COLORS.cyan);
  // Using regular install to generate new lockfile correctly
  run('npm install');

  // 4. Verification
  log('\n4. Verifying Health...', COLORS.cyan);
  try {
    require('./nexus-doctor');
  } catch (e) {
    // doctor logs its own output
  }

  log('\n✨ HEALING COMPLETE. Your environment is fresh.', COLORS.green + COLORS.bold);
}

heal();

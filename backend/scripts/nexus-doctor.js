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

function check() {
  log('\n🏥 NEXUS DEPENDENCY SENTINEL - DIAGNOSTIC TOOL\n', COLORS.cyan + COLORS.bold);
  let issues = 0;

  // 1. Check Node Version
  const nodeVersion = process.version;
  const majorVersion = parseInt(nodeVersion.slice(1).split('.')[0], 10);
  if (majorVersion < 18) {
    log(`[FAIL] Node Version: ${nodeVersion} (Required: >=18)`, COLORS.red);
    issues++;
  } else {
    log(`[PASS] Node Version: ${nodeVersion}`, COLORS.green);
  }

  // 2. Check key folders/files
  const rootDir = path.resolve(__dirname, '..');
  const criticalFiles = ['.env', 'package.json', 'tsconfig.json'];

  criticalFiles.forEach(file => {
    if (fs.existsSync(path.join(rootDir, file))) {
      log(`[PASS] Found ${file}`, COLORS.green);
    } else {
      log(`[FAIL] Missing ${file}`, COLORS.red);
      issues++;
    }
  });

  // 3. Check node_modules health
  const nodeModulesPath = path.join(rootDir, 'node_modules');
  if (!fs.existsSync(nodeModulesPath)) {
    log('[FAIL] node_modules not found. Run "npm install" or "npm run nexus:heal"', COLORS.red);
    issues++;
  } else {
    // Deep check specific binaries that failed before
    const tsxPath = path.join(nodeModulesPath, 'tsx');
    if (fs.existsSync(tsxPath)) {
      log('[PASS] tsx installed', COLORS.green);
    } else {
      log('[FAIL] tsx missing from node_modules', COLORS.red);
      issues++;
    }
  }

  log('\n---------------------------------------------------');
  if (issues === 0) {
    log('✨ SYSTEM HEALTHY. READY FOR CODING.', COLORS.green + COLORS.bold);
    process.exit(0);
  } else {
    log(`⚠ FOUND ${issues} ISSUES.`, COLORS.yellow + COLORS.bold);
    log('💡 Recommendation: Run "npm run nexus:heal" to fix everything automatically.', COLORS.cyan);
    process.exit(1);
  }
}

check();

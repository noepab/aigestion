
import chalk from 'chalk';
import { filesize } from 'filesize';
import fs from 'fs';
import { glob } from 'glob';
import { gzipSize } from 'gzip-size';
import path from 'path';

const LIMITS = {
  'index-*.js': 300 * 1024,      // 300KB
  'chunk-*.js': 400 * 1024,      // 400KB (Gzipped) for shared chunks
};

async function checkBundles() {
  console.log(chalk.blue.bold('\n📦 Checking bundle sizes...\n'));

  const distDir = path.resolve(process.cwd(), 'dist/assets/js');
  let hasErrors = false;

  for (const [pattern, limit] of Object.entries(LIMITS)) {
    const files = await glob(pattern, { cwd: distDir });

    if (files.length === 0) {
      console.warn(chalk.yellow(`⚠️  No files found for pattern: ${pattern}`));
      continue;
    }

    for (const file of files) {
      const filePath = path.join(distDir, file);
      const content = fs.readFileSync(filePath);
      const gzippedSize = await gzipSize(content);
      const sizeStr = filesize(gzippedSize);
      const limitStr = filesize(limit);

      if (gzippedSize > limit) {
        console.error(
          chalk.red(`❌ ${file}: ${sizeStr} (Limit: ${limitStr})`)
        );
        hasErrors = true;
      } else {
        console.log(
          chalk.green(`✅ ${file}: ${sizeStr} (Limit: ${limitStr})`)
        );
      }
    }
  }

  if (hasErrors) {
    console.error(chalk.red.bold('\n💥 Bundle size check failed!'));
    process.exit(1);
  } else {
    console.log(chalk.green.bold('\n✨ All bundles are within limits!'));
  }
}

checkBundles().catch(err => {
  console.error(err);
  process.exit(1);
});

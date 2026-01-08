/**
 * NEXUS V1 Optimization Setup Script
 * Aplica todas las optimizaciones de performance automáticamente
 */

import chalk from 'chalk';

import { cache } from '../utils/cacheManager';
import { applyIndexes } from '../utils/queryOptimizer';

console.log(chalk.blue.bold('\n🚀 NEXUS V1 Optimization Setup\n'));

/**
 * Initialize cache system
 */
async function initializeCache() {
  console.log(chalk.cyan('📦 Initializing cache system...'));

  try {
    // Test Redis connection
    const testKey = 'test:connection';
    await cache.set(testKey, { status: 'ok' }, { ttl: 10 });
    const result = await cache.get(testKey);

    if (result) {
      console.log(chalk.green('  ✅ Redis cache connected and working'));
      await cache.delete(testKey);
    } else {
      console.log(chalk.yellow('  ⚠️  Using memory cache (Redis unavailable)'));
    }

    // Display cache stats
    const stats = cache.getStats();
    console.log(chalk.gray(`  📊 Cache stats: ${JSON.stringify(stats, null, 2)}`));

    return true;
  } catch (error) {
    console.log(chalk.red('  ❌ Cache initialization failed:'), error);
    return false;
  }
}

/**
 * Apply database indexes
 */
async function setupDatabaseIndexes() {
  console.log(chalk.cyan('\n📊 Setting up database indexes...'));

  try {
    // Import models
    const models: Record<string, any> = {};

    try {
      // Dynamically import models if they exist
      const userModule = await import('../models/User.js').catch(() => null);
      if (userModule?.User) {
        models.User = userModule.User;
      }
    } catch (e) {
      console.log(chalk.gray('  ℹ️  User model not found, skipping'));
    }

    try {
      const projectModule = await import('../models/Project.js').catch(() => null);
      if (projectModule?.Project) {
        models.Project = projectModule.Project;
      }
    } catch (e) {
      console.log(chalk.gray('  ℹ️  Project model not found, skipping'));
    }

    if (Object.keys(models).length > 0) {
      await applyIndexes(models);
      console.log(chalk.green(`  ✅ Indexes applied for ${Object.keys(models).length} models`));
    } else {
      console.log(chalk.yellow('  ⚠️  No models found, skipping index creation'));
    }

    return true;
  } catch (error) {
    console.log(chalk.red('  ❌ Database index setup failed:'), error);
    return false;
  }
}

/**
 * Warm cache with critical data
 */
async function warmCache() {
  console.log(chalk.cyan('\n🔥 Warming cache with critical data...'));

  try {
    // Example: Warm with frequently accessed data
    await cache.warm([
      {
        key: 'config:app',
        value: {
          name: 'NEXUS V1',
          version: '3.0.0',
          environment: process.env.NODE_ENV || 'development',
        },
        options: { ttl: 3600, tags: ['config'] },
      },
      {
        key: 'stats:initialized',
        value: {
          timestamp: new Date().toISOString(),
          status: 'ready',
        },
        options: { ttl: 300, tags: ['stats'] },
      },
    ]);
    console.log(chalk.green('  ✅ Cache warmed successfully'));

    return true;
  } catch (error) {
    console.log(chalk.red('  ❌ Cache warming failed:'), error);
    return false;
  }
}

/**
 * Display optimization summary
 */
function displaySummary(results: Record<string, boolean>) {
  console.log(chalk.blue.bold('\n📋 Optimization Summary\n'));

  const items = [
    { name: 'Cache System', status: results.cache },
    { name: 'Database Indexes', status: results.indexes },
    { name: 'Cache Warming', status: results.warming },
  ];

  items.forEach(item => {
    const icon = item.status ? '✅' : '❌';
    const color = item.status ? chalk.green : chalk.red;
    console.log(color(`  ${icon} ${item.name}`));
  });

  const allSuccess = Object.values(results).every(v => v);

  if (allSuccess) {
    console.log(chalk.green.bold('\n🎉 All optimizations applied successfully!\n'));
    console.log(chalk.cyan('Next steps:'));
    console.log(chalk.gray('  1. Monitor performance: curl http://localhost:3000/health'));
    console.log(chalk.gray('  2. Check cache stats: curl http://localhost:3000/api/stats/cache'));
    console.log(chalk.gray('  3. View query stats: curl http://localhost:3000/api/stats/queries'));
    console.log(chalk.gray('\n  See QUICK_OPTIMIZATION_GUIDE.md for more details\n'));
  } else {
    console.log(chalk.yellow.bold('\n⚠️  Some optimizations failed. Check logs above.\n'));
  }
}

/**
 * Run all optimizations
 */
async function runOptimizations() {
  const results = {
    cache: await initializeCache(),
    indexes: await setupDatabaseIndexes(),
    warming: await warmCache(),
  };

  displaySummary(results);

  // Close cache connection
  await cache.close();

  process.exit(results.cache && results.indexes ? 0 : 1);
}

// Run if called directly
if (require.main === module) {
  runOptimizations().catch(error => {
    console.error(chalk.red('\n❌ Optimization setup failed:'), error);
    process.exit(1);
  });
}

export { runOptimizations };

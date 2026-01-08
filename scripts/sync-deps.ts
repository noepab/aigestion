import fs from 'fs';
import path from 'path';

const rootDir = process.cwd();
const appsDir = path.join(rootDir, 'frontend/apps');
const sharedDir = path.join(rootDir, 'frontend/shared');

const getPackageJson = (dir: string) => {
  const p = path.join(dir, 'package.json');
  return JSON.parse(fs.readFileSync(p, 'utf-8'));
};

const syncDependencies = () => {
  console.log('🔄 Syncing dependencies across monorepo...');

  const sharedPkg = getPackageJson(sharedDir);
  const sharedDeps = { ...sharedPkg.dependencies, ...sharedPkg.devDependencies };

  const apps = fs.readdirSync(appsDir).filter(f => fs.statSync(path.join(appsDir, f)).isDirectory());

  apps.forEach(app => {
    const appPath = path.join(appsDir, app);
    const appPkgPath = path.join(appPath, 'package.json');

    if (!fs.existsSync(appPkgPath)) return;

    const appPkg = JSON.parse(fs.readFileSync(appPkgPath, 'utf-8'));
    let changed = false;

    // Sync versions from shared
    ['dependencies', 'devDependencies'].forEach(depType => {
      if (!appPkg[depType]) return;

      Object.keys(appPkg[depType]).forEach(dep => {
        if (sharedDeps[dep] && appPkg[depType][dep] !== sharedDeps[dep]) {
          console.log(`[${app}] Updating ${dep}: ${appPkg[depType][dep]} -> ${sharedDeps[dep]}`);
          appPkg[depType][dep] = sharedDeps[dep];
          changed = true;
        }
      });
    });

    if (changed) {
      fs.writeFileSync(appPkgPath, JSON.stringify(appPkg, null, 2) + '\n');
      console.log(`✅ Updated ${app}/package.json`);
    } else {
      console.log(`✨ ${app} is up to date.`);
    }
  });
};

syncDependencies();

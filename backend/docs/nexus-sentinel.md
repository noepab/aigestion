# 🛡️ NEXUS Sentinel: Dependency Management System

**Version**: 1.0.0
**Date**: January 2026

## Overview
Nexus Sentinel is a custom-built toolchain designed to eliminate "dependency hell" and environment inconsistencies in the NEXUS V1 project. It consists of two powerful scripts: **Doctor** and **Healer**.

## 🩺 Nexus Doctor
**Command**: `npm run nexus:doctor`

The Doctor performs an instant diagnostic check of the development environment. It validates:
- **Node.js Runtime**: Ensures version compatibility (>=18.0.0).
- **Critical Configuration**: Checks for `.env`, `package.json`, and `tsconfig.json`.
- **Dependency Health**: Scans `node_modules` for critical binaries (e.g., `tsx`) that are prone to corruption.

**Usage**: Run immediately after cloning or whenever the server fails to start.

## 🩹 Nexus Healer
**Command**: `npm run nexus:heal`

The Healer is an automated recovery protocol. When invoked, it performs a "Scorched Earth" cleaning and restoration:
1. **Purge**: Forcefully deletes `node_modules`, `package-lock.json`, and local caches.
2. **Sanitize**: Cleans the global NPM cache.
3. **Restoration**: Performs a fresh standard `npm install` to generate a healthy lockfile.
4. **Verification**: Automatically triggers the *Doctor* to verify the fix.

**Usage**: Use this command if you encounter `MODULE_NOT_FOUND`, corruption errors, or inexplicable runtime crashes.

## Integration
These scripts are integrated directly into `package.json` and are part of the standard developer workflow.

```json
"scripts": {
  "nexus:doctor": "node scripts/nexus-doctor.js",
  "nexus:heal": "node scripts/nexus-heal.js"
}
```

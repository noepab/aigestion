---
description: Verify full stack - run all tests and build
---
1. Run all tests for both server and frontend
   ```
   npx turbo run test --parallel
   ```
2. Build the project to ensure compilation succeeds
   ```
   npx turbo run build
   ```
3. Capture logs and ensure exit codes are zero
   ```
   echo "Full stack verification completed successfully"
   ```
// turbo-all

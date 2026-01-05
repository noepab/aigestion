module.exports = {
  root: true,
  parser: '@typescript-eslint/parser',
  parserOptions: {
    // Point to the tsconfig that defines the project files
    project: './tsconfig.json',
    tsconfigRootDir: __dirname,
  },
  plugins: ['@typescript-eslint'],
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    // Turns off rules that conflict with Prettier
    'prettier',
  ],
  env: {
    node: true,
    jest: true,
  },
  // You can adjust/disable rules that generate noise here.
  rules: {
    // Example: allow unused variables that start with _
    '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
    // Example: turn off the rule that forces explicit return types on functions
    '@typescript-eslint/explicit-function-return-type': 'off',
  },
};

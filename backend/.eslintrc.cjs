module.exports = {
  root: true,
  parser: '@typescript-eslint/parser',
  parserOptions: {
    project: './tsconfig.json',
    tsconfigRootDir: __dirname,
  },
  env: { node: true, jest: true },
  extends: ['eslint:recommended', 'prettier'],
  rules: {},
};

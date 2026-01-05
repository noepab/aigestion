module.exports = {
  testEnvironment: "node",
  roots: ["<rootDir>/src"],
  moduleFileExtensions: ["js", "ts", "jsx", "tsx", "json"],
  transform: {
    "^.+\\.(ts|tsx)$": "ts-jest",
  },
};

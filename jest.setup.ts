// jest.setup.ts
import '@testing-library/jest-dom';
try {
    const matchers = require('jest-extended');
    expect.extend(matchers);
} catch (e) {
    // jest-extended not found or not needed in this context
}
// Polyfill TextEncoder/TextDecoder for environments where they are missing
// TextEncoder polyfills moved to jest.polyfills.js loaded via setupFiles

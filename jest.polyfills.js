// jest.polyfills.js
// Polyfill TextEncoder/TextDecoder and setImmediate for Jest environment
if (typeof TextEncoder === 'undefined') {
  const { TextEncoder, TextDecoder } = require('util');
  global.TextEncoder = TextEncoder;
  global.TextDecoder = TextDecoder;
}
if (typeof setImmediate === 'undefined') {
  const { setImmediate } = require('timers');
  global.setImmediate = setImmediate;
}

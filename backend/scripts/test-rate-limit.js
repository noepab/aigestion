#!/usr/bin/env node
/**
 * Rate Limiting Test Script
 *
 * Este script prueba el sistema de rate limiting del servidor NEXUS V1
 * enviando múltiples requests a diferentes endpoints.
 */

const http = require('http');

const BASE_URL = process.env.API_URL || 'http://localhost:5000';
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

// Helper function to make HTTP requests
function makeRequest(path, method = 'POST', body = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE_URL);
    const options = {
      hostname: url.hostname,
      port: url.port || 5000,
      path: url.pathname,
      method: method,
      headers: {
        'Content-Type': 'application/json',
      },
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        resolve({
          status: res.statusCode,
          headers: res.headers,
          body: data,
        });
      });
    });

    req.on('error', (err) => {
      reject(err);
    });

    if (body) {
      req.write(JSON.stringify(body));
    }
    req.end();
  });
}

// Display rate limit headers
function displayRateLimitInfo(headers, requestNum) {
  const limit = headers['ratelimit-limit'];
  const remaining = headers['ratelimit-remaining'];
  const reset = headers['ratelimit-reset'];

  if (limit) {
    console.log(
      `${colors.cyan}Request #${requestNum}${colors.reset} - Limit: ${limit}, Remaining: ${remaining}, Reset: ${reset ? new Date(reset * 1000).toLocaleTimeString() : 'N/A'}`
    );
  }
}

// Test general API rate limiting
async function testGeneralRateLimit() {
  console.log(`\n${colors.blue}=== Testing General API Rate Limit ===${colors.reset}`);
  console.log('Sending 15 requests to /api/v1/health...\n');

  for (let i = 1; i <= 15; i++) {
    try {
      const response = await makeRequest('/api/v1/health', 'GET');
      displayRateLimitInfo(response.headers, i);

      if (response.status === 429) {
        console.log(`${colors.red}✗ Request ${i} was rate limited!${colors.reset}`);
      } else if (response.status === 200) {
        console.log(`${colors.green}✓ Request ${i} succeeded${colors.reset}`);
      } else {
        console.log(`${colors.yellow}? Request ${i} returned status ${response.status}${colors.reset}`);
      }

      // Small delay between requests
      await new Promise((resolve) => setTimeout(resolve, 100));
    } catch (err) {
      console.error(`${colors.red}Error on request ${i}:${colors.reset}`, err.message);
    }
  }
}

// Test auth endpoint rate limiting
async function testAuthRateLimit() {
  console.log(`\n${colors.blue}=== Testing Auth Rate Limit ===${colors.reset}`);
  console.log('Sending 12 requests to /api/v1/auth/login...\n');

  const loginData = {
    email: 'test@example.com',
    password: 'wrongpassword',
  };

  for (let i = 1; i <= 12; i++) {
    try {
      const response = await makeRequest('/api/v1/auth/login', 'POST', loginData);
      displayRateLimitInfo(response.headers, i);

      if (response.status === 429) {
        console.log(`${colors.red}✗ Request ${i} was rate limited!${colors.reset}`);
        console.log(`Response: ${response.body}`);
      } else if (response.status === 400 || response.status === 401) {
        console.log(`${colors.green}✓ Request ${i} processed (expected auth failure)${colors.reset}`);
      } else {
        console.log(`${colors.yellow}? Request ${i} returned status ${response.status}${colors.reset}`);
      }

      // Small delay between requests
      await new Promise((resolve) => setTimeout(resolve, 100));
    } catch (err) {
      console.error(`${colors.red}Error on request ${i}:${colors.reset}`, err.message);
    }
  }
}

// Test AI endpoint rate limiting
async function testAIRateLimit() {
  console.log(`\n${colors.blue}=== Testing AI Rate Limit ===${colors.reset}`);
  console.log('Sending 5 requests to /api/v1/ai/generate...\n');

  const aiData = {
    prompt: 'Test prompt for rate limiting',
  };

  for (let i = 1; i <= 5; i++) {
    try {
      const response = await makeRequest('/api/v1/ai/generate', 'POST', aiData);
      displayRateLimitInfo(response.headers, i);

      if (response.status === 429) {
        console.log(`${colors.red}✗ Request ${i} was rate limited!${colors.reset}`);
      } else {
        console.log(`${colors.green}✓ Request ${i} processed (status ${response.status})${colors.reset}`);
      }

      // Small delay between requests
      await new Promise((resolve) => setTimeout(resolve, 100));
    } catch (err) {
      console.error(`${colors.red}Error on request ${i}:${colors.reset}`, err.message);
    }
  }
}

// Main function
async function main() {
  console.log(`${colors.cyan}╔════════════════════════════════════════╗${colors.reset}`);
  console.log(`${colors.cyan}║   NEXUS V1 Rate Limiting Test Suite        ║${colors.reset}`);
  console.log(`${colors.cyan}╚════════════════════════════════════════╝${colors.reset}`);
  console.log(`\nTesting server at: ${colors.yellow}${BASE_URL}${colors.reset}\n`);

  try {
    // Test health endpoint first
    console.log(`${colors.blue}Checking server health...${colors.reset}`);
    const health = await makeRequest('/health', 'GET');
    if (health.status === 200) {
      console.log(`${colors.green}✓ Server is healthy${colors.reset}`);
    } else {
      console.log(`${colors.yellow}⚠ Server returned status ${health.status}${colors.reset}`);
    }

    // Run tests
    await testGeneralRateLimit();
    await testAuthRateLimit();
    await testAIRateLimit();

    console.log(`\n${colors.cyan}╔════════════════════════════════════════╗${colors.reset}`);
    console.log(`${colors.cyan}║   Tests completed!                     ║${colors.reset}`);
    console.log(`${colors.cyan}╚════════════════════════════════════════╝${colors.reset}\n`);
  } catch (err) {
    console.error(`${colors.red}Fatal error:${colors.reset}`, err);
    process.exit(1);
  }
}

// Run the tests
main();


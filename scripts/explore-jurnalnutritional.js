/**
 * Explore jurnalnutritional.ro API - login and discover endpoints
 */
const https = require('https');
const http = require('http');

const BASE = 'jurnalnutritional.ro';
const EMAIL = 'contact@forsite.ro';
const PASS = 'q1w2e3r4';

function fetch(url, options = {}) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const lib = urlObj.protocol === 'https:' ? https : http;
    const reqOptions = {
      hostname: urlObj.hostname,
      port: urlObj.port || (urlObj.protocol === 'https:' ? 443 : 80),
      path: urlObj.pathname + urlObj.search,
      method: options.method || 'GET',
      headers: options.headers || {},
    };

    const req = lib.request(reqOptions, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        resolve({ status: res.statusCode, headers: res.headers, body });
      });
    });
    req.on('error', reject);
    if (options.body) req.write(options.body);
    req.end();
  });
}

async function main() {
  console.log('=== 1. Try login ===\n');

  // Try common API login endpoints
  const loginEndpoints = [
    '/api/auth/login',
    '/api/login',
    '/api/v1/auth/login',
    '/api/v1/login',
    '/auth/login',
    '/login',
  ];

  const payload = JSON.stringify({ email: EMAIL, password: PASS });

  for (const ep of loginEndpoints) {
    try {
      console.log(`Trying POST https://${BASE}${ep}`);
      const res = await fetch(`https://${BASE}${ep}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: payload,
      });
      console.log(`  Status: ${res.status}`);
      if (res.status !== 404 && res.status !== 301 && res.status !== 308) {
        console.log(`  Headers:`, JSON.stringify(res.headers, null, 2));
        const preview = res.body.substring(0, 2000);
        console.log(`  Body: ${preview}\n`);
        if (res.status === 200 || res.status === 201) {
          console.log('  ✓ LOGIN SUCCESS!\n');
          // Try to parse token
          try {
            const json = JSON.parse(res.body);
            const token = json.token || json.accessToken || json.access_token || json.jwt;
            if (token) {
              console.log('  Token found:', token.substring(0, 50) + '...\n');
              // Try recipe endpoints
              await exploreRecipes(token);
            }
          } catch (e) {
            console.log('  Could not parse JSON response');
          }
          break;
        }
      } else {
        console.log('  Not found, trying next...\n');
      }
    } catch (e) {
      console.log(`  Error: ${e.message}\n`);
    }
  }

  // Also try to find API by checking the page source
  console.log('\n=== 2. Check page source for API clues ===\n');
  try {
    const res = await fetch(`https://${BASE}/`);
    const body = res.body;
    // Look for API URLs, script tags, etc.
    const apiMatches = body.match(/["'](\/api[^"']*|https?:\/\/[^"']*api[^"']*)["']/g);
    if (apiMatches) {
      console.log('API references found in page:');
      [...new Set(apiMatches)].slice(0, 20).forEach(m => console.log('  ' + m));
    }
    // Look for JS bundle files
    const jsMatches = body.match(/src=["']([^"']*\.js[^"']*)["']/g);
    if (jsMatches) {
      console.log('\nJS bundles:');
      jsMatches.slice(0, 10).forEach(m => console.log('  ' + m));
    }
    // Look for fetch/axios calls
    const fetchMatches = body.match(/(?:fetch|axios|api)\(["']([^"']+)["']/g);
    if (fetchMatches) {
      console.log('\nFetch/API calls in page:');
      fetchMatches.slice(0, 10).forEach(m => console.log('  ' + m));
    }
  } catch (e) {
    console.log('Error reading page:', e.message);
  }
}

async function exploreRecipes(token) {
  console.log('\n=== 3. Explore recipe endpoints ===\n');
  const endpoints = [
    '/api/recipes',
    '/api/v1/recipes',
    '/api/retete',
    '/api/foods',
    '/api/v1/foods',
    '/api/alimente',
    '/api/ingredients',
    '/api/v1/ingredients',
    '/api/user/recipes',
    '/api/user/foods',
    '/api/me',
    '/api/user',
  ];

  for (const ep of endpoints) {
    try {
      const res = await fetch(`https://${BASE}${ep}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
        },
      });
      if (res.status !== 404) {
        console.log(`GET ${ep} → ${res.status}`);
        const preview = res.body.substring(0, 500);
        console.log(`  ${preview}\n`);
      }
    } catch (e) {
      // skip
    }
  }
}

main().catch(console.error);

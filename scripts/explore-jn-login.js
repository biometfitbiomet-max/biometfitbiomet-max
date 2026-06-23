const https = require('https');

function fetch(url, options = {}) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const reqOptions = {
      hostname: urlObj.hostname,
      path: urlObj.pathname + urlObj.search,
      method: options.method || 'GET',
      headers: options.headers || {},
    };
    const req = https.request(reqOptions, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => resolve({ status: res.statusCode, headers: res.headers, body }));
    });
    req.on('error', reject);
    if (options.body) req.write(options.body);
    req.end();
  });
}

const BASE = 'jurnalnutritional.ro';
const EMAIL = 'contact@forsite.ro';
const PASS = 'q1w2e3r4';

async function main() {
  console.log('=== Finding Firebase config ===\n');
  const jsRes = await fetch('https://' + BASE + '/_nuxt/Cb8N4N4J.js');
  const jsBody = jsRes.body;

  const apiKeyMatch = jsBody.match(/apiKey["'\s:]*["']([A-Za-z0-9_-]+)["']/);
  const projectIdMatch = jsBody.match(/projectId["'\s:]*["']([A-Za-z0-9_-]+)["']/);

  const apiKey = apiKeyMatch ? apiKeyMatch[1] : null;
  const projectId = projectIdMatch ? projectIdMatch[1] : null;

  console.log('apiKey:', apiKey);
  console.log('projectId:', projectId);

  if (!apiKey) {
    console.log('Could not find Firebase apiKey');
    return;
  }

  console.log('\n=== Firebase Login ===\n');
  const loginUrl = 'https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=' + apiKey;
  const loginRes = await fetch(loginUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: EMAIL, password: PASS, returnSecureToken: true }),
  });

  console.log('Login status:', loginRes.status);
  if (loginRes.status !== 200) {
    console.log('Login failed:', loginRes.body.substring(0, 500));
    return;
  }

  const loginData = JSON.parse(loginRes.body);
  const idToken = loginData.idToken;
  console.log('Login SUCCESS! Token:', idToken.substring(0, 40) + '...');

  console.log('\n=== Exploring API endpoints ===\n');
  const endpoints = [
    '/api/ingredients/categories',
    '/api/allergens',
    '/api/additives',
    '/api/tracking/user',
    '/api/recipes',
    '/api/ingredients',
    '/api/foods',
    '/api/retete',
    '/api/alimente',
    '/api/user/recipes',
    '/api/search',
    '/api/ingredients/search',
  ];

  for (const ep of endpoints) {
    try {
      const res = await fetch('https://' + BASE + ep, {
        headers: { 'Authorization': 'Bearer ' + idToken, 'Accept': 'application/json' },
      });
      if (res.status !== 404) {
        console.log('GET ' + ep + ' -> ' + res.status);
        console.log('  ' + res.body.substring(0, 400) + '\n');
      }
    } catch (e) {}
  }

  console.log('\n=== Trying POST search ===\n');
  const postEndpoints = ['/api/ingredients/search', '/api/recipes/search', '/api/search', '/api/foods/search'];
  for (const ep of postEndpoints) {
    try {
      const res = await fetch('https://' + BASE + ep, {
        method: 'POST',
        headers: { 'Authorization': 'Bearer ' + idToken, 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify({ query: 'sarmale', limit: 5 }),
      });
      if (res.status !== 404) {
        console.log('POST ' + ep + ' -> ' + res.status);
        console.log('  ' + res.body.substring(0, 500) + '\n');
      }
    } catch (e) {}
  }
}

main().catch(console.error);

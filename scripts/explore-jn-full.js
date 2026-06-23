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
const API_KEY = 'AIzaSyCSZSjlp_YNHpEbbru3SuNm1ypeAq1KmxI';
const EMAIL = 'contact@forsite.ro';
const PASS = 'q1w2e3r4';

async function main() {
  console.log('=== Firebase Login ===\n');
  const loginUrl = 'https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=' + API_KEY;
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
  const localId = loginData.localId;
  console.log('Login SUCCESS! uid:', localId);

  console.log('\n=== GET endpoints ===\n');
  var endpoints = [
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
    '/api/user/foods',
    '/api/search',
    '/api/ingredients/search',
    '/api/ingredients/list',
    '/api/recipes/list',
  ];

  for (var i = 0; i < endpoints.length; i++) {
    try {
      var res = await fetch('https://' + BASE + endpoints[i], {
        headers: { 'Authorization': 'Bearer ' + idToken, 'Accept': 'application/json' },
      });
      if (res.status !== 404) {
        console.log('GET ' + endpoints[i] + ' -> ' + res.status);
        console.log('  ' + res.body.substring(0, 600) + '\n');
      }
    } catch (e) {}
  }

  console.log('\n=== POST search ===\n');
  var postEndpoints = ['/api/ingredients/search', '/api/recipes/search', '/api/search', '/api/foods/search', '/api/ingredients'];
  for (var j = 0; j < postEndpoints.length; j++) {
    try {
      var res = await fetch('https://' + BASE + postEndpoints[j], {
        method: 'POST',
        headers: { 'Authorization': 'Bearer ' + idToken, 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify({ query: 'sarmale', limit: 5 }),
      });
      if (res.status !== 404) {
        console.log('POST ' + postEndpoints[j] + ' -> ' + res.status);
        console.log('  ' + res.body.substring(0, 600) + '\n');
      }
    } catch (e) {}
  }

  console.log('\n=== GET with query params ===\n');
  var queryEndpoints = ['/api/ingredients?q=sarmale', '/api/ingredients?search=sarmale', '/api/recipes?q=sarmale', '/api/search?q=sarmale'];
  for (var k = 0; k < queryEndpoints.length; k++) {
    try {
      var res = await fetch('https://' + BASE + queryEndpoints[k], {
        headers: { 'Authorization': 'Bearer ' + idToken, 'Accept': 'application/json' },
      });
      if (res.status !== 404) {
        console.log('GET ' + queryEndpoints[k] + ' -> ' + res.status);
        console.log('  ' + res.body.substring(0, 600) + '\n');
      }
    } catch (e) {}
  }
}

main().catch(console.error);

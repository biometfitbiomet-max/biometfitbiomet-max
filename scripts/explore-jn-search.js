var https = require('https');

function fetch(url, options) {
  options = options || {};
  return new Promise(function(resolve, reject) {
    var urlObj = new URL(url);
    var reqOptions = {
      hostname: urlObj.hostname,
      path: urlObj.pathname + urlObj.search,
      method: options.method || 'GET',
      headers: options.headers || {},
    };
    var req = https.request(reqOptions, function(res) {
      var body = '';
      res.on('data', function(chunk) { body += chunk; });
      res.on('end', function() { resolve({ status: res.statusCode, headers: res.headers, body: body }); });
    });
    req.on('error', reject);
    if (options.body) req.write(options.body);
    req.end();
  });
}

var BASE = 'jurnalnutritional.ro';
var API_KEY = 'AIzaSyCSZSjlp_YNHpEbbru3SuNm1ypeAq1KmxI';

async function main() {
  // Login
  var loginRes = await fetch('https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=' + API_KEY, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'contact@forsite.ro', password: 'q1w2e3r4', returnSecureToken: true }),
  });
  var idToken = JSON.parse(loginRes.body).idToken;

  // Get session cookie
  var srRes = await fetch('https://' + BASE + '/api/auth/sessionRefresh', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ idToken: idToken }),
  });
  var setCookie = srRes.headers['set-cookie'];
  var cookieStr = setCookie.map(function(c) { return c.split(';')[0]; }).join('; ');

  var headers = { 'Accept': 'application/json', 'Cookie': cookieStr };

  console.log('=== Search ingredients ===\n');

  // Try various search patterns
  var searches = [
    '/api/ingredients?q=sarmale',
    '/api/ingredients?search=sarmale',
    '/api/ingredients?name=sarmale&limit=5',
    '/api/ingredients?limit=5',
    '/api/ingredients?page=1&limit=5',
    '/api/ingredients?category=Carne',
    '/api/ingredients?categoryId=Carne',
  ];

  for (var i = 0; i < searches.length; i++) {
    var res = await fetch('https://' + BASE + searches[i], { headers: headers });
    console.log('GET ' + searches[i] + ' -> ' + res.status);
    if (res.status === 200) {
      console.log('  ' + res.body.substring(0, 800) + '\n');
    } else if (res.status !== 404) {
      console.log('  ' + res.body.substring(0, 300) + '\n');
    }
  }

  console.log('\n=== POST ingredients search ===\n');
  var postBody = JSON.stringify({ query: 'sarmale', limit: 5 });
  var postRes = await fetch('https://' + BASE + '/api/ingredients', {
    method: 'POST',
    headers: Object.assign({}, headers, { 'Content-Type': 'application/json' }),
    body: postBody,
  });
  console.log('POST /api/ingredients -> ' + postRes.status);
  console.log('  ' + postRes.body.substring(0, 800) + '\n');

  // Try with different body structures
  var postBody2 = JSON.stringify({ name: 'sarmale' });
  var postRes2 = await fetch('https://' + BASE + '/api/ingredients', {
    method: 'POST',
    headers: Object.assign({}, headers, { 'Content-Type': 'application/json' }),
    body: postBody2,
  });
  console.log('POST /api/ingredients (name) -> ' + postRes2.status);
  console.log('  ' + postRes2.body.substring(0, 800) + '\n');

  // Try search endpoint
  var searchRes = await fetch('https://' + BASE + '/api/ingredients/search', {
    method: 'POST',
    headers: Object.assign({}, headers, { 'Content-Type': 'application/json' }),
    body: JSON.stringify({ query: 'pui', limit: 5 }),
  });
  console.log('POST /api/ingredients/search -> ' + searchRes.status);
  console.log('  ' + searchRes.body.substring(0, 800) + '\n');

  // Try recipes
  console.log('\n=== Recipes ===\n');
  var recipeEndpoints = [
    '/api/recipes',
    '/api/recipes?limit=5',
    '/api/recipes?q=sarmale',
    '/api/recipes?search=sarmale',
    '/api/user/recipes',
    '/api/user/recipes?limit=5',
  ];
  for (var j = 0; j < recipeEndpoints.length; j++) {
    var rRes = await fetch('https://' + BASE + recipeEndpoints[j], { headers: headers });
    console.log('GET ' + recipeEndpoints[j] + ' -> ' + rRes.status);
    if (rRes.status === 200) {
      console.log('  ' + rRes.body.substring(0, 800) + '\n');
    } else if (rRes.status !== 404) {
      console.log('  ' + rRes.body.substring(0, 300) + '\n');
    }
  }

  // Try POST recipes
  var prRes = await fetch('https://' + BASE + '/api/recipes', {
    method: 'POST',
    headers: Object.assign({}, headers, { 'Content-Type': 'application/json' }),
    body: JSON.stringify({ query: 'sarmale', limit: 5 }),
  });
  console.log('POST /api/recipes -> ' + prRes.status);
  console.log('  ' + prRes.body.substring(0, 800) + '\n');

  // Try /api/search
  var sRes = await fetch('https://' + BASE + '/api/search', {
    method: 'POST',
    headers: Object.assign({}, headers, { 'Content-Type': 'application/json' }),
    body: JSON.stringify({ query: 'sarmale', limit: 5 }),
  });
  console.log('POST /api/search -> ' + sRes.status);
  console.log('  ' + sRes.body.substring(0, 800) + '\n');

  // Try /api/search?q=
  var sRes2 = await fetch('https://' + BASE + '/api/search?q=sarmale', { headers: headers });
  console.log('GET /api/search?q=sarmale -> ' + sRes2.status);
  console.log('  ' + sRes2.body.substring(0, 800) + '\n');
}

main().catch(console.error);

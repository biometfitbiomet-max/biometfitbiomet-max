const https = require('https');

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
var EMAIL = 'contact@forsite.ro';
var PASS = 'q1w2e3r4';

async function main() {
  console.log('=== Firebase Login ===\n');
  var loginUrl = 'https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=' + API_KEY;
  var loginRes = await fetch(loginUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: EMAIL, password: PASS, returnSecureToken: true }),
  });

  if (loginRes.status !== 200) {
    console.log('Login failed:', loginRes.body.substring(0, 500));
    return;
  }

  var loginData = JSON.parse(loginRes.body);
  var idToken = loginData.idToken;
  console.log('Login OK, uid:', loginData.localId);

  // Try sessionRefresh - maybe it sets a cookie
  console.log('\n=== Try sessionRefresh ===\n');
  var srRes = await fetch('https://' + BASE + '/api/auth/sessionRefresh', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
    body: JSON.stringify({ idToken: idToken }),
  });
  console.log('sessionRefresh status:', srRes.status);
  console.log('Headers:', JSON.stringify(srRes.headers, null, 2));
  console.log('Body:', srRes.body.substring(0, 500));

  // Extract cookies from response
  var setCookie = srRes.headers['set-cookie'];
  var cookieStr = '';
  if (setCookie) {
    var cookies = setCookie.map(function(c) { return c.split(';')[0]; });
    cookieStr = cookies.join('; ');
    console.log('Cookies:', cookieStr);
  }

  // Try with cookie
  console.log('\n=== Try API with cookies ===\n');
  var testEndpoints = [
    '/api/ingredients/categories',
    '/api/allergens',
    '/api/tracking/user',
    '/api/recipes',
    '/api/ingredients',
  ];

  for (var i = 0; i < testEndpoints.length; i++) {
    var ep = testEndpoints[i];
    var headers = { 'Accept': 'application/json' };
    if (cookieStr) headers['Cookie'] = cookieStr;
    // Also try with Authorization header + cookie
    headers['Authorization'] = 'Bearer ' + idToken;

    var res = await fetch('https://' + BASE + ep, { headers: headers });
    if (res.status !== 404) {
      console.log('GET ' + ep + ' -> ' + res.status);
      console.log('  ' + res.body.substring(0, 600) + '\n');
    }
  }

  // Also try without Authorization, just cookie
  if (cookieStr) {
    console.log('\n=== Try with cookie only (no Bearer) ===\n');
    for (var j = 0; j < testEndpoints.length; j++) {
      var ep2 = testEndpoints[j];
      var res2 = await fetch('https://' + BASE + ep2, {
        headers: { 'Accept': 'application/json', 'Cookie': cookieStr },
      });
      if (res2.status !== 404) {
        console.log('GET ' + ep2 + ' -> ' + res2.status);
        console.log('  ' + res2.body.substring(0, 600) + '\n');
      }
    }
  }
}

main().catch(console.error);

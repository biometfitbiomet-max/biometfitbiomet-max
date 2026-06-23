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

var API_KEY = 'AIzaSyCSZSjlp_YNHpEbbru3SuNm1ypeAq1KmxI';
var PROJECT = 'valori-nutritionale-d53d4';

async function main() {
  // Login
  var loginRes = await fetch('https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=' + API_KEY, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'contact@forsite.ro', password: 'q1w2e3r4', returnSecureToken: true }),
  });
  var idToken = JSON.parse(loginRes.body).idToken;
  console.log('Login OK\n');

  var fsBase = 'https://firestore.googleapis.com/v1/projects/' + PROJECT + '/databases/(default)/documents';
  var headers = { 'Authorization': 'Bearer ' + idToken, 'Accept': 'application/json' };

  // 1. List root collections
  console.log('=== Root collections ===\n');
  var listRes = await fetch(fsBase + ':listCollections', { headers: headers });
  console.log('Status:', listRes.status);
  console.log(listRes.body.substring(0, 2000));

  // 2. Try common collection names
  console.log('\n=== Try common collections ===\n');
  var collections = ['ingredients', 'recipes', 'foods', 'alimente', 'retete', 'products', 'items', 'user_ingredients', 'user_recipes'];
  for (var i = 0; i < collections.length; i++) {
    var col = collections[i];
    var res = await fetch(fsBase + '/' + col + '?pageSize=3', { headers: headers });
    console.log('GET ' + col + ' -> ' + res.status);
    if (res.status === 200) {
      console.log('  ' + res.body.substring(0, 1000) + '\n');
    }
  }

  // 3. Try Firestore query - search for "sarmale"
  console.log('\n=== Query ingredients for sarmale ===\n');
  var queryBody = JSON.stringify({
    structuredQuery: {
      from: [{ collectionId: 'ingredients' }],
      where: {
        fieldFilter: {
          field: { fieldPath: 'name' },
          op: 'EQUAL',
          value: { stringValue: 'Sarmale' }
        }
      },
      limit: 5
    }
  });
  var qRes = await fetch(fsBase + ':runQuery', {
    method: 'POST',
    headers: Object.assign({}, headers, { 'Content-Type': 'application/json' }),
    body: queryBody,
  });
  console.log('Query status:', qRes.status);
  console.log(qRes.body.substring(0, 2000));
}

main().catch(console.error);

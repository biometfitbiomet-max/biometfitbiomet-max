var https = require('https');

function fetch(url) {
  return new Promise(function(resolve, reject) {
    https.get(url, function(res) {
      var body = '';
      res.on('data', function(chunk) { body += chunk; });
      res.on('end', function() { resolve({ status: res.statusCode, body: body, headers: res.headers }); });
    }).on('error', reject);
  });
}

(async function() {
  // The main JS bundle might reference lazy-loaded chunks
  var js = await fetch('https://jurnalnutritional.ro/_nuxt/Cb8N4N4J.js');
  var jsBody = js.body;

  // Look for chunk loading patterns - Nuxt uses import() or _nuxt/ references
  var chunkPatterns = jsBody.match(/_nuxt\/[A-Za-z0-9_-]+\.js/g) || [];
  var uniqueChunks = Array.from(new Set(chunkPatterns));
  console.log('Lazy-loaded chunks found:', uniqueChunks.length);
  uniqueChunks.forEach(function(c) { console.log('  ' + c); });

  // Also look for dynamic import patterns with chunk names
  var importPatterns = jsBody.match(/["'`]([^"'`]*\.js)["'`]/g) || [];
  var uniqueImports = Array.from(new Set(importPatterns));
  console.log('\nAll JS file references:');
  uniqueImports.slice(0, 50).forEach(function(c) { console.log('  ' + c); });

  // Look for Firestore collection references
  var collectionRefs = jsBody.match(/collection\(["'`]([^"'`]+)["'`]/g) || [];
  console.log('\nFirestore collection() calls:');
  Array.from(new Set(collectionRefs)).forEach(function(c) { console.log('  ' + c); });

  // Look for collection names as strings
  var collNames = jsBody.match(/["'`](?:ingredients|recipes|foods|alimente|retete|user_ingredients|user_recipes|products)["'`]/g) || [];
  console.log('\nCollection name strings:');
  Array.from(new Set(collNames)).forEach(function(c) { console.log('  ' + c); });

  // Look for firestore() or getFirestore() calls
  var fsRefs = jsBody.match(/(?:getFirestore|firestore|firebase\/firestore)[^"'`\s]{0,50}/gi) || [];
  console.log('\nFirestore references (first 20):');
  Array.from(new Set(fsRefs)).slice(0, 20).forEach(function(c) { console.log('  ' + c); });

  // Try fetching the food-journal page to see if it loads additional chunks
  console.log('\n=== Fetching /food-journal page ===\n');
  var fjPage = await fetch('https://jurnalnutritional.ro/food-journal');
  console.log('Status:', fjPage.status);
  var fjScripts = fjPage.body.match(/src="([^"]*\.js[^"]*)"/g) || [];
  console.log('Scripts on food-journal:', fjScripts);
  
  // Look for __NUXT__ data on food-journal page
  var nuxtData = fjPage.body.match(/__NUXT__\s*=\s*([\s\S]*?)<\/script>/);
  if (nuxtData) {
    var apiRefs = nuxtData[1].match(/\/api\/[^"'`\s,)}\]]+/g) || [];
    console.log('API refs in food-journal NUXT data:', Array.from(new Set(apiRefs)));
    
    // Look for collection names
    var collInNuxt = nuxtData[1].match(/["'`](?:ingredients|recipes|foods|alimente|retete|products|items)["'`]/g) || [];
    console.log('Collection refs in NUXT data:', Array.from(new Set(collInNuxt)));
  }
})();

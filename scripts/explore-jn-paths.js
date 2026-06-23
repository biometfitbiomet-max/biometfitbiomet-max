var https = require('https');

function fetch(url) {
  return new Promise(function(resolve, reject) {
    https.get(url, function(res) {
      var body = '';
      res.on('data', function(chunk) { body += chunk; });
      res.on('end', function() { resolve({ status: res.statusCode, body: body }); });
    }).on('error', reject);
  });
}

(async function() {
  var page = await fetch('https://jurnalnutritional.ro/');
  
  // Find all inline scripts
  var inlineScripts = page.body.match(/<script[^>]*>([\s\S]*?)<\/script>/g) || [];
  for (var i = 0; i < inlineScripts.length; i++) {
    var s = inlineScripts[i];
    if (s.includes('__NUXT__')) {
      // Extract the full __NUXT__ config
      var nuxtData = s.replace(/<\/?script[^>]*>/g, '');
      // Find all /api/ references
      var apiRefs = nuxtData.match(/\/api\/[^"'`\s,)}\]]+/g) || [];
      var uniqueApiRefs = Array.from(new Set(apiRefs));
      console.log('All API references in __NUXT__:');
      uniqueApiRefs.forEach(function(r) { console.log('  ' + r); });
    }
  }

  // Fetch main JS bundle and search for all API paths
  var js = await fetch('https://jurnalnutritional.ro/_nuxt/Cb8N4N4J.js');
  var jsBody = js.body;

  // Find all /api/ paths
  var allApiPaths = jsBody.match(/\/api\/[^"'`\s,)}\]\\\*]+/g) || [];
  var uniquePaths = Array.from(new Set(allApiPaths));
  console.log('\nAll API paths in JS bundle:');
  uniquePaths.forEach(function(p) { console.log('  ' + p); });

  // Find fetch/post/get/useFetch patterns with URLs
  var fetchPatterns = jsBody.match(/(?:\$fetch|useFetch|useAsyncData|\$axios|ofetch)\(["'`]([^"'`]+)["'`]/g) || [];
  console.log('\nFetch patterns:');
  Array.from(new Set(fetchPatterns)).forEach(function(p) { console.log('  ' + p); });

  // Find URL concatenation patterns (baseURL + path)
  var concatPatterns = jsBody.match(/["'`](\/api[^"'`]+)["'`]/g) || [];
  console.log('\nAll /api string literals:');
  Array.from(new Set(concatPatterns)).slice(0, 50).forEach(function(p) { console.log('  ' + p); });

  // Look for ingredient/recipe/search related code
  var ingredientRefs = jsBody.match(/[^"'`]{0,30}(?:ingredient|recipe|search|food|reteta|aliment)[^"'`]{0,30}/gi) || [];
  console.log('\nIngredient/recipe/search references (first 30):');
  Array.from(new Set(ingredientRefs)).slice(0, 30).forEach(function(r) { console.log('  ' + r.trim()); });
})();

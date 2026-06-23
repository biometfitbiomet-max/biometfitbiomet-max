const https = require('https');

function fetch(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => resolve({ status: res.statusCode, body }));
    }).on('error', reject);
  });
}

(async () => {
  // Get the HTML page
  const page = await fetch('https://jurnalnutritional.ro/');
  
  // Find ALL script references (src and inline)
  const scriptSrcs = [...page.body.matchAll(/src="([^"]+\.js[^"]*)"/g)].map(m => m[1]);
  console.log('Script srcs:', scriptSrcs);

  // Find inline scripts with Firebase config
  const inlineScripts = [...page.body.matchAll(/<script[^>]*>([\s\S]*?)<\/script>/g)].map(m => m[1]);
  console.log('\nInline scripts count:', inlineScripts.length);
  
  for (let i = 0; i < inlineScripts.length; i++) {
    const s = inlineScripts[i];
    if (s.includes('apiKey') || s.includes('firebase') || s.includes('config')) {
      console.log('\nInline script #' + i + ' (has apiKey/firebase/config):');
      console.log(s.substring(0, 2000));
    }
  }

  // Also look for __NUXT__ data
  const nuxtMatch = page.body.match(/__NUXT__\s*=\s*({[\s\S]*?})\s*<\/script>/);
  if (nuxtMatch) {
    console.log('\n__NUXT__ data found (first 2000 chars):');
    console.log(nuxtMatch[1].substring(0, 2000));
  }

  // Look for any config-like patterns in the HTML
  const configMatches = [...page.body.matchAll(/(?:apiKey|projectId|authDomain|firebaseConfig|FIREBASE)[^,;]{0,100}/gi)].map(m => m[0]);
  if (configMatches.length > 0) {
    console.log('\nConfig references in HTML:');
    configMatches.forEach(m => console.log('  ' + m));
  }

  // Fetch the main JS bundle and look for dynamic imports / chunk references
  const mainJs = await fetch('https://jurnalnutritional.ro/_nuxt/Cb8N4N4J.js');
  
  // Look for chunk file references
  const chunkRefs = [...mainJs.body.matchAll(/["'`]([^"'`]*_nuxt[^"'`]*\.js[^"'`]*)["'`]/g)].map(m => m[1]);
  const uniqueChunks = [...new Set(chunkRefs)].slice(0, 30);
  console.log('\nChunk files referenced:', uniqueChunks.length);
  uniqueChunks.forEach(c => console.log('  ' + c));

  // Also look for the Firebase apiKey pattern more broadly
  const apiKeyPatterns = [...mainJs.body.matchAll(/AIza[0-9A-Za-z_-]{30,40}/g)].map(m => m[0]);
  if (apiKeyPatterns.length > 0) {
    console.log('\nFirebase API keys found in main bundle:');
    [...new Set(apiKeyPatterns)].forEach(k => console.log('  ' + k));
  }

  // Look for identitytoolkit or firebasedynamiclinks references  
  const fbRefs = [...mainJs.body.matchAll(/(?:identitytoolkit|firebasedynamiclinks|firebaseio|firebaseapp)[^"'`]{0,80}/g)].map(m => m[0]);
  if (fbRefs.length > 0) {
    console.log('\nFirebase references:');
    [...new Set(fbRefs)].slice(0, 10).forEach(r => console.log('  ' + r));
  }
})();

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
  const page = await fetch('https://jurnalnutritional.ro/');
  const jsFiles = [...page.body.matchAll(/src="([^"]*\.js[^"]*)"/g)].map(m => m[1]);
  console.log('JS files:', jsFiles);

  for (const jsFile of jsFiles) {
    const url = jsFile.startsWith('http') ? jsFile : 'https://jurnalnutritional.ro' + jsFile;
    console.log('\nFetching:', url);
    try {
      const res = await fetch(url);
      const apiMatches = [...res.body.matchAll(/["'`](\/api[^"'`]*|\/auth[^"'`]*|\/v[0-9]+[^"'`]*)["'`]/g)].map(m => m[1]);
      const fetchMatches = [...res.body.matchAll(/(?:post|get|put|request|\$fetch|useFetch)\(["'`]([^"'`]+)["'`]/g)].map(m => m[1]);
      const urlMatches = [...res.body.matchAll(/url:\s*["'`]([^"'`]+)["'`]/g)].map(m => m[1]);
      const all = [...new Set([...apiMatches, ...fetchMatches, ...urlMatches])].filter(u => !u.includes('fonts.') && !u.includes('googleapis') && !u.includes('.css'));
      if (all.length > 0) {
        console.log('  Endpoints found:');
        all.forEach(e => console.log('    ' + e));
      }
      const loginRefs = [...res.body.matchAll(/(?:login|signin|password|token|jwt)["'`]?/gi)].map(m => m[0]).slice(0, 15);
      if (loginRefs.length > 0) {
        console.log('  Auth references:');
        [...new Set(loginRefs)].forEach(e => console.log('    ' + e));
      }
    } catch (e) {
      console.log('  Error:', e.message);
    }
  }
})();

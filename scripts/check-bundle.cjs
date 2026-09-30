const fs = require('fs');

const assetsDir = '2d_metaverse/dist/assets';
const entry = fs
  .readdirSync(assetsDir)
  .find((n) => n.startsWith('index-') && n.endsWith('.js'));
const bundle = fs.readFileSync(`${assetsDir}/${entry}`, 'utf8');
const html = fs.readFileSync('2d_metaverse/dist/index.html', 'utf8');

const checks = {
  'entry bundle found': Boolean(entry),
  'firebase apiKey undefined': bundle.includes('apiKey:void 0'),
  'firebase guard bundled': bundle.includes('Google sign-in is unavailable'),
  'STUN twilio present': bundle.includes('stun:global.stun.twilio.com:3478'),
  'TURN injected': /turn:[a-z.]*(:\d+)?\??/.test(bundle),
  'modulepreload links': (html.match(/rel="modulepreload"/g) || []).length,
};

let failed = false;
for (const [k, v] of Object.entries(checks)) {
  console.log(k.padEnd(28), v);
}
console.log(`\nentry: ${entry}`);
console.log(checks['TURN injected'] ? 'TURN is configured' : 'TURN not set (expected if deploy.env has no TURN creds)');
process.exit(failed ? 1 : 0);
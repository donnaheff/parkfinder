const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const envPath = path.join(root, '.env');
const outPath = path.join(root, 'assets', 'env.js');

const raw = fs.readFileSync(envPath, 'utf8');
const config = {};
for (const line of raw.split(/\r?\n/)) {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith('#')) continue;
  const eq = trimmed.indexOf('=');
  if (eq === -1) continue;
  const key = trimmed.slice(0, eq).trim();
  const value = trimmed.slice(eq + 1).trim();
  if (/^(true|false)$/i.test(value)) config[key] = /^true$/i.test(value);
  else if (/^-?\d+(\.\d+)?$/.test(value)) config[key] = Number(value);
  else config[key] = value.replace(/^['"]|['"]$/g, '');
}

const output = `// Auto-generated from .env by scripts/sync-env.js.\n// Do not edit directly; edit .env and rerun the sync script.\nwindow.PARKSWIFT_ENV = ${JSON.stringify(config, null, 2)};\n`;
fs.writeFileSync(outPath, output);
console.log(`Wrote ${path.relative(process.cwd(), outPath)} with ${Object.keys(config).length} flags.`);

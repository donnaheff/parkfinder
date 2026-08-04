const { fail } = require('./http');

function config() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;
  if (!url || !key) throw new Error('Missing SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY environment variables');
  return { url: url.replace(/\/$/, ''), key };
}
function qs(params = {}) {
  const out = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== null && v !== '') out.set(k, String(v));
  }
  return out.toString();
}
async function rest(tableAndQuery, options = {}) {
  const { url, key } = config();
  const res = await fetch(`${url}/rest/v1/${tableAndQuery}`, {
    method: options.method || 'GET',
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      'Content-Type': 'application/json',
      Prefer: options.prefer || 'return=representation',
      ...(options.headers || {})
    },
    body: options.body === undefined ? undefined : JSON.stringify(options.body)
  });
  const text = await res.text();
  let json = null;
  try { json = text ? JSON.parse(text) : null; } catch { json = text; }
  if (!res.ok) {
    const msg = json?.message || json?.error || `Supabase REST error ${res.status}`;
    const err = new Error(msg);
    err.status = res.status;
    err.details = json;
    throw err;
  }
  return json;
}
async function one(table, id, idColumn = 'id') {
  const rows = await rest(`${table}?${qs({ select: '*', [idColumn]: `eq.${id}`, limit: 1 })}`);
  return rows && rows[0];
}
async function handle(fn, res) {
  try { await fn(); } catch (err) { fail(res, err.status || 500, err.message || 'Server error', err.details); }
}
module.exports = { rest, qs, one, handle };

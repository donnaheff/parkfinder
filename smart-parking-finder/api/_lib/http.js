const crypto = require('crypto');

function send(res, status, body) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PATCH,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-admin-token');
  res.end(JSON.stringify(body, null, 2));
}
function ok(res, data, status = 200) { send(res, status, { data }); }
function fail(res, status, error, details) { send(res, status, { error, ...(details ? { details } : {}) }); }
function requireMethod(req, res, methods) {
  if (req.method === 'OPTIONS') { send(res, 204, {}); return false; }
  if (!methods.includes(req.method)) { fail(res, 405, `Method ${req.method} not allowed`); return false; }
  return true;
}
function parseBody(req) {
  return new Promise((resolve, reject) => {
    if (req.body && typeof req.body === 'object') return resolve(req.body);
    let raw = '';
    req.on('data', chunk => { raw += chunk; if (raw.length > 7_000_000) reject(new Error('Request too large')); });
    req.on('end', () => {
      if (!raw) return resolve({});
      try { resolve(JSON.parse(raw)); } catch { reject(new Error('Invalid JSON body')); }
    });
    req.on('error', reject);
  });
}
function requireAdmin(req, res) {
  const token = process.env.ADMIN_TOKEN;
  if (!token) { fail(res, 500, 'Server misconfigured: ADMIN_TOKEN is not set'); return false; }
  const supplied = Buffer.from(String(req.headers['x-admin-token'] || ''));
  const expected = Buffer.from(token);
  const valid = supplied.length === expected.length && crypto.timingSafeEqual(supplied, expected);
  if (!valid) { fail(res, 401, 'Admin token required'); return false; }
  return true;
}
function id(prefix) { return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(16).slice(2, 10)}`; }
function now() { return new Date().toISOString(); }
module.exports = { send, ok, fail, requireMethod, parseBody, requireAdmin, id, now };

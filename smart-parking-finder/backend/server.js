#!/usr/bin/env node
/*
  ParkSwift Lite Minimal Backend
  - No external npm dependencies
  - File-backed JSON database for POC/pilot demos
  - Serves the frontend from ../ and exposes /api/* endpoints
*/
const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { URL } = require('url');

const PORT = Number(process.env.PORT || 8787);
const ADMIN_TOKEN = process.env.ADMIN_TOKEN || 'dev-admin-token';
const ROOT = path.resolve(__dirname, '..');
const DATA_FILE = process.env.DATA_FILE || path.join(__dirname, 'db.json');
const UPLOAD_DIR = process.env.UPLOAD_DIR || path.join(__dirname, 'uploads');
const MAX_BODY = 6 * 1024 * 1024;

const mimeTypes = {
  '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8', '.webmanifest': 'application/manifest+json; charset=utf-8',
  '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.gif': 'image/gif', '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon', '.txt': 'text/plain; charset=utf-8', '.md': 'text/markdown; charset=utf-8'
};

function id(prefix) { return `${prefix}_${crypto.randomBytes(8).toString('hex')}`; }
function now() { return new Date().toISOString(); }
function ensureDir(dir) { fs.mkdirSync(dir, { recursive: true }); }

const seedLots = [
  { id: 'park_1', name: 'Civic Centre Garage', area: 'Victoria Island', type: 'Multi-storey garage', address: 'Ozumba Mbadiwe corridor', latitude: 6.4281, longitude: 3.4219, map_x: 83, map_y: 23, capacity: 80, available_spaces: 42, walk_meters: 240, drive_minutes: 5, rating: 4.8, amenities: { ev_charging: true, accessible: true, motorbike: true, covered: true, security: true, lighting: true }, owner_id: null, owner_listed: false, verification_status: 'verified', is_open: true, primary_photo_url: '', created_at: now(), updated_at: now() },
  { id: 'park_2', name: 'Marina Multi-Storey', area: 'Lagos Island', type: 'Multi-storey garage', address: 'Marina district', latitude: 6.4541, longitude: 3.3947, map_x: 58, map_y: 52, capacity: 65, available_spaces: 17, walk_meters: 420, drive_minutes: 8, rating: 4.5, amenities: { ev_charging: false, accessible: true, motorbike: true, covered: true, security: true, lighting: true }, owner_id: null, owner_listed: false, verification_status: 'verified', is_open: true, primary_photo_url: '', created_at: now(), updated_at: now() },
  { id: 'park_3', name: 'Lekki Link Lot', area: 'Lekki Phase 1', type: 'Open car park', address: 'Admiralty Road area', latitude: 6.4474, longitude: 3.4723, map_x: 71, map_y: 67, capacity: 48, available_spaces: 6, walk_meters: 680, drive_minutes: 11, rating: 4.2, amenities: { ev_charging: true, accessible: false, motorbike: true, covered: false, security: true, lighting: true }, owner_id: null, owner_listed: false, verification_status: 'verified', is_open: true, primary_photo_url: '', created_at: now(), updated_at: now() },
  { id: 'park_4', name: 'Adeniji Central Park', area: 'Ikoyi', type: 'Open car park', address: 'Ikoyi central', latitude: 6.4557, longitude: 3.4329, map_x: 36, map_y: 37, capacity: 55, available_spaces: 31, walk_meters: 320, drive_minutes: 7, rating: 4.6, amenities: { ev_charging: true, accessible: true, motorbike: false, covered: false, security: true, lighting: true }, owner_id: null, owner_listed: false, verification_status: 'verified', is_open: true, primary_photo_url: '', created_at: now(), updated_at: now() },
  { id: 'park_5', name: 'Eko Atlantic Bay A', area: 'Eko Atlantic', type: 'Underground garage', address: 'Eko Atlantic boulevard', latitude: 6.4101, longitude: 3.4087, map_x: 24, map_y: 74, capacity: 90, available_spaces: 0, walk_meters: 150, drive_minutes: 9, rating: 4.7, amenities: { ev_charging: true, accessible: true, motorbike: true, covered: true, security: true, lighting: true }, owner_id: null, owner_listed: false, verification_status: 'verified', is_open: true, primary_photo_url: '', created_at: now(), updated_at: now() },
  { id: 'park_6', name: 'Yaba Tech Hub Park', area: 'Yaba', type: 'Office parking', address: 'Herbert Macaulay corridor', latitude: 6.5179, longitude: 3.3869, map_x: 48, map_y: 19, capacity: 40, available_spaces: 24, walk_meters: 760, drive_minutes: 14, rating: 4.3, amenities: { ev_charging: false, accessible: false, motorbike: true, covered: false, security: true, lighting: true }, owner_id: null, owner_listed: false, verification_status: 'verified', is_open: true, primary_photo_url: '', created_at: now(), updated_at: now() }
];

function defaultDb() {
  return {
    meta: { created_at: now(), version: 1 },
    users: [{ id: 'user_demo', name: 'Demo User', email: 'demo@parkswift.local', phone: '', role: 'user', created_at: now() }],
    owners: [],
    parking_lots: seedLots,
    community_reports: [],
    saved_parks: [],
    admin_actions: []
  };
}

function readDb() {
  if (!fs.existsSync(DATA_FILE)) writeDb(defaultDb());
  return JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
}
function writeDb(db) {
  ensureDir(path.dirname(DATA_FILE));
  const tmp = `${DATA_FILE}.tmp`;
  fs.writeFileSync(tmp, JSON.stringify(db, null, 2));
  fs.renameSync(tmp, DATA_FILE);
}
function mutate(mutator) {
  const db = readDb();
  const result = mutator(db);
  writeDb(db);
  return result;
}

function send(res, status, body, headers = {}) {
  const payload = typeof body === 'string' || Buffer.isBuffer(body) ? body : JSON.stringify(body, null, 2);
  res.writeHead(status, {
    'Content-Type': Buffer.isBuffer(payload) ? 'application/octet-stream' : (headers['Content-Type'] || 'application/json; charset=utf-8'),
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET,POST,PATCH,DELETE,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, x-admin-token',
    ...headers
  });
  res.end(payload);
}
function json(res, status, body) { send(res, status, body); }
function error(res, status, message, details) { json(res, status, { error: message, ...(details ? { details } : {}) }); }

function parseBody(req) {
  return new Promise((resolve, reject) => {
    let size = 0;
    const chunks = [];
    req.on('data', chunk => {
      size += chunk.length;
      if (size > MAX_BODY) { reject(new Error('Request body too large')); req.destroy(); return; }
      chunks.push(chunk);
    });
    req.on('end', () => {
      if (!chunks.length) return resolve({});
      const raw = Buffer.concat(chunks).toString('utf8');
      try { resolve(JSON.parse(raw)); } catch { reject(new Error('Invalid JSON body')); }
    });
    req.on('error', reject);
  });
}
function requireAdmin(req, res) {
  if ((req.headers['x-admin-token'] || '') !== ADMIN_TOKEN) {
    error(res, 401, 'Admin token required. Send x-admin-token header.');
    return false;
  }
  return true;
}
function publicLot(lot) { return lot; }
function normalizeAmenityKey(value) {
  const map = { ev: 'ev_charging', accessible: 'accessible', motorbike: 'motorbike', bike: 'motorbike', covered: 'covered', security: 'security', lighting: 'lighting' };
  return map[value] || value;
}
function filterLots(lots, query) {
  let result = [...lots];
  const q = (query.get('q') || '').toLowerCase().trim();
  const area = (query.get('area') || '').toLowerCase().trim();
  const status = (query.get('status') || '').toLowerCase().trim();
  const amenity = normalizeAmenityKey((query.get('amenity') || '').toLowerCase().trim());
  if (q) result = result.filter(l => [l.name, l.area, l.address, l.type].join(' ').toLowerCase().includes(q));
  if (area) result = result.filter(l => l.area.toLowerCase().includes(area));
  if (query.get('available') === 'true') result = result.filter(l => l.is_open && l.available_spaces > 0);
  if (query.get('ownerListed') === 'true') result = result.filter(l => l.owner_listed);
  if (status) result = result.filter(l => l.verification_status === status);
  if (amenity) result = result.filter(l => l.amenities && l.amenities[amenity]);
  return result.sort((a, b) => ((a.available_spaces > 0 && a.is_open ? 0 : 999) + a.walk_meters / 90 + a.drive_minutes * 5 - a.available_spaces / 5) - ((b.available_spaces > 0 && b.is_open ? 0 : 999) + b.walk_meters / 90 + b.drive_minutes * 5 - b.available_spaces / 5));
}
function areaCoords(area) {
  const a = String(area || '').toLowerCase();
  if (a.includes('victoria')) return [83, 23];
  if (a.includes('lekki')) return [71, 67];
  if (a.includes('ikoyi')) return [36, 37];
  if (a.includes('yaba')) return [48, 19];
  if (a.includes('island') || a.includes('marina')) return [58, 52];
  if (a.includes('eko')) return [24, 74];
  return [Math.floor(12 + Math.random() * 76), Math.floor(12 + Math.random() * 76)];
}
function newParkingLot(body, ownerId) {
  const capacity = Math.max(1, Number(body.capacity || 1));
  const [x, y] = areaCoords(body.area);
  return {
    id: id('park'), owner_id: ownerId || body.owner_id || null,
    name: String(body.name || '').trim(), area: String(body.area || '').trim(), type: String(body.type || 'Open car park').trim(), address: String(body.address || '').trim(),
    latitude: body.latitude == null ? null : Number(body.latitude), longitude: body.longitude == null ? null : Number(body.longitude),
    map_x: Number(body.map_x || x), map_y: Number(body.map_y || y),
    capacity, available_spaces: Math.max(0, Math.min(capacity, Number(body.available_spaces || 0))),
    walk_meters: Math.max(0, Number(body.walk_meters || body.walk || 0)), drive_minutes: Math.max(1, Number(body.drive_minutes || body.drive || 1)),
    rating: Number(body.rating || 4.1),
    amenities: {
      ev_charging: Boolean(body.amenities?.ev_charging || body.ev_charging || body.ev), accessible: Boolean(body.amenities?.accessible || body.accessible),
      motorbike: Boolean(body.amenities?.motorbike || body.motorbike || body.bike), covered: Boolean(body.amenities?.covered || body.covered),
      security: body.amenities?.security == null ? true : Boolean(body.amenities.security), lighting: body.amenities?.lighting == null ? true : Boolean(body.amenities.lighting),
      car_wash: Boolean(body.amenities?.car_wash || body.car_wash)
    },
    owner_listed: Boolean(ownerId || body.owner_listed), verification_status: 'pending', is_open: body.is_open == null ? true : Boolean(body.is_open),
    primary_photo_url: String(body.primary_photo_url || body.photo_url || ''),
    owner_notes: String(body.owner_notes || body.notes || ''), opening_hours: String(body.opening_hours || body.hours || '06:00–22:00'),
    created_at: now(), updated_at: now()
  };
}
function validateLot(lot) {
  const missing = [];
  if (!lot.name) missing.push('name');
  if (!lot.area) missing.push('area');
  if (!lot.address) missing.push('address');
  if (missing.length) return missing;
  return null;
}

async function handleApi(req, res, url) {
  const method = req.method;
  const parts = url.pathname.split('/').filter(Boolean);

  if (method === 'GET' && url.pathname === '/api/health') {
    return json(res, 200, { ok: true, service: 'parkswift-lite-backend', time: now(), storage: DATA_FILE });
  }

  if (method === 'GET' && url.pathname === '/api/parks') {
    const db = readDb();
    return json(res, 200, { data: filterLots(db.parking_lots, url.searchParams).map(publicLot) });
  }

  if (method === 'GET' && /^\/api\/parks\/[^/]+$/.test(url.pathname)) {
    const db = readDb();
    const lot = db.parking_lots.find(l => l.id === parts[2]);
    if (!lot) return error(res, 404, 'Parking lot not found');
    return json(res, 200, { data: publicLot(lot) });
  }

  if (method === 'GET' && url.pathname === '/api/areas') {
    const db = readDb();
    const areas = [...new Set(db.parking_lots.map(l => l.area))].sort().map(area => {
      const lots = db.parking_lots.filter(l => l.area === area);
      return { area, lots: lots.length, available_spaces: lots.reduce((s, l) => s + (l.is_open ? l.available_spaces : 0), 0), owner_listed: lots.filter(l => l.owner_listed).length };
    });
    return json(res, 200, { data: areas });
  }

  if (method === 'GET' && url.pathname === '/api/updates') {
    const db = readDb();
    const parkId = url.searchParams.get('parking_lot_id');
    const data = parkId ? db.community_reports.filter(r => r.parking_lot_id === parkId) : db.community_reports;
    return json(res, 200, { data: data.slice(-100).reverse() });
  }

  if (method === 'POST' && url.pathname === '/api/updates') {
    const body = await parseBody(req);
    return json(res, 201, { data: mutate(db => {
      const lot = db.parking_lots.find(l => l.id === body.parking_lot_id);
      if (!lot) throw Object.assign(new Error('Parking lot not found'), { status: 404 });
      const report = { id: id('report'), parking_lot_id: lot.id, lot_name: lot.name, user_id: body.user_id || null, user_name: String(body.user_name || 'Guest'), status: String(body.status || 'Available'), comment: String(body.comment || ''), created_at: now() };
      db.community_reports.push(report);
      if (/full/i.test(report.status)) lot.available_spaces = 0;
      if (/available/i.test(report.status) && lot.available_spaces === 0) lot.available_spaces = Math.max(1, Math.round(lot.capacity * 0.1));
      lot.updated_at = now();
      return report;
    }) });
  }

  if (method === 'POST' && url.pathname === '/api/owner/register') {
    const body = await parseBody(req);
    const name = String(body.name || body.contact_name || '').trim();
    const email = String(body.email || '').trim().toLowerCase();
    const phone = String(body.phone || '').trim();
    const businessName = String(body.business_name || body.owner_name || '').trim();
    if (!name || !email || !phone) return error(res, 400, 'name, email, and phone are required');
    return json(res, 201, { data: mutate(db => {
      let owner = db.owners.find(o => o.email === email);
      if (owner) return owner;
      owner = { id: id('owner'), name, email, phone, business_name: businessName, status: 'active', created_at: now(), updated_at: now() };
      db.owners.push(owner);
      return owner;
    }) });
  }

  if (method === 'POST' && url.pathname === '/api/owner/parks') {
    const body = await parseBody(req);
    return json(res, 201, { data: mutate(db => {
      const owner = db.owners.find(o => o.id === body.owner_id);
      if (!owner) throw Object.assign(new Error('owner_id not found. Register owner first.'), { status: 400 });
      const lot = newParkingLot(body, owner.id);
      const missing = validateLot(lot);
      if (missing) throw Object.assign(new Error(`Missing required fields: ${missing.join(', ')}`), { status: 400 });
      db.parking_lots.push(lot);
      db.admin_actions.push({ id: id('action'), admin_id: null, target_type: 'parking_lot', target_id: lot.id, action: 'owner_submitted', notes: `Submitted by ${owner.email}`, created_at: now() });
      return lot;
    }) });
  }

  if (method === 'GET' && url.pathname === '/api/owner/parks') {
    const ownerId = url.searchParams.get('owner_id');
    const db = readDb();
    return json(res, 200, { data: db.parking_lots.filter(l => !ownerId || l.owner_id === ownerId) });
  }

  if (method === 'PATCH' && /^\/api\/owner\/parks\/[^/]+\/availability$/.test(url.pathname)) {
    const body = await parseBody(req);
    const lotId = parts[3];
    return json(res, 200, { data: mutate(db => {
      const lot = db.parking_lots.find(l => l.id === lotId);
      if (!lot) throw Object.assign(new Error('Parking lot not found'), { status: 404 });
      lot.available_spaces = Math.max(0, Math.min(lot.capacity, Number(body.available_spaces)));
      lot.updated_at = now();
      return lot;
    }) });
  }

  if (method === 'PATCH' && /^\/api\/owner\/parks\/[^/]+\/open-status$/.test(url.pathname)) {
    const body = await parseBody(req);
    const lotId = parts[3];
    return json(res, 200, { data: mutate(db => {
      const lot = db.parking_lots.find(l => l.id === lotId);
      if (!lot) throw Object.assign(new Error('Parking lot not found'), { status: 404 });
      lot.is_open = Boolean(body.is_open);
      lot.updated_at = now();
      return lot;
    }) });
  }

  if (method === 'POST' && url.pathname === '/api/uploads/photo') {
    const body = await parseBody(req);
    const data = String(body.data || '').replace(/^data:[^;]+;base64,/, '');
    if (!data) return error(res, 400, 'Base64 data is required');
    const mime = String(body.mime || 'image/jpeg');
    const ext = mime.includes('png') ? '.png' : mime.includes('webp') ? '.webp' : '.jpg';
    const filename = `${id('photo')}${ext}`;
    ensureDir(UPLOAD_DIR);
    fs.writeFileSync(path.join(UPLOAD_DIR, filename), Buffer.from(data, 'base64'));
    return json(res, 201, { data: { url: `/uploads/${filename}`, filename } });
  }

  if (method === 'GET' && url.pathname === '/api/admin/submissions') {
    if (!requireAdmin(req, res)) return;
    const db = readDb();
    return json(res, 200, { data: db.parking_lots.filter(l => l.owner_listed && l.verification_status !== 'verified') });
  }

  const adminDecision = url.pathname.match(/^\/api\/admin\/parks\/([^/]+)\/(approve|reject|request-info)$/);
  if (method === 'PATCH' && adminDecision) {
    if (!requireAdmin(req, res)) return;
    const body = await parseBody(req);
    const [, lotId, decision] = adminDecision;
    const statusMap = { approve: 'verified', reject: 'rejected', 'request-info': 'more_info_requested' };
    return json(res, 200, { data: mutate(db => {
      const lot = db.parking_lots.find(l => l.id === lotId);
      if (!lot) throw Object.assign(new Error('Parking lot not found'), { status: 404 });
      lot.verification_status = statusMap[decision];
      lot.updated_at = now();
      db.admin_actions.push({ id: id('action'), admin_id: 'admin', target_type: 'parking_lot', target_id: lot.id, action: decision, notes: String(body.notes || ''), created_at: now() });
      return lot;
    }) });
  }

  if (method === 'PATCH' && /^\/api\/admin\/parks\/[^/]+$/.test(url.pathname)) {
    if (!requireAdmin(req, res)) return;
    const body = await parseBody(req);
    const lotId = parts[3];
    return json(res, 200, { data: mutate(db => {
      const lot = db.parking_lots.find(l => l.id === lotId);
      if (!lot) throw Object.assign(new Error('Parking lot not found'), { status: 404 });
      const allowed = ['name', 'area', 'type', 'address', 'capacity', 'available_spaces', 'walk_meters', 'drive_minutes', 'rating', 'is_open', 'primary_photo_url', 'opening_hours'];
      for (const key of allowed) if (body[key] !== undefined) lot[key] = body[key];
      if (body.amenities) lot.amenities = { ...lot.amenities, ...body.amenities };
      lot.updated_at = now();
      return lot;
    }) });
  }

  if (method === 'GET' && url.pathname === '/api/saved') {
    const userId = url.searchParams.get('user_id') || 'user_demo';
    const db = readDb();
    const ids = db.saved_parks.filter(s => s.user_id === userId).map(s => s.parking_lot_id);
    return json(res, 200, { data: db.parking_lots.filter(l => ids.includes(l.id)) });
  }

  if (method === 'POST' && url.pathname === '/api/saved') {
    const body = await parseBody(req);
    return json(res, 201, { data: mutate(db => {
      const row = { id: id('saved'), user_id: body.user_id || 'user_demo', parking_lot_id: body.parking_lot_id, created_at: now() };
      if (!db.saved_parks.some(s => s.user_id === row.user_id && s.parking_lot_id === row.parking_lot_id)) db.saved_parks.push(row);
      return row;
    }) });
  }

  const savedDelete = url.pathname.match(/^\/api\/saved\/([^/]+)$/);
  if (method === 'DELETE' && savedDelete) {
    const userId = url.searchParams.get('user_id') || 'user_demo';
    const lotId = savedDelete[1];
    return json(res, 200, { data: mutate(db => {
      const before = db.saved_parks.length;
      db.saved_parks = db.saved_parks.filter(s => !(s.user_id === userId && s.parking_lot_id === lotId));
      return { removed: before - db.saved_parks.length };
    }) });
  }

  return error(res, 404, 'API endpoint not found');
}

function serveStatic(req, res, url) {
  let pathname = decodeURIComponent(url.pathname);
  if (pathname === '/') pathname = '/poc.html';
  if (pathname.startsWith('/uploads/')) {
    const file = path.resolve(UPLOAD_DIR, pathname.replace('/uploads/', ''));
    if (!file.startsWith(path.resolve(UPLOAD_DIR))) return error(res, 403, 'Forbidden');
    if (!fs.existsSync(file)) return error(res, 404, 'Upload not found');
    const ext = path.extname(file).toLowerCase();
    return send(res, 200, fs.readFileSync(file), { 'Content-Type': mimeTypes[ext] || 'application/octet-stream' });
  }
  const file = path.resolve(ROOT, `.${pathname}`);
  if (!file.startsWith(ROOT)) return error(res, 403, 'Forbidden');
  if (!fs.existsSync(file) || fs.statSync(file).isDirectory()) return error(res, 404, 'File not found');
  const ext = path.extname(file).toLowerCase();
  send(res, 200, fs.readFileSync(file), { 'Content-Type': mimeTypes[ext] || 'application/octet-stream' });
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  if (req.method === 'OPTIONS') return send(res, 204, '');
  try {
    if (url.pathname.startsWith('/api/')) return await handleApi(req, res, url);
    return serveStatic(req, res, url);
  } catch (err) {
    const status = err.status || 500;
    return error(res, status, err.message || 'Server error');
  }
});

ensureDir(UPLOAD_DIR);
if (!fs.existsSync(DATA_FILE)) writeDb(defaultDb());
server.listen(PORT, () => {
  console.log(`ParkSwift Lite backend running at http://localhost:${PORT}`);
  console.log(`Frontend: http://localhost:${PORT}/poc.html`);
  console.log(`Admin token: ${ADMIN_TOKEN}`);
});

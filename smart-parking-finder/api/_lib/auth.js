const { fail } = require('./http');
const { getClient } = require('./supabase');

// Verifies the caller's Supabase Auth JWT server-side and returns the user it
// belongs to, or null. The API never trusts a client-supplied user/owner id —
// this is the only source of truth for "who is making this request".
async function getAuthedUser(req) {
  const header = req.headers['authorization'] || '';
  const token = header.startsWith('Bearer ') ? header.slice('Bearer '.length).trim() : null;
  if (!token) return null;
  const { data, error } = await getClient().auth.getUser(token);
  if (error || !data?.user) return null;
  return data.user;
}

async function requireUser(req, res) {
  const user = await getAuthedUser(req);
  if (!user) { fail(res, 401, 'Sign in required'); return null; }
  return user;
}

async function getOwnerForUser(userId) {
  const { data, error } = await getClient().from('owners').select('*').eq('auth_user_id', userId).maybeSingle();
  if (error) throw error;
  return data;
}

async function requireOwner(req, res) {
  const user = await requireUser(req, res);
  if (!user) return null;
  const owner = await getOwnerForUser(user.id);
  if (!owner) { fail(res, 400, 'Register as an owner first (POST /api/owner/register).'); return null; }
  return owner;
}

async function isAdmin(userId) {
  const { data, error } = await getClient().from('admins').select('user_id').eq('user_id', userId).maybeSingle();
  if (error) throw error;
  return Boolean(data);
}

async function requireAdminUser(req, res) {
  const user = await requireUser(req, res);
  if (!user) return null;
  if (!await isAdmin(user.id)) { fail(res, 403, 'Admin access required'); return null; }
  return user;
}

module.exports = { getAuthedUser, requireUser, getOwnerForUser, requireOwner, requireAdminUser };

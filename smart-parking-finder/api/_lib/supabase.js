const { createClient } = require('@supabase/supabase-js');
const { fail } = require('./http');

let client;
function getClient() {
  if (client) return client;
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;
  if (!url || !key) throw new Error('Missing SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY environment variables');
  client = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
  return client;
}

function statusFromPostgrestError(error) {
  if (error.code === 'PGRST116') return 404; // no rows for .single()/.maybeSingle()
  if (error.code === '23505') return 409; // unique_violation
  if (error.code === '23503') return 400; // foreign_key_violation
  if (error.code === '23514') return 400; // check_violation
  if (error.code === 'P0002') return 404; // raised "not found" (our RPC functions)
  if (error.code === 'P0001') return 400; // raised generic exception (our RPC functions)
  return undefined;
}

function dbError(error) {
  const err = new Error(error.message || 'Supabase error');
  err.status = statusFromPostgrestError(error) || 500;
  err.details = error.details || error.hint || undefined;
  return err;
}

// Unwraps a Supabase query builder result, throwing a normalized error on failure.
async function run(builder) {
  const { data, error } = await builder;
  if (error) throw dbError(error);
  return data;
}

async function one(table, id, idColumn = 'id') {
  const { data, error } = await getClient().from(table).select('*').eq(idColumn, id).maybeSingle();
  if (error) throw dbError(error);
  return data;
}

async function handle(fn, res) {
  try { await fn(); } catch (err) { fail(res, err.status || 500, err.message || 'Server error', err.details); }
}

// PostgREST treats , ( ) as structural characters inside an or()/and() filter value.
// Backslash-escape them so user-supplied search text can't alter the filter's shape.
function escapeFilterValue(value) {
  return String(value ?? '').replace(/[,()]/g, '\\$&');
}

module.exports = { getClient, run, one, handle, dbError, escapeFilterValue };

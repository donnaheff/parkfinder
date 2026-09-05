const { ok, requireMethod, parseBody } = require('./_lib/http');
const { getClient, run, handle } = require('./_lib/supabase');
const { requireUser } = require('./_lib/auth');

const CODE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // no 0/O/1/I — easy to misread
function randomCode(length = 7) {
  let code = '';
  for (let i = 0; i < length; i += 1) code += CODE_CHARS[Math.floor(Math.random() * CODE_CHARS.length)];
  return code;
}

// Referral codes are generated lazily on first GET rather than at signup,
// so a user who never opens /account never gets one — fine, since nothing
// else depends on it existing. Retries a few times on the (very unlikely)
// unique-constraint collision rather than pre-checking availability.
async function ensureReferralCode(client, userId, existingRow) {
  if (existingRow?.referral_code) return existingRow;
  for (let attempt = 0; attempt < 5; attempt += 1) {
    try {
      const rows = await run(
        client.from('profiles')
          .upsert({ user_id: userId, referral_code: randomCode() }, { onConflict: 'user_id' })
          .select()
      );
      return rows[0];
    } catch (err) {
      if (err.status !== 409) throw err; // unique_violation on referral_code — retry with a new one
    }
  }
  throw new Error('Could not generate a unique referral code — try again');
}

module.exports = async (req, res) => handle(async () => {
  if (!requireMethod(req, res, ['GET', 'PUT'])) return;
  const user = await requireUser(req, res);
  if (!user) return;
  const client = getClient();

  if (req.method === 'GET') {
    const rows = await run(client.from('profiles').select('*').eq('user_id', user.id).limit(1));
    const row = await ensureReferralCode(client, user.id, rows[0]);
    return ok(res, row);
  }

  const body = await parseBody(req);
  const row = await run(
    client.from('profiles')
      .upsert({ user_id: user.id, phone: String(body.phone || '').trim(), updated_at: new Date().toISOString() }, { onConflict: 'user_id' })
      .select().single()
  );
  ok(res, row);
}, res);

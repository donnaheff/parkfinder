const { ok, fail, requireMethod, parseBody } = require('./_lib/http');
const { getClient, run, handle } = require('./_lib/supabase');
const { requireUser } = require('./_lib/auth');

module.exports = async (req, res) => handle(async () => {
  if (!requireMethod(req, res, ['GET', 'POST'])) return;
  const user = await requireUser(req, res);
  if (!user) return;
  const client = getClient();

  if (req.method === 'GET') {
    return ok(res, await run(client.from('vehicles').select('*').eq('user_id', user.id).order('created_at', { ascending: false })));
  }

  const body = await parseBody(req);
  const label = String(body.label || '').trim();
  if (!label) return fail(res, 400, 'label is required');
  const VEHICLE_TYPES = ['car', 'motorbike', 'van', 'suv'];
  const vehicleType = VEHICLE_TYPES.includes(body.vehicle_type) ? body.vehicle_type : 'car';

  const inserted = await run(
    client.from('vehicles').insert({
      user_id: user.id,
      label,
      license_plate: String(body.license_plate || '').trim() || null,
      vehicle_type: vehicleType,
      is_default: Boolean(body.is_default),
    }).select()
  );
  ok(res, inserted[0], 201);
}, res);

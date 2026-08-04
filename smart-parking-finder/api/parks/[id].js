const { ok, fail, requireMethod } = require('../_lib/http');
const { one, handle } = require('../_lib/supabase');
module.exports = async (req, res) => handle(async () => {
  if (!requireMethod(req, res, ['GET'])) return;
  const lot = await one('parking_lots', req.query.id);
  if (!lot) return fail(res, 404, 'Parking lot not found');
  ok(res, lot);
}, res);

const { ok, requireMethod } = require('./_lib/http');
const { rest, handle } = require('./_lib/supabase');
module.exports = async (req, res) => handle(async () => {
  if (!requireMethod(req, res, ['GET'])) return;
  const rows = await rest('parking_lots?select=*');
  const areas = [...new Set(rows.map(r => r.area))].sort().map(area => {
    const lots = rows.filter(r => r.area === area);
    return { area, lots: lots.length, available_spaces: lots.reduce((s, l) => s + (l.is_open ? l.available_spaces : 0), 0), owner_listed: lots.filter(l => l.owner_listed).length };
  });
  ok(res, areas);
}, res);

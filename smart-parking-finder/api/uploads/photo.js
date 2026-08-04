const { ok, fail, requireMethod, parseBody, id } = require('../_lib/http');
const { handle } = require('../_lib/supabase');
module.exports = async (req, res) => handle(async () => {
  if (!requireMethod(req, res, ['POST'])) return;
  const body = await parseBody(req);
  // Serverless placeholder: production should upload to Supabase Storage.
  // The frontend can also pass image URLs directly for the lean POC.
  if (!body.data && !body.url) return fail(res, 400, 'Send a public image url, or configure Supabase Storage for base64 uploads.');
  if (body.url) return ok(res, { url: body.url }, 201);
  return ok(res, { url: `data:${body.mime || 'image/jpeg'};base64,${String(body.data).replace(/^data:[^;]+;base64,/, '')}`, filename: id('photo') }, 201);
}, res);

const { ok, fail, requireMethod, parseBody, id } = require('../_lib/http');
const { handle } = require('../_lib/supabase');
const { requireUser } = require('../_lib/auth');

const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const MAX_BASE64_BYTES = 5 * 1024 * 1024; // 5MB decoded

module.exports = async (req, res) => handle(async () => {
  if (!requireMethod(req, res, ['POST'])) return;
  const user = await requireUser(req, res);
  if (!user) return;
  const body = await parseBody(req);
  // Serverless placeholder: production should upload to Supabase Storage.
  // The frontend can also pass image URLs directly for the lean POC.
  if (!body.data && !body.url) return fail(res, 400, 'Send a public image url, or configure Supabase Storage for base64 uploads.');
  if (body.url) {
    let parsed;
    try { parsed = new URL(String(body.url)); } catch { return fail(res, 400, 'url must be a valid absolute URL'); }
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      return fail(res, 400, 'url must use http or https');
    }
    return ok(res, { url: parsed.toString() }, 201);
  }
  const mime = String(body.mime || 'image/jpeg');
  if (!ALLOWED_MIME_TYPES.includes(mime)) {
    return fail(res, 400, `mime must be one of: ${ALLOWED_MIME_TYPES.join(', ')}`);
  }
  const base64 = String(body.data).replace(/^data:[^;]+;base64,/, '');
  const decodedBytes = Math.floor((base64.length * 3) / 4);
  if (decodedBytes > MAX_BASE64_BYTES) {
    return fail(res, 400, `Image exceeds the ${MAX_BASE64_BYTES / (1024 * 1024)}MB limit`);
  }
  return ok(res, { url: `data:${mime};base64,${base64}`, filename: id('photo') }, 201);
}, res);

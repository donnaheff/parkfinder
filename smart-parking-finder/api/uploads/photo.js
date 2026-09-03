const { ok, fail, requireMethod, parseBody, id } = require('../_lib/http');
const { getClient, handle } = require('../_lib/supabase');
const { requireUser } = require('../_lib/auth');

const ALLOWED_MIME_TYPES = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp', 'image/gif': 'gif' };
const MAX_BASE64_BYTES = 5 * 1024 * 1024; // 5MB decoded
const BUCKET = 'lot-photos';

module.exports = async (req, res) => handle(async () => {
  if (!requireMethod(req, res, ['POST'])) return;
  const user = await requireUser(req, res);
  if (!user) return;
  const body = await parseBody(req);
  if (!body.data && !body.url) return fail(res, 400, 'Send a public image url, or base64 image data.');

  if (body.url) {
    let parsed;
    try { parsed = new URL(String(body.url)); } catch { return fail(res, 400, 'url must be a valid absolute URL'); }
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      return fail(res, 400, 'url must use http or https');
    }
    return ok(res, { url: parsed.toString() }, 201);
  }

  const mime = String(body.mime || 'image/jpeg');
  const ext = ALLOWED_MIME_TYPES[mime];
  if (!ext) return fail(res, 400, `mime must be one of: ${Object.keys(ALLOWED_MIME_TYPES).join(', ')}`);

  const base64 = String(body.data).replace(/^data:[^;]+;base64,/, '');
  const buffer = Buffer.from(base64, 'base64');
  if (buffer.length > MAX_BASE64_BYTES) {
    return fail(res, 400, `Image exceeds the ${MAX_BASE64_BYTES / (1024 * 1024)}MB limit`);
  }

  const filename = `${id('photo')}.${ext}`;
  const path = `${user.id}/${filename}`;
  const client = getClient();
  const { error: uploadError } = await client.storage.from(BUCKET).upload(path, buffer, {
    contentType: mime,
    upsert: false,
  });
  if (uploadError) return fail(res, 500, `Upload failed: ${uploadError.message}`);

  const { data } = client.storage.from(BUCKET).getPublicUrl(path);
  ok(res, { url: data.publicUrl, filename }, 201);
}, res);

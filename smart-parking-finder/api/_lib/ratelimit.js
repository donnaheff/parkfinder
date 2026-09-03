const { fail } = require('./http');

let limiter;
let warned = false;

// Lazily builds an Upstash-backed limiter. Returns null when Upstash isn't
// configured (e.g. local dev, or before a deployment sets it up) so callers
// can no-op instead of hard-failing — rate limiting is additive protection,
// not something that should take the API down if unconfigured.
function getLimiter() {
  if (limiter !== undefined) return limiter;
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) {
    if (!warned) { console.warn('[ratelimit] UPSTASH_REDIS_REST_URL/TOKEN not set — rate limiting is disabled.'); warned = true; }
    limiter = null;
    return limiter;
  }
  // Import lazily so environments without Upstash configured never even load the SDK.
  const { Ratelimit } = require('@upstash/ratelimit');
  const { Redis } = require('@upstash/redis');
  limiter = new Ratelimit({
    redis: new Redis({ url, token }),
    limiter: Ratelimit.slidingWindow(20, '1 m'),
    analytics: false,
    prefix: 'parkswift-ratelimit',
  });
  return limiter;
}

function clientIp(req) {
  const forwarded = req.headers['x-forwarded-for'];
  if (typeof forwarded === 'string' && forwarded.length) return forwarded.split(',')[0].trim();
  return req.socket?.remoteAddress || 'unknown';
}

// Returns true if the request was allowed to proceed. Sends a 429 and
// returns false when the caller should stop handling the request.
async function rateLimit(req, res, key) {
  const rl = getLimiter();
  if (!rl) return true;
  const identifier = `${key}:${clientIp(req)}`;
  const { success } = await rl.limit(identifier);
  if (!success) { fail(res, 429, 'Too many requests — please slow down and try again shortly.'); return false; }
  return true;
}

module.exports = { rateLimit };

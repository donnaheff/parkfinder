// Phase 10: no more `output: 'export'`. The public pages (/, /lots, /areas,
// /updates, /lot/[id]) are now server-rendered for SEO; owner/admin/
// reservations/login/map/operator stay pure client components — this is a
// scoped exception for those 5 routes, not a wholesale reversal of the
// client-rendered architecture. api/*.js are separate top-level Vercel
// Serverless Functions (not Next Route Handlers), so they're unaffected
// either way.
/** @type {import('next').NextConfig} */
const nextConfig = {
  images: { unoptimized: true },
  trailingSlash: false,
};

module.exports = nextConfig;

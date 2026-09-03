# ParkSwift Lite Minimal Backend

A dependency-free Node.js backend for the lean ParkSwift park finder.

## Run

```bash
cd smart-parking-finder/backend
PORT=8787 ADMIN_TOKEN=dev-admin-token node server.js
```

Then, in another terminal, point the Next.js app at it:

```bash
cd smart-parking-finder
NEXT_PUBLIC_API_BASE=http://localhost:8787 npm run dev
```

## ⚠️ Out of sync with the real API since Supabase Auth was added

The real `api/*` (Vercel) endpoints now require a signed-in Supabase session for
saved parks, owner registration/listings, and admin moderation — the caller's
identity is verified server-side from a JWT, never trusted from a request
parameter. This local JSON-file backend predates that and still uses the old
contract (`user_id`/`owner_id` query params, `x-admin-token` header) — it has
no concept of real user accounts, so it can't be updated to match without
effectively re-implementing Supabase Auth locally.

This backend is still useful for exercising the **public, unauthenticated**
flows (search, map, lots, areas, community updates) end-to-end without a
Supabase project. For the owner/admin flows, test against a real (free-tier)
Supabase project instead — see `../VERCEL_SUPABASE_SETUP.md`.

## Core endpoints

### Public

```text
GET  /api/health
GET  /api/parks?q=&area=&available=true&amenity=ev&ownerListed=true
GET  /api/parks/:id
GET  /api/areas
GET  /api/updates
POST /api/updates
GET  /api/saved?user_id=user_demo
POST /api/saved
DELETE /api/saved/:parking_lot_id?user_id=user_demo
```

### Owner (pre-auth contract — see warning above)

```text
POST  /api/owner/register
POST  /api/owner/parks
GET   /api/owner/parks?owner_id=owner_xxx
PATCH /api/owner/parks/:id/availability
PATCH /api/owner/parks/:id/open-status
POST  /api/uploads/photo
```

### Admin (pre-auth contract — see warning above)

Send `x-admin-token: dev-admin-token` unless changed.

```text
GET   /api/admin/submissions
PATCH /api/admin/parks/:id/approve
PATCH /api/admin/parks/:id/reject
PATCH /api/admin/parks/:id/request-info
PATCH /api/admin/parks/:id
```

## Notes

- Uses `db.json` for persistence.
- Uses `uploads/` for uploaded photos.
- Good for POC and demos, not final production.
- Later production should migrate to PostgreSQL/Supabase and object storage.

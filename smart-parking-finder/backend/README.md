# ParkSwift Lite Minimal Backend

A dependency-free Node.js backend for the lean ParkSwift park finder.

## Run

```bash
cd smart-parking-finder/backend
PORT=8787 ADMIN_TOKEN=dev-admin-token node server.js
```

Open:

```text
http://localhost:8787/poc.html
http://localhost:8787/backend-connected.html
```

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

### Owner

```text
POST  /api/owner/register
POST  /api/owner/parks
GET   /api/owner/parks?owner_id=owner_xxx
PATCH /api/owner/parks/:id/availability
PATCH /api/owner/parks/:id/open-status
POST  /api/uploads/photo
```

### Admin

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

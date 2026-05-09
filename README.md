# SMART-S2D

SMART-S2D is a graduation project web application for managing endogenous software requirements using the SMART methodology and R2F-inspired categorization.

The active prototype taxonomy is intentionally scoped to the software requirements branch:

- Functional requirements
- Data requirements
- User interface requirements
- Technical interface requirements

Operation and development requirements are documented as out of scope for this prototype slice.

## Current Branch Work

- Active development branch: `SmTEST`
- Goal: replace the one-page prototype with a real Supabase-backed product slice before anything is merged to `main`
- Browser-based React shell in `frontend/`
- Rule-based SMART subject/category suggestion
- Guided requirement writing validation
- Workspace model based on accounts, organizations, projects, requirements, reports, and audit logs
- Taxonomy chooser with Software active and Operation/Development visible for future phases
- Category-specific DS0-inspired templates for Functional, Data, User Interface, and Technical Interface requirements
- Dashboard summary and retrieval filtering
- Software-only taxonomy tree
- Phase 1 Supabase schema and RLS setup in `database/supabase_phase1.sql`
- Django/DRF backend scaffold in `backend/`

## Supabase Setup

Create a Supabase project, then open the SQL editor and run:

```text
database/supabase_phase1.sql
```

For local browser configuration, copy:

```powershell
Copy-Item frontend/src/env.local.example.js frontend/src/env.local.js
```

Edit `frontend/src/env.local.js` with the project URL and anon key:

```js
window.SMART_S2D_CONFIG = {
  SUPABASE_URL: "https://your-project.supabase.co",
  SUPABASE_ANON_KEY: "your-anon-key",
};
```

`frontend/src/env.local.js` is ignored by Git. Do not commit database passwords or service-role keys.

## Run The Frontend

This workspace currently exposes Node.js but not `npm` or Python. The frontend therefore includes a dependency-free local server:

```powershell
node frontend/server.mjs
```

Open:

```text
http://localhost:5173
```

The current browser shell is dependency-free at install time. Supabase is loaded through browser ES modules in the Phase 1 implementation so the app can still run without `npm install`.

## Verify Available Tests

```powershell
node --test frontend/src/domain/*.test.mjs frontend/serverPaths.test.mjs
```

## Planned Full Stack

- Frontend: React, Vite, TypeScript, React Router, TanStack Query, React Hook Form, Zod, Recharts
- Backend: Python, Django, Django REST Framework
- Auth/database: Supabase Auth and Supabase PostgreSQL
- Reports: XML, PDF, and DOCX exports
- Deployment: Vercel for frontend, lightweight hosted Django backend

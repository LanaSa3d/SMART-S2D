# SMART-S2D

SMART-S2D is a graduation project prototype for managing endogenous software requirements using the SMART methodology and R2F-inspired categorization.

The active prototype taxonomy is intentionally scoped to the software requirements branch:

- Functional requirements
- Data requirements
- User interface requirements
- Technical interface requirements

Operation and development requirements are documented as out of scope for this prototype slice.

## Current Prototype Slice

- Browser-based React prototype shell in `frontend/`
- Rule-based SMART subject/category suggestion
- Guided requirement writing validation
- Dashboard summary and retrieval filtering
- Software-only taxonomy tree
- Supabase/PostgreSQL schema in `database/schema.sql`
- Django/DRF backend scaffold in `backend/`

## Run The Frontend Prototype

This workspace currently exposes Node.js but not `npm` or Python. The frontend therefore includes a dependency-free local server:

```powershell
node frontend/server.mjs
```

Open:

```text
http://localhost:5173
```

The current browser prototype is dependency-free at runtime so it works locally without `npm` or CDN access. The next phase can convert this shell to a Vite-installed React app once `npm` is available in the terminal.

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

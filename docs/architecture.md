# SMART-S2D Architecture

## System Understanding

SMART-S2D is not a task tracker. Its main responsibility is to operationalize SMART/R2F thinking for software requirements: guided writing, software-subject categorization, taxonomy navigation, retrieval, reporting, and auditability.

The prototype uses the supplied taxonomy image as a conceptual reference only. The active taxonomy is limited to the software requirements branch:

1. Functional requirements
2. Data requirements
3. User interface requirements
4. Technical interface requirements

## Recommended Architecture

```text
SMART-S2D/
  frontend/      React prototype and SMART client modules
  backend/       Django REST Framework API scaffold
  database/      Supabase PostgreSQL schema and seed data
  docs/          Architecture and implementation planning
```

The frontend owns the academic demo experience. The backend owns persistence, authorization, validation, categorization rules, audit logging, and report generation. Supabase owns authentication and PostgreSQL hosting.

## Frontend Architecture

- `src/domain/`: pure SMART/R2F business rules that are easy to test.
- `src/main.mjs`: React screen composition for dashboard, requirement writing, taxonomy, repository, reports, and audit trail.
- `src/styles.css`: responsive professional interface.

The current prototype uses local browser modules so it can run with only Node.js available and without CDN access. The target production-ready frontend should move to Vite + React + TypeScript once `npm` is available.

## Backend Architecture

Django is split into focused apps:

- `accounts`: user profiles and roles mapped from Supabase Auth.
- `projects`: project ownership and lifecycle.
- `taxonomy`: software requirement subjects and editable category hierarchy.
- `requirements`: requirement CRUD, versions, category assignment, and refinement.
- `reports`: XML/PDF/DOCX export requests.
- `audit`: immutable activity log.

The backend should validate Supabase JWTs, enforce role permissions, and write audit events for important actions.

## Database Design

The schema is normalized around users, projects, requirements, categories, reports, and audit logs. Requirements store both a suggested category and a final category so the prototype can demonstrate human review of rule-based suggestions.

Atomic refinement is represented by `requirement_refinements`, linking a parent requirement to child atomic requirements.

## SMART Categorization Strategy

Categorization is rule-based, not AI-based:

- `login`, `authenticate`, `verify`, `process`, `calculate` -> Functional requirements
- `save`, `store`, `database`, `retrieve`, `record` -> Data requirements
- `page`, `button`, `form`, `dashboard`, `menu`, `display` -> User interface requirements
- `API`, `REST`, `JSON`, `OAuth`, `external system`, `integration` -> Technical interface requirements

Rules return subject, category, confidence, and rationale. Users can accept or override the suggestion.

## Requirement Writing Workflow

1. User selects project, priority, and status.
2. User writes a requirement using: `The software shall [action] [target/object].`
3. System validates the text for vague wording, missing action verbs, short statements, and multiple unrelated actions.
4. System suggests a software requirement subject and category.
5. User accepts or overrides before saving.

## Security Decisions

- Supabase Auth handles sign-in and JWT issuance.
- Django validates JWTs and maps users to role profiles.
- API endpoints use role-based permissions.
- Database tables preserve creator/updater fields.
- Audit logs track login, create, update, delete, category changes, project changes, report exports, and user-management actions.

## Deployment Strategy

- Frontend: Vercel.
- Backend: lightweight Django deployment.
- Database/Auth: Supabase project.
- Environment variables hold Supabase URL, JWT audience, API keys, and database connection details.

# SMART-S2D

SMART-S2D is a graduation-project prototype for managing endogenous software requirements using the SMART methodology and an R2F-inspired software requirement taxonomy.

The system is not a generic task tracker. It is designed to help users create, categorize, review, retrieve, and export structured software requirements through a guided SMART Requirement Template and a software-only taxonomy.

## Current Prototype Scope

The working prototype demonstrates the main SMART-S2D workflow:

- Account authentication with Supabase Auth
- Company and project workspaces
- Six digit company invite codes
- Role-aware access for Admin, Project Manager, Analyst, and Software User
- SMART Requirement Template for structured requirement writing
- Rule-based subject and category suggestions
- Requirement validation guidance
- Requirement repository with view, edit, update, and delete actions
- Dashboard metrics for requirement status tracking
- Taxonomy browser for software requirements
- Multi-criteria requirement search
- XML and DOCX requirement export
- Audit logging for key create, update, and delete actions

The active taxonomy is limited to the Software requirements branch. Operation requirements and Development requirements are shown as future branches but are not active in the current prototype.

## SMART/R2F Taxonomy Scope

SMART-S2D currently supports four software requirement subjects:

| Subject | Purpose |
| --- | --- |
| Function requirements | Capture behavior the software performs for users or stakeholders. |
| Data requirements | Describe software data that must be stored, managed, retrieved, or preserved. |
| User Interface requirements | Define screens, forms, menus, dashboards, and navigation behavior. |
| Technical Interface requirements | Specify APIs, integrations, protocols, and external system communication. |

The requirement template uses these SMART/R2F concepts:

- Generic Subject: the broad SMART subject selected for the requirement
- Specific Subject: the concrete requirement topic
- Specific Subject statement: the required behavior or constraint
- Specific Subject model: the model or structure that explains the requirement

Generated statements follow this style:

```text
The "SMART-S2D" software shall require "Data" "requirement metadata" "including category, priority, status, owner, and version history" according to the "normalized requirement repository model".
```

## Main Pages

- Workspace: create, join, open, update, and delete companies and projects
- Dashboard: view Requirement Distribution by Total, Draft, Need Review, Approved, and Rejected
- SMART Requirement Template: create requirements with guided SMART/R2F fields
- Requirements: browse, open, edit, update, and delete saved requirements
- Taxonomy: view the software requirement taxonomy tree
- Search: filter requirements by keyword, subject, category, priority, status, source, and validation state
- Reports: export project or filtered requirements as XML or DOCX
- Admin/Settings: administrative surface for role-aware system controls

## Tech Stack

| Layer | Technology |
| --- | --- |
| Frontend prototype | Browser ES modules, component-style rendering, CSS |
| Auth | Supabase Auth |
| Database | Supabase PostgreSQL |
| Development server | Node.js zero-dependency static server |
| Backend scaffold | Python, Django, Django REST Framework |
| Future frontend target | React with a component-based architecture |

The current frontend is intentionally dependency-light so it can run reliably for demonstration. The project structure still keeps domain logic, services, and UI rendering separated so the prototype can later be migrated to React without changing the SMART/R2F business rules.

## Setup Guide

### 1. Clone the repository

```bash
git clone https://github.com/LanaSa3d/SMART-S2D.git
cd SMART-S2D
```

### 2. Set up Supabase

1. Create a Supabase project.
2. Open the Supabase SQL Editor.
3. Copy the full contents of `database/supabase_phase1.sql`.
4. Paste it into the SQL Editor and run it.

This creates the tables, seed taxonomy data, helper functions, triggers, Row Level Security policies, and audit logging support.

Important: keep Row Level Security enabled. If a new account can see another account's companies or projects, rerun `database/supabase_phase1.sql` so the latest membership policies are applied.

### 3. Disable email confirmation for testing

In Supabase:

1. Go to Authentication.
2. Open Providers.
3. Select Email.
4. Turn off Confirm email.
5. Save the setting.

This allows test accounts to sign in immediately.

### 4. Configure the frontend

Create a local config file:

```powershell
Copy-Item frontend/src/env.local.example.js frontend/src/env.local.js
```

For macOS or Linux:

```bash
cp frontend/src/env.local.example.js frontend/src/env.local.js
```

Add your Supabase project credentials:

```js
window.SMART_S2D_CONFIG = {
  SUPABASE_URL: "https://your-project.supabase.co",
  SUPABASE_ANON_KEY: "your-anon-key",
};
```

`frontend/src/env.local.js` is ignored by git. Do not commit real Supabase keys.

### 5. Run the app

```bash
node frontend/server.mjs
```

Open:

```text
http://localhost:5173
```

No `npm install` is required for the prototype server.

## How to Use

1. Create an account or sign in.
2. Create a company or join an existing company with a six digit invite code.
3. Create or open a project.
4. Open the SMART Requirement Template page.
5. Select the Software requirements taxonomy.
6. Choose Function, Data, User Interface, or Technical Interface requirements.
7. Fill in the template fields and review the generated statement.
8. Select priority and status, then save the requirement.
9. Open the Requirements or Search page to retrieve and edit saved requirements.
10. Use Reports to export requirements as XML or DOCX.

## Roles

| Role | Main Capabilities |
| --- | --- |
| Admin | Manage companies, projects, members, requirements, reports, and audit visibility. |
| Project Manager | Manage company projects, invite members, review requirements, and view dashboards. |
| Analyst | Create, update, categorize, review, search, and export requirements. |
| Software User | Join invited companies, create personal companies/projects, and manage own submitted requirements. |

## Project Structure

```text
SMART-S2D/
  frontend/
    index.html
    server.mjs
    src/
      main.mjs
      styles.css
      config.mjs
      domain/
        accessModel.mjs
        dashboardModel.mjs
        entities.mjs
        exportModel.mjs
        importModel.mjs
        smartRules.mjs
        workflowModel.mjs
      services/
        repository.mjs
        supabaseClient.mjs
  database/
    schema.sql
    supabase_phase1.sql
  backend/
    apps/
    smart_s2d/
    requirements.txt
  docs/
```

## Run Tests

```bash
node --check frontend/src/main.mjs
node --test frontend/src/*.test.mjs frontend/src/domain/*.test.mjs frontend/serverPaths.test.mjs database/*.test.mjs
```

## Deployment Notes

- The frontend prototype can be hosted as a static site after configuring Supabase credentials.
- Supabase handles authentication, database storage, RLS authorization, and persistence.
- The Django backend scaffold is included for future API hardening and server-side expansion.
- AI features are intentionally not implemented yet, but the rule-based SMART/R2F services are separated so AI assistance can be added later.

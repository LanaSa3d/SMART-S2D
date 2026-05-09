# SMART-S2D Supabase Vertical Slice Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the first real SMART-S2D product slice on branch `SmTEST`: authenticated users, organizations, projects, SMART wizard persistence, repository/search/dashboard, and XML/PDF/DOCX exports backed by Supabase.

**Architecture:** Keep the current dependency-free frontend runtime and Node static server, but replace prototype arrays with a small app state layer and Supabase data access modules. Supabase Auth and PostgreSQL provide real accounts and persistence; Django remains a later server-side hardening path.

**Tech Stack:** Browser ES modules, React from CDN, Node static server, Node test runner, Supabase JS ESM CDN/client, Supabase PostgreSQL, browser Blob downloads for XML/PDF/DOCX.

---

## File Structure

- Modify `frontend/index.html`: add an import map for `@supabase/supabase-js` and future browser-only export helpers if needed.
- Modify `frontend/server.mjs`: serve `.json` and `.map` safely if needed, and keep SPA/static behavior.
- Create `frontend/src/config.mjs`: reads `window.SMART_S2D_CONFIG` and local environment fallback exposed by `env.local.js`.
- Create `frontend/src/env.local.example.js`: documents local browser config without committing secrets.
- Create ignored local file `frontend/src/env.local.js`: user-specific Supabase URL and anon key.
- Create `database/supabase_phase1.sql`: schema, seed taxonomy rows, RLS policies, and helper triggers for the Supabase SQL editor.
- Modify `database/schema.sql`: either align with the Phase 1 schema or keep as historical scaffold and point to `supabase_phase1.sql`.
- Create `frontend/src/domain/entities.mjs`: constants for roles, statuses, priorities, subjects, taxonomy branches, and validation states.
- Modify `frontend/src/domain/workflowModel.mjs`: add `relationVerb`, formal DS0-style generation, and category metadata.
- Modify `frontend/src/domain/smartRules.mjs`: validate formal template fields and return warning codes.
- Modify `frontend/src/domain/dashboardModel.mjs`: support organization/project scoped dashboard data and validation counts.
- Create `frontend/src/domain/importModel.mjs`: parse pasted text, `.txt`, and `.csv` into candidate rows; keep `.docx` as an explicit review stub until parser is implemented.
- Create `frontend/src/domain/exportModel.mjs`: build XML, HTML-for-PDF print markup, and Word-compatible HTML document content from requirements.
- Create tests:
  - `frontend/src/domain/importModel.test.mjs`
  - `frontend/src/domain/exportModel.test.mjs`
  - update `workflowModel.test.mjs`
  - update `smartRules.test.mjs`
  - update `dashboardModel.test.mjs`
- Create `frontend/src/services/supabaseClient.mjs`: initializes Supabase from config.
- Create `frontend/src/services/repository.mjs`: wraps auth, profiles, organizations, projects, requirements, reports, and audit operations.
- Create `frontend/src/services/downloads.mjs`: creates browser downloads.
- Replace `frontend/src/main.mjs`: render the new module-based app with auth, workspace dashboard, sidebar navigation, SMART wizard, repository, search, dashboard, reports, and settings surfaces.
- Replace `frontend/src/styles.css`: implement Technical Command Center visual direction.
- Update `README.md`: document Supabase setup, SQL migration, env config, local run, tests, and branch workflow.

## Task 1: Supabase Schema And Local Env

**Files:**
- Create: `database/supabase_phase1.sql`
- Create: `frontend/src/env.local.example.js`
- Modify: `README.md`

- [ ] **Step 1: Create the Supabase SQL migration**

Create `database/supabase_phase1.sql` with this schema skeleton, then run it in the Supabase SQL editor:

```sql
create extension if not exists "pgcrypto";

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null default '',
  email text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text not null default '',
  created_by uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.organization_members (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  role text not null check (role in ('Admin', 'Analyst', 'Software User', 'Project Manager')),
  created_at timestamptz not null default now(),
  unique (organization_id, user_id)
);

create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  name text not null,
  description text not null default '',
  status text not null default 'Active' check (status in ('Active', 'Archived')),
  created_by uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.taxonomy_subjects (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  name text not null unique,
  description text not null default '',
  sort_order integer not null default 0
);

create table if not exists public.taxonomy_categories (
  id uuid primary key default gen_random_uuid(),
  subject_code text not null references public.taxonomy_subjects(code) on delete cascade,
  parent_id uuid references public.taxonomy_categories(id) on delete cascade,
  name text not null,
  description text not null default '',
  is_active boolean not null default true,
  sort_order integer not null default 0,
  unique (subject_code, parent_id, name)
);

create table if not exists public.requirements (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  project_id uuid not null references public.projects(id) on delete cascade,
  requirement_code text not null,
  title text not null,
  human_summary text not null default '',
  formal_statement text not null,
  software_name text not null,
  obligation text not null check (obligation in ('shall', 'should', 'must')),
  relation_verb text not null check (relation_verb in ('ensure', 'require', 'adopt')),
  generic_subject text not null,
  specific_subject_name text not null,
  specific_subject_statement text not null,
  specific_subject_model text not null,
  suggested_subject text not null default '',
  suggested_category text not null default '',
  final_subject text not null default '',
  final_category text not null default '',
  priority text not null default 'Medium' check (priority in ('Low', 'Medium', 'High', 'Critical')),
  status text not null default 'Draft' check (status in ('Draft', 'Under Review', 'Categorized', 'Approved', 'Rejected')),
  source_type text not null default 'Manual' check (source_type in ('Manual', 'Paste', 'TXT', 'CSV', 'DOCX')),
  validation_state text not null default 'Valid' check (validation_state in ('Valid', 'Warnings', 'Blocked')),
  validation_warnings jsonb not null default '[]'::jsonb,
  notes text not null default '',
  created_by uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (project_id, requirement_code)
);

create table if not exists public.requirement_versions (
  id uuid primary key default gen_random_uuid(),
  requirement_id uuid not null references public.requirements(id) on delete cascade,
  version_number integer not null,
  formal_statement text not null,
  changed_by uuid not null references public.profiles(id) on delete cascade,
  change_reason text not null default '',
  created_at timestamptz not null default now(),
  unique (requirement_id, version_number)
);

create table if not exists public.imports (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  project_id uuid not null references public.projects(id) on delete cascade,
  source_type text not null check (source_type in ('Paste', 'TXT', 'CSV', 'DOCX')),
  source_name text not null default '',
  candidate_count integer not null default 0,
  created_by uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now()
);

create table if not exists public.reports (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  project_id uuid not null references public.projects(id) on delete cascade,
  name text not null,
  report_type text not null check (report_type in ('Project', 'Filtered', 'Requirement', 'Categorized', 'User')),
  export_format text not null check (export_format in ('XML', 'PDF', 'DOCX')),
  filters jsonb not null default '{}'::jsonb,
  generated_by uuid not null references public.profiles(id) on delete cascade,
  generated_at timestamptz not null default now()
);

create table if not exists public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references public.organizations(id) on delete cascade,
  project_id uuid references public.projects(id) on delete cascade,
  actor_id uuid references public.profiles(id) on delete set null,
  action text not null,
  entity_type text not null,
  entity_id uuid,
  after_data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

insert into public.taxonomy_subjects (code, name, description, sort_order) values
  ('functional', 'Functional requirements', 'Behavior the software must perform for stakeholders.', 1),
  ('data', 'Data requirements', 'Data the software must store, manage, retrieve, or preserve.', 2),
  ('user-interface', 'User interface requirements', 'Screens, controls, navigation, and visual feedback.', 3),
  ('technical-interface', 'Technical interface requirements', 'APIs, integrations, protocols, and external software communication.', 4)
on conflict (code) do update set
  name = excluded.name,
  description = excluded.description,
  sort_order = excluded.sort_order;
```

- [ ] **Step 2: Add RLS policies**

Append RLS policies that allow users to read/write organization data only when they are members. The helper predicate should be:

```sql
create or replace function public.is_org_member(org_id uuid)
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.organization_members member
    where member.organization_id = org_id
      and member.user_id = auth.uid()
  );
$$;
```

Use this pattern for tables with `organization_id`:

```sql
alter table public.organizations enable row level security;
alter table public.organization_members enable row level security;
alter table public.projects enable row level security;
alter table public.requirements enable row level security;
alter table public.requirement_versions enable row level security;
alter table public.imports enable row level security;
alter table public.reports enable row level security;
alter table public.audit_logs enable row level security;

create policy "profiles own row" on public.profiles
  for all using (id = auth.uid()) with check (id = auth.uid());

create policy "members read organizations" on public.organizations
  for select using (public.is_org_member(id));

create policy "authenticated create organizations" on public.organizations
  for insert with check (created_by = auth.uid());

create policy "members update organizations" on public.organizations
  for update using (public.is_org_member(id));
```

Then add matching policies for `projects`, `requirements`, `imports`, `reports`, and `audit_logs` using `public.is_org_member(organization_id)`.

- [ ] **Step 3: Add local config example**

Create `frontend/src/env.local.example.js`:

```js
window.SMART_S2D_CONFIG = {
  SUPABASE_URL: "https://your-project.supabase.co",
  SUPABASE_ANON_KEY: "your-anon-key",
};
```

Copy it locally to `frontend/src/env.local.js` and fill in the real Supabase URL and anon key. Do not commit `env.local.js`.

- [ ] **Step 4: Verify**

Run:

```powershell
git status --short --branch
```

Expected: only `database/supabase_phase1.sql`, `frontend/src/env.local.example.js`, and README edits are tracked. `frontend/src/env.local.js` stays ignored.

- [ ] **Step 5: Commit**

```powershell
git add database/supabase_phase1.sql frontend/src/env.local.example.js README.md
git commit -m "chore: add supabase phase one setup"
```

## Task 2: Domain Models And Tests

**Files:**
- Create: `frontend/src/domain/entities.mjs`
- Create: `frontend/src/domain/importModel.mjs`
- Create: `frontend/src/domain/importModel.test.mjs`
- Create: `frontend/src/domain/exportModel.mjs`
- Create: `frontend/src/domain/exportModel.test.mjs`
- Modify: `frontend/src/domain/workflowModel.mjs`
- Modify: `frontend/src/domain/workflowModel.test.mjs`
- Modify: `frontend/src/domain/smartRules.mjs`
- Modify: `frontend/src/domain/smartRules.test.mjs`
- Modify: `frontend/src/domain/dashboardModel.mjs`
- Modify: `frontend/src/domain/dashboardModel.test.mjs`

- [ ] **Step 1: Write tests for formal template generation**

Update `workflowModel.test.mjs` so `buildTemplateStatement` expects the approved format:

```js
assert.equal(
  statement,
  'The "SMART-S2D" software shall ensure "Technical Interface" "Supabase Auth" described as follows: "authenticate users through secure tokens" according to the model: "OAuth-based Supabase authentication model".',
);
```

Run:

```powershell
node --test frontend/src/domain/workflowModel.test.mjs
```

Expected: FAIL until `relationVerb` and `genericSubject` are implemented.

- [ ] **Step 2: Implement template model**

Update defaults in `workflowModel.mjs` to include:

```js
relationVerb: "ensure",
genericSubject: "Function",
specificSubjectName: "user authentication",
specificSubjectStatement: "verify user credentials against authorized records",
specificSubjectModel: "role-based access control model",
```

Update `buildTemplateStatement` to generate:

```js
return `The "${nextValues.softwareName}" software ${nextValues.obligation} ${nextValues.relationVerb} "${nextValues.genericSubject}" "${nextValues.specificSubjectName}" described as follows: "${nextValues.specificSubjectStatement}" according to the model: "${nextValues.specificSubjectModel}".`;
```

Run the workflow test again. Expected: PASS.

- [ ] **Step 3: Add import parser tests**

Create `importModel.test.mjs` with tests for:

- pasted numbered text split into candidates;
- `.txt` content split by lines/sentences;
- `.csv` content parsed into title/statement rows;
- `.docx` returns a clear unsupported parser state for Phase 1 if browser extraction is not implemented.

Run:

```powershell
node --test frontend/src/domain/importModel.test.mjs
```

Expected: FAIL until `importModel.mjs` exists.

- [ ] **Step 4: Implement import parser**

Create `importModel.mjs` exporting:

```js
export function parsePastedRequirements(text) {}
export function parseTxtRequirements(text, sourceName = "pasted.txt") {}
export function parseCsvRequirements(csvText, sourceName = "requirements.csv") {}
export function parseDocxRequirements() {
  return { candidates: [], warnings: ["DOCX import review is planned for the next parser slice."] };
}
```

Return candidates shaped as:

```js
{
  tempId: "CAND-001",
  title: "Verify user credentials",
  rawText: "The software shall verify user credentials.",
  sourceType: "Paste",
  sourceName: "Pasted text"
}
```

Run the import tests. Expected: PASS.

- [ ] **Step 5: Add export model tests**

Create `exportModel.test.mjs` with tests that assert:

- XML escapes special characters;
- project report XML includes project name and formal statements;
- DOCX HTML includes Word-compatible markup;
- PDF HTML includes printable report title and rows.

Run:

```powershell
node --test frontend/src/domain/exportModel.test.mjs
```

Expected: FAIL until `exportModel.mjs` exists.

- [ ] **Step 6: Implement export builders**

Create `exportModel.mjs` exporting:

```js
export function buildRequirementsXml({ organization, project, requirements }) {}
export function buildReportHtml({ organization, project, requirements, format }) {}
export function buildDocxHtml(payload) {
  return buildReportHtml({ ...payload, format: "DOCX" });
}
export function buildPdfHtml(payload) {
  return buildReportHtml({ ...payload, format: "PDF" });
}
```

Run export tests. Expected: PASS.

- [ ] **Step 7: Run all domain tests**

```powershell
node --test frontend/src/domain/*.test.mjs frontend/serverPaths.test.mjs
```

Expected: all tests pass.

- [ ] **Step 8: Commit**

```powershell
git add frontend/src/domain
git commit -m "feat: add smart domain models for vertical slice"
```

## Task 3: Supabase Client And Repository Layer

**Files:**
- Create: `frontend/src/config.mjs`
- Create: `frontend/src/services/supabaseClient.mjs`
- Create: `frontend/src/services/repository.mjs`
- Modify: `frontend/index.html`

- [ ] **Step 1: Add browser config loading**

Add this script before `main.mjs` in `frontend/index.html`:

```html
<script src="./src/env.local.js"></script>
```

The file is ignored locally. If it is missing, `config.mjs` must show a friendly setup message.

- [ ] **Step 2: Add Supabase import map**

Use CDN ESM import in `supabaseClient.mjs`:

```js
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.84.0";
```

This avoids requiring `npm install` on this machine.

- [ ] **Step 3: Implement config**

Create `config.mjs`:

```js
export function getAppConfig() {
  const config = globalThis.SMART_S2D_CONFIG ?? {};
  return {
    supabaseUrl: config.SUPABASE_URL ?? "",
    supabaseAnonKey: config.SUPABASE_ANON_KEY ?? "",
  };
}

export function hasSupabaseConfig(config = getAppConfig()) {
  return Boolean(config.supabaseUrl && config.supabaseAnonKey);
}
```

- [ ] **Step 4: Implement repository methods**

Create repository functions:

```js
export async function getSession() {}
export async function signInWithEmail(email, password) {}
export async function signUpWithEmail(email, password, fullName) {}
export async function signOut() {}
export async function ensureProfile(user) {}
export async function listOrganizations() {}
export async function createOrganization(name, description) {}
export async function listProjects(organizationId) {}
export async function createProject(organizationId, name, description) {}
export async function listRequirements(projectId) {}
export async function createRequirement(payload) {}
export async function updateRequirement(id, payload) {}
export async function deleteRequirement(id) {}
export async function createReport(payload) {}
export async function writeAuditLog(payload) {}
```

Each function must throw a readable `Error` when Supabase returns an error.

- [ ] **Step 5: Commit**

```powershell
git add frontend/index.html frontend/src/config.mjs frontend/src/services
git commit -m "feat: connect frontend to supabase"
```

## Task 4: Auth, Workspace, And Project UI

**Files:**
- Replace: `frontend/src/main.mjs`
- Replace: `frontend/src/styles.css`

- [ ] **Step 1: Build app state skeleton**

State must include:

```js
{
  session: null,
  profile: null,
  organizations: [],
  selectedOrganization: null,
  projects: [],
  selectedProject: null,
  requirements: [],
  activeModule: "dashboard",
  activeRole: "Analyst",
  loading: false,
  notice: "",
  error: ""
}
```

- [ ] **Step 2: Render setup screen when config is missing**

If `hasSupabaseConfig()` is false, render a setup panel that tells the user to create `frontend/src/env.local.js` from `env.local.example.js`.

- [ ] **Step 3: Render auth screen**

Unauthenticated screen includes:

- email;
- password;
- full name for sign-up;
- sign-in button;
- sign-up button;
- clear error messages.

- [ ] **Step 4: Render workspace dashboard**

Authenticated screen without selected project shows:

- create organization form;
- organization list;
- create project form under selected organization;
- project list;
- role switcher for demo/testing.

- [ ] **Step 5: Render project shell**

When a project is selected, render:

- Technical Command Center sidebar;
- current organization/project/role in the topbar;
- module navigation;
- sign out button.

- [ ] **Step 6: Manual test**

Run:

```powershell
node frontend/server.mjs
```

Open `http://localhost:5173`, sign up, create an organization, create a project.

- [ ] **Step 7: Commit**

```powershell
git add frontend/src/main.mjs frontend/src/styles.css
git commit -m "feat: add auth workspace shell"
```

## Task 5: SMART Wizard And Requirement Persistence

**Files:**
- Modify: `frontend/src/main.mjs`
- Modify: `frontend/src/styles.css`

- [ ] **Step 1: Add wizard module**

SMART Wizard must include:

- source choice;
- taxonomy branch display;
- software subject choice;
- template fields;
- validation panel;
- review panel;
- save button.

- [ ] **Step 2: Use domain functions**

Use:

```js
buildTemplateStatement(selectedSubject, templateValues)
validateRequirementWriting(generatedStatement)
suggestSmartCategory(generatedStatement)
```

Map validation to:

```js
validation_state = warnings.length ? "Warnings" : "Valid"
validation_warnings = warnings
```

- [ ] **Step 3: Save to Supabase**

Call `createRequirement` with all required table fields. Generate `requirement_code` as `REQ-${String(requirements.length + 1).padStart(3, "0")}` within the selected project.

- [ ] **Step 4: Refresh data after save**

After save, reload project requirements and show a notice like:

```text
REQ-001 saved to Project Name.
```

- [ ] **Step 5: Manual test**

Create one requirement for each subject and confirm rows appear in Supabase.

- [ ] **Step 6: Commit**

```powershell
git add frontend/src/main.mjs frontend/src/styles.css
git commit -m "feat: save smart wizard requirements"
```

## Task 6: Requirements, Search, Dashboard, Reports

**Files:**
- Modify: `frontend/src/main.mjs`
- Modify: `frontend/src/styles.css`
- Modify: `frontend/src/services/downloads.mjs`

- [ ] **Step 1: Build Requirements module**

Show a table and detail panel with:

- requirement code;
- title;
- subject;
- category;
- priority;
- status;
- validation state;
- formal statement;
- edit and delete actions.

- [ ] **Step 2: Build Search module**

Use `filterRequirements` with:

- keyword;
- subject;
- category;
- priority;
- status;
- source type;
- validation state.

- [ ] **Step 3: Build Dashboard module**

Use `buildDashboardSummary` to show:

- total count;
- draft/categorized/approved count;
- subject distribution;
- status distribution;
- warnings count.

- [ ] **Step 4: Build Reports module**

Report screen supports:

- XML;
- PDF;
- DOCX;
- current project scope;
- filtered result scope.

Use `Blob` downloads:

```js
export function downloadTextFile(filename, content, mimeType) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}
```

- [ ] **Step 5: Manual test**

Create requirements, filter them, export XML/PDF/DOCX, and open each downloaded file.

- [ ] **Step 6: Commit**

```powershell
git add frontend/src/main.mjs frontend/src/styles.css frontend/src/services/downloads.mjs
git commit -m "feat: add requirement retrieval and exports"
```

## Task 7: Verification And User Review

**Files:**
- Modify as needed based on failures.

- [ ] **Step 1: Run full test suite**

```powershell
node --test frontend/src/domain/*.test.mjs frontend/serverPaths.test.mjs
```

Expected: all tests pass.

- [ ] **Step 2: Run app**

```powershell
node frontend/server.mjs
```

Expected: server logs `SMART-S2D prototype available at http://localhost:5173`.

- [ ] **Step 3: Smoke check HTTP**

```powershell
Invoke-WebRequest -UseBasicParsing -Uri 'http://localhost:5173/'
```

Expected: HTTP 200.

- [ ] **Step 4: Browser review**

Open `http://localhost:5173` and verify:

- sign up/sign in;
- create organization;
- create project;
- create requirement through SMART Wizard;
- requirement appears in repository;
- search filters work;
- dashboard updates;
- XML/PDF/DOCX exports download;
- sign out works.

- [ ] **Step 5: Do not push to main**

Keep all work on `SmTEST`. Only push or merge after the user sees and approves the result.

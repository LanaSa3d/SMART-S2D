# SMART-S2D Real Product Redesign Spec

## Goal

Redesign SMART-S2D from a one-page prototype into a real web application for categorizing, managing, searching, and reporting endogenous software requirements using the SMART/R2F methodology.

The first build will happen on branch `SmTEST` and must not affect `main` until the user reviews and approves the result.

## Product Positioning

SMART-S2D is a requirements engineering workspace, not a task tracker and not a static demo. It supports analysts and project teams as they create, import, categorize, refine, retrieve, and export endogenous software requirements using a guided SMART workflow.

The application must feel like working software:

- users sign in;
- users work inside organizations;
- organizations contain projects;
- projects contain requirements, imports, taxonomy choices, reports, dashboard data, and audit activity;
- requirements are saved to a real database;
- users can search, edit, export, and review saved requirements.

## Visual Direction

The approved visual direction is **Technical Command Center**.

The interface should use:

- dark navy and ink surfaces;
- green circuit-like accents inspired by the provided logo;
- compact, professional layouts;
- hexagonal or circuit-inspired brand details where useful;
- dense but readable tables and dashboards;
- clear current organization, project, and role context;
- module navigation instead of a single long page.

The app should not look like a Figma screen mockup or generic SaaS landing page. It should open directly into useful workspace actions.

## Architecture Decision

The approved architecture is **Hybrid Vertical Slice**.

Phase 1 uses:

- Supabase Auth for real user accounts;
- Supabase PostgreSQL for real organization, project, requirement, taxonomy, report, and audit persistence;
- frontend direct-to-Supabase access for the core product workflow;
- browser-generated XML, PDF, and DOCX exports for initial report support.

Phase 2 can introduce Django as a stricter backend for server-side validation, permissions, advanced report generation, and future integrations. The Phase 1 database schema should be designed so Django can adopt it later without rewriting the user workflow.

## Environment

The frontend must read Supabase configuration from environment variables:

- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`

Secrets such as database passwords and service-role keys must not be committed to the repository.

## Entry Workflow

The first screen after authentication is a workspace dashboard.

The dashboard must let the user:

- create an organization;
- connect to or select an existing organization;
- create a project inside an organization;
- open/select an existing project;
- see recent projects and activity;
- switch demo/active role if role switching remains available during development.

The old "open file", "create file", and "connect organization" concepts should be reworked:

- the main storage model is account -> organization -> project;
- a SMART-S2D file is only an export/backup concept, not the primary data model;
- "connect organization" means joining or selecting an organization in the database.

## Roles And Permissions

The product supports four roles from the project document:

- **Admin**: manage organization users, manage subjects/categories, view logs, view reports, view categorized reports.
- **Analyst**: create, categorize, update, delete, refine, search, and export requirements.
- **Software User**: create, update, delete, and view reports for their own requirements.
- **Project Manager**: create/update/delete projects, view project dashboard, view analyst requirements, view user requirement reports.

Phase 1 may expose role switching only as a development/demo aid, but persisted organization membership must store the role. Supabase Row Level Security must protect organization-scoped data.

## Main Navigation

Inside a selected project, use a module sidebar:

- Dashboard
- Requirements
- SMART Wizard
- Taxonomy
- Search
- Reports
- Admin/Settings

Navigation items should be hidden or disabled when the active role does not have access.

## SMART Wizard

The SMART Wizard is the core creation and categorization workflow. It should feel like a methodological assistant that guides the user through SMART/R2F decisions.

### Step 1: Source

The user can create or import requirement candidates from:

- manual entry;
- pasted plain text;
- `.txt` upload;
- `.csv` upload;
- `.docx` upload.

Imported requirements must enter a review queue as candidates. The system should not silently save every imported line as a finalized requirement.

### Step 2: Taxonomy

The active taxonomy branch is:

- Endogenous requirements -> Software requirements.

The following branches should be visible but locked for future work:

- Operation requirements;
- Development requirements.

The project should remember the active taxonomy so users do not need to reselect it every time.

### Step 3: Software Subject

The four active software subjects are:

- Functional requirements;
- Data requirements;
- User interface requirements;
- Technical interface requirements.

Each subject should include guidance text, examples, and category suggestions based on the project document.

### Step 4: Template

Use a clean form to capture the supervisor-approved requirement template fields:

- software name;
- obligation: `shall`, `should`, `must`;
- relation verb: `ensure`, `require`, `adopt`;
- generic subject selected from R2F;
- specific subject name;
- specific subject statement;
- specific subject model;
- priority;
- status;
- source type;
- notes.

The app should present both:

- a readable human summary for everyday review;
- the formal generated statement for reports and exports.

Formal statement format:

```text
The "[software_name]" software [shall/should/must] [ensure/require/adopt] "[GS selected from R2F]" "[SS_name]" described as follows: "[SS_statement]" according to the model: "[SS_model]".
```

Example:

```text
The "SMART-S2D" software shall ensure "Function" "user authentication" described as follows: "verify user credentials against authorized records" according to the model: "role-based access control model".
```

### Step 5: Validation

The wizard validates:

- missing required template fields;
- vague wording;
- missing concrete action;
- too-short requirement text;
- too many unrelated actions;
- subject/category mismatch;
- imported candidates that need splitting;
- whether the generated statement follows the formal template.

Validation should be deterministic and explainable. It should provide warnings and suggestions rather than acting like opaque AI.

### Step 6: Review

The review step shows:

- human-readable summary;
- formal generated statement;
- suggested SMART subject/category;
- confidence score;
- rule-based explanation;
- validation warnings;
- override controls for final subject/category.

### Step 7: Save

Saving writes to Supabase under the current organization and project. The save operation records:

- template fields;
- generated statement;
- suggested subject/category;
- final subject/category;
- status;
- priority;
- source type;
- creator;
- timestamps;
- validation state;
- audit log entry.

## Requirement Repository

The Requirements module must provide:

- table/list of saved requirements;
- detail view or drawer;
- create/edit/delete actions according to role;
- status and priority controls;
- subject/category display;
- generated statement display;
- validation warning display;
- version/history notes where available.

The repository replaces the prototype's static sample data.

## Search And Retrieval

Search is its own module, not just a global text box.

Filters:

- keyword;
- organization/project;
- subject;
- category;
- priority;
- status;
- source type;
- author;
- date range;
- validation state.

Search results should open a full requirement detail view. Search should support the project document's multicriteria retrieval workflow.

## Taxonomy Browser

The Taxonomy module shows a hierarchical tree:

- Endogenous requirements;
- Software requirements;
- Functional requirements;
- Data requirements;
- User interface requirements;
- Technical interface requirements;
- editable subject categories under each software subject.

Selecting a node shows related requirements and useful counts. Operation and Development branches remain visible as future/locked branches.

## Reports And Exports

Reports must support:

- XML export;
- PDF export;
- Word/DOCX export.

Report scopes:

- whole project report;
- filtered search report;
- one requirement report;
- categorized summary report;
- user requirements/activity report.

Phase 1 may generate exports in the browser from Supabase data. Phase 2 may move report generation to Django for stronger formatting, repeatability, and server-side control.

Reports should include:

- organization and project metadata;
- requirement identifiers;
- template fields;
- formal generated statements;
- subject/category;
- status and priority;
- creator and timestamps;
- validation state;
- report generation metadata.

## Dashboard

The Dashboard module summarizes:

- total requirements;
- draft/categorized/approved counts;
- distribution by software subject;
- distribution by status and priority;
- recent activity;
- validation warnings requiring attention;
- export/report activity.

The dashboard is project-focused and should not dominate the creation workflow.

## Admin And Settings

Admin/Settings must support, at minimum:

- organization details;
- member list and roles;
- taxonomy subject/category management;
- audit logs;
- report history.

Some controls can be read-only in the first implementation if the database structure is ready and the UI clearly communicates role restrictions.

## Supabase Data Model

Create a Supabase schema for:

- `profiles`
- `organizations`
- `organization_members`
- `projects`
- `taxonomy_subjects`
- `taxonomy_categories`
- `requirements`
- `requirement_versions`
- `imports`
- `reports`
- `audit_logs`

All organization-scoped records must include organization ownership either directly or through project ownership. Row Level Security must prevent users from reading or writing data outside organizations where they are members.

## Import Behavior

Importing `.txt`, `.csv`, or `.docx` creates an import batch with candidate requirement rows.

Candidate requirements should be reviewable before saving. The review queue should support:

- accept candidate;
- edit candidate;
- discard candidate;
- choose subject/category;
- run validation;
- save accepted items into `requirements`.

For Phase 1, `.docx` parsing can be browser-side if feasible; otherwise the UI can accept `.docx` and provide a clear "needs review" workflow after text extraction is implemented. The implementation plan must choose a concrete library/approach before coding this feature.

## Testing Requirements

Before showing the user or pushing anything:

- run domain tests;
- run import/parser tests where implemented;
- test Supabase auth and CRUD against the configured project;
- manually test sign-up/sign-in;
- manually test organization creation;
- manually test project creation;
- manually test requirement wizard save;
- manually test search/filter;
- manually test XML/PDF/DOCX export;
- verify the app in the browser.

## Phased Delivery

### Phase 1: Real Supabase Vertical Slice

- Supabase schema and RLS.
- Supabase client and env config.
- Auth screens.
- Workspace dashboard.
- Create/select organization.
- Create/select project.
- SMART Wizard.
- Save requirements to Supabase.
- Requirements list/detail/edit/delete.
- Search/filter.
- Basic dashboard.
- XML/PDF/DOCX export.
- Local testing and user review before any push to GitHub main.

### Phase 2: Product Depth

- Full admin user management.
- Subject/category management UI.
- Import `.txt`, `.csv`, and `.docx` with review queue.
- Requirement versioning UI.
- Audit log UI.
- More polished PDF/Word templates.
- Stronger role permissions.
- Django API migration where it adds value.

### Phase 3: Graduation Polish

- Demo data.
- Final report templates.
- User/developer documentation.
- UX refinements.
- Deployment preparation.
- Final test pass.

## Open Constraints

The project will use the newly created Supabase project. The exact URL and anon key are runtime configuration values and must be stored in local environment files, not in committed source files.

The implementation must proceed on `SmTEST` until the user approves merging or pushing to `main`.

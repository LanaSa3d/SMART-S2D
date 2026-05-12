# SMART-S2D

A web application for managing endogenous software requirements using the SMART methodology and R2F-inspired categorization. Built as a graduation project.

## Features

- **SMART Requirement Template** — guided requirement writing with category-specific templates
- **Rule-based classification** — automatic subject/category suggestion with confidence scoring
- **Requirement validation** — real-time SMART writing guidance and warnings
- **Workspace model** — accounts → companies → projects → requirements
- **Multi-criteria search** — filter by keyword, subject, priority, status, source, and validation state
- **Export reports** — generate XML and DOCX exports
- **Taxonomy browser** — visual tree for Software requirements (Functional, Data, UI, Technical Interface)
- **Audit logging** — every create/update/delete is tracked
- **Role-based access** — Admin, Analyst, Software User, Project Manager
- **Company invite codes** — managers can generate six digit codes for controlled access

---

## Prerequisites

- [Node.js](https://nodejs.org/) (v18 or later)
- A free [Supabase](https://supabase.com/) account

---

## Setup Guide

### 1. Clone the repository

```bash
git clone https://github.com/LanaSa3d/SMART-S2D.git
cd SMART-S2D
```

### 2. Set up the Supabase database

1. Go to [supabase.com](https://supabase.com/) and create a new project (free tier works fine)
2. Wait for the project to finish provisioning
3. Go to **SQL Editor** (left sidebar)
4. Copy the entire contents of `database/supabase_phase1.sql` and paste it into the SQL editor
5. Click **Run** — this creates all tables, triggers, RLS policies, and seed data

> **Important:** Keep Row Level Security enabled. If a new account can see another account's companies or projects, rerun `database/supabase_phase1.sql` in the SQL Editor so the latest membership policies are applied.

### 3. Disable email confirmation (recommended for testing)

In the Supabase dashboard:

1. Go to **Authentication** → **Providers** → **Email**
2. Turn **off** "Confirm email"
3. Click **Save**

This lets new accounts sign in immediately without needing to verify their email.

### 4. Get your Supabase credentials

1. In your Supabase dashboard, go to **Project Settings** → **API**
2. Copy the **Project URL** (looks like `https://xxxxx.supabase.co`)
3. Copy the **anon / public** key (a long `eyJ...` string)

### 5. Configure the frontend

Create the local config file:

**Windows (PowerShell):**
```powershell
Copy-Item frontend/src/env.local.example.js frontend/src/env.local.js
```

**Mac / Linux:**
```bash
cp frontend/src/env.local.example.js frontend/src/env.local.js
```

Open `frontend/src/env.local.js` and paste your Supabase credentials:

```js
window.SMART_S2D_CONFIG = {
  SUPABASE_URL: "https://your-project.supabase.co",
  SUPABASE_ANON_KEY: "your-anon-key",
};
```

> ⚠️ This file is git-ignored. Never commit real keys.

### 6. Run the app

```bash
node frontend/server.mjs
```

Open your browser and go to:

```
http://localhost:5173
```

No `npm install` is needed — the server is dependency-free and Supabase is loaded via browser ES modules.

---

## How to Use

1. **Create an account** — click "Create account", enter your name, email, and a password
2. **Create or join a company** — create your own workspace or enter a six digit invite code
3. **Manage members** — Admins and Project Managers can add Project Managers, Analysts, and Software Users by email
4. **Create a project** — Project Managers and Admins can create, update, archive, or delete projects
5. **Open the project** — click "Open" to enter the project workspace
6. **Add or edit requirements** — use the SMART Requirement Template, then edit requirement details from the repository
7. **Browse** — use Dashboard, Requirements, Taxonomy, Search, and Reports from the sidebar

---

## Run Tests

```bash
node --test frontend/src/*.test.mjs frontend/src/domain/*.test.mjs frontend/serverPaths.test.mjs database/*.test.mjs
```

---

## Project Structure

```
SMART-S2D/
├── frontend/
│   ├── index.html                  # Entry point
│   ├── server.mjs                  # Zero-dependency dev server
│   ├── package.json
│   └── src/
│       ├── main.mjs                # App shell and UI rendering
│       ├── styles.css              # All styles
│       ├── config.mjs              # Supabase config reader
│       ├── env.local.js            # Your local Supabase keys (git-ignored)
│       ├── domain/                 # Business logic (pure functions)
│       │   ├── dashboardModel.mjs
│       │   ├── entities.mjs
│       │   ├── exportModel.mjs
│       │   ├── importModel.mjs
│       │   ├── smartRules.mjs
│       │   └── workflowModel.mjs
│       └── services/               # Supabase API calls
│           ├── repository.mjs
│           └── supabaseClient.mjs
├── database/
│   ├── schema.sql                  # Original schema reference
│   └── supabase_phase1.sql         # Full Supabase setup (run this one)
├── backend/                        # Django scaffold (future)
└── .env.example                    # Backend env template
```

---

## Taxonomy Scope

The prototype covers **Software requirements** only:

| Subject | Description |
|---------|-------------|
| Function requirements | Behavior the software must perform |
| Data requirements | Data the software must store, manage, or retrieve |
| User Interface requirements | Screens, controls, navigation, and visual feedback |
| Technical Interface requirements | APIs, integrations, protocols, and external communication |

Operation and Development requirements are visible in the taxonomy tree but scoped for future phases.

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | Vanilla JavaScript (ES modules), CSS |
| Database & Auth | Supabase (PostgreSQL + Auth) |
| Dev Server | Node.js (zero dependencies) |
| Backend (future) | Python, Django, Django REST Framework |

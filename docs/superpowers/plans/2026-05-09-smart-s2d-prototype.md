# SMART-S2D Prototype Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the first SMART-S2D vertical slice for software requirement writing, categorization, taxonomy navigation, retrieval, and reporting preview.

**Architecture:** Use a monorepo with tested frontend domain modules, a React prototype shell, a Django/DRF backend scaffold, and a Supabase PostgreSQL schema. Keep taxonomy scoped to software requirements only.

**Tech Stack:** React, Node built-in test runner, Django REST Framework, Supabase Auth, Supabase PostgreSQL.

---

### Task 1: SMART Rule Engine

**Files:**
- Create: `frontend/src/domain/smartRules.test.mjs`
- Create: `frontend/src/domain/smartRules.mjs`

- [x] Write tests for software-only taxonomy subjects, keyword-based suggestions, and guided-writing validation.
- [x] Run `node --test frontend/src/domain/smartRules.test.mjs` and confirm it fails because the module is missing.
- [x] Implement the rule engine.
- [x] Run `node --test frontend/src/domain/smartRules.test.mjs` and confirm all rule tests pass.

### Task 2: Dashboard Retrieval Model

**Files:**
- Create: `frontend/src/domain/dashboardModel.test.mjs`
- Create: `frontend/src/domain/dashboardModel.mjs`

- [x] Write tests for dashboard counts and multicriteria filtering.
- [x] Run `node --test frontend/src/domain/dashboardModel.test.mjs` and confirm it fails because the module is missing.
- [x] Implement dashboard summary and filtering logic.
- [x] Run `node --test frontend/src/domain/*.test.mjs` and confirm all domain tests pass.

### Task 3: React Prototype Shell

**Files:**
- Create: `frontend/index.html`
- Create: `frontend/server.mjs`
- Create: `frontend/src/main.mjs`
- Create: `frontend/src/styles.css`

- [x] Build a React UI with dashboard, guided requirement writing, taxonomy tree, repository filtering, report preview, and audit trail.
- [x] Keep active taxonomy to software requirements only.
- [x] Run the local server and verify HTTP responses for the app shell and static assets.

### Task 4: Backend And Schema Scaffold

**Files:**
- Create: `backend/README.md`
- Create: `backend/requirements.txt`
- Create: `backend/manage.py`
- Create: `backend/smart_s2d/settings.py`
- Create: `backend/smart_s2d/urls.py`
- Create: `backend/apps/requirements/services.py`
- Create: `database/schema.sql`

- [x] Add Django/DRF project scaffold.
- [x] Add Supabase/PostgreSQL schema.
- [x] Document backend install and verification commands.

### Task 5: Commit And Push

**Files:**
- All project files.

- [x] Run available tests.
- [ ] Check git status.
- [ ] Commit the prototype scaffold.
- [ ] Push to `https://github.com/LanaSa3d/SMART-S2D`.

# SMART-S2D Prototype Design

## Goal

Build a professional graduation-project prototype that demonstrates SMART/R2F software requirement categorization, guided writing, taxonomy navigation, retrieval, reporting, and auditability.

## Scope

This prototype implements only the software requirements branch of endogenous requirements:

- Functional requirements
- Data requirements
- User interface requirements
- Technical interface requirements

Operation requirements and development requirements are excluded from active taxonomy workflows.

## Architecture

The project uses a monorepo with frontend, backend, database, and documentation folders. The first implementation slice focuses on a demonstrable frontend and tested domain rules while preparing the backend and schema for Django, DRF, Supabase Auth, and Supabase PostgreSQL.

## Core Workflows

The requirement creation workflow guides users to write `The software shall [action] [target/object].` statements, validates them with deterministic rules, suggests a SMART software subject/category, and stores the human-reviewed classification.

The taxonomy workflow shows parent-child navigation from endogenous requirements to software requirements to the four active SMART software subjects and their editable categories.

The retrieval/reporting workflow filters requirements and previews which records would be exported to XML, PDF, or DOCX.

## Security

Supabase Auth is the planned identity provider. Django owns role-based permissions and audit logging. Prototype roles are Admin, Analyst, Software User, and Project Manager.

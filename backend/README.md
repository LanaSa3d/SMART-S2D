# SMART-S2D Backend

This folder contains the Django REST Framework backend scaffold for SMART-S2D.

The current machine does not expose Python on PATH, so these files are prepared for the intended environment but have not been executed here.

## Intended Setup

```powershell
cd backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver
```

## App Boundaries

- `accounts`: Supabase user profile and role mapping
- `projects`: project management
- `taxonomy`: software requirement taxonomy hierarchy
- `requirements`: requirement CRUD, categorization, versioning, and refinement
- `reports`: XML, PDF, and DOCX exports
- `audit`: audit trail

The first backend service included here mirrors the frontend SMART rule engine so API categorization can later use the same deterministic behavior.

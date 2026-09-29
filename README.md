# WhatBytes Healthcare Backend

WhatBytes Healthcare is a healthcare administration application for account-based patient records, a shared doctor directory, and patient-doctor care assignments. The Django REST API and React application are integrated. No live deployment is configured by this repository.

## Architecture

- `backend/` is a Django + Django REST Framework API using PostgreSQL and JWT authentication.
- `frontend/` is a separate React + Vite single-page application configured for deployment to a static host such as Vercel.
- The frontend uses one API client and `VITE_API_BASE_URL`. Its local Vite proxy targets the backend during development.

## Technology

- Backend: Python, Django, Django REST Framework, Simple JWT, `django-cors-headers`, PostgreSQL via `psycopg`, WhiteNoise, and Gunicorn.
- Frontend: React, Vite, and Playwright for browser workflow testing.

## Directory structure

```text
.
├── backend/
│   ├── config/            # Django configuration and root routes
│   ├── accounts/          # Email registration, login, and JWT auth
│   ├── patients/          # Owner-scoped patient API
│   ├── doctors/           # Shared doctor directory API
│   ├── mappings/          # Patient-doctor assignment API
│   ├── manage.py
│   └── requirements.txt
├── frontend/
│   ├── src/               # React pages, API client, and responsive UI
│   ├── e2e/               # Browser end-to-end workflow
│   └── playwright.config.js
├── postman/               # Importable API workflow collection
├── Procfile               # Gunicorn production process command
├── .env.example
├── .gitignore
└── README.md
```

## Environment variables

Copy `.env.example` to a private `.env` file only when you are ready to configure local services. Do not commit it.

| Variable | Purpose |
| --- | --- |
| `SECRET_KEY` | Django secret key; required in every environment. |
| `DEBUG` | Django debug mode (`True` or `False`). |
| `ALLOWED_HOSTS` | Comma-separated hosts accepted by Django. |
| `DB_NAME`, `DB_USER`, `DB_PASSWORD`, `DB_HOST`, `DB_PORT` | PostgreSQL connection configuration. |
| `DATABASE_URL` | Optional PostgreSQL connection URL for platforms such as Render; when set, it takes precedence over `DB_*`. |
| `CORS_ALLOWED_ORIGINS` | Comma-separated frontend origins allowed to call the API. |
| `CSRF_TRUSTED_ORIGINS` | Comma-separated HTTPS origins trusted by Django admin/CSRF checks. |
| `SECURE_SSL_REDIRECT` | Redirect HTTP requests to HTTPS in production when enabled. |
| `SECURE_HSTS_SECONDS` | Optional HSTS lifetime; enable after the HTTPS domain is verified. |
| `SECURE_HSTS_INCLUDE_SUBDOMAINS`, `SECURE_HSTS_PRELOAD` | Opt-in HSTS directives; enable only when all affected hosts are HTTPS and the owned domain is ready for browser preload. |
| `VITE_API_BASE_URL` | Backend origin embedded by Vite at build time; set in Vercel for production. |

The backend uses PostgreSQL and never falls back to SQLite. Django reads a private root `.env` file when present, without overriding variables already set by the process environment. In production, configure environment values in the hosting platform instead.

## Data model

- **User** — custom Django user with `name`, a unique email login identifier, hashed password, staff flags, and timestamps.
- **Patient** — demographic/contact details, date of birth, gender, care department, primary concern, optional medical notes, and `created_by → User`. Patient lists and resource access are scoped to this owner. The UI displays a formatted patient number based on Django's internal integer ID.
- **Doctor** — name, department, specialization, unique email, contact information, and timestamps. Django's integer `id` is the doctor record ID; the UI offers a broad department/specialty directory with an "Other / Subspecialty" option.
- **PatientDoctorMapping** — joins one patient to one doctor and has its own record ID. The UI displays formatted patient, doctor, and assignment numbers. Patient care-department/concern information helps staff select a relevant doctor, but does not replace clinical judgment. Duplicate patient-doctor pairs are prevented by the `unique_patient_doctor_mapping` database constraint.

## Authentication flow

`POST /api/auth/register/` validates the name, email, and password, creates the custom user through its manager, and returns safe user data without a password. Passwords are hashed with Django's password hashing system.

`POST /api/auth/login/` accepts email and password and uses SimpleJWT to return a short-lived access token and refresh token. All patient, doctor, and mapping API endpoints require `Authorization: Bearer <access-token>`.

### Authentication examples

Register:

```bash
curl -X POST http://localhost:8000/api/auth/register/ \
  -H "Content-Type: application/json" \
  -d '{"name":"Avery Morgan","email":"avery@example.com","password":"A-strong-password-2026!"}'
```

Login:

```bash
curl -X POST http://localhost:8000/api/auth/login/ \
  -H "Content-Type: application/json" \
  -d '{"email":"avery@example.com","password":"A-strong-password-2026!"}'
```

## API endpoints

All patient, doctor, and mapping endpoints require a valid JWT access token in `Authorization: Bearer <access-token>`. Registration and login are public. Validation errors return HTTP 400, missing or inaccessible resources return HTTP 404, creates return HTTP 201, and deletes return HTTP 204.

| Method | Route | Behavior |
| --- | --- | --- |
| `POST` | `/api/auth/register/` | Register an account. |
| `POST` | `/api/auth/login/` | Obtain access and refresh tokens. |
| `POST`, `GET` | `/api/patients/` | Create a patient; list only the caller's patients. |
| `GET`, `PUT`, `DELETE` | `/api/patients/<id>/` | Retrieve, replace, or delete an owned patient. Other users' patient IDs return 404. |
| `POST`, `GET` | `/api/doctors/` | Create a doctor; list all doctors. |
| `GET`, `PUT`, `DELETE` | `/api/doctors/<id>/` | Retrieve, replace, or delete a doctor. |
| `POST`, `GET` | `/api/mappings/` | Create a patient-doctor assignment; list assignments for the caller's patients. |
| `GET` | `/api/mappings/<patient_id>/` | List doctors assigned to a patient owned by the caller. |
| `DELETE` | `/api/mappings/<id>/` | Delete a mapping only when its patient belongs to the caller. |

Patient creation sets `created_by` from the authenticated user; the request cannot forge or change it. Mapping creation only accepts patient IDs owned by the caller and rejects duplicate patient-doctor pairs. Doctor directory access is shared across authenticated users.

Example protected patient creation:

```bash
curl -X POST http://localhost:8000/api/patients/ \
  -H "Authorization: Bearer <access-token>" \
  -H "Content-Type: application/json" \
  -d '{"name":"Taylor Patient","date_of_birth":"1990-03-12","gender":"prefer_not_to_say","phone":"+1 555 0100","email":"taylor@example.com","address":"10 Care Lane"}'
```

Example doctor assignment:

```bash
curl -X POST http://localhost:8000/api/mappings/ \
  -H "Authorization: Bearer <access-token>" \
  -H "Content-Type: application/json" \
  -d '{"patient":1,"doctor":1}'
```

## Running API tests

After configuring PostgreSQL, `SECRET_KEY`, and the `DB_*` variables, run:

```bash
cd backend
python manage.py check
python manage.py test
```

## Local development setup

PostgreSQL is required. Create a database and configure `DB_NAME`, `DB_USER`, `DB_PASSWORD`, `DB_HOST`, and `DB_PORT`. The backend also accepts `DATABASE_URL`. Copy `.env.example` to the repository root as `.env` only if you do not already have a local `.env`, then edit its values. `.env` is ignored by Git.

```bash
python -m venv .venv
source .venv/bin/activate
pip install -r backend/requirements.txt
cd backend
python manage.py migrate
python manage.py runserver
```

In another terminal, configure the frontend environment. Copy `frontend/.env.example` to `frontend/.env`. Leave `VITE_API_BASE_URL` blank to use Vite's local `/api` proxy, or set `API_PROXY_TARGET` if Django runs on another local address.

```bash
cd frontend
npm install
npm run dev
```

The application is served by Vite, normally at `http://localhost:5173`.

## Frontend behavior

Registering creates an account and signs in. Login stores the access and refresh tokens in tab-scoped `sessionStorage`; every protected request sends the access token as a Bearer token. A missing, expired, or rejected access token returns the user to login. Logout clears the tab session. The backend does not expose a logout or refresh route, so expiration requires signing in again.

Patients, doctors, and assignments load from the API. Patient visibility follows backend ownership; the frontend never sends a `created_by` value. Patient and doctor forms support create, read, replace, and delete operations. Mapping screens support assignment, per-patient doctor lookup, and removal. Destructive actions ask for confirmation. The dashboard totals come from API data, not sample records.

## API collection

Import `postman/WhatBytes-Healthcare.postman_collection.json` into Postman. Set `baseUrl`, `testEmail`, and `testPassword` to test values in a local Postman environment. Use a new email address for each full run because the API has no account deletion route. Run requests in collection order: register, login, patients, doctors, mappings, then cleanup. Login saves access and refresh tokens; create requests save returned resource IDs. The collection has no real credentials. Logout is client-side and has no backend endpoint.

## Testing

Backend checks and API tests use the configured PostgreSQL database:

```bash
cd backend
python manage.py check
python manage.py test
```

The browser test in `frontend/e2e/healthcare-flow.spec.js` covers registration, login, patient and doctor create/view/update/delete, assignment creation/list/lookup/removal, logout, session clearing, and an unauthenticated request. To run it against local services:

1. Start PostgreSQL, configure the root `.env`, and run migrations.
2. Start Django on `127.0.0.1:8000` with `CORS_ALLOWED_ORIGINS=http://127.0.0.1:4173`.
3. In `frontend/`, install dependencies and install the browser once with `npx playwright install chromium`.
4. Build against the local API origin, then preview and run the test:

```bash
VITE_API_BASE_URL=http://127.0.0.1:8000 npm run build
npm run preview -- --host 127.0.0.1 --port 4173
# In another frontend terminal:
npm run test:e2e
```

## Production deployment preparation

Deployment has not been performed. Keep development and production values separate; never use real credentials in the repository.

For a Render-style Django service, install from `backend/requirements.txt`, collect static assets with `cd backend && python manage.py collectstatic --noinput`, and start from the repository root with the included `Procfile` or `cd backend && gunicorn config.wsgi:application --bind 0.0.0.0:$PORT`. Run `python manage.py migrate` as a release/pre-deploy step before routing traffic. Provide a managed PostgreSQL `DATABASE_URL` (or the five `DB_*` values), a generated `SECRET_KEY`, `DEBUG=False`, and `ALLOWED_HOSTS` containing the service hostname. Set `CORS_ALLOWED_ORIGINS` to the exact deployed Vercel origin and `CSRF_TRUSTED_ORIGINS` to the HTTPS origins used by the Django admin. Enable `SECURE_SSL_REDIRECT=True` only when the host terminates HTTPS and forwards the scheme; configure HSTS after confirming HTTPS works. WhiteNoise serves collected Django static files.

For Vercel, select `frontend/` as the project root, use `npm run build` with output directory `dist`, and set `VITE_API_BASE_URL` to the deployed backend origin in the Vercel project environment. Vite embeds this value at build time. Do not set it to localhost in production. Add that exact frontend origin to backend CORS configuration and rebuild after changing it.

## Four-phase development plan

## Four-phase development plan

1. **Foundation (complete):** Django/API configuration, app namespaces, environment template, and responsive frontend shell.
2. **Authentication and data layer (complete):** custom user, JWT register/login, models, serializers, admin, constraints, migrations, and authentication tests.
3. **Protected APIs (complete):** authenticated patient, doctor, and mapping endpoints, ownership checks, validation, and API tests.
4. **Frontend integration and release (complete):** frontend/API workflows, error and loading states, end-to-end test source, API collection, and deployment preparation. No deployment has been executed.

## Current limitations

Deployment infrastructure and provider credentials have not been configured. The access token expires according to SimpleJWT settings; the client clears the session and asks the user to sign in again because the backend currently has no refresh-token endpoint. No advanced search, filtering, or pagination has been added.

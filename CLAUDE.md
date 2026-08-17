# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project overview

ATC Williams Quality Management System — a React/Vite frontend paired with a C# .NET 8 Azure Functions backend connected to Azure SQL via Dapper.

**Note:** All source files live flat at the repo root, despite the `backend/frontend/` split described in `QMS_README.md`.

---

## Running locally

### Frontend (React + Vite)

```bash
npm install        # first time only
npm run dev        # http://localhost:5173
```

Node.js is installed at `C:\Program Files\nodejs`. If `npm` is not on PATH in a new terminal, prefix commands with `$env:PATH = "C:\Program Files\nodejs;" + $env:PATH`.

### Backend (Azure Functions)

Prerequisites: .NET 8 SDK, Azure Functions Core Tools v4.

```bash
# Fill in local.settings.json first (see below)
func start         # http://localhost:7071/api/
```

`local.settings.json` currently has placeholder credentials — replace `<your-server>`, `<user>`, and `<password>` with real Azure SQL values before starting the backend. **Never commit this file.**

---

## Architecture

### Frontend — `QMSDashboard.jsx`

Single 2000+ line React component file containing everything: constants, mock data arrays, all page components, and the root `App` component. `main.jsx` is the entry point that mounts `App` into `index.html`.

**The frontend currently runs entirely on hardcoded mock data** (arrays named `MOCK_*` at the top of `QMSDashboard.jsx`). To connect it to the real API, set `const BASE_URL = "https://<function-app>.azurewebsites.net/api"` and replace mock data with `useEffect`/`fetch` calls per the pattern in `QMS_README.md`.

Pages rendered by the `App` root based on `nav` state:
- `dashboard` → `DashboardPage` (summary cards + pending approvals table + QMS master table)
- `qmsmaster` → `QMSMasterPage`
- `clients` → `ClientsPage`, `clientcontacts` → `ClientContactsPage`
- `sites` → `SitesPage`
- `fm01a / fm02 / fm03a / fm04` → individual QMS form pages

### Backend — Azure Functions (.NET 8 isolated process)

| File | Purpose |
|---|---|
| `QMS_Program.cs` | DI wiring — registers `SqlConnectionFactory` and all repository interfaces |
| `QMS_Functions.cs` | HTTP trigger functions; thin layer that calls repositories and returns JSON |
| `QMS_Repositories.cs` | All database logic using Dapper against stored procedures / inline SQL |
| `QMS_Models.cs` | Request/response models and `PagedResult<T>` envelope |
| `QMS_Schema.sql` | Full Azure SQL schema, indexes, stored procedures, and seed data |

All paginated API responses use `PagedResult<T>` with `items`, `totalCount`, `page`, `pageSize`, `totalPages`, `hasPrev`, `hasNext`.

Approval workflow fields on `QMS_Master`: `FM01A_ApprovalStatus`, `FM01A_OM_ApprovalStatus`, `FM01B_ApprovalStatus`. The `PUT /api/opportunities/{id}/approve` endpoint accepts an `ApprovalResponse` body with `approvalField` set to `"FM01A"`, `"FM01B"`, or `"FM01A_OM"`.

### Database

Run `QMS_Schema.sql` once against an Azure SQL database to create all tables, stored procedures, and seed data. The connection string goes in `local.settings.json` for local dev and in Azure App Settings (via Key Vault reference) for production.

---

## Key constraints

- `local.settings.json` must never be committed — it is excluded from publish by the `.csproj` but has no `.gitignore` entry yet.
- Azure Functions use `AuthorizationLevel.Function` — all API calls require a `?code=<key>` query parameter or `x-functions-key` header.
- The frontend's `handleSubmit` in `NewJobForm` currently just sleeps and shows a success state — it does not call the API.

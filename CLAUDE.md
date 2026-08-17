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

### Backend (Azure Functions)

Prerequisites: .NET 8 SDK, Azure Functions Core Tools v4.

```bash
# Fill in local.settings.json first (see below)
func start         # http://localhost:7071/api/
```

`local.settings.json` is git-ignored and must be created manually. Replace `<your-server>`, `<user>`, and `<password>` with real Azure SQL values. **Never commit this file.**

---

## Architecture

### Frontend — `QMSDashboard.jsx`

Single 2000+ line React component file containing everything: constants, mock data arrays, all page components, and the root `App` component. `main.jsx` is the entry point that mounts `App` into `index.html`.

**The frontend currently runs entirely on hardcoded mock data.** Inline `MOCK_*` arrays at the top of `QMSDashboard.jsx` supply all table and card data. The `data/` directory contains additional standalone mock JS modules (one per form/entity) that are not yet imported — they are available to wire in when connecting to the real API.

To connect to the real API, set `const BASE_URL = "https://<function-app>.azurewebsites.net/api"` and replace mock data with `useEffect`/`fetch` calls per the pattern in `QMS_README.md`. All API calls require a `?code=<key>` query param or `x-functions-key` header (`AuthorizationLevel.Function`).

Pages rendered by the `App` root based on `nav` state:

| `nav` value | Component | Notes |
|---|---|---|
| `dashboard` | `DashboardPage` | Summary cards + pending approvals + QMS master table |
| `qmsmaster` | `QMSMasterPage` | |
| `clients` | `ClientsPage` | |
| `clientcontacts` | `ClientContactsPage` | |
| `sites` | `SitesPage` | |
| `fm01a / fm02 / fm03a / fm04` | Individual form pages | |

`NewJobForm` (triggered by "New Job Request") currently fakes submission with a 1.2 s delay — it does not call the API.

### Backend — Azure Functions (.NET 8 isolated process)

| File | Purpose |
|---|---|
| `QMS_Program.cs` | DI wiring — registers `SqlConnectionFactory` and all repository interfaces |
| `QMS_Functions.cs` | HTTP trigger functions; thin layer that calls repositories and returns JSON |
| `QMS_Repositories.cs` | All database logic using Dapper |
| `QMS_Models.cs` | Request/response models and `PagedResult<T>` envelope |
| `QMS_Schema.sql` | Full Azure SQL schema, indexes, stored procedures, and seed data |
| `SY_QS_FM_01B.sql` | Supplementary SQL for FM-01B form schema |

**API endpoints:**

| Method | Route | Handler |
|---|---|---|
| GET | `/api/dashboard/summary` | `vw_DashboardSummary` view |
| GET | `/api/opportunities` | `dbo.sp_GetRecentOpportunities` |
| GET | `/api/opportunities/pending` | `dbo.sp_GetPendingApprovals` |
| POST | `/api/opportunities` | `dbo.sp_CreateOpportunity` |
| PUT | `/api/opportunities/{id}/approve` | Inline UPDATE on `QMS_Master` |
| GET | `/api/clients` | `dbo.sp_GetClients` |
| GET | `/api/clients/lookup` | Inline SELECT on `dbo.Clients` |
| GET | `/api/clients/{id}/contacts` | Inline SELECT on `dbo.Client_Contacts` |
| GET | `/api/sites` | `dbo.sp_GetSiteNames` |
| GET | `/api/sites/lookup` | Inline SELECT on `dbo.QMS_Site_Name` |

All paginated responses use `PagedResult<T>` — `items`, `totalCount`, `page`, `pageSize`, `totalPages`, `hasPrev`, `hasNext`. Pagination uses `TotalCount` embedded in the first row returned by each stored procedure.

**Repository pattern:** each repository takes `IDbConnectionFactory` via primary constructor injection, opens a connection per call, and maps results directly to model classes via Dapper. Most reads go through stored procs (`dbo.sp_*`); the approval update and lookup queries use inline SQL.

**Approval workflow:** `PUT /api/opportunities/{id}/approve` accepts `{ approvalField, approved, approvedBy, comments }`. Valid `approvalField` values: `"FM01A"`, `"FM01B"`, `"FM01A_OM"`. Each updates the corresponding status column on `dbo.QMS_Master`.

### Database

Run `QMS_Schema.sql` (and `SY_QS_FM_01B.sql` if needed) once against an Azure SQL database. The connection string goes in `local.settings.json` for local dev and in Azure App Settings (via Key Vault reference) for production.

Dashboard summary data comes from `dbo.vw_DashboardSummary` — a view, not a stored procedure.

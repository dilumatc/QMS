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

Single ~5,900-line React file containing all constants, mock data, page components, and the root `App`. `main.jsx` is the entry point; `index.html` references `/main.jsx` (not `/src/main.jsx`).

**App startup flow:**
1. On load, `localStorage` is read and any previously submitted records are merged into the in-memory mock arrays (lines 16–21).
2. The main layout (sidebar + header + content) renders immediately based on `nav` state.

**The frontend runs entirely on hardcoded mock data.** The `data/` directory has standalone mock JS modules (one per form/entity) that are already imported. To connect to the real API, set `const BASE_URL` and replace mock calls with `useEffect`/`fetch` per the pattern in `QMS_README.md`.

**Form submission (`NewJobForm`)** is wired up: on submit it mutates `MOCK_OPPORTUNITIES` in-memory and writes to `localStorage` so records survive page refresh. It does **not** call the backend API yet.

**FM02Form** (`SY-QS-FM-02 Go/No-Go Pre-Proposal Checklist`) is a full interactive form component inserted before `FM02Page`. It covers all 7 scored sections (Jurisdictional, Client Relationship, Market Drivers, Contractual/Commercial, Staff Resourcing), live score calculation against MAX 115, colour-coded GO/REVIEW/NO GO preliminary assessment badge, and an approvals table with 10 signatory roles. Triggered by the "New FM-02 Assessment" button on the `FM02Page` register using local `showForm` state — the same pattern used by `ClientsPage` (`NewClientForm`) and `ClientContactsPage` (`NewClientContactForm`).

**Navigation** is driven by a single `nav` string in `App`. All forms follow the pattern `fm<N>` for the primary page and `fm<N>-<tab>` for sub-pages (notes, tasks, reviewers, etc.):

| Range | Forms |
|---|---|
| Core | `dashboard`, `qmsmaster`, `clients`, `clientcontacts`, `sites`, `qmsforms` |
| FM-01 | `fm01a`, `fm01a-mc`, `fm01b`, `fm01b-notes`, `fm01b-tasks` |
| FM-02 – FM-05 | primary + `-notes`; FM-04 also has `-reviewers`, `-revdocs`; FM-05 has `-scope` |
| FM-06 | `-notes`, `-milestones`, `-categories`, `-deliverables`, `-extresources` |
| FM-07 – FM-10 | primary + `-main` (FM-07 only) + `-notes` |
| FM-11 – FM-19 | primary + `-notes`; FM-14 has `-tasks`; FM-15 has `-drawsFigs`, `-dataLoc`, `-titleBlock`; FM-16 has `-reviewDocs`; FM-17 has `-docs`; FM-18 has `-uploads` |

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

**Repository pattern:** each repository takes `IDbConnectionFactory` via primary constructor injection, opens a connection per call, and maps results directly to model classes via Dapper. Most reads use stored procs (`dbo.sp_*`); the approval update and lookup queries use inline SQL.

**Approval workflow:** `PUT /api/opportunities/{id}/approve` accepts `{ approvalField, approved, approvedBy, comments }`. Valid `approvalField` values: `"FM01A"`, `"FM01B"`, `"FM01A_OM"`. Each updates the corresponding status column on `dbo.QMS_Master`.

### Database

Run `QMS_Schema.sql` (and `SY_QS_FM_01B.sql` if needed) once against an Azure SQL database. The connection string goes in `local.settings.json` for local dev and in Azure App Settings (via Key Vault reference) for production.

Dashboard summary data comes from `dbo.vw_DashboardSummary` — a view, not a stored procedure.

---

## Key constraints

- `local.settings.json` must never be committed — protected by `.gitignore`.
- Azure Functions use `AuthorizationLevel.Function` — all API calls require a `?code=<key>` query param or `x-functions-key` header.
- All API calls require a `?code=<key>` query parameter or `x-functions-key` header.

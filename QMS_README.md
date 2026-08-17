# QMS System — Azure Functions + SQL + React

A full Quality Management System matching the Scigeniq design, with a
C# .NET 8 isolated-process Azure Functions backend, Azure SQL database,
and a responsive React frontend.

---

## Repository layout

```
qms/
├── backend/
│   ├── QMS.Functions.csproj
│   ├── Program.cs
│   ├── host.json
│   ├── local.settings.json          ← never commit
│   ├── Models/Models.cs
│   ├── Services/Repositories.cs
│   └── Functions/Functions.cs
├── frontend/
│   └── QMSDashboard.jsx             ← React artifact
└── QMS_Schema.sql                   ← full DB schema + stored procs
```

---

## 1. Azure SQL setup

1. Create an **Azure SQL Database** (e.g. `QmsDb`).
2. Run `QMS_Schema.sql` via Azure Data Studio or SSMS.
   This creates all tables, indexes, stored procedures, and seed data.
3. Note the connection string from the Azure portal.

---

## 2. Backend — Azure Functions

### Prerequisites
- .NET 8 SDK
- Azure Functions Core Tools v4
- Azure CLI (for deployment)

### Local development

```bash
cd backend
# copy connection string into local.settings.json
func start
```

Endpoints available at `http://localhost:7071/api/`:

| Method | Route                              | Description                          |
|--------|------------------------------------|--------------------------------------|
| GET    | `/api/dashboard/summary`           | Summary counts (pending/open/…)      |
| GET    | `/api/dashboard/chart?dateFrom=&dateTo=` | Historical bar-chart data       |
| GET    | `/api/jobs?page=1&pageSize=10&…`   | Recent jobs, sorted ID DESC          |
| POST   | `/api/jobs`                        | Create new job                       |
| PUT    | `/api/jobs/{jobId}/status`         | Update job status + audit log        |
| GET    | `/api/approvals/pending?userId=1&page=1` | Pending approvals, sorted ID DESC |
| PUT    | `/api/approvals/{id}/respond`      | Approve or reject                    |

### Query parameters — Jobs

| Param      | Type | Notes                         |
|------------|------|-------------------------------|
| page       | int  | Default 1                     |
| pageSize   | int  | Default 10, max 100           |
| statusId   | int? | Filter by status (1–6)        |
| moduleId   | int? | Filter by module (1–8)        |
| dateFrom   | date | ISO 8601                      |
| dateTo     | date | ISO 8601                      |
| siteId     | int? | Filter by site                |

All paginated responses follow this envelope:

```json
{
  "items":      [...],
  "totalCount": 47,
  "page":       1,
  "pageSize":   10,
  "totalPages": 5,
  "hasPrev":    false,
  "hasNext":    true
}
```

### Deploy to Azure

```bash
# Create Function App (once)
az group create -n qms-rg -l eastus
az storage account create -n qmsstorage -g qms-rg --sku Standard_LRS
az functionapp create \
  -n qms-functions \
  -g qms-rg \
  --consumption-plan-location eastus \
  --runtime dotnet-isolated \
  --runtime-version 8 \
  --storage-account qmsstorage

# Set connection string secret
az functionapp config appsettings set \
  -n qms-functions -g qms-rg \
  --settings "SqlConnectionString=<your-connection-string>"

# Publish
func azure functionapp publish qms-functions
```

---

## 3. Frontend

The React artifact (`QMSDashboard.jsx`) can be:

- **Dropped into Claude.ai** as a React artifact (runs instantly with mock data).
- **Integrated into a Vite/CRA/Next.js project**: replace the mock arrays at
  the top of the file with real `fetch()` calls to your Azure Functions URL.

### Connecting to the real API

In `QMSDashboard.jsx`, set:

```js
const BASE_URL = "https://qms-functions.azurewebsites.net/api";
```

Then replace the mock data calls, for example in `DashboardPage`:

```js
useEffect(() => {
  fetch(`${BASE_URL}/dashboard/summary?code=<function-key>`)
    .then(r => r.json())
    .then(setSummary);
}, []);
```

---

## 4. Features implemented

### Dashboard page
- Six summary cards (Pending / Open / Closed / Completed / Canceled / Overdue)
- Historical bar chart with 5 status series
- "Current Total Jobs (Not Closed)" panel
- Date-range filter chip

### Recent Opportunities (Jobs page)
- Paginated table, **10 items per page**, sorted by **Job ID descending**
- Color-coded status badges and priority pills
- Columns: ID, Job #, Title, Module, Priority, Status, Assigned To, Created, Due Date, Site
- Total count & page-range footer

### Pending Approvals page
- Paginated table, **10 items per page**, sorted by **Approval ID descending**
- Overdue due-dates highlighted in orange
- Inline Approve / Reject action buttons per row

### Responsive design
- Sidebar collapses to a drawer on mobile (< 1024 px)
- Hamburger menu in header
- Cards wrap on small screens
- Table scrolls horizontally on narrow viewports
- All breakpoints tested: 375 px → 1440 px

---

## 5. Security considerations

- Use **Function-level auth keys** (`AuthorizationLevel.Function`) for
  all endpoints; store keys in Azure Key Vault.
- Add **Azure Active Directory** / Entra ID authentication for production.
- Enable **Azure SQL Transparent Data Encryption** (on by default).
- Store `SqlConnectionString` in **Azure Key Vault** referenced via
  Key Vault references in App Settings, never in source control.
- Enable **Application Insights** for telemetry and error tracking.

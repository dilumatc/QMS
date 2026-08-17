using System.Net;
using System.Text.Json;
using Microsoft.Azure.Functions.Worker;
using Microsoft.Azure.Functions.Worker.Http;
using Microsoft.Extensions.Logging;
using QMS.Functions.Models;
using QMS.Functions.Services;

namespace QMS.Functions.Functions;

internal static class H
{
    static readonly JsonSerializerOptions J = new() { PropertyNamingPolicy = JsonNamingPolicy.CamelCase };
    public static HttpResponseData Ok(HttpRequestData r, object d)    { var res = r.CreateResponse(HttpStatusCode.OK);  res.Headers.Add("Content-Type","application/json"); res.Headers.Add("Access-Control-Allow-Origin","*"); res.WriteString(JsonSerializer.Serialize(d,J)); return res; }
    public static HttpResponseData Bad(HttpRequestData r, string msg)  { var res = r.CreateResponse(HttpStatusCode.BadRequest); res.Headers.Add("Content-Type","application/json"); res.WriteString(JsonSerializer.Serialize(new{error=msg},J)); return res; }
    public static HttpResponseData Err(HttpRequestData r, string msg)  { var res = r.CreateResponse(HttpStatusCode.InternalServerError); res.Headers.Add("Content-Type","application/json"); res.WriteString(JsonSerializer.Serialize(new{error=msg},J)); return res; }
    public static HttpResponseData Cors(HttpRequestData r)             { var res = r.CreateResponse(HttpStatusCode.OK); res.Headers.Add("Access-Control-Allow-Origin","*"); res.Headers.Add("Access-Control-Allow-Headers","Content-Type,Authorization"); res.Headers.Add("Access-Control-Allow-Methods","GET,POST,PUT,DELETE,OPTIONS"); return res; }
    public static System.Collections.Specialized.NameValueCollection QS(HttpRequestData r) => System.Web.HttpUtility.ParseQueryString(r.Url.Query);
}

// ─── Dashboard ────────────────────────────────────────────────────────────────
public class DashboardFunction(IDashboardRepository dash, ILogger<DashboardFunction> log)
{
    [Function("GetDashboardSummary")]
    public async Task<HttpResponseData> Get([HttpTrigger(AuthorizationLevel.Function,"get","options",Route="dashboard/summary")] HttpRequestData req)
    {
        if (req.Method=="OPTIONS") return H.Cors(req);
        try { return H.Ok(req, await dash.GetSummaryAsync()); }
        catch (Exception ex) { log.LogError(ex,"Dashboard summary failed"); return H.Err(req,"Failed to load summary."); }
    }
}

// ─── Opportunities ────────────────────────────────────────────────────────────
public class OpportunitiesFunction(IOpportunityRepository opp, ILogger<OpportunitiesFunction> log)
{
    /// GET /api/opportunities?page=1&pageSize=10&statusFilter=&officeFilter=&searchTerm=
    [Function("GetOpportunities")]
    public async Task<HttpResponseData> GetList([HttpTrigger(AuthorizationLevel.Function,"get","options",Route="opportunities")] HttpRequestData req)
    {
        if (req.Method=="OPTIONS") return H.Cors(req);
        try {
            var qs = H.QS(req);
            var p = new OpportunityQueryParams {
                PageNumber   = int.TryParse(qs["page"],     out var pg) ? pg : 1,
                PageSize     = int.TryParse(qs["pageSize"], out var ps) ? Math.Clamp(ps,1,100) : 10,
                StatusFilter = int.TryParse(qs["statusFilter"], out var sf) ? sf : null,
                OfficeFilter = qs["officeFilter"],
                SearchTerm   = qs["searchTerm"]
            };
            return H.Ok(req, await opp.GetRecentOpportunitiesAsync(p));
        } catch (Exception ex) { log.LogError(ex,"Get opportunities failed"); return H.Err(req,"Failed to load opportunities."); }
    }

    /// GET /api/opportunities/pending?page=1&pageSize=10
    [Function("GetPendingApprovals")]
    public async Task<HttpResponseData> GetPending([HttpTrigger(AuthorizationLevel.Function,"get","options",Route="opportunities/pending")] HttpRequestData req)
    {
        if (req.Method=="OPTIONS") return H.Cors(req);
        try {
            var qs   = H.QS(req);
            var page = int.TryParse(qs["page"],     out var p) ? p : 1;
            var size = int.TryParse(qs["pageSize"], out var s) ? Math.Clamp(s,1,100) : 10;
            return H.Ok(req, await opp.GetPendingApprovalsAsync(page, size));
        } catch (Exception ex) { log.LogError(ex,"Pending approvals failed"); return H.Err(req,"Failed to load pending approvals."); }
    }

    /// POST /api/opportunities
    [Function("CreateOpportunity")]
    public async Task<HttpResponseData> Create([HttpTrigger(AuthorizationLevel.Function,"post","options",Route="opportunities")] HttpRequestData req)
    {
        if (req.Method=="OPTIONS") return H.Cors(req);
        try {
            var body = await req.ReadAsStringAsync();
            if (string.IsNullOrWhiteSpace(body)) return H.Bad(req,"Request body required.");
            var r = JsonSerializer.Deserialize<CreateOpportunityRequest>(body, new JsonSerializerOptions{PropertyNameCaseInsensitive=true});
            if (r is null || string.IsNullOrWhiteSpace(r.ProjectName)) return H.Bad(req,"ProjectName is required.");
            var id = await opp.CreateOpportunityAsync(r);
            return H.Ok(req, new { masterID = id, message = "Opportunity created successfully." });
        } catch (Exception ex) { log.LogError(ex,"Create opportunity failed"); return H.Err(req,"Failed to create opportunity."); }
    }

    /// PUT /api/opportunities/{id}/approve
    [Function("ProcessApproval")]
    public async Task<HttpResponseData> Approve([HttpTrigger(AuthorizationLevel.Function,"put","options",Route="opportunities/{id}/approve")] HttpRequestData req, int id)
    {
        if (req.Method=="OPTIONS") return H.Cors(req);
        try {
            var body = await req.ReadAsStringAsync();
            var r = JsonSerializer.Deserialize<ApprovalResponse>(body!, new JsonSerializerOptions{PropertyNameCaseInsensitive=true});
            if (r is null) return H.Bad(req,"Invalid request.");
            r.MasterID = id;
            await opp.ProcessApprovalAsync(r);
            return H.Ok(req, new { success = true });
        } catch (Exception ex) { log.LogError(ex,"Approval failed for ID {ID}",id); return H.Err(req,"Failed to process approval."); }
    }
}

// ─── Clients ──────────────────────────────────────────────────────────────────
public class ClientsFunction(IClientRepository clients, ILogger<ClientsFunction> log)
{
    /// GET /api/clients?page=1&pageSize=10&search=
    [Function("GetClients")]
    public async Task<HttpResponseData> GetList([HttpTrigger(AuthorizationLevel.Function,"get","options",Route="clients")] HttpRequestData req)
    {
        if (req.Method=="OPTIONS") return H.Cors(req);
        try {
            var qs   = H.QS(req);
            var page = int.TryParse(qs["page"],     out var p) ? p : 1;
            var size = int.TryParse(qs["pageSize"], out var s) ? Math.Clamp(s,1,100) : 10;
            return H.Ok(req, await clients.GetClientsAsync(page, size, qs["search"]));
        } catch (Exception ex) { log.LogError(ex,"Get clients failed"); return H.Err(req,"Failed to load clients."); }
    }

    /// GET /api/clients/lookup  — lightweight list for dropdowns
    [Function("GetClientsLookup")]
    public async Task<HttpResponseData> Lookup([HttpTrigger(AuthorizationLevel.Function,"get","options",Route="clients/lookup")] HttpRequestData req)
    {
        if (req.Method=="OPTIONS") return H.Cors(req);
        try { return H.Ok(req, await clients.GetAllClientsLookupAsync()); }
        catch (Exception ex) { log.LogError(ex,"Clients lookup failed"); return H.Err(req,"Failed."); }
    }

    /// GET /api/clients/{id}/contacts
    [Function("GetClientContacts")]
    public async Task<HttpResponseData> Contacts([HttpTrigger(AuthorizationLevel.Function,"get","options",Route="clients/{id}/contacts")] HttpRequestData req, int id)
    {
        if (req.Method=="OPTIONS") return H.Cors(req);
        try { return H.Ok(req, await clients.GetContactsByClientAsync(id)); }
        catch (Exception ex) { log.LogError(ex,"Client contacts failed for ID {ID}",id); return H.Err(req,"Failed."); }
    }
}

// ─── Sites ────────────────────────────────────────────────────────────────────
public class SitesFunction(ISiteRepository sites, ILogger<SitesFunction> log)
{
    /// GET /api/sites?page=1&pageSize=10&search=
    [Function("GetSites")]
    public async Task<HttpResponseData> GetList([HttpTrigger(AuthorizationLevel.Function,"get","options",Route="sites")] HttpRequestData req)
    {
        if (req.Method=="OPTIONS") return H.Cors(req);
        try {
            var qs   = H.QS(req);
            var page = int.TryParse(qs["page"],     out var p) ? p : 1;
            var size = int.TryParse(qs["pageSize"], out var s) ? Math.Clamp(s,1,100) : 10;
            return H.Ok(req, await sites.GetSiteNamesAsync(page, size, qs["search"]));
        } catch (Exception ex) { log.LogError(ex,"Get sites failed"); return H.Err(req,"Failed to load sites."); }
    }

    /// GET /api/sites/lookup
    [Function("GetSitesLookup")]
    public async Task<HttpResponseData> Lookup([HttpTrigger(AuthorizationLevel.Function,"get","options",Route="sites/lookup")] HttpRequestData req)
    {
        if (req.Method=="OPTIONS") return H.Cors(req);
        try { return H.Ok(req, await sites.GetAllSitesLookupAsync()); }
        catch (Exception ex) { log.LogError(ex,"Sites lookup failed"); return H.Err(req,"Failed."); }
    }
}

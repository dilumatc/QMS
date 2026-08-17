using Dapper;
using Microsoft.Data.SqlClient;
using QMS.Functions.Models;
using System.Data;

namespace QMS.Functions.Services;

public interface IDbConnectionFactory { IDbConnection CreateConnection(); }
public class SqlConnectionFactory(string cs) : IDbConnectionFactory
{
    public IDbConnection CreateConnection() => new SqlConnection(cs);
}

// ─── Dashboard ────────────────────────────────────────────────────────────────
public interface IDashboardRepository
{
    Task<DashboardSummary> GetSummaryAsync();
}
public class DashboardRepository(IDbConnectionFactory f) : IDashboardRepository
{
    public async Task<DashboardSummary> GetSummaryAsync()
    {
        using var c = f.CreateConnection();
        return await c.QuerySingleOrDefaultAsync<DashboardSummary>(
            "SELECT * FROM dbo.vw_DashboardSummary") ?? new DashboardSummary();
    }
}

// ─── Opportunities ────────────────────────────────────────────────────────────
public interface IOpportunityRepository
{
    Task<PagedResult<OpportunityListItem>> GetRecentOpportunitiesAsync(OpportunityQueryParams q);
    Task<PagedResult<OpportunityListItem>> GetPendingApprovalsAsync(int page, int pageSize);
    Task<int> CreateOpportunityAsync(CreateOpportunityRequest req);
    Task ProcessApprovalAsync(ApprovalResponse r);
}
public class OpportunityRepository(IDbConnectionFactory f) : IOpportunityRepository
{
    public async Task<PagedResult<OpportunityListItem>> GetRecentOpportunitiesAsync(OpportunityQueryParams q)
    {
        using var c = f.CreateConnection();
        var rows = await c.QueryAsync<OpportunityListItem>(
            "dbo.sp_GetRecentOpportunities",
            new { q.PageNumber, q.PageSize, q.StatusFilter, q.OfficeFilter, q.SearchTerm },
            commandType: CommandType.StoredProcedure);
        var list = rows.ToList();
        return new PagedResult<OpportunityListItem> { Items = list, TotalCount = list.FirstOrDefault()?.TotalCount ?? 0, Page = q.PageNumber, PageSize = q.PageSize };
    }

    public async Task<PagedResult<OpportunityListItem>> GetPendingApprovalsAsync(int page, int pageSize)
    {
        using var c = f.CreateConnection();
        var rows = await c.QueryAsync<OpportunityListItem>(
            "dbo.sp_GetPendingApprovals",
            new { PageNumber = page, PageSize = pageSize },
            commandType: CommandType.StoredProcedure);
        var list = rows.ToList();
        return new PagedResult<OpportunityListItem> { Items = list, TotalCount = list.FirstOrDefault()?.TotalCount ?? 0, Page = page, PageSize = pageSize };
    }

    public async Task<int> CreateOpportunityAsync(CreateOpportunityRequest req)
    {
        using var c = f.CreateConnection();
        var result = await c.QuerySingleAsync<dynamic>(
            "dbo.sp_CreateOpportunity",
            new {
                req.ProjectName, req.SubProjectName, ID_Client = req.ClientID,
                CreatedBy = req.SubmittedByName ?? "System",
                req.ProjectManagerName, req.SubProjectManagerName,
                req.OfficeForFormSubmission, req.SiteName, req.SiteShortName,
                req.ScopeOfWork, req.ProjectType, req.CategoryList, req.Commodity,
                req.EstimatedProjectFeeValue, req.ProbabilityOfSuccess,
                req.FeeType, req.TaxRule, req.InvoiceCurrency,
                req.LabTestingRequired, req.MechanicalDesignRequired,
                req.SiteWorkRequired, req.SeismicHazardIntegrityRequired,
                req.ExistingClient, req.ExistingSite,
                req.TentativeProjectStartDate, req.TentativeProjectEndDate,
                req.SubmittedByName, req.SubmittedByEmail,
                req.GateZero_Q1, req.GateZero_Q2, req.GateZero_Q3, req.GateZero_Q4,
                req.GateZero_Q5, req.GateZero_Q6, req.GateZero_Q7, req.GateZero_Q8,
                req.GateZero_ApprovalBy,
                req.ContactName, req.ContactSalutation, req.ContactPosition,
                req.ContactPhone, req.ContactMobile, req.ContactEmail,
                req.ATCLink, req.SourcedContactAt
            },
            commandType: CommandType.StoredProcedure);
        return (int)result.NewMasterID;
    }

    public async Task ProcessApprovalAsync(ApprovalResponse r)
    {
        using var c = f.CreateConnection();
        var status = r.Approved ? "Approved" : "Rejected";
        var now = DateTime.UtcNow;
        var sql = r.ApprovalField switch
        {
            "FM01B"    => "UPDATE dbo.QMS_Master SET FM01B_ApprovalStatus=@Status, FM01B_ApprovedBy=@By, FM01B_ApprovedDate=@Now, ModifiedAt=@Now WHERE ID=@ID",
            "FM01A_OM" => "UPDATE dbo.QMS_Master SET FM01A_OM_ApprovalStatus=@Status, FM01A_OM_ApprovedBy=@By, FM01A_OM_ApprovedDate=@Now, FM01A_OM_Recommendations=@Comments, ModifiedAt=@Now WHERE ID=@ID",
            _          => "UPDATE dbo.QMS_Master SET FM01A_ApprovalStatus=@Status, FM01A_ApprovedBy=@By, FM01A_ApprovedDate=@Now, ModifiedAt=@Now WHERE ID=@ID"
        };
        await c.ExecuteAsync(sql, new { Status = status, By = r.ApprovedBy, Now = now, Comments = r.Comments, ID = r.MasterID });
    }
}

// ─── Clients ──────────────────────────────────────────────────────────────────
public interface IClientRepository
{
    Task<PagedResult<ClientListItem>> GetClientsAsync(int page, int pageSize, string? search);
    Task<IEnumerable<ClientContact>> GetContactsByClientAsync(int clientId);
    Task<IEnumerable<ClientListItem>> GetAllClientsLookupAsync();
}
public class ClientRepository(IDbConnectionFactory f) : IClientRepository
{
    public async Task<PagedResult<ClientListItem>> GetClientsAsync(int page, int pageSize, string? search)
    {
        using var c = f.CreateConnection();
        var rows = await c.QueryAsync<ClientListItem>(
            "dbo.sp_GetClients",
            new { PageNumber = page, PageSize = pageSize, SearchTerm = search },
            commandType: CommandType.StoredProcedure);
        var list = rows.ToList();
        return new PagedResult<ClientListItem> { Items = list, TotalCount = list.FirstOrDefault()?.TotalCount ?? 0, Page = page, PageSize = pageSize };
    }

    public async Task<IEnumerable<ClientContact>> GetContactsByClientAsync(int clientId)
    {
        using var c = f.CreateConnection();
        return await c.QueryAsync<ClientContact>(
            "SELECT * FROM dbo.Client_Contacts WHERE ClientID=@ClientID ORDER BY ContactName",
            new { ClientID = clientId });
    }

    public async Task<IEnumerable<ClientListItem>> GetAllClientsLookupAsync()
    {
        using var c = f.CreateConnection();
        return await c.QueryAsync<ClientListItem>(
            "SELECT ID, CompanyName, IsCritical FROM dbo.Clients ORDER BY CompanyName");
    }
}

// ─── Sites ────────────────────────────────────────────────────────────────────
public interface ISiteRepository
{
    Task<PagedResult<SiteNameListItem>> GetSiteNamesAsync(int page, int pageSize, string? search);
    Task<IEnumerable<SiteNameListItem>> GetAllSitesLookupAsync();
}
public class SiteRepository(IDbConnectionFactory f) : ISiteRepository
{
    public async Task<PagedResult<SiteNameListItem>> GetSiteNamesAsync(int page, int pageSize, string? search)
    {
        using var c = f.CreateConnection();
        var rows = await c.QueryAsync<SiteNameListItem>(
            "dbo.sp_GetSiteNames",
            new { PageNumber = page, PageSize = pageSize, SearchTerm = search },
            commandType: CommandType.StoredProcedure);
        var list = rows.ToList();
        return new PagedResult<SiteNameListItem> { Items = list, TotalCount = list.FirstOrDefault()?.TotalCount ?? 0, Page = page, PageSize = pageSize };
    }

    public async Task<IEnumerable<SiteNameListItem>> GetAllSitesLookupAsync()
    {
        using var c = f.CreateConnection();
        return await c.QueryAsync<SiteNameListItem>(
            "SELECT ID, Title, SiteName, SiteLocation FROM dbo.QMS_Site_Name ORDER BY SiteName");
    }
}

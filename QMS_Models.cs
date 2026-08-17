namespace QMS.Functions.Models;

// ─── Pagination ───────────────────────────────────────────────────────────────
public class PagedResult<T>
{
    public IEnumerable<T> Items      { get; set; } = [];
    public int            TotalCount  { get; set; }
    public int            Page        { get; set; }
    public int            PageSize    { get; set; }
    public int            TotalPages  => PageSize > 0 ? (int)Math.Ceiling((double)TotalCount / PageSize) : 0;
    public bool           HasPrev     => Page > 1;
    public bool           HasNext     => Page < TotalPages;
}

// ─── Dashboard ────────────────────────────────────────────────────────────────
public class DashboardSummary
{
    public int TotalOpportunities    { get; set; }
    public int ActiveOpportunities   { get; set; }
    public int ClosedOpportunities   { get; set; }
    public int PendingApprovals      { get; set; }
    public int PendingFM01B          { get; set; }
    public int UniqueClients         { get; set; }
    public int ApprovedOpportunities { get; set; }
}

// ─── QMS_Master ───────────────────────────────────────────────────────────────
public class OpportunityListItem
{
    public int      ID                      { get; set; }
    public string   ProjectName             { get; set; } = "";
    public string?  ProjectNumber           { get; set; }
    public string?  SubProjectName          { get; set; }
    public string?  SubProjectNumber        { get; set; }
    public string?  ProjectManagerName      { get; set; }
    public string?  SubProjectManagerName   { get; set; }
    public string?  OfficeForFormSubmission { get; set; }
    public string?  FM01A_ApprovalStatus    { get; set; }
    public string?  FM01A_ApprovedBy        { get; set; }
    public DateTime? FM01A_ApprovedDate     { get; set; }
    public string?  FM01A_OM_ApprovalStatus { get; set; }
    public string?  FM01B_ApprovalStatus    { get; set; }
    public int      ProjectStatus           { get; set; }
    public string?  SiteName                { get; set; }
    public string?  SiteShortName           { get; set; }
    public string?  CreatedBy               { get; set; }
    public DateTime CreatedAt               { get; set; }
    public DateTime ModifiedAt              { get; set; }
    public string?  ClientName              { get; set; }
    public int      TotalCount              { get; set; }
}

public class OpportunityQueryParams
{
    public int     PageNumber    { get; set; } = 1;
    public int     PageSize      { get; set; } = 10;
    public int?    StatusFilter  { get; set; }
    public string? OfficeFilter  { get; set; }
    public string? SearchTerm    { get; set; }
}

// ─── Clients ──────────────────────────────────────────────────────────────────
public class ClientListItem
{
    public int     ID                  { get; set; }
    public string  CompanyName         { get; set; } = "";
    public string? CompanyABN          { get; set; }
    public string? CompanyAddressLine1 { get; set; }
    public string? CompanySuburb       { get; set; }
    public string? CompanyState        { get; set; }
    public string? CompanyPostCode     { get; set; }
    public string? CompanyCountry      { get; set; }
    public string? CompanyPhone        { get; set; }
    public string? CompanyEmailAddress { get; set; }
    public string? CompanyWebSite      { get; set; }
    public bool    IsCritical          { get; set; }
    public int     ContactCount        { get; set; }
    public int     TotalCount          { get; set; }
}

public class ClientContact
{
    public int     ID                { get; set; }
    public int     ClientID          { get; set; }
    public string  ContactName       { get; set; } = "";
    public string? ContactSalutation { get; set; }
    public string? ContactPosition   { get; set; }
    public string? ContactPhone      { get; set; }
    public string? ContactMobile     { get; set; }
    public string? ContactEmail      { get; set; }
    public string? ATCLink           { get; set; }
    public string? SourcedContactAt  { get; set; }
}

// ─── QMS_Site_Name ────────────────────────────────────────────────────────────
public class SiteNameListItem
{
    public int     ID               { get; set; }
    public string  Title            { get; set; } = "";
    public string  SiteName         { get; set; } = "";
    public string? SiteLocation     { get; set; }
    public string? StreetLine1      { get; set; }
    public string? Site_Suburb_Town { get; set; }
    public string? SiteCountry      { get; set; }
    public string? Site_PostCode    { get; set; }
    public DateTime CreatedAt       { get; set; }
    public int     TotalCount       { get; set; }
}

// ─── FM-01A Create Request ─────────────────────────────────────────────────────
public class CreateOpportunityRequest
{
    // Part 1
    public string  ProjectName                    { get; set; } = "";
    public string? SubProjectName                 { get; set; }
    public string? ScopeOfWork                    { get; set; }
    public string? ProjectType                    { get; set; }
    public string? CategoryList                   { get; set; }
    public string? Commodity                      { get; set; }
    public bool?   ExistingSite                   { get; set; }
    public string? SiteName                       { get; set; }
    public string? SiteShortName                  { get; set; }
    public bool?   ExistingClient                 { get; set; }
    public int?    ClientID                       { get; set; }
    public string? EstimatedProjectFeeValue       { get; set; }
    public decimal? ProbabilityOfSuccess          { get; set; }
    public string? OfficeForFormSubmission        { get; set; }
    // Gate Zero
    public bool?   GateZero_Q1                    { get; set; }
    public bool?   GateZero_Q2                    { get; set; }
    public bool?   GateZero_Q3                    { get; set; }
    public bool?   GateZero_Q4                    { get; set; }
    public bool?   GateZero_Q5                    { get; set; }
    public bool?   GateZero_Q6                    { get; set; }
    public bool?   GateZero_Q7                    { get; set; }
    public bool?   GateZero_Q8                    { get; set; }
    public string? GateZero_ApprovalBy            { get; set; }
    // Part 2
    public string?   ProjectManagerName           { get; set; }
    public string?   SubProjectManagerName        { get; set; }
    public DateTime? TentativeProjectStartDate    { get; set; }
    public DateTime? TentativeProjectEndDate      { get; set; }
    public bool?     LabTestingRequired           { get; set; }
    public bool?     MechanicalDesignRequired     { get; set; }
    public bool?     SiteWorkRequired             { get; set; }
    public bool?     SeismicHazardIntegrityRequired { get; set; }
    public string?   FeeType                      { get; set; }
    public string?   TaxRule                      { get; set; }
    public string?   InvoiceCurrency              { get; set; }
    // Contact
    public string?   ContactName                  { get; set; }
    public string?   ContactSalutation            { get; set; }
    public string?   ContactPosition              { get; set; }
    public string?   ContactPhone                 { get; set; }
    public string?   ContactMobile                { get; set; }
    public string?   ContactEmail                 { get; set; }
    public string?   ATCLink                      { get; set; }
    public string?   SourcedContactAt             { get; set; }
    // Submission
    public string?   SubmittedByName              { get; set; }
    public string?   SubmittedByEmail             { get; set; }
}

// ─── Approval response ────────────────────────────────────────────────────────
public class ApprovalResponse
{
    public int    MasterID    { get; set; }
    public string ApprovalField { get; set; } = "FM01A"; // FM01A | FM01B | FM01A_OM
    public bool   Approved    { get; set; }
    public string ApprovedBy  { get; set; } = "";
    public string? Comments   { get; set; }
}

-- ============================================================
-- ATC Williams QMS — Azure SQL Database Schema
-- Tables named to match uploaded CSV files exactly
-- ============================================================

-- ─── Clients (from Clients.csv) ───────────────────────────────────────────────
CREATE TABLE dbo.Clients (
    ID                   INT            NOT NULL IDENTITY(1,1) PRIMARY KEY,
    CompanyName          NVARCHAR(300)  NOT NULL,
    CompanyABN           NVARCHAR(50)   NULL,
    CompanyAddressLine1  NVARCHAR(300)  NULL,
    CompanyAddressLine2  NVARCHAR(300)  NULL,
    CompanySuburb        NVARCHAR(100)  NULL,
    CompanyState         NVARCHAR(100)  NULL,
    CompanyPostCode      NVARCHAR(20)   NULL,
    CompanyCountry       NVARCHAR(100)  NULL,
    CompanyPhone         NVARCHAR(50)   NULL,
    CompanyEmailAddress  NVARCHAR(256)  NULL,
    CompanyWebSite       NVARCHAR(300)  NULL,
    IsCritical           BIT            NOT NULL DEFAULT 0,
    CreatedAt            DATETIME2      NOT NULL DEFAULT GETUTCDATE(),
    ModifiedAt           DATETIME2      NOT NULL DEFAULT GETUTCDATE()
);
CREATE INDEX IX_Clients_CompanyName ON dbo.Clients(CompanyName);

-- ─── Client_Contacts (from Client_Contacts.csv) ───────────────────────────────
CREATE TABLE dbo.Client_Contacts (
    ID                 INT            NOT NULL IDENTITY(1,1) PRIMARY KEY,
    ClientID           INT            NOT NULL REFERENCES dbo.Clients(ID),
    ContactName        NVARCHAR(200)  NOT NULL,
    ContactSalutation  NVARCHAR(20)   NULL,
    ContactPosition    NVARCHAR(300)  NULL,
    ContactPhone       NVARCHAR(50)   NULL,
    ContactMobile      NVARCHAR(50)   NULL,
    ContactEmail       NVARCHAR(256)  NULL,
    ATCLink            NVARCHAR(200)  NULL,
    SourcedContactAt   NVARCHAR(300)  NULL,
    CreatedAt          DATETIME2      NOT NULL DEFAULT GETUTCDATE()
);
CREATE INDEX IX_ClientContacts_ClientID ON dbo.Client_Contacts(ClientID);

-- ─── QMS_Site_Name (from QMS_Site_Name.csv) ──────────────────────────────────
CREATE TABLE dbo.QMS_Site_Name (
    ID               INT            NOT NULL IDENTITY(1,1) PRIMARY KEY,
    Title            NVARCHAR(50)   NOT NULL,   -- short code e.g. "AARCS"
    SiteName         NVARCHAR(300)  NOT NULL,
    SiteLocation     NVARCHAR(100)  NULL,       -- state/region
    StreetLine1      NVARCHAR(300)  NULL,
    StreetLine2      NVARCHAR(300)  NULL,
    [Site_Suburb_Town] NVARCHAR(100) NULL,
    SiteCountry      NVARCHAR(100)  NULL,
    Site_PostCode    NVARCHAR(20)   NULL,
    CreatedAt        DATETIME2      NOT NULL DEFAULT GETUTCDATE()
);
CREATE INDEX IX_QMSSiteName_Title ON dbo.QMS_Site_Name(Title);

-- ─── QMS_Master (from QMS_Master.csv) ────────────────────────────────────────
CREATE TABLE dbo.QMS_Master (
    ID                              INT            NOT NULL IDENTITY(1,1) PRIMARY KEY,
    ProjectName                     NVARCHAR(500)  NOT NULL,
    ProjectNumber                   NVARCHAR(50)   NULL,
    SubProjectName                  NVARCHAR(500)  NULL,
    SubProjectNumber                NVARCHAR(50)   NULL,
    ID_Client                       INT            NULL REFERENCES dbo.Clients(ID),
    CreatedBy                       NVARCHAR(200)  NULL,
    ProjectManagerName              NVARCHAR(200)  NULL,
    SubProjectManagerName           NVARCHAR(200)  NULL,
    OfficeForFormSubmission         NVARCHAR(100)  NULL,
    -- Approval: SY-QS-FM-01B
    FM01B_ApprovalStatus            NVARCHAR(50)   NULL DEFAULT 'Pending',
    FM01B_ApprovedBy                NVARCHAR(200)  NULL,
    FM01B_ApprovedDate              DATETIME2      NULL,
    -- Approval: SY-QS-FM-01A
    FM01A_ApprovalStatus            NVARCHAR(50)   NULL DEFAULT 'Pending',
    FM01A_ApprovedBy                NVARCHAR(200)  NULL,
    FM01A_ApprovedDate              DATETIME2      NULL,
    -- Approval: SY-QS-FM-01A OM
    FM01A_OM_ApprovalStatus         NVARCHAR(50)   NULL DEFAULT 'Pending',
    FM01A_OM_ApprovedBy             NVARCHAR(200)  NULL,
    FM01A_OM_ApprovedDate           DATETIME2      NULL,
    FM01A_OM_Recommendations        NVARCHAR(MAX)  NULL,
    -- Closure: SY-QS-FM-19
    FM19_ClosedBy                   NVARCHAR(200)  NULL,
    FM19_ClosedDate                 DATETIME2      NULL,
    ProjectStatus                   INT            NOT NULL DEFAULT 0,  -- 0=Active,1=Closed,2=Archived
    SiteName                        NVARCHAR(300)  NULL,
    SiteShortName                   NVARCHAR(50)   NULL,
    V5                              BIT            NULL,
    CreatedAt                       DATETIME2      NOT NULL DEFAULT GETUTCDATE(),
    ModifiedAt                      DATETIME2      NOT NULL DEFAULT GETUTCDATE()
);
CREATE INDEX IX_QMSMaster_ClientID    ON dbo.QMS_Master(ID_Client);
CREATE INDEX IX_QMSMaster_Status      ON dbo.QMS_Master(ProjectStatus);
CREATE INDEX IX_QMSMaster_CreatedAt   ON dbo.QMS_Master(CreatedAt DESC);
CREATE INDEX IX_QMSMaster_PM         ON dbo.QMS_Master(ProjectManagerName);

-- ─── QMS_SY_QS_FM_01A (from QMS_SY-QS-FM-01A.csv) ───────────────────────────
-- The opportunity initiation form data
CREATE TABLE dbo.QMS_SY_QS_FM_01A (
    ID                              INT            NOT NULL IDENTITY(1,1) PRIMARY KEY,
    ID_Master                       INT            NULL REFERENCES dbo.QMS_Master(ID),
    -- Part 1: Project Details
    ProjectDescriptor               NVARCHAR(500)  NULL,   -- "Project Name" in form
    ScopeOfWork                     NVARCHAR(MAX)  NULL,
    ProjectType                     NVARCHAR(300)  NULL,   -- Technical Community
    CategoryList                    NVARCHAR(200)  NULL,
    Commodity                       NVARCHAR(100)  NULL,
    -- Part 1: Site
    ExistingSite                    BIT            NULL,
    SiteName                        NVARCHAR(300)  NULL,
    SiteShortName                   NVARCHAR(50)   NULL,
    -- Part 1: Client
    ExistingClient                  BIT            NULL,
    ClientID                        INT            NULL REFERENCES dbo.Clients(ID),
    -- Part 1: Financial
    EstimatedProjectFeeValue        NVARCHAR(50)   NULL,
    ProbabilityOfSuccess            DECIMAL(5,2)   NULL,
    EstimatedProposalValue          NVARCHAR(50)   NULL,
    EstimatedProposalFee            NVARCHAR(50)   NULL,
    -- Part 1: Office
    OfficeForFormSubmission         NVARCHAR(100)  NULL,
    -- Part 1: Gate Zero (8 questions Y/N)
    GateZero_Q1                     BIT            NULL,
    GateZero_Q2                     BIT            NULL,
    GateZero_Q3                     BIT            NULL,
    GateZero_Q4                     BIT            NULL,
    GateZero_Q5                     BIT            NULL,
    GateZero_Q6                     BIT            NULL,
    GateZero_Q7                     BIT            NULL,
    GateZero_Q8                     BIT            NULL,
    GateZero_ApprovalBy             NVARCHAR(200)  NULL,
    -- Part 2: Project Details
    ProjectNumber                   NVARCHAR(50)   NULL,
    TentativeProjectStartDate       DATETIME2      NULL,
    TentativeProjectEndDate         DATETIME2      NULL,
    ProjectManager                  NVARCHAR(200)  NULL,
    ProjectManagerEmail             NVARCHAR(256)  NULL,
    SubProjectManager               NVARCHAR(200)  NULL,
    SubProjectManagerEmail          NVARCHAR(256)  NULL,
    SubProjectStatus                NVARCHAR(50)   NULL,
    -- Part 2: Project Specific Requirements
    LabTestingRequired              BIT            NULL,
    MechanicalDesignRequired        BIT            NULL,
    SiteWorkRequired                BIT            NULL,
    SeismicHazardIntegrityRequired  BIT            NULL,
    -- Part 2: General Details
    FeeType                         NVARCHAR(100)  NULL,
    PractiseStaffRate               NVARCHAR(100)  NULL,
    InvoiceCurrency                 NVARCHAR(100)  NULL,
    TaxRule                         NVARCHAR(100)  NULL,
    IsExistingProject               BIT            NULL,
    -- Part 2: Site Address
    StreetLine1                     NVARCHAR(300)  NULL,
    StreetLine2                     NVARCHAR(300)  NULL,
    [Site_Suburb_Town]              NVARCHAR(100)  NULL,
    SiteState                       NVARCHAR(100)  NULL,
    SiteCountry                     NVARCHAR(100)  NULL,
    SitePostCode                    NVARCHAR(20)   NULL,
    SiteLatitude                    DECIMAL(10,6)  NULL,
    SiteLongitude                   DECIMAL(10,6)  NULL,
    -- Part 2: Primary Contact
    ContactName                     NVARCHAR(200)  NULL,
    ContactSalutation               NVARCHAR(20)   NULL,
    ContactPosition                 NVARCHAR(300)  NULL,
    ContactPhone                    NVARCHAR(50)   NULL,
    ContactMobile                   NVARCHAR(50)   NULL,
    ContactEmail                    NVARCHAR(256)  NULL,
    ATCLink                         NVARCHAR(200)  NULL,
    SourcedContactAt                NVARCHAR(300)  NULL,
    -- Submission metadata
    SubmittedByEmail                NVARCHAR(256)  NULL,
    SubmittedByName                 NVARCHAR(200)  NULL,
    SubmittedDateTime               DATETIME2      NULL,
    SubjectToLocalBuy               BIT            NULL,
    MultipleTechnicalCommunities    BIT            NULL,
    NotApplicable                   BIT            NULL,
    -- System
    CreatedAt                       DATETIME2      NOT NULL DEFAULT GETUTCDATE(),
    ModifiedAt                      DATETIME2      NOT NULL DEFAULT GETUTCDATE()
);
CREATE INDEX IX_FM01A_IDMaster  ON dbo.QMS_SY_QS_FM_01A(ID_Master);
CREATE INDEX IX_FM01A_ClientID  ON dbo.QMS_SY_QS_FM_01A(ClientID);
CREATE INDEX IX_FM01A_Created   ON dbo.QMS_SY_QS_FM_01A(CreatedAt DESC);

-- ─── Audit Log ────────────────────────────────────────────────────────────────
CREATE TABLE dbo.AuditLog (
    AuditID     INT           NOT NULL IDENTITY(1,1) PRIMARY KEY,
    TableName   NVARCHAR(100) NOT NULL,
    RecordID    INT           NOT NULL,
    Action      NVARCHAR(20)  NOT NULL,
    ChangedBy   NVARCHAR(200) NOT NULL,
    OldValues   NVARCHAR(MAX) NULL,
    NewValues   NVARCHAR(MAX) NULL,
    ChangedAt   DATETIME2     NOT NULL DEFAULT GETUTCDATE()
);

-- ─── FM01A_ManagerChanges (from QMS SYQSFM01A Manager Changes.csv) ──────────
CREATE TABLE dbo.FM01A_ManagerChanges (
    ID                 INT            NOT NULL IDENTITY(1,1) PRIMARY KEY,
    ID_Master          INT            NOT NULL REFERENCES dbo.QMS_Master(ID),
    Reason             NVARCHAR(MAX)  NULL,
    ProjectManager     NVARCHAR(200)  NULL,
    SubProjectManager  NVARCHAR(200)  NULL,
    CreatedAt          DATETIME2      NOT NULL DEFAULT GETUTCDATE()
);
CREATE INDEX IX_FM01A_MC_IDMaster ON dbo.FM01A_ManagerChanges(ID_Master);

-- ─── FM01B_Notes (from QMS SY-QS-FM-01B Notes.csv) ───────────────────────────
CREATE TABLE dbo.FM01B_Notes (
    ID          INT            NOT NULL IDENTITY(1,1) PRIMARY KEY,
    ID_Master   INT            NOT NULL REFERENCES dbo.QMS_Master(ID),
    GeneralNote NVARCHAR(MAX)  NULL,
    CreatedAt   DATETIME2      NOT NULL DEFAULT GETUTCDATE()
);
CREATE INDEX IX_FM01B_Notes_IDMaster ON dbo.FM01B_Notes(ID_Master);

-- ─── FM01B_TasksBudget (from QMS SY-QS-FM-01B Tasks and Budget.csv) ──────────
CREATE TABLE dbo.FM01B_TasksBudget (
    ID          INT            NOT NULL IDENTITY(1,1) PRIMARY KEY,
    ID_Master   INT            NOT NULL REFERENCES dbo.QMS_Master(ID),
    Tasks       NVARCHAR(500)  NULL,
    Budget      NVARCHAR(50)   NULL,
    CreatedBy   NVARCHAR(200)  NULL,
    ModifiedBy  NVARCHAR(200)  NULL,
    ModifiedAt  DATETIME2      NULL,
    CreatedAt   DATETIME2      NOT NULL DEFAULT GETUTCDATE()
);
CREATE INDEX IX_FM01B_Tasks_IDMaster ON dbo.FM01B_TasksBudget(ID_Master);

-- ─── FM02_Notes (from QMS SY-QS-FM-02 Notes.csv) ─────────────────────────────
CREATE TABLE dbo.FM02_Notes (
    ID          INT            NOT NULL IDENTITY(1,1) PRIMARY KEY,
    ID_Master   INT            NOT NULL REFERENCES dbo.QMS_Master(ID),
    GeneralNote NVARCHAR(MAX)  NULL,
    CreatedAt   DATETIME2      NOT NULL DEFAULT GETUTCDATE()
);
CREATE INDEX IX_FM02_Notes_IDMaster ON dbo.FM02_Notes(ID_Master);

-- ─── FM03A_Notes (from QMS SY-QS-FM-03A Notes.csv) ───────────────────────────
CREATE TABLE dbo.FM03A_Notes (
    ID          INT            NOT NULL IDENTITY(1,1) PRIMARY KEY,
    ID_Master   INT            NOT NULL REFERENCES dbo.QMS_Master(ID),
    GeneralNote NVARCHAR(MAX)  NULL,
    CreatedAt   DATETIME2      NOT NULL DEFAULT GETUTCDATE()
);
CREATE INDEX IX_FM03A_Notes_IDMaster ON dbo.FM03A_Notes(ID_Master);

-- ─── FM03B (from QMS SY-QS-FM-03B.csv) ───────────────────────────────────────
CREATE TABLE dbo.FM03B (
    ID                                  INT            NOT NULL IDENTITY(1,1) PRIMARY KEY,
    ID_Master                           INT            NOT NULL REFERENCES dbo.QMS_Master(ID),
    IsSubmitted                         BIT            NULL,
    -- Project Risk Factor Inputs (PFI)
    PFI_PopulationAtRisk                TINYINT        NULL,
    PFI_EnvironmentalHarm               TINYINT        NULL,
    PFI_ClientCorporateImpact           TINYINT        NULL,
    Schedule                            TINYINT        NULL,
    ScopeOfWork                         TINYINT        NULL,
    ProjectProfile                      TINYINT        NULL,
    LegalExposure                       TINYINT        NULL,
    TechnicalComplexity                 TINYINT        NULL,
    SkillsAvailability                  TINYINT        NULL,
    PastExperience                      TINYINT        NULL,
    ProvenSolutionTechnology            TINYINT        NULL,
    RiskCategoryGroupEmail              NVARCHAR(256)  NULL,
    -- Lead Reviewer
    LeadName                            NVARCHAR(200)  NULL,
    LeadEmail                           NVARCHAR(256)  NULL,
    LeadOMApproval                      NVARCHAR(200)  NULL,
    LeadRevAck                          NVARCHAR(200)  NULL,
    LeadProManAck                       NVARCHAR(200)  NULL,
    LeadOMApprovalEmail                 NVARCHAR(256)  NULL,
    LeadOMApprovalDateTime              DATETIME2      NULL,
    LeadRevAckEmail                     NVARCHAR(256)  NULL,
    LeadRevAckDateTime                  DATETIME2      NULL,
    LeadProManAckEmail                  NVARCHAR(256)  NULL,
    LeadProManAckDateTime               DATETIME2      NULL,
    -- Additional Reviewer 1
    Add1Name                            NVARCHAR(200)  NULL,
    Add1Email                           NVARCHAR(256)  NULL,
    Add1OMApproval                      NVARCHAR(200)  NULL,
    Add1RevAck                          NVARCHAR(200)  NULL,
    Add1ProManAck                       NVARCHAR(200)  NULL,
    Add1OMApprovalEmail                 NVARCHAR(256)  NULL,
    Add1OMApprovalDateTime              DATETIME2      NULL,
    Add1RevAckEmail                     NVARCHAR(256)  NULL,
    Add1RevAckDateTime                  DATETIME2      NULL,
    Add1ProManAckEmail                  NVARCHAR(256)  NULL,
    Add1ProManAckDateTime               DATETIME2      NULL,
    -- Additional Reviewer 2
    Add2Name                            NVARCHAR(200)  NULL,
    Add2Email                           NVARCHAR(256)  NULL,
    Add2OMApproval                      NVARCHAR(200)  NULL,
    Add2RevAck                          NVARCHAR(200)  NULL,
    Add2ProManAck                       NVARCHAR(200)  NULL,
    Add2OMApprovalEmail                 NVARCHAR(256)  NULL,
    Add2OMApprovalDateTime              DATETIME2      NULL,
    Add2RevAckEmail                     NVARCHAR(256)  NULL,
    Add2RevAckDateTime                  DATETIME2      NULL,
    Add2ProManAckEmail                  NVARCHAR(256)  NULL,
    Add2ProManAckDateTime               DATETIME2      NULL,
    -- Additional Reviewer 3
    Add3Name                            NVARCHAR(200)  NULL,
    Add3Email                           NVARCHAR(256)  NULL,
    Add3OMApproval                      NVARCHAR(200)  NULL,
    Add3OMApprovalEmail                 NVARCHAR(256)  NULL,
    Add3OMApprovalDateTime              DATETIME2      NULL,
    Add3RevAck                          NVARCHAR(200)  NULL,
    Add3RevAckEmail                     NVARCHAR(256)  NULL,
    Add3RevAckDateTime                  DATETIME2      NULL,
    Add3ProManAck                       NVARCHAR(200)  NULL,
    Add3ProManAckEmail                  NVARCHAR(256)  NULL,
    Add3ProManAckDateTime               DATETIME2      NULL,
    -- Additional Reviewer 4
    Add4Name                            NVARCHAR(200)  NULL,
    Add4Email                           NVARCHAR(256)  NULL,
    Add4OMApproval                      NVARCHAR(200)  NULL,
    Add4OMApprovalEmail                 NVARCHAR(256)  NULL,
    Add4OMApprovalDateTime              DATETIME2      NULL,
    Add4RevAck                          NVARCHAR(200)  NULL,
    Add4RevAckEmail                     NVARCHAR(256)  NULL,
    Add4RevAckDateTime                  DATETIME2      NULL,
    Add4ProManAck                       NVARCHAR(200)  NULL,
    Add4ProManAckEmail                  NVARCHAR(256)  NULL,
    Add4ProManAckDateTime               DATETIME2      NULL,
    -- Additional Reviewer 5
    Add5Name                            NVARCHAR(200)  NULL,
    Add5Email                           NVARCHAR(256)  NULL,
    Add5OMApproval                      NVARCHAR(200)  NULL,
    Add5OMApprovalEmail                 NVARCHAR(256)  NULL,
    Add5OMApprovalDateTime              DATETIME2      NULL,
    Add5RevAck                          NVARCHAR(200)  NULL,
    Add5RevAckEmail                     NVARCHAR(256)  NULL,
    Add5RevAckDateTime                  DATETIME2      NULL,
    Add5ProManAck                       NVARCHAR(200)  NULL,
    Add5ProManAckEmail                  NVARCHAR(256)  NULL,
    Add5ProManAckDateTime               DATETIME2      NULL,
    -- Additional Reviewer 6
    Add6Name                            NVARCHAR(200)  NULL,
    Add6Email                           NVARCHAR(256)  NULL,
    Add6OMApproval                      NVARCHAR(200)  NULL,
    Add6OMApprovalEmail                 NVARCHAR(256)  NULL,
    Add6OMApprovalDateTime              DATETIME2      NULL,
    Add6RevAck                          NVARCHAR(200)  NULL,
    Add6RevAckEmail                     NVARCHAR(256)  NULL,
    Add6RevAckDateTime                  DATETIME2      NULL,
    Add6ProManAck                       NVARCHAR(200)  NULL,
    Add6ProManAckEmail                  NVARCHAR(256)  NULL,
    Add6ProManAckDateTime               DATETIME2      NULL,
    -- Submission metadata
    SubmittedByEmail                    NVARCHAR(256)  NULL,
    SubmittedByName                     NVARCHAR(200)  NULL,
    SubmittedDateTime                   DATETIME2      NULL,
    -- Temp email staging columns (migration artefacts)
    LeadEmailTemp                       NVARCHAR(256)  NULL,
    Add1EmailTemp                       NVARCHAR(256)  NULL,
    Add2EmailTemp                       NVARCHAR(256)  NULL,
    Add3EmailTemp                       NVARCHAR(256)  NULL,
    Add4EmailTemp                       NVARCHAR(256)  NULL,
    Add5EmailTemp                       NVARCHAR(256)  NULL,
    Add6EmailTemp                       NVARCHAR(256)  NULL,
    -- Form settings
    ReviewType                          NVARCHAR(100)  NULL,
    NotApplicable                       BIT            NULL,
    DeclineRiskLevelReason              NVARCHAR(MAX)  NULL,
    ScopeOfWorkText                     NVARCHAR(MAX)  NULL,
    IsTailingsOrWaterStorageDamOver3m   BIT            NULL,
    SiteAccessAndHSEWConstraints        NVARCHAR(MAX)  NULL,
    CreatedAt                           DATETIME2      NOT NULL DEFAULT GETUTCDATE()
);
CREATE INDEX IX_FM03B_IDMaster ON dbo.FM03B(ID_Master);

-- ─── FM03B_Notes (from QMS SY-QS-FM-03B Notes.csv) ───────────────────────────
CREATE TABLE dbo.FM03B_Notes (
    ID          INT            NOT NULL IDENTITY(1,1) PRIMARY KEY,
    ID_Master   INT            NOT NULL REFERENCES dbo.QMS_Master(ID),
    GeneralNote NVARCHAR(MAX)  NULL,
    CreatedAt   DATETIME2      NOT NULL DEFAULT GETUTCDATE()
);
CREATE INDEX IX_FM03B_Notes_IDMaster ON dbo.FM03B_Notes(ID_Master);

-- ─── FM04_Notes (from QMS SY-QS-FM-04 Notes.csv) ─────────────────────────────
CREATE TABLE dbo.FM04_Notes (
    ID          INT            NOT NULL IDENTITY(1,1) PRIMARY KEY,
    ID_Master   INT            NOT NULL REFERENCES dbo.QMS_Master(ID),
    GeneralNote NVARCHAR(MAX)  NULL,
    CreatedAt   DATETIME2      NOT NULL DEFAULT GETUTCDATE()
);
CREATE INDEX IX_FM04_Notes_IDMaster ON dbo.FM04_Notes(ID_Master);

-- ─── FM04_Reviewers (from QMS SY-QS-FM-04 Reviewers.csv) ─────────────────────
CREATE TABLE dbo.FM04_Reviewers (
    ID                          INT            NOT NULL PRIMARY KEY,   -- source system ID
    ID_Master                   INT            NOT NULL REFERENCES dbo.QMS_Master(ID),
    DocNo                       NVARCHAR(200)  NULL,
    SubmittedBy                 NVARCHAR(200)  NULL,
    SubmittedByEmail            NVARCHAR(256)  NULL,
    DateSubmitted               DATE           NULL,
    ReviewType                  NVARCHAR(100)  NULL,
    Review1                     NVARCHAR(200)  NULL,
    Review2                     NVARCHAR(200)  NULL,
    ReviewerSighted             NVARCHAR(200)  NULL,
    ReviewerSightedSignedDate   DATETIME2      NULL,
    Review1SignedDate            DATETIME2      NULL,
    Review2SignedDate            DATETIME2      NULL,
    DocType                     NVARCHAR(100)  NULL,
    Attachments                 INT            NULL DEFAULT 0,
    Review1Comments             NVARCHAR(MAX)  NULL,
    Review2Comments             NVARCHAR(MAX)  NULL,
    CreatedBy                   NVARCHAR(200)  NULL,
    ModifiedBy                  NVARCHAR(200)  NULL,
    ModifiedAt                  DATETIME2      NULL,
    CreatedAt                   DATETIME2      NOT NULL DEFAULT GETUTCDATE()
);
CREATE INDEX IX_FM04_Rev_IDMaster ON dbo.FM04_Reviewers(ID_Master);

-- ─── FM04_ReviewersDocs (from QMS SY-QS-FM-04 Reviewers Docs.csv) ────────────
CREATE TABLE dbo.FM04_ReviewersDocs (
    ID                  INT            NOT NULL IDENTITY(1,1) PRIMARY KEY,
    ID_Master           INT            NOT NULL REFERENCES dbo.QMS_Master(ID),
    ID_FM04_Reviewers   INT            NOT NULL REFERENCES dbo.FM04_Reviewers(ID),
    Title               NVARCHAR(200)  NULL,
    Attachments         INT            NULL DEFAULT 0,
    CreatedBy           NVARCHAR(200)  NULL,
    CreatedAt           DATETIME2      NOT NULL DEFAULT GETUTCDATE()
);
CREATE INDEX IX_FM04_RevDocs_IDMaster   ON dbo.FM04_ReviewersDocs(ID_Master);
CREATE INDEX IX_FM04_RevDocs_ReviewerID ON dbo.FM04_ReviewersDocs(ID_FM04_Reviewers);

-- ============================================================
-- FM-05: Project Review Plan
-- ============================================================
CREATE TABLE dbo.FM05_ReviewPlan (
  ID            INT IDENTITY(1,1) PRIMARY KEY,
  ID_Master     INT NOT NULL REFERENCES dbo.FM_MasterList(ID),
  IsSubmitted   BIT,
  NotApplicable BIT,
  SignedProjectManagerName    NVARCHAR(200),
  SignedProjectManagerEmail   NVARCHAR(200),
  SignedProjectManagerDateTime DATETIME2,
  SignedLeadReviewerName      NVARCHAR(200),
  SignedLeadReviewerEmail     NVARCHAR(200),
  SignedLeadReviewerDateTime  DATETIME2,
  SignedProjectDirectorName   NVARCHAR(200),
  SignedProjectDirectorEmail  NVARCHAR(200),
  SignedProjectDirectorDateTime DATETIME2,
  SubmittedByName             NVARCHAR(200),
  SubmittedByEmail            NVARCHAR(200),
  SubmittedDateTime           DATETIME2,
  CreatedAt     DATETIME2 DEFAULT GETDATE()
);
GO

CREATE TABLE dbo.FM05_Notes (
  ID         INT IDENTITY(1,1) PRIMARY KEY,
  ID_Master  INT NOT NULL REFERENCES dbo.FM_MasterList(ID),
  GeneralNote NVARCHAR(MAX),
  CreatedAt  DATETIME2 DEFAULT GETDATE()
);
GO

CREATE TABLE dbo.FM05_ScopeOfWorkItems (
  ID                    INT IDENTITY(1,1) PRIMARY KEY,
  ID_Master             INT NOT NULL REFERENCES dbo.FM_MasterList(ID),
  WorkComponent         NVARCHAR(500),
  MinReviewLevel        NVARCHAR(20),
  ReviewerName          NVARCHAR(200),
  ReviewerEmail         NVARCHAR(200),
  PMAcceptance          NVARCHAR(200),
  ReviewCompleted       NVARCHAR(200),
  PMAcceptanceDateTime  DATETIME2,
  ReviewCompletedDateTime DATETIME2,
  CreatedAt             DATETIME2 DEFAULT GETDATE()
);
GO

-- ============================================================
-- FM-06: Project Plan
-- ============================================================
CREATE TABLE dbo.FM06_ProjectPlan (
  ID_Master                      INT NOT NULL PRIMARY KEY REFERENCES dbo.FM_MasterList(ID),
  ATCWProposal                   NVARCHAR(200),
  WrittenAcceptance              NVARCHAR(100),
  AwardAcceptanceDate            DATE,
  UseProposalScopeOfWork         NVARCHAR(20),
  SiteWorkRequired               NVARCHAR(20),
  CommunicationsMatrixRequired   NVARCHAR(20),
  CompletionOfBasisOfDesign      NVARCHAR(20),
  IsSubmitted                    BIT,
  NotApplicable                  BIT,
  ScheduleStartDate              DATE,
  ScheduleEndDate                DATE,
  SpecialistInternalResources    NVARCHAR(MAX),
  HealthAndSafetyRequirements    NVARCHAR(MAX),
  ProcessesAndProcedures         NVARCHAR(MAX),
  LocationFatigueRiskAssessment  NVARCHAR(MAX),
  LocationJourneyManagementPlan  NVARCHAR(MAX),
  LocationJSEASWMS               NVARCHAR(MAX),
  LocationHSEWPlan               NVARCHAR(MAX),
  SignedProjectManagerName       NVARCHAR(200),
  SignedProjectManagerEmail      NVARCHAR(200),
  SignedProjectManagerDateTime   DATETIME2,
  SignedLeadReviewerName         NVARCHAR(200),
  SignedLeadReviewerEmail        NVARCHAR(200),
  SignedLeadReviewerDateTime     DATETIME2,
  SignedProjectDirectorName      NVARCHAR(200),
  SignedProjectDirectorEmail     NVARCHAR(200),
  SignedProjectDirectorDateTime  DATETIME2,
  Modified                       DATETIME2,
  CreatedAt                      DATETIME2 DEFAULT GETDATE()
);
GO

CREATE TABLE dbo.FM06_Notes (
  ID         INT IDENTITY(1,1) PRIMARY KEY,
  ID_Master  INT NOT NULL REFERENCES dbo.FM_MasterList(ID),
  GeneralNote NVARCHAR(MAX),
  CreatedAt  DATETIME2 DEFAULT GETDATE()
);
GO

CREATE TABLE dbo.FM06_CriticalMilestones (
  ID                INT IDENTITY(1,1) PRIMARY KEY,
  ID_Master         INT NOT NULL REFERENCES dbo.FM_MasterList(ID),
  CriticalMilestone NVARCHAR(500),
  EndDate           DATE,
  CreatedAt         DATETIME2 DEFAULT GETDATE()
);
GO

CREATE TABLE dbo.FM06_Categories (
  ID          INT IDENTITY(1,1) PRIMARY KEY,
  Category    NVARCHAR(200),
  SubCategory NVARCHAR(200)
);
GO

CREATE TABLE dbo.FM06_KeyDeliverables (
  ID              INT IDENTITY(1,1) PRIMARY KEY,
  ID_Master       INT NOT NULL REFERENCES dbo.FM_MasterList(ID),
  ItemNo          NVARCHAR(100),
  DocType         NVARCHAR(100),
  Description     NVARCHAR(MAX),
  DeliverableDate DATE,
  CreatedBy       NVARCHAR(200),
  Modified        DATETIME2,
  Created         DATETIME2,
  CreatedAt       DATETIME2 DEFAULT GETDATE()
);
GO

CREATE TABLE dbo.FM06_ExternalResources (
  ID                        INT NOT NULL PRIMARY KEY,
  ID_Master                 INT NOT NULL REFERENCES dbo.FM_MasterList(ID),
  Name                      NVARCHAR(500),
  SelectionCriteria         NVARCHAR(500),
  Scope                     NVARCHAR(MAX),
  Deliverables              NVARCHAR(MAX),
  MonitoringMethod          NVARCHAR(500),
  ContractualArrangement    NVARCHAR(500),
  Insurances                NVARCHAR(500),
  ResponsibleATCWPerson     NVARCHAR(200),
  ResponsibleATCWPersonEmail NVARCHAR(200),
  CreatedAt                 DATETIME2 DEFAULT GETDATE()
);
GO

-- ============================================================
-- FM-07: Safety in Design
-- ============================================================
CREATE TABLE dbo.FM07_Main (
  ID                              INT NOT NULL PRIMARY KEY,
  ID_Master                       INT NOT NULL REFERENCES dbo.FM_MasterList(ID),
  IsSubmitted                     BIT,
  SignedProjectManagerName        NVARCHAR(200),
  SignedProjectManagerEmail       NVARCHAR(200),
  SignedProjectManagerDateTime    DATETIME2,
  SignedLeadReviewerName          NVARCHAR(200),
  SignedLeadReviewerEmail         NVARCHAR(200),
  SignedLeadReviewerDateTime      DATETIME2,
  SignedProjectDirectorName       NVARCHAR(200),
  SignedProjectDirectorEmail      NVARCHAR(200),
  SignedProjectDirectorDateTime   DATETIME2,
  SignedAdditionalReviewer1Name   NVARCHAR(200),
  SignedAdditionalReviewer1Email  NVARCHAR(200),
  SignedAdditionalReviewer1DateTime DATETIME2,
  SignedAdditionalReviewer2Name   NVARCHAR(200),
  SignedAdditionalReviewer2Email  NVARCHAR(200),
  SignedAdditionalReviewer2DateTime DATETIME2,
  CreatedAt                       DATETIME2 DEFAULT GETDATE()
);
GO

CREATE TABLE dbo.FM07_SID (
  ID                       INT IDENTITY(1,1) PRIMARY KEY,
  ID_Master                INT NOT NULL REFERENCES dbo.FM_MasterList(ID),
  Hazard                   NVARCHAR(MAX),
  Consequence              NVARCHAR(MAX),
  LikelihoodBefore         TINYINT,
  ConsequenceBefore        TINYINT,
  RiskOwner                NVARCHAR(200),
  RiskReviewDate           DATE,
  MitigationTakenByDesigner NVARCHAR(MAX),
  LikelihoodAfter          TINYINT,
  ConsequenceAfter         TINYINT,
  AnticipatedMeasure       NVARCHAR(MAX),
  CreatedAt                DATETIME2 DEFAULT GETDATE()
);
GO

CREATE TABLE dbo.FM07_Notes (
  ID         INT IDENTITY(1,1) PRIMARY KEY,
  ID_Master  INT NOT NULL REFERENCES dbo.FM_MasterList(ID),
  GeneralNote NVARCHAR(MAX),
  CreatedAt  DATETIME2 DEFAULT GETDATE()
);
GO

-- ============================================================
-- FM-08: Document Register
-- ============================================================
CREATE TABLE dbo.FM08_DocumentRegister (
  ID                                  INT NOT NULL PRIMARY KEY,
  ID_Master                           INT NOT NULL REFERENCES dbo.FM_MasterList(ID),
  DocNumber                           NVARCHAR(200),
  DocType                             NVARCHAR(100),
  OrderNumber                         NVARCHAR(50),
  DocRevision                         NVARCHAR(50),
  DocTitle                            NVARCHAR(500),
  DateIssued                          DATE,
  ProposedAgreedDeliverableDate       DATE,
  ReviewDate                          DATE,
  ReviewerSightedFinalDeliverable     NVARCHAR(200),
  ReviewerSightedFinalDeliverableDateTime DATETIME2,
  ID_FM16RD                           NVARCHAR(50),
  CreatedAt                           DATETIME2 DEFAULT GETDATE()
);
GO

CREATE TABLE dbo.FM08_Notes (
  ID         INT IDENTITY(1,1) PRIMARY KEY,
  ID_Master  INT NOT NULL REFERENCES dbo.FM_MasterList(ID),
  GeneralNote NVARCHAR(MAX),
  CreatedAt  DATETIME2 DEFAULT GETDATE()
);
GO

-- ============================================================
-- FM-09: Drawing Register
-- ============================================================
CREATE TABLE dbo.FM09_DrawingRegister (
  ID             INT IDENTITY(1,1) PRIMARY KEY,
  ID_Master      INT NOT NULL REFERENCES dbo.FM_MasterList(ID),
  DrawingFigure  NVARCHAR(50),
  Number         NVARCHAR(200),
  Title          NVARCHAR(500),
  RevisionNumber NVARCHAR(50),
  DateIssued     DATE,
  CreatedAt      DATETIME2 DEFAULT GETDATE()
);
GO

CREATE TABLE dbo.FM09_Notes (
  ID         INT IDENTITY(1,1) PRIMARY KEY,
  ID_Master  INT NOT NULL REFERENCES dbo.FM_MasterList(ID),
  GeneralNote NVARCHAR(MAX),
  CreatedAt  DATETIME2 DEFAULT GETDATE()
);
GO

-- ============================================================
-- FM-10: Communications Matrix
-- ============================================================
CREATE TABLE dbo.FM10_CommunicationsMatrix (
  ID_Master           INT NOT NULL PRIMARY KEY REFERENCES dbo.FM_MasterList(ID),
  IsSubmitted         BIT,
  CommunicationsProDir NVARCHAR(10),
  CommunicationsProMan NVARCHAR(10),
  CommunicationsOther  NVARCHAR(10),
  VariationsProDir    NVARCHAR(10),
  VariationsProMan    NVARCHAR(10),
  TechnicalWPMan      NVARCHAR(10),
  VariationsOther     NVARCHAR(10),
  TechnicalProDir     NVARCHAR(10),
  TechnicalProMan     NVARCHAR(10),
  TechnicalOther      NVARCHAR(10),
  GeneralProDir       NVARCHAR(10),
  GeneralProMan       NVARCHAR(10),
  GeneralOther        NVARCHAR(10),
  InvoicesPayProDir   NVARCHAR(10),
  InvoicesPayProMan   NVARCHAR(10),
  InvoicesPayOther    NVARCHAR(10),
  InvoicesBillProDir  NVARCHAR(10),
  InvoicesBillProMan  NVARCHAR(10),
  InvoicesBillOther   NVARCHAR(10),
  ObtainingProDir     NVARCHAR(10),
  ObtainingProMan     NVARCHAR(10),
  ObtainingOther      NVARCHAR(10),
  SigningProDir       NVARCHAR(10),
  SigningOther        NVARCHAR(10),
  CreatedAt           DATETIME2 DEFAULT GETDATE()
);
GO

CREATE TABLE dbo.FM10_Notes (
  ID         INT IDENTITY(1,1) PRIMARY KEY,
  ID_Master  INT NOT NULL REFERENCES dbo.FM_MasterList(ID),
  GeneralNote NVARCHAR(MAX),
  CreatedAt  DATETIME2 DEFAULT GETDATE()
);
GO

-- ============================================================
-- FM-11: Change Register
-- ============================================================
CREATE TABLE dbo.FM11_ChangeRegister (
  ID                   INT IDENTITY(1,1) PRIMARY KEY,
  ID_Master            INT NOT NULL REFERENCES dbo.QMS_Master(ID),
  CommunicationType    NVARCHAR(200),
  IdentificationNumber NVARCHAR(200),
  Description          NVARCHAR(MAX),
  InitiationDate       DATE,
  Impact               NVARCHAR(100),
  ApprovedDate         DATE,
  POFilePathLocation   NVARCHAR(500),
  Value                DECIMAL(18,2),
  CreatedAt            DATETIME2 DEFAULT GETDATE()
);
GO
CREATE INDEX IX_FM11_Change_IDMaster ON dbo.FM11_ChangeRegister(ID_Master);

CREATE TABLE dbo.FM11_EstCostItems (
  ID                   INT IDENTITY(1,1) PRIMARY KEY,
  FM11_ID              INT NOT NULL REFERENCES dbo.FM11_ChangeRegister(ID),
  CostType             NVARCHAR(200),
  Role                 NVARCHAR(200),
  StaffLevelList       NVARCHAR(200),
  EstimatedLabourHours DECIMAL(10,2),
  RatePerHour          DECIMAL(10,2),
  Total                DECIMAL(18,2),
  CreatedAt            DATETIME2 DEFAULT GETDATE()
);
GO
CREATE INDEX IX_FM11_Cost_FM11ID ON dbo.FM11_EstCostItems(FM11_ID);

CREATE TABLE dbo.FM11_Notes (
  ID          INT IDENTITY(1,1) PRIMARY KEY,
  ID_Master   INT NOT NULL REFERENCES dbo.QMS_Master(ID),
  GeneralNote NVARCHAR(MAX),
  CreatedAt   DATETIME2 DEFAULT GETDATE()
);
GO
CREATE INDEX IX_FM11_Notes_IDMaster ON dbo.FM11_Notes(ID_Master);

-- ============================================================
-- FM-12: Scope Change Register
-- ============================================================
CREATE TABLE dbo.FM12_ChangeRegister (
  ID                   INT IDENTITY(1,1) PRIMARY KEY,
  ID_Master            INT NOT NULL REFERENCES dbo.QMS_Master(ID),
  CommunicationType    NVARCHAR(200),
  IdentificationNumber NVARCHAR(200),
  Description          NVARCHAR(MAX),
  InitiationDate       DATE,
  Impact               NVARCHAR(100),
  ApprovedDate         DATE,
  POFilePathLocation   NVARCHAR(500),
  Value                DECIMAL(18,2),
  CreatedAt            DATETIME2 DEFAULT GETDATE()
);
GO
CREATE INDEX IX_FM12_Change_IDMaster ON dbo.FM12_ChangeRegister(ID_Master);

CREATE TABLE dbo.FM12_Notes (
  ID          INT IDENTITY(1,1) PRIMARY KEY,
  ID_Master   INT NOT NULL REFERENCES dbo.QMS_Master(ID),
  GeneralNote NVARCHAR(MAX),
  CreatedAt   DATETIME2 DEFAULT GETDATE()
);
GO
CREATE INDEX IX_FM12_Notes_IDMaster ON dbo.FM12_Notes(ID_Master);

-- ============================================================
-- FM-13: Basis of Design
-- ============================================================
CREATE TABLE dbo.FM13_BasisOfDesign (
  ID          INT IDENTITY(1,1) PRIMARY KEY,
  ID_Master   INT NOT NULL REFERENCES dbo.QMS_Master(ID),
  Attachments BIT NOT NULL DEFAULT 0,
  CreatedAt   DATETIME2 DEFAULT GETDATE()
);
GO
CREATE INDEX IX_FM13_BoD_IDMaster ON dbo.FM13_BasisOfDesign(ID_Master);

CREATE TABLE dbo.FM13_TemplateFile (
  ID          INT IDENTITY(1,1) PRIMARY KEY,
  Title       NVARCHAR(500),
  Attachments INT NOT NULL DEFAULT 0,
  CreatedAt   DATETIME2 DEFAULT GETDATE()
);
GO

CREATE TABLE dbo.FM13_Notes (
  ID          INT IDENTITY(1,1) PRIMARY KEY,
  ID_Master   INT NOT NULL REFERENCES dbo.QMS_Master(ID),
  GeneralNote NVARCHAR(MAX),
  CreatedAt   DATETIME2 DEFAULT GETDATE()
);
GO
CREATE INDEX IX_FM13_Notes_IDMaster ON dbo.FM13_Notes(ID_Master);

-- ============================================================
-- FM-14: Work Package Plan
-- ============================================================
CREATE TABLE dbo.FM14_WorkPackagePlan (
  ID                                    INT IDENTITY(1,1) PRIMARY KEY,
  ID_Master                             INT NOT NULL REFERENCES dbo.QMS_Master(ID),
  WorkPackageDescription                NVARCHAR(MAX),
  Deliverables                          NVARCHAR(MAX),
  VerificationRequirements              NVARCHAR(MAX),
  SpecificInformationProvidedOrRequired NVARCHAR(MAX),
  DateAssigned                          DATE,
  DateRequired                          DATE,
  CreatedAt                             DATETIME2 DEFAULT GETDATE()
);
GO
CREATE INDEX IX_FM14_WPP_IDMaster ON dbo.FM14_WorkPackagePlan(ID_Master);

CREATE TABLE dbo.FM14_Tasks (
  ID               INT IDENTITY(1,1) PRIMARY KEY,
  FM14_ID          INT NOT NULL REFERENCES dbo.FM14_WorkPackagePlan(ID),
  TasksNo          NVARCHAR(50),
  TasksDescription NVARCHAR(MAX),
  PersonHours      DECIMAL(10,2),
  CostPHour        DECIMAL(10,2),
  CreatedAt        DATETIME2 DEFAULT GETDATE()
);
GO
CREATE INDEX IX_FM14_Tasks_FM14ID ON dbo.FM14_Tasks(FM14_ID);

CREATE TABLE dbo.FM14_Notes (
  ID          INT IDENTITY(1,1) PRIMARY KEY,
  ID_Master   INT NOT NULL REFERENCES dbo.QMS_Master(ID),
  GeneralNote NVARCHAR(MAX),
  CreatedAt   DATETIME2 DEFAULT GETDATE()
);
GO
CREATE INDEX IX_FM14_Notes_IDMaster ON dbo.FM14_Notes(ID_Master);

-- ============================================================
-- FM-15: CADD Request
-- ============================================================
CREATE TABLE dbo.FM15_CADDRequest (
  ID                             INT IDENTITY(1,1) PRIMARY KEY,
  ID_Master                      INT NOT NULL REFERENCES dbo.QMS_Master(ID),
  CADDRequestDescription         NVARCHAR(MAX),
  ClientLogoRequired             BIT NOT NULL DEFAULT 0,
  JointVentureTitleBlockRequired BIT NOT NULL DEFAULT 0,
  ClientLogoLocation             NVARCHAR(500),
  JointVentureTemplateLocation   NVARCHAR(500),
  AdoptClientStds                BIT NOT NULL DEFAULT 0,
  LocationOfStandards            NVARCHAR(500),
  ProjectCoOrdinateSystem        NVARCHAR(200),
  FurtherDetailsAndNotes         NVARCHAR(MAX),
  TotalCADDDrawingFigures        INT,
  BudgetedHours                  DECIMAL(10,2),
  DraftDueDate                   DATE,
  FinalDueDate                   DATE,
  CaddSoftwareToBeUsed           NVARCHAR(200),
  OutputFormatRequired           NVARCHAR(200),
  ModelsRequiredByClient         BIT NOT NULL DEFAULT 0,
  OutputFormatRequired_dwg       BIT NOT NULL DEFAULT 0,
  OutputFormatRequired_dxf       BIT NOT NULL DEFAULT 0,
  OutputFormatRequired_pdf       BIT NOT NULL DEFAULT 0,
  OutputFormatRequired_image     BIT NOT NULL DEFAULT 0,
  CreatedAt                      DATETIME2 DEFAULT GETDATE()
);
GO
CREATE INDEX IX_FM15_CADD_IDMaster ON dbo.FM15_CADDRequest(ID_Master);

CREATE TABLE dbo.FM15_DrawsFigs (
  ID             INT IDENTITY(1,1) PRIMARY KEY,
  FM15_ID        INT NOT NULL REFERENCES dbo.FM15_CADDRequest(ID),
  DrawFigNumber  NVARCHAR(200),
  DrawFigTitle   NVARCHAR(500),
  Scale          NVARCHAR(50),
  PageSize       NVARCHAR(50),
  EstimatedHours DECIMAL(10,2),
  ContentNotes   NVARCHAR(MAX),
  CreatedAt      DATETIME2 DEFAULT GETDATE()
);
GO
CREATE INDEX IX_FM15_DrawsFigs_FM15ID ON dbo.FM15_DrawsFigs(FM15_ID);

CREATE TABLE dbo.FM15_CADDDataLocation (
  ID           INT IDENTITY(1,1) PRIMARY KEY,
  FM15_ID      INT NOT NULL REFERENCES dbo.FM15_CADDRequest(ID),
  FileLocation NVARCHAR(500),
  FileName     NVARCHAR(300),
  Comments     NVARCHAR(MAX),
  CreatedAt    DATETIME2 DEFAULT GETDATE()
);
GO
CREATE INDEX IX_FM15_DataLoc_FM15ID ON dbo.FM15_CADDDataLocation(FM15_ID);

CREATE TABLE dbo.FM15_TitleBlockHeadings (
  ID              INT IDENTITY(1,1) PRIMARY KEY,
  FM15_ID         INT NOT NULL REFERENCES dbo.FM15_CADDRequest(ID),
  ClientNameRow1  NVARCHAR(300),
  ClientNameRow2  NVARCHAR(300),
  ProjectTitle    NVARCHAR(500),
  CreatedAt       DATETIME2 DEFAULT GETDATE()
);
GO
CREATE INDEX IX_FM15_TitleBlock_FM15ID ON dbo.FM15_TitleBlockHeadings(FM15_ID);

CREATE TABLE dbo.FM15_Notes (
  ID          INT IDENTITY(1,1) PRIMARY KEY,
  ID_Master   INT NOT NULL REFERENCES dbo.QMS_Master(ID),
  GeneralNote NVARCHAR(MAX),
  CreatedAt   DATETIME2 DEFAULT GETDATE()
);
GO
CREATE INDEX IX_FM15_Notes_IDMaster ON dbo.FM15_Notes(ID_Master);

-- ============================================================
-- FM-16: Document Review Register
-- ============================================================
CREATE TABLE dbo.FM16_DocumentReview (
  ID                                       INT IDENTITY(1,1) PRIMARY KEY,
  ID_Master                                INT NOT NULL REFERENCES dbo.QMS_Master(ID),
  DeliverableTitle                         NVARCHAR(500),
  ReviewItem                               NVARCHAR(500),
  DocumentNo                               NVARCHAR(200),
  SubmittedBy                              NVARCHAR(200),
  DateSubmitted                            DATE,
  ReviewType                               NVARCHAR(100),
  Review1                                  NVARCHAR(200),
  Review2                                  NVARCHAR(200),
  ReviewerSightedFinalDeliverable          NVARCHAR(200),
  SubmittedByEmail                         NVARCHAR(256),
  Review1Email                             NVARCHAR(256),
  Review1SignedDateTime                    DATETIME2,
  Review2Email                             NVARCHAR(256),
  Review2SignedDateTime                    DATETIME2,
  ReviewerSightedFinalDeliverableEmail     NVARCHAR(256),
  ReviewerSightedFinalDeliverableDateTime  DATETIME2,
  DocType                                  NVARCHAR(100),
  DocRev                                   NVARCHAR(50),
  ProposedAgreedDeliverableDate            DATE,
  ReviewerType                             NVARCHAR(100),
  ReviewerName                             NVARCHAR(200),
  ReviewerEmail                            NVARCHAR(256),
  ReviewDate                               DATE,
  NotApplicable                            BIT,
  Review1Comments                          NVARCHAR(MAX),
  Review2Comments                          NVARCHAR(MAX),
  CreatedBy                                NVARCHAR(200),
  ModifiedBy                               NVARCHAR(200),
  ModifiedAt                               DATETIME2,
  CreatedAt                                DATETIME2 DEFAULT GETDATE()
);
GO
CREATE INDEX IX_FM16_DocReview_IDMaster ON dbo.FM16_DocumentReview(ID_Master);

CREATE TABLE dbo.FM16_ReviewDocs (
  ID          INT IDENTITY(1,1) PRIMARY KEY,
  ID_Master   INT NOT NULL REFERENCES dbo.QMS_Master(ID),
  ID_FM16     INT NOT NULL REFERENCES dbo.FM16_DocumentReview(ID),
  Title       NVARCHAR(500),
  Attachments INT NOT NULL DEFAULT 0,
  ReviewDate  DATE,
  ModifiedAt  DATETIME2,
  CreatedAt   DATETIME2 DEFAULT GETDATE()
);
GO
CREATE INDEX IX_FM16_ReviewDocs_IDMaster ON dbo.FM16_ReviewDocs(ID_Master);
CREATE INDEX IX_FM16_ReviewDocs_FM16ID   ON dbo.FM16_ReviewDocs(ID_FM16);

CREATE TABLE dbo.FM16_Notes (
  ID          INT IDENTITY(1,1) PRIMARY KEY,
  ID_Master   INT NOT NULL REFERENCES dbo.QMS_Master(ID),
  GeneralNote NVARCHAR(MAX),
  CreatedAt   DATETIME2 DEFAULT GETDATE()
);
GO
CREATE INDEX IX_FM16_Notes_IDMaster ON dbo.FM16_Notes(ID_Master);

-- ============================================================
-- FM-17: Document Transmittal
-- ============================================================
CREATE TABLE dbo.FM17_Transmittal (
  ID                   INT IDENTITY(1,1) PRIMARY KEY,
  ID_Master            INT NOT NULL REFERENCES dbo.QMS_Master(ID),
  DocPackDescription   NVARCHAR(MAX),
  FromCompanyName      NVARCHAR(300),
  FromCompanyAddress   NVARCHAR(500),
  FromCompanyTel       NVARCHAR(50),
  FromCompanyEmail     NVARCHAR(256),
  Sender               NVARCHAR(200),
  ToCompanyName        NVARCHAR(300),
  ToCompanyAddress     NVARCHAR(500),
  Attention            NVARCHAR(200),
  ReasonForIssue       NVARCHAR(MAX),
  SentBy               NVARCHAR(200),
  CreatedAt            DATETIME2 DEFAULT GETDATE()
);
GO
CREATE INDEX IX_FM17_Trans_IDMaster ON dbo.FM17_Transmittal(ID_Master);

CREATE TABLE dbo.FM17_Documents (
  ID             INT IDENTITY(1,1) PRIMARY KEY,
  FM17_ID        INT NOT NULL REFERENCES dbo.FM17_Transmittal(ID),
  DateOfIssue    DATE,
  DocNum         NVARCHAR(200),
  DocNumber      NVARCHAR(200),
  RevNum         NVARCHAR(50),
  DocType        NVARCHAR(100),
  DocDescription NVARCHAR(MAX),
  CreatedAt      DATETIME2 DEFAULT GETDATE()
);
GO
CREATE INDEX IX_FM17_Docs_FM17ID ON dbo.FM17_Documents(FM17_ID);

CREATE TABLE dbo.FM17_Notes (
  ID          INT IDENTITY(1,1) PRIMARY KEY,
  ID_Master   INT NOT NULL REFERENCES dbo.QMS_Master(ID),
  GeneralNote NVARCHAR(MAX),
  CreatedAt   DATETIME2 DEFAULT GETDATE()
);
GO
CREATE INDEX IX_FM17_Notes_IDMaster ON dbo.FM17_Notes(ID_Master);

-- ============================================================
-- FM-18: Client Feedback
-- ============================================================
CREATE TABLE dbo.FM18_ClientFeedback (
  ID                 INT IDENTITY(1,1) PRIMARY KEY,
  ID_FM08            INT REFERENCES dbo.FM08_DocumentRegister(ID),
  ProjectDescription NVARCHAR(MAX),
  Attachments        INT NOT NULL DEFAULT 0,
  FeedbackReceived   BIT NOT NULL DEFAULT 0,
  CreatedAt          DATETIME2 DEFAULT GETDATE()
);
GO
CREATE INDEX IX_FM18_CF_FM08ID ON dbo.FM18_ClientFeedback(ID_FM08);

CREATE TABLE dbo.FM18_Uploads (
  ID          INT IDENTITY(1,1) PRIMARY KEY,
  ID_FM08     INT REFERENCES dbo.FM08_DocumentRegister(ID),
  Attachments INT NOT NULL DEFAULT 0,
  CreatedAt   DATETIME2 DEFAULT GETDATE()
);
GO
CREATE INDEX IX_FM18_Uploads_FM08ID ON dbo.FM18_Uploads(ID_FM08);

CREATE TABLE dbo.FM18_Notes (
  ID          INT IDENTITY(1,1) PRIMARY KEY,
  ID_Master   INT NOT NULL REFERENCES dbo.QMS_Master(ID),
  GeneralNote NVARCHAR(MAX),
  CreatedAt   DATETIME2 DEFAULT GETDATE()
);
GO
CREATE INDEX IX_FM18_Notes_IDMaster ON dbo.FM18_Notes(ID_Master);

-- ============================================================
-- FM-19: Project Closure
-- ============================================================
CREATE TABLE dbo.FM19_ProjectClosure (
  ID                            INT IDENTITY(1,1) PRIMARY KEY,
  ID_Master                     INT NOT NULL REFERENCES dbo.QMS_Master(ID),
  ProjectDescriptionForResume   NVARCHAR(MAX),
  HaveAllAgreed                 NVARCHAR(10),
  ClientComments                NVARCHAR(10),
  ProjectFinancials             NVARCHAR(10),
  ProjectFilesCompleted         NVARCHAR(10),
  InvoicedValue                 NVARCHAR(100),
  TotalCharges                  NVARCHAR(100),
  PositiveFeedback              NVARCHAR(MAX),
  NegativeFeedback              NVARCHAR(MAX),
  AreasForImprovement           NVARCHAR(MAX),
  ThirdPartyPerformance         NVARCHAR(MAX),
  SubmittedByEmail              NVARCHAR(256),
  SubmittedByName               NVARCHAR(200),
  SubmittedDateTime             DATETIME2,
  ActualProjectEndDate          DATE,
  ClosureType                   NVARCHAR(100),
  TechnicalCommunities          NVARCHAR(MAX),
  ClientComplaints              NVARCHAR(MAX),
  ProjectSuccessfulCaseStudy    NVARCHAR(MAX),
  ProjectUnSuccessfulOverview   NVARCHAR(MAX),
  PhotoAvailable                NVARCHAR(10),
  CreatedBy                     NVARCHAR(200),
  ModifiedBy                    NVARCHAR(200),
  ModifiedAt                    DATETIME2,
  CreatedAt                     DATETIME2 DEFAULT GETDATE()
);
GO
CREATE INDEX IX_FM19_Closure_IDMaster ON dbo.FM19_ProjectClosure(ID_Master);

CREATE TABLE dbo.FM19_Notes (
  ID          INT IDENTITY(1,1) PRIMARY KEY,
  ID_Master   INT NOT NULL REFERENCES dbo.QMS_Master(ID),
  GeneralNote NVARCHAR(MAX),
  CreatedAt   DATETIME2 DEFAULT GETDATE()
);
GO
CREATE INDEX IX_FM19_Notes_IDMaster ON dbo.FM19_Notes(ID_Master);

-- ─── STORED PROCEDURES ───────────────────────────────────────────────────────

-- Dashboard summary counts from QMS_Master
CREATE OR ALTER VIEW dbo.vw_DashboardSummary AS
SELECT
    COUNT(*)                                                          AS TotalOpportunities,
    SUM(CASE WHEN ProjectStatus = 0 THEN 1 ELSE 0 END)               AS ActiveOpportunities,
    SUM(CASE WHEN ProjectStatus = 1 THEN 1 ELSE 0 END)               AS ClosedOpportunities,
    SUM(CASE WHEN FM01A_ApprovalStatus = 'Pending' THEN 1 ELSE 0 END) AS PendingApprovals,
    SUM(CASE WHEN FM01B_ApprovalStatus = 'Pending' THEN 1 ELSE 0 END) AS PendingFM01B,
    COUNT(DISTINCT ID_Client)                                         AS UniqueClients,
    SUM(CASE WHEN FM01A_ApprovalStatus = 'Approved' THEN 1 ELSE 0 END) AS ApprovedOpportunities
FROM dbo.QMS_Master;
GO

-- Recent Opportunities (QMS_Master) paginated DESC by ID
CREATE OR ALTER PROCEDURE dbo.sp_GetRecentOpportunities
    @PageNumber INT = 1,
    @PageSize   INT = 10,
    @StatusFilter INT = NULL,
    @OfficeFilter NVARCHAR(100) = NULL,
    @SearchTerm NVARCHAR(200) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    SELECT
        m.ID,
        m.ProjectName,
        m.ProjectNumber,
        m.SubProjectName,
        m.SubProjectNumber,
        m.ProjectManagerName,
        m.SubProjectManagerName,
        m.OfficeForFormSubmission,
        m.FM01A_ApprovalStatus,
        m.FM01A_ApprovedBy,
        m.FM01A_ApprovedDate,
        m.FM01A_OM_ApprovalStatus,
        m.FM01B_ApprovalStatus,
        m.ProjectStatus,
        m.SiteName,
        m.SiteShortName,
        m.CreatedBy,
        m.CreatedAt,
        m.ModifiedAt,
        c.CompanyName AS ClientName,
        COUNT(*) OVER() AS TotalCount
    FROM dbo.QMS_Master m
    LEFT JOIN dbo.Clients c ON c.ID = m.ID_Client
    WHERE
        (@StatusFilter IS NULL OR m.ProjectStatus = @StatusFilter)
        AND (@OfficeFilter IS NULL OR m.OfficeForFormSubmission = @OfficeFilter)
        AND (@SearchTerm IS NULL
             OR m.ProjectName LIKE '%' + @SearchTerm + '%'
             OR m.ProjectNumber LIKE '%' + @SearchTerm + '%'
             OR m.ProjectManagerName LIKE '%' + @SearchTerm + '%')
    ORDER BY m.ID DESC
    OFFSET (@PageNumber - 1) * @PageSize ROWS
    FETCH NEXT @PageSize ROWS ONLY;
END;
GO

-- Pending Approvals paginated DESC by ID
CREATE OR ALTER PROCEDURE dbo.sp_GetPendingApprovals
    @PageNumber INT = 1,
    @PageSize   INT = 10
AS
BEGIN
    SET NOCOUNT ON;
    SELECT
        m.ID,
        m.ProjectName,
        m.ProjectNumber,
        m.SubProjectName,
        m.ProjectManagerName,
        m.OfficeForFormSubmission,
        m.FM01A_ApprovalStatus,
        m.FM01A_OM_ApprovalStatus,
        m.FM01B_ApprovalStatus,
        m.CreatedBy,
        m.CreatedAt,
        c.CompanyName AS ClientName,
        COUNT(*) OVER() AS TotalCount
    FROM dbo.QMS_Master m
    LEFT JOIN dbo.Clients c ON c.ID = m.ID_Client
    WHERE m.FM01A_ApprovalStatus = 'Pending'
       OR m.FM01B_ApprovalStatus = 'Pending'
    ORDER BY m.ID DESC
    OFFSET (@PageNumber - 1) * @PageSize ROWS
    FETCH NEXT @PageSize ROWS ONLY;
END;
GO

-- Clients paginated DESC by ID
CREATE OR ALTER PROCEDURE dbo.sp_GetClients
    @PageNumber INT = 1,
    @PageSize   INT = 10,
    @SearchTerm NVARCHAR(200) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    SELECT
        c.ID,
        c.CompanyName,
        c.CompanyABN,
        c.CompanyAddressLine1,
        c.CompanySuburb,
        c.CompanyState,
        c.CompanyPostCode,
        c.CompanyCountry,
        c.CompanyPhone,
        c.CompanyEmailAddress,
        c.CompanyWebSite,
        c.IsCritical,
        COUNT(cc.ID) AS ContactCount,
        COUNT(*) OVER() AS TotalCount
    FROM dbo.Clients c
    LEFT JOIN dbo.Client_Contacts cc ON cc.ClientID = c.ID
    WHERE (@SearchTerm IS NULL OR c.CompanyName LIKE '%' + @SearchTerm + '%')
    GROUP BY c.ID,c.CompanyName,c.CompanyABN,c.CompanyAddressLine1,c.CompanySuburb,c.CompanyState,c.CompanyPostCode,c.CompanyCountry,c.CompanyPhone,c.CompanyEmailAddress,c.CompanyWebSite,c.IsCritical
    ORDER BY c.ID DESC
    OFFSET (@PageNumber - 1) * @PageSize ROWS
    FETCH NEXT @PageSize ROWS ONLY;
END;
GO

-- QMS Site Names paginated DESC by ID
CREATE OR ALTER PROCEDURE dbo.sp_GetSiteNames
    @PageNumber INT = 1,
    @PageSize   INT = 10,
    @SearchTerm NVARCHAR(200) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    SELECT
        ID, Title, SiteName, SiteLocation,
        StreetLine1, [Site_Suburb_Town], SiteCountry,
        Site_PostCode, CreatedAt,
        COUNT(*) OVER() AS TotalCount
    FROM dbo.QMS_Site_Name
    WHERE (@SearchTerm IS NULL OR SiteName LIKE '%' + @SearchTerm + '%'
           OR Title LIKE '%' + @SearchTerm + '%')
    ORDER BY ID DESC
    OFFSET (@PageNumber - 1) * @PageSize ROWS
    FETCH NEXT @PageSize ROWS ONLY;
END;
GO

-- Create new opportunity (FM-01A)
CREATE OR ALTER PROCEDURE dbo.sp_CreateOpportunity
    @ProjectName                    NVARCHAR(500),
    @SubProjectName                 NVARCHAR(500) = NULL,
    @ID_Client                      INT = NULL,
    @CreatedBy                      NVARCHAR(200),
    @ProjectManagerName             NVARCHAR(200) = NULL,
    @SubProjectManagerName          NVARCHAR(200) = NULL,
    @OfficeForFormSubmission        NVARCHAR(100) = NULL,
    @SiteName                       NVARCHAR(300) = NULL,
    @SiteShortName                  NVARCHAR(50)  = NULL,
    -- FM01A fields
    @ScopeOfWork                    NVARCHAR(MAX) = NULL,
    @ProjectType                    NVARCHAR(300) = NULL,
    @CategoryList                   NVARCHAR(200) = NULL,
    @Commodity                      NVARCHAR(100) = NULL,
    @EstimatedProjectFeeValue       NVARCHAR(50)  = NULL,
    @ProbabilityOfSuccess           DECIMAL(5,2)  = NULL,
    @FeeType                        NVARCHAR(100) = NULL,
    @TaxRule                        NVARCHAR(100) = NULL,
    @InvoiceCurrency                NVARCHAR(100) = NULL,
    @LabTestingRequired             BIT           = NULL,
    @MechanicalDesignRequired       BIT           = NULL,
    @SiteWorkRequired               BIT           = NULL,
    @SeismicHazardIntegrityRequired BIT           = NULL,
    @ExistingClient                 BIT           = NULL,
    @ExistingSite                   BIT           = NULL,
    @TentativeProjectStartDate      DATETIME2     = NULL,
    @TentativeProjectEndDate        DATETIME2     = NULL,
    @SubmittedByName                NVARCHAR(200) = NULL,
    @SubmittedByEmail               NVARCHAR(256) = NULL,
    -- Gate Zero
    @GateZero_Q1 BIT = NULL, @GateZero_Q2 BIT = NULL, @GateZero_Q3 BIT = NULL,
    @GateZero_Q4 BIT = NULL, @GateZero_Q5 BIT = NULL, @GateZero_Q6 BIT = NULL,
    @GateZero_Q7 BIT = NULL, @GateZero_Q8 BIT = NULL,
    @GateZero_ApprovalBy NVARCHAR(200) = NULL,
    -- Contact
    @ContactName        NVARCHAR(200) = NULL,
    @ContactSalutation  NVARCHAR(20)  = NULL,
    @ContactPosition    NVARCHAR(300) = NULL,
    @ContactPhone       NVARCHAR(50)  = NULL,
    @ContactMobile      NVARCHAR(50)  = NULL,
    @ContactEmail       NVARCHAR(256) = NULL,
    @ATCLink            NVARCHAR(200) = NULL,
    @SourcedContactAt   NVARCHAR(300) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRANSACTION;

    -- Insert QMS_Master record
    INSERT INTO dbo.QMS_Master (
        ProjectName, SubProjectName, ID_Client, CreatedBy,
        ProjectManagerName, SubProjectManagerName, OfficeForFormSubmission,
        SiteName, SiteShortName, ProjectStatus,
        FM01A_ApprovalStatus, FM01B_ApprovalStatus,
        CreatedAt, ModifiedAt
    ) VALUES (
        @ProjectName, @SubProjectName, @ID_Client, @CreatedBy,
        @ProjectManagerName, @SubProjectManagerName, @OfficeForFormSubmission,
        @SiteName, @SiteShortName, 0,
        'Pending', 'Pending',
        GETUTCDATE(), GETUTCDATE()
    );

    DECLARE @MasterID INT = SCOPE_IDENTITY();

    -- Insert FM-01A form record
    INSERT INTO dbo.QMS_SY_QS_FM_01A (
        ID_Master, ProjectDescriptor, ScopeOfWork, ProjectType, CategoryList, Commodity,
        ExistingSite, SiteName, SiteShortName, ExistingClient, ClientID,
        EstimatedProjectFeeValue, ProbabilityOfSuccess, FeeType, TaxRule, InvoiceCurrency,
        OfficeForFormSubmission, LabTestingRequired, MechanicalDesignRequired,
        SiteWorkRequired, SeismicHazardIntegrityRequired,
        TentativeProjectStartDate, TentativeProjectEndDate,
        ProjectManager, SubProjectManager,
        GateZero_Q1,GateZero_Q2,GateZero_Q3,GateZero_Q4,
        GateZero_Q5,GateZero_Q6,GateZero_Q7,GateZero_Q8,
        GateZero_ApprovalBy,
        ContactName, ContactSalutation, ContactPosition,
        ContactPhone, ContactMobile, ContactEmail, ATCLink, SourcedContactAt,
        SubmittedByName, SubmittedByEmail, SubmittedDateTime,
        CreatedAt, ModifiedAt
    ) VALUES (
        @MasterID, @ProjectName, @ScopeOfWork, @ProjectType, @CategoryList, @Commodity,
        @ExistingSite, @SiteName, @SiteShortName, @ExistingClient, @ID_Client,
        @EstimatedProjectFeeValue, @ProbabilityOfSuccess, @FeeType, @TaxRule, @InvoiceCurrency,
        @OfficeForFormSubmission, @LabTestingRequired, @MechanicalDesignRequired,
        @SiteWorkRequired, @SeismicHazardIntegrityRequired,
        @TentativeProjectStartDate, @TentativeProjectEndDate,
        @ProjectManagerName, @SubProjectManagerName,
        @GateZero_Q1,@GateZero_Q2,@GateZero_Q3,@GateZero_Q4,
        @GateZero_Q5,@GateZero_Q6,@GateZero_Q7,@GateZero_Q8,
        @GateZero_ApprovalBy,
        @ContactName, @ContactSalutation, @ContactPosition,
        @ContactPhone, @ContactMobile, @ContactEmail, @ATCLink, @SourcedContactAt,
        @SubmittedByName, @SubmittedByEmail, GETUTCDATE(),
        GETUTCDATE(), GETUTCDATE()
    );

    COMMIT TRANSACTION;
    SELECT @MasterID AS NewMasterID, SCOPE_IDENTITY() AS NewFM01AID;
END;
GO

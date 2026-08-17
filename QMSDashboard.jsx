import { useState, useEffect, useCallback, useMemo, createContext, useContext } from "react";
import {
  LayoutDashboard, Briefcase, CheckSquare, AlertTriangle,
  Activity, Settings, LogOut, Menu, X, ChevronLeft, ChevronRight,
  Bell, RefreshCw, Filter, CheckCircle, XCircle, AlertCircle, Circle,
  TrendingUp, Users, FileText, Layers, Search, Plus, ArrowLeft,
  Building2, Phone, Mail, Globe, ChevronDown,
  MapPin
} from "lucide-react";
import { MOCK_OPPORTUNITIES } from './data/mockOpportunities.js';
import { MOCK_FM01A } from './data/mockFm01a.js';
import { MOCK_CLIENTS } from './data/mockClients.js';
import { MOCK_CLIENT_CONTACTS } from './data/mockClientContacts.js';
import { MOCK_SITES } from './data/mockSiteNames.js';

// Restore any user-submitted records from localStorage so they survive page refresh
(()=>{
  try {
    const opps  = JSON.parse(localStorage.getItem('qms_submitted_opps')  || '[]');
    const fm01a = JSON.parse(localStorage.getItem('qms_submitted_fm01a') || '[]');
    opps .sort((a,b)=>a.id-b.id).forEach(r=>{ if(!MOCK_OPPORTUNITIES.some(x=>x.id===r.id)) MOCK_OPPORTUNITIES.unshift(r); });
    fm01a.sort((a,b)=>a.id-b.id).forEach(r=>{ if(!MOCK_FM01A.some(x=>x.id===r.id))        MOCK_FM01A.unshift(r); });
  } catch(e){}
})();
// Sort all primary data arrays descending by ID so every table shows newest-first
MOCK_OPPORTUNITIES.sort((a,b)=>b.id-a.id);
MOCK_FM01A.sort((a,b)=>b.id-a.id);

// --- ATC Williams Brand (#AA1F2E from official SVG) ---------------------------
const ATC = {
  crimson:"#AA1F2E", crimsonDark:"#7A1520", crimsonPale:"#FAEBED",
  charcoal:"#1C1C1C", bg:"#F4F4F5", bgWhite:"#FFFFFF", border:"#E0E0E2",
  textDark:"#111111", textMid:"#4A4A4A", textMuted:"#767676",
  green:"#2A7A4F", greenLight:"#E5F3EC",
  blue:"#1D5EA8",  blueLight:"#E5EEF8",
  purple:"#5B3FC4",purpleLight:"#EEE9FB",
  amber:"#B35E00", amberLight:"#FEF3E2",
  slate:"#52606D", slateLight:"#EEF0F3",
};

// --- Reference data (mirrors DB dropdowns) ------------------------------------
const OFFICES = ["New South Wales","Queensland","Victoria","Western Australia","Sunshine Coast","Tasmania","Peru"];
const PROJECT_TYPES = ["TC1 Tailings Management","TC2 Resources Recovery","TC3 Landfill Engineering","TC4 Dam Break Modelling","TC5 Dams Engineering","TC6 Water Resources","TC7 Hydraulics & Structural Engineering","TC8 Hydrogeology","TC9 Materials Characterisation","TC10 Geotechnical Investigation","TC11 Slurry & Mechanical Eng","TC12 Construction Support & Management","TC13 Governance & Risks","TC14 Seismic Hazard","TC15 Engineer of Record","TC16 Ground Engineering","TC17 Numerical Modelling","TC18 Closure and Rehabilitation","TC19 CAD","TC20 Project Management","TC21 Geosynthetics"];
const CATEGORIES = ["Tailings Management","Tailings Infrastructure","Dam Surveillance/ Audit","Water Storage Dams","Site Water Management","Surface Water Management","Site Investigation","Environmental","Mine & Closure Rehabilitation","Slurry and Mechanical Engineering","Waste Management","Landfill Engineering","Laboratory Testing","Foundation","Slope Stability","Groundwater","Ground Improvement","Retaining Walls and Excavation support","Civil","Rheology Testing","Pavement","Legal","Other"];
const COMMODITIES = ["Iron Ore / Magnetite","Coal","Gold","Copper","Aluminium","Zinc","Mineral Sands","Lead","Silver","Lithium","Uranium","Nickel","Graphite","Tin","Diamond","Tungsten","Vanadium","Manganese","Phosphate","Other/Not Mining"];
const FEE_TYPES = ["Hourly / Cost Rate","Capped Rates","Fixed Fee","No Billing"];
const TAX_RULES = ["10% Tax Applicable","Tax Free","Peru - 18% IGV"];
const CURRENCIES = ["Australian Dollar (AUD)","US Dollar (USD)","Peruvian Sol (PEN)","Other (Please specify)"];
const STATUSES = ["Proposal","Active","Prospect","Non Billable"];
const GATE_ZERO_Q = [
  "Is this a strategic or well-known client with whom ATC Williams has prior experience and a strong working relationship, and who is not considered a \"difficult\" client?",
  "Does the client have a good payment history with ATC Williams, demonstrate financial stability, and have no outstanding debts with ATCW?",
  "Does the client have a consistent history of managing scope effectively, without frequent changes or uncontrolled scope creep leading to budget overruns?",
  "Does ATC Williams have the appropriate technical capability, experience, and resources to successfully deliver this project?",
  "Based on past projects with this client, is it likely that this project will be delivered within budget and without financial loss to ATC Williams?",
  "Does this project present an acceptable level of commercial risk for ATC Williams?",
  "Are all legal, regulatory, and contractual requirements clearly defined and free from risks that could expose ATC Williams to liability?",
  "Does the client or project have a strong HSEW record and present acceptable levels of risk to ATCW staff?",
];

// --- Mock data ----------------------------------------------------------------
const MOCK_SUMMARY = { totalOpportunities:3753, activeOpportunities:3200, closedOpportunities:553, pendingApprovals:142, pendingFM01B:38, uniqueClients:1230, approvedOpportunities:2800 };


const MOCK_PENDING = (()=>{ const p=MOCK_OPPORTUNITIES.filter(o=>o.projectStatus===0&&(o.fm01A_ApprovalStatus==="Pending"||o.fm01B_ApprovalStatus==="Pending")); return p.map(o=>({...o,totalCount:p.length})); })();

const generateChartData = () => Array.from({length:12},(_,i)=>{
  const d=new Date(2025,i,1);
  return { month:d.toLocaleDateString("en-AU",{month:"short",year:"2-digit"}), Approved:Math.floor(Math.random()*80)+20, Pending:Math.floor(Math.random()*40)+5, Closed:Math.floor(Math.random()*20) };
});


// --- Mock data for QMS Form pages --------------------------------------------
const DECISIONS = ["GO","NO GO","GO","GO","NO GO","GO"];
const CONTRACT_TYPES = ["Purchase Order Including Terms and Conditions","Consult Australia Contract","ATCW Standard Contract","Client Contract","NDA","Letter of Intent"];

import { MOCK_FM02 } from './data/mockFm02.js';
import { MOCK_FM03A } from './data/mockFm03a.js';
import { MOCK_FM04 } from './data/mockFm04.js';
const _PM_NAMES = [
  "Peter Reid","Nick Brown","Joel Eadie","Glen Burton","John Milsom","Mohsen Moogui",
  "Darren Pemberton","Gavin Reeves","Tony Marszalek","Makaela McGrath","Ellery Dunn",
  "Ralph Holding","Nicola Logan","Kim McNamara","Chris Taylor","Dylan Rubinstein",
];
const _REV_NAMES = [
  "Phillip Soden","Craig Noske","Mal Jones","Ralph Holding","Behrooz Ghahreman-Nejad",
  "Peter Reid","Allan Watson","Lee Rigley","Tony Marszalek","Nicola Logan",
  "Rowan Cossins","Camilla West","Gideon Steyl","Keith Seddon","Mark Dillon",
];
const _MC_REASONS = [
  "Requested by PM","Staff member has left","Resourcing decision","Great learning opportunity",
  "Wrong PM allocated at setup","In order to initiate project folder","Expertise match required",
  "Parental leave cover","Client request","Project scope change","Relocating overseas",
  "Requested by project director","Error corrected by admin",
];
import { MOCK_FM01A_MC } from './data/mockFm01aMC.js';
import { MOCK_FM01B } from './data/mockFm01b.js';
import { MOCK_FM01B_NOTES } from './data/mockFm01bNotes.js';
import { MOCK_FM01B_TASKS } from './data/mockFm01bTasks.js';
const _FM02_NOTES = [
  "New TSF in-pit facility detailed design","Invited to tender as 1 of 3",
  "Lab testing of samples retrieved during CPT investigation",
  "Site investigation for proposed development",
  "High level study to define possible solutions for tailings management",
  "Review of third party tender documents","Preliminary investigation report",
  "Proposal written within sub job - no new proposal required",
  "No design or drawings required","Proposal was incorrectly named",
  "Above ground Coal TSF - Greenfield Site in Bowen Basin",
  "Updated fee to include additional scope item","Costs on a Time and Expense basis",
];
import { MOCK_FM02_NOTES } from './data/mockFm02Notes.js';
const _FM03A_NOTES = [
  "In pit TSF cell with mining operations continuing downstream of embankment",
  "Above ground Coal TSF - reasonable to assume PAR >= 1",
  "No Proposal - straight to Active","Email to client - scope and price already agreed",
  "T&Cs same as June 2020 inspection","Proposal written and not reviewed before issue",
  "Initial SoW as Mechanical but Civil work also included",
  "ATCW is sub-consultant - Risk Category 3","Complete - all deliverables reviewed",
  "Feasibility study for different options to meet increased production plan",
  "Hand auger and DCP investigation","PFS proposal regarding the tailings chapter",
];
import { MOCK_FM03A_NOTES } from './data/mockFm03aNotes.js';
const _SCORES = [1,2,3,4,5];
import { MOCK_FM03B } from './data/mockFm03b.js';
const _FM03B_NOTES = [
  "Preliminary CCA","Project Review to be completed by Lis Boczek",
  "Dam 6 and CDAN will require RPEQ certification",
  "My reviewer for this project was Phil S","Ideally Nicola Logan to review",
  "Form completed to close completed project","Reviewer to be Scott McDonald",
  "Chris Taylor to review","Project put on hold","Lis reviewed final deliverable",
  "Tony Marszalek to review please","Please assign Mark Dillon as reviewer",
  "Mal Jones reviewer","Ralph to Review - External Peer Review also",
  "This is for Moranbah - please make Lis the Reviewer",
];
import { MOCK_FM03B_NOTES } from './data/mockFm03bNotes.js';
const _FM04_NOTES = [
  "Doc No should be 120020.02P01 not 120020.01P01",
  "Rev B issued to include additional client required information",
  "Document reference incorrect - ignore",
  "Proposal included as part of another proposal",
  "Updated fee to include cable location work $12,800 (plus GST)",
  "Sediment basin design","PO terms and conditions available on client website",
  "Costs are on a Time and Expense Basis - Hourly Rates Quoted",
  "Written acceptance provided via Email","No design or drawings required",
];
import { MOCK_FM04_NOTES } from './data/mockFm04Notes.js';
const _DOC_NOS = [
  "120020.02P01","108028.30-P01Rev1","120155P01","110762.27P01","115275.15P03",
  "Email to client","260123P01Rev1","Report RevA","Drawing Set 01","260456P02",
  "Assessment Rev1","120890P01Final","Tech Memo RevB","Study Report","PO-60004817",
];
const _DOC_TYPES = ["Technical Report","Drawing","Memo","Email","Specification","Assessment"];
import { MOCK_FM04_REVIEWERS } from './data/mockFm04Reviewers.js';
const _TITLES = ["Rev1","Rev2","Rev3","RevA","RevB","RevFinal","Draft","Issue 1","Issue 2","Final"];
import { MOCK_FM04_REVDOCS } from './data/mockFm04RevDocs.js';
import { MOCK_FM05_REVIEW } from './data/mockFm05Review.js';
import { MOCK_FM05_NOTES }  from './data/mockFm05Notes.js';
import { MOCK_FM05_SCOPE }  from './data/mockFm05Scope.js';
const MOCK_FM06_PLAN=Array.from({length:40},(_,i)=>({id:i+1,idMaster:200+i,proposal:`120${200+i}.01P01`,writtenAcceptance:"Yes",awardDate:`2024-0${(i%9)+1}-01`,isSubmitted:i%4!==0,pm:"Genevieve New",reviewer:"Behrooz GN",director:"Tony Marszalek"}));
const MOCK_FM06_NOTES=Array.from({length:55},(_,i)=>({id:i+1,idMaster:200+i,generalNote:["As per proposal","Site work not required","Project plan complete","Subproject manager changed","No BoD required"][i%5]}));
const MOCK_FM06_MILESTONES=Array.from({length:80},(_,i)=>({id:i+1,idMaster:200+Math.floor(i/3),milestone:["Draft Report","Final Report","Site Visit","Client Review","Design Complete"][i%5],endDate:`202${4+Math.floor(i/30)}-0${(i%9)+1}-28`}));
const MOCK_FM06_CATEGORIES=Array.from({length:44},(_,i)=>({id:i+1,category:["Civil and Water","Geotechnical","Dams and Water","Hydrogeology","Tailings","Mine Site Closure","Rheology and Slurry"][i%7],subCategory:["Hydraulics","Slope Stability","Surveillance","Seepage","Storage Design","Covers and Capping","Slurry Transport; Pipelines"][i%7]}));
const MOCK_FM06_DELIVERABLES=Array.from({length:70},(_,i)=>({id:i+1,idMaster:200+Math.floor(i/2),itemNo:`${i+1}`,docType:["Report","Letter","Memo","Drawing","Specification"][i%5],description:["Design Report","Geotechnical Investigation","Site Visit Report","Technical Memo","Specification Document"][i%5],deliverableDate:`2024-0${(i%9)+1}-28`,createdBy:"Genevieve New"}));
const MOCK_FM06_EXTRESOURCES=Array.from({length:30},(_,i)=>({id:i+1,idMaster:200+i,name:["GeoLab","DrillCo Pty Ltd","Western Geotechnical","Probedrill","ALS"][i%5],criteria:"Previous complete delivery",scope:["Laboratory Testing","Drilling","CPT Probing","Field Survey","Chemical Analysis"][i%5],contractType:["Purchase Order","Letter / Email Acceptance","Purchase Order","Purchase Order","Letter / Email Acceptance"][i%5],responsiblePerson:"Alex Van Koersveld",responsibleEmail:"AlexV@atcwilliams.com.au"}));
// FM-07 mock data
const MOCK_FM07_MAIN=Array.from({length:40},(_,i)=>({id:i+1,idMaster:300+i,isSubmitted:i%4!==0,pm:"Genevieve New",pmEmail:"GenevieveN@atcwilliams.com.au",reviewer:"Behrooz GN",reviewerEmail:"BehroozG@atcwilliams.com.au",director:"Tony Marszalek",pmDT:`2024-0${(i%9)+1}-15`,reviewerDT:`2024-0${(i%9)+1}-20`}));
const MOCK_FM07_SID=Array.from({length:50},(_,i)=>({id:i+1,idMaster:300+Math.floor(i/2),hazard:["Dam overtopping","Slope failure","Piping","Liquefaction","Internal erosion"][i%5],consequence:["Tailings spill","Embankment failure","Environmental impact","Worker injury","Dam breach"][i%5],likelihoodBefore:(i%5)+1,consequenceBefore:(i%5)+1,riskOwner:["Client","ATCW","Site Operator","Contractor","Designer"][i%5],riskReviewDate:`2024-0${(i%9)+1}-01`,mitigation:"Design review and QA/QC",likelihoodAfter:Math.max(1,(i%5)-1),consequenceAfter:(i%5)+1,anticipatedMeasure:"QA/QC testing"}));
const MOCK_FM07_NOTES=Array.from({length:50},(_,i)=>({id:i+1,idMaster:300+i,generalNote:["Not applicable - no design work","SID included in design report","Safety in Design completed as deliverable","NA - no engineering design","SID not required for this scope"][i%5]}));
// FM-08 mock data
const MOCK_FM08_DOCS=Array.from({length:60},(_,i)=>({id:i+1,idMaster:400+Math.floor(i/2),docNumber:`${120000+i}.R0${(i%3)+1}`,docType:["Report","Letter","Memo","Drawing","Specification"][i%5],docRevision:`${i%4}`,docTitle:["Geotechnical Investigation Report","Design Report","Technical Memo","Construction Drawings","Technical Specification"][i%5],dateIssued:`2024-0${(i%9)+1}-15`,proposedDate:`2024-0${(i%9)+1}-10`}));
const MOCK_FM08_NOTES=Array.from({length:45},(_,i)=>({id:i+1,idMaster:400+i,generalNote:["Not Applicable","Documents reviewed and issued","NA - Single document","Refer project folder","Document register up to date"][i%5]}));
// FM-09 mock data
const MOCK_FM09_DRAWINGS=Array.from({length:60},(_,i)=>({id:i+1,idMaster:500+Math.floor(i/3),type:i%3===0?"Drawing":"Figure",number:`${115000+i}-${String(i).padStart(3,"0")}`,title:["General Arrangement","Site Layout","Embankment Sections","Foundation Plan","Spillway Details"][i%5],revision:["0","A","1","B","2"][i%5],dateIssued:`2024-0${(i%9)+1}-15`}));
const MOCK_FM09_NOTES=Array.from({length:50},(_,i)=>({id:i+1,idMaster:500+i,generalNote:["Not applicable - no design work","Drawings issued as part of report","NA - Inspections only","Drawing register saved on file","Not applicable - drawing within reports"][i%5]}));
// FM-10 mock data
const MOCK_FM10_MATRIX=Array.from({length:50},(_,i)=>({id:i+1,idMaster:600+i,isSubmitted:i%3!==0,commsProDir:["W","S","N/A","W/S",""][i%5],commsProMan:["W/S","W","S","N/A","W"][i%5],variationsProDir:["W","N/A","W/S","S",""][i%5],variationsProMan:["W/S","W","N/A","S","W"][i%5],generalProDir:["W","S","W/S","N/A",""][i%5],generalProMan:["W/S","W","S","N/A","W"][i%5]}));
const MOCK_FM10_NOTES=Array.from({length:45},(_,i)=>({id:i+1,idMaster:600+i,generalNote:["Not applicable","Communication matrix not required","N/A","Not required by client","Communication protocols not required for this project"][i%5]}));
// FM-11 mock data
const MOCK_FM11_CHANGE=Array.from({length:40},(_,i)=>({id:i+1,idMaster:700+i,communicationType:["Email","Letter","Verbal","Formal Notice","Site Instruction"][i%5],identificationNumber:`CR-${String(i+1).padStart(3,"0")}`,description:["Scope change for additional investigations","Design revision required by client","Additional reporting deliverable","Variation to construction methodology","Change in key personnel"][i%5],initiationDate:`2024-0${(i%9)+1}-10`,impact:["Low","Medium","High","Critical","Low"][i%5],approvedDate:`2024-0${(i%9)+1}-20`,value:5000+i*1500}));
const MOCK_FM11_COSTITEM=Array.from({length:60},(_,i)=>({id:i+1,fm11Id:i%40+1,costType:["Labour","Equipment","Materials","Subcontract","Other"][i%5],role:["Engineer","Senior Engineer","Graduate","Technician","Project Manager"][i%5],staffLevel:["L1","L2","L3","L4","L5"][i%5],estimatedHours:8+i%40,ratePerHour:150+(i%10)*10,total:(8+i%40)*(150+(i%10)*10)}));
const MOCK_FM11_NOTES=Array.from({length:30},(_,i)=>({id:i+1,idMaster:700+i,generalNote:["Change register updated","No changes this period","Scope change approved by client","Change request pending approval","No changes required for this project"][i%5]}));
// FM-12 mock data
const MOCK_FM12_CHANGE=Array.from({length:35},(_,i)=>({id:i+1,idMaster:800+i,communicationType:["Email","Formal Notice","Letter","Verbal","Site Instruction"][i%5],identificationNumber:`SCR-${String(i+1).padStart(3,"0")}`,description:["Scope reduction agreed with client","Additional site investigations required","Change to deliverable format","Revised submission timeline","Additional stakeholder engagement"][i%5],initiationDate:`2024-0${(i%9)+1}-05`,impact:["Low","Medium","High","Medium","Low"][i%5],approvedDate:`2024-0${(i%9)+1}-18`,value:3000+i*1200}));
const MOCK_FM12_NOTES=Array.from({length:25},(_,i)=>({id:i+1,idMaster:800+i,generalNote:["Scope change register updated","No scope changes this reporting period","Scope change approved","Scope change pending","Not applicable for this project"][i%5]}));
// FM-13 mock data
const MOCK_FM13_BOD=Array.from({length:45},(_,i)=>({id:i+1,idMaster:900+i,attachments:i%2===0}));
const MOCK_FM13_TEMPLATE=Array.from({length:15},(_,i)=>({id:i+1,title:["Geotechnical Investigation Report","Dam Safety Inspection Report","Tailings Storage Facility Design Report","Water Balance Report","Site Characterisation Report","Groundwater Monitoring Report","Geochemistry Report","Environmental Risk Assessment","Slope Stability Analysis","Foundation Design Report","Landfill Design Report","Seepage Analysis Report","Flood Modelling Report","Construction Report","Closure Plan"][i%15],attachments:i%3}));
const MOCK_FM13_NOTES=Array.from({length:30},(_,i)=>({id:i+1,idMaster:900+i,generalNote:["Basis of Design completed","BoD not required for this project type","BoD approved by client","BoD under review","NA – inspection only"][i%5]}));
// FM-14 mock data
const MOCK_FM14_WPP=Array.from({length:40},(_,i)=>({id:i+1,idMaster:1000+i,workPackageDescription:["Geotechnical Investigation Works","Detailed Design Package","Construction Support","Environmental Monitoring Program","Report Preparation and Review"][i%5],deliverables:["Investigation Report","Design Drawings and Report","Construction Notes","Monitoring Report","Technical Report"][i%5],verificationRequirements:["Peer Review","Internal QA Review","Client Review","Regulatory Review","Design Check"][i%5],dateAssigned:`2024-0${(i%9)+1}-01`,dateRequired:`2024-0${(i%9)+1}-28`}));
const MOCK_FM14_TASKS=Array.from({length:80},(_,i)=>({id:i+1,fm14Id:i%40+1,tasksNo:`T${String(i+1).padStart(2,"0")}`,tasksDescription:["Site investigation fieldwork","Sample collection and logging","Laboratory testing coordination","Data analysis and interpretation","Report writing and review"][i%5],personHours:8+i%32,costPHour:150+(i%8)*15}));
const MOCK_FM14_NOTES=Array.from({length:30},(_,i)=>({id:i+1,idMaster:1000+i,generalNote:["Work package plan completed","WPP not required","WPP approved by director","Work package under review","Not applicable – single deliverable"][i%5]}));
// FM-15 mock data
const MOCK_FM15_CADD=Array.from({length:35},(_,i)=>({id:i+1,idMaster:1100+i,caddDescription:["Embankment cross-section drawings","General arrangement plan","Site layout plan","Instrumentation layout","Foundation plan"][i%5],clientLogoRequired:i%3===0,totalDrawings:5+i%20,budgetedHours:40+i%80,draftDueDate:`2024-0${(i%9)+1}-15`,finalDueDate:`2024-0${(i%9)+1}-28`,software:["AutoCAD Civil 3D","AutoCAD","Revit","Civil 3D","AutoCAD"][i%5],dwg:i%2===0,pdf:true,dxf:i%3===0}));
const MOCK_FM15_DRAWSFIGS=Array.from({length:70},(_,i)=>({id:i+1,fm15Id:i%35+1,drawFigNumber:`${115000+i}-${String(i+1).padStart(3,"0")}`,title:["General Arrangement","Cross Section A-A","Plan View","Embankment Detail","Instrumentation Layout"][i%5],scale:["1:500","1:1000","1:250","1:100","1:2000"][i%5],pageSize:["A1","A2","A3","A0","A1"][i%5],estimatedHours:8+i%24}));
const MOCK_FM15_DATALOC=Array.from({length:40},(_,i)=>({id:i+1,fm15Id:i%35+1,fileLocation:`S:\\Projects\\${115000+i}\\04 CADD`,fileName:`${115000+i}-DWG-${String(i+1).padStart(3,"0")}.dwg`,comments:["Current working file","Issued for review","Final version","Archive copy","Working copy"][i%5]}));
const MOCK_FM15_TITLEBLOCK=Array.from({length:35},(_,i)=>({id:i+1,fm15Id:i+1,clientNameRow1:["BHP","Rio Tinto","Newmont","Glencore","Anglo American"][i%5],clientNameRow2:["Mining Division","Operations","Gold Division","Copper Division","Coal Division"][i%5],projectTitle:["TSF Stage 10 Construction","Dam Safety Inspection 2024","Closure Design Report","Water Balance Study","Geotechnical Investigation"][i%5]}));
const MOCK_FM15_NOTES=Array.from({length:25},(_,i)=>({id:i+1,idMaster:1100+i,generalNote:["CADD request completed","No drawings required for this project","CADD deliverables issued","Drawing review in progress","Not applicable"][i%5]}));
// FM-16 mock data
const MOCK_FM16_REVIEW=Array.from({length:60},(_,i)=>({id:i+1,idMaster:1200+Math.floor(i/2),deliverableTitle:["Geotechnical Investigation Report","Dam Safety Inspection Report","Design Report","Technical Memorandum","Construction Report"][i%5],documentNo:`${118000+i}.R0${i%3+1}`,submittedBy:["Genevieve New","Peter Reid","Alex Arroyo","Behrooz GN","Tony Marszalek"][i%5],dateSubmitted:`2024-0${(i%9)+1}-10`,reviewType:["Electronic","Hard Copy","Electronic","Electronic","Hard Copy"][i%5],review1:["Peter Reid","Behrooz GN","Tony Marszalek","Alex Arroyo","Genevieve New"][i%5],review2:i%3===0?["Tony Marszalek","Peter Reid","Genevieve New"][i%3]:"",docType:["Report","Memorandum","Drawing","Letter","Specification"][i%5],docRev:["0","A","1","B","Rev0"][i%5],reviewDate:`2024-0${(i%9)+1}-15`}));
const MOCK_FM16_REVDOCS=Array.from({length:80},(_,i)=>({id:i+1,idMaster:1200+Math.floor(i/3),fm16Id:i%60+1,title:["RevFinal","Rev1","Rev2","RevA","RevB"][i%5],attachments:i%2,reviewDate:`2024-0${(i%9)+1}-20`}));
const MOCK_FM16_NOTES=Array.from({length:50},(_,i)=>({id:i+1,idMaster:1200+i,generalNote:["Document review completed","Review not required for this project","FM-16 approved","Review in progress","NA – inspection services only"][i%5]}));
// FM-17 mock data
const MOCK_FM17_TRANS=Array.from({length:40},(_,i)=>({id:i+1,idMaster:1300+i,docPackDescription:["Final Report Issue","Drawings Issue for Construction","IFC Documents","Draft Report for Review","Certification Documents"][i%5],fromCompany:"ATC Williams",sender:["Genevieve New","Peter Reid","Alex Arroyo","Behrooz GN","Tony Marszalek"][i%5],toCompany:["BHP","Rio Tinto","Newmont","Glencore","Anglo American"][i%5],attention:["John Smith","Sarah Jones","Michael Chen","Lisa Brown","David Wilson"][i%5],reasonForIssue:["For Information","For Approval","For Construction","For Review","For Record"][i%5],sentBy:["iTransfer","Email","Hard Copy","Email","iTransfer"][i%5]}));
const MOCK_FM17_DOCS=Array.from({length:80},(_,i)=>({id:i+1,fm17Id:i%40+1,dateOfIssue:`2024-0${(i%9)+1}-15`,docNumber:`${118000+i}.R0${i%3+1}`,revNum:["0","A","1","B","2"][i%5],docType:["Report","Letter","Memorandum","Drawing","Specification"][i%5],docDescription:["Final Geotechnical Investigation Report","Dam Safety Inspection Letter","Technical Memorandum","Construction Drawings","Technical Specification"][i%5]}));
const MOCK_FM17_NOTES=Array.from({length:35},(_,i)=>({id:i+1,idMaster:1300+i,generalNote:["Transmittal not required – email only","Documents transmitted via iTransfer","Transmittal record saved on file","NA – no hard copies issued","Sent electronically"][i%5]}));
// FM-18 mock data
const MOCK_FM18_CF=Array.from({length:30},(_,i)=>({id:i+1,fm08Id:400+i,projectDescription:["Geotechnical investigation for proposed development","Dam safety inspection and reporting","TSF design and construction support","Groundwater monitoring program","Slope stability assessment"][i%5],attachments:i%2,feedbackReceived:i%3!==0,created:`2024-0${(i%9)+1}-20`}));
const MOCK_FM18_UPLOADS=Array.from({length:25},(_,i)=>({id:i+1,fm08Id:400+i,attachments:i%3}));
const MOCK_FM18_NOTES=Array.from({length:25},(_,i)=>({id:i+1,idMaster:1400+i,generalNote:["Client feedback received and positive","Not applicable – no standalone deliverable","Feedback not sent","NA – inspection services only","Client satisfied with outcomes"][i%5]}));
// FM-19 mock data
const MOCK_FM19_CLOSURE=Array.from({length:50},(_,i)=>({id:i+1,idMaster:1500+i,projectDescription:["Geotechnical investigation completed on time and under budget","Dam safety inspection and annual surveillance report","TSF design and construction support services","Groundwater monitoring and reporting","Slope stability analysis and detailed design"][i%5],haveAllAgreed:"Yes",clientComments:"No",projectFinancials:"Yes",projectFilesCompleted:"Yes",invoicedValue:`$${(45000+i*2000).toLocaleString()}`,totalCharges:`$${(44000+i*2000).toLocaleString()}`,submittedBy:["Genevieve New","Peter Reid","Alex Arroyo","Behrooz GN","Tony Marszalek"][i%5],actualEndDate:`2024-0${(i%9)+1}-28`,closureType:["Completed","Unsuccessful","Completed","Completed","Unsuccessful"][i%5]}));
const MOCK_FM19_NOTES=Array.from({length:50},(_,i)=>({id:i+1,idMaster:1500+i,generalNote:["Project completed successfully and closed","Proposal unsuccessful – project lost","Project complete, final invoice issued","Project terminated by client","Successful project – client very satisfied"][i%5]}));

const NAV_ITEMS = [
  {id:"dashboard",     label:"Dashboard",        icon:LayoutDashboard},
  {id:"qmsmaster",     label:"QMS Master",       icon:Layers},
  {id:"clientcontacts",label:"Client Contacts",  icon:Users},
  {id:"clients",       label:"Clients",          icon:Building2},
  {id:"sites",         label:"QMS Site Names",   icon:MapPin},
];
const QMS_FORM_GROUPS = [
  {
    id:"grp-fm01", label:"QMS SY-QS-FM-01",
    items:[
      {id:"fm01a",       label:"SY-QS-FM-01A",            desc:"Opportunity Initiation"},
      {id:"fm01a-mc",    label:"FM-01A Manager Changes",   desc:"Manager Change Requests"},
      {id:"fm01b",       label:"SY-QS-FM-01B",             desc:"Contract Award"},
      {id:"fm01b-notes", label:"FM-01B Notes",             desc:"Activation Notes"},
      {id:"fm01b-tasks", label:"FM-01B Tasks and Budget",  desc:"Tasks & Budget"},
    ],
  },
  {
    id:"grp-fm02", label:"QMS SY-QS-FM-02",
    items:[
      {id:"fm02",        label:"SY-QS-FM-02",   desc:"Proposal Assessment"},
      {id:"fm02-notes",  label:"FM-02 Notes",   desc:"Proposal Notes"},
    ],
  },
  {
    id:"grp-fm03", label:"QMS SY-QS-FM-03",
    items:[
      {id:"fm03a",       label:"SY-QS-FM-03A",  desc:"Risk Assessment"},
      {id:"fm03a-notes", label:"FM-03A Notes",  desc:"Risk Assessment Notes"},
      {id:"fm03b",       label:"SY-QS-FM-03B",  desc:"Project Risk Review"},
      {id:"fm03b-notes", label:"FM-03B Notes",  desc:"Risk Review Notes"},
    ],
  },
  {
    id:"grp-fm04", label:"QMS SY-QS-FM-04",
    items:[
      {id:"fm04",           label:"SY-QS-FM-04",          desc:"Contract Review"},
      {id:"fm04-notes",     label:"FM-04 Notes",          desc:"Contract Review Notes"},
      {id:"fm04-reviewers", label:"FM-04 Reviewers",      desc:"Document Reviewers"},
      {id:"fm04-revdocs",   label:"FM-04 Reviewers Docs", desc:"Reviewer Documents"},
    ],
  },
  {
    id:"grp-fm05", label:"QMS SY-QS-FM-05",
    items:[
      {id:"fm05",       label:"SY-QS-FM-05",              desc:"Project Review Plan"},
      {id:"fm05-notes", label:"FM-05 Notes",               desc:"Project Review Plan Notes"},
      {id:"fm05-scope", label:"FM-05 Scope of Work Items", desc:"Scope of Work Items"},
    ],
  },
  {
    id:"grp-fm06", label:"QMS SY-QS-FM-06",
    items:[
      {id:"fm06",           label:"SY-QS-FM-06",             desc:"Project Plan"},
      {id:"fm06-notes",     label:"FM-06 Notes",             desc:"Project Plan Notes"},
      {id:"fm06-milestones",label:"FM-06 Critical Milestones",desc:"Schedule & Milestones"},
      {id:"fm06-categories",label:"FM-06 Categories",        desc:"Category Reference Table"},
      {id:"fm06-deliverables",label:"FM-06 Key Deliverables",desc:"Project Deliverables"},
      {id:"fm06-extresources",label:"FM-06 External Resources",desc:"Third-Party Suppliers"},
    ],
  },
  {
    id:"grp-fm07", label:"QMS SY-QS-FM-07",
    items:[
      {id:"fm07",          label:"SY-QS-FM-07",  desc:"Safety in Design"},
      {id:"fm07-main",     label:"FM-07 Main",   desc:"SID Signature Record"},
      {id:"fm07-notes",    label:"FM-07 Notes",  desc:"Safety in Design Notes"},
    ],
  },
  {
    id:"grp-fm08", label:"QMS SY-QS-FM-08",
    items:[
      {id:"fm08",       label:"SY-QS-FM-08",  desc:"Document Register"},
      {id:"fm08-notes", label:"FM-08 Notes",  desc:"Document Register Notes"},
    ],
  },
  {
    id:"grp-fm09", label:"QMS SY-QS-FM-09",
    items:[
      {id:"fm09",       label:"SY-QS-FM-09",  desc:"Drawing Register"},
      {id:"fm09-notes", label:"FM-09 Notes",  desc:"Drawing Register Notes"},
    ],
  },
  {
    id:"grp-fm10", label:"QMS SY-QS-FM-10",
    items:[
      {id:"fm10",       label:"SY-QS-FM-10",  desc:"Communications Matrix"},
      {id:"fm10-notes", label:"FM-10 Notes",  desc:"Comms Matrix Notes"},
    ],
  },
  {
    id:"grp-fm11", label:"QMS SY-QS-FM-11",
    items:[
      {id:"fm11",           label:"SY-QS-FM-11",       desc:"Change Register"},
      {id:"fm11-costItems", label:"FM-11 Cost Items",   desc:"Estimated Cost Items"},
      {id:"fm11-notes",     label:"FM-11 Notes",        desc:"Change Register Notes"},
    ],
  },
  {
    id:"grp-fm12", label:"QMS SY-QS-FM-12",
    items:[
      {id:"fm12",       label:"SY-QS-FM-12",  desc:"Scope Change Register"},
      {id:"fm12-notes", label:"FM-12 Notes",  desc:"Scope Change Notes"},
    ],
  },
  {
    id:"grp-fm13", label:"QMS SY-QS-FM-13",
    items:[
      {id:"fm13",          label:"SY-QS-FM-13",        desc:"Basis of Design"},
      {id:"fm13-template", label:"FM-13 Template File", desc:"Template Files"},
      {id:"fm13-notes",    label:"FM-13 Notes",         desc:"Basis of Design Notes"},
    ],
  },
  {
    id:"grp-fm14", label:"QMS SY-QS-FM-14",
    items:[
      {id:"fm14",       label:"SY-QS-FM-14",  desc:"Work Package Plan"},
      {id:"fm14-tasks", label:"FM-14 Tasks",  desc:"Work Package Tasks"},
      {id:"fm14-notes", label:"FM-14 Notes",  desc:"Work Package Notes"},
    ],
  },
  {
    id:"grp-fm15", label:"QMS SY-QS-FM-15",
    items:[
      {id:"fm15",            label:"SY-QS-FM-15",            desc:"CADD Request"},
      {id:"fm15-drawsFigs",  label:"FM-15 Drawings/Figs",    desc:"Drawings & Figures"},
      {id:"fm15-dataLoc",    label:"FM-15 CADD Data Loc",    desc:"CADD Data Locations"},
      {id:"fm15-titleBlock", label:"FM-15 Title Block",       desc:"Title Block Headings"},
      {id:"fm15-notes",      label:"FM-15 Notes",             desc:"CADD Request Notes"},
    ],
  },
  {
    id:"grp-fm16", label:"QMS SY-QS-FM-16",
    items:[
      {id:"fm16",           label:"SY-QS-FM-16",        desc:"Document Review Register"},
      {id:"fm16-reviewDocs",label:"FM-16 Review Docs",  desc:"Review Documents"},
      {id:"fm16-notes",     label:"FM-16 Notes",        desc:"Document Review Notes"},
    ],
  },
  {
    id:"grp-fm17", label:"QMS SY-QS-FM-17",
    items:[
      {id:"fm17",       label:"SY-QS-FM-17",      desc:"Document Transmittal"},
      {id:"fm17-docs",  label:"FM-17 Documents",  desc:"Transmitted Documents"},
      {id:"fm17-notes", label:"FM-17 Notes",       desc:"Transmittal Notes"},
    ],
  },
  {
    id:"grp-fm18", label:"QMS SY-QS-FM-18",
    items:[
      {id:"fm18",         label:"SY-QS-FM-18",      desc:"Client Feedback"},
      {id:"fm18-uploads", label:"FM-18 Uploads",    desc:"Feedback Uploads"},
      {id:"fm18-notes",   label:"FM-18 Notes",      desc:"Client Feedback Notes"},
    ],
  },
  {
    id:"grp-fm19", label:"QMS SY-QS-FM-19",
    items:[
      {id:"fm19",       label:"SY-QS-FM-19",  desc:"Project Closure"},
      {id:"fm19-notes", label:"FM-19 Notes",  desc:"Closure Notes"},
    ],
  },
];
// Flat list derived from groups — used for fallback label lookups and active checks
const QMS_FORMS = QMS_FORM_GROUPS.flatMap(g=>g.items);
const PAGE_SIZE = 20;
const ATC_STATUS = { Approved:{bg:ATC.greenLight,text:ATC.green,dot:ATC.green}, Pending:{bg:ATC.amberLight,text:ATC.amber,dot:ATC.amber}, Rejected:{bg:ATC.crimsonPale,text:ATC.crimsonDark,dot:ATC.crimson} };

// --- Official ATC Williams SVG Logo (verbatim from ATC-Williams-Logo-01.svg) --
function ATCLogo({width=180,dark=false}) {
  const H=Math.round(width*(101.701/283.465));
  const tc=dark?"#FFFFFF":"#111111", sc=dark?"rgba(255,255,255,0.65)":"#3A3A3A";
  return (
    <svg width={width} height={H} viewBox="0 0 283.465 101.701" fill="none" xmlns="http://www.w3.org/2000/svg" style={{display:"block"}}>
      <polygon points="75.778 18.602 57.959 36.252 16.887 42.14 25.226 21.338 48.868 17.953 65.818 1.159 75.778 18.602" fill="#AA1F2E"/>
      <polygon points="97.696 56.95 77.879 90.863 11.285 100.408 .949 82.317 76.453 71.488 95.322 52.813 97.696 56.95" fill="#AA1F2E"/>
      <polygon points="90.525 44.409 71.747 63.019 4.659 72.643 12.998 51.841 62.655 44.721 80.552 26.992 80.98 27.68 90.525 44.409" fill="#AA1F2E"/>
      <path d="M149.207,22.298l-.259-.078-6.575,21.892h13.41l-6.575-21.814Zm14.019,44.094l-3.113-9.26h-22.241l-3.346,9.26h-17.599L142.631,2.365h12.891l25.432,64.027h-17.728Z" fill={tc}/>
      <polygon points="187.414 66.392 187.414 16.722 173.148 16.722 173.148 2.365 218.02 2.365 218.02 16.722 203.754 16.722 203.754 66.392 187.414 66.392" fill={tc}/>
      <path d="M251.738,53.255c-10.129,0-17.223-8.664-17.223-19.051,0-9.934,6.912-18.688,17.132-18.688,6.835,.036,12.96,4.226,15.472,10.583l14.823-6.485c-2.091-4.048-4.981-7.63-8.495-10.531-6.394-5.498-13.488-7.924-22.319-7.924-18.338,0-32.967,15.316-32.967,32.266,0,9.688,2.944,17.832,9.869,24.641,6.351,6.27,14.951,9.732,23.876,9.609,12.668,.098,24.268-7.085,29.828-18.468l-14.538-6.407c-3.346,7.029-9.013,10.453-15.459,10.453Z" fill={tc}/>
      <polygon points="137.963 99.916 133.981 82.719 129.922 99.916 123.788 99.916 116.927 73.343 123.827 73.343 127.38 90.643 127.445 90.643 131.336 73.369 136.523 73.369 140.414 90.708 144.045 73.369 150.892 73.369 143.863 99.942 137.963 99.916" fill={sc}/>
      <rect x="153.084" y="73.343" width="6.783" height="26.573" fill={sc}/>
      <polygon points="163.239 99.916 163.239 73.343 170.021 73.343 170.021 93.95 177.88 93.95 177.88 99.916 163.239 99.916" fill={sc}/>
      <polygon points="180.191 99.916 180.191 73.343 186.973 73.343 186.973 93.95 194.832 93.95 194.832 99.916 180.191 99.916" fill={sc}/>
      <rect x="196.973" y="73.343" width="6.783" height="26.573" fill={sc}/>
      <path d="M218.603,81.642h-.104l-2.723,9.078h5.564l-2.736-9.078Zm5.823,18.273l-1.297-3.891h-9.221l-1.401,3.891h-7.288l10.66-26.573h5.343l10.57,26.573h-7.366Z" fill={sc}/>
      <polygon points="255.229 99.916 255.436 80.022 255.436 79.957 249.691 99.916 245.204 99.916 239.472 79.775 239.679 99.916 233.441 99.916 233.441 73.343 242.169 73.343 247.447 90.824 247.525 90.824 252.713 73.343 261.467 73.343 261.467 99.916 255.229 99.916" fill={sc}/>
      <path d="M275.434,81.098c-.285-1.894-1.076-2.594-2.399-2.594-1.221-.067-2.265,.868-2.334,2.088,0,1.569,1.427,2.295,4.345,3.553,5.849,2.503,7.314,4.63,7.314,8.105,0,5.188-3.515,8.158-9.26,8.158s-9.584-3.022-9.584-8.728v-.571h6.744c0,2.178,1.115,3.618,2.801,3.618,1.433,0,2.594-1.161,2.594-2.594,0-2.127-2.944-3.061-5.356-4.02-4.332-1.764-6.316-4.06-6.316-7.509,0-4.526,4.383-7.782,9.26-7.782,1.637-.018,3.253,.364,4.708,1.116,2.769,1.253,4.462,4.101,4.241,7.133l-6.757,.026Z" fill={sc}/>
    </svg>
  );
}

// --- Shared atoms -------------------------------------------------------------
function ApprovalBadge({status}) {
  const c=ATC_STATUS[status]||{bg:ATC.slateLight,text:ATC.slate,dot:ATC.slate};
  return <span style={{display:"inline-flex",alignItems:"center",gap:5,padding:"3px 10px",borderRadius:99,fontSize:11,fontWeight:600,background:c.bg,color:c.text,whiteSpace:"nowrap"}}><span style={{width:6,height:6,borderRadius:"50%",background:c.dot,flexShrink:0}}/>{status||"-"}</span>;
}
function PagBtn({children,active,disabled,onClick}) {
  return <button onClick={onClick} disabled={disabled} style={{minWidth:32,height:32,padding:"0 8px",borderRadius:6,border:active?"none":`1px solid ${ATC.border}`,background:active?ATC.crimson:disabled?ATC.bg:ATC.bgWhite,color:active?"#fff":disabled?"#C0C0C0":ATC.textDark,fontSize:13,fontWeight:active?700:400,cursor:disabled?"not-allowed":"pointer",display:"flex",alignItems:"center",justifyContent:"center",transition:"all 0.15s",boxShadow:active?`0 2px 8px ${ATC.crimson}55`:"none"}}>{children}</button>;
}
function Pagination({page,totalPages,onChange}) {
  if(totalPages<=1) return null;
  const start=Math.max(1,page-2),end=Math.min(totalPages,page+2),pages=[];
  for(let i=start;i<=end;i++) pages.push(i);
  return <div style={{display:"flex",alignItems:"center",justifyContent:"center",gap:4,padding:"14px 0"}}>
    <PagBtn disabled={page===1} onClick={()=>onChange(page-1)}><ChevronLeft size={14}/></PagBtn>
    {start>1&&<><PagBtn onClick={()=>onChange(1)}>1</PagBtn>{start>2&&<span style={{color:ATC.textMuted,padding:"0 2px"}}>...</span>}</>}
    {pages.map(p=><PagBtn key={p} active={p===page} onClick={()=>onChange(p)}>{p}</PagBtn>)}
    {end<totalPages&&<>{end<totalPages-1&&<span style={{color:ATC.textMuted,padding:"0 2px"}}>...</span>}<PagBtn onClick={()=>onChange(totalPages)}>{totalPages}</PagBtn></>}
    <PagBtn disabled={page===totalPages} onClick={()=>onChange(page+1)}><ChevronRight size={14}/></PagBtn>
  </div>;
}
function SummaryCard({label,value,icon:Icon,bg,sub}) {
  return <div style={{background:bg,borderRadius:10,padding:"18px 20px",display:"flex",alignItems:"center",gap:14,flex:"1 1 140px",minWidth:130,color:"#fff",boxShadow:`0 4px 16px ${bg}44`,position:"relative",overflow:"hidden"}}>
    <div style={{position:"absolute",right:-10,top:-10,width:68,height:68,borderRadius:"50%",background:"rgba(255,255,255,0.1)"}}/>
    <div style={{background:"rgba(255,255,255,0.2)",borderRadius:9,padding:9,flexShrink:0,position:"relative"}}><Icon size={20} color="#fff"/></div>
    <div style={{position:"relative"}}>
      <div style={{fontSize:26,fontWeight:900,lineHeight:1,letterSpacing:"-0.02em"}}>{typeof value==="number"?value.toLocaleString():value}</div>
      <div style={{fontSize:10,fontWeight:700,opacity:0.88,marginTop:3,textTransform:"uppercase",letterSpacing:"0.07em"}}>{label}</div>
      {sub&&<div style={{fontSize:9,opacity:0.65,marginTop:1}}>{sub}</div>}
    </div>
  </div>;
}
function PageTitle({title,sub}) {
  return <div style={{marginBottom:20}}>
    <div style={{display:"flex",alignItems:"center",gap:9,marginBottom:3}}>
      <div style={{width:4,height:22,background:ATC.crimson,borderRadius:2,flexShrink:0}}/>
      <h1 style={{fontSize:20,fontWeight:800,color:ATC.textDark,margin:0,letterSpacing:"-0.02em"}}>{title}</h1>
    </div>
    {sub&&<p style={{color:ATC.textMuted,margin:"0 0 0 13px",fontSize:12}}>{sub}</p>}
  </div>;
}
const TH=({children})=><th style={{padding:"10px 13px",textAlign:"left",fontWeight:700,color:ATC.textMid,fontSize:11,whiteSpace:"nowrap",textTransform:"uppercase",letterSpacing:"0.05em"}}>{children}</th>;
function SearchBar({value,onChange,placeholder}) {
  return <div style={{position:"relative",flex:"1 1 200px",maxWidth:300}}>
    <Search size={14} color={ATC.textMuted} style={{position:"absolute",left:10,top:"50%",transform:"translateY(-50%)"}}/>
    <input value={value} onChange={e=>onChange(e.target.value)} placeholder={placeholder||"Search..."} style={{width:"100%",padding:"7px 10px 7px 32px",border:`1px solid ${ATC.border}`,borderRadius:7,fontSize:13,background:ATC.bgWhite,color:ATC.textDark,outline:"none",boxSizing:"border-box"}}/>
  </div>;
}

// --- Sidebar ------------------------------------------------------------------

// --- QMS Forms collapsible nav group -----------------------------------------
function QMSFormsNavGroup({active,onNavigate,onClose,isMobile}) {
  const isAnyFormActive = QMS_FORMS.some(f=>f.id===active);
  const [open,setOpen] = useState(isAnyFormActive);
  const initGroupOpen = () => {
    const s={};
    QMS_FORM_GROUPS.forEach(g=>{ s[g.id]=g.items.some(f=>f.id===active); });
    return s;
  };
  const [groupOpen,setGroupOpen] = useState(initGroupOpen);
  const toggleGroup = (gid) => setGroupOpen(prev=>({...prev,[gid]:!prev[gid]}));

  return (
    <div>
      {/* Top-level QMS Forms toggle */}
      <button onClick={()=>setOpen(o=>!o)}
        style={{width:"100%",display:"flex",alignItems:"center",justifyContent:"space-between",padding:"8px 12px",borderRadius:6,border:"none",textAlign:"left",background:isAnyFormActive?`${ATC.crimson}18`:"transparent",color:isAnyFormActive?ATC.crimson:"rgba(255,255,255,0.55)",cursor:"pointer",marginBottom:1,fontSize:13,fontWeight:isAnyFormActive?700:500,transition:"all 0.15s",borderLeft:`3px solid ${isAnyFormActive?ATC.crimson:"transparent"}`}}>
        <div style={{display:"flex",alignItems:"center",gap:9}}>
          <FileText size={15}/>
          QMS Forms
        </div>
        <ChevronDown size={13} style={{transform:open?"rotate(180deg)":"rotate(0deg)",transition:"transform 0.2s",flexShrink:0}}/>
      </button>
      {/* FM Groups */}
      {open && QMS_FORM_GROUPS.map(grp=>{
        const isGrpActive = grp.items.some(f=>f.id===active);
        const isGrpOpen = groupOpen[grp.id];
        return (
          <div key={grp.id}>
            {/* Group header */}
            <button onClick={()=>toggleGroup(grp.id)}
              style={{width:"100%",display:"flex",alignItems:"center",justifyContent:"space-between",padding:"7px 12px 7px 28px",borderRadius:6,border:"none",textAlign:"left",background:isGrpActive?`${ATC.crimson}14`:"transparent",color:isGrpActive?"rgba(255,255,255,0.9)":"rgba(255,255,255,0.45)",cursor:"pointer",marginBottom:1,fontSize:11.5,fontWeight:isGrpActive?600:500,transition:"all 0.15s",borderLeft:`3px solid ${isGrpActive?ATC.crimson+"99":"transparent"}`}}>
              <span>{grp.label}</span>
              <ChevronDown size={11} style={{transform:isGrpOpen?"rotate(180deg)":"rotate(0deg)",transition:"transform 0.2s",flexShrink:0}}/>
            </button>
            {/* Items */}
            {isGrpOpen && grp.items.map(f=>{
              const isActive=active===f.id;
              return (
                <button key={f.id} onClick={()=>{onNavigate(f.id);if(isMobile)onClose();}}
                  style={{width:"100%",display:"flex",flexDirection:"column",alignItems:"flex-start",padding:"6px 12px 6px 44px",borderRadius:6,border:"none",textAlign:"left",background:isActive?`${ATC.crimson}28`:"transparent",cursor:"pointer",marginBottom:1,transition:"all 0.15s",borderLeft:`3px solid ${isActive?ATC.crimson:"transparent"}`}}>
                  <span style={{fontSize:11,fontWeight:isActive?700:400,color:isActive?"#FFFFFF":"rgba(255,255,255,0.6)"}}>{f.label}</span>
                  <span style={{fontSize:10,color:"rgba(255,255,255,0.3)",marginTop:1}}>{f.desc}</span>
                </button>
              );
            })}
          </div>
        );
      })}
    </div>
  );
}

function Sidebar({active,onNavigate,open,onClose,isMobile,onNewJob}) {
  return <>
    {isMobile&&open&&<div onClick={onClose} style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.55)",zIndex:40}}/>}
    <aside style={{position:"fixed",top:0,left:0,bottom:0,width:236,background:ATC.charcoal,transform:(open||!isMobile)?"translateX(0)":"translateX(-100%)",transition:"transform 0.25s cubic-bezier(.4,0,.2,1)",zIndex:50,display:"flex",flexDirection:"column",overflowY:"auto"}}>
      <div style={{background:"#FFFFFF",padding:"14px 18px 12px",borderBottom:`3px solid ${ATC.crimson}`,display:"flex",alignItems:"center",justifyContent:"space-between"}}>
        <ATCLogo width={190}/>
        {isMobile&&<button onClick={onClose} style={{background:"none",border:"none",color:ATC.textMuted,cursor:"pointer",padding:4,marginLeft:6,flexShrink:0}}><X size={16}/></button>}
      </div>
      {/* New Job Request button */}
      <div style={{padding:"14px 12px 6px"}}>
        <button onClick={()=>{onNewJob();if(isMobile)onClose();}} style={{width:"100%",display:"flex",alignItems:"center",justifyContent:"center",gap:8,padding:"9px 12px",borderRadius:7,border:"none",background:ATC.crimson,color:"#fff",cursor:"pointer",fontSize:13,fontWeight:700,boxShadow:`0 2px 8px ${ATC.crimson}44`}}>
          <Plus size={15}/> New Jobs
        </button>
      </div>
      <div style={{padding:"10px 20px 6px",fontSize:9,fontWeight:800,color:ATC.crimson,textTransform:"uppercase",letterSpacing:"0.14em"}}>Navigation</div>
      <nav style={{flex:1,padding:"4px 10px 10px"}}>
        {NAV_ITEMS.map(item=>{
          const Icon=item.icon,isActive=active===item.id;
          return <button key={item.id} onClick={()=>{onNavigate(item.id);if(isMobile)onClose();}}
            style={{width:"100%",display:"flex",alignItems:"center",gap:9,padding:"8px 12px",borderRadius:6,border:"none",textAlign:"left",background:isActive?`${ATC.crimson}28`:"transparent",color:isActive?"#FFFFFF":"rgba(255,255,255,0.55)",cursor:"pointer",marginBottom:1,fontSize:13,fontWeight:isActive?700:400,transition:"all 0.15s",borderLeft:`3px solid ${isActive?ATC.crimson:"transparent"}`}}>
            <Icon size={15}/>{item.label}
          </button>;
        })}
        {/* -- QMS Forms collapsible group -- */}
        <QMSFormsNavGroup active={active} onNavigate={onNavigate} onClose={onClose} isMobile={isMobile}/>
      </nav>
      <div style={{padding:"14px 16px",borderTop:"1px solid rgba(255,255,255,0.08)",display:"flex",alignItems:"center",gap:10}}>
        <div style={{width:33,height:33,borderRadius:"50%",background:ATC.crimson,display:"flex",alignItems:"center",justifyContent:"center",color:"#fff",fontSize:12,fontWeight:800,flexShrink:0}}>DF</div>
        <div style={{flex:1,minWidth:0}}>
          <div style={{color:"#F8F8F8",fontSize:13,fontWeight:600,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>Dilum Fernando</div>
          <div style={{color:"rgba(255,255,255,0.38)",fontSize:11}}>Administrator</div>
        </div>
        <LogOut size={14} color="rgba(255,255,255,0.3)" style={{cursor:"pointer",flexShrink:0}}/>
      </div>
    </aside>
  </>;
}

// --- Record Detail Modal (all 27 columns) -------------------------------------
function RecordDetailModal({item,onClose}) {
  const closed = item.projectStatus===1||item.projectStatus==="1";

  const MS=({title,icon,children})=>(
    <div style={{marginBottom:14}}>
      <div style={{display:"flex",alignItems:"center",gap:7,marginBottom:10,paddingBottom:8,borderBottom:`1px solid ${ATC.border}`}}>
        <div style={{width:3,height:14,background:ATC.crimson,borderRadius:2,flexShrink:0}}/>
        <span style={{fontSize:12,fontWeight:800,color:ATC.textDark,textTransform:"uppercase",letterSpacing:"0.05em"}}>{title}</span>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(190px,1fr))",gap:"10px 18px"}}>
        {children}
      </div>
    </div>
  );
  const MF=({label,value,badge,wide})=>(
    <div style={wide?{gridColumn:"1/-1"}:{}}>
      <div style={{fontSize:9,fontWeight:700,color:ATC.textMuted,textTransform:"uppercase",letterSpacing:"0.07em",marginBottom:3}}>{label}</div>
      {badge
        ? <ApprovalBadge status={value||"-"}/>
        : <div style={{fontSize:12,color:value?ATC.textDark:ATC.textMuted,fontWeight:value?500:400,lineHeight:1.4,wordBreak:"break-word"}}>{value||"—"}</div>
      }
    </div>
  );

  return (
    <div style={{position:"fixed",inset:0,zIndex:9000,display:"flex",alignItems:"flex-start",justifyContent:"center",padding:"24px 16px",overflowY:"auto"}}>
      {/* Backdrop */}
      <div onClick={onClose} style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.6)",backdropFilter:"blur(3px)"}}/>

      {/* Modal card */}
      <div style={{position:"relative",width:"100%",maxWidth:860,background:ATC.bgWhite,borderRadius:14,boxShadow:"0 24px 80px rgba(0,0,0,0.3)",overflow:"hidden",marginTop:0}}>

        {/* ── Sticky header ── */}
        <div style={{position:"sticky",top:0,zIndex:10,background:ATC.crimson,padding:"14px 20px",display:"flex",alignItems:"center",justifyContent:"space-between",gap:12}}>
          <div style={{display:"flex",alignItems:"center",gap:12,minWidth:0,flex:1}}>
            <div style={{flexShrink:0,textAlign:"center",minWidth:52}}>
              <div style={{fontSize:8,fontWeight:700,color:"rgba(255,255,255,0.7)",textTransform:"uppercase",letterSpacing:"0.1em"}}>ID</div>
              <div style={{fontSize:26,fontWeight:900,color:"#fff",lineHeight:1}}>{item.id}</div>
            </div>
            <div style={{width:1,height:40,background:"rgba(255,255,255,0.2)",flexShrink:0}}/>
            <div style={{minWidth:0,flex:1}}>
              <div style={{fontSize:15,fontWeight:800,color:"#fff",lineHeight:1.2,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{item.projectName}</div>
              <div style={{fontSize:11,color:"rgba(255,255,255,0.7)",marginTop:3,display:"flex",gap:12,flexWrap:"wrap"}}>
                <span>No. <strong style={{color:"#fff"}}>{item.projectNumber?item.projectNumber.replace(/,/g,""):"—"}</strong></span>
                <span>Sub <strong style={{color:"#fff"}}>{item.subProjectNumber||"—"}</strong></span>
                <span>Client ID <strong style={{color:"#fff"}}>{item.idClient||"—"}</strong></span>
              </div>
            </div>
          </div>
          <button onClick={onClose} style={{flexShrink:0,background:"rgba(255,255,255,0.15)",border:"1px solid rgba(255,255,255,0.3)",borderRadius:8,width:34,height:34,display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",color:"#fff"}}>
            <X size={16}/>
          </button>
        </div>

        {/* ── Scrollable body ── */}
        <div style={{padding:"20px 24px 28px",overflowY:"auto",maxHeight:"calc(90vh - 80px)",background:"#D4D5D8"}}>

          {/* Row 1 — Project Identification */}
          <MS title="Project Identification">
            <MF label="ID"                    value={String(item.id)}/>
            <MF label="Project Name"          value={item.projectName}/>
            <MF label="Project Number"        value={item.projectNumber?item.projectNumber.replace(/,/g,""):null}/>
            <MF label="Sub-Project Name"      value={item.subProjectName}/>
            <MF label="Sub-Project Number"    value={item.subProjectNumber}/>
            <MF label="Client ID (ID_Client)" value={item.idClient?String(item.idClient):null}/>
          </MS>

          {/* Row 2 — Site & Office */}
          <MS title="Site & Office">
            <MF label="Site Name"              value={item.siteName}/>
            <MF label="Site Short Name"        value={item.siteShortName}/>
            <MF label="Office for Submission"  value={item.officeForFormSubmission}/>
            <MF label="Project Status"         value={closed?"Closed (1)":"Active (0)"}/>
            <MF label="V5"                     value={item.v5}/>
          </MS>

          {/* Row 3 — Team */}
          <MS title="Team">
            <MF label="Created By"             value={item.createdBy}/>
            <MF label="Project Manager"        value={item.projectManagerName}/>
            <MF label="Sub-Project Manager"    value={item.subProjectManagerName}/>
          </MS>

          {/* Row 4 — FM-01A */}
          <MS title="FM-01A · Opportunity Initiation">
            <MF label="FM-01A Approval Status"    value={item.fm01A_ApprovalStatus}    badge/>
            <MF label="FM-01A Approved By"        value={item.fm01A_ApprovedBy}/>
            <MF label="FM-01A Approved Date"      value={item.fm01A_ApprovedDate}/>
            <MF label="FM-01A OM Approval Status" value={item.fm01A_OM_ApprovalStatus} badge/>
            <MF label="FM-01A OM Approved By"     value={item.fm01A_OM_ApprovedBy}/>
            <MF label="FM-01A OM Approved Date"   value={item.fm01A_OM_ApprovedDate}/>
            <MF label="FM-01A OM Recommendations" value={item.fm01A_OM_Recommendations} wide/>
          </MS>

          {/* Row 5 — FM-01B */}
          <MS title="FM-01B · Contract Award">
            <MF label="FM-01B Approval Status" value={item.fm01B_ApprovalStatus} badge/>
            <MF label="FM-01B Approved By"     value={item.fm01B_ApprovedBy}/>
            <MF label="FM-01B Approved Date"   value={item.fm01B_ApprovedDate}/>
          </MS>

          {/* Row 6 — FM-19 */}
          <MS title="FM-19 · Project Closure">
            <MF label="FM-19 Closed By"   value={item.fm19_ClosedBy}/>
            <MF label="FM-19 Closed Date" value={item.fm19_ClosedDate}/>
          </MS>

          {/* Row 7 — Record Audit */}
          <MS title="Record Audit">
            <MF label="Created"        value={item.createdAt}/>
            <MF label="Last Modified"  value={item.modifiedAt}/>
          </MS>

          {/* Action buttons */}
          <div style={{display:"flex",gap:10,flexWrap:"wrap",paddingTop:4,borderTop:`1px solid ${ATC.border}`,marginTop:4}}>
            <button style={{display:"flex",alignItems:"center",gap:6,padding:"8px 18px",background:ATC.greenLight,color:ATC.green,border:`1px solid ${ATC.green}33`,borderRadius:7,fontSize:12,fontWeight:700,cursor:"pointer"}}><CheckCircle size={13}/>Approve FM-01A</button>
            <button style={{display:"flex",alignItems:"center",gap:6,padding:"8px 18px",background:ATC.crimsonPale,color:ATC.crimsonDark,border:`1px solid ${ATC.crimson}33`,borderRadius:7,fontSize:12,fontWeight:700,cursor:"pointer"}}><XCircle size={13}/>Reject FM-01A</button>
            <button style={{display:"flex",alignItems:"center",gap:6,padding:"8px 18px",background:ATC.blueLight,color:ATC.blue,border:`1px solid ${ATC.blue}33`,borderRadius:7,fontSize:12,fontWeight:700,cursor:"pointer"}}><FileText size={13}/>View FM-01A Form</button>
            <button onClick={onClose} style={{marginLeft:"auto",display:"flex",alignItems:"center",gap:6,padding:"8px 18px",background:ATC.bgWhite,color:ATC.textMid,border:`1px solid ${ATC.border}`,borderRadius:7,fontSize:12,fontWeight:600,cursor:"pointer"}}>Close</button>
          </div>
        </div>
      </div>
    </div>
  );
}
// keep old name as alias so any other call site still works
const PendingApprovalModal = RecordDetailModal;

// --- Pending Approval — Workbook Detail Full Page -----------------------------
function PendingWorkbookPage({item, onClose}) {
  const [showPdf, setShowPdf] = useState(false);
  // Look up related form records by master ID
  const fm01aRec = MOCK_FM01A.find(r=>r.idMaster===item.id);
  const fm02Rec  = MOCK_FM02.find(r=>r.idMaster===item.id);
  const fm03aRec = MOCK_FM03A.find(r=>r.idMaster===item.id);
  const fm04Rec  = MOCK_FM04.find(r=>r.idMaster===item.id);
  const fm01bRec = MOCK_FM01B.find(r=>r.idMaster===item.id);
  const fm03bRec = MOCK_FM03B.find(r=>r.idMaster===item.id);
  const fm05Rec  = MOCK_FM05_REVIEW.find(r=>r.idMaster===item.id);
  const fm06Rec  = MOCK_FM06_PLAN.find(r=>r.idMaster===item.id);
  const fm07Rec  = MOCK_FM07_MAIN.find(r=>r.idMaster===item.id);
  const fm08Rec  = MOCK_FM08_DOCS.find(r=>r.idMaster===item.id);
  const fm09Rec  = MOCK_FM09_DRAWINGS.find(r=>r.idMaster===item.id);
  const fm10Rec  = MOCK_FM10_MATRIX.find(r=>r.idMaster===item.id);
  const fm11Rec  = MOCK_FM11_CHANGE.find(r=>r.idMaster===item.id);
  const fm12Rec  = MOCK_FM12_CHANGE.find(r=>r.idMaster===item.id);
  const fm13Rec  = MOCK_FM13_BOD.find(r=>r.idMaster===item.id);
  const fm14Rec  = MOCK_FM14_WPP.find(r=>r.idMaster===item.id);
  const fm15Rec  = MOCK_FM15_CADD.find(r=>r.idMaster===item.id);
  const fm16Rec  = MOCK_FM16_REVIEW.find(r=>r.idMaster===item.id);
  const fm17Rec  = MOCK_FM17_TRANS.find(r=>r.idMaster===item.id);
  const fm19Rec  = MOCK_FM19_CLOSURE.find(r=>r.idMaster===item.id);
  const fm04Revs = MOCK_FM04_REVIEWERS.filter(r=>r.idMaster===item.id);

  // Summary derived fields
  const projectCategory = fm01aRec?.categoryList || "—";
  const projectType     = fm01aRec?.projectType   || "—";
  const riskCat = fm03aRec ? (()=>{
    const mx=Math.max(parseInt(fm03aRec.pfiPopulationAtRisk)||0,parseInt(fm03aRec.pfiTechnicalComplexity)||0,parseInt(fm03aRec.pfiLegalExposure)||0);
    return mx<=2?"1 - Low Risk":mx===3?"2 - Medium Risk":mx===4?"3 - High Risk":"4 - Innovative / High Risk";
  })() : "—";
  const projectDirector = fm04Rec?.createdBy || "—";
  const reviewers = fm04Revs.length
    ? [...new Set(fm04Revs.flatMap(r=>[r.review1,r.review2].filter(Boolean)))].join(", ")
    : (fm03aRec?.leadName || "—");

  // Status constants
  const S={NONE:"none",COMMENCED:"commenced",SUBMITTED:"submitted",COMPLETED:"completed",LOCKED:"locked",NA:"na"};

  // Individual form statuses
  const s01a = item.fm01A_ApprovalStatus==="Approved"?S.COMPLETED:(fm01aRec||item.fm01A_ApprovalStatus==="Pending")?S.SUBMITTED:S.NONE;
  const s02  = !fm02Rec?S.NONE:fm02Rec.finalDecision==="GO"||fm02Rec.isSubmitted==="True"?S.COMPLETED:S.COMMENCED;
  const s03a = !fm03aRec?S.NONE:fm03aRec.isSubmitted==="True"?S.COMPLETED:S.COMMENCED;
  const s04  = fm04Rec?S.COMPLETED:S.NONE;
  const s01b = s04!==S.COMPLETED?S.LOCKED:fm01bRec?S.COMPLETED:S.NONE;
  const s03b = s01b!==S.COMPLETED?S.LOCKED:fm03bRec?S.COMPLETED:S.NONE;
  const s05  = s03b!==S.COMPLETED?S.LOCKED:fm05Rec?S.COMPLETED:S.NONE;
  const s06  = s03b!==S.COMPLETED?S.LOCKED:fm06Rec?S.COMPLETED:S.NONE;
  const both = s05===S.COMPLETED&&s06===S.COMPLETED;
  const s07  = !both?S.LOCKED:fm07Rec?S.COMPLETED:S.NONE;
  const s08  = !both?S.LOCKED:fm08Rec?S.COMPLETED:S.NONE;
  const s09  = !both?S.LOCKED:fm09Rec?S.COMPLETED:S.NONE;
  const s10  = fm10Rec?S.COMMENCED:S.NONE;
  const s11  = fm11Rec?S.COMMENCED:S.NONE;
  const s12  = fm12Rec?S.COMMENCED:S.NONE;
  const s13  = !both?S.LOCKED:fm13Rec?S.COMPLETED:S.NONE;
  const s14  = !both?S.LOCKED:fm14Rec?S.COMPLETED:S.NONE;
  const s15  = !both?S.LOCKED:fm15Rec?S.COMPLETED:S.NONE;
  const s16  = !both?S.LOCKED:fm16Rec?S.COMPLETED:S.NONE;
  const s17  = !both?S.LOCKED:fm17Rec?S.COMPLETED:S.NONE;
  const s18  = S.NA;
  const s19  = fm19Rec?S.COMPLETED:S.NONE;

  const allSt = [s01a,s02,s03a,s04,s01b,s03b,s05,s06,s07,s08,s09,s10,s11,s12,s13,s14,s15,s16,s17,s19];
  const completedCnt = allSt.filter(s=>s===S.COMPLETED).length;
  const countable    = allSt.filter(s=>s!==S.LOCKED&&s!==S.NA).length;
  const pct = countable?Math.round(completedCnt/countable*100):0;

  const ROWS=[
    {label:"SY-QS-FM-01A",s:s01a,prereq:null},
    {label:"SY-QS-FM-02", s:s02, prereq:null},
    {label:"SY-QS-FM-03A",s:s03a,prereq:null},
    {label:"SY-QS-FM-04", s:s04, prereq:null},
    {label:"SY-QS-FM-01B",s:s01b,prereq:"FM-04 Completed"},
    {label:"SY-QS-FM-03B",s:s03b,prereq:"FM-01B Completed"},
    {label:"SY-QS-FM-05", s:s05, prereq:"FM-03B Completed"},
    {label:"SY-QS-FM-06", s:s06, prereq:"FM-03B Completed"},
    {label:"SY-QS-FM-07", s:s07, prereq:"FM-05, FM-06 Completed"},
    {label:"SY-QS-FM-08", s:s08, prereq:"FM-05, FM-06 Completed"},
    {label:"SY-QS-FM-09", s:s09, prereq:"FM-05, FM-06 Completed"},
    {label:"SY-QS-FM-10", s:s10, prereq:null},
    {label:"SY-QS-FM-11", s:s11, prereq:null},
    {label:"SY-QS-FM-12", s:s12, prereq:null},
    {label:"SY-QS-FM-13", s:s13, prereq:"FM-05, FM-06 Completed"},
    {label:"SY-QS-FM-14", s:s14, prereq:"FM-05, FM-06 Completed"},
    {label:"SY-QS-FM-15", s:s15, prereq:"FM-05, FM-06 Completed"},
    {label:"SY-QS-FM-16", s:s16, prereq:"FM-05, FM-06 Completed"},
    {label:"SY-QS-FM-17", s:s17, prereq:"FM-05, FM-06 Completed"},
    {label:"SY-QS-FM-18", s:s18, prereq:"Not Applicable at this stage"},
    {label:"SY-QS-FM-19", s:s19, prereq:null},
  ];

  const Chk=()=><span style={{color:ATC.green,fontSize:15,fontWeight:900,lineHeight:1}}>✓</span>;
  const grayTd={padding:"6px 10px",textAlign:"center",background:"#EFEFEF"};
  const activeTd=(bg)=>({padding:"6px 10px",textAlign:"center",background:bg});

  const summaryGroups=[
    {full:true, label:"Project Descriptor",    value:item.projectName},
    {pair:[{label:"Client Name",           value:item.clientName||"—"},
           {label:"Project Category",      value:projectCategory}]},
    {pair:[{label:"Project Director",      value:projectDirector},
           {label:"Project Manager",       value:item.projectManagerName||"—"}]},
    {pair:[{label:"Project Type",          value:projectType},
           {label:"Project Risk Category", value:riskCat}]},
    {full:true, label:"Assigned Reviewers",    value:reviewers},
  ];

  return (
    <div style={{position:"fixed",inset:0,zIndex:9000,display:"flex",alignItems:"flex-start",justifyContent:"center",padding:"24px 16px",overflowY:"auto"}}>
      <div onClick={onClose} style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.6)",backdropFilter:"blur(3px)"}}/>
      <div style={{position:"relative",width:"100%",maxWidth:1100,background:ATC.bgWhite,borderRadius:12,border:`1px solid ${ATC.border}`,boxShadow:"0 16px 48px rgba(0,0,0,0.2)",overflow:"hidden",marginTop:0,display:"flex",flexDirection:"column"}}>
        <div style={{background:ATC.crimson,padding:"0 18px",height:44,display:"flex",alignItems:"center",justifyContent:"space-between",flexShrink:0,gap:12}}>
          <div style={{display:"flex",alignItems:"center",gap:10,minWidth:0,flex:1}}>
            <div style={{width:3,height:16,background:"rgba(255,255,255,0.6)",borderRadius:2,flexShrink:0}}/>
            <div style={{minWidth:0}}>
              <div style={{fontSize:15,fontWeight:700,color:"#fff",lineHeight:1.2,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{item.projectName}</div>
              <div style={{fontSize:11,color:"rgba(255,255,255,0.75)",marginTop:2}}>
                ID #{item.id} · {item.projectNumber?item.projectNumber.replace(/,/g,""):"—"} · {item.siteName||"—"}
              </div>
            </div>
          </div>
          <div style={{display:"flex",alignItems:"center",gap:8,flexShrink:0}}>
            <button style={{height:26,padding:"0 14px",background:ATC.blue,color:"#fff",border:"none",borderRadius:6,fontSize:11,fontWeight:700,cursor:"pointer",whiteSpace:"nowrap"}}>Client Feedback</button>
            <button onClick={()=>setShowPdf(true)} style={{height:26,padding:"0 14px",background:ATC.blue,color:"#fff",border:"none",borderRadius:6,fontSize:11,fontWeight:700,cursor:"pointer",whiteSpace:"nowrap"}}>Minimum Workbook Completion Requirements</button>
            <button onClick={onClose} style={{height:26,padding:"0 14px",display:"flex",alignItems:"center",gap:6,background:"#fff",border:"none",borderRadius:6,color:ATC.crimson,fontSize:11,fontWeight:700,cursor:"pointer",flexShrink:0,whiteSpace:"nowrap"}}>
              <X size={14}/> Close
            </button>
          </div>
        </div>
        <div style={{padding:"24px",display:"flex",gap:24,alignItems:"flex-start",flexWrap:"wrap",overflowY:"auto",maxHeight:"calc(90vh - 60px)",background:"#D4D5D8"}}>
          <div style={{flex:"0 0 auto",width:"100%",maxWidth:420}}>
            <div style={{background:ATC.bgWhite,border:`1px solid ${ATC.border}`,borderRadius:10,overflow:"hidden"}}>
              <div style={{background:ATC.bg,padding:"10px 16px",borderBottom:`1px solid ${ATC.border}`,display:"flex",alignItems:"center",gap:8}}>
                <div style={{width:3,height:15,background:ATC.crimson,borderRadius:2}}/>
                <span style={{fontWeight:800,fontSize:14,color:ATC.textDark}}>Summary</span>
              </div>
              <table style={{width:"100%",borderCollapse:"collapse",fontSize:12}}>
                <thead>
                  <tr style={{background:ATC.bg}}>
                    {["Pro Num","Site Name","Site Short Name"].map(h=>(
                      <th key={h} style={{padding:"6px 12px",fontWeight:800,fontSize:9,textTransform:"uppercase",letterSpacing:"0.06em",color:ATC.textDark,textAlign:"left",borderBottom:`1px solid ${ATC.border}`}}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  <tr style={{borderBottom:`1px solid ${ATC.bg}`}}>
                    <td style={{padding:"8px 12px",color:ATC.textDark,fontWeight:700,fontSize:12}}>{item.projectNumber?item.projectNumber.replace(/,/g,""):"—"}</td>
                    <td style={{padding:"8px 12px",color:ATC.textDark,fontSize:12}}>{item.siteName||"—"}</td>
                    <td style={{padding:"8px 12px",color:ATC.textDark,fontSize:12}}>{item.siteShortName||"—"}</td>
                  </tr>
                </tbody>
              </table>
              {summaryGroups.map((g,i)=>
                g.pair ? (
                  <div key={i} style={{display:"grid",gridTemplateColumns:"1fr 1fr",borderTop:`1px solid ${ATC.bg}`}}>
                    {g.pair.map((r,j)=>(
                      <div key={j} style={{padding:"9px 14px",borderRight:j===0?`1px solid ${ATC.bg}`:"none"}}>
                        <div style={{fontSize:9,fontWeight:800,color:ATC.textDark,textTransform:"uppercase",letterSpacing:"0.07em",marginBottom:3}}>{r.label}</div>
                        <div style={{fontSize:12,color:ATC.textDark,fontWeight:500,lineHeight:1.4}}>{r.value||"—"}</div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div key={i} style={{padding:"9px 14px",borderTop:`1px solid ${ATC.bg}`}}>
                    <div style={{fontSize:9,fontWeight:800,color:ATC.textDark,textTransform:"uppercase",letterSpacing:"0.07em",marginBottom:3}}>{g.label}</div>
                    <div style={{fontSize:12,color:ATC.textDark,fontWeight:500,lineHeight:1.4}}>{g.value||"—"}</div>
                  </div>
                )
              )}
            </div>
          </div>
          <div style={{flex:"1 1 380px",minWidth:350}}>
            <div style={{background:ATC.bgWhite,border:`1px solid ${ATC.border}`,borderRadius:10,overflow:"hidden"}}>
              <div style={{background:ATC.bg,padding:"10px 16px",borderBottom:`1px solid ${ATC.border}`,display:"flex",alignItems:"center",justifyContent:"space-between",gap:12}}>
                <div style={{display:"flex",alignItems:"center",gap:8}}>
                  <div style={{width:3,height:15,background:ATC.crimson,borderRadius:2}}/>
                  <span style={{fontWeight:800,fontSize:14,color:ATC.textDark}}>Workbook Form Status</span>
                  <span style={{display:"inline-flex",alignItems:"center",justifyContent:"center",width:16,height:16,borderRadius:99,background:ATC.border,fontSize:10,fontWeight:900,color:ATC.textMuted,cursor:"help",flexShrink:0}} title="Completion status of all QMS workbook forms for this project">i</span>
                </div>
                <span style={{padding:"5px 14px",background:"#FFD600",color:"#222",fontWeight:800,fontSize:13,borderRadius:6,whiteSpace:"nowrap",boxShadow:"0 1px 4px rgba(0,0,0,0.15)"}}>
                  {pct}% ({completedCnt}/{countable})
                </span>
              </div>
              <div style={{overflowX:"auto"}}>
                <table style={{width:"100%",borderCollapse:"collapse",fontSize:12}}>
                  <thead>
                    <tr style={{background:ATC.bg}}>
                      <th style={{padding:"7px 14px",textAlign:"left",fontWeight:700,fontSize:10,textTransform:"uppercase",letterSpacing:"0.05em",color:ATC.textMuted,borderBottom:`1px solid ${ATC.border}`}}>Form</th>
                      {["Commenced","Submitted","Completed"].map(h=>(
                        <th key={h} style={{padding:"7px 10px",textAlign:"center",fontWeight:700,fontSize:10,textTransform:"uppercase",letterSpacing:"0.04em",color:ATC.textMuted,borderBottom:`1px solid ${ATC.border}`,width:88}}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {ROWS.map((f,i)=>{
                      const bg=i%2===0?ATC.bgWhite:"#FAFAFA";
                      if(f.s===S.LOCKED||f.s===S.NA){
                        return(
                          <tr key={f.label} style={{borderBottom:`1px solid ${ATC.bg}`,background:bg}}>
                            <td style={{padding:"7px 14px"}}>
                              <span style={{display:"inline-flex",alignItems:"center",gap:7}}>
                                <svg width="10" height="12" viewBox="0 0 10 12"><rect x="0.75" y="5" width="8.5" height="6.5" rx="1.5" fill="#AAAAAA"/><path d="M2 5V4a3 3 0 0 1 6 0v1" stroke="#AAAAAA" strokeWidth="1.4" fill="none" strokeLinecap="round"/></svg>
                                <span style={{color:"#AAAAAA",fontWeight:600,fontSize:12}}>{f.label}</span>
                              </span>
                            </td>
                            <td colSpan={3} style={{padding:"7px 14px",color:"#AAAAAA",fontSize:11,fontStyle:"italic"}}>
                              {f.s===S.NA?"Not Applicable at this stage":`Prerequisite: ${f.prereq}`}
                            </td>
                          </tr>
                        );
                      }
                      const commenced=f.s===S.COMMENCED||f.s===S.SUBMITTED||f.s===S.COMPLETED;
                      const submitted=f.s===S.SUBMITTED||f.s===S.COMPLETED;
                      const completed=f.s===S.COMPLETED;
                      return(
                        <tr key={f.label} style={{borderBottom:`1px solid ${ATC.bg}`,background:bg}}>
                          <td style={{padding:"7px 14px",fontWeight:600,color:ATC.textDark}}>{f.label}</td>
                          <td style={commenced?activeTd(bg):grayTd}>{commenced&&<Chk/>}</td>
                          <td style={submitted?activeTd(bg):grayTd}>{submitted&&<Chk/>}</td>
                          <td style={completed?activeTd(bg):grayTd}>{completed&&<Chk/>}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
      {showPdf && (
        <div style={{position:"fixed",inset:0,zIndex:9100,display:"flex",alignItems:"center",justifyContent:"center",padding:"24px"}}>
          <div onClick={()=>setShowPdf(false)} style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.7)"}}/>
          <div style={{position:"relative",width:"100%",maxWidth:1200,height:"95vh",background:"#fff",borderRadius:12,overflow:"hidden",display:"flex",flexDirection:"column",boxShadow:"0 24px 80px rgba(0,0,0,0.4)"}}>
            <div style={{background:ATC.crimson,padding:"11px 20px",display:"flex",alignItems:"center",justifyContent:"space-between",flexShrink:0}}>
              <span style={{color:"#fff",fontWeight:800,fontSize:14}}>Minimum Workbook Completion Requirements</span>
              <button onClick={()=>setShowPdf(false)} style={{display:"flex",alignItems:"center",gap:6,background:"#fff",border:"none",borderRadius:7,padding:"5px 14px",color:ATC.crimson,fontSize:12,fontWeight:700,cursor:"pointer"}}>
                <X size={13}/> Close
              </button>
            </div>
            <iframe src="/Minimum Workbook Completion Requirements Rev1.pdf" style={{flex:1,width:"100%",border:"none"}} title="Minimum Workbook Completion Requirements"/>
          </div>
        </div>
      )}
    </div>
  );
}

// --- Opportunity Detail View --------------------------------------------------
function OpportunityDetailView({item,onBack}) {
  const Section=({title,children})=>(
    <div style={{background:ATC.bgWhite,borderRadius:10,border:`1px solid ${ATC.border}`,padding:"20px 24px",marginBottom:14}}>
      <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:16,paddingBottom:12,borderBottom:`2px solid ${ATC.crimsonPale}`}}>
        <div style={{width:3,height:16,background:ATC.crimson,borderRadius:2}}/>
        <h3 style={{margin:0,fontSize:14,fontWeight:800,color:ATC.textDark}}>{title}</h3>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(220px,1fr))",gap:"12px 24px"}}>
        {children}
      </div>
    </div>
  );
  const Field=({label,value,badge})=>(
    <div>
      <div style={{fontSize:10,fontWeight:700,color:ATC.textMuted,textTransform:"uppercase",letterSpacing:"0.06em",marginBottom:4}}>{label}</div>
      {badge
        ? <ApprovalBadge status={value||"-"}/>
        : <div style={{fontSize:13,color:value?ATC.textDark:ATC.textMuted,fontWeight:value?500:400}}>{value||"-"}</div>
      }
    </div>
  );

  return (
    <div>
      {/* Back + header */}
      <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:20,flexWrap:"wrap"}}>
        <button onClick={onBack} style={{display:"flex",alignItems:"center",gap:6,padding:"7px 14px",background:ATC.bgWhite,border:`1px solid ${ATC.border}`,borderRadius:7,fontSize:13,color:ATC.textMid,cursor:"pointer",fontWeight:500}}>
          <ArrowLeft size={14}/> Back to Dashboard
        </button>
        <div style={{flex:1,minWidth:0}}>
          <div style={{display:"flex",alignItems:"center",gap:10,flexWrap:"wrap"}}>
            <h1 style={{margin:0,fontSize:20,fontWeight:800,color:ATC.textDark,letterSpacing:"-0.02em"}}>{item.projectName}</h1>
            <span style={{padding:"3px 10px",borderRadius:99,fontSize:11,fontWeight:700,textTransform:"uppercase",background:item.projectStatus===0?ATC.blueLight:ATC.slateLight,color:item.projectStatus===0?ATC.blue:ATC.slate}}>
              {item.projectStatus===0?"Active":"Closed"}
            </span>
          </div>
          <p style={{margin:"3px 0 0",fontSize:12,color:ATC.textMuted}}>Record ID #{item.id} - QMS Master</p>
        </div>
      </div>

      {/* ID banner */}
      <div style={{background:ATC.crimson,borderRadius:10,padding:"16px 24px",marginBottom:14,display:"flex",alignItems:"center",gap:20,flexWrap:"wrap",borderTop:`3px solid ${ATC.crimsonDark}`}}>
        <div style={{textAlign:"center"}}>
          <div style={{fontSize:10,fontWeight:700,color:"rgba(255,255,255,0.8)",textTransform:"uppercase",letterSpacing:"0.1em"}}>Record ID</div>
          <div style={{fontSize:32,fontWeight:900,color:"#fff",lineHeight:1}}>#{item.id}</div>
        </div>
        <div style={{width:1,height:48,background:"rgba(255,255,255,0.12)"}}/>
        <div style={{flex:1,minWidth:200}}>
          <div style={{fontSize:10,fontWeight:700,color:"rgba(255,255,255,0.5)",textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:2}}>Project Number</div>
          <div style={{fontSize:18,fontWeight:700,color:"#fff"}}>{item.projectNumber?item.projectNumber.replace(/,/g,""):"Not assigned"}</div>
        </div>
        <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
          <ApprovalBadge status={item.fm01A_ApprovalStatus}/>
          <ApprovalBadge status={item.fm01B_ApprovalStatus}/>
        </div>
      </div>

      <Section title="Project Details">
        <Field label="Project Name"       value={item.projectName}/>
        <Field label="Project Number"     value={item.projectNumber}/>
        <Field label="Sub-Project Name"   value={item.subProjectName}/>
        <Field label="Sub-Project Number" value={item.subProjectNumber}/>
        <Field label="Client"             value={item.clientName}/>
        <Field label="Site Name"          value={item.siteName}/>
        <Field label="Office"             value={item.officeForFormSubmission}/>
        <Field label="Created By"         value={item.createdBy}/>
        <Field label="Created Date"       value={item.createdAt?new Date(item.createdAt).toLocaleDateString("en-AU"):null}/>
        <Field label="Last Modified"      value={item.modifiedAt?new Date(item.modifiedAt).toLocaleDateString("en-AU"):null}/>
      </Section>

      <Section title="Project Management">
        <Field label="Project Manager"     value={item.projectManagerName}/>
        <Field label="Sub-Project Manager" value={item.subProjectManagerName}/>
      </Section>

      <Section title="Approval Status">
        <Field label="FM-01A Approval"    value={item.fm01A_ApprovalStatus}    badge/>
        <Field label="FM-01A Approved By" value={item.fm01A_ApprovedBy}/>
        <Field label="FM-01A Date"        value={item.fm01A_ApprovedDate?new Date(item.fm01A_ApprovedDate).toLocaleDateString("en-AU"):null}/>
        <Field label="FM-01B Approval"    value={item.fm01B_ApprovalStatus}    badge/>
        <Field label="OM Approval"        value={item.fm01A_OM_ApprovalStatus} badge/>
      </Section>

      {/* Actions */}
      <div style={{background:ATC.bgWhite,borderRadius:10,border:`1px solid ${ATC.border}`,padding:"16px 24px",display:"flex",gap:10,flexWrap:"wrap"}}>
        <button style={{display:"flex",alignItems:"center",gap:6,padding:"8px 18px",background:ATC.greenLight,color:ATC.green,border:`1px solid ${ATC.green}33`,borderRadius:7,fontSize:13,fontWeight:700,cursor:"pointer"}}>
          <CheckCircle size={14}/> Approve FM-01A
        </button>
        <button style={{display:"flex",alignItems:"center",gap:6,padding:"8px 18px",background:ATC.crimsonPale,color:ATC.crimsonDark,border:`1px solid ${ATC.crimson}33`,borderRadius:7,fontSize:13,fontWeight:700,cursor:"pointer"}}>
          <XCircle size={14}/> Reject FM-01A
        </button>
        <button style={{display:"flex",alignItems:"center",gap:6,padding:"8px 18px",background:ATC.blueLight,color:ATC.blue,border:`1px solid ${ATC.blue}33`,borderRadius:7,fontSize:13,fontWeight:700,cursor:"pointer"}}>
          <FileText size={14}/> View FM-01A Form
        </button>
      </div>
    </div>
  );
}

// --- Project Workbook Dashboard Page ------------------------------------------
const WB_PURPLE = "#5C2D91";
const WB_GREEN  = "#2E7D32";
const WB_ORANGE = "#E65100";
const WB_BLUE   = "#1565C0";

const WB_YELLOW = "#D97706";
const WB_STATUS = {M:"#1565C0", O:"#BF360C", N:"#757575"};

function FMCard({fmId, name, color, status, locked, proc, mini=false}) {
  const sc = WB_STATUS[status]||"#999";
  const w = mini ? 145 : 175;
  return (
    <div style={{width:w,flexShrink:0,background:"#fff",borderRadius:12,borderLeft:`5px solid ${color}`,padding:"13px 12px 13px 15px",boxShadow:"0 2px 10px rgba(0,0,0,0.09)",display:"flex",flexDirection:"column",gap:5,position:"relative"}}>
      <div style={{position:"absolute",top:10,right:10,width:26,height:26,borderRadius:"50%",border:`2.5px solid ${sc}`,background:"#fff",display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,fontWeight:800,color:sc}}>{status}</div>
      <div style={{fontSize:11,fontWeight:800,color,letterSpacing:"0.04em",lineHeight:1}}>{fmId}</div>
      <div style={{fontSize:mini?12:13,fontWeight:700,color:"#1E293B",lineHeight:1.3,paddingRight:28}}>{name}</div>
      {proc&&<div style={{fontSize:9,color:"#94A3B8",fontWeight:500,lineHeight:1.4,marginTop:2}}>{proc}</div>}
      {locked&&<div style={{fontSize:10,color:"#94A3B8",fontWeight:600,marginTop:3}}>🔒 Locked</div>}
    </div>
  );
}

const Connector = ({color="#CBD5E1"})=>(
  <div style={{display:"flex",alignItems:"center",flexShrink:0,width:52,alignSelf:"stretch"}}>
    <svg width="52" height="18" viewBox="0 0 52 18" fill="none">
      <line x1="0" y1="9" x2="41" y2="9" stroke={color} strokeWidth="2.5" strokeLinecap="round"/>
      <path d="M40 4 L51 9 L40 14 Z" fill={color}/>
    </svg>
  </div>
);

function PhaseFlow({nodes, phaseColor}) {
  return (
    <div style={{display:"flex",alignItems:"stretch",overflowX:"auto",paddingBottom:4}}>
      {nodes.flatMap((n,i)=>[
        <FMCard key={n.fmId} fmId={n.fmId} name={n.name} color={n.color||phaseColor} status={n.status} locked={n.locked} proc={n.proc}/>,
        ...(i<nodes.length-1?[<Connector key={`c${i}`} color={phaseColor}/>]:[])
      ])}
    </div>
  );
}

function StatPill({label, value, color}) {
  return (
    <div style={{display:"flex",alignItems:"center",gap:8,padding:"7px 16px",background:"#fff",borderRadius:22,border:"1px solid #E2E8F0",boxShadow:"0 1px 3px rgba(0,0,0,0.05)"}}>
      <span style={{fontSize:18,fontWeight:800,color,lineHeight:1}}>{value}</span>
      <span style={{fontSize:11,color:"#64748B",fontWeight:500,whiteSpace:"nowrap"}}>{label}</span>
    </div>
  );
}

function OngoingGroup({label, nodes, last=false}) {
  return (
    <div style={{flexShrink:0,paddingRight:last?0:16,marginRight:last?0:16,borderRight:last?"none":"1px solid #E2E8F0"}}>
      <div style={{fontSize:7.5,fontWeight:700,color:"#92400E",textTransform:"uppercase",letterSpacing:"0.06em",marginBottom:10,paddingBottom:5,borderBottom:"2px solid #FDE68A",whiteSpace:"nowrap"}}>{label}</div>
      <div style={{display:"flex",gap:8}}>
        {nodes.map(n=><FMCard key={n.id} fmId={n.id} name={n.name} color={WB_YELLOW} status={n.status} locked={n.locked} mini/>)}
      </div>
    </div>
  );
}

function ProjectWorkbookDashboardPage({item, onClose}) {
  const proposalNodes = [
    {fmId:"FM-01A",name:"Opportunity Initiation",      color:ATC.crimson,status:"M",proc:"Project Mgmt Workbook Proc SY-QS-PR-01"},
    {fmId:"FM-02", name:"Go/No Go Assessment",         color:WB_GREEN,   status:"M",proc:"Proposal & Project Risk Proc SY-QS-PR-02"},
    {fmId:"FM-03A",name:"Proposal Reviewer Allocation",color:WB_BLUE,    status:"M",proc:"Proposal & Proj Review Proc SY-QS-PR-03"},
    {fmId:"FM-04", name:"Proposal Review",             color:WB_GREEN,   status:"M",proc:"Proposal & Proj Review Proc SY-QS-PR-03",locked:true},
    {fmId:"FM-018",name:"Project Initiation Part B",   color:WB_GREEN,   status:"M",proc:"Project Mgmt Workbook Proc SY-QS-PR-01",locked:true},
  ];
  const projectNodes = [
    {fmId:"FM-03B",name:"Project Reviewer Allocation",color:WB_ORANGE,status:"M",proc:"Proposal & Proj Review Proc SY-QS-PR-03",locked:true},
    {fmId:"FM-05", name:"Project Review Plan",        color:WB_ORANGE,status:"M",proc:"Project Mgmt Workbook Proc SY-QS-PR-01",locked:true},
    {fmId:"FM-06", name:"Project Plan",               color:WB_ORANGE,status:"M",proc:"Project Mgmt Workbook Proc SY-QS-PR-01",locked:true},
    {fmId:"FM-07", name:"Safety In Design",           color:WB_ORANGE,status:"M",proc:"Proposal & Proj Review Proc SY-QS-PR-03",locked:true},
    {fmId:"FM-16", name:"Project Review",             color:WB_ORANGE,status:"M",proc:"Project Mgmt Workbook Proc SY-QS-PR-01",locked:true},
    {fmId:"FM-19", name:"Project Closure",            color:WB_ORANGE,status:"M",proc:"Project Mgmt Workbook Proc SY-QS-PR-01"},
  ];
  const ongoingNodes = [
    {id:"FM-18",name:"Client Feedback",status:"N"},
    {id:"FM-17",name:"Document Transmittal",status:"O",locked:true},
    {id:"FM-15",name:"CADD Request",status:"O",locked:true},
    {id:"FM-14",name:"Work Package Plan",status:"O",locked:true},
    {id:"FM-13",name:"Basis Of Design",status:"M"},
    {id:"FM-12",name:"Change Register",status:"M"},
    {id:"FM-11",name:"Change Request",status:"O"},
    {id:"FM-10",name:"Communications Matrix",status:"O"},
    {id:"FM-09",name:"Drawings & Figures Register",status:"M",locked:true},
    {id:"FM-08",name:"Document Register",status:"M",locked:true},
  ];
  const all=[...proposalNodes,...projectNodes,...ongoingNodes];
  const counts={
    total:all.length,
    M:all.filter(n=>n.status==="M").length,
    O:all.filter(n=>n.status==="O").length,
    N:all.filter(n=>n.status==="N").length,
    locked:all.filter(n=>n.locked).length,
  };

  return (
    <div style={{position:"fixed",inset:0,zIndex:9100,background:"#F1F5F9",display:"flex",flexDirection:"column",overflow:"hidden"}}>

      {/* ── Header ── */}
      <div style={{display:"flex",alignItems:"center",flexShrink:0,height:56,background:ATC.bgWhite,borderBottom:`3px solid ${ATC.crimson}`,boxShadow:"0 1px 6px rgba(0,0,0,0.07)",padding:"0 22px",gap:16}}>
        <div style={{display:"flex",alignItems:"center",gap:12,flexShrink:0}}>
          <button onClick={onClose} style={{display:"flex",alignItems:"center",gap:6,padding:"6px 16px",background:ATC.bgWhite,border:`1.5px solid ${ATC.crimson}`,borderRadius:20,color:ATC.crimson,fontSize:12,fontWeight:700,cursor:"pointer",whiteSpace:"nowrap"}}>
            <ArrowLeft size={13}/> Back to Dashboard
          </button>
          <ATCLogo width={100}/>
        </div>
        <div style={{flex:1,display:"flex",alignItems:"center",justifyContent:"center"}}>
          <span style={{color:ATC.textDark,fontSize:15,fontWeight:700,letterSpacing:"0.01em"}}>Project Delivery Workbook – Dashboard</span>
        </div>
        <div style={{display:"flex",flexDirection:"column",alignItems:"flex-end",flexShrink:0,gap:2}}>
          <span style={{color:ATC.textDark,fontSize:12,fontWeight:600}}>{(item.projectNumber||"").replace(/,/g,"")} – {item.siteName||"—"}</span>
          <span style={{color:ATC.textMuted,fontSize:11}}>{(item.projectNumber||"").replace(/,/g,"")} – {item.projectName}</span>
        </div>
      </div>

      {/* ── Body ── */}
      <div style={{flex:1,minHeight:0,overflowY:"auto",padding:"18px 24px",display:"flex",flexDirection:"column",gap:14}}>

        {/* Stats + legend */}
        <div style={{display:"flex",alignItems:"center",gap:10,flexWrap:"wrap"}}>
          <StatPill label="Total Forms"    value={counts.total}  color="#1E293B"/>
          <StatPill label="Mandatory"      value={counts.M}      color={WB_STATUS.M}/>
          <StatPill label="Optional"       value={counts.O}      color={WB_STATUS.O}/>
          <StatPill label="Not Applicable" value={counts.N}      color={WB_STATUS.N}/>
          <StatPill label="Locked"         value={counts.locked} color="#94A3B8"/>
          <div style={{flex:1}}/>
          <div style={{fontSize:10,color:"#94A3B8",fontStyle:"italic"}}>M: Mandatory · O: Optional · N: Not Applicable</div>
        </div>

        {/* ── Proposal Phase ── */}
        <div style={{background:"#fff",borderRadius:12,boxShadow:"0 2px 12px rgba(0,0,0,0.07)",overflow:"hidden",border:"1px solid #EDE7F6"}}>
          <div style={{background:`linear-gradient(135deg,${WB_PURPLE},#7B3FAE)`,padding:"11px 20px",display:"flex",alignItems:"center",gap:10}}>
            <div style={{width:8,height:8,borderRadius:"50%",background:"rgba(255,255,255,0.5)"}}/>
            <span style={{fontSize:12,fontWeight:800,color:"#fff",letterSpacing:"0.07em",textTransform:"uppercase"}}>Proposal Phase</span>
            <span style={{marginLeft:"auto",fontSize:10,color:"rgba(255,255,255,0.65)",fontWeight:500}}>{proposalNodes.length} forms</span>
          </div>
          <div style={{padding:"16px 20px 18px"}}>
            <PhaseFlow nodes={proposalNodes} phaseColor={WB_PURPLE}/>
          </div>
        </div>

        {/* ── Project Phase ── */}
        <div style={{background:"#fff",borderRadius:12,boxShadow:"0 2px 12px rgba(0,0,0,0.07)",overflow:"hidden",border:"1px solid #FFE0CC"}}>
          <div style={{background:`linear-gradient(135deg,${WB_ORANGE},#FF7043)`,padding:"11px 20px",display:"flex",alignItems:"center",gap:10}}>
            <div style={{width:8,height:8,borderRadius:"50%",background:"rgba(255,255,255,0.5)"}}/>
            <span style={{fontSize:12,fontWeight:800,color:"#fff",letterSpacing:"0.07em",textTransform:"uppercase"}}>Project Phase</span>
            <span style={{marginLeft:"auto",fontSize:10,color:"rgba(255,255,255,0.65)",fontWeight:500}}>{projectNodes.length} forms</span>
          </div>
          <div style={{padding:"16px 20px 18px"}}>
            <PhaseFlow nodes={projectNodes} phaseColor={WB_ORANGE}/>
          </div>
        </div>

        {/* ── Ongoing Tasks ── */}
        <div style={{background:"#fff",borderRadius:12,boxShadow:"0 2px 12px rgba(0,0,0,0.07)",overflow:"hidden",border:"1px solid #FEF3C7"}}>
          <div style={{background:"linear-gradient(135deg,#92400E,#D97706)",padding:"11px 20px",display:"flex",alignItems:"center",gap:10}}>
            <div style={{width:8,height:8,borderRadius:"50%",background:"rgba(255,255,255,0.5)"}}/>
            <span style={{fontSize:12,fontWeight:800,color:"#fff",letterSpacing:"0.07em",textTransform:"uppercase"}}>Ongoing Tasks</span>
            <span style={{marginLeft:"auto",fontSize:10,color:"rgba(255,255,255,0.65)",fontWeight:500}}>{ongoingNodes.length} forms</span>
          </div>
          <div style={{padding:"14px 20px 18px",display:"flex",overflowX:"auto",gap:0}}>
            <OngoingGroup label="Client Feedback" nodes={[{id:"FM-18",name:"Client Feedback",status:"N"}]}/>
            <OngoingGroup label="Document Transmittal" nodes={[{id:"FM-17",name:"Document Transmittal",status:"O",locked:true}]}/>
            <OngoingGroup label="CADD Request" nodes={[{id:"FM-15",name:"CADD Request",status:"O",locked:true}]}/>
            <OngoingGroup label="Work Package" nodes={[{id:"FM-14",name:"Work Package Plan",status:"O",locked:true}]}/>
            <OngoingGroup label="Basic of Design" nodes={[{id:"FM-13",name:"Basis Of Design",status:"M"}]}/>
            <OngoingGroup label="Project Communications & Change Management" nodes={[
              {id:"FM-12",name:"Change Register",status:"M"},
              {id:"FM-11",name:"Change Request",status:"O"},
              {id:"FM-10",name:"Communications Matrix",status:"O"},
            ]}/>
            <OngoingGroup label="Document Control (Populated from FM-16)" last nodes={[
              {id:"FM-09",name:"Drawings & Figures Register",status:"M",locked:true},
              {id:"FM-08",name:"Document Register",status:"M",locked:true},
            ]}/>
          </div>
        </div>

      </div>
    </div>
  );
}

// --- Admin Responsibility -------------------------------------------------------
const SETTINGS_RED = new Set(["Jess Hancock","Tracey Nichols","Malena Olguin","Intranet","Hayley Pandelis","Adaora Mmojekwu"]);
const AR_ROLES = ["QMS Admin","QMS FR03 Risk1_2","QMS FR03 Risk3","QMS FR03 Risk4","QMS OM","QMS Contract Reviewers","System Managers","International Contract Reviewers","Northern Reginal Manager","Southern Reginal Manager","Allow Create PDF","Health Check Managers","Change Approvers"];
const AR_LOCATIONS = ["Victoria","Queensland","Sunshine Coast","Western Australia","New South Wales","Tasmania","Peru","All Offices"];
const ADMIN_RESPONSIBILITY_DATA = [
  {name:"Adaora Mmojekwu",location:"Victoria",role:"QMS Admin"},
  {name:"Alex Arroyo",location:"Victoria",role:"QMS Admin"},
  {name:"Faisal Awan",location:"Victoria",role:"QMS Admin"},
  {name:"Hayley Pandelis",location:"Victoria",role:"QMS Admin"},
  {name:"Intranet",location:"Victoria",role:"QMS Admin"},
  {name:"Jess Hancock",location:"Victoria",role:"QMS Admin"},
  {name:"Kara Sinclair",location:"Victoria",role:"QMS Admin"},
  {name:"Malena Olguin",location:"Victoria",role:"QMS Admin"},
  {name:"Alex Arroyo",location:"Queensland",role:"QMS Admin"},
  {name:"Angela Tellan",location:"Queensland",role:"QMS Admin"},
  {name:"Denise Felise",location:"Queensland",role:"QMS Admin"},
  {name:"Ella McCormack",location:"Queensland",role:"QMS Admin"},
  {name:"Keaton Afoa",location:"Queensland",role:"QMS Admin"},
  {name:"Patricio Romero",location:"Queensland",role:"QMS Admin"},
  {name:"Tracey Nichols",location:"Queensland",role:"QMS Admin"},
  {name:"Alex Arroyo",location:"Sunshine Coast",role:"QMS Admin"},
  {name:"Angela Tellan",location:"Sunshine Coast",role:"QMS Admin"},
  {name:"Denise Felise",location:"Sunshine Coast",role:"QMS Admin"},
  {name:"Ella McCormack",location:"Sunshine Coast",role:"QMS Admin"},
  {name:"Keaton Afoa",location:"Sunshine Coast",role:"QMS Admin"},
  {name:"Tracey Nichols",location:"Sunshine Coast",role:"QMS Admin"},
  {name:"Adaora Mmojekwu",location:"Western Australia",role:"QMS Admin"},
  {name:"Alex Arroyo",location:"Western Australia",role:"QMS Admin"},
  {name:"Hayley Pandelis",location:"Western Australia",role:"QMS Admin"},
  {name:"Jess Hancock",location:"Western Australia",role:"QMS Admin"},
  {name:"Malena Olguin",location:"Western Australia",role:"QMS Admin"},
  {name:"Adaora Mmojekwu",location:"New South Wales",role:"QMS Admin"},
  {name:"Alex Arroyo",location:"New South Wales",role:"QMS Admin"},
  {name:"Claire Gluyas",location:"New South Wales",role:"QMS Admin"},
  {name:"Hayley Pandelis",location:"New South Wales",role:"QMS Admin"},
  {name:"Jess Hancock",location:"New South Wales",role:"QMS Admin"},
  {name:"Kara Sinclair",location:"New South Wales",role:"QMS Admin"},
  {name:"Malena Olguin",location:"New South Wales",role:"QMS Admin"},
  {name:"Adaora Mmojekwu",location:"Tasmania",role:"QMS Admin"},
  {name:"Alex Arroyo",location:"Tasmania",role:"QMS Admin"},
  {name:"Claire Gluyas",location:"Tasmania",role:"QMS Admin"},
  {name:"Hayley Pandelis",location:"Tasmania",role:"QMS Admin"},
  {name:"Jess Hancock",location:"Tasmania",role:"QMS Admin"},
  {name:"Kara Sinclair",location:"Tasmania",role:"QMS Admin"},
  {name:"Malena Olguin",location:"Tasmania",role:"QMS Admin"},
  {name:"Alex Arroyo",location:"Peru",role:"QMS Admin"},
  {name:"Jess Hancock",location:"Peru",role:"QMS Admin"},
  {name:"Malena Olguin",location:"Peru",role:"QMS Admin"},
  {name:"Martha Bravo",location:"Peru",role:"QMS Admin"},
  {name:"Alex Arroyo",location:"Victoria",role:"QMS FR03 Risk1_2"},
  {name:"Alex Van Koersveld",location:"Victoria",role:"QMS FR03 Risk1_2"},
  {name:"Craig Noske",location:"Victoria",role:"QMS FR03 Risk1_2"},
  {name:"Alex Arroyo",location:"Queensland",role:"QMS FR03 Risk1_2"},
  {name:"Glenn Platt",location:"Queensland",role:"QMS FR03 Risk1_2"},
  {name:"Alex Arroyo",location:"Sunshine Coast",role:"QMS FR03 Risk1_2"},
  {name:"Joel Eadie",location:"Sunshine Coast",role:"QMS FR03 Risk1_2"},
  {name:"Nick Brown",location:"Sunshine Coast",role:"QMS FR03 Risk1_2"},
  {name:"Alex Arroyo",location:"Western Australia",role:"QMS FR03 Risk1_2"},
  {name:"Colin Jenner",location:"Western Australia",role:"QMS FR03 Risk1_2"},
  {name:"Craig Noske",location:"Western Australia",role:"QMS FR03 Risk1_2"},
  {name:"Intranet",location:"Western Australia",role:"QMS FR03 Risk1_2"},
  {name:"Adin Uhrig",location:"New South Wales",role:"QMS FR03 Risk1_2"},
  {name:"Alex Arroyo",location:"New South Wales",role:"QMS FR03 Risk1_2"},
  {name:"Craig Noske",location:"New South Wales",role:"QMS FR03 Risk1_2"},
  {name:"Glen Burton",location:"New South Wales",role:"QMS FR03 Risk1_2"},
  {name:"Alex Arroyo",location:"Tasmania",role:"QMS FR03 Risk1_2"},
  {name:"Mark Passier",location:"Tasmania",role:"QMS FR03 Risk1_2"},
  {name:"Alex Arroyo",location:"Peru",role:"QMS FR03 Risk1_2"},
  {name:"Roberto Cier",location:"Peru",role:"QMS FR03 Risk1_2"},
  {name:"Alex Arroyo",location:"Victoria",role:"QMS FR03 Risk3"},
  {name:"Craig Noske",location:"Victoria",role:"QMS FR03 Risk3"},
  {name:"Faisal Awan",location:"Victoria",role:"QMS FR03 Risk3"},
  {name:"Kim Morrison",location:"Victoria",role:"QMS FR03 Risk3"},
  {name:"Alex Arroyo",location:"Queensland",role:"QMS FR03 Risk3"},
  {name:"Kim Morrison",location:"Queensland",role:"QMS FR03 Risk3"},
  {name:"Alex Arroyo",location:"Sunshine Coast",role:"QMS FR03 Risk3"},
  {name:"Kim Morrison",location:"Sunshine Coast",role:"QMS FR03 Risk3"},
  {name:"Alex Arroyo",location:"Western Australia",role:"QMS FR03 Risk3"},
  {name:"Craig Noske",location:"Western Australia",role:"QMS FR03 Risk3"},
  {name:"Kim Morrison",location:"Western Australia",role:"QMS FR03 Risk3"},
  {name:"Alex Arroyo",location:"New South Wales",role:"QMS FR03 Risk3"},
  {name:"Craig Noske",location:"New South Wales",role:"QMS FR03 Risk3"},
  {name:"Kim Morrison",location:"New South Wales",role:"QMS FR03 Risk3"},
  {name:"Alex Arroyo",location:"Tasmania",role:"QMS FR03 Risk3"},
  {name:"Craig Noske",location:"Tasmania",role:"QMS FR03 Risk3"},
  {name:"Kim Morrison",location:"Tasmania",role:"QMS FR03 Risk3"},
  {name:"Alex Arroyo",location:"Peru",role:"QMS FR03 Risk3"},
  {name:"Kim Morrison",location:"Peru",role:"QMS FR03 Risk3"},
  {name:"Alex Arroyo",location:"Victoria",role:"QMS FR03 Risk4"},
  {name:"Craig Noske",location:"Victoria",role:"QMS FR03 Risk4"},
  {name:"Faisal Awan",location:"Victoria",role:"QMS FR03 Risk4"},
  {name:"Kim Morrison",location:"Victoria",role:"QMS FR03 Risk4"},
  {name:"Alex Arroyo",location:"Queensland",role:"QMS FR03 Risk4"},
  {name:"Kim Morrison",location:"Queensland",role:"QMS FR03 Risk4"},
  {name:"Alex Arroyo",location:"Sunshine Coast",role:"QMS FR03 Risk4"},
  {name:"Kim Morrison",location:"Sunshine Coast",role:"QMS FR03 Risk4"},
  {name:"Alex Arroyo",location:"Western Australia",role:"QMS FR03 Risk4"},
  {name:"Craig Noske",location:"Western Australia",role:"QMS FR03 Risk4"},
  {name:"Kim Morrison",location:"Western Australia",role:"QMS FR03 Risk4"},
  {name:"Alex Arroyo",location:"New South Wales",role:"QMS FR03 Risk4"},
  {name:"Craig Noske",location:"New South Wales",role:"QMS FR03 Risk4"},
  {name:"Kim Morrison",location:"New South Wales",role:"QMS FR03 Risk4"},
  {name:"Alex Arroyo",location:"Tasmania",role:"QMS FR03 Risk4"},
  {name:"Craig Noske",location:"Tasmania",role:"QMS FR03 Risk4"},
  {name:"Kim Morrison",location:"Tasmania",role:"QMS FR03 Risk4"},
  {name:"Alex Arroyo",location:"Peru",role:"QMS FR03 Risk4"},
  {name:"Kim Morrison",location:"Peru",role:"QMS FR03 Risk4"},
  {name:"Alex Arroyo",location:"Victoria",role:"QMS OM"},
  {name:"Alex Van Koersveld",location:"Victoria",role:"QMS OM"},
  {name:"Claire Weaver",location:"Victoria",role:"QMS OM"},
  {name:"Craig Noske",location:"Victoria",role:"QMS OM"},
  {name:"Alex Arroyo",location:"Queensland",role:"QMS OM"},
  {name:"Claire Weaver",location:"Queensland",role:"QMS OM"},
  {name:"Glenn Platt",location:"Queensland",role:"QMS OM"},
  {name:"Alex Arroyo",location:"Sunshine Coast",role:"QMS OM"},
  {name:"Claire Weaver",location:"Sunshine Coast",role:"QMS OM"},
  {name:"Joel Eadie",location:"Sunshine Coast",role:"QMS OM"},
  {name:"Nick Brown",location:"Sunshine Coast",role:"QMS OM"},
  {name:"Alex Arroyo",location:"Western Australia",role:"QMS OM"},
  {name:"Claire Weaver",location:"Western Australia",role:"QMS OM"},
  {name:"Colin Jenner",location:"Western Australia",role:"QMS OM"},
  {name:"Craig Noske",location:"Western Australia",role:"QMS OM"},
  {name:"Adin Uhrig",location:"New South Wales",role:"QMS OM"},
  {name:"Alex Arroyo",location:"New South Wales",role:"QMS OM"},
  {name:"Claire Weaver",location:"New South Wales",role:"QMS OM"},
  {name:"Craig Noske",location:"New South Wales",role:"QMS OM"},
  {name:"Glen Burton",location:"New South Wales",role:"QMS OM"},
  {name:"Alex Arroyo",location:"Tasmania",role:"QMS OM"},
  {name:"Claire Weaver",location:"Tasmania",role:"QMS OM"},
  {name:"Mark Passier",location:"Tasmania",role:"QMS OM"},
  {name:"Alex Arroyo",location:"Peru",role:"QMS OM"},
  {name:"Roberto Cier",location:"Peru",role:"QMS OM"},
  {name:"Alex Arroyo",location:"Victoria",role:"QMS Contract Reviewers"},
  {name:"Claire Weaver",location:"Victoria",role:"QMS Contract Reviewers"},
  {name:"Craig Noske",location:"Victoria",role:"QMS Contract Reviewers"},
  {name:"Glenn Platt",location:"Victoria",role:"QMS Contract Reviewers"},
  {name:"Alex Arroyo",location:"Queensland",role:"QMS Contract Reviewers"},
  {name:"Claire Weaver",location:"Queensland",role:"QMS Contract Reviewers"},
  {name:"Lee Rigley",location:"Queensland",role:"QMS Contract Reviewers"},
  {name:"Rowan Cossins",location:"Queensland",role:"QMS Contract Reviewers"},
  {name:"Steve Robertson",location:"Queensland",role:"QMS Contract Reviewers"},
  {name:"Alex Arroyo",location:"Sunshine Coast",role:"QMS Contract Reviewers"},
  {name:"Claire Weaver",location:"Sunshine Coast",role:"QMS Contract Reviewers"},
  {name:"Lee Rigley",location:"Sunshine Coast",role:"QMS Contract Reviewers"},
  {name:"Nick Brown",location:"Sunshine Coast",role:"QMS Contract Reviewers"},
  {name:"Rowan Cossins",location:"Sunshine Coast",role:"QMS Contract Reviewers"},
  {name:"Steve Robertson",location:"Sunshine Coast",role:"QMS Contract Reviewers"},
  {name:"Alex Arroyo",location:"Western Australia",role:"QMS Contract Reviewers"},
  {name:"Claire Weaver",location:"Western Australia",role:"QMS Contract Reviewers"},
  {name:"Craig Noske",location:"Western Australia",role:"QMS Contract Reviewers"},
  {name:"Glenn Platt",location:"Western Australia",role:"QMS Contract Reviewers"},
  {name:"Alex Arroyo",location:"New South Wales",role:"QMS Contract Reviewers"},
  {name:"Claire Weaver",location:"New South Wales",role:"QMS Contract Reviewers"},
  {name:"Craig Noske",location:"New South Wales",role:"QMS Contract Reviewers"},
  {name:"Glen Burton",location:"New South Wales",role:"QMS Contract Reviewers"},
  {name:"John Milsom",location:"New South Wales",role:"QMS Contract Reviewers"},
  {name:"Alex Arroyo",location:"Tasmania",role:"QMS Contract Reviewers"},
  {name:"Claire Weaver",location:"Tasmania",role:"QMS Contract Reviewers"},
  {name:"Craig Noske",location:"Tasmania",role:"QMS Contract Reviewers"},
  {name:"Mark Passier",location:"Tasmania",role:"QMS Contract Reviewers"},
  {name:"Alex Arroyo",location:"Peru",role:"QMS Contract Reviewers"},
  {name:"Arash Roshdieh",location:"Peru",role:"QMS Contract Reviewers"},
  {name:"Adaora Mmojekwu",location:"All Offices",role:"System Managers"},
  {name:"Alex Arroyo",location:"All Offices",role:"System Managers"},
  {name:"Alex Van Koersveld",location:"All Offices",role:"System Managers"},
  {name:"Angela Tellan",location:"All Offices",role:"System Managers"},
  {name:"Claire Gluyas",location:"All Offices",role:"System Managers"},
  {name:"Denise Felise",location:"All Offices",role:"System Managers"},
  {name:"Elaine Fisher",location:"All Offices",role:"System Managers"},
  {name:"Ella McCormack",location:"All Offices",role:"System Managers"},
  {name:"Faisal Awan",location:"All Offices",role:"System Managers"},
  {name:"Hayley Pandelis",location:"All Offices",role:"System Managers"},
  {name:"Intranet",location:"All Offices",role:"System Managers"},
  {name:"Jess Hancock",location:"All Offices",role:"System Managers"},
  {name:"Laura Tipping",location:"All Offices",role:"System Managers"},
  {name:"Malena Olguin",location:"All Offices",role:"System Managers"},
  {name:"Alex Arroyo",location:"All Offices",role:"International Contract Reviewers"},
  {name:"Arash Roshdieh",location:"All Offices",role:"International Contract Reviewers"},
  {name:"Alex Arroyo",location:"All Offices",role:"Northern Reginal Manager"},
  {name:"Glenn Platt",location:"All Offices",role:"Northern Reginal Manager"},
  {name:"Alex Arroyo",location:"All Offices",role:"Southern Reginal Manager"},
  {name:"Craig Noske",location:"All Offices",role:"Southern Reginal Manager"},
  {name:"Adaora Mmojekwu",location:"All Offices",role:"Allow Create PDF"},
  {name:"Alex Arroyo",location:"All Offices",role:"Allow Create PDF"},
  {name:"Claire Gluyas",location:"All Offices",role:"Allow Create PDF"},
  {name:"Faisal Awan",location:"All Offices",role:"Allow Create PDF"},
  {name:"Intranet",location:"All Offices",role:"Allow Create PDF"},
  {name:"Sam Wijayasinha",location:"All Offices",role:"Allow Create PDF"},
  {name:"Adaora Mmojekwu",location:"All Offices",role:"Health Check Managers"},
  {name:"Alex Arroyo",location:"All Offices",role:"Health Check Managers"},
  {name:"Alex Van Koersveld",location:"All Offices",role:"Health Check Managers"},
  {name:"Angela Tellan",location:"All Offices",role:"Health Check Managers"},
  {name:"Claire Gluyas",location:"All Offices",role:"Health Check Managers"},
  {name:"Craig Noske",location:"All Offices",role:"Health Check Managers"},
  {name:"Darren Watt",location:"All Offices",role:"Health Check Managers"},
  {name:"Denise Felise",location:"All Offices",role:"Health Check Managers"},
  {name:"Elaine Fisher",location:"All Offices",role:"Health Check Managers"},
  {name:"Ella McCormack",location:"All Offices",role:"Health Check Managers"},
  {name:"Intranet",location:"All Offices",role:"Health Check Managers"},
  {name:"John Milsom",location:"All Offices",role:"Health Check Managers"},
  {name:"Keaton Afoa",location:"All Offices",role:"Health Check Managers"},
  {name:"Luisa Luengas",location:"All Offices",role:"Health Check Managers"},
  {name:"Molly Moll",location:"All Offices",role:"Health Check Managers"},
  {name:"Nick Brown",location:"All Offices",role:"Health Check Managers"},
  {name:"Alex Arroyo",location:"All Offices",role:"Change Approvers"},
  {name:"Ella McCormack",location:"All Offices",role:"Change Approvers"},
  {name:"Intranet",location:"All Offices",role:"Change Approvers"},
  {name:"Jess Hancock",location:"All Offices",role:"Change Approvers"},
  {name:"Malena Olguin",location:"All Offices",role:"Change Approvers"},
];

function AdminResponsibilityPage({onClose}) {
  const [data, setData] = useState(ADMIN_RESPONSIBILITY_DATA);
  const [filterRole, setFilterRole] = useState("All");
  const [filterLoc, setFilterLoc] = useState("All");
  const [form, setForm] = useState(null);

  const visibleLocs = filterLoc==="All" ? AR_LOCATIONS : [filterLoc];
  const visibleRoles = filterRole==="All" ? AR_ROLES : [filterRole];
  const filtered = data.filter(d=>(filterRole==="All"||d.role===filterRole)&&(filterLoc==="All"||d.location===filterLoc));

  function openNew() { setForm({mode:"new",name:"",location:AR_LOCATIONS[0],role:AR_ROLES[0]}); }
  function openEdit(d) { setForm({mode:"edit",idx:d.idx,name:d.name,location:d.location,role:d.role}); }
  function saveForm() {
    if (!form.name.trim()) return;
    if (form.mode==="new") setData(prev=>[...prev,{name:form.name.trim(),location:form.location,role:form.role}]);
    else setData(prev=>prev.map((item,i)=>i===form.idx?{name:form.name.trim(),location:form.location,role:form.role}:item));
    setForm(null);
  }
  function deleteEntry() { setData(prev=>prev.filter((_,i)=>i!==form.idx)); setForm(null); }

  return (
    <div style={{position:"fixed",inset:0,zIndex:9600,background:"#D4D5D8",display:"flex",flexDirection:"column",overflow:"hidden"}}>
      {form&&(
        <div style={{position:"fixed",inset:0,zIndex:9700,background:"rgba(0,0,0,0.45)",display:"flex",alignItems:"center",justifyContent:"center"}}>
          <div style={{background:"#fff",borderRadius:12,width:440,boxShadow:"0 20px 60px rgba(0,0,0,0.3)",overflow:"hidden"}}>
            <div style={{background:ATC.crimson,padding:"0 18px",height:44,display:"flex",alignItems:"center",justifyContent:"space-between"}}>
              <div style={{display:"flex",alignItems:"center",gap:10}}>
                <div style={{width:3,height:16,background:"rgba(255,255,255,0.6)",borderRadius:2}}/>
                <span style={{color:"#fff",fontSize:14,fontWeight:700}}>{form.mode==="new"?"New Admin Entry":"Edit Admin Entry"}</span>
              </div>
              <button onClick={()=>setForm(null)} style={{height:26,padding:"0 12px",display:"flex",alignItems:"center",gap:5,background:"#fff",border:"none",borderRadius:5,color:ATC.crimson,fontSize:11,fontWeight:700,cursor:"pointer"}}>
                <X size={12}/> Close
              </button>
            </div>
            <div style={{padding:24,background:"#D4D5D8",display:"flex",flexDirection:"column",gap:14}}>
              <div>
                <div style={{fontSize:10,fontWeight:800,color:ATC.textDark,textTransform:"uppercase",letterSpacing:"0.07em",marginBottom:5}}>Name</div>
                <input value={form.name} onChange={e=>setForm(f=>({...f,name:e.target.value}))} placeholder="Enter full name..."
                  style={{width:"100%",height:36,padding:"0 10px",borderRadius:6,border:`1px solid ${ATC.border}`,fontSize:13,outline:"none",boxSizing:"border-box",background:"#fff"}}/>
              </div>
              <div>
                <div style={{fontSize:10,fontWeight:800,color:ATC.textDark,textTransform:"uppercase",letterSpacing:"0.07em",marginBottom:5}}>Location</div>
                <select value={form.location} onChange={e=>setForm(f=>({...f,location:e.target.value}))}
                  style={{width:"100%",height:36,padding:"0 8px",borderRadius:6,border:`1px solid ${ATC.border}`,fontSize:13,outline:"none",background:"#fff",cursor:"pointer"}}>
                  {AR_LOCATIONS.map(l=><option key={l} value={l}>{l}</option>)}
                </select>
              </div>
              <div>
                <div style={{fontSize:10,fontWeight:800,color:ATC.textDark,textTransform:"uppercase",letterSpacing:"0.07em",marginBottom:5}}>Admin Role</div>
                <select value={form.role} onChange={e=>setForm(f=>({...f,role:e.target.value}))}
                  style={{width:"100%",height:36,padding:"0 8px",borderRadius:6,border:`1px solid ${ATC.border}`,fontSize:13,outline:"none",background:"#fff",cursor:"pointer"}}>
                  {AR_ROLES.map(r=><option key={r} value={r}>{r}</option>)}
                </select>
              </div>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginTop:4}}>
                {form.mode==="edit"
                  ? <button onClick={deleteEntry} style={{padding:"8px 16px",background:"#fff",border:"1.5px solid #c62828",borderRadius:6,color:"#c62828",fontSize:12,fontWeight:700,cursor:"pointer"}}>Delete Entry</button>
                  : <div/>}
                <div style={{display:"flex",gap:8}}>
                  <button onClick={()=>setForm(null)} style={{padding:"8px 16px",background:"#fff",border:`1px solid ${ATC.border}`,borderRadius:6,color:ATC.textMuted,fontSize:12,fontWeight:600,cursor:"pointer"}}>Cancel</button>
                  <button onClick={saveForm} style={{padding:"8px 22px",background:ATC.crimson,border:"none",borderRadius:6,color:"#fff",fontSize:12,fontWeight:700,cursor:"pointer"}}>Save</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      <div style={{background:ATC.crimson,padding:"0 20px",height:48,display:"flex",alignItems:"center",justifyContent:"space-between",flexShrink:0,gap:16}}>
        <div style={{display:"flex",alignItems:"center",gap:10}}>
          <div style={{width:3,height:18,background:"rgba(255,255,255,0.6)",borderRadius:2,flexShrink:0}}/>
          <span style={{color:"#fff",fontSize:17,fontWeight:700,letterSpacing:"0.01em"}}>Admin Responsibility</span>
        </div>
        <div style={{display:"flex",alignItems:"center",gap:10,flexShrink:0}}>
          <button onClick={openNew} style={{height:28,padding:"0 14px",display:"flex",alignItems:"center",gap:6,background:"rgba(255,255,255,0.15)",border:"1.5px solid #fff",borderRadius:6,color:"#fff",fontSize:12,fontWeight:700,cursor:"pointer",flexShrink:0}}>
            <Plus size={13}/> New Admin
          </button>
          <select value={filterRole} onChange={e=>setFilterRole(e.target.value)}
            style={{height:28,padding:"0 8px",borderRadius:5,border:"none",fontSize:12,fontWeight:600,cursor:"pointer",background:"rgba(255,255,255,0.15)",color:"#fff",outline:"none"}}>
            <option value="All" style={{color:ATC.textDark}}>All Roles</option>
            {AR_ROLES.map(r=><option key={r} value={r} style={{color:ATC.textDark}}>{r}</option>)}
          </select>
          <select value={filterLoc} onChange={e=>setFilterLoc(e.target.value)}
            style={{height:28,padding:"0 8px",borderRadius:5,border:"none",fontSize:12,fontWeight:600,cursor:"pointer",background:"rgba(255,255,255,0.15)",color:"#fff",outline:"none"}}>
            <option value="All" style={{color:ATC.textDark}}>All Locations</option>
            {AR_LOCATIONS.map(l=><option key={l} value={l} style={{color:ATC.textDark}}>{l}</option>)}
          </select>
          <button onClick={onClose} style={{height:28,padding:"0 14px",display:"flex",alignItems:"center",gap:6,background:"#fff",border:"none",borderRadius:6,color:ATC.crimson,fontSize:12,fontWeight:700,cursor:"pointer",flexShrink:0}}>
            <X size={13}/> Close
          </button>
        </div>
      </div>
      <div style={{flex:1,overflowY:"auto",padding:20}}>
        <div style={{background:"#fff",borderRadius:10,overflow:"hidden",border:`1px solid ${ATC.border}`,boxShadow:"0 4px 16px rgba(0,0,0,0.08)"}}>
          <table style={{borderCollapse:"collapse",width:"100%",tableLayout:"fixed"}}>
            <thead>
              <tr style={{background:ATC.crimson}}>
                <th style={{padding:"10px 16px",textAlign:"left",color:"#fff",fontSize:11,fontWeight:700,textTransform:"uppercase",letterSpacing:"0.07em",width:180,borderRight:"1px solid rgba(255,255,255,0.2)"}}>Admin Role</th>
                {visibleLocs.map((loc,i)=>(
                  <th key={loc} style={{padding:"10px 12px",textAlign:"left",color:"#fff",fontSize:11,fontWeight:700,textTransform:"uppercase",letterSpacing:"0.07em",borderRight:i<visibleLocs.length-1?"1px solid rgba(255,255,255,0.2)":"none"}}>{loc}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {visibleRoles.map((role,ri)=>(
                <tr key={role} style={{background:ri%2===0?"#fff":"#f5f5f7",verticalAlign:"top"}}>
                  <td style={{padding:"10px 16px",fontSize:12,fontWeight:700,color:ATC.crimson,borderRight:`1px solid ${ATC.border}`,borderBottom:`1px solid ${ATC.border}`,whiteSpace:"nowrap"}}>{role}</td>
                  {visibleLocs.map((loc,li)=>{
                    const entries = data.map((d,idx)=>({...d,idx})).filter(d=>d.role===role&&d.location===loc);
                    return (
                      <td key={loc} style={{padding:"8px 12px",fontSize:12,borderRight:li<visibleLocs.length-1?`1px solid ${ATC.border}`:"none",borderBottom:`1px solid ${ATC.border}`}}>
                        {entries.length>0 ? entries.map(d=>(
                          <div key={d.idx} onClick={()=>openEdit(d)}
                            style={{display:"flex",alignItems:"center",gap:5,cursor:"pointer",padding:"2px 5px",borderRadius:4,margin:"1px -5px",transition:"background 0.1s"}}
                            onMouseEnter={e=>{e.currentTarget.style.background="#f0f4ff";const s=e.currentTarget.querySelector('.ei');if(s)s.style.opacity="1";}}
                            onMouseLeave={e=>{e.currentTarget.style.background="transparent";const s=e.currentTarget.querySelector('.ei');if(s)s.style.opacity="0";}}>
                            <span style={{color:SETTINGS_RED.has(d.name)?ATC.crimson:ATC.blue,fontWeight:SETTINGS_RED.has(d.name)?700:400,lineHeight:1.5}}>{d.name}</span>
                            <svg className="ei" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke={ATC.blue} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{opacity:0,flexShrink:0,transition:"opacity 0.15s"}}>
                              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                            </svg>
                          </div>
                        )) : <span style={{color:"#ccc",fontSize:11}}>—</span>}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div style={{marginTop:10,fontSize:11,color:ATC.textMuted,textAlign:"right"}}>{filtered.length} assignments · click any name to edit</div>
      </div>
    </div>
  );
}

// --- Dashboard Page -----------------------------------------------------------
function DashboardPage({summary,onNewJob}) {
  const [oppPage,setOppPage]=useState(1);
  const [appPage,setAppPage]=useState(1);
  const [oppSearch,setOppSearch]=useState("");
  const [pendSearch,setPendSearch]=useState("");
  const [selectedItem,setSelectedItem]=useState(null);
  const [selectedPendItem,setSelectedPendItem]=useState(null);
  const [selectedMasterItem,setSelectedMasterItem]=useState(null);
  const [showAdminResp,setShowAdminResp]=useState(false);
  const [workbookItem,setWorkbookItem]=useState(null);
  const DASH_PAGE_SIZE=10;
  const filteredOpp=MOCK_OPPORTUNITIES.filter(o=>!oppSearch||
    o.projectName.toLowerCase().includes(oppSearch.toLowerCase())||
    (o.siteName||"").toLowerCase().includes(oppSearch.toLowerCase())||
    (o.projectNumber||"").toLowerCase().includes(oppSearch.toLowerCase()));
  const oppItems=[...filteredOpp].sort((a,b)=>b.id-a.id).slice((oppPage-1)*DASH_PAGE_SIZE,oppPage*DASH_PAGE_SIZE);
  const oppPages=Math.ceil(filteredOpp.length/DASH_PAGE_SIZE);

  const filteredPend=MOCK_PENDING.filter(o=>!pendSearch||
    o.projectName.toLowerCase().includes(pendSearch.toLowerCase())||
    (o.siteName||"").toLowerCase().includes(pendSearch.toLowerCase())||
    (o.projectNumber||"").toLowerCase().includes(pendSearch.toLowerCase()))
    .sort((a,b)=>b.id-a.id);
  const pendItems=filteredPend.slice((appPage-1)*DASH_PAGE_SIZE,appPage*DASH_PAGE_SIZE);
  const pendPages=Math.ceil(filteredPend.length/DASH_PAGE_SIZE);

  const idCell=(o)=>(
    <button onClick={()=>setSelectedMasterItem(o)} style={{background:"none",border:"none",padding:0,cursor:"pointer",color:ATC.crimson,fontWeight:800,fontSize:12,textDecoration:"underline",textDecorationStyle:"dotted",textUnderlineOffset:3}}>
      #{o.id}
    </button>
  );
  const pendIdCell=(o)=>(
    <button onClick={e=>{e.stopPropagation();setSelectedPendItem(o);}} style={{background:"none",border:"none",padding:0,cursor:"pointer",color:ATC.crimson,fontWeight:800,fontSize:12,textDecoration:"underline",textDecorationStyle:"dotted",textUnderlineOffset:3}}>
      #{o.id}
    </button>
  );

  return <div>
    {showAdminResp&&<AdminResponsibilityPage onClose={()=>setShowAdminResp(false)}/>}
    {workbookItem&&<ProjectWorkbookDashboardPage item={workbookItem} onClose={()=>setWorkbookItem(null)}/>}
    {selectedPendItem&&<PendingWorkbookPage item={selectedPendItem} onClose={()=>setSelectedPendItem(null)}/>}
    {selectedMasterItem&&<RecordDetailModal item={selectedMasterItem} onClose={()=>setSelectedMasterItem(null)}/>}
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:20,flexWrap:"wrap",gap:10}}>
      <PageTitle title="QMS"/>
      <div style={{display:"flex",alignItems:"center",gap:8,alignSelf:"flex-start"}}>
        <button onClick={()=>setShowAdminResp(true)} title="Admin Responsibility" style={{display:"flex",alignItems:"center",justifyContent:"center",width:36,height:36,background:ATC.bgWhite,border:`1.5px solid ${ATC.crimson}`,borderRadius:8,cursor:"pointer",color:ATC.crimson,boxShadow:"0 1px 4px rgba(0,0,0,0.08)"}}>
          <Settings size={16}/>
        </button>
        <button onClick={onNewJob} style={{display:"flex",alignItems:"center",gap:7,padding:"9px 20px",background:ATC.crimson,color:"#fff",border:"none",borderRadius:8,fontSize:13,fontWeight:700,cursor:"pointer",boxShadow:`0 3px 10px ${ATC.crimson}55`}}>
          <Plus size={15}/> New Jobs
        </button>
      </div>
    </div>

    {/* Summary cards */}
    <div style={{display:"flex",flexWrap:"wrap",gap:10,marginBottom:22}}>
      <SummaryCard label="Total Opportunities" value={summary.totalOpportunities} icon={Briefcase}    bg={ATC.blue}    sub={`${summary.activeOpportunities} active`}/>
      <SummaryCard label="Pending Approvals"   value={summary.pendingApprovals}   icon={AlertCircle}  bg={ATC.amber}/>
      <SummaryCard label="Approved"            value={summary.approvedOpportunities} icon={CheckCircle} bg={ATC.green}/>
      <SummaryCard label="Unique Clients"      value={summary.uniqueClients}      icon={Users}        bg={ATC.purple}/>
      <SummaryCard label="Closed"              value={summary.closedOpportunities} icon={XCircle}     bg={ATC.slate}/>
    </div>

    {/* -- Pending Approvals -- */}
    <SectionTable
      title="Pending Approvals" subtitle={`${filteredPend.length} of ${MOCK_PENDING.length} awaiting approval - ID descending`}
      search={<SearchBar value={pendSearch} onChange={v=>{setPendSearch(v);setAppPage(1);}} placeholder="Search by project name, site name or project number..."/>}
      headers={["ID v","Project Name","Site Name","Project Number","Sub-Project Name","Sub-Project Number","Status","Created"]}
      rows={pendItems.map((o,i)=>[
        pendIdCell(o),
        <span style={{color:ATC.textDark,fontWeight:600}}>{o.projectName}</span>,
        <span style={{color:ATC.textMid,fontSize:12}}>{o.siteName||"-"}</span>,
        <span style={{color:ATC.textMid,fontSize:12,whiteSpace:"nowrap"}}>{o.projectNumber?o.projectNumber.replace(/,/g,""):"-"}</span>,
        <span style={{color:ATC.textMid,fontSize:12}}>{o.subProjectName||"-"}</span>,
        <span style={{color:ATC.textMid,fontSize:12,whiteSpace:"nowrap"}}>{o.subProjectNumber||"-"}</span>,
        <span style={{padding:"2px 8px",borderRadius:4,fontSize:10,fontWeight:700,background:o.projectStatus===0?ATC.blueLight:ATC.slateLight,color:o.projectStatus===0?ATC.blue:ATC.slate,textTransform:"uppercase"}}>{o.projectStatus===0?"Active":"Closed"}</span>,
        <span style={{color:ATC.textMuted,fontSize:11,whiteSpace:"nowrap"}}>{new Date(o.createdAt).toLocaleDateString("en-AU")}</span>,
      ])} page={appPage} totalPages={pendPages} onChange={setAppPage} total={filteredPend.length}
      onRowClick={i=>setWorkbookItem(pendItems[i])}/>

    {/* -- QMS Master -- */}
    <SectionTable
      title="QMS Master" subtitle={`${filteredOpp.length.toLocaleString()} records - ID descending`}
      search={<SearchBar value={oppSearch} onChange={v=>{setOppSearch(v);setOppPage(1);}} placeholder="Search by project name, site name or project number..."/>}
      headers={["ID v","Project Name","Site Name","Project Number","Sub-Project Name","Sub-Project Number","Status","Created"]}
      rows={oppItems.map((o,i)=>[
        pendIdCell(o),
        <span style={{color:ATC.textDark,fontWeight:600}}>{o.projectName}</span>,
        <span style={{color:ATC.textMid,fontSize:12}}>{o.siteName||"-"}</span>,
        <span style={{color:ATC.textMid,fontSize:12,whiteSpace:"nowrap"}}>{o.projectNumber?o.projectNumber.replace(/,/g,""):"-"}</span>,
        <span style={{color:ATC.textMid,fontSize:12}}>{o.subProjectName||"-"}</span>,
        <span style={{color:ATC.textMid,fontSize:12,whiteSpace:"nowrap"}}>{o.subProjectNumber||"-"}</span>,
        <span style={{padding:"2px 8px",borderRadius:4,fontSize:10,fontWeight:700,background:o.projectStatus===0?ATC.blueLight:ATC.slateLight,color:o.projectStatus===0?ATC.blue:ATC.slate,textTransform:"uppercase"}}>{o.projectStatus===0?"Active":"Closed"}</span>,
        <span style={{color:ATC.textMuted,fontSize:11,whiteSpace:"nowrap"}}>{new Date(o.createdAt).toLocaleDateString("en-AU")}</span>,
      ])} page={oppPage} totalPages={oppPages} onChange={setOppPage} total={filteredOpp.length}/>

  </div>;
}

// --- Reusable section table ---------------------------------------------------
function SectionTable({title,subtitle,headers,rows,page,totalPages,onChange,total,search,onRowClick}) {
  return <div style={{marginBottom:28}}>
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-end",marginBottom:10,flexWrap:"wrap",gap:8}}>
      <div>
        <div style={{display:"flex",alignItems:"center",gap:8}}>
          <div style={{width:3,height:18,background:ATC.crimson,borderRadius:2}}/>
          <h2 style={{margin:0,fontSize:16,fontWeight:800,color:ATC.textDark}}>{title}</h2>
        </div>
        <p style={{margin:"2px 0 0 11px",fontSize:12,color:ATC.textMuted}}>{subtitle}</p>
      </div>
      {search}
    </div>
    <div style={{background:ATC.bgWhite,borderRadius:10,border:`1px solid ${ATC.border}`,overflow:"hidden"}}>
      <div style={{overflowX:"auto"}}>
        <table style={{width:"100%",borderCollapse:"collapse",fontSize:13}}>
          <thead><tr style={{background:ATC.bg,borderBottom:`2px solid ${ATC.border}`}}>{headers.map(h=><TH key={h}>{h}</TH>)}</tr></thead>
          <tbody>
            {rows.map((cells,i)=>(
              <tr key={i}
                onClick={onRowClick ? ()=>onRowClick(i) : undefined}
                style={{borderBottom:`1px solid ${ATC.bg}`,background:i%2===0?ATC.bgWhite:"#FAFAFA",cursor:onRowClick?"pointer":"default",transition:"background 0.1s"}}
                onMouseEnter={onRowClick?e=>{e.currentTarget.style.background="#EEF3FF";}:undefined}
                onMouseLeave={onRowClick?e=>{e.currentTarget.style.background=i%2===0?ATC.bgWhite:"#FAFAFA";}:undefined}>
                {cells.map((cell,j)=><td key={j} style={{padding:"9px 13px",verticalAlign:"middle"}}>{cell}</td>)}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div style={{borderTop:`1px solid ${ATC.bg}`,display:"flex",justifyContent:"space-between",alignItems:"center",padding:"0 14px",flexWrap:"wrap",gap:8}}>
        {total!=null
          ? <span style={{fontSize:12,color:ATC.textMuted,padding:"10px 0"}}>Showing {(page-1)*PAGE_SIZE+1}–{Math.min(page*PAGE_SIZE,total)} of {total.toLocaleString()}</span>
          : <span style={{fontSize:12,color:ATC.textMuted,padding:"10px 0"}}>{rows.length.toLocaleString()} records</span>}
        {total!=null && <Pagination page={page} totalPages={totalPages} onChange={onChange}/>}
      </div>
    </div>
  </div>;
}

// --- Stable form helpers (defined OUTSIDE NewJobForm so React never remounts them) ---
const FormCtx=createContext(null);
const fInpStyle={width:"100%",padding:"8px 11px",border:`1px solid ${ATC.border}`,borderRadius:7,fontSize:13,color:ATC.textDark,background:ATC.bgWhite,outline:"none",boxSizing:"border-box"};
const FL=({label,required,info,children})=>(
  <div style={{marginBottom:16}}>
    <label style={{display:"block",fontSize:12,fontWeight:700,color:ATC.textMid,marginBottom:5,textTransform:"uppercase",letterSpacing:"0.04em"}}>
      {label}{required&&<span style={{color:ATC.crimson,marginLeft:3}}>*</span>}
      {info&&<span style={{marginLeft:4,width:14,height:14,borderRadius:"50%",border:`1px solid ${ATC.textMuted}`,display:"inline-flex",alignItems:"center",justifyContent:"center",fontSize:9,color:ATC.textMuted,cursor:"help",verticalAlign:"middle"}}>i</span>}
    </label>
    {children}
  </div>
);
const FI=({field,...rest})=>{
  const {form,set}=useContext(FormCtx);
  return <input value={form[field]||""} onChange={e=>set(field,e.target.value)} style={fInpStyle} {...rest}/>;
};
const FS=({field,opts,ph,xStyle})=>{
  const {form,set}=useContext(FormCtx);
  return(
    <select value={form[field]||""} onChange={e=>set(field,e.target.value)} style={{...fInpStyle,cursor:"pointer",...(xStyle||{})}}>
      <option value="">{ph||""}</option>
      {(opts||[]).map(o=><option key={o} value={o}>{o}</option>)}
    </select>
  );
};

// --- New Job Request Form (FM-01A) ---------------------------------------------
function NewJobForm({onBack,isMobile}) {
  const [saving,setSaving]=useState(false);
  const [saved,setSaved]=useState(false);
  const [validationErrors,setValidationErrors]=useState([]);
  const [newMasterIdCreated,setNewMasterIdCreated]=useState(null);
  const [showLookup,setShowLookup]=useState(false);
  const [lookupNum,setLookupNum]=useState("");
  const [lookupFound,setLookupFound]=useState(null);
  const [lookupSubNum,setLookupSubNum]=useState("");
  const [lookupSuggestions,setLookupSuggestions]=useState([]);
  const [lookupFm01a,setLookupFm01a]=useState(null);
  const [siteSuggestions,setSiteSuggestions]=useState([]);
  const [showNewContactModal,setShowNewContactModal]=useState(false);
  const [showNewClientModal,setShowNewClientModal]=useState(false);
  const [showNewRateInput,setShowNewRateInput]=useState(false);
  const [newRateValue,setNewRateValue]=useState("");
  const [showPRModal,setShowPRModal]=useState(false);
  const [form,setForm]=useState({
    isRelatedToExisting:"no", existingSite:"", siteName:"", siteShortName:"",
    projectNumber:"", subProjectNumber:"", projectDescriptor:"", projectManager:"",
    tentativeStartDate:"", tentativeEndDate:"",
    labTesting:"", mechanicalEngineering:"", siteWork:"", seismicHazard:"",
    feeCurrency:"AUD", estimatedProjectFee:"", probabilityOfSuccess:"", estimatedProposalValue:"",
    scopeOfWork:"",
    projectCategory:"",
    feeType:"", projectStatus:"", defaultRateGroup:"", invoiceCurrency:"", invoiceCurrencyOther:"",
    specificRates:"", taxRule:"", subjectToLocalBuy:"", commodity:"", projectType:"", office:"",
    technicalCommunities:"",
    siteAddressLine1:"", siteAddressLine2:"", siteSuburb:"", siteState:"", sitePostCode:"", siteCountry:"",
    clientCompanyId:"", clientABN:"", clientAddressLine1:"", clientAddressLine2:"",
    clientSuburb:"", clientState:"", clientCountry:"", clientPhone:"", clientEmail:"", clientWebSite:"",
    contactName:"", contactSalutation:"", contactPosition:"", contactPhone:"", contactMobile:"",
    contactEmail:"", atcLink:"", sourcedContactAt:"",
    officeForSubmission:"",
  });

  const set=(k,v)=>setForm(f=>({...f,[k]:v}));

  function handleRelatedChange(val) {
    set("isRelatedToExisting",val);
    if(val==="yes") {
      setLookupNum(""); setLookupFound(null); setLookupSubNum("");
      setLookupSuggestions([]); setLookupFm01a(null); setShowLookup(true);
    }
  }

  function handleLookupSearch(q) {
    setLookupNum(q);
    setLookupFound(null);
    setLookupSubNum("");
    if(!q.trim()){setLookupSuggestions([]);return;}
    const term=q.trim().toLowerCase();
    // Strip commas so "120083" matches stored "120,083"
    const termNoComma=term.replace(/,/g,"");
    const seen=new Set();
    const hits=[];
    for(const o of MOCK_OPPORTUNITIES){
      if(hits.length>=8) break;
      if(seen.has(o.projectNumber)) continue;
      const numNoComma=o.projectNumber.replace(/,/g,"").toLowerCase();
      if(numNoComma.includes(termNoComma)||
         o.projectNumber.toLowerCase().includes(term)||
         o.projectName.toLowerCase().includes(term)||
         (o.createdBy||"").toLowerCase().includes(term)||
         (o.projectManagerName||"").toLowerCase().includes(term)){
        seen.add(o.projectNumber);
        hits.push(o);
      }
    }
    setLookupSuggestions(hits);
  }

  function handleSelectSuggestion(opp) {
    setLookupNum(opp.projectNumber);
    const parent=MOCK_OPPORTUNITIES.find(o=>o.projectNumber===opp.projectNumber)||opp;
    setLookupFound(parent);
    setLookupSubNum("");
    setLookupSuggestions([]);
    setLookupFm01a(MOCK_FM01A.find(r=>r.idMaster===parent.id)||null);
  }

  function handleSubProjectChange(subId) {
    setLookupSubNum(subId);
    if(!subId){return;}
    const sub=MOCK_OPPORTUNITIES.find(o=>String(o.id)===subId);
    if(sub){
      setLookupFound(sub);
      setLookupFm01a(MOCK_FM01A.find(r=>r.idMaster===sub.id)||null);
    }
  }

  function handleValidate() {
    if(!lookupFound) return;
    const qmsMatch=MOCK_OPPORTUNITIES.find(
      o=>o.projectNumber===lookupFound.projectNumber&&(o.siteName||o.siteShortName)
    )||lookupFound;
    const fm=lookupFm01a||MOCK_FM01A.find(r=>r.idMaster===lookupFound.id)||null;
    const v=(a,b)=>a||b;  // pick first truthy
    // Strip zero-width spaces (U+200B/C/D), BOM (U+FEFF), soft-hyphen (U+00AD), then trim
    const clean=s=>s?String(s).replace(/[​‌‍﻿­]/g,"").trim():"";
    // Only apply a value if it exists in the dropdown options list
    const opt=(val,opts,fallback)=>{
      if(!val) return fallback;
      const t=clean(val);
      return opts.includes(t)?t:fallback;
    };
    // Normalise FM01A specificRates — strip invisible chars
    const normSpecificRates=raw=>clean(raw);
    // Normalise FM01A projectType: strip invisible chars + trailing "?"
    const normProjectType=raw=>clean(raw).replace(/\?$/,"");
    const RATE_OPTS=["ATCW 2026 Rate","Glencore GCAA UA","MMG MSA","Yancoal MSA","Iluka FSA C6683","MACH Energy - Mt Pleasant Ops","Cleanaway MCA","AngloAmerican MSA","BHP MAC EoR","Bloomfield Group","Evolution EOR Contract MRO005","K92 Rate","Las Bambas","Newmont","Peabody Wambo Coal","Pilgangoora (2078-PSA-PILOP)","QCoal","PRNC C3908","Century Mine – MSA (CML-2025-150)","Southern Cross Operations Ltd (SCOL006287)","2026 International Rates – AUD","2026 International Rates – USD","Antapaccay USD (Job No. 250877)","Ti Tree Cell 8 CQA (240466 ONLY)","Maaden 23-MGBM-087","Local Buy 2026","NQM Gold Pajingo PJO-0051","New Rate","Oceana Gold"];
    const SPEC_OPTS=["Yes","No"];
    const FEE_OPTS= ["Hourly / Cost Rate","Capped Rates","Fixed Fee","No Billing"];
    const STAT_OPTS=["Proposal","Active","Prospect","Non Billable"];
    const TAX_OPTS= ["10% Tax Applicable","Tax Free","Peru - 18% IGV"];
    const CURR_OPTS=["Australian Dollar (AUD)","US Dollar (USD)","Peruvian Sol (PEN)","Other (Please specify)"];
    const LB_OPTS=  ["Yes","No","Not Applicable"];
    const COMM_OPTS=["Iron Ore / Magnetite","Coal","Gold","Copper","Aluminium","Zinc","Mineral Sands","Lead","Silver","Lithium","Uranium","Nickel","Graphite","Tin","Diamond","Tungsten","Vanadium","Manganese","Phosphate","Other/Not Mining"];
    const PT_OPTS=  ["TC1 Tailings Management","TC2 Resources Recovery","TC3 Landfill Engineering","TC4 Dam Break Modelling","TC5 Dams Engineering","TC6 Water Resources","TC7 Hydraulics & Structural Engineering","TC8 Hydrogeology","TC9 Materials Characterisation","TC10 Geotechnical Investigation","TC11 Slurry & Mechanical Eng","TC12 Construction Support & Management","TC13 Governance & Risks","TC14 Seismic Hazard","TC15 Engineer of Record","TC16 Ground Engineering","TC17 Numerical Modelling","TC18 Closure and Rehabilitation","TC19 CAD","TC20 Project Management","TC21 Geosynthetics"];
    const OFF_OPTS= ["New South Wales","Queensland","Victoria","Western Australia","Sunshine Coast","Tasmania","Peru"];
    const resolvedShortName=v(qmsMatch.siteShortName,v(lookupFound.siteShortName,""));
    const siteRec=resolvedShortName
      ?MOCK_SITES.find(s=>s.title.toLowerCase()===resolvedShortName.toLowerCase())
      :null;
    // Client lookup: 1) idClient direct match, 2) FM01A companyName, 3) MOCK_OPPORTUNITIES clientName
    const clientRec=
      (lookupFound.idClient&&MOCK_CLIENTS.find(c=>c.id===lookupFound.idClient))
      ||(fm&&clean(fm.companyName)&&MOCK_CLIENTS.find(c=>c.companyName.toLowerCase()===clean(fm.companyName).toLowerCase()))
      ||(lookupFound.clientName&&MOCK_CLIENTS.find(c=>c.companyName.toLowerCase()===lookupFound.clientName.toLowerCase()))
      ||null;
    setForm(f=>({
      ...f,
      existingSite:   "Yes",
      siteName:       v(qmsMatch.siteName,v(lookupFound.siteName,f.siteName)),
      siteShortName:  resolvedShortName||f.siteShortName,
      projectManager: v(fm&&fm.projectManager,v(lookupFound.projectManagerName,f.projectManager)),
      // Site Address — populated from QMS Site Names via siteShortName → title lookup
      ...(siteRec&&{
        siteAddressLine1: siteRec.streetLine1||f.siteAddressLine1,
        siteAddressLine2: siteRec.streetLine2||f.siteAddressLine2,
        siteSuburb:       siteRec.site_Suburb_Town||f.siteSuburb,
        siteState:        siteRec.siteLocation||f.siteState,
        sitePostCode:     siteRec.site_PostCode||f.sitePostCode,
        siteCountry:      siteRec.siteCountry||f.siteCountry,
      }),
      // Client / Company — populated from Clients table via clientName match
      ...(clientRec&&{
        clientCompanyId:   String(clientRec.id),
        clientABN:         clientRec.companyABN||f.clientABN,
        clientAddressLine1:clientRec.companyAddressLine1||f.clientAddressLine1,
        clientAddressLine2:clientRec.companyAddressLine2||f.clientAddressLine2,
        clientSuburb:      clientRec.companySuburb||f.clientSuburb,
        clientState:       clientRec.companyState||f.clientState,
        clientCountry:     clientRec.companyCountry||f.clientCountry,
        clientPhone:       clientRec.companyPhone||f.clientPhone,
        clientEmail:       clientRec.companyEmailAddress||f.clientEmail,
        clientWebSite:     clientRec.companyWebSite||f.clientWebSite,
      }),
      // Primary Contact — FM01A contact fields first, then first contact from Client Contacts table
      ...(()=>{
        const fmContact=fm&&clean(fm.contactName)?{
          contactName:      clean(fm.contactName),
          contactSalutation:clean(fm.contactSalutation)||"",
          contactPosition:  clean(fm.contactPosition)||"",
          contactPhone:     clean(fm.contactPhone)||"",
          contactMobile:    clean(fm.contactMobile)||"",
          contactEmail:     clean(fm.contactEmail)||"",
          atcLink:          clean(fm.atcLink)||"",
          sourcedContactAt: clean(fm.sourcedContactAt)||"",
        }:null;
        const ccRec=clientRec
          ?MOCK_CLIENT_CONTACTS.find(x=>x.clientId===clientRec.id)
          :null;
        const ct=fmContact||(ccRec?{
          contactName:      ccRec.contactName,
          contactSalutation:ccRec.contactSalutation||"",
          contactPosition:  ccRec.contactPosition||"",
          contactPhone:     ccRec.contactPhone||"",
          contactMobile:    ccRec.contactMobile||"",
          contactEmail:     ccRec.contactEmail?.trim()||"",
          atcLink:          ccRec.atcLink||"",
          sourcedContactAt: ccRec.sourcedContactAt||"",
        }:null);
        return ct||{};
      })(),
      // Financial Estimates
      feeCurrency:           v(fm&&fm.projectFeeCurrency,f.feeCurrency),
      estimatedProjectFee:   v(fm&&fm.estimatedProjectFeeValue,f.estimatedProjectFee),
      probabilityOfSuccess:  fm&&fm.probabilityOfSuccess!=null?String(fm.probabilityOfSuccess):f.probabilityOfSuccess,
      estimatedProposalValue:v(fm&&fm.estimatedProposalValue,f.estimatedProposalValue),
      // Project Specific Requirements
      // Project Specific Requirements
      labTesting:           opt(fm&&clean(fm.labTestingRequired),            ["Yes","No"],f.labTesting),
      mechanicalEngineering:opt(fm&&clean(fm.mechanicalEngineeringRequired), ["Yes","No"],f.mechanicalEngineering),
      siteWork:             opt(fm&&clean(fm.siteWorkDesc),                  ["Yes","No"],f.siteWork),
      seismicHazard:        opt(fm&&clean(fm.seismicHazardIntegrityRequired),["Yes","No"],f.seismicHazard),
      projectCategory:      v(fm&&fm.projectCategory,f.projectCategory),
      // General Details — validate each value against its dropdown options before applying
      feeType:              opt(fm&&fm.feeType,          FEE_OPTS,  f.feeType),
      projectStatus:        opt(fm&&fm.subProjectStatus, STAT_OPTS, f.projectStatus),
      defaultRateGroup:     opt(fm&&fm.practiseStaffRate,RATE_OPTS, f.defaultRateGroup),
      invoiceCurrency:      opt(fm&&fm.invoiceCurrency,  CURR_OPTS, f.invoiceCurrency),
      specificRates:        opt(fm&&normSpecificRates(fm.specificRates), SPEC_OPTS, f.specificRates),
      taxRule:              opt(fm&&fm.taxRule,           TAX_OPTS,  f.taxRule),
      subjectToLocalBuy:    opt(fm&&fm.subjectToLocalBuy,LB_OPTS,   f.subjectToLocalBuy),
      commodity:            opt(fm&&fm.commodity,         COMM_OPTS, f.commodity),
      projectType:          opt(fm&&normProjectType(fm.projectType), PT_OPTS, f.projectType),
      office:               opt(fm&&fm.officeForFormSubmission, OFF_OPTS, f.office),
      officeForSubmission:  opt(fm&&fm.officeForFormSubmission, OFF_OPTS, f.officeForSubmission),
      technicalCommunities: opt(fm&&fm.multipleTechnicalCommunities, PT_OPTS, f.technicalCommunities),
    }));
    setLookupSuggestions([]);
    setLookupFm01a(null);
    setShowLookup(false);
  }

  function handleSiteShortNameChange(val) {
    set("siteShortName",val);
    if(!val.trim()){setSiteSuggestions([]);return;}
    const term=val.toLowerCase();
    setSiteSuggestions(
      MOCK_SITES.filter(s=>s.title.toLowerCase().includes(term)).slice(0,6)
    );
  }

  function handleSiteSelect(s) {
    setForm(f=>({
      ...f,
      siteShortName:    s.title,
      siteName:         s.siteName||f.siteName,
      siteAddressLine1: s.streetLine1||f.siteAddressLine1,
      siteAddressLine2: s.streetLine2||f.siteAddressLine2,
      siteSuburb:       s.site_Suburb_Town||f.siteSuburb,
      siteState:        s.siteLocation||f.siteState,
      sitePostCode:     s.site_PostCode||f.sitePostCode,
      siteCountry:      s.siteCountry||f.siteCountry,
    }));
    setSiteSuggestions([]);
  }

  // ── style (matches dashboard design system) ──────────────
  const CARD={background:ATC.bgWhite,borderRadius:10,border:`1px solid ${ATC.border}`,padding:"20px 24px",marginBottom:16};
  const ST=(title,sub)=>(
    <div style={{marginBottom:16,paddingBottom:12,borderBottom:`2px solid ${ATC.crimsonPale}`}}>
      <div style={{display:"flex",alignItems:"center",gap:8}}>
        <div style={{width:3,height:16,background:ATC.crimson,borderRadius:2,flexShrink:0}}/>
        <h3 style={{margin:0,fontSize:15,fontWeight:800,color:ATC.textDark}}>{title}</h3>
      </div>
      {sub&&<p style={{margin:"3px 0 0 11px",fontSize:11,color:ATC.textMuted}}>{sub}</p>}
    </div>
  );
  const fInp=fInpStyle;
  const G=(cols)=>({display:"grid",gridTemplateColumns:isMobile?"1fr":`repeat(${cols},1fr)`,gap:"0 16px"});
  const YN=["Yes","No"];
  const RATE_GROUPS=["ATCW 2026 Rate","Glencore GCAA UA","MMG MSA","Yancoal MSA","Iluka FSA C6683","MACH Energy - Mt Pleasant Ops","Cleanaway MCA","AngloAmerican MSA","BHP MAC EoR","Bloomfield Group","Evolution EOR Contract MRO005","K92 Rate","Las Bambas","Newmont","Peabody Wambo Coal","Pilgangoora (2078-PSA-PILOP)","QCoal","PRNC C3908","Century Mine – MSA (CML-2025-150)","Southern Cross Operations Ltd (SCOL006287)","2026 International Rates – AUD","2026 International Rates – USD","Antapaccay USD (Job No. 250877)","Ti Tree Cell 8 CQA (240466 ONLY)","Maaden 23-MGBM-087","Local Buy 2026","NQM Gold Pajingo PJO-0051","New Rate","Oceana Gold"];
  const SPECIFIC_RATES=["Yes","No"];
  const PROJ_CATS=["Standard","EOR","ITRB – On Board","ITRB – Individual"];
  const LOCAL_BUY=["Yes","No","Not Applicable"];
  const PMS=["Zoran Kovacev","Colin Jenner","Tony Marszalek","Craig Noske","Ralph Holding","John Milsom","James Parker","Gavin Reeves","Nick Brown","Peter Reid","Dilum Fernando","Kathy Tehrani","Alex Arroyo","Darren Pemberton","Michael Munro","Amit Hans"];

  const estProposalFee=(()=>{
    const fee=parseFloat((form.estimatedProjectFee||"").replace(/[^0-9.]/g,""));
    const prob=parseFloat(form.probabilityOfSuccess||"");
    const pct=parseFloat(form.estimatedProposalValue||"");
    const curr=form.feeCurrency||"AUD";
    if(!isNaN(fee)&&!isNaN(prob)&&!isNaN(pct))
      return `${curr}$ ${(fee*prob*pct).toLocaleString("en-AU",{minimumFractionDigits:2,maximumFractionDigits:2})}`;
    return `${curr}$ —`;
  })();

  async function handleSubmit() {
    // --- Validate required fields ---
    const errs=[];
    if(form.isRelatedToExisting==="yes"&&!form.existingSite) errs.push("Existing Site");
    if(!form.siteName)              errs.push("Site Name");
    if(!form.projectDescriptor)     errs.push("Project Descriptor");
    if(!form.projectManager)        errs.push("Project Manager");
    if(!form.tentativeStartDate)    errs.push("Tentative Start Date");
    if(!form.tentativeEndDate)      errs.push("Tentative End Date");
    if(!form.labTesting)            errs.push("Laboratory Testing");
    if(!form.mechanicalEngineering) errs.push("Mechanical Engineering Components");
    if(!form.siteWork)              errs.push("Site Work");
    if(!form.seismicHazard)         errs.push("Seismic Hazard Integrity Services");
    if(!form.estimatedProjectFee)   errs.push("Estimated Project Fee Value");
    if(!form.probabilityOfSuccess)  errs.push("Probability of Success");
    if(!form.estimatedProposalValue)errs.push("Estimated Proposal Value");
    if(!form.scopeOfWork)           errs.push("Scope of Work");
    if(!form.projectCategory)       errs.push("Project Category");
    if(!form.feeType)               errs.push("Fee Type");
    if(!form.projectStatus)         errs.push("Project Status");
    if(!showNewRateInput&&!form.defaultRateGroup) errs.push("Default Rate Group");
    if(showNewRateInput&&!newRateValue)           errs.push("New Rate Group");
    if(!form.invoiceCurrency)       errs.push("Invoice Currency");
    if(form.invoiceCurrency==="Other (Please specify)"&&!form.invoiceCurrencyOther) errs.push("Invoice Currency — please specify");
    if(!form.specificRates)         errs.push("Specific Rate(s)");
    if(!form.taxRule)               errs.push("Tax Rule");
    if(!form.subjectToLocalBuy)     errs.push("Subject to Local Buy");
    if(!form.commodity)             errs.push("Commodity");
    if(!form.projectType)           errs.push("Project Type (Technical Community)");
    if(!form.office)                errs.push("Office");
    if(!form.siteAddressLine1)      errs.push("Site Address Line 1");
    if(!form.siteSuburb)            errs.push("Site Suburb / Town");
    if(!form.siteState)             errs.push("Site Location");
    if(!form.sitePostCode)          errs.push("Site Post Code");
    if(!form.siteCountry)           errs.push("Site Country");
    if(!form.clientCompanyId)       errs.push("Client / Company Name");
    if(!form.contactName)           errs.push("Contact Name");
    if(!form.officeForSubmission)   errs.push("Office for Form Submission");
    if(errs.length>0){
      setValidationErrors(errs);
      window.scrollTo({top:0,behavior:"smooth"});
      return;
    }
    setValidationErrors([]);
    setSaving(true);
    await new Promise(r=>setTimeout(r,800));

    try {
    // --- Create QMS Master record ---
    const maxId=MOCK_OPPORTUNITIES.reduce((m,o)=>o.id>m?o.id:m,0);
    const newMasterId=maxId+1;
    const now=new Date().toISOString();
    const nowStr=new Date().toLocaleString("en-AU");
    const rateGroup=showNewRateInput?newRateValue:form.defaultRateGroup;
    const effectiveCurrency=form.invoiceCurrency==="Other (Please specify)"?form.invoiceCurrencyOther:form.invoiceCurrency;
    const clientRec=MOCK_CLIENTS.find(c=>String(c.id)===form.clientCompanyId)||null;

    const masterRecord={
      id:newMasterId,
      projectName:form.projectDescriptor,
      projectNumber:form.projectNumber||"",
      subProjectName:form.projectDescriptor,
      subProjectNumber:form.subProjectNumber||"",
      idClient:form.clientCompanyId?Number(form.clientCompanyId):null,
      siteName:form.siteName,
      siteShortName:form.siteShortName||"",
      officeForFormSubmission:form.officeForSubmission,
      projectStatus:0,
      v5:null,
      createdBy:"Dilum Fernando",
      projectManagerName:form.projectManager,
      subProjectManagerName:"",
      createdAt:now,
      modifiedAt:now,
      clientName:clientRec?.companyName||"",
      fm01A_ApprovalStatus:"Pending",
      fm01A_ApprovedBy:"",fm01A_ApprovedDate:"",
      fm01A_OM_ApprovalStatus:"",fm01A_OM_ApprovedBy:"",fm01A_OM_ApprovedDate:"",fm01A_OM_Recommendations:"",
      fm01B_ApprovalStatus:"",fm01B_ApprovedBy:"",fm01B_ApprovedDate:"",
      fm19_ClosedBy:"",fm19_ClosedDate:"",
    };
    MOCK_OPPORTUNITIES.unshift(masterRecord);
    try{ const s=JSON.parse(localStorage.getItem('qms_submitted_opps')||'[]');s.push(masterRecord);localStorage.setItem('qms_submitted_opps',JSON.stringify(s)); }catch(e){}

    // --- Create FM-01A record ---
    const maxFm01aId=MOCK_FM01A.reduce((m,o)=>o.id>m?o.id:m,0);
    const fm01aRecord={
      id:maxFm01aId+1,
      idMaster:newMasterId,
      probabilityOfSuccess:parseFloat(form.probabilityOfSuccess)||0,
      projectManager:form.projectManager,
      subProjectManager:"",
      estimatedProjectFeeValue:form.estimatedProjectFee?`$${parseFloat(form.estimatedProjectFee.replace(/[^0-9.]/g,"")).toLocaleString("en-AU",{minimumFractionDigits:2,maximumFractionDigits:2})}`:"",
      estimatedProposalValue:form.estimatedProposalValue||"",
      estimatedProposalFee:"",
      existingProject:form.isRelatedToExisting==="yes"?"Yes":"No",
      labTestingRequired:form.labTesting,
      scopeOfWork:form.scopeOfWork,
      feeType:form.feeType,
      subProjectStatus:form.projectStatus,
      practiseStaffRate:rateGroup,
      taxRule:form.taxRule,
      specificRates:form.specificRates,
      subjectToLocalBuy:form.subjectToLocalBuy,
      categoryList:form.projectCategory,
      commodity:form.commodity,
      practiseCostCentre:"",
      projectType:form.projectType,
      multipleTechnicalCommunities:form.technicalCommunities||"",
      companyName:clientRec?.companyName||"",
      abn:form.clientABN||"",
      addressLine1:form.clientAddressLine1||"",
      addressLine2:form.clientAddressLine2||"",
      suburb:form.clientSuburb||"",
      state:form.clientState||"",
      postCode:"",
      country:form.clientCountry||"",
      phoneNumber:form.clientPhone||"",
      emailAddress:form.clientEmail||"",
      companyWebSite:form.clientWebSite||"",
      contactName:form.contactName||"",
      contactSalutation:form.contactSalutation||"",
      contactPosition:form.contactPosition||"",
      contactPhone:form.contactPhone||"",
      contactMobile:form.contactMobile||"",
      contactEmail:form.contactEmail||"",
      atcLink:form.atcLink||"",
      sourcedContactAt:form.sourcedContactAt||"",
      submittedByEmail:"dilumf@atcwilliams.com.au",
      submittedByName:"Dilum Fernando",
      submittedDateTime:nowStr,
      projectManagerEmail:"",
      subProjectManagerEmail:"",
      tentativeProjectStartDate:form.tentativeStartDate||"",
      tentativeProjectEndDate:form.tentativeEndDate||"",
      practiseStaffRateNew:showNewRateInput?newRateValue:"",
      createdAt:nowStr,
      modifiedAt:nowStr,
      siteWorkRequired:"",
      mechanicalDesignRequired:"",
      siteName:form.siteName||"",
      siteShortName:form.siteShortName||"",
      invoiceCurrency:effectiveCurrency,
      streetLine1:form.siteAddressLine1||"",
      streetLine2:form.siteAddressLine2||"",
      siteSuburb:form.siteSuburb||"",
      siteState:form.siteState||"",
      siteCountry:form.siteCountry||"",
      sitePostCode:form.sitePostCode||"",
      siteLatitude:"",siteLongitude:"",
      mechanicalEngineeringRequired:form.mechanicalEngineering||"",
      siteWorkDesc:form.siteWork||"",
      projectCategory:form.projectCategory||"",
      projectRelatedTo:form.isRelatedToExisting==="yes"?form.existingSite:"",
      isExistingProject:form.isRelatedToExisting==="yes"?"Yes":"No",
      officeForFormSubmission:form.officeForSubmission||"",
      notApplicable:"",
      projectFeeCurrency:form.feeCurrency||"",
      seismicHazardIntegrityRequired:form.seismicHazard||"",
      office:form.office||"",
    };
    MOCK_FM01A.unshift(fm01aRecord);
    try{ const s=JSON.parse(localStorage.getItem('qms_submitted_fm01a')||'[]');s.push(fm01aRecord);localStorage.setItem('qms_submitted_fm01a',JSON.stringify(s)); }catch(e){}

    setSaving(false);
    setNewMasterIdCreated(newMasterId);
    setSaved(true);
    } catch(err) {
      console.error("Submit error:",err);
      setSaving(false);
      setValidationErrors(["Submission failed: "+err.message]);
      window.scrollTo({top:0,behavior:"smooth"});
    }
  }
  function handleClear(){setForm(f=>Object.fromEntries(Object.keys(f).map(k=>[k,""])));}

  if(saved) return (
    <div style={{minHeight:"60vh",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:16,textAlign:"center",padding:32}}>
      <div style={{width:64,height:64,borderRadius:"50%",background:ATC.greenLight,display:"flex",alignItems:"center",justifyContent:"center"}}><CheckCircle size={32} color={ATC.green}/></div>
      <h2 style={{margin:0,fontSize:22,fontWeight:800,color:ATC.textDark}}>Opportunity Submitted</h2>
      {newMasterIdCreated&&(
        <div style={{padding:"10px 24px",background:ATC.blueLight,borderRadius:8,border:`1px solid ${ATC.blue}33`}}>
          <span style={{fontSize:13,color:ATC.blue,fontWeight:600}}>QMS Master ID: </span>
          <span style={{fontSize:16,fontWeight:800,color:ATC.blue}}>#{newMasterIdCreated}</span>
        </div>
      )}
      <p style={{margin:0,fontSize:14,color:ATC.textMuted,maxWidth:400}}>Your FM-01A Opportunity Initiation form has been submitted successfully. The Operations Manager will be notified for approval.</p>
      <button onClick={onBack} style={{display:"flex",alignItems:"center",gap:8,padding:"10px 24px",background:ATC.crimson,color:"#fff",border:"none",borderRadius:8,fontSize:14,fontWeight:700,cursor:"pointer"}}>
        <ArrowLeft size={16}/> Back to Dashboard
      </button>
    </div>
  );

  const secBtn={display:"flex",alignItems:"center",gap:6,padding:"7px 14px",background:ATC.bgWhite,border:`1px solid ${ATC.border}`,borderRadius:7,fontSize:13,color:ATC.textMid,cursor:"pointer",fontWeight:500};
  const priBtn=(dis)=>({padding:"9px 22px",background:dis?"#9CA3AF":ATC.crimson,color:"#fff",border:"none",borderRadius:7,fontSize:13,fontWeight:700,cursor:dis?"not-allowed":"pointer",boxShadow:dis?"none":`0 2px 8px ${ATC.crimson}44`});

  return (
    <FormCtx.Provider value={{form,set}}>
    <>
    {/* ── LOOKUP MODAL ───────────────────────────────────── */}
    {showLookup&&(
      <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.5)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:9999}}>
        <div style={{background:ATC.bgWhite,borderRadius:12,border:`1px solid ${ATC.border}`,width:680,maxWidth:"95vw",overflow:"hidden",boxShadow:"0 16px 48px rgba(0,0,0,0.2)"}}>
          {/* modal header */}
          <div style={{background:ATC.crimson,padding:"12px 18px",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
            <div style={{display:"flex",alignItems:"center",gap:10}}>
              <div style={{width:3,height:16,background:"rgba(255,255,255,0.6)",borderRadius:2}}/>
              <span style={{color:"#fff",fontWeight:700,fontSize:15}}>Lookup Project Details</span>
            </div>
            <button onClick={()=>setShowLookup(false)} style={{background:"rgba(255,255,255,0.1)",border:`1px solid rgba(255,255,255,0.3)`,borderRadius:6,width:28,height:28,display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",padding:0}}>
              <X size={14} color="#fff"/>
            </button>
          </div>
          {/* modal body */}
          <div style={{padding:"20px 24px",background:"#D4D5D8",display:"grid",gridTemplateColumns:"160px 1fr",gap:"12px 12px",alignItems:"start"}}>
            {/* Project Number */}
            <label style={{fontSize:12,fontWeight:700,color:ATC.textMid,textTransform:"uppercase",letterSpacing:"0.04em",paddingTop:9,display:"flex",alignItems:"center",gap:3}}>
              <span style={{color:ATC.crimson}}>*</span>Project Number
            </label>
            <div style={{position:"relative"}}>
              <span style={{position:"absolute",left:7,top:9,fontSize:13,color:"#666",pointerEvents:"none",zIndex:1}}>🔍</span>
              <input value={lookupNum} onChange={e=>handleLookupSearch(e.target.value)}
                placeholder="Search by Project Number or Name"
                autoComplete="off"
                style={{...fInp,paddingLeft:26,border:`2px solid ${ATC.border}`}}/>
              {lookupSuggestions.length>0&&(
                <div style={{position:"absolute",top:"100%",left:0,right:0,background:"#fff",border:`1px solid ${ATC.border}`,borderTop:"none",zIndex:10,maxHeight:220,overflowY:"auto",boxShadow:"0 4px 12px rgba(0,0,0,0.15)"}}>
                  {lookupSuggestions.map(o=>(
                    <div key={o.id} onClick={()=>handleSelectSuggestion(o)}
                      style={{padding:"7px 10px",cursor:"pointer",borderBottom:"1px solid #e8e8e8",display:"flex",flexDirection:"column",gap:1}}
                      onMouseEnter={e=>e.currentTarget.style.background="#EEF3FF"}
                      onMouseLeave={e=>e.currentTarget.style.background=ATC.bgWhite}>
                      <div style={{display:"flex",gap:8,alignItems:"center"}}>
                        <span style={{fontWeight:700,fontSize:12,color:ATC.crimson,flexShrink:0}}>{o.projectNumber}</span>
                        <span style={{fontSize:12,color:ATC.textDark,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{o.projectName}</span>
                      </div>
                      <div style={{fontSize:11,color:ATC.textMuted,display:"flex",gap:10}}>
                        <span>PM: {o.projectManagerName}</span>
                        <span>· {o.officeForFormSubmission}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            {/* Project Name */}
            <label style={{fontSize:12,fontWeight:700,color:ATC.textMid,textTransform:"uppercase",letterSpacing:"0.04em",paddingTop:9}}>Project Name</label>
            <input value={lookupFound?.projectName||""} readOnly placeholder="Auto-filled from QMS Master"
              style={{...fInp,background:ATC.bg,color:lookupFound?ATC.textDark:ATC.textMuted}}/>
            {/* Sub Project Number — hidden for V5 projects */}
            {!(lookupFound?.v5==="1")&&<>
            <label style={{fontSize:12,fontWeight:700,color:ATC.textMid,textTransform:"uppercase",letterSpacing:"0.04em",paddingTop:9,display:"flex",alignItems:"center",gap:3}}>
              <span style={{color:ATC.crimson}}>*</span>Sub Project No.
            </label>
            <select value={lookupSubNum} onChange={e=>handleSubProjectChange(e.target.value)}
              style={{...fInp,cursor:"pointer",background:lookupFound?ATC.bgWhite:ATC.bg}}>
              <option value="">Select Sub Project Number</option>
              {lookupFound&&MOCK_OPPORTUNITIES
                .filter(o=>o.projectNumber===lookupFound.projectNumber)
                .map(o=>(
                  <option key={o.id} value={String(o.id)}>
                    {lookupFound.projectNumber}.{o.subProjectNumber} — {o.subProjectName}
                  </option>
                ))
              }
            </select>
            </>}
            {/* Sub Project Name */}
            <label style={{fontSize:12,fontWeight:700,color:ATC.textMid,textTransform:"uppercase",letterSpacing:"0.04em",paddingTop:9}}>Sub Project Name</label>
            <input value={lookupFound?.subProjectName||""} readOnly placeholder="Auto-filled from selected sub project"
              style={{...fInp,background:ATC.bg,color:lookupFound?ATC.textDark:ATC.textMuted}}/>
            {/* Client Name */}
            <label style={{fontSize:12,fontWeight:700,color:ATC.textMid,textTransform:"uppercase",letterSpacing:"0.04em",paddingTop:9}}>Client Name</label>
            <input value={lookupFound?(lookupFound.clientName||lookupFm01a?.companyName||""):""} readOnly placeholder="Auto-filled"
              style={{...fInp,background:ATC.bg,color:lookupFound?ATC.textDark:ATC.textMuted}}/>
            {/* Project Manager */}
            <label style={{fontSize:12,fontWeight:700,color:ATC.textMid,textTransform:"uppercase",letterSpacing:"0.04em",paddingTop:9}}>Project Manager</label>
            <input value={lookupFound?.projectManagerName||""} readOnly placeholder="Auto-filled"
              style={{...fInp,background:ATC.bg,color:lookupFound?ATC.textDark:ATC.textMuted}}/>
            {/* Validate button row */}
            <div/>
            <div style={{display:"flex",justifyContent:"flex-end",paddingTop:4}}>
              <button onClick={handleValidate} disabled={!lookupFound}
                style={{display:"flex",alignItems:"center",gap:7,padding:"9px 22px",background:lookupFound?ATC.blue:"#9CA3AF",color:"#fff",border:"none",borderRadius:7,fontSize:13,fontWeight:700,cursor:lookupFound?"pointer":"not-allowed",boxShadow:lookupFound?`0 2px 8px ${ATC.blue}44`:"none"}}>
                <CheckCircle size={14}/> Validate &amp; Apply
              </button>
            </div>
          </div>
        </div>
      </div>
    )}

    {/* ── PAGE HEADER ─────────────────────────────────────── */}
    <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:20,flexWrap:"wrap"}}>
      <button onClick={onBack} style={{...secBtn,color:ATC.crimson,border:`1px solid ${ATC.crimson}`}}><ArrowLeft size={14}/> Back to Dashboard</button>
      <div>
        <div style={{display:"flex",alignItems:"center",gap:9}}>
          <div style={{width:4,height:22,background:ATC.crimson,borderRadius:2,flexShrink:0}}/>
          <h1 style={{margin:0,fontSize:20,fontWeight:800,color:ATC.textDark,letterSpacing:"-0.02em"}}>New Job Request — FM-01A</h1>
        </div>
        <p style={{margin:"2px 0 0 13px",fontSize:12,color:ATC.textMuted}}>Opportunity Initiation Form · SY-QS-FM-01A REV 8</p>
      </div>
      <div style={{marginLeft:"auto",display:"flex",gap:6}}>
        <span style={{padding:"3px 10px",background:ATC.blueLight,color:ATC.blue,borderRadius:5,fontSize:11,fontWeight:700}}>QMS SY-QS-FM-01A</span>
        <button onClick={()=>setShowPRModal(true)} style={{padding:"3px 10px",background:"transparent",color:ATC.crimson,borderRadius:5,fontSize:11,fontWeight:700,border:`1px solid ${ATC.crimson}`,cursor:"pointer"}}>SY-QS-PR-01</button>
      </div>
    </div>

    {/* ── VALIDATION ERRORS ───────────────────────────────── */}
    {validationErrors.length>0&&(
      <div style={{background:"#FEF2F2",border:"1px solid #FECACA",borderRadius:10,padding:"14px 18px",marginBottom:16}}>
        <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:8}}>
          <div style={{width:20,height:20,borderRadius:"50%",background:ATC.crimson,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
            <span style={{color:"#fff",fontSize:12,fontWeight:800}}>!</span>
          </div>
          <span style={{fontWeight:700,fontSize:13,color:ATC.crimsonDark}}>Please fill in all required fields before submitting ({validationErrors.length} missing):</span>
        </div>
        <div style={{display:"flex",flexWrap:"wrap",gap:"4px 12px"}}>
          {validationErrors.map((e,i)=>(
            <span key={i} style={{fontSize:12,color:ATC.crimsonDark,background:"#FEE2E2",padding:"2px 8px",borderRadius:4}}>• {e}</span>
          ))}
        </div>
      </div>
    )}

    {/* ── NOTICE ──────────────────────────────────────────── */}
    <div style={{...CARD,background:ATC.blueLight,border:`1px solid ${ATC.blue}22`,padding:"12px 20px",marginBottom:16}}>
      <p style={{margin:0,textAlign:"center",fontSize:13,fontWeight:600,color:ATC.blue}}>This form should be completed for all new opportunities in order to assign a project number.</p>
      <p style={{margin:"3px 0 0",textAlign:"center",fontSize:12,color:ATC.blue}}>Once a contract is awarded, please complete Part B — <strong>SY-QS-FM-01B</strong></p>
    </div>

    {/* ── PROJECT LINK & SITE ─────────────────────────────── */}
    <div style={CARD}>
      {ST("Project Link & Site Details","Set relationship to existing project and site")}
      <div style={G(2)}>
        <FL label="Is this new project related to an existing one?" required info>
          <div style={{display:"flex",gap:20,paddingTop:4}}>
            {["yes","no"].map(v=>(
              <label key={v} style={{display:"flex",alignItems:"center",gap:6,cursor:"pointer",fontSize:13,color:ATC.textDark}}>
                <input type="radio" name="relatedToExisting" value={v} checked={form.isRelatedToExisting===v} onChange={()=>handleRelatedChange(v)} style={{accentColor:ATC.crimson,width:14,height:14}}/>
                {v==="yes"?"Yes":"No"}
              </label>
            ))}
          </div>
        </FL>
        <FL label="Existing Site" required><FS field="existingSite" opts={["Yes","No"]}/></FL>
      </div>
      {form.existingSite!==""&&(
        <div style={G(2)}>
          <FL label="Site Name" required>
            <FI field="siteName" placeholder={form.existingSite==="Yes"?"Auto-filled from QMS Master":"Enter site name"}/>
          </FL>
          <FL label="Site Short Name">
            <div style={{position:"relative"}}>
              <input
                value={form.siteShortName||""}
                onChange={e=>handleSiteShortNameChange(e.target.value)}
                onBlur={()=>setTimeout(()=>setSiteSuggestions([]),150)}
                placeholder={form.existingSite==="Yes"?"Auto-filled from QMS Master":"Type to search site..."}
                style={fInp}
              />
              {siteSuggestions.length>0&&(
                <div style={{position:"absolute",top:"100%",left:0,right:0,background:"#fff",border:`1px solid ${ATC.border}`,borderTop:"none",zIndex:20,maxHeight:210,overflowY:"auto",boxShadow:"0 4px 12px rgba(0,0,0,0.15)",borderRadius:"0 0 7px 7px"}}>
                  {siteSuggestions.map(s=>(
                    <div key={s.id}
                      onMouseDown={()=>handleSiteSelect(s)}
                      style={{padding:"7px 10px",cursor:"pointer",borderBottom:`1px solid ${ATC.bg}`}}
                      onMouseEnter={e=>e.currentTarget.style.background="#EEF3FF"}
                      onMouseLeave={e=>e.currentTarget.style.background="#fff"}>
                      <div style={{display:"flex",gap:8,alignItems:"center"}}>
                        <span style={{fontWeight:700,fontSize:12,color:ATC.crimson,flexShrink:0}}>{s.title}</span>
                        <span style={{fontSize:12,color:ATC.textDark,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{s.siteName}</span>
                      </div>
                      <div style={{fontSize:11,color:ATC.textMuted,marginTop:1}}>{s.siteLocation} · {s.siteCountry}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </FL>
        </div>
      )}
    </div>

    {/* ── PROJECT DETAILS ─────────────────────────────────── */}
    <div style={CARD}>
      {ST("Project Details")}
      <div style={G(2)}>
        <FL label="Project Number">
          <FI field="projectNumber"/>
        </FL>
        <FL label="Project Descriptor" required>
          <FI field="projectDescriptor"/>
        </FL>
      </div>
      <div style={G(3)}>
        <FL label="Project Manager" required><FS field="projectManager" opts={PMS}/></FL>
        <FL label="Tentative Start Date" required><FI field="tentativeStartDate" type="date"/></FL>
        <FL label="Tentative End Date" required><FI field="tentativeEndDate" type="date"/></FL>
      </div>
    </div>

    {/* ── PROJECT SPECIFIC REQUIREMENTS ───────────────────── */}
    <div style={CARD}>
      {ST("Project Specific Requirements")}
      <div style={G(2)}>
        <FL label="Will you need to undertake laboratory testing?" required info><FS field="labTesting" opts={YN}/></FL>
        <FL label="Do you require Mechanical Engineering Components? E.g. mechanical design and/or testing?" required info><FS field="mechanicalEngineering" opts={YN}/></FL>
        <FL label="Will there be site work? E.g. Investigations, construction supervision, site inspections?" required info><FS field="siteWork" opts={YN}/></FL>
        <FL label="Do you require Seismic Hazard Integrity Services (e.g., PSHA, DSHA, Fault Investigations)?" required info><FS field="seismicHazard" opts={YN}/></FL>
      </div>
    </div>

    {/* ── FINANCIAL ESTIMATES ─────────────────────────────── */}
    <div style={CARD}>
      {ST("Financial Estimates")}
      <div style={{padding:"10px 14px",background:ATC.amberLight,border:`1px solid ${ATC.amber}33`,borderRadius:7,marginBottom:16}}>
        <p style={{margin:0,fontSize:13,fontWeight:600,color:ATC.amber}}>Note: This is an estimation of the proposal value, not the project budget.</p>
      </div>
      <div style={G(2)}>
        <FL label="Estimated Project Fee Value" required>
          <div style={{display:"flex",gap:6}}>
            <select value={form.feeCurrency||"AUD"} onChange={e=>set("feeCurrency",e.target.value)} style={{...fInp,width:68,flexShrink:0}}>
              {["AUD","USD"].map(c=><option key={c} value={c}>{c}</option>)}
            </select>
            <FI field="estimatedProjectFee"/>
          </div>
        </FL>
        <FL label="Probability of Success (Decimal)" required><FI field="probabilityOfSuccess" placeholder="e.g. 0.75"/></FL>
      </div>
      <div style={G(2)}>
        <FL label="Estimated Proposal Value (% of Fee, Decimal)" required><FI field="estimatedProposalValue" placeholder="e.g. 0.08"/></FL>
        <FL label="Estimated Proposal Fee">
          <div style={{...fInp,background:ATC.bg,color:ATC.textMid,cursor:"default"}}>{estProposalFee}</div>
        </FL>
      </div>
    </div>

    {/* ── PROJECT DETAILS (SCOPE) ─────────────────────────── */}
    <div style={CARD}>
      {ST("Project Details")}
      <FL label="Scope of Work" required>
        <textarea value={form.scopeOfWork||""} onChange={e=>set("scopeOfWork",e.target.value)} rows={4}
          style={{...fInp,resize:"vertical"}}/>
      </FL>
    </div>

    {/* ── PROJECT CATEGORY ────────────────────────────────── */}
    <div style={CARD}>
      {ST("Project Category")}
      <FL label="Project Category" required info>
        <FS field="projectCategory" opts={PROJ_CATS}/>
      </FL>
    </div>

    {/* ── GENERAL DETAILS ─────────────────────────────────── */}
    <div style={CARD}>
      {ST("General Details")}
      <div style={G(2)}>
        <FL label="Fee Type" required><FS field="feeType" opts={FEE_TYPES}/></FL>
        <FL label="Project Status" required><FS field="projectStatus" opts={STATUSES}/></FL>
      </div>
      <div style={G(2)}>
        <FL label="Default Rate Group" required>
          <div style={{display:"flex",gap:6}}>
            {showNewRateInput?(
              <>
                <input type="text" value={newRateValue} onChange={e=>setNewRateValue(e.target.value)} placeholder="Enter new rate group..." style={{...fInp,flex:1}}/>
                <button onClick={()=>{setShowNewRateInput(false);setNewRateValue("");}} style={{padding:"8px 12px",background:ATC.crimson,color:"#fff",border:"none",borderRadius:7,fontSize:12,fontWeight:700,cursor:"pointer",flexShrink:0,whiteSpace:"nowrap"}}>Current Rates</button>
              </>
            ):(
              <>
                <button onClick={()=>setShowNewRateInput(true)} style={{padding:"8px 12px",background:ATC.crimson,color:"#fff",border:"none",borderRadius:7,fontSize:12,fontWeight:700,cursor:"pointer",flexShrink:0,whiteSpace:"nowrap"}}>+ New Rates</button>
                <FS field="defaultRateGroup" opts={RATE_GROUPS} xStyle={{flex:1}}/>
              </>
            )}
          </div>
        </FL>
        <FL label="Invoice Currency" required>
          <div style={{display:"flex",flexDirection:"column",gap:6}}>
            <select value={form.invoiceCurrency||""} onChange={e=>setForm(f=>({...f,invoiceCurrency:e.target.value,invoiceCurrencyOther:""}))} style={fInp}>
              <option value=""></option>
              {CURRENCIES.map(c=><option key={c} value={c}>{c}</option>)}
            </select>
            {form.invoiceCurrency==="Other (Please specify)"&&(
              <input type="text" value={form.invoiceCurrencyOther||""} onChange={e=>setForm(f=>({...f,invoiceCurrencyOther:e.target.value}))} placeholder="Enter currency..." style={{...fInp}} />
            )}
          </div>
        </FL>
      </div>
      <div style={G(2)}>
        <FL label="Specific Rate(s)" required><FS field="specificRates" opts={SPECIFIC_RATES}/></FL>
        <FL label="Tax Rule" required><FS field="taxRule" opts={TAX_RULES}/></FL>
      </div>
      <div style={G(2)}>
        <FL label="Subject to Local Buy" required><FS field="subjectToLocalBuy" opts={LOCAL_BUY}/></FL>
        <FL label="Commodity" required><FS field="commodity" opts={COMMODITIES}/></FL>
      </div>
      <div style={G(2)}>
        <FL label="Project Type (Technical Community)" required info><FS field="projectType" opts={PROJECT_TYPES}/></FL>
        <FL label="Office" required><FS field="office" opts={OFFICES}/></FL>
      </div>
      <div style={G(2)}>
        <FL label="Multiple Technical Communities" info><FS field="technicalCommunities" opts={PROJECT_TYPES}/></FL>
        <div/>
      </div>
    </div>

    {/* ── SITE ADDRESS ────────────────────────────────────── */}
    <div style={CARD}>
      {ST("Site Address")}
      <div style={G(2)}>
        <FL label="Address Line 1" required><FI field="siteAddressLine1"/></FL>
        <FL label="Address Line 2"><FI field="siteAddressLine2"/></FL>
        <FL label="Suburb / Town" required><FI field="siteSuburb"/></FL>
        <FL label="Location" required><FI field="siteState"/></FL>
        <FL label="Post Code" required><FI field="sitePostCode"/></FL>
        <FL label="Country" required><FI field="siteCountry"/></FL>
      </div>
    </div>

    {/* ── CONTACTS — CLIENT / COMPANY ─────────────────────── */}
    <div style={CARD}>
      {ST("Contacts — Client / Company")}
      <div style={G(2)}>
        <FL label="Client / Company Name" required>
          <div style={{display:"flex",gap:6}}>
            <select value={form.clientCompanyId||""} onChange={e=>{
              const id=e.target.value;
              const c=MOCK_CLIENTS.find(x=>String(x.id)===id);
              setForm(f=>({...f,
                clientCompanyId:id,
                clientABN:         c?.companyABN||"",
                clientAddressLine1:c?.companyAddressLine1||"",
                clientAddressLine2:c?.companyAddressLine2||"",
                clientSuburb:      c?.companySuburb||"",
                clientState:       c?.companyState||"",
                clientCountry:     c?.companyCountry||"",
                clientPhone:       c?.companyPhone||"",
                clientEmail:       c?.companyEmailAddress||"",
                clientWebSite:     c?.companyWebSite||"",
                // Reset contact when client changes
                contactName:"", contactSalutation:"", contactPosition:"",
                contactPhone:"", contactMobile:"", contactEmail:"",
                atcLink:"", sourcedContactAt:"",
              }));
              setShowNewContactModal(false);
            }} style={{...fInp,flex:1}}>
              <option value=""></option>
              {MOCK_CLIENTS.map(c=><option key={c.id} value={c.id}>{c.companyName}</option>)}
            </select>
            <button onClick={()=>setShowNewClientModal(true)} style={{padding:"8px 12px",background:ATC.crimson,color:"#fff",border:"none",borderRadius:7,fontSize:12,fontWeight:700,cursor:"pointer",flexShrink:0,whiteSpace:"nowrap"}}>+ New Client</button>
          </div>
        </FL>
        <FL label="ABN"><FI field="clientABN" readOnly style={{...fInp,background:ATC.bg}}/></FL>
        <FL label="Address Line 1"><FI field="clientAddressLine1" readOnly placeholder="Prepopulated from existing client" style={{...fInp,background:ATC.bg}}/></FL>
        <FL label="Address Line 2"><FI field="clientAddressLine2" readOnly placeholder="Prepopulated from existing client" style={{...fInp,background:ATC.bg}}/></FL>
        <FL label="Suburb / Town"><FI field="clientSuburb" readOnly placeholder="Prepopulated" style={{...fInp,background:ATC.bg}}/></FL>
        <FL label="State"><FI field="clientState" readOnly placeholder="Prepopulated" style={{...fInp,background:ATC.bg}}/></FL>
        <FL label="Country"><FI field="clientCountry" readOnly placeholder="Prepopulated" style={{...fInp,background:ATC.bg}}/></FL>
        <FL label="Phone Number"><FI field="clientPhone" readOnly placeholder="Prepopulated" style={{...fInp,background:ATC.bg}}/></FL>
        <FL label="Email Address"><FI field="clientEmail" readOnly type="email" placeholder="Prepopulated" style={{...fInp,background:ATC.bg}}/></FL>
        <FL label="Web Site"><FI field="clientWebSite" readOnly placeholder="Prepopulated" style={{...fInp,background:ATC.bg}}/></FL>
      </div>
    </div>

    {/* ── PRIMARY CONTACT ──────────────────────────────────── */}
    <div style={CARD}>
      {ST("Primary Contact")}
      {(()=>{
        const clientNumId=form.clientCompanyId?Number(form.clientCompanyId):null;
        const clientContacts=clientNumId
          ?MOCK_CLIENT_CONTACTS.filter(x=>x.clientId===clientNumId)
          :[];
        return(
        <div style={G(2)}>
          <FL label="Contact Name" required>
            <div style={{display:"flex",gap:6}}>
              <select value={form.contactName||""} onChange={e=>{
                const name=e.target.value;
                const ct=clientContacts.find(x=>x.contactName===name);
                setForm(f=>({...f,
                  contactName:      name,
                  contactSalutation:ct?.contactSalutation||"",
                  contactPosition:  ct?.contactPosition||"",
                  contactPhone:     ct?.contactPhone||"",
                  contactMobile:    ct?.contactMobile||"",
                  contactEmail:     ct?.contactEmail?.trim()||"",
                  atcLink:          ct?.atcLink||"",
                  sourcedContactAt: ct?.sourcedContactAt||"",
                }));
              }} style={{...fInp,flex:1}}>
                <option value=""></option>
                {clientContacts.map((ct,i)=><option key={i} value={ct.contactName}>{ct.contactName}</option>)}
              </select>
              <button disabled={!form.clientCompanyId} onClick={()=>setShowNewContactModal(true)}
                style={{padding:"8px 12px",background:form.clientCompanyId?ATC.crimson:ATC.bg,border:"none",borderRadius:7,fontSize:12,color:form.clientCompanyId?"#fff":ATC.textMuted,fontWeight:700,cursor:form.clientCompanyId?"pointer":"not-allowed",flexShrink:0,whiteSpace:"nowrap"}}>+ New Contact</button>
            </div>
          </FL>
          <FL label="Contact Salutation"><FI field="contactSalutation" readOnly style={{...fInp,background:ATC.bg}}/></FL>
          <FL label="Contact Position"><FI field="contactPosition" readOnly style={{...fInp,background:ATC.bg}}/></FL>
          <FL label="Contact Phone"><FI field="contactPhone" readOnly style={{...fInp,background:ATC.bg}}/></FL>
          <FL label="Contact Mobile"><FI field="contactMobile" readOnly style={{...fInp,background:ATC.bg}}/></FL>
          <FL label="Contact Email"><FI field="contactEmail" readOnly type="email" style={{...fInp,background:ATC.bg}}/></FL>
          <FL label="ATC Link"><FI field="atcLink" readOnly style={{...fInp,background:ATC.bg}}/></FL>
          <FL label="Sourced Contact At"><FI field="sourcedContactAt" readOnly style={{...fInp,background:ATC.bg}}/></FL>
        </div>
        );
      })()}
    </div>

    {/* ── NEW CONTACT MODAL ────────────────────────────────── */}
    {showNewContactModal&&(
      <NewContactModal
        clientCompanyId={form.clientCompanyId}
        onClose={()=>setShowNewContactModal(false)}
        onSave={nc=>{
          setForm(f=>({...f,
            clientCompanyId:  nc.ncCompanyId||f.clientCompanyId,
            contactName:      nc.ncName,
            contactSalutation:nc.ncSalutation,
            contactPosition:  nc.ncPosition,
            contactPhone:     nc.ncPhone,
            contactMobile:    nc.ncMobile,
            contactEmail:     nc.ncEmail,
            atcLink:          nc.ncAtcLink,
            sourcedContactAt: nc.ncSourced,
          }));
          setShowNewContactModal(false);
        }}
        ATC={ATC} fInp={fInp}
      />
    )}

    {/* ── FORM SUBMISSION DETAILS ──────────────────────────── */}
    <div style={CARD}>
      {ST("Form Submission Details")}
      <FL label="Office for Form Submission" required>
        <div style={{display:"flex",gap:20,flexWrap:"wrap",paddingTop:4}}>
          {OFFICES.map(o=>(
            <label key={o} style={{display:"flex",alignItems:"center",gap:6,cursor:"pointer",fontSize:13,color:ATC.textDark}}>
              <input type="radio" name="officeForSubmission" value={o} checked={form.officeForSubmission===o} onChange={()=>set("officeForSubmission",o)} style={{accentColor:ATC.crimson,width:14,height:14}}/>
              {o}
            </label>
          ))}
        </div>
      </FL>
    </div>

    {/* ── FOOTER ACTION BAR ───────────────────────────────── */}
    <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",flexWrap:"wrap",gap:10,paddingBottom:32}}>
      <div style={{display:"flex",gap:10,alignItems:"center"}}>
        <button style={{fontSize:13,color:ATC.blue,background:"none",border:"none",cursor:"pointer",textDecoration:"underline",padding:0}}>Direct URL</button>
        <button style={{...secBtn,cursor:"default",color:ATC.textMuted}}>Create PDF</button>
      </div>
      <div style={{display:"flex",gap:10}}>
        <button onClick={onBack} style={{...secBtn,color:ATC.crimson,border:`1px solid ${ATC.crimson}`}}><ArrowLeft size={14}/>Back</button>
        <button onClick={handleClear} style={secBtn}>Clear</button>
        <button onClick={handleSubmit} disabled={saving} style={priBtn(saving)}>
          {saving?"Submitting...":"Submit"}
        </button>
      </div>
    </div>
    {/* ── NEW CLIENT MODAL ─────────────────────────────────── */}
    {showNewClientModal&&(
      <NewClientModal
        onClose={()=>setShowNewClientModal(false)}
        onSave={c=>{
          setForm(f=>({...f,
            clientCompanyId:  c.id||"",
            clientABN:         c.companyABN||"",
            clientAddressLine1:c.companyAddressLine1||"",
            clientAddressLine2:c.companyAddressLine2||"",
            clientSuburb:      c.companySuburb||"",
            clientState:       c.companyState||"",
            clientCountry:     c.companyCountry||"",
            clientPhone:       c.companyPhone||"",
            clientEmail:       c.companyEmailAddress||"",
            clientWebSite:     c.companyWebSite||"",
            contactName:       c.contactName||"",
            contactSalutation: c.contactSalutation||"",
            contactPosition:   c.contactPosition||"",
            contactPhone:      c.contactPhone||"",
            contactMobile:     c.contactMobile||"",
            contactEmail:      c.contactEmail||"",
            atcLink:           c.atcLink||"",
            sourcedContactAt:  c.sourcedContactAt||"",
          }));
          setShowNewClientModal(false);
        }}
        ATC={ATC} fInp={fInp}
      />
    )}
    {/* ── SY-QS-PR-01 PDF MODAL ────────────────────────────── */}
    {showPRModal&&(
      <div style={{position:"fixed",inset:0,zIndex:9999,background:"rgba(0,0,0,0.6)",display:"flex",alignItems:"center",justifyContent:"center",padding:16}}>
        <div style={{background:"#D4D5D8",borderRadius:12,overflow:"hidden",display:"flex",flexDirection:"column",width:"min(1000px,95vw)",height:"90vh",boxShadow:"0 8px 40px rgba(0,0,0,0.35)"}}>
          <div style={{background:ATC.crimson,padding:"12px 20px",display:"flex",alignItems:"center",justifyContent:"space-between",flexShrink:0}}>
            <span style={{color:"#fff",fontWeight:700,fontSize:14}}>SY-QS-PR-01 — Project Management Workbook</span>
            <button onClick={()=>setShowPRModal(false)} style={{background:"rgba(255,255,255,0.15)",border:"none",borderRadius:6,color:"#fff",fontSize:13,fontWeight:700,cursor:"pointer",padding:"5px 14px"}}>✕ Close</button>
          </div>
          <iframe src="/SY-QS-PR-01.pdf" style={{flex:1,border:"none",width:"100%"}} title="SY-QS-PR-01 Project Management Workbook"/>
        </div>
      </div>
    )}
    </>
    </FormCtx.Provider>
  );
}


// --- New Client Modal ---------------------------------------------------------
function NewClientModal({onClose,onSave,ATC,fInp}) {
  const [c,setC]=useState({
    companyName:"",companyABN:"",
    companyAddressLine1:"",companyAddressLine2:"",
    companySuburb:"",companyState:"",companyPostCode:"",companyCountry:"Australia",
    companyPhone:"",companyEmailAddress:"",companyWebSite:"",
    contactSalutation:"",contactName:"",contactPosition:"",
    contactPhone:"",contactMobile:"",contactEmail:"",
    atcLink:"",sourcedContactAt:"",
  });
  const [errors,setErrors]=useState({});
  const s=(k,v)=>setC(p=>({...p,[k]:v}));
  const inp=(k,opts={})=><input value={c[k]||""} onChange={e=>s(k,e.target.value)} style={fInp} {...opts}/>;
  function handleSave(){
    const e={};
    if(!c.companyName.trim()) e.companyName="Company name is required.";
    if(Object.keys(e).length){setErrors(e);return;}
    onSave({...c,id:"new_"+Date.now()});
  }
  const CARD={background:ATC.bgWhite,borderRadius:10,border:`1px solid ${ATC.border}`,padding:"20px 24px",marginBottom:16};
  const SH=(title,sub)=>(
    <div style={{marginBottom:16}}>
      <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:sub?3:0}}>
        <div style={{width:3,height:18,background:ATC.crimson,borderRadius:2}}/>
        <span style={{fontWeight:700,fontSize:15,color:ATC.textDark}}>{title}</span>
      </div>
      {sub&&<div style={{fontSize:12,color:ATC.textMuted,marginLeft:11}}>{sub}</div>}
    </div>
  );
  const FL=({label,required,children})=>(
    <div>
      <label style={{display:"block",fontSize:11,fontWeight:700,color:ATC.textMid,textTransform:"uppercase",letterSpacing:"0.05em",marginBottom:5}}>
        {required&&<span style={{color:ATC.crimson}}>* </span>}{label}
      </label>
      {children}
    </div>
  );
  const G2={display:"grid",gridTemplateColumns:"1fr 1fr",gap:"14px 20px"};
  const G4={display:"grid",gridTemplateColumns:"1fr 1fr 1fr 1fr",gap:"14px 20px"};
  const AUS_STATES=["ACT","NSW","NT","QLD","SA","TAS","VIC","WA"];
  return(
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.5)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:9999,padding:16}}>
      <div style={{background:"#D4D5D8",borderRadius:12,width:960,maxWidth:"98vw",maxHeight:"92vh",display:"flex",flexDirection:"column",overflow:"hidden",boxShadow:"0 20px 60px rgba(0,0,0,0.3)"}}>
        {/* Header */}
        <div style={{background:ATC.crimson,padding:"14px 24px",display:"flex",alignItems:"center",gap:16,flexShrink:0}}>
          <button onClick={onClose} style={{display:"flex",alignItems:"center",gap:6,padding:"7px 14px",background:"rgba(255,255,255,0.15)",border:"1px solid rgba(255,255,255,0.35)",borderRadius:7,fontSize:12,color:"#fff",fontWeight:600,cursor:"pointer",whiteSpace:"nowrap",flexShrink:0}}>
            ← Back to Clients
          </button>
          <div>
            <div style={{fontWeight:800,fontSize:20,color:"#fff",letterSpacing:"-0.02em"}}>New Client</div>
            <div style={{fontSize:12,color:"rgba(255,255,255,0.75)",marginTop:2}}>Add a new client to the QMS</div>
          </div>
        </div>
        {/* Body */}
        <div style={{flex:1,overflowY:"auto",padding:"20px 24px"}}>
          {/* Company Details */}
          <div style={CARD}>
            {SH("Company Details")}
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"14px 20px",marginBottom:14}}>
              <FL label="Company Name" required>
                <input value={c.companyName} onChange={e=>s("companyName",e.target.value)} placeholder="Company or organisation name..." style={fInp}/>
                {errors.companyName&&<div style={{color:ATC.crimson,fontSize:11,marginTop:3}}>{errors.companyName}</div>}
              </FL>
              <FL label="ABN">{inp("companyABN",{placeholder:"e.g. 12 345 678 901"})}</FL>
              <FL label="Address Line 1">{inp("companyAddressLine1",{placeholder:"Street address..."})}</FL>
              <FL label="Address Line 2">{inp("companyAddressLine2",{placeholder:"Suite, PO Box, etc."})}</FL>
            </div>
            <div style={G4}>
              <FL label="Suburb / Town">{inp("companySuburb",{placeholder:"Suburb..."})}</FL>
              <FL label="State">
                <select value={c.companyState} onChange={e=>s("companyState",e.target.value)} style={{...fInp,cursor:"pointer"}}>
                  <option value="">State...</option>
                  {AUS_STATES.map(st=><option key={st} value={st}>{st}</option>)}
                </select>
              </FL>
              <FL label="Post Code">{inp("companyPostCode",{placeholder:"0000"})}</FL>
              <FL label="Country">{inp("companyCountry",{placeholder:"Country"})}</FL>
            </div>
          </div>
          {/* Contact Details */}
          <div style={CARD}>
            {SH("Contact Details")}
            <div style={G2}>
              <FL label="Phone">{inp("companyPhone",{placeholder:"+61 ...",type:"tel"})}</FL>
              <FL label="Email Address">{inp("companyEmailAddress",{placeholder:"info@company.com",type:"email"})}</FL>
            </div>
            <div style={{marginTop:14}}>
              <FL label="Website">{inp("companyWebSite",{placeholder:"https://www.company.com",type:"url"})}</FL>
            </div>
          </div>
          {/* Primary Contact */}
          <div style={CARD}>
            {SH("Primary Contact","Key contact person at this company")}
            <div style={G2}>
              <FL label="Salutation">
                <select value={c.contactSalutation} onChange={e=>s("contactSalutation",e.target.value)} style={{...fInp,cursor:"pointer"}}>
                  <option value="">Salutation...</option>
                  {["Mr","Mrs","Ms","Dr","Prof"].map(o=><option key={o} value={o}>{o}</option>)}
                </select>
              </FL>
              <FL label="Contact Name">{inp("contactName",{placeholder:"Full name..."})}</FL>
              <FL label="Position / Title">{inp("contactPosition",{placeholder:"e.g. Project Manager"})}</FL>
              <FL label="Contact Phone">{inp("contactPhone",{placeholder:"+61 ...",type:"tel"})}</FL>
              <FL label="Contact Mobile">{inp("contactMobile",{placeholder:"+61 4...",type:"tel"})}</FL>
              <FL label="Contact Email">{inp("contactEmail",{placeholder:"contact@company.com",type:"email"})}</FL>
              <FL label="ATC Link">{inp("atcLink",{placeholder:"e.g. Dilum Fernando"})}</FL>
              <FL label="Sourced Contact At">{inp("sourcedContactAt",{placeholder:"e.g. LinkedIn, Conference..."})}</FL>
            </div>
          </div>
        </div>
        {/* Footer */}
        <div style={{background:ATC.bgWhite,padding:"14px 24px",borderTop:`1px solid ${ATC.border}`,display:"flex",justifyContent:"flex-end",gap:10,flexShrink:0}}>
          <button onClick={onClose} style={{padding:"9px 22px",background:ATC.bgWhite,border:`1px solid ${ATC.border}`,borderRadius:7,fontSize:13,color:ATC.textMid,fontWeight:600,cursor:"pointer"}}>Cancel</button>
          <button onClick={handleSave} style={{display:"flex",alignItems:"center",gap:7,padding:"9px 22px",background:ATC.crimson,border:"none",borderRadius:7,fontSize:13,color:"#fff",fontWeight:700,cursor:"pointer"}}>
            <CheckCircle size={15}/>Save Client
          </button>
        </div>
      </div>
    </div>
  );
}

// --- New Contact Modal --------------------------------------------------------
function NewContactModal({clientCompanyId,onClose,onSave,ATC,fInp}) {
  const [nc,setNc]=useState({
    ncCompanyId:clientCompanyId||"",
    ncName:"",ncSalutation:"",ncPosition:"",
    ncPhone:"",ncMobile:"",ncEmail:"",
    ncAtcLink:"",ncSourced:""
  });
  const [errors,setErrors]=useState({});
  const s=(k,v)=>setNc(p=>({...p,[k]:v}));
  function handleSave(){
    const e={};
    if(!nc.ncCompanyId) e.ncCompanyId="Company is required.";
    if(!nc.ncName.trim()) e.ncName="Contact name is required.";
    if(Object.keys(e).length){setErrors(e);return;}
    onSave(nc);
  }
  const CARD={background:ATC.bgWhite,borderRadius:10,border:`1px solid ${ATC.border}`,padding:"20px 24px",marginBottom:16};
  const SH=(title,sub)=>(
    <div style={{marginBottom:16}}>
      <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:sub?3:0}}>
        <div style={{width:3,height:18,background:ATC.crimson,borderRadius:2}}/>
        <span style={{fontWeight:700,fontSize:15,color:ATC.textDark}}>{title}</span>
      </div>
      {sub&&<div style={{fontSize:12,color:ATC.textMuted,marginLeft:11}}>{sub}</div>}
    </div>
  );
  const FL=({label,required,hint,children})=>(
    <div>
      <label style={{display:"block",fontSize:11,fontWeight:700,color:ATC.textMid,textTransform:"uppercase",letterSpacing:"0.05em",marginBottom:5}}>
        {required&&<span style={{color:ATC.crimson}}>* </span>}{label}
      </label>
      {children}
      {hint&&<div style={{fontSize:11,color:ATC.textMuted,marginTop:3}}>{hint}</div>}
    </div>
  );
  const G2={display:"grid",gridTemplateColumns:"1fr 1fr",gap:"14px 20px"};
  return(
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.5)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:9999,padding:16}}>
      <div style={{background:"#D4D5D8",borderRadius:12,width:960,maxWidth:"98vw",maxHeight:"92vh",display:"flex",flexDirection:"column",overflow:"hidden",boxShadow:"0 20px 60px rgba(0,0,0,0.3)"}}>
        {/* Header */}
        <div style={{background:ATC.crimson,padding:"14px 24px",display:"flex",alignItems:"center",gap:16,flexShrink:0}}>
          <button onClick={onClose} style={{display:"flex",alignItems:"center",gap:6,padding:"7px 14px",background:"rgba(255,255,255,0.15)",border:"1px solid rgba(255,255,255,0.35)",borderRadius:7,fontSize:12,color:"#fff",fontWeight:600,cursor:"pointer",whiteSpace:"nowrap",flexShrink:0}}>
            ← Back to Contacts
          </button>
          <div>
            <div style={{fontWeight:800,fontSize:20,color:"#fff",letterSpacing:"-0.02em"}}>New Client Contact</div>
            <div style={{fontSize:12,color:"rgba(255,255,255,0.75)",marginTop:2}}>Add a new contact linked to an existing client</div>
          </div>
        </div>
        {/* Scrollable body */}
        <div style={{flex:1,overflowY:"auto",padding:"20px 24px"}}>
          {/* Link to Company */}
          <div style={CARD}>
            {SH("Link to Company","Select the client this contact belongs to")}
            <FL label="Company" required>
              <select value={nc.ncCompanyId} onChange={e=>s("ncCompanyId",e.target.value)} style={{...fInp,cursor:"pointer"}}>
                <option value="">Select company...</option>
                {MOCK_CLIENTS.map(c=><option key={c.id} value={c.id}>{c.companyName}</option>)}
              </select>
              {errors.ncCompanyId&&<div style={{color:ATC.crimson,fontSize:11,marginTop:3}}>{errors.ncCompanyId}</div>}
            </FL>
          </div>
          {/* Contact Details */}
          <div style={CARD}>
            {SH("Contact Details")}
            <div style={G2}>
              <FL label="Salutation">
                <select value={nc.ncSalutation} onChange={e=>s("ncSalutation",e.target.value)} style={{...fInp,cursor:"pointer"}}>
                  <option value="">Salutation...</option>
                  {["Mr","Mrs","Ms","Dr","Prof"].map(o=><option key={o} value={o}>{o}</option>)}
                </select>
              </FL>
              <FL label="Contact Name" required>
                <input value={nc.ncName} onChange={e=>s("ncName",e.target.value)} placeholder="Full name..." style={fInp}/>
                {errors.ncName&&<div style={{color:ATC.crimson,fontSize:11,marginTop:3}}>{errors.ncName}</div>}
              </FL>
              <FL label="Position / Title">
                <input value={nc.ncPosition} onChange={e=>s("ncPosition",e.target.value)} placeholder="e.g. Project Manager" style={fInp}/>
              </FL>
              <FL label="Contact Phone">
                <input value={nc.ncPhone} onChange={e=>s("ncPhone",e.target.value)} placeholder="+61 ..." type="tel" style={fInp}/>
              </FL>
              <FL label="Contact Mobile">
                <input value={nc.ncMobile} onChange={e=>s("ncMobile",e.target.value)} placeholder="+61 4..." type="tel" style={fInp}/>
              </FL>
              <FL label="Contact Email">
                <input value={nc.ncEmail} onChange={e=>s("ncEmail",e.target.value)} placeholder="email@company.com" type="email" style={fInp}/>
              </FL>
            </div>
          </div>
          {/* Additional Information */}
          <div style={CARD}>
            {SH("Additional Information")}
            <div style={G2}>
              <FL label="ATC Link" hint="Internal ATC Williams staff member who manages this contact">
                <input value={nc.ncAtcLink} onChange={e=>s("ncAtcLink",e.target.value)} placeholder="e.g. Dilum Fernando" style={fInp}/>
              </FL>
              <FL label="Sourced Contact At" hint="Where or how this contact was sourced">
                <input value={nc.ncSourced} onChange={e=>s("ncSourced",e.target.value)} placeholder="e.g. LinkedIn, Conference..." style={fInp}/>
              </FL>
            </div>
          </div>
        </div>
        {/* Footer */}
        <div style={{background:ATC.bgWhite,padding:"14px 24px",borderTop:`1px solid ${ATC.border}`,display:"flex",justifyContent:"flex-end",gap:10,flexShrink:0}}>
          <button onClick={onClose} style={{padding:"9px 22px",background:ATC.bgWhite,border:`1px solid ${ATC.border}`,borderRadius:7,fontSize:13,color:ATC.textMid,fontWeight:600,cursor:"pointer"}}>Cancel</button>
          <button onClick={handleSave} style={{display:"flex",alignItems:"center",gap:7,padding:"9px 22px",background:ATC.crimson,border:"none",borderRadius:7,fontSize:13,color:"#fff",fontWeight:700,cursor:"pointer"}}>
            <CheckCircle size={15}/>Save Contact
          </button>
        </div>
      </div>
    </div>
  );
}

// --- New Client Form ----------------------------------------------------------
function NewClientForm({onBack,onSaved,isMobile}) {
  const empty = {
    companyName:"", companyABN:"", companyAddressLine1:"", companyAddressLine2:"",
    companySuburb:"", companyState:"", companyPostCode:"", companyCountry:"Australia",
    companyPhone:"", companyEmailAddress:"", companyWebSite:"", isCritical:false,
    contactName:"", contactSalutation:"", contactPosition:"",
    contactPhone:"", contactMobile:"", contactEmail:"",
    atcLink:"", sourcedContactAt:"",
  };
  const [form,setForm]=useState(empty);
  const [saving,setSaving]=useState(false);
  const [saved,setSaved]=useState(false);
  const [errors,setErrors]=useState({});

  const set=(k,v)=>setForm(f=>({...f,[k]:v}));

  const validate=()=>{
    const e={};
    if(!form.companyName.trim()) e.companyName="Company name is required.";
    if(form.companyEmailAddress&&!/\S+@\S+\.\S+/.test(form.companyEmailAddress)) e.companyEmailAddress="Invalid email address.";
    setErrors(e);
    return Object.keys(e).length===0;
  };

  async function handleSave() {
    if(!validate()) return;
    setSaving(true);
    await new Promise(r=>setTimeout(r,1000));
    setSaving(false); setSaved(true);
  }

  const F=({label,required,error,children})=>(
    <div style={{marginBottom:16}}>
      <label style={{display:"block",fontSize:12,fontWeight:700,color:error?ATC.crimson:ATC.textMid,marginBottom:5,textTransform:"uppercase",letterSpacing:"0.04em"}}>
        {label}{required&&<span style={{color:ATC.crimson,marginLeft:3}}>*</span>}
      </label>
      {children}
      {error&&<p style={{margin:"4px 0 0",fontSize:11,color:ATC.crimson}}>{error}</p>}
    </div>
  );
  const inp=(field,props={})=>(
    <input value={form[field]||""} onChange={e=>set(field,e.target.value)} {...props}
      style={{width:"100%",padding:"8px 11px",border:`1px solid ${errors[field]?ATC.crimson:ATC.border}`,borderRadius:7,fontSize:13,color:ATC.textDark,background:ATC.bgWhite,outline:"none",boxSizing:"border-box"}}/>
  );
  const sel=(field,opts,placeholder)=>(
    <select value={form[field]||""} onChange={e=>set(field,e.target.value)}
      style={{width:"100%",padding:"8px 11px",border:`1px solid ${ATC.border}`,borderRadius:7,fontSize:13,color:form[field]?ATC.textDark:ATC.textMuted,background:ATC.bgWhite,outline:"none",boxSizing:"border-box"}}>
      <option value="">{placeholder||"Select..."}</option>
      {opts.map(o=><option key={o} value={o}>{o}</option>)}
    </select>
  );
  const grid2={display:"grid",gridTemplateColumns:isMobile?"1fr":"1fr 1fr",gap:"0 16px"};
  const secTitle=(t,sub)=>(
    <div style={{marginBottom:16,paddingBottom:12,borderBottom:`2px solid ${ATC.crimsonPale}`}}>
      <div style={{display:"flex",alignItems:"center",gap:8}}>
        <div style={{width:3,height:16,background:ATC.crimson,borderRadius:2}}/>
        <h3 style={{margin:0,fontSize:15,fontWeight:800,color:ATC.textDark}}>{t}</h3>
      </div>
      {sub&&<p style={{margin:"3px 0 0 11px",fontSize:11,color:ATC.textMuted}}>{sub}</p>}
    </div>
  );
  const secBox={background:ATC.bgWhite,borderRadius:10,border:`1px solid ${ATC.border}`,padding:"20px 24px",marginBottom:16};

  if(saved) return (
    <div style={{minHeight:"60vh",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:16,textAlign:"center",padding:32}}>
      <div style={{width:64,height:64,borderRadius:"50%",background:ATC.greenLight,display:"flex",alignItems:"center",justifyContent:"center"}}><CheckCircle size={32} color={ATC.green}/></div>
      <h2 style={{margin:0,fontSize:22,fontWeight:800,color:ATC.textDark}}>Client Saved</h2>
      <p style={{margin:0,fontSize:14,color:ATC.textMuted,maxWidth:380}}><strong>{form.companyName}</strong> has been added to the client list.</p>
      <div style={{display:"flex",gap:10}}>
        <button onClick={()=>setSaved(false)||setForm(empty)} style={{padding:"9px 20px",background:ATC.bgWhite,border:`1px solid ${ATC.border}`,borderRadius:7,fontSize:13,color:ATC.textMid,cursor:"pointer",fontWeight:500}}>
          Add Another
        </button>
        <button onClick={onBack} style={{display:"flex",alignItems:"center",gap:8,padding:"9px 22px",background:ATC.crimson,color:"#fff",border:"none",borderRadius:7,fontSize:13,fontWeight:700,cursor:"pointer"}}>
          <ArrowLeft size={15}/> Back to Clients
        </button>
      </div>
    </div>
  );

  return (
    <div>
      {/* Header */}
      <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:20,flexWrap:"wrap"}}>
        <button onClick={onBack} style={{display:"flex",alignItems:"center",gap:6,padding:"7px 14px",background:ATC.bgWhite,border:`1px solid ${ATC.border}`,borderRadius:7,fontSize:13,color:ATC.textMid,cursor:"pointer",fontWeight:500}}>
          <ArrowLeft size={14}/> Back to Clients
        </button>
        <div>
          <h1 style={{margin:0,fontSize:20,fontWeight:800,color:ATC.textDark,letterSpacing:"-0.02em"}}>New Client</h1>
          <p style={{margin:"2px 0 0",fontSize:12,color:ATC.textMuted}}>Add a new client to the QMS</p>
        </div>
      </div>

      {/* Company Details */}
      <div style={secBox}>
        {secTitle("Company Details")}
        <div style={grid2}>
          <F label="Company Name" required error={errors.companyName}>{inp("companyName",{placeholder:"Company or organisation name..."})}</F>
          <F label="ABN">{inp("companyABN",{placeholder:"e.g. 12 345 678 901"})}</F>
        </div>
        <div style={grid2}>
          <F label="Address Line 1">{inp("companyAddressLine1",{placeholder:"Street address..."})}</F>
          <F label="Address Line 2">{inp("companyAddressLine2",{placeholder:"Suite, PO Box, etc."})}</F>
        </div>
        <div style={{display:"grid",gridTemplateColumns:isMobile?"1fr":"repeat(4,1fr)",gap:"0 16px"}}>
          <F label="Suburb / Town">{inp("companySuburb",{placeholder:"Suburb..."})}</F>
          <F label="State">{sel("companyState",["NSW","QLD","VIC","WA","SA","TAS","ACT","NT"],"State...")}</F>
          <F label="Post Code">{inp("companyPostCode",{placeholder:"0000"})}</F>
          <F label="Country">{inp("companyCountry",{placeholder:"Country..."})}</F>
        </div>
      </div>

      {/* Contact Details */}
      <div style={secBox}>
        {secTitle("Contact Details")}
        <div style={grid2}>
          <F label="Phone">{inp("companyPhone",{placeholder:"+61 ...",type:"tel"})}</F>
          <F label="Email Address" error={errors.companyEmailAddress}>{inp("companyEmailAddress",{placeholder:"info@company.com",type:"email"})}</F>
        </div>
        <F label="Website">{inp("companyWebSite",{placeholder:"https://www.company.com"})}</F>
      </div>

      {/* Primary Contact */}
      <div style={secBox}>
        {secTitle("Primary Contact","Key contact person at this company")}
        <div style={grid2}>
          <F label="Salutation">{sel("contactSalutation",["Mr","Mrs","Ms","Dr","Prof"],"Salutation...")}</F>
          <F label="Contact Name">{inp("contactName",{placeholder:"Full name..."})}</F>
          <F label="Position / Title">{inp("contactPosition",{placeholder:"e.g. Project Manager"})}</F>
          <F label="Contact Phone">{inp("contactPhone",{placeholder:"+61 ...",type:"tel"})}</F>
          <F label="Contact Mobile">{inp("contactMobile",{placeholder:"+61 4...",type:"tel"})}</F>
          <F label="Contact Email">{inp("contactEmail",{placeholder:"contact@company.com",type:"email"})}</F>
          <F label="ATC Link" hint="Internal ATC Williams staff member">{inp("atcLink",{placeholder:"Staff member name..."})}</F>
          <F label="Sourced Contact At">{inp("sourcedContactAt",{placeholder:"Where this contact was sourced..."})}</F>
        </div>
      </div>

      {/* Critical Flag */}
      <div style={secBox}>
        {secTitle("Risk Classification")}
        <div style={{display:"flex",alignItems:"center",gap:12}}>
          <button onClick={()=>set("isCritical",!form.isCritical)}
            style={{width:22,height:22,borderRadius:5,border:`2px solid ${form.isCritical?ATC.crimson:ATC.border}`,background:form.isCritical?ATC.crimson:ATC.bgWhite,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
            {form.isCritical&&<svg width="11" height="11" viewBox="0 0 12 12" fill="none"><path d="M2 6l3 3 5-5" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>}
          </button>
          <div>
            <div style={{fontSize:13,fontWeight:600,color:ATC.textDark}}>Mark as Critical Client</div>
            <div style={{fontSize:12,color:ATC.textMuted}}>Critical clients trigger Gate Zero approval on all new opportunities.</div>
          </div>
        </div>
        {form.isCritical&&(
          <div style={{marginTop:12,padding:"10px 14px",background:ATC.crimsonPale,borderRadius:7,fontSize:12,color:ATC.crimsonDark,fontWeight:500}}>
            ! Gate Zero will be required for any new job requests associated with this client.
          </div>
        )}
      </div>

      {/* Actions */}
      <div style={{display:"flex",justifyContent:"flex-end",gap:10,marginTop:4}}>
        <button onClick={onBack} style={{padding:"9px 20px",background:ATC.bgWhite,border:`1px solid ${ATC.border}`,borderRadius:7,fontSize:13,color:ATC.textMid,cursor:"pointer",fontWeight:500}}>Cancel</button>
        <button onClick={handleSave} disabled={saving} style={{display:"flex",alignItems:"center",gap:7,padding:"9px 24px",background:saving?"#9CA3AF":ATC.crimson,color:"#fff",border:"none",borderRadius:7,fontSize:13,fontWeight:700,cursor:saving?"not-allowed":"pointer",boxShadow:saving?"none":`0 2px 8px ${ATC.crimson}44`}}>
          {saving?<><RefreshCw size={13} style={{animation:"spin 1s linear infinite"}}/> Saving...</>:<><CheckCircle size={13}/> Save Client</>}
        </button>
      </div>
    </div>
  );
}

// --- Clients Page -------------------------------------------------------------
function ClientsPage({isMobile}) {
  const [page,setPage]=useState(1);
  const [search,setSearch]=useState("");
  const [showForm,setShowForm]=useState(false);
  const [selectedItem,setSelectedItem]=useState(null);

  const filtered=MOCK_CLIENTS.filter(c=>!search||c.companyName.toLowerCase().includes(search.toLowerCase()));
  const items=[...filtered].sort((a,b)=>b.id-a.id).slice((page-1)*PAGE_SIZE,page*PAGE_SIZE);
  const totalPages=Math.ceil(filtered.length/PAGE_SIZE);

  if(showForm) return <NewClientForm onBack={()=>setShowForm(false)} isMobile={isMobile}/>;

  return <div>
    {selectedItem&&<DetailPopupModal onClose={()=>setSelectedItem(null)}><ClientDetail item={selectedItem} isModal onBack={()=>setSelectedItem(null)}/></DetailPopupModal>}
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:20,flexWrap:"wrap",gap:10}}>
      <PageTitle title="Clients" sub={`${filtered.length.toLocaleString()} total clients - ID descending`}/>
      <button onClick={()=>setShowForm(true)} style={{display:"flex",alignItems:"center",gap:7,padding:"9px 20px",background:ATC.crimson,color:"#fff",border:"none",borderRadius:8,fontSize:13,fontWeight:700,cursor:"pointer",boxShadow:`0 3px 10px ${ATC.crimson}55`,alignSelf:"flex-start"}}>
        <Plus size={15}/> New Client
      </button>
    </div>
    <SectionTable
      title="All Clients" subtitle={`${filtered.length.toLocaleString()} records`}
      search={<SearchBar value={search} onChange={v=>{setSearch(v);setPage(1);}} placeholder="Search company..."/>}
      headers={["ID v","Company Name","ABN","Address Line 1","Suburb","State","Post Code","Country","Phone","Email","Website"]}
      rows={items.map((c)=>[
        <ClickID id={c.id} onClick={()=>setSelectedItem(c)}/>,
        <span style={{color:ATC.textDark,fontWeight:600}}>{c.companyName}</span>,
        <span style={{color:ATC.textMid,fontSize:12}}>{c.companyABN||"-"}</span>,
        <span style={{color:ATC.textMid,fontSize:12}}>{c.companyAddressLine1||"-"}</span>,
        <span style={{color:ATC.textMid,fontSize:12}}>{c.companySuburb||"-"}</span>,
        <span style={{color:ATC.textMid,fontSize:12}}>{c.companyState||"-"}</span>,
        <span style={{color:ATC.textMid,fontSize:12}}>{c.companyPostCode||"-"}</span>,
        <span style={{color:ATC.textMid,fontSize:12}}>{c.companyCountry||"-"}</span>,
        <span style={{color:ATC.textMid,fontSize:12}}>{c.companyPhone||"-"}</span>,
        <span style={{color:ATC.textMid,fontSize:11}}>{c.companyEmailAddress||"-"}</span>,
        <span style={{color:ATC.textMid,fontSize:11}}>{c.companyWebSite||"-"}</span>,
      ])} page={page} totalPages={totalPages} onChange={setPage} total={filtered.length}/>
  </div>;
}

// --- New Site Form ------------------------------------------------------------
function NewSiteForm({onBack,isMobile}) {
  const empty={
    title:"", siteName:"", siteLocation:"",
    streetLine1:"", streetLine2:"",
    site_Suburb_Town:"", siteState:"", siteCountry:"Australia", site_PostCode:"",
    siteLatitude:"", siteLongitude:"",
  };
  const [form,setForm]=useState(empty);
  const [saving,setSaving]=useState(false);
  const [saved,setSaved]=useState(false);
  const [errors,setErrors]=useState({});

  const set=(k,v)=>setForm(f=>({...f,[k]:v}));

  const validate=()=>{
    const e={};
    if(!form.siteName.trim()) e.siteName="Site name is required.";
    if(!form.title.trim()) e.title="Short title / code is required.";
    if(form.siteLatitude&&isNaN(Number(form.siteLatitude))) e.siteLatitude="Must be a number.";
    if(form.siteLongitude&&isNaN(Number(form.siteLongitude))) e.siteLongitude="Must be a number.";
    setErrors(e);
    return Object.keys(e).length===0;
  };

  async function handleSave() {
    if(!validate()) return;
    setSaving(true);
    await new Promise(r=>setTimeout(r,1000));
    setSaving(false); setSaved(true);
  }

  const F=({label,required,error,hint,children})=>(
    <div style={{marginBottom:16}}>
      <label style={{display:"block",fontSize:12,fontWeight:700,color:error?ATC.crimson:ATC.textMid,marginBottom:5,textTransform:"uppercase",letterSpacing:"0.04em"}}>
        {label}{required&&<span style={{color:ATC.crimson,marginLeft:3}}>*</span>}
      </label>
      {children}
      {hint&&<p style={{margin:"4px 0 0",fontSize:11,color:ATC.textMuted}}>{hint}</p>}
      {error&&<p style={{margin:"4px 0 0",fontSize:11,color:ATC.crimson}}>{error}</p>}
    </div>
  );
  const inp=(field,props={})=>(
    <input value={form[field]||""} onChange={e=>set(field,e.target.value)} {...props}
      style={{width:"100%",padding:"8px 11px",border:`1px solid ${errors[field]?ATC.crimson:ATC.border}`,borderRadius:7,fontSize:13,color:ATC.textDark,background:ATC.bgWhite,outline:"none",boxSizing:"border-box"}}/>
  );
  const sel=(field,opts,placeholder)=>(
    <select value={form[field]||""} onChange={e=>set(field,e.target.value)}
      style={{width:"100%",padding:"8px 11px",border:`1px solid ${ATC.border}`,borderRadius:7,fontSize:13,color:form[field]?ATC.textDark:ATC.textMuted,background:ATC.bgWhite,outline:"none",boxSizing:"border-box"}}>
      <option value="">{placeholder||"Select..."}</option>
      {opts.map(o=><option key={o} value={o}>{o}</option>)}
    </select>
  );
  const grid2={display:"grid",gridTemplateColumns:isMobile?"1fr":"1fr 1fr",gap:"0 16px"};
  const secBox={background:ATC.bgWhite,borderRadius:10,border:`1px solid ${ATC.border}`,padding:"20px 24px",marginBottom:16};
  const secTitle=(t,sub)=>(
    <div style={{marginBottom:16,paddingBottom:12,borderBottom:`2px solid ${ATC.crimsonPale}`}}>
      <div style={{display:"flex",alignItems:"center",gap:8}}>
        <div style={{width:3,height:16,background:ATC.crimson,borderRadius:2}}/>
        <h3 style={{margin:0,fontSize:15,fontWeight:800,color:ATC.textDark}}>{t}</h3>
      </div>
      {sub&&<p style={{margin:"3px 0 0 11px",fontSize:11,color:ATC.textMuted}}>{sub}</p>}
    </div>
  );

  if(saved) return (
    <div style={{minHeight:"60vh",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:16,textAlign:"center",padding:32}}>
      <div style={{width:64,height:64,borderRadius:"50%",background:ATC.greenLight,display:"flex",alignItems:"center",justifyContent:"center"}}><CheckCircle size={32} color={ATC.green}/></div>
      <h2 style={{margin:0,fontSize:22,fontWeight:800,color:ATC.textDark}}>Site Saved</h2>
      <p style={{margin:0,fontSize:14,color:ATC.textMuted,maxWidth:380}}>
        <strong>{form.siteName}</strong> ({form.title}) has been added to QMS Site Names.
      </p>
      <div style={{display:"flex",gap:10}}>
        <button onClick={()=>{setSaved(false);setForm(empty);}} style={{padding:"9px 20px",background:ATC.bgWhite,border:`1px solid ${ATC.border}`,borderRadius:7,fontSize:13,color:ATC.textMid,cursor:"pointer",fontWeight:500}}>
          Add Another
        </button>
        <button onClick={onBack} style={{display:"flex",alignItems:"center",gap:8,padding:"9px 22px",background:ATC.crimson,color:"#fff",border:"none",borderRadius:7,fontSize:13,fontWeight:700,cursor:"pointer"}}>
          <ArrowLeft size={15}/> Back to Site Names
        </button>
      </div>
    </div>
  );

  return (
    <div>
      {/* Header */}
      <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:20,flexWrap:"wrap"}}>
        <button onClick={onBack} style={{display:"flex",alignItems:"center",gap:6,padding:"7px 14px",background:ATC.bgWhite,border:`1px solid ${ATC.border}`,borderRadius:7,fontSize:13,color:ATC.textMid,cursor:"pointer",fontWeight:500}}>
          <ArrowLeft size={14}/> Back to Site Names
        </button>
        <div>
          <h1 style={{margin:0,fontSize:20,fontWeight:800,color:ATC.textDark,letterSpacing:"-0.02em"}}>New QMS Site Name</h1>
          <p style={{margin:"2px 0 0",fontSize:12,color:ATC.textMuted}}>Add a new site to QMS Site Names</p>
        </div>
      </div>

      {/* Site Identity */}
      <div style={secBox}>
        {secTitle("Site Identity")}
        <div style={grid2}>
          <F label="Site Name" required error={errors.siteName}>{inp("siteName",{placeholder:"Full site name e.g. Austar Coal Mine"})}</F>
          <F label="Short Title / Code" required error={errors.title} hint="Unique short code used across QMS e.g. AUSTAR">{inp("title",{placeholder:"e.g. AUSTAR"})}</F>
        </div>
        <F label="Site Location / Region" hint="State, country or region e.g. NSW, Kazakhstan">{inp("siteLocation",{placeholder:"e.g. NSW or QLD"})}</F>
      </div>

      {/* Site Address */}
      <div style={secBox}>
        {secTitle("Site Address")}
        <div style={grid2}>
          <F label="Street Line 1">{inp("streetLine1",{placeholder:"Street address or lot number..."})}</F>
          <F label="Street Line 2">{inp("streetLine2",{placeholder:"Optional second line..."})}</F>
          <F label="Suburb / Town">{inp("site_Suburb_Town",{placeholder:"Suburb or town..."})}</F>
          <F label="State">{sel("siteState",["NSW","QLD","VIC","WA","SA","TAS","ACT","NT","Other"],"State or region...")}</F>
          <F label="Post Code">{inp("site_PostCode",{placeholder:"Post code..."})}</F>
          <F label="Country">{inp("siteCountry",{placeholder:"Country..."})}</F>
        </div>
      </div>

      {/* Coordinates */}
      <div style={secBox}>
        {secTitle("Coordinates","Optional - used for mapping")}
        <div style={grid2}>
          <F label="Latitude" error={errors.siteLatitude} hint="Decimal degrees e.g. -32.123456">{inp("siteLatitude",{placeholder:"-32.123456"})}</F>
          <F label="Longitude" error={errors.siteLongitude} hint="Decimal degrees e.g. 151.654321">{inp("siteLongitude",{placeholder:"151.654321"})}</F>
        </div>
      </div>

      {/* Actions */}
      <div style={{display:"flex",justifyContent:"flex-end",gap:10,marginTop:4}}>
        <button onClick={onBack} style={{padding:"9px 20px",background:ATC.bgWhite,border:`1px solid ${ATC.border}`,borderRadius:7,fontSize:13,color:ATC.textMid,cursor:"pointer",fontWeight:500}}>Cancel</button>
        <button onClick={handleSave} disabled={saving} style={{display:"flex",alignItems:"center",gap:7,padding:"9px 24px",background:saving?"#9CA3AF":ATC.crimson,color:"#fff",border:"none",borderRadius:7,fontSize:13,fontWeight:700,cursor:saving?"not-allowed":"pointer",boxShadow:saving?"none":`0 2px 8px ${ATC.crimson}44`}}>
          {saving?<><RefreshCw size={13}/> Saving...</>:<><CheckCircle size={13}/> Save Site</>}
        </button>
      </div>
    </div>
  );
}



// --- Shared clickable ID button -----------------------------------------------
const ClickID=({id,onClick})=>(
  <button onClick={onClick} style={{background:"none",border:"none",padding:0,cursor:"pointer",color:ATC.crimson,fontWeight:800,fontSize:12,textDecoration:"underline",textDecorationStyle:"dotted",textUnderlineOffset:3}}>
    #{id}
  </button>
);

// --- Shared detail layout helpers ---------------------------------------------
const DetailBanner=({id,title,subtitle,badgeLeft,badgeRight})=>(
  <div style={{background:ATC.crimson,borderRadius:10,padding:"16px 24px",marginBottom:14,display:"flex",alignItems:"center",gap:20,flexWrap:"wrap",borderTop:`3px solid ${ATC.crimsonDark}`}}>
    <div style={{textAlign:"center",minWidth:70}}>
      <div style={{fontSize:10,fontWeight:700,color:"rgba(255,255,255,0.8)",textTransform:"uppercase",letterSpacing:"0.1em"}}>ID</div>
      <div style={{fontSize:32,fontWeight:900,color:"#fff",lineHeight:1}}>#{id}</div>
    </div>
    <div style={{width:1,height:48,background:"rgba(255,255,255,0.12)",flexShrink:0}}/>
    <div style={{flex:1,minWidth:160}}>
      <div style={{fontSize:18,fontWeight:800,color:"#fff",lineHeight:1.2}}>{title}</div>
      {subtitle&&<div style={{fontSize:12,color:"rgba(255,255,255,0.5)",marginTop:4}}>{subtitle}</div>}
    </div>
    {badgeLeft&&<div style={{display:"flex",gap:8,flexWrap:"wrap"}}>{badgeLeft}</div>}
  </div>
);
const DSection=({title,children})=>(
  <div style={{background:ATC.bgWhite,borderRadius:10,border:`1px solid ${ATC.border}`,padding:"20px 24px",marginBottom:14}}>
    <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:16,paddingBottom:12,borderBottom:`2px solid ${ATC.crimsonPale}`}}>
      <div style={{width:3,height:16,background:ATC.crimson,borderRadius:2}}/>
      <h3 style={{margin:0,fontSize:14,fontWeight:800,color:ATC.textDark}}>{title}</h3>
    </div>
    <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(200px,1fr))",gap:"14px 24px"}}>{children}</div>
  </div>
);
const DField=({label,value,badge,wide})=>(
  <div style={wide?{gridColumn:"1/-1"}:{}}>
    <div style={{fontSize:10,fontWeight:700,color:ATC.textMuted,textTransform:"uppercase",letterSpacing:"0.06em",marginBottom:4}}>{label}</div>
    {badge?<ApprovalBadge status={value||"-"}/>:<div style={{fontSize:13,color:value?ATC.textDark:ATC.textMuted,fontWeight:value?500:400,lineHeight:1.4}}>{value||"-"}</div>}
  </div>
);
const DetailBackBtn=({label,onClick})=>(
  <button onClick={onClick} style={{display:"flex",alignItems:"center",gap:6,padding:"7px 14px",background:ATC.bgWhite,border:`1px solid ${ATC.border}`,borderRadius:7,fontSize:13,color:ATC.textMid,cursor:"pointer",fontWeight:500}}>
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5"/><path d="M12 19l-7-7 7-7"/></svg>
    {label}
  </button>
);

// --- Detail Popup Modal -------------------------------------------------------
function DetailPopupModal({onClose,children}) {
  return (
    <div style={{position:"fixed",inset:0,zIndex:9000,display:"flex",alignItems:"flex-start",justifyContent:"center",padding:"24px 16px",overflowY:"auto"}}>
      <div onClick={onClose} style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.6)",backdropFilter:"blur(3px)"}}/>
      <div style={{position:"relative",width:"100%",maxWidth:920,background:"#D4D5D8",borderRadius:14,boxShadow:"0 24px 80px rgba(0,0,0,0.3)",maxHeight:"calc(100vh - 48px)",overflowY:"auto"}}>
        <div style={{position:"sticky",top:0,zIndex:10,display:"flex",justifyContent:"flex-end",padding:"10px 14px 0"}}>
          <button onClick={onClose} style={{display:"flex",alignItems:"center",gap:5,padding:"6px 12px",background:"rgba(255,255,255,0.95)",border:`1px solid ${ATC.border}`,borderRadius:7,fontSize:12,color:ATC.textMid,fontWeight:600,cursor:"pointer",boxShadow:"0 2px 8px rgba(0,0,0,0.12)"}}>
            <X size={13}/>Close
          </button>
        </div>
        <div style={{padding:"0 24px 28px"}}>
          {children}
        </div>
      </div>
    </div>
  );
}

// --- Sites Page ---------------------------------------------------------------
function SitesPage({isMobile}) {
  const PAGE_SIZE=20;
  const [page,setPage]=useState(1);
  const [search,setSearch]=useState("");
  const [selectedItem,setSelectedItem]=useState(null);

  const filtered=MOCK_SITES.filter(s=>
    !search||
    s.title.toLowerCase().includes(search.toLowerCase())||
    s.siteName.toLowerCase().includes(search.toLowerCase())
  );
  const items=[...filtered].sort((a,b)=>b.id-a.id).slice((page-1)*PAGE_SIZE,page*PAGE_SIZE);
  const totalPages=Math.ceil(filtered.length/PAGE_SIZE);

  return <div>
    {selectedItem&&<DetailPopupModal onClose={()=>setSelectedItem(null)}>
      <SiteDetail item={selectedItem} isModal onBack={()=>setSelectedItem(null)}/>
    </DetailPopupModal>}
    <div style={{marginBottom:20}}>
      <PageTitle title="QMS Site Names" sub={`${filtered.length.toLocaleString()} sites`}/>
    </div>
    <SectionTable
      title="All Sites" subtitle={`${filtered.length.toLocaleString()} records`}
      search={<SearchBar value={search} onChange={v=>{setSearch(v);setPage(1);}} placeholder="Search by title or site name..."/>}
      headers={["ID","Title","Site Name","Location","Address Line 1","Suburb / Town","Country","Post Code","Created"]}
      rows={items.map((s)=>[
        <ClickID id={s.id} onClick={()=>setSelectedItem(s)}/>,
        <span style={{padding:"2px 8px",borderRadius:4,background:ATC.crimsonPale,color:ATC.crimsonDark,fontSize:11,fontWeight:700}}>{s.title}</span>,
        <span style={{color:ATC.textDark,fontWeight:600}}>{s.siteName}</span>,
        <span style={{color:ATC.textMid,fontSize:12}}>{s.siteLocation||"-"}</span>,
        <span style={{color:ATC.textMid,fontSize:12}}>{s.streetLine1||"-"}</span>,
        <span style={{color:ATC.textMid,fontSize:12}}>{s.site_Suburb_Town||"-"}</span>,
        <span style={{color:ATC.textMid,fontSize:12}}>{s.siteCountry||"-"}</span>,
        <span style={{color:ATC.textMid,fontSize:12}}>{s.site_PostCode||"-"}</span>,
        <span style={{color:ATC.textMuted,fontSize:11,whiteSpace:"nowrap"}}>{s.createdAt?new Date(s.createdAt).toLocaleDateString("en-AU"):"-"}</span>,
      ])}
      page={page} totalPages={totalPages} onChange={setPage} total={filtered.length}/>
  </div>;
}

// --- Site Detail --------------------------------------------------------------
function SiteDetail({item,onBack,isModal}) {
  return <div>
    {!isModal&&<div style={{display:"flex",alignItems:"center",gap:12,marginBottom:20,flexWrap:"wrap"}}>
      <DetailBackBtn label="Back to Site Names" onClick={onBack}/>
      <div>
        <h1 style={{margin:0,fontSize:20,fontWeight:800,color:ATC.textDark,letterSpacing:"-0.02em"}}>{item.siteName}</h1>
        <p style={{margin:"3px 0 0",fontSize:12,color:ATC.textMuted}}>QMS Site Names · Record #{item.id}</p>
      </div>
    </div>}
    <div style={{background:ATC.crimson,borderRadius:10,padding:"16px 24px",marginBottom:14,display:"flex",alignItems:"center",gap:20,flexWrap:"wrap",borderTop:`3px solid ${ATC.crimsonDark}`}}>
      <div style={{textAlign:"center",minWidth:70}}>
        <div style={{fontSize:10,fontWeight:700,color:"rgba(255,255,255,0.8)",textTransform:"uppercase",letterSpacing:"0.1em"}}>ID</div>
        <div style={{fontSize:32,fontWeight:900,color:"#fff",lineHeight:1}}>#{item.id}</div>
      </div>
      <div style={{width:1,height:48,background:"rgba(255,255,255,0.12)",flexShrink:0}}/>
      <div style={{flex:1,minWidth:160}}>
        <div style={{fontSize:18,fontWeight:800,color:"#fff"}}>{item.siteName}</div>
        <div style={{fontSize:12,color:"rgba(255,255,255,0.5)",marginTop:4}}>{item.siteLocation||"Location not specified"}</div>
      </div>
      <span style={{padding:"4px 14px",borderRadius:6,background:"rgba(0,0,0,0.3)",color:"#fff",fontSize:13,fontWeight:800}}>{item.title}</span>
    </div>
    <DSection title="Site Details">
      <DField label="Site Code"      value={item.title}/>
      <DField label="Site Name"      value={item.siteName}/>
      <DField label="Location/State" value={item.siteLocation}/>
      <DField label="Country"        value={item.siteCountry}/>
      <DField label="Created"        value={item.createdAt?new Date(item.createdAt).toLocaleDateString("en-AU"):null}/>
    </DSection>
    <DSection title="Address">
      <DField label="Address Line 1" value={item.streetLine1}/>
      <DField label="Address Line 2" value={item.streetLine2}/>
      <DField label="Suburb / Town"  value={item.site_Suburb_Town}/>
      <DField label="Post Code"      value={item.site_PostCode}/>
    </DSection>
  </div>;
}

// --- QMS Master Detail --------------------------------------------------------
function QMSMasterDetail({item,onBack,backLabel="Back to QMS Master",isModal}) {
  const statusClosed = item.projectStatus===1||item.projectStatus==="1";
  return <div>
    {/* ── Page Header ── */}
    {!isModal&&<div style={{display:"flex",alignItems:"center",gap:12,marginBottom:20,flexWrap:"wrap"}}>
      <DetailBackBtn label={backLabel} onClick={onBack}/>
      <div>
        <div style={{display:"flex",alignItems:"center",gap:8}}>
          <div style={{width:4,height:22,background:ATC.crimson,borderRadius:2,flexShrink:0}}/>
          <h1 style={{margin:0,fontSize:20,fontWeight:800,color:ATC.textDark,letterSpacing:"-0.02em"}}>{item.projectName}</h1>
        </div>
        <p style={{margin:"3px 0 0 12px",fontSize:12,color:ATC.textMuted}}>QMS Master · Record ID {item.id}</p>
      </div>
    </div>}

    {/* ── Crimson Banner ── */}
    <div style={{background:ATC.crimson,borderRadius:10,padding:"18px 24px",marginBottom:14,display:"flex",alignItems:"center",gap:20,flexWrap:"wrap",boxShadow:`0 4px 20px ${ATC.crimson}44`}}>
      <div style={{textAlign:"center",minWidth:72,flexShrink:0}}>
        <div style={{fontSize:9,fontWeight:700,color:"rgba(255,255,255,0.7)",textTransform:"uppercase",letterSpacing:"0.12em",marginBottom:2}}>Record ID</div>
        <div style={{fontSize:34,fontWeight:900,color:"#fff",lineHeight:1}}>{item.id}</div>
      </div>
      <div style={{width:1,height:52,background:"rgba(255,255,255,0.15)",flexShrink:0}}/>
      <div style={{flex:1,minWidth:180}}>
        <div style={{fontSize:17,fontWeight:800,color:"#fff",lineHeight:1.25}}>{item.projectName}</div>
        <div style={{fontSize:12,color:"rgba(255,255,255,0.65)",marginTop:5,display:"flex",gap:16,flexWrap:"wrap"}}>
          <span>Project No. <strong style={{color:"#fff"}}>{item.projectNumber?item.projectNumber.replace(/,/g,""):"—"}</strong></span>
          <span>Sub No. <strong style={{color:"#fff"}}>{item.subProjectNumber||"—"}</strong></span>
          <span>Client ID <strong style={{color:"#fff"}}>{item.idClient||"—"}</strong></span>
        </div>
      </div>
      <div style={{display:"flex",gap:7,flexWrap:"wrap",alignItems:"center"}}>
        <ApprovalBadge status={item.fm01A_ApprovalStatus}/>
        <ApprovalBadge status={item.fm01B_ApprovalStatus}/>
        <span style={{padding:"4px 11px",borderRadius:99,fontSize:11,fontWeight:700,textTransform:"uppercase",
          background:statusClosed?"rgba(0,0,0,0.25)":"rgba(255,255,255,0.15)",
          color:"#fff",border:"1px solid rgba(255,255,255,0.3)"}}>
          {statusClosed?"Closed":"Active"}
        </span>
      </div>
    </div>

    {/* ── 1. Project Identification ── */}
    <DSection title="Project Identification">
      <DField label="ID"                  value={String(item.id)}/>
      <DField label="Project Name"        value={item.projectName}/>
      <DField label="Project Number"      value={item.projectNumber?item.projectNumber.replace(/,/g,""):null}/>
      <DField label="Sub-Project Name"    value={item.subProjectName}/>
      <DField label="Sub-Project Number"  value={item.subProjectNumber}/>
      <DField label="Client ID (ID_Client)" value={item.idClient?String(item.idClient):null}/>
    </DSection>

    {/* ── 2. Site & Office ── */}
    <DSection title="Site & Office">
      <DField label="Site Name"             value={item.siteName}/>
      <DField label="Site Short Name"       value={item.siteShortName}/>
      <DField label="Office for Submission" value={item.officeForFormSubmission}/>
      <DField label="Project Status"        value={statusClosed?"Closed (1)":"Active (0)"}/>
      <DField label="V5"                    value={item.v5}/>
    </DSection>

    {/* ── 3. Team ── */}
    <DSection title="Team">
      <DField label="Created By"              value={item.createdBy}/>
      <DField label="Project Manager"         value={item.projectManagerName}/>
      <DField label="Sub-Project Manager"     value={item.subProjectManagerName}/>
    </DSection>

    {/* ── 4. FM-01A Opportunity Initiation ── */}
    <DSection title="FM-01A · Opportunity Initiation">
      <DField label="FM-01A Approval Status"  value={item.fm01A_ApprovalStatus}  badge/>
      <DField label="FM-01A Approved By"      value={item.fm01A_ApprovedBy}/>
      <DField label="FM-01A Approved Date"    value={item.fm01A_ApprovedDate}/>
      <DField label="FM-01A OM Approval Status" value={item.fm01A_OM_ApprovalStatus} badge/>
      <DField label="FM-01A OM Approved By"   value={item.fm01A_OM_ApprovedBy}/>
      <DField label="FM-01A OM Approved Date" value={item.fm01A_OM_ApprovedDate}/>
      <DField label="FM-01A OM Recommendations" value={item.fm01A_OM_Recommendations} wide/>
    </DSection>

    {/* ── 5. FM-01B Contract Award ── */}
    <DSection title="FM-01B · Contract Award">
      <DField label="FM-01B Approval Status" value={item.fm01B_ApprovalStatus} badge/>
      <DField label="FM-01B Approved By"     value={item.fm01B_ApprovedBy}/>
      <DField label="FM-01B Approved Date"   value={item.fm01B_ApprovedDate}/>
    </DSection>

    {/* ── 6. FM-19 Project Closure ── */}
    <DSection title="FM-19 · Project Closure">
      <DField label="FM-19 Closed By"   value={item.fm19_ClosedBy}/>
      <DField label="FM-19 Closed Date" value={item.fm19_ClosedDate}/>
    </DSection>

    {/* ── 7. Record Audit ── */}
    <DSection title="Record Audit">
      <DField label="Created"      value={item.createdAt}/>
      <DField label="Last Modified" value={item.modifiedAt}/>
    </DSection>

    {/* ── Actions ── */}
    <div style={{background:ATC.bgWhite,borderRadius:10,border:`1px solid ${ATC.border}`,padding:"16px 24px",display:"flex",gap:10,flexWrap:"wrap"}}>
      <button style={{display:"flex",alignItems:"center",gap:6,padding:"8px 18px",background:ATC.greenLight,color:ATC.green,border:`1px solid ${ATC.green}33`,borderRadius:7,fontSize:13,fontWeight:700,cursor:"pointer"}}><CheckCircle size={14}/>Approve FM-01A</button>
      <button style={{display:"flex",alignItems:"center",gap:6,padding:"8px 18px",background:ATC.crimsonPale,color:ATC.crimsonDark,border:`1px solid ${ATC.crimson}33`,borderRadius:7,fontSize:13,fontWeight:700,cursor:"pointer"}}><XCircle size={14}/>Reject FM-01A</button>
      <button style={{display:"flex",alignItems:"center",gap:6,padding:"8px 18px",background:ATC.blueLight,color:ATC.blue,border:`1px solid ${ATC.blue}33`,borderRadius:7,fontSize:13,fontWeight:700,cursor:"pointer"}}><FileText size={14}/>View FM-01A Form</button>
    </div>
  </div>;
}

// --- Client Contacts Detail ---------------------------------------------------
function ClientContactDetail({item,onBack,isModal}) {
  return <div>
    {!isModal&&<div style={{display:"flex",alignItems:"center",gap:12,marginBottom:20,flexWrap:"wrap"}}>
      <DetailBackBtn label="Back to Client Contacts" onClick={onBack}/>
      <div>
        <h1 style={{margin:0,fontSize:20,fontWeight:800,color:ATC.textDark,letterSpacing:"-0.02em"}}>{item.contactName}</h1>
        <p style={{margin:"3px 0 0",fontSize:12,color:ATC.textMuted}}>Client Contacts - Record #{item.id}</p>
      </div>
    </div>}
    <div style={{background:ATC.crimson,borderRadius:10,padding:"16px 24px",marginBottom:14,display:"flex",alignItems:"center",gap:20,flexWrap:"wrap",borderTop:`3px solid ${ATC.crimsonDark}`}}>
      <div style={{textAlign:"center",minWidth:70}}>
        <div style={{fontSize:10,fontWeight:700,color:"rgba(255,255,255,0.8)",textTransform:"uppercase",letterSpacing:"0.1em"}}>Record ID</div>
        <div style={{fontSize:32,fontWeight:900,color:"#fff",lineHeight:1}}>#{item.id}</div>
      </div>
      <div style={{width:1,height:48,background:"rgba(255,255,255,0.12)",flexShrink:0}}/>
      <div style={{flex:1,minWidth:160}}>
        <div style={{fontSize:18,fontWeight:800,color:"#fff"}}>{item.contactSalutation} {item.contactName}</div>
        <div style={{fontSize:12,color:"rgba(255,255,255,0.8)",marginTop:4,fontWeight:600}}>{item.clientName}</div>
      </div>
      <span style={{padding:"4px 14px",borderRadius:99,background:"rgba(255,255,255,0.12)",color:"rgba(255,255,255,0.75)",fontSize:12,fontWeight:600}}>{item.contactPosition||"No position"}</span>
    </div>
    <DSection title="Contact Details">
      <DField label="Full Name"    value={`${item.contactSalutation||""} ${item.contactName}`.trim()}/>
      <DField label="Salutation"   value={item.contactSalutation}/>
      <DField label="Position"     value={item.contactPosition}/>
      <DField label="Company"      value={item.clientName}/>
      <DField label="Phone"        value={item.contactPhone}/>
      <DField label="Mobile"       value={item.contactMobile}/>
      <DField label="Email"        value={item.contactEmail}/>
    </DSection>
    <DSection title="ATC Williams Relationship">
      <DField label="ATC Link"          value={item.atcLink}/>
      <DField label="Sourced Contact At" value={item.sourcedContactAt}/>
    </DSection>
  </div>;
}

// --- Client Detail ------------------------------------------------------------
function ClientDetail({item,onBack,isModal}) {
  return <div>
    {!isModal&&<div style={{display:"flex",alignItems:"center",gap:12,marginBottom:20,flexWrap:"wrap"}}>
      <DetailBackBtn label="Back to Clients" onClick={onBack}/>
      <div>
        <h1 style={{margin:0,fontSize:20,fontWeight:800,color:ATC.textDark,letterSpacing:"-0.02em"}}>{item.companyName}</h1>
        <p style={{margin:"3px 0 0",fontSize:12,color:ATC.textMuted}}>Clients - Record #{item.id}</p>
      </div>
    </div>}
    <div style={{background:ATC.crimson,borderRadius:10,padding:"16px 24px",marginBottom:14,display:"flex",alignItems:"center",gap:20,flexWrap:"wrap",borderTop:`3px solid ${ATC.crimsonDark}`}}>
      <div style={{textAlign:"center",minWidth:70}}>
        <div style={{fontSize:10,fontWeight:700,color:"rgba(255,255,255,0.8)",textTransform:"uppercase",letterSpacing:"0.1em"}}>Record ID</div>
        <div style={{fontSize:32,fontWeight:900,color:"#fff",lineHeight:1}}>#{item.id}</div>
      </div>
      <div style={{width:1,height:48,background:"rgba(255,255,255,0.12)",flexShrink:0}}/>
      <div style={{flex:1,minWidth:160}}>
        <div style={{fontSize:18,fontWeight:800,color:"#fff"}}>{item.companyName}</div>
        <div style={{fontSize:12,color:"rgba(255,255,255,0.5)",marginTop:4}}>ABN: {item.companyABN||"Not provided"}</div>
      </div>
    </div>
    <DSection title="Company Details">
      <DField label="Company Name"     value={item.companyName}/>
      <DField label="ABN"              value={item.companyABN}/>
      <DField label="Phone"            value={item.companyPhone}/>
      <DField label="Email"            value={item.companyEmailAddress}/>
      <DField label="Website"          value={item.companyWebSite}/>
    </DSection>
    <DSection title="Address">
      <DField label="Address Line 1"   value={item.companyAddressLine1}/>
      <DField label="Address Line 2"   value={item.companyAddressLine2}/>
      <DField label="Suburb"           value={item.companySuburb}/>
      <DField label="State"            value={item.companyState}/>
      <DField label="Post Code"        value={item.companyPostCode}/>
      <DField label="Country"          value={item.companyCountry}/>
    </DSection>
  </div>;
}



// --- QMS Master Page ----------------------------------------------------------
function QMSMasterPage() {
  const PAGE_SIZE=20;
  const [page,setPage]=useState(1);
  const [search,setSearch]=useState("");
  const [statusFilter,setStatusFilter]=useState("");
  const [selectedItem,setSelectedItem]=useState(null);

  const filtered=MOCK_OPPORTUNITIES.filter(o=>{
    const term=search.toLowerCase();
    const matchSearch=!search||
      o.projectName.toLowerCase().includes(term)||
      (o.projectNumber||"").replace(/,/g,"").toLowerCase().includes(term)||
      (o.projectManagerName||"").toLowerCase().includes(term);
    const matchStatus=!statusFilter||(statusFilter==="active"?o.projectStatus===0:o.projectStatus===1);
    return matchSearch&&matchStatus;
  });
  const items=[...filtered].sort((a,b)=>b.id-a.id).slice((page-1)*PAGE_SIZE,page*PAGE_SIZE);
  const totalPages=Math.ceil(filtered.length/PAGE_SIZE);

  return <div>
    {selectedItem&&<DetailPopupModal onClose={()=>setSelectedItem(null)}><QMSMasterDetail item={selectedItem} isModal onBack={()=>setSelectedItem(null)}/></DetailPopupModal>}
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:20,flexWrap:"wrap",gap:10}}>
      <PageTitle title="QMS Master" sub={`${filtered.length.toLocaleString()} records - ID descending`}/>
    </div>

    {/* Filters */}
    <div style={{display:"flex",gap:8,marginBottom:16,flexWrap:"wrap"}}>
      <SearchBar value={search} onChange={v=>{setSearch(v);setPage(1);}} placeholder="Search Project Name, Project No or Project Manager..."/>
      <select value={statusFilter} onChange={e=>{setStatusFilter(e.target.value);setPage(1);}}
        style={{padding:"7px 12px",border:`1px solid ${ATC.border}`,borderRadius:7,fontSize:13,color:ATC.textMid,background:ATC.bgWhite,outline:"none"}}>
        <option value="">All Statuses</option>
        <option value="active">Active</option>
        <option value="closed">Closed</option>
      </select>
    </div>

    <div style={{background:ATC.bgWhite,borderRadius:10,border:`1px solid ${ATC.border}`,overflow:"hidden"}}>
      <div style={{overflowX:"auto"}}>
        <table style={{width:"100%",borderCollapse:"collapse",fontSize:13}}>
          <thead>
            <tr style={{background:ATC.bg,borderBottom:`2px solid ${ATC.border}`}}>
              {["ID v","Project Name","Project No.","Sub-Project","Project Manager","Sub-PM","Office","Client","FM-01A","FM-01B","OM Status","Status","Created"].map(h=><TH key={h}>{h}</TH>)}
            </tr>
          </thead>
          <tbody>
            {items.map((o,i)=>(
              <tr key={o.id} style={{borderBottom:`1px solid ${ATC.bg}`,background:i%2===0?ATC.bgWhite:"#FAFAFA"}}>
                <td style={{padding:"9px 13px"}}><ClickID id={o.id} onClick={()=>setSelectedItem(o)}/></td>
                <td style={{padding:"9px 13px",maxWidth:200}}><div style={{overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",color:ATC.textDark,fontWeight:600}}>{o.projectName}</div></td>
                <td style={{padding:"9px 13px"}}><span style={{color:ATC.crimson,fontWeight:600,fontSize:12}}>{o.projectNumber?(o.projectNumber.replace(/,/g,"")):"-"}</span></td>
                <td style={{padding:"9px 13px",maxWidth:160}}><div style={{overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",color:ATC.textMid,fontSize:12}}>{o.subProjectName||"-"}</div></td>
                <td style={{padding:"9px 13px",whiteSpace:"nowrap",color:ATC.textMid,fontSize:12}}>{o.projectManagerName||"-"}</td>
                <td style={{padding:"9px 13px",whiteSpace:"nowrap",color:ATC.textMid,fontSize:12}}>{o.subProjectManagerName||"-"}</td>
                <td style={{padding:"9px 13px",whiteSpace:"nowrap",color:ATC.textMid,fontSize:12}}>{o.officeForFormSubmission||"-"}</td>
                <td style={{padding:"9px 13px",color:ATC.textMid,fontSize:12}}>{o.clientName||"-"}</td>
                <td style={{padding:"9px 13px"}}><ApprovalBadge status={o.fm01A_ApprovalStatus}/></td>
                <td style={{padding:"9px 13px"}}><ApprovalBadge status={o.fm01B_ApprovalStatus}/></td>
                <td style={{padding:"9px 13px"}}><ApprovalBadge status={o.fm01A_OM_ApprovalStatus}/></td>
                <td style={{padding:"9px 13px"}}>
                  <span style={{padding:"2px 8px",borderRadius:4,fontSize:10,fontWeight:700,textTransform:"uppercase",background:o.projectStatus===0?ATC.blueLight:ATC.slateLight,color:o.projectStatus===0?ATC.blue:ATC.slate}}>
                    {o.projectStatus===0?"Active":"Closed"}
                  </span>
                </td>
                <td style={{padding:"9px 13px",whiteSpace:"nowrap",color:ATC.textMuted,fontSize:11}}>{new Date(o.createdAt).toLocaleDateString("en-AU")}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div style={{borderTop:`1px solid ${ATC.bg}`,display:"flex",justifyContent:"space-between",alignItems:"center",padding:"0 14px",flexWrap:"wrap",gap:8}}>
        <span style={{fontSize:12,color:ATC.textMuted,padding:"10px 0"}}>Showing {(page-1)*PAGE_SIZE+1}-{Math.min(page*PAGE_SIZE,filtered.length)} of {filtered.length.toLocaleString()}</span>
        <Pagination page={page} totalPages={totalPages} onChange={setPage}/>
      </div>
    </div>
  </div>;
}

// --- Client Contacts Page -----------------------------------------------------
const MOCK_CONTACTS = Array.from({length:2806},(_,i)=>({
  id:2806-i,
  clientId:MOCK_CLIENTS[i%MOCK_CLIENTS.length].id,
  clientName:MOCK_CLIENTS[i%MOCK_CLIENTS.length].companyName,
  contactName:["James Smith","Mary Johnson","Robert Williams","Patricia Brown","Michael Jones","Linda Garcia","William Miller","Barbara Davis","David Wilson","Elizabeth Moore"][i%10],
  contactSalutation:["Mr","Ms","Dr","Mrs","Mr"][i%5],
  contactPosition:["Project Manager","Director","Senior Engineer","Principal Consultant","Environmental Manager","Technical Lead","Site Manager","Operations Director","Business Development","Account Manager"][i%10],
  contactPhone:`+61 2 ${9000+i%1000} ${1000+i%9999}`,
  contactMobile:`+61 4${10+i%89} ${100+i%900} ${100+i%999}`,
  contactEmail:`contact${i}@company.com`,
  atcLink:["Dilum Fernando","Tony Marszalek","Colin Jenner"][i%3],
  sourcedContactAt:["LinkedIn","Referral","Conference","Direct","Website"][i%5],
}));

// --- New Client Contact Form --------------------------------------------------
function NewClientContactForm({onBack,isMobile}) {
  const empty={
    clientID:"", contactSalutation:"", contactName:"",
    contactPosition:"", contactPhone:"", contactMobile:"",
    contactEmail:"", atcLink:"", sourcedContactAt:"",
  };
  const [form,setForm]=useState(empty);
  const [saving,setSaving]=useState(false);
  const [saved,setSaved]=useState(false);
  const [errors,setErrors]=useState({});

  const set=(k,v)=>setForm(f=>({...f,[k]:v}));

  const validate=()=>{
    const e={};
    if(!form.contactName.trim()) e.contactName="Contact name is required.";
    if(!form.clientID) e.clientID="Please select a company.";
    if(form.contactEmail&&!/\S+@\S+\.\S+/.test(form.contactEmail)) e.contactEmail="Invalid email address.";
    setErrors(e);
    return Object.keys(e).length===0;
  };

  async function handleSave() {
    if(!validate()) return;
    setSaving(true);
    await new Promise(r=>setTimeout(r,1000));
    setSaving(false); setSaved(true);
  }

  const F=({label,required,error,hint,children})=>(
    <div style={{marginBottom:16}}>
      <label style={{display:"block",fontSize:12,fontWeight:700,color:error?ATC.crimson:ATC.textMid,marginBottom:5,textTransform:"uppercase",letterSpacing:"0.04em"}}>
        {label}{required&&<span style={{color:ATC.crimson,marginLeft:3}}>*</span>}
      </label>
      {children}
      {hint&&<p style={{margin:"4px 0 0",fontSize:11,color:ATC.textMuted}}>{hint}</p>}
      {error&&<p style={{margin:"4px 0 0",fontSize:11,color:ATC.crimson}}>{error}</p>}
    </div>
  );
  const inp=(field,props={})=>(
    <input value={form[field]||""} onChange={e=>set(field,e.target.value)} {...props}
      style={{width:"100%",padding:"8px 11px",border:`1px solid ${errors[field]?ATC.crimson:ATC.border}`,borderRadius:7,fontSize:13,color:ATC.textDark,background:ATC.bgWhite,outline:"none",boxSizing:"border-box"}}/>
  );
  const sel=(field,opts,placeholder)=>(
    <select value={form[field]||""} onChange={e=>set(field,e.target.value)}
      style={{width:"100%",padding:"8px 11px",border:`1px solid ${errors[field]?ATC.crimson:ATC.border}`,borderRadius:7,fontSize:13,color:form[field]?ATC.textDark:ATC.textMuted,background:ATC.bgWhite,outline:"none",boxSizing:"border-box"}}>
      <option value="">{placeholder||"Select..."}</option>
      {opts.map(o=>typeof o==="object"?<option key={o.value} value={o.value}>{o.label}</option>:<option key={o} value={o}>{o}</option>)}
    </select>
  );
  const grid2={display:"grid",gridTemplateColumns:isMobile?"1fr":"1fr 1fr",gap:"0 16px"};
  const secBox={background:ATC.bgWhite,borderRadius:10,border:`1px solid ${ATC.border}`,padding:"20px 24px",marginBottom:16};
  const secTitle=(t,sub)=>(
    <div style={{marginBottom:16,paddingBottom:12,borderBottom:`2px solid ${ATC.crimsonPale}`}}>
      <div style={{display:"flex",alignItems:"center",gap:8}}>
        <div style={{width:3,height:16,background:ATC.crimson,borderRadius:2}}/>
        <h3 style={{margin:0,fontSize:15,fontWeight:800,color:ATC.textDark}}>{t}</h3>
      </div>
      {sub&&<p style={{margin:"3px 0 0 11px",fontSize:11,color:ATC.textMuted}}>{sub}</p>}
    </div>
  );

  const clientOpts=MOCK_CLIENTS.slice(0,100).map(c=>({value:String(c.id),label:c.companyName}));

  if(saved) return (
    <div style={{minHeight:"60vh",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:16,textAlign:"center",padding:32}}>
      <div style={{width:64,height:64,borderRadius:"50%",background:ATC.greenLight,display:"flex",alignItems:"center",justifyContent:"center"}}><CheckCircle size={32} color={ATC.green}/></div>
      <h2 style={{margin:0,fontSize:22,fontWeight:800,color:ATC.textDark}}>Contact Saved</h2>
      <p style={{margin:0,fontSize:14,color:ATC.textMuted,maxWidth:380}}>
        <strong>{form.contactName}</strong> has been added to Client Contacts.
      </p>
      <div style={{display:"flex",gap:10}}>
        <button onClick={()=>{setSaved(false);setForm(empty);}} style={{padding:"9px 20px",background:ATC.bgWhite,border:`1px solid ${ATC.border}`,borderRadius:7,fontSize:13,color:ATC.textMid,cursor:"pointer",fontWeight:500}}>
          Add Another
        </button>
        <button onClick={onBack} style={{display:"flex",alignItems:"center",gap:8,padding:"9px 22px",background:ATC.crimson,color:"#fff",border:"none",borderRadius:7,fontSize:13,fontWeight:700,cursor:"pointer"}}>
          <ArrowLeft size={15}/> Back to Contacts
        </button>
      </div>
    </div>
  );

  return (
    <div>
      {/* Header */}
      <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:20,flexWrap:"wrap"}}>
        <button onClick={onBack} style={{display:"flex",alignItems:"center",gap:6,padding:"7px 14px",background:ATC.bgWhite,border:`1px solid ${ATC.border}`,borderRadius:7,fontSize:13,color:ATC.textMid,cursor:"pointer",fontWeight:500}}>
          <ArrowLeft size={14}/> Back to Contacts
        </button>
        <div>
          <h1 style={{margin:0,fontSize:20,fontWeight:800,color:ATC.textDark,letterSpacing:"-0.02em"}}>New Client Contact</h1>
          <p style={{margin:"2px 0 0",fontSize:12,color:ATC.textMuted}}>Add a new contact linked to an existing client</p>
        </div>
      </div>

      {/* Company Link */}
      <div style={secBox}>
        {secTitle("Link to Company","Select the client this contact belongs to")}
        <F label="Company" required error={errors.clientID}>
          {sel("clientID",clientOpts,"Select company...")}
        </F>
      </div>

      {/* Contact Details */}
      <div style={secBox}>
        {secTitle("Contact Details")}
        <div style={grid2}>
          <F label="Salutation">{sel("contactSalutation",["Mr","Mrs","Ms","Dr","Prof"],"Salutation...")}</F>
          <F label="Contact Name" required error={errors.contactName}>{inp("contactName",{placeholder:"Full name..."})}</F>
          <F label="Position / Title">{inp("contactPosition",{placeholder:"e.g. Project Manager"})}</F>
          <F label="Contact Phone">{inp("contactPhone",{placeholder:"+61 ...",type:"tel"})}</F>
          <F label="Contact Mobile">{inp("contactMobile",{placeholder:"+61 4...",type:"tel"})}</F>
          <F label="Contact Email" error={errors.contactEmail}>{inp("contactEmail",{placeholder:"email@company.com",type:"email"})}</F>
        </div>
      </div>

      {/* Additional Info */}
      <div style={secBox}>
        {secTitle("Additional Information")}
        <div style={grid2}>
          <F label="ATC Link" hint="Internal ATC Williams staff member who manages this contact">{inp("atcLink",{placeholder:"e.g. Dilum Fernando"})}</F>
          <F label="Sourced Contact At" hint="Where or how this contact was sourced">{inp("sourcedContactAt",{placeholder:"e.g. LinkedIn, Conference..."})}</F>
        </div>
      </div>

      {/* Actions */}
      <div style={{display:"flex",justifyContent:"flex-end",gap:10,marginTop:4}}>
        <button onClick={onBack} style={{padding:"9px 20px",background:ATC.bgWhite,border:`1px solid ${ATC.border}`,borderRadius:7,fontSize:13,color:ATC.textMid,cursor:"pointer",fontWeight:500}}>Cancel</button>
        <button onClick={handleSave} disabled={saving} style={{display:"flex",alignItems:"center",gap:7,padding:"9px 24px",background:saving?"#9CA3AF":ATC.crimson,color:"#fff",border:"none",borderRadius:7,fontSize:13,fontWeight:700,cursor:saving?"not-allowed":"pointer",boxShadow:saving?"none":`0 2px 8px ${ATC.crimson}44`}}>
          {saving?<><RefreshCw size={13}/> Saving...</>:<><CheckCircle size={13}/> Save Contact</>}
        </button>
      </div>
    </div>
  );
}

function ClientContactsPage({isMobile}) {
  const [page,setPage]=useState(1);
  const [search,setSearch]=useState("");
  const [showForm,setShowForm]=useState(false);
  const [selectedItem,setSelectedItem]=useState(null);

  const filtered=MOCK_CONTACTS.filter(c=>!search||
    c.contactName.toLowerCase().includes(search.toLowerCase())||
    c.clientName.toLowerCase().includes(search.toLowerCase())||
    (c.contactEmail||"").toLowerCase().includes(search.toLowerCase()));
  const items=[...filtered].sort((a,b)=>b.id-a.id).slice((page-1)*PAGE_SIZE,page*PAGE_SIZE);
  const totalPages=Math.ceil(filtered.length/PAGE_SIZE);

  if(showForm) return <NewClientContactForm onBack={()=>setShowForm(false)} isMobile={isMobile}/>;

  return <div>
    {selectedItem&&<DetailPopupModal onClose={()=>setSelectedItem(null)}><ClientContactDetail item={selectedItem} isModal onBack={()=>setSelectedItem(null)}/></DetailPopupModal>}
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:20,flexWrap:"wrap",gap:10}}>
      <PageTitle title="Client Contacts" sub={`${filtered.length.toLocaleString()} contacts - ID descending`}/>
      <button onClick={()=>setShowForm(true)} style={{display:"flex",alignItems:"center",gap:7,padding:"9px 20px",background:ATC.crimson,color:"#fff",border:"none",borderRadius:8,fontSize:13,fontWeight:700,cursor:"pointer",boxShadow:`0 3px 10px ${ATC.crimson}55`,alignSelf:"flex-start"}}>
        <Plus size={15}/> New Client Contact
      </button>
    </div>

    <div style={{marginBottom:16}}>
      <SearchBar value={search} onChange={v=>{setSearch(v);setPage(1);}} placeholder="Search contact name, company or email..."/>
    </div>

    <div style={{background:ATC.bgWhite,borderRadius:10,border:`1px solid ${ATC.border}`,overflow:"hidden"}}>
      <div style={{overflowX:"auto"}}>
        <table style={{width:"100%",borderCollapse:"collapse",fontSize:13}}>
          <thead>
            <tr style={{background:ATC.bg,borderBottom:`2px solid ${ATC.border}`}}>
              {["ID v","Name","Salutation","Position","Company","Phone","Mobile","Email","ATC Link","Sourced At"].map(h=><TH key={h}>{h}</TH>)}
            </tr>
          </thead>
          <tbody>
            {items.map((c,i)=>(
              <tr key={c.id} style={{borderBottom:`1px solid ${ATC.bg}`,background:i%2===0?ATC.bgWhite:"#FAFAFA"}}>
                <td style={{padding:"9px 13px"}}><ClickID id={c.id} onClick={()=>setSelectedItem(c)}/></td>
                <td style={{padding:"9px 13px",whiteSpace:"nowrap"}}><span style={{color:ATC.textDark,fontWeight:600}}>{c.contactName}</span></td>
                <td style={{padding:"9px 13px"}}><span style={{color:ATC.textMid,fontSize:12}}>{c.contactSalutation||"-"}</span></td>
                <td style={{padding:"9px 13px",maxWidth:180}}><div style={{overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",color:ATC.textMid,fontSize:12}}>{c.contactPosition||"-"}</div></td>
                <td style={{padding:"9px 13px",maxWidth:180}}><div style={{overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",color:ATC.crimson,fontSize:12,fontWeight:500}}>{c.clientName}</div></td>
                <td style={{padding:"9px 13px",whiteSpace:"nowrap",color:ATC.textMid,fontSize:12}}>{c.contactPhone||"-"}</td>
                <td style={{padding:"9px 13px",whiteSpace:"nowrap",color:ATC.textMid,fontSize:12}}>{c.contactMobile||"-"}</td>
                <td style={{padding:"9px 13px",color:ATC.blue,fontSize:12}}>{c.contactEmail||"-"}</td>
                <td style={{padding:"9px 13px",whiteSpace:"nowrap",color:ATC.textMid,fontSize:12}}>{c.atcLink||"-"}</td>
                <td style={{padding:"9px 13px",whiteSpace:"nowrap"}}><span style={{padding:"2px 8px",borderRadius:99,background:ATC.slateLight,color:ATC.slate,fontSize:11,fontWeight:500}}>{c.sourcedContactAt||"-"}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div style={{borderTop:`1px solid ${ATC.bg}`,display:"flex",justifyContent:"space-between",alignItems:"center",padding:"0 14px",flexWrap:"wrap",gap:8}}>
        <span style={{fontSize:12,color:ATC.textMuted,padding:"10px 0"}}>Showing {(page-1)*PAGE_SIZE+1}-{Math.min(page*PAGE_SIZE,filtered.length)} of {filtered.length.toLocaleString()}</span>
        <Pagination page={page} totalPages={totalPages} onChange={setPage}/>
      </div>
    </div>
  </div>;
}


// --- Shared form page table ---------------------------------------------------
function GenericDetailModal({item,badge,title,onClose}) {
  const fmtKey=k=>{
    const words=k.replace(/([A-Z])/g,' $1').trim().split(/\s+/);
    return words.map(w=>{
      const u=w.toUpperCase();
      return ['ID','PM','OM','FM','PFI','MC','ADT','ATC','URL','QMS','KPI','SID','CADD','RFI','PO','DT'].includes(u)?u:w.charAt(0).toUpperCase()+w.slice(1).toLowerCase();
    }).join(' ');
  };
  const fmtVal=v=>{
    if(v===null||v===undefined||v==='') return '—';
    if(typeof v==='string'&&/^\d{4}-\d{2}-\d{2}T/.test(v)){try{return new Date(v).toLocaleString('en-AU');}catch{return v;}}
    if(v==='True') return 'Yes';
    if(v==='False') return 'No';
    return String(v);
  };
  const fields=Object.entries(item).filter(([k])=>k!=='id');
  return (
    <div style={{position:"fixed",inset:0,zIndex:9000,display:"flex",alignItems:"flex-start",justifyContent:"center",padding:"24px 16px",overflowY:"auto"}}>
      <div onClick={onClose} style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.6)",backdropFilter:"blur(3px)"}}/>
      <div style={{position:"relative",width:"100%",maxWidth:860,background:ATC.bgWhite,borderRadius:14,boxShadow:"0 24px 80px rgba(0,0,0,0.3)",overflow:"hidden"}}>
        <div style={{position:"sticky",top:0,zIndex:10,background:ATC.crimson,padding:"14px 20px",display:"flex",alignItems:"center",justifyContent:"space-between",gap:12}}>
          <div style={{display:"flex",alignItems:"center",gap:12,minWidth:0,flex:1}}>
            <div style={{flexShrink:0,textAlign:"center",minWidth:52}}>
              <div style={{fontSize:8,fontWeight:700,color:"rgba(255,255,255,0.7)",textTransform:"uppercase",letterSpacing:"0.1em"}}>ID</div>
              <div style={{fontSize:26,fontWeight:900,color:"#fff",lineHeight:1}}>{item.id}</div>
            </div>
            <div style={{width:1,height:40,background:"rgba(255,255,255,0.2)",flexShrink:0}}/>
            <div style={{minWidth:0,flex:1}}>
              <div style={{fontSize:15,fontWeight:800,color:"#fff",lineHeight:1.2}}>{title}</div>
              {badge&&<span style={{fontSize:11,color:"rgba(255,255,255,0.75)",marginTop:3,display:"block"}}>{badge} · Record #{item.id}</span>}
            </div>
          </div>
          <button onClick={onClose} style={{flexShrink:0,background:"rgba(255,255,255,0.15)",border:"1px solid rgba(255,255,255,0.3)",borderRadius:8,width:34,height:34,display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",color:"#fff"}}><X size={16}/></button>
        </div>
        <div style={{padding:"20px 24px 28px",overflowY:"auto",maxHeight:"calc(90vh - 80px)",background:"#D4D5D8"}}>
          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(210px,1fr))",gap:"12px 20px"}}>
            {fields.map(([k,v])=>(
              <div key={k} style={String(fmtVal(v)).length>80?{gridColumn:"1/-1"}:{}}>
                <div style={{fontSize:9,fontWeight:700,color:ATC.textMuted,textTransform:"uppercase",letterSpacing:"0.07em",marginBottom:3}}>{fmtKey(k)}</div>
                <div style={{fontSize:12,color:fmtVal(v)==='—'?ATC.textMuted:ATC.textDark,fontWeight:fmtVal(v)==='—'?400:500,lineHeight:1.4,wordBreak:"break-word"}}>{fmtVal(v)}</div>
              </div>
            ))}
          </div>
          <div style={{marginTop:20,paddingTop:14,borderTop:`1px solid ${ATC.border}`,display:"flex",justifyContent:"flex-end"}}>
            <button onClick={onClose} style={{padding:"8px 18px",background:ATC.bgWhite,color:ATC.textMid,border:`1px solid ${ATC.border}`,borderRadius:7,fontSize:12,fontWeight:600,cursor:"pointer"}}>Close</button>
          </div>
        </div>
      </div>
    </div>
  );
}
function FormPageTable({title,sub,headers,rows,page,totalPages,onChange,total,search,badge,rawItems}) {
  const [selItem,setSelItem]=useState(null);
  return <div>
    {selItem&&<GenericDetailModal item={selItem} badge={badge} title={title} onClose={()=>setSelItem(null)}/>}
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:18,flexWrap:"wrap",gap:10}}>
      <div>
        <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:3}}>
          <div style={{width:4,height:22,background:ATC.crimson,borderRadius:2,flexShrink:0}}/>
          <h1 style={{margin:0,fontSize:20,fontWeight:800,color:ATC.textDark,letterSpacing:"-0.02em"}}>{title}</h1>
          {badge&&<span style={{padding:"3px 10px",borderRadius:99,background:ATC.crimsonPale,color:ATC.crimsonDark,fontSize:11,fontWeight:700}}>{badge}</span>}
        </div>
        <p style={{color:ATC.textMuted,margin:"0 0 0 12px",fontSize:12}}>{sub}</p>
      </div>
      {search}
    </div>
    <div style={{background:ATC.bgWhite,borderRadius:10,border:`1px solid ${ATC.border}`,overflow:"hidden"}}>
      <div style={{overflowX:"auto"}}>
        <table style={{width:"100%",borderCollapse:"collapse",fontSize:13}}>
          <thead><tr style={{background:ATC.bg,borderBottom:`2px solid ${ATC.border}`}}>{headers.map(h=><TH key={h}>{h}</TH>)}</tr></thead>
          <tbody>
            {rows.map((cells,i)=>(
              <tr key={i} style={{borderBottom:`1px solid ${ATC.bg}`,background:i%2===0?ATC.bgWhite:"#FAFAFA"}}>
                {cells.map((cell,j)=><td key={j} style={{padding:"9px 13px",verticalAlign:"middle"}}>{j===0&&rawItems?<button onClick={()=>setSelItem(rawItems[i])} style={{background:"none",border:"none",padding:0,cursor:"pointer",color:ATC.crimson,fontWeight:800,fontSize:12,textDecoration:"underline",textDecorationStyle:"dotted",textUnderlineOffset:3}}>{cell}</button>:cell}</td>)}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div style={{borderTop:`1px solid ${ATC.bg}`,display:"flex",justifyContent:"space-between",alignItems:"center",padding:"0 14px",flexWrap:"wrap",gap:8}}>
        {total!=null
          ? <span style={{fontSize:12,color:ATC.textMuted,padding:"10px 0"}}>Showing {(page-1)*PAGE_SIZE+1}–{Math.min(page*PAGE_SIZE,total)} of {total.toLocaleString()}</span>
          : <span style={{fontSize:12,color:ATC.textMuted,padding:"10px 0"}}>{rows.length.toLocaleString()} records</span>}
        {total!=null && <Pagination page={page} totalPages={totalPages} onChange={onChange}/>}
      </div>
    </div>
  </div>;
}
const DecisionBadge=({v})=>{
  if(!v) return <span style={{color:ATC.textMuted,fontSize:12}}>-</span>;
  const go=v.trim().toUpperCase()==="GO";
  return <span style={{padding:"2px 10px",borderRadius:99,fontSize:11,fontWeight:700,background:go?ATC.greenLight:ATC.crimsonPale,color:go?ATC.green:ATC.crimsonDark}}>{v}</span>;
};
const BoolBadge=({v,yes="Yes",no="No"})=>{
  if(v===null||v===undefined) return <span style={{color:ATC.textMuted,fontSize:12}}>-</span>;
  return <span style={{padding:"2px 8px",borderRadius:4,fontSize:10,fontWeight:700,background:v?ATC.blueLight:ATC.slateLight,color:v?ATC.blue:ATC.slate}}>{v?yes:no}</span>;
};

// --- FM-01A Page --------------------------------------------------------------
function FM01APage() {
  const [page,setPage]=useState(1);
  const [search,setSearch]=useState("");
  const masterMap=Object.fromEntries(MOCK_OPPORTUNITIES.map(o=>[o.id,o]));
  const filtered=MOCK_FM01A.filter(o=>{
    const m=masterMap[o.idMaster]||{};
    const s=search.toLowerCase().replace(/,/g,"");
    return !search||String(o.idMaster||"").includes(s)||(m.projectName||"").toLowerCase().includes(s)||(m.projectNumber||"").replace(/,/g,"").toLowerCase().includes(s);
  });
  const items=[...filtered].sort((a,b)=>b.id-a.id).slice((page-1)*PAGE_SIZE,page*PAGE_SIZE);
  const totalPages=Math.ceil(filtered.length/PAGE_SIZE);
  return <FormPageTable
    title="SY-QS-FM-01A" sub={`Opportunity Initiation - ${filtered.length.toLocaleString()} records - ID descending`}
    badge="FM-01A"
    search={<SearchBar value={search} onChange={v=>{setSearch(v);setPage(1);}} placeholder="Search master ID, project name or no..."/>}
    headers={["ID v","Master ID","Project Name","Project No.","Project Type","Category","Office","Project Manager","Submitted By","Date","Fee Value","Probability","FM-01A Status"]}
    rawItems={items} rows={items.map((o,i)=>{const m=masterMap[o.idMaster]||{}; return [
      <span style={{color:ATC.crimson,fontWeight:800,fontSize:12}}>#{o.id}</span>,
      <span style={{color:ATC.textMuted,fontSize:12}}>#{o.idMaster}</span>,
      <span style={{color:ATC.textDark,fontWeight:600,maxWidth:180,overflow:"hidden",textOverflow:"ellipsis",display:"block",whiteSpace:"nowrap"}}>{m.projectName||"-"}</span>,
      <span style={{color:ATC.crimson,fontSize:12,fontWeight:500}}>{m.projectNumber?m.projectNumber.replace(/,/g,""):"-"}</span>,
      <span style={{color:ATC.textMid,fontSize:12}}>{o.projectType||"-"}</span>,
      <span style={{color:ATC.textMid,fontSize:11}}>{o.categoryList||"-"}</span>,
      <span style={{color:ATC.textMid,fontSize:12,whiteSpace:"nowrap"}}>{o.officeForFormSubmission||"-"}</span>,
      <span style={{color:ATC.textMid,fontSize:12,whiteSpace:"nowrap"}}>{o.projectManager||"-"}</span>,
      <span style={{color:ATC.textMid,fontSize:12,whiteSpace:"nowrap"}}>{o.submittedByName||"-"}</span>,
      <span style={{color:ATC.textMuted,fontSize:11,whiteSpace:"nowrap"}}>{o.submittedDateTime||"-"}</span>,
      <span style={{color:ATC.textMid,fontSize:12}}>{o.estimatedProjectFeeValue||"-"}</span>,
      <span style={{color:ATC.textMid,fontSize:12}}>{o.probabilityOfSuccess!=null&&o.probabilityOfSuccess!==""?(parseFloat(o.probabilityOfSuccess)*100).toFixed(0)+"%":"-"}</span>,
      <ApprovalBadge status={m.fm01A_ApprovalStatus||o.subProjectStatus||"-"}/>,
    ];})} page={page} totalPages={totalPages} onChange={setPage} total={filtered.length}/>;
}

// --- FM-02 Page ---------------------------------------------------------------
function FM02Page() {
  const [page,setPage]=useState(1);
  const [search,setSearch]=useState("");
  const [decisionFilter,setDecisionFilter]=useState("");
  const masterMap=useMemo(()=>Object.fromEntries(MOCK_OPPORTUNITIES.map(o=>[o.id,o])),[]);
  const filtered=MOCK_FM02.filter(o=>{
    const m=masterMap[o.idMaster]||{};
    const s=search.toLowerCase().replace(/,/g,"");
    const ms=!search||String(o.idMaster||"").includes(s)||(m.projectName||"").toLowerCase().includes(s)||(m.projectNumber||"").replace(/,/g,"").toLowerCase().includes(s);
    const md=!decisionFilter||o.finalDecision===decisionFilter;
    return ms&&md;
  });
  const items=[...filtered].sort((a,b)=>b.id-a.id).slice((page-1)*PAGE_SIZE,page*PAGE_SIZE);
  const totalPages=Math.ceil(filtered.length/PAGE_SIZE);
  const [selItem,setSelItem]=useState(null);
  return <div>
    {selItem&&<GenericDetailModal item={selItem} badge="FM-02" title="SY-QS-FM-02" onClose={()=>setSelItem(null)}/>}
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:18,flexWrap:"wrap",gap:10}}>
      <div>
        <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:3}}>
          <div style={{width:4,height:22,background:ATC.crimson,borderRadius:2}}/>
          <h1 style={{margin:0,fontSize:20,fontWeight:800,color:ATC.textDark,letterSpacing:"-0.02em"}}>SY-QS-FM-02</h1>
          <span style={{padding:"3px 10px",borderRadius:99,background:ATC.crimsonPale,color:ATC.crimsonDark,fontSize:11,fontWeight:700}}>FM-02</span>
        </div>
        <p style={{color:ATC.textMuted,margin:"0 0 0 12px",fontSize:12}}>Proposal Assessment (Go / No-Go) - {filtered.length.toLocaleString()} records - ID descending</p>
      </div>
      <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
        <SearchBar value={search} onChange={v=>{setSearch(v);setPage(1);}} placeholder="Search master ID, project name or no..."/>
        <select value={decisionFilter} onChange={e=>{setDecisionFilter(e.target.value);setPage(1);}}
          style={{padding:"7px 12px",border:`1px solid ${ATC.border}`,borderRadius:7,fontSize:13,color:ATC.textMid,background:ATC.bgWhite,outline:"none"}}>
          <option value="">All Decisions</option>
          <option value="GO">GO</option>
          <option value="NO GO">NO GO</option>
        </select>
      </div>
    </div>
    <div style={{background:ATC.bgWhite,borderRadius:10,border:`1px solid ${ATC.border}`,overflow:"hidden"}}>
      <div style={{overflowX:"auto"}}>
        <table style={{width:"100%",borderCollapse:"collapse",fontSize:13}}>
          <thead><tr style={{background:ATC.bg,borderBottom:`2px solid ${ATC.border}`}}>
            {["ID v","Master ID","Project Name","Project No.","Submitted","Fee Value","Probability","Proposal Manager","Operations Manager","OM Decision","MD Decision","Final Decision","Country","Currency","Date"].map(h=><TH key={h}>{h}</TH>)}
          </tr></thead>
          <tbody>
            {items.map((o,i)=>{const m=masterMap[o.idMaster]||{};return(
              <tr key={o.id} style={{borderBottom:`1px solid ${ATC.bg}`,background:i%2===0?ATC.bgWhite:"#FAFAFA"}}>
                <td style={{padding:"9px 13px"}}><button onClick={()=>setSelItem(o)} style={{background:"none",border:"none",padding:0,cursor:"pointer",color:ATC.crimson,fontWeight:800,fontSize:12,textDecoration:"underline",textDecorationStyle:"dotted",textUnderlineOffset:3}}>#{o.id}</button></td>
                <td style={{padding:"9px 13px"}}><span style={{color:ATC.textMuted,fontSize:12}}>#{o.idMaster}</span></td>
                <td style={{padding:"9px 13px",maxWidth:180}}><div style={{overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",color:ATC.textDark,fontWeight:600}}>{m.projectName||"-"}</div></td>
                <td style={{padding:"9px 13px"}}><span style={{color:ATC.crimson,fontSize:12,fontWeight:500}}>{m.projectNumber?m.projectNumber.replace(/,/g,""):"-"}</span></td>
                <td style={{padding:"9px 13px"}}><BoolBadge v={o.isSubmitted==="True"} yes="Yes" no="No"/></td>
                <td style={{padding:"9px 13px",whiteSpace:"nowrap",color:ATC.textMid,fontSize:12}}>{o.estimatedFeeValue}</td>
                <td style={{padding:"9px 13px",color:ATC.textMid,fontSize:12}}>{o.probabilityOfSuccess?(parseFloat(o.probabilityOfSuccess)*100).toFixed(0)+"%":"-"}</td>
                <td style={{padding:"9px 13px",whiteSpace:"nowrap",color:ATC.textMid,fontSize:12}}>{o.proposalManagerName}</td>
                <td style={{padding:"9px 13px",whiteSpace:"nowrap",color:ATC.textMid,fontSize:12}}>{o.operationsManagerName}</td>
                <td style={{padding:"9px 13px"}}><DecisionBadge v={o.operationsManagerDecision}/></td>
                <td style={{padding:"9px 13px"}}><DecisionBadge v={o.managingDirectorDecision}/></td>
                <td style={{padding:"9px 13px"}}><DecisionBadge v={o.finalDecision}/></td>
                <td style={{padding:"9px 13px",whiteSpace:"nowrap",color:ATC.textMid,fontSize:12}}>{o.country}</td>
                <td style={{padding:"9px 13px",color:ATC.textMid,fontSize:12}}>{o.contractCurrency}</td>
                <td style={{padding:"9px 13px",whiteSpace:"nowrap",color:ATC.textMuted,fontSize:11}}>{o.submittedDateTime?new Date(o.submittedDateTime).toLocaleDateString("en-AU"):"-"}</td>
              </tr>
            );})}
          </tbody>
        </table>
      </div>
      <div style={{borderTop:`1px solid ${ATC.bg}`,display:"flex",justifyContent:"space-between",alignItems:"center",padding:"0 14px",flexWrap:"wrap",gap:8}}>
        <span style={{fontSize:12,color:ATC.textMuted,padding:"10px 0"}}>Showing {(page-1)*PAGE_SIZE+1}-{Math.min(page*PAGE_SIZE,filtered.length)} of {filtered.length.toLocaleString()}</span>
        <Pagination page={page} totalPages={totalPages} onChange={setPage}/>
      </div>
    </div>
  </div>;
}

// --- FM-03A Page --------------------------------------------------------------
function FM03APage() {
  const [page,setPage]=useState(1);
  const [search,setSearch]=useState("");
  const masterMap=useMemo(()=>Object.fromEntries(MOCK_OPPORTUNITIES.map(o=>[o.id,o])),[]);
  const filtered=MOCK_FM03A.filter(o=>{const m=masterMap[o.idMaster]||{};const s=search.toLowerCase().replace(/,/g,"");return !search||String(o.idMaster||"").includes(s)||(m.projectName||"").toLowerCase().includes(s)||(m.projectNumber||"").replace(/,/g,"").toLowerCase().includes(s);});
  const items=[...filtered].sort((a,b)=>b.id-a.id).slice((page-1)*PAGE_SIZE,page*PAGE_SIZE);
  const totalPages=Math.ceil(filtered.length/PAGE_SIZE);
  const ScoreCell=({v})=>{
    if(!v) return <span style={{color:ATC.textMuted}}>-</span>;
    const col=parseInt(v)<=2?ATC.green:parseInt(v)===3?ATC.amber:ATC.crimson;
    return <span style={{padding:"2px 8px",borderRadius:4,fontSize:11,fontWeight:700,background:col+"22",color:col}}>{v}</span>;
  };
  return <FormPageTable
    title="SY-QS-FM-03A" sub={`Risk Assessment - ${filtered.length.toLocaleString()} records - ID descending`}
    badge="FM-03A"
    search={<SearchBar value={search} onChange={v=>{setSearch(v);setPage(1);}} placeholder="Search master ID, project name or no..."/>}
    headers={["ID v","Master ID","Project Name","Project No.","Submitted","Lead Reviewer","OM Approval","Pop. Risk","Tech. Complexity","Legal Exposure","Proposal Req.","Submitted By","Date"]}
    rawItems={items} rows={items.map((o,i)=>{const m=masterMap[o.idMaster]||{};return [
      <span style={{color:ATC.crimson,fontWeight:800,fontSize:12}}>#{o.id}</span>,
      <span style={{color:ATC.textMuted,fontSize:12}}>#{o.idMaster}</span>,
      <span style={{color:ATC.textDark,fontWeight:600,maxWidth:180,overflow:"hidden",textOverflow:"ellipsis",display:"block",whiteSpace:"nowrap"}}>{m.projectName||"-"}</span>,
      <span style={{color:ATC.crimson,fontSize:12,fontWeight:500}}>{m.projectNumber?m.projectNumber.replace(/,/g,""):"-"}</span>,
      <BoolBadge v={o.isSubmitted==="True"} yes="Yes" no="No"/>,
      <span style={{color:ATC.textMid,fontSize:12,whiteSpace:"nowrap"}}>{o.leadName}</span>,
      <span style={{color:ATC.textMid,fontSize:12,whiteSpace:"nowrap"}}>{o.leadOMApproval}</span>,
      <ScoreCell v={o.pfiPopulationAtRisk}/>,
      <ScoreCell v={o.pfiTechnicalComplexity}/>,
      <ScoreCell v={o.pfiLegalExposure}/>,
      <BoolBadge v={o.proposalRequired==="True"} yes="Required" no="Not Req."/>,
      <span style={{color:ATC.textMid,fontSize:12,whiteSpace:"nowrap"}}>{o.submittedByName}</span>,
      <span style={{color:ATC.textMuted,fontSize:11,whiteSpace:"nowrap"}}>{o.submittedDateTime?new Date(o.submittedDateTime).toLocaleDateString("en-AU"):"-"}</span>,
    ];})} page={page} totalPages={totalPages} onChange={setPage} total={filtered.length}/>;
}

// --- FM-04 Page ---------------------------------------------------------------
function FM04Page() {
  const [page,setPage]=useState(1);
  const [search,setSearch]=useState("");
  const masterMap=useMemo(()=>Object.fromEntries(MOCK_OPPORTUNITIES.map(o=>[o.id,o])),[]);
  const filtered=MOCK_FM04.filter(o=>{const m=masterMap[o.idMaster]||{};const s=search.toLowerCase().replace(/,/g,"");return !search||String(o.idMaster||"").includes(s)||(m.projectName||"").toLowerCase().includes(s)||(m.projectNumber||"").replace(/,/g,"").toLowerCase().includes(s);});
  const items=[...filtered].sort((a,b)=>b.id-a.id).slice((page-1)*PAGE_SIZE,page*PAGE_SIZE);
  const totalPages=Math.ceil(filtered.length/PAGE_SIZE);
  return <FormPageTable
    title="SY-QS-FM-04" sub={`Contract Review - ${filtered.length.toLocaleString()} records - ID descending`}
    badge="FM-04"
    search={<SearchBar value={search} onChange={v=>{setSearch(v);setPage(1);}} placeholder="Search master ID, project name or no..."/>}
    headers={["ID v","Master ID","Project Name","Project No.","New Contract","Contract Type","Contract No.","Signed By","Signed Date","Ext. Resources","Terms Reviewed","Budget","Currency","Created By","Created"]}
    rawItems={items} rows={items.map((o,i)=>{const m=masterMap[o.idMaster]||{};return [
      <span style={{color:ATC.crimson,fontWeight:800,fontSize:12}}>#{o.id}</span>,
      <span style={{color:ATC.textMuted,fontSize:12}}>#{o.idMaster}</span>,
      <span style={{color:ATC.textDark,fontWeight:600,maxWidth:180,overflow:"hidden",textOverflow:"ellipsis",display:"block",whiteSpace:"nowrap"}}>{m.projectName||"-"}</span>,
      <span style={{color:ATC.crimson,fontSize:12,fontWeight:500}}>{m.projectNumber?m.projectNumber.replace(/,/g,""):"-"}</span>,
      <BoolBadge v={o.newContractualArrangementRequired==="True"} yes="Yes" no="No"/>,
      <span style={{color:ATC.textMid,fontSize:12,maxWidth:160,overflow:"hidden",textOverflow:"ellipsis",display:"block",whiteSpace:"nowrap"}}>{o.contractType}</span>,
      <span style={{color:ATC.textMid,fontSize:12}}>{o.contractNo||"-"}</span>,
      <span style={{color:ATC.textMid,fontSize:12,whiteSpace:"nowrap"}}>{o.signedByName}</span>,
      <span style={{color:ATC.textMuted,fontSize:11,whiteSpace:"nowrap"}}>{o.signedByDate?new Date(o.signedByDate).toLocaleDateString("en-AU"):"-"}</span>,
      <BoolBadge v={o.externalResourcesBeUsed==="True"} yes="Yes" no="No"/>,
      <BoolBadge v={o.potentialContractTermsHaveBeenReviewed==="True"} yes="Yes" no="No"/>,
      <span style={{color:ATC.textMid,fontSize:12}}>{o.confirmedProposalBudget||"-"}</span>,
      <span style={{color:ATC.textMid,fontSize:12}}>{o.currencyType}</span>,
      <span style={{color:ATC.textMid,fontSize:12,whiteSpace:"nowrap"}}>{o.createdBy}</span>,
      <span style={{color:ATC.textMuted,fontSize:11,whiteSpace:"nowrap"}}>{o.createdAt?new Date(o.createdAt).toLocaleDateString("en-AU"):"-"}</span>,
    ];})} page={page} totalPages={totalPages} onChange={setPage} total={filtered.length}/>;
}

// --- Shared helpers for new form pages ----------------------------------------
const IdCell = ({v})=><span style={{color:ATC.crimson,fontWeight:800,fontSize:12}}>#{v}</span>;
const MidCell = ({v})=><span style={{color:ATC.textMid,fontSize:12,whiteSpace:"nowrap"}}>{v||"-"}</span>;
const NoteCell = ({v})=><span style={{color:ATC.textMid,fontSize:12,maxWidth:420,display:"block",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{v||"-"}</span>;
const DateCell = ({v})=><span style={{color:ATC.textMuted,fontSize:11,whiteSpace:"nowrap"}}>{v?new Date(v).toLocaleDateString("en-AU"):"-"}</span>;
const ScoreBadge=({v})=>{
  if(!v) return <span style={{color:ATC.textMuted}}>-</span>;
  const col=parseInt(v)<=2?ATC.green:parseInt(v)===3?ATC.amber:ATC.crimson;
  return <span style={{padding:"2px 8px",borderRadius:4,fontSize:11,fontWeight:700,background:col+"22",color:col}}>{v}</span>;
};

// Generic notes page (reused by all 5 notes tables)
function NotesPage({title,badge,data,searchFields=["idMaster","generalNote"]}) {
  const [page,setPage]=useState(1);
  const [search,setSearch]=useState("");
  const filtered=data.filter(o=>!search||
    String(o.idMaster).includes(search)||
    (o.generalNote||"").toLowerCase().includes(search.toLowerCase()));
  const items=[...filtered].sort((a,b)=>b.id-a.id).slice((page-1)*PAGE_SIZE,page*PAGE_SIZE);
  const totalPages=Math.ceil(filtered.length/PAGE_SIZE);
  return <FormPageTable
    title={title} sub={`${filtered.length.toLocaleString()} records - ID descending`} badge={badge}
    search={<SearchBar value={search} onChange={v=>{setSearch(v);setPage(1);}} placeholder="Search by Master ID or note text..."/>}
    headers={["ID v","Master ID","Note","Created"]}
    rawItems={items} rows={items.map(o=>[
      <IdCell v={o.id}/>,
      <span style={{color:ATC.textMuted,fontSize:12}}>#{o.idMaster}</span>,
      <NoteCell v={o.generalNote}/>,
      <DateCell v={o.createdAt}/>,
    ])} page={page} totalPages={totalPages} onChange={setPage} total={filtered.length}/>;
}

// --- FM-01A Manager Changes Page ----------------------------------------------
function FM01AMCPage() {
  const [page,setPage]=useState(1);
  const [search,setSearch]=useState("");
  const filtered=MOCK_FM01A_MC.filter(o=>!search||
    (o.reason||"").toLowerCase().includes(search.toLowerCase())||
    (o.projectManager||"").toLowerCase().includes(search.toLowerCase())||
    (o.subProjectManager||"").toLowerCase().includes(search.toLowerCase()));
  const items=[...filtered].sort((a,b)=>b.id-a.id).slice((page-1)*PAGE_SIZE,page*PAGE_SIZE);
  const totalPages=Math.ceil(filtered.length/PAGE_SIZE);
  return <FormPageTable
    title="FM-01A Manager Changes" sub={`Manager Change Requests - ${filtered.length.toLocaleString()} records - ID descending`} badge="FM-01A"
    search={<SearchBar value={search} onChange={v=>{setSearch(v);setPage(1);}} placeholder="Search by reason or manager name..."/>}
    headers={["ID v","Master ID","Reason","Project Manager","Sub-Project Manager","Created"]}
    rawItems={items} rows={items.map(o=>[
      <IdCell v={o.id}/>,
      <span style={{color:ATC.textMuted,fontSize:12}}>#{o.idMaster}</span>,
      <span style={{color:ATC.textDark,fontSize:12,maxWidth:300,display:"block",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{o.reason||"-"}</span>,
      <MidCell v={o.projectManager}/>,
      <MidCell v={o.subProjectManager}/>,
      <DateCell v={o.createdAt}/>,
    ])} page={page} totalPages={totalPages} onChange={setPage} total={filtered.length}/>;
}

// --- FM-01B Page (Contract Award) ---------------------------------------------
function FM01BPage() {
  const [page,setPage]=useState(1);
  const [search,setSearch]=useState("");
  const [submittedFilter,setSubmittedFilter]=useState("");
  const filtered=MOCK_FM01B.filter(o=>{
    const ms=!search||
      (o.companyName||"").toLowerCase().includes(search.toLowerCase())||
      (o.subProjectManager||"").toLowerCase().includes(search.toLowerCase())||
      (o.contractPONo||"").toLowerCase().includes(search.toLowerCase());
    const mf=!submittedFilter||o.isSubmitted===submittedFilter;
    return ms&&mf;
  });
  const items=[...filtered].sort((a,b)=>b.id-a.id).slice((page-1)*PAGE_SIZE,page*PAGE_SIZE);
  const totalPages=Math.ceil(filtered.length/PAGE_SIZE);
  return <FormPageTable
    title="SY-QS-FM-01B" sub={`Contract Award - ${filtered.length.toLocaleString()} records`}
    badge="FM-01B"
    search={<div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
      <SearchBar value={search} onChange={v=>{setSearch(v);setPage(1);}} placeholder="Search company, PM or PO no..."/>
      <select value={submittedFilter} onChange={e=>{setSubmittedFilter(e.target.value);setPage(1);}}
        style={{padding:"7px 12px",border:`1px solid ${ATC.border}`,borderRadius:7,fontSize:13,color:ATC.textMid,background:ATC.bgWhite,outline:"none"}}>
        <option value="">All Submitted</option>
        <option value="True">Submitted</option>
        <option value="False">Not Submitted</option>
      </select>
    </div>}
    headers={["ID","Master ID","Company Name","Contract / PO No","Contract Type","Signed By","Signed Date","Sub PM","Proposal OK","Planned Start","Planned End","Submitted","Modified"]}
    rawItems={items} rows={items.map(o=>[
      <span style={{color:ATC.crimson,fontWeight:800,fontSize:12}}>#{o.id}</span>,
      <span style={{color:ATC.textMuted,fontSize:12}}>#{o.idMaster}</span>,
      <span style={{color:ATC.textDark,fontWeight:600,maxWidth:160,overflow:"hidden",textOverflow:"ellipsis",display:"block",whiteSpace:"nowrap"}}>{o.companyName||"-"}</span>,
      <span style={{color:ATC.blue,fontSize:12,fontWeight:500,maxWidth:140,overflow:"hidden",textOverflow:"ellipsis",display:"block",whiteSpace:"nowrap"}}>{o.contractPONo||"-"}</span>,
      <span style={{color:ATC.textMid,fontSize:11,maxWidth:160,overflow:"hidden",textOverflow:"ellipsis",display:"block",whiteSpace:"nowrap"}}>{o.contractType||"-"}</span>,
      <span style={{color:ATC.textMid,fontSize:12,whiteSpace:"nowrap"}}>{o.signedByName||"-"}</span>,
      <span style={{color:ATC.textMuted,fontSize:11,whiteSpace:"nowrap"}}>{o.signedByDate||"-"}</span>,
      <span style={{color:ATC.textMid,fontSize:12,whiteSpace:"nowrap"}}>{o.subProjectManager||"-"}</span>,
      <BoolBadge v={o.proposalSuccessful==="True"} yes="Yes" no="No"/>,
      <span style={{color:ATC.textMuted,fontSize:11,whiteSpace:"nowrap"}}>{o.plannedStartDate||"-"}</span>,
      <span style={{color:ATC.textMuted,fontSize:11,whiteSpace:"nowrap"}}>{o.plannedEndDate||"-"}</span>,
      <BoolBadge v={o.isSubmitted==="True"} yes="Yes" no="No"/>,
      <span style={{color:ATC.textMuted,fontSize:11,whiteSpace:"nowrap"}}>{o.modified||"-"}</span>,
    ])} page={page} totalPages={totalPages} onChange={setPage} total={filtered.length}/>;
}

// --- FM-01B Notes Page --------------------------------------------------------
function FM01BNotesPage() {
  return <NotesPage title="FM-01B Notes" badge="FM-01B" data={MOCK_FM01B_NOTES}/>;
}

// --- FM-01B Tasks & Budget Page -----------------------------------------------
function FM01BTasksPage() {
  const [page,setPage]=useState(1);
  const [search,setSearch]=useState("");
  const filtered=MOCK_FM01B_TASKS.filter(o=>!search||
    (o.tasks||"").toLowerCase().includes(search.toLowerCase())||
    String(o.idMaster).includes(search)||
    (o.createdBy||"").toLowerCase().includes(search.toLowerCase()));
  const items=[...filtered].sort((a,b)=>b.id-a.id).slice((page-1)*PAGE_SIZE,page*PAGE_SIZE);
  const totalPages=Math.ceil(filtered.length/PAGE_SIZE);
  return <FormPageTable
    title="FM-01B Tasks & Budget" sub={`Tasks & Budget Records - ${filtered.length.toLocaleString()} records - ID descending`} badge="FM-01B"
    search={<SearchBar value={search} onChange={v=>{setSearch(v);setPage(1);}} placeholder="Search by task, master ID or created by..."/>}
    headers={["ID v","Master ID","Task","Budget","Created By","Modified By","Modified","Created"]}
    rawItems={items} rows={items.map(o=>[
      <IdCell v={o.id}/>,
      <span style={{color:ATC.textMuted,fontSize:12}}>#{o.idMaster}</span>,
      <span style={{color:ATC.textDark,fontSize:12,maxWidth:200,display:"block",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{o.tasks||"-"}</span>,
      <span style={{color:ATC.green,fontSize:12,fontWeight:600,whiteSpace:"nowrap"}}>{o.budget||"-"}</span>,
      <MidCell v={o.createdBy}/>,
      <MidCell v={o.modifiedBy}/>,
      <DateCell v={o.modifiedAt}/>,
      <DateCell v={o.createdAt}/>,
    ])} page={page} totalPages={totalPages} onChange={setPage} total={filtered.length}/>;
}

// --- FM-02 Notes Page ---------------------------------------------------------
function FM02NotesPage() {
  return <NotesPage title="FM-02 Notes" badge="FM-02" data={MOCK_FM02_NOTES}/>;
}

// --- FM-03A Notes Page --------------------------------------------------------
function FM03ANotesPage() {
  return <NotesPage title="FM-03A Notes" badge="FM-03A" data={MOCK_FM03A_NOTES}/>;
}

// --- FM-03B Page --------------------------------------------------------------
function FM03BPage() {
  const [page,setPage]=useState(1);
  const [search,setSearch]=useState("");
  const masterMap=useMemo(()=>Object.fromEntries(MOCK_OPPORTUNITIES.map(o=>[o.id,o])),[]);
  const filtered=MOCK_FM03B.filter(o=>{const m=masterMap[o.idMaster]||{};const s=search.toLowerCase().replace(/,/g,"");return !search||String(o.idMaster||"").includes(s)||(m.projectName||"").toLowerCase().includes(s)||(m.projectNumber||"").replace(/,/g,"").toLowerCase().includes(s)||(o.leadName||"").toLowerCase().includes(s);});
  const items=[...filtered].sort((a,b)=>b.id-a.id).slice((page-1)*PAGE_SIZE,page*PAGE_SIZE);
  const totalPages=Math.ceil(filtered.length/PAGE_SIZE);
  return <FormPageTable
    title="SY-QS-FM-03B" sub={`Project Risk Review - ${filtered.length.toLocaleString()} records - ID descending`} badge="FM-03B"
    search={<SearchBar value={search} onChange={v=>{setSearch(v);setPage(1);}} placeholder="Search master ID, project name or lead reviewer..."/>}
    headers={["ID v","Master ID","Project Name","Project No.","Submitted","Lead Reviewer","OM Approval","Pop. Risk","Env. Harm","Legal Exp.","Tech. Cmplx","Review Type","N/A","Submitted By","Date"]}
    rawItems={items} rows={items.map(o=>{const m=masterMap[o.idMaster]||{};return [
      <IdCell v={o.id}/>,
      <span style={{color:ATC.textMuted,fontSize:12}}>#{o.idMaster}</span>,
      <span style={{color:ATC.textDark,fontWeight:600,maxWidth:180,overflow:"hidden",textOverflow:"ellipsis",display:"block",whiteSpace:"nowrap"}}>{m.projectName||"-"}</span>,
      <span style={{color:ATC.crimson,fontSize:12,fontWeight:500}}>{m.projectNumber?m.projectNumber.replace(/,/g,""):"-"}</span>,
      <BoolBadge v={o.isSubmitted==="True"} yes="Yes" no="No"/>,
      <MidCell v={o.leadName}/>,
      <MidCell v={o.leadOMApproval}/>,
      <ScoreBadge v={o.pfiPopulationAtRisk}/>,
      <ScoreBadge v={o.pfiEnvironmentalHarm}/>,
      <ScoreBadge v={o.legalExposure}/>,
      <ScoreBadge v={o.technicalComplexity}/>,
      <span style={{padding:"2px 8px",borderRadius:4,fontSize:10,fontWeight:700,background:o.reviewType==="Electronic"?ATC.blueLight:ATC.slateLight,color:o.reviewType==="Electronic"?ATC.blue:ATC.slate}}>{o.reviewType||"-"}</span>,
      <BoolBadge v={o.notApplicable==="True"} yes="N/A" no="-"/>,
      <MidCell v={o.submittedByName}/>,
      <DateCell v={o.submittedDateTime}/>,
    ];})} page={page} totalPages={totalPages} onChange={setPage} total={filtered.length}/>;
}

// --- FM-03B Notes Page --------------------------------------------------------
function FM03BNotesPage() {
  return <NotesPage title="FM-03B Notes" badge="FM-03B" data={MOCK_FM03B_NOTES}/>;
}

// --- FM-04 Notes Page ---------------------------------------------------------
function FM04NotesPage() {
  return <NotesPage title="FM-04 Notes" badge="FM-04" data={MOCK_FM04_NOTES}/>;
}

// --- FM-04 Reviewers Page -----------------------------------------------------
function FM04ReviewersPage() {
  const [page,setPage]=useState(1);
  const [search,setSearch]=useState("");
  const [typeFilter,setTypeFilter]=useState("");
  const filtered=MOCK_FM04_REVIEWERS.filter(o=>{
    const ms=!search||
      (o.docNo||"").toLowerCase().includes(search.toLowerCase())||
      (o.submittedBy||"").toLowerCase().includes(search.toLowerCase())||
      (o.review1||"").toLowerCase().includes(search.toLowerCase());
    const mt=!typeFilter||o.reviewType===typeFilter;
    return ms&&mt;
  });
  const items=[...filtered].sort((a,b)=>b.id-a.id).slice((page-1)*PAGE_SIZE,page*PAGE_SIZE);
  const totalPages=Math.ceil(filtered.length/PAGE_SIZE);
  const [selItem,setSelItem]=useState(null);
  return <div>
    {selItem&&<GenericDetailModal item={selItem} badge="FM-04" title="FM-04 Reviewers" onClose={()=>setSelItem(null)}/>}
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:18,flexWrap:"wrap",gap:10}}>
      <div>
        <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:3}}>
          <div style={{width:4,height:22,background:ATC.crimson,borderRadius:2,flexShrink:0}}/>
          <h1 style={{margin:0,fontSize:20,fontWeight:800,color:ATC.textDark,letterSpacing:"-0.02em"}}>FM-04 Reviewers</h1>
          <span style={{padding:"3px 10px",borderRadius:99,background:ATC.crimsonPale,color:ATC.crimsonDark,fontSize:11,fontWeight:700}}>FM-04</span>
        </div>
        <p style={{color:ATC.textMuted,margin:"0 0 0 12px",fontSize:12}}>Document Reviewers - {filtered.length.toLocaleString()} records - ID descending</p>
      </div>
      <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
        <SearchBar value={search} onChange={v=>{setSearch(v);setPage(1);}} placeholder="Search by doc no, submitter or reviewer..."/>
        <select value={typeFilter} onChange={e=>{setTypeFilter(e.target.value);setPage(1);}}
          style={{padding:"7px 12px",border:`1px solid ${ATC.border}`,borderRadius:7,fontSize:13,color:ATC.textMid,background:ATC.bgWhite,outline:"none"}}>
          <option value="">All Types</option>
          <option value="Electronic">Electronic</option>
          <option value="Hard Copy">Hard Copy</option>
        </select>
      </div>
    </div>
    <div style={{background:ATC.bgWhite,borderRadius:10,border:`1px solid ${ATC.border}`,overflow:"hidden"}}>
      <div style={{overflowX:"auto"}}>
        <table style={{width:"100%",borderCollapse:"collapse",fontSize:13}}>
          <thead><tr style={{background:ATC.bg,borderBottom:`2px solid ${ATC.border}`}}>
            {["ID v","Master ID","Doc No","Submitted By","Review Type","Review 1","Review 2","Reviewer Sighted","Doc Type","Attachments","Date Submitted"].map(h=><TH key={h}>{h}</TH>)}
          </tr></thead>
          <tbody>
            {items.map((o,i)=>(
              <tr key={o.id} style={{borderBottom:`1px solid ${ATC.bg}`,background:i%2===0?ATC.bgWhite:"#FAFAFA"}}>
                <td style={{padding:"9px 13px"}}><button onClick={()=>setSelItem(o)} style={{background:"none",border:"none",padding:0,cursor:"pointer",color:ATC.crimson,fontWeight:800,fontSize:12,textDecoration:"underline",textDecorationStyle:"dotted",textUnderlineOffset:3}}>#{o.id}</button></td>
                <td style={{padding:"9px 13px"}}><span style={{color:ATC.textMuted,fontSize:12}}>#{o.idMaster}</span></td>
                <td style={{padding:"9px 13px"}}><span style={{color:ATC.crimson,fontSize:12,fontWeight:500,whiteSpace:"nowrap"}}>{o.docNo}</span></td>
                <td style={{padding:"9px 13px"}}><MidCell v={o.submittedBy}/></td>
                <td style={{padding:"9px 13px"}}>
                  <span style={{padding:"2px 8px",borderRadius:4,fontSize:10,fontWeight:700,background:o.reviewType==="Electronic"?ATC.blueLight:ATC.slateLight,color:o.reviewType==="Electronic"?ATC.blue:ATC.slate}}>{o.reviewType}</span>
                </td>
                <td style={{padding:"9px 13px"}}><MidCell v={o.review1}/></td>
                <td style={{padding:"9px 13px"}}><MidCell v={o.review2}/></td>
                <td style={{padding:"9px 13px"}}><MidCell v={o.reviewerSighted}/></td>
                <td style={{padding:"9px 13px"}}><span style={{color:ATC.textMid,fontSize:11}}>{o.docType}</span></td>
                <td style={{padding:"9px 13px",textAlign:"center"}}><span style={{color:ATC.textMid,fontSize:12}}>{o.attachments}</span></td>
                <td style={{padding:"9px 13px"}}><span style={{color:ATC.textMuted,fontSize:11,whiteSpace:"nowrap"}}>{o.dateSubmitted}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div style={{borderTop:`1px solid ${ATC.bg}`,display:"flex",justifyContent:"space-between",alignItems:"center",padding:"0 14px",flexWrap:"wrap",gap:8}}>
        <span style={{fontSize:12,color:ATC.textMuted,padding:"10px 0"}}>Showing {(page-1)*PAGE_SIZE+1}–{Math.min(page*PAGE_SIZE,filtered.length)} of {filtered.length.toLocaleString()}</span>
        <Pagination page={page} totalPages={totalPages} onChange={setPage}/>
      </div>
    </div>
  </div>;
}

// --- FM-04 Reviewer Docs Page -------------------------------------------------
function FM04RevDocsPage() {
  const [page,setPage]=useState(1);
  const [search,setSearch]=useState("");
  const filtered=MOCK_FM04_REVDOCS.filter(o=>!search||
    (o.title||"").toLowerCase().includes(search.toLowerCase())||
    (o.createdBy||"").toLowerCase().includes(search.toLowerCase())||
    String(o.idMaster).includes(search));
  const items=[...filtered].sort((a,b)=>b.id-a.id).slice((page-1)*PAGE_SIZE,page*PAGE_SIZE);
  const totalPages=Math.ceil(filtered.length/PAGE_SIZE);
  return <FormPageTable
    title="FM-04 Reviewer Docs" sub={`Reviewer Documents - ${filtered.length.toLocaleString()} records - ID descending`} badge="FM-04"
    search={<SearchBar value={search} onChange={v=>{setSearch(v);setPage(1);}} placeholder="Search by title, created by or master ID..."/>}
    headers={["ID v","Master ID","Reviewer ID","Title","Attachments","Created By","Created"]}
    rawItems={items} rows={items.map(o=>[
      <IdCell v={o.id}/>,
      <span style={{color:ATC.textMuted,fontSize:12}}>#{o.idMaster}</span>,
      <span style={{color:ATC.textMuted,fontSize:12}}>#{o.idReviewer}</span>,
      <span style={{padding:"2px 10px",borderRadius:99,background:ATC.blueLight,color:ATC.blue,fontSize:11,fontWeight:700}}>{o.title}</span>,
      <span style={{color:ATC.textMid,fontSize:12,textAlign:"center",display:"block"}}>{o.attachments}</span>,
      <MidCell v={o.createdBy}/>,
      <DateCell v={o.createdAt}/>,
    ])} page={page} totalPages={totalPages} onChange={setPage} total={filtered.length}/>;
}

// --- Placeholder --------------------------------------------------------------
// --- QMS Forms Page -----------------------------------------------------------
function QMSFormsPage({onNavigate}) {
  const formCards = [
    {id:"fm01a", label:"SY-QS-FM-01A", title:"Opportunity Initiation",   desc:"Initiate a new project opportunity. Captures project scope, client details, Gate Zero approval and financial estimates.", icon:Briefcase,    count:200},
    {id:"fm02",  label:"SY-QS-FM-02",  title:"Proposal Assessment",      desc:"Assess and document proposal details including contract type, fee structure and scope verification.",                  icon:FileText,     count:148},
    {id:"fm03a", label:"SY-QS-FM-03A", title:"Risk Assessment",          desc:"Identify and evaluate project risks, assign risk owners and determine mitigation strategies.",                          icon:AlertTriangle, count:312},
    {id:"fm04",  label:"SY-QS-FM-04",  title:"Contract Review",          desc:"Review and approve contract terms, purchase orders and client agreements before project commencement.",                 icon:CheckSquare,  count:95},
    {id:"fm05",  label:"SY-QS-FM-05",  title:"Project Review Plan",      desc:"Manage project review plan including reviewer sign-offs, scope of work items and general notes.",                             icon:Layers,       count:2506},
  ];
  return (
    <div>
      <PageTitle title="QMS Forms" sub="Quality Management System - Form Register"/>
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(280px,1fr))",gap:16,marginTop:8}}>
        {formCards.map(f=>{
          const Icon=f.icon;
          return (
            <div key={f.id} onClick={()=>onNavigate(f.id)}
              style={{background:ATC.bgWhite,borderRadius:10,border:`1px solid ${ATC.border}`,padding:"22px 24px",cursor:"pointer",transition:"all 0.18s",boxShadow:"0 1px 4px rgba(0,0,0,0.05)"}}>
              {/* Card header */}
              <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",marginBottom:14}}>
                <div style={{width:44,height:44,borderRadius:10,background:ATC.crimsonPale,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                  <Icon size={22} color={ATC.crimson}/>
                </div>
                <span style={{padding:"3px 10px",borderRadius:99,background:ATC.blueLight,color:ATC.blue,fontSize:11,fontWeight:700}}>{f.count} records</span>
              </div>
              {/* Form code */}
              <div style={{fontSize:11,fontWeight:800,color:ATC.crimson,letterSpacing:"0.06em",marginBottom:4}}>{f.label}</div>
              {/* Title */}
              <div style={{fontSize:15,fontWeight:800,color:ATC.textDark,marginBottom:8,lineHeight:1.3}}>{f.title}</div>
              {/* Description */}
              <p style={{margin:0,fontSize:12,color:ATC.textMuted,lineHeight:1.5}}>{f.desc}</p>
              {/* Footer */}
              <div style={{marginTop:16,paddingTop:14,borderTop:`1px solid ${ATC.border}`,display:"flex",alignItems:"center",justifyContent:"space-between"}}>
                <span style={{fontSize:12,color:ATC.textMid,fontWeight:500}}>View records</span>
                <div style={{width:28,height:28,borderRadius:6,background:ATC.crimson,display:"flex",alignItems:"center",justifyContent:"center"}}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="M12 5l7 7-7 7"/></svg>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}


// ── FM-05 pages ──────────────────────────────────────────────
// --- FM-05 Project Review Plan Page -------------------------------------------
function FM05ReviewPlanPage() {
  const [page,setPage]=useState(1);
  const [search,setSearch]=useState("");
  const filtered=MOCK_FM05_REVIEW.filter(o=>!search||
    String(o.idMaster).includes(search)||
    (o.submittedByName||"").toLowerCase().includes(search.toLowerCase())||
    (o.submittedByEmail||"").toLowerCase().includes(search.toLowerCase()));
  const items=[...filtered].sort((a,b)=>b.id-a.id).slice((page-1)*PAGE_SIZE,page*PAGE_SIZE);
  const totalPages=Math.ceil(filtered.length/PAGE_SIZE);
  return <FormPageTable
    title="SY-QS-FM-05" sub={`Project Review Plan - ${filtered.length.toLocaleString()} records`} badge="FM-05"
    search={<SearchBar value={search} onChange={v=>{setSearch(v);setPage(1);}} placeholder="Search by master ID, submitted by name or email..."/>}
    headers={["ID v","Master ID","Is Submitted","Rev Name Discussion","Rev Name Agree","Rev Name Scope","Rev Name Results","Rev Name Interpretation","Rev Name Deliverable","Rev Name Partial 30","Rev Name Partial 50","Rev Name Preliminary","Rev Name Draft","Rev Name Constructability","Rev Name Final","Rev Name Check","PM Sign Discussion","PM Sign Agree","PM Sign Scope","PM Sign Results","PM Sign Interpretation","PM Sign Deliverable","PM Sign Partial 30","PM Sign Partial 50","PM Sign Preliminary","PM Sign Draft","PM Sign Constructability","PM Sign Final","PM Sign Check","Rev Sign Discussion","Rev Sign Agree","Rev Sign Scope","Rev Sign Results","Rev Sign Interpretation","Rev Sign Deliverable","Rev Sign Partial 30","Rev Sign Partial 50","Rev Sign Preliminary","Rev Sign Draft","Rev Sign Constructability","Rev Sign Final","Rev Sign Check","PM Sign Discussion Date","PM Sign Agree Date","PM Sign Scope Date","PM Sign Results Date","PM Sign Interpretation Date","PM Sign Deliverable Date","PM Sign Partial 30 Date","PM Sign Partial 50 Date","PM Sign Preliminary Date","PM Sign Draft Date","PM Sign Constructability Date","PM Sign Final Date","PM Sign Check Date","Rev Sign Discussion Date","Rev Sign Agree Date","Rev Sign Scope Date","Rev Sign Results Date","Rev Sign Interpretation Date","Rev Sign Deliverable Date","Rev Sign Partial 30 Date","Rev Sign Partial 50 Date","Rev Sign Preliminary Date","Rev Sign Draft Date","Rev Sign Constructability Date","Rev Sign Final Date","Rev Sign Check Date","Submitted By Email","Submitted By Name","Submitted Date","Rev Email Discussion","Rev Email Agree","Rev Email Scope","Rev Email Results","Rev Email Interpretation","Rev Email Deliverable","Rev Email Partial 30","Rev Email Partial 50","Rev Email Preliminary","Rev Email Draft","Rev Email Constructability","Rev Email Final","Rev Email Check","Not Applicable"]}
    rawItems={items} rows={items.map(o=>[
      <IdCell v={o.id}/>,
      <span style={{color:ATC.textMuted,fontSize:12}}>#{o.idMaster}</span>,
      <BoolBadge v={o.isSubmitted==="True"}/>,
      <MidCell v={o.revNameDiscussion}/>,
      <MidCell v={o.revNameAgree}/>,
      <MidCell v={o.revNameScope}/>,
      <MidCell v={o.revNameResults}/>,
      <MidCell v={o.revNameInterpretation}/>,
      <MidCell v={o.revNameDeliverable}/>,
      <MidCell v={o.revNamePartial30}/>,
      <MidCell v={o.revNamePartial50}/>,
      <MidCell v={o.revNamePreliminary}/>,
      <MidCell v={o.revNameDraft}/>,
      <MidCell v={o.revNameConstructability}/>,
      <MidCell v={o.revNameFinal}/>,
      <MidCell v={o.revNameCheck}/>,
      <MidCell v={o.pmSignDiscussion}/>,
      <MidCell v={o.pmSignAgree}/>,
      <MidCell v={o.pmSignScope}/>,
      <MidCell v={o.pmSignResults}/>,
      <MidCell v={o.pmSignInterpretation}/>,
      <MidCell v={o.pmSignDeliverable}/>,
      <MidCell v={o.pmSignPartial30}/>,
      <MidCell v={o.pmSignPartial50}/>,
      <MidCell v={o.pmSignPreliminary}/>,
      <MidCell v={o.pmSignDraft}/>,
      <MidCell v={o.pmSignConstructability}/>,
      <MidCell v={o.pmSignFinal}/>,
      <MidCell v={o.pmSignCheck}/>,
      <MidCell v={o.revSignDiscussion}/>,
      <MidCell v={o.revSignAgree}/>,
      <MidCell v={o.revSignScope}/>,
      <MidCell v={o.revSignResults}/>,
      <MidCell v={o.revSignInterpretation}/>,
      <MidCell v={o.revSignDeliverable}/>,
      <MidCell v={o.revSignPartial30}/>,
      <MidCell v={o.revSignPartial50}/>,
      <MidCell v={o.revSignPreliminary}/>,
      <MidCell v={o.revSignDraft}/>,
      <MidCell v={o.revSignConstructability}/>,
      <MidCell v={o.revSignFinal}/>,
      <MidCell v={o.revSignCheck}/>,
      <DateCell v={o.pmSignDiscussionDateTime}/>,
      <DateCell v={o.pmSignAgreeDateTime}/>,
      <DateCell v={o.pmSignScopeDateTime}/>,
      <DateCell v={o.pmSignResultsDateTime}/>,
      <DateCell v={o.pmSignInterpretationDateTime}/>,
      <DateCell v={o.pmSignDeliverableDateTime}/>,
      <DateCell v={o.pmSignPartial30DateTime}/>,
      <DateCell v={o.pmSignPartial50DateTime}/>,
      <DateCell v={o.pmSignPreliminaryDateTime}/>,
      <DateCell v={o.pmSignDraftDateTime}/>,
      <DateCell v={o.pmSignConstructabilityDateTime}/>,
      <DateCell v={o.pmSignFinalDateTime}/>,
      <DateCell v={o.pmSignCheckDateTime}/>,
      <DateCell v={o.revSignDiscussionDateTime}/>,
      <DateCell v={o.revSignAgreeDateTime}/>,
      <DateCell v={o.revSignScopeDateTime}/>,
      <DateCell v={o.revSignResultsDateTime}/>,
      <DateCell v={o.revSignInterpretationDateTime}/>,
      <DateCell v={o.revSignDeliverableDateTime}/>,
      <DateCell v={o.revSignPartial30DateTime}/>,
      <DateCell v={o.revSignPartial50DateTime}/>,
      <DateCell v={o.revSignPreliminaryDateTime}/>,
      <DateCell v={o.revSignDraftDateTime}/>,
      <DateCell v={o.revSignConstructabilityDateTime}/>,
      <DateCell v={o.revSignFinalDateTime}/>,
      <DateCell v={o.revSignCheckDateTime}/>,
      <span style={{color:ATC.textMuted,fontSize:11}}>{o.submittedByEmail}</span>,
      <MidCell v={o.submittedByName}/>,
      <DateCell v={o.submittedDateTime}/>,
      <span style={{color:ATC.textMuted,fontSize:11}}>{o.revEmailDiscussion}</span>,
      <span style={{color:ATC.textMuted,fontSize:11}}>{o.revEmailAgree}</span>,
      <span style={{color:ATC.textMuted,fontSize:11}}>{o.revEmailScope}</span>,
      <span style={{color:ATC.textMuted,fontSize:11}}>{o.revEmailResults}</span>,
      <span style={{color:ATC.textMuted,fontSize:11}}>{o.revEmailInterpretation}</span>,
      <span style={{color:ATC.textMuted,fontSize:11}}>{o.revEmailDeliverable}</span>,
      <span style={{color:ATC.textMuted,fontSize:11}}>{o.revEmailPartial30}</span>,
      <span style={{color:ATC.textMuted,fontSize:11}}>{o.revEmailPartial50}</span>,
      <span style={{color:ATC.textMuted,fontSize:11}}>{o.revEmailPreliminary}</span>,
      <span style={{color:ATC.textMuted,fontSize:11}}>{o.revEmailDraft}</span>,
      <span style={{color:ATC.textMuted,fontSize:11}}>{o.revEmailConstructability}</span>,
      <span style={{color:ATC.textMuted,fontSize:11}}>{o.revEmailFinal}</span>,
      <span style={{color:ATC.textMuted,fontSize:11}}>{o.revEmailCheck}</span>,
      <MidCell v={o.notApplicable}/>,
    ])} page={page} totalPages={totalPages} onChange={setPage} total={filtered.length}/>;
}

// --- FM-05 Notes Page ---------------------------------------------------------
function FM05NotesPage() {
  const [page,setPage]=useState(1);
  const [search,setSearch]=useState("");
  const filtered=MOCK_FM05_NOTES.filter(o=>!search||
    String(o.idMaster).includes(search)||
    (o.generalNote||"").toLowerCase().includes(search.toLowerCase()));
  const items=[...filtered].sort((a,b)=>b.id-a.id).slice((page-1)*PAGE_SIZE,page*PAGE_SIZE);
  const totalPages=Math.ceil(filtered.length/PAGE_SIZE);
  return <FormPageTable
    title="FM-05 Notes" sub={`Project Review Plan Notes - ${filtered.length.toLocaleString()} records`} badge="FM-05"
    search={<SearchBar value={search} onChange={v=>{setSearch(v);setPage(1);}} placeholder="Search by master ID or note text..."/>}
    headers={["ID v","Master ID","Note"]}
    rawItems={items} rows={items.map(o=>[
      <IdCell v={o.id}/>,
      <span style={{color:ATC.textMuted,fontSize:12}}>#{o.idMaster}</span>,
      <NoteCell v={o.generalNote}/>,
    ])} page={page} totalPages={totalPages} onChange={setPage} total={filtered.length}/>;
}

// --- FM-05 Scope of Work Items Page -------------------------------------------
function FM05ScopePage() {
  const [page,setPage]=useState(1);
  const [search,setSearch]=useState("");
  const filtered=MOCK_FM05_SCOPE.filter(o=>!search||
    String(o.idMaster).includes(search)||
    (o.workComponent||"").toLowerCase().includes(search.toLowerCase())||
    (o.reviewerName||"").toLowerCase().includes(search.toLowerCase()));
  const items=[...filtered].sort((a,b)=>b.id-a.id).slice((page-1)*PAGE_SIZE,page*PAGE_SIZE);
  const totalPages=Math.ceil(filtered.length/PAGE_SIZE);
  return <FormPageTable
    title="FM-05 Scope of Work Items" sub={`Project Review Plan Scope - ${filtered.length.toLocaleString()} records`} badge="FM-05"
    search={<SearchBar value={search} onChange={v=>{setSearch(v);setPage(1);}} placeholder="Search by master ID, work component or reviewer name..."/>}
    headers={["ID v","Master ID","Work Component","Min Review Level","Reviewer Name","Reviewer Email","PM Acceptance","Review Completed","PM Acceptance Date","Review Completed Date"]}
    rawItems={items} rows={items.map(o=>[
      <IdCell v={o.id}/>,
      <span style={{color:ATC.textMuted,fontSize:12}}>#{o.idMaster}</span>,
      <MidCell v={o.workComponent}/>,
      <MidCell v={o.minReviewLevel}/>,
      <MidCell v={o.reviewerName}/>,
      <span style={{color:ATC.textMuted,fontSize:11}}>{o.reviewerEmail}</span>,
      <MidCell v={o.pmAcceptance}/>,
      <MidCell v={o.reviewCompleted}/>,
      <DateCell v={o.pmAcceptanceDateTime}/>,
      <DateCell v={o.reviewCompletedDateTime}/>,
    ])} page={page} totalPages={totalPages} onChange={setPage} total={filtered.length}/>;
}

// ── FM-06 pages ──────────────────────────────────────────────
function FM06ProjectPlanPage() {
  const [search,setSearch]=useState("");
  const filtered=MOCK_FM06_PLAN.filter(o=>!search||String(o.idMaster).includes(search)||o.proposal.toLowerCase().includes(search.toLowerCase())||o.pm.toLowerCase().includes(search.toLowerCase()));
  return (
    <div>
      <PageTitle title="SY-QS-FM-06" sub="Project Plan"/>
      <FormPageTable
        search={<SearchBar value={search} onChange={setSearch} placeholder="Search proposal or PM..."/>}
        headers={["ID Master","Proposal","Written Acceptance","Award Date","PM","Lead Reviewer","Submitted"]}
        rawItems={filtered} rows={filtered.map(r=>[
          r.idMaster,
          r.proposal,
          r.writtenAcceptance,
          r.awardDate,
          r.pm,
          r.reviewer,
          <span style={{padding:"2px 8px",borderRadius:10,fontSize:11,fontWeight:600,background:r.isSubmitted?"#dcfce7":"#fef9c3",color:r.isSubmitted?"#166534":"#854d0e"}}>{r.isSubmitted?"Submitted":"Pending"}</span>,
        ])}
      />
    </div>
  );
}
function FM06NotesPage(){return <NotesPage title="FM-06 Notes" subtitle="Project Plan Notes" data={MOCK_FM06_NOTES}/>;}
function FM06MilestonesPage() {
  const [search,setSearch]=useState("");
  const filtered=MOCK_FM06_MILESTONES.filter(o=>!search||String(o.idMaster).includes(search)||o.milestone.toLowerCase().includes(search.toLowerCase()));
  return (
    <div>
      <PageTitle title="FM-06 Critical Milestones" sub="Schedule & Milestones"/>
      <FormPageTable
        search={<SearchBar value={search} onChange={setSearch} placeholder="Search milestone or ID Master..."/>}
        headers={["ID","ID Master","Critical Milestone","End Date"]}
        rawItems={filtered} rows={filtered.map(r=>[<IdCell v={r.id}/>,r.idMaster,r.milestone,<DateCell v={r.endDate}/>])}
      />
    </div>
  );
}
function FM06CategoriesPage() {
  const [search,setSearch]=useState("");
  const filtered=MOCK_FM06_CATEGORIES.filter(o=>!search||o.category.toLowerCase().includes(search.toLowerCase())||o.subCategory.toLowerCase().includes(search.toLowerCase()));
  return (
    <div>
      <PageTitle title="FM-06 Categories" sub="Category Reference Table"/>
      <FormPageTable
        search={<SearchBar value={search} onChange={setSearch} placeholder="Search category..."/>}
        headers={["ID","Category","Sub-Category"]}
        rawItems={filtered} rows={filtered.map(r=>[<IdCell v={r.id}/>,r.category,r.subCategory])}
      />
    </div>
  );
}
function FM06DeliverablesPage() {
  const [search,setSearch]=useState("");
  const filtered=MOCK_FM06_DELIVERABLES.filter(o=>!search||String(o.idMaster).includes(search)||o.description.toLowerCase().includes(search.toLowerCase())||o.docType.toLowerCase().includes(search.toLowerCase()));
  return (
    <div>
      <PageTitle title="FM-06 Key Deliverables" sub="Project Deliverables"/>
      <FormPageTable
        search={<SearchBar value={search} onChange={setSearch} placeholder="Search description or doc type..."/>}
        headers={["ID","ID Master","Item No","Doc Type","Description","Deliverable Date","Created By"]}
        rawItems={filtered} rows={filtered.map(r=>[<IdCell v={r.id}/>,r.idMaster,r.itemNo,r.docType,<MidCell v={r.description}/>,<DateCell v={r.deliverableDate}/>,r.createdBy])}
      />
    </div>
  );
}
function FM06ExtResourcesPage() {
  const [search,setSearch]=useState("");
  const filtered=MOCK_FM06_EXTRESOURCES.filter(o=>!search||o.name.toLowerCase().includes(search.toLowerCase())||String(o.idMaster).includes(search));
  return (
    <div>
      <PageTitle title="FM-06 External Resources" sub="Third-Party Suppliers"/>
      <FormPageTable
        search={<SearchBar value={search} onChange={setSearch} placeholder="Search supplier name or ID Master..."/>}
        headers={["ID","ID Master","Name","Selection Criteria","Scope","Contract Type","Responsible Person"]}
        rawItems={filtered} rows={filtered.map(r=>[<IdCell v={r.id}/>,r.idMaster,r.name,r.criteria,<MidCell v={r.scope}/>,r.contractType,r.responsiblePerson])}
      />
    </div>
  );
}

// ── FM-07 pages ──────────────────────────────────────────────
function FM07MainPage() {
  const [search,setSearch]=useState("");
  const filtered=MOCK_FM07_MAIN.filter(o=>!search||String(o.idMaster).includes(search)||o.pm.toLowerCase().includes(search.toLowerCase()));
  return (
    <div>
      <PageTitle title="FM-07 Main" sub="SID Signature Record"/>
      <FormPageTable
        search={<SearchBar value={search} onChange={setSearch} placeholder="Search ID Master or PM..."/>}
        headers={["ID","ID Master","Project Manager","PM Email","Lead Reviewer","Director","Submitted","PM Signed Date"]}
        rawItems={filtered} rows={filtered.map(r=>[
          <IdCell v={r.id}/>,r.idMaster,r.pm,r.pmEmail,r.reviewer,r.director,
          <span style={{padding:"2px 8px",borderRadius:10,fontSize:11,fontWeight:600,background:r.isSubmitted?"#dcfce7":"#fef9c3",color:r.isSubmitted?"#166534":"#854d0e"}}>{r.isSubmitted?"Submitted":"Pending"}</span>,
          <DateCell v={r.pmDT}/>,
        ])}
      />
    </div>
  );
}
function FM07SIDPage() {
  const [search,setSearch]=useState("");
  const filtered=MOCK_FM07_SID.filter(o=>!search||String(o.idMaster).includes(search)||o.hazard.toLowerCase().includes(search.toLowerCase())||o.riskOwner.toLowerCase().includes(search.toLowerCase()));
  return (
    <div>
      <PageTitle title="SY-QS-FM-07" sub="Safety in Design"/>
      <FormPageTable
        search={<SearchBar value={search} onChange={setSearch} placeholder="Search hazard, ID Master or risk owner..."/>}
        headers={["ID","ID Master","Hazard","Consequence","Likelihood Before","Consequence Before","Risk Owner","Review Date","Likelihood After","Consequence After"]}
        rawItems={filtered} rows={filtered.map(r=>[
          <IdCell v={r.id}/>,r.idMaster,<MidCell v={r.hazard}/>,<MidCell v={r.consequence}/>,
          <ScoreBadge v={r.likelihoodBefore}/>,<ScoreBadge v={r.consequenceBefore}/>,
          r.riskOwner,<DateCell v={r.riskReviewDate}/>,
          <ScoreBadge v={r.likelihoodAfter}/>,<ScoreBadge v={r.consequenceAfter}/>,
        ])}
      />
    </div>
  );
}
function FM07NotesPage(){return <NotesPage title="FM-07 Notes" subtitle="Safety in Design Notes" data={MOCK_FM07_NOTES}/>;}

// ── FM-08 pages ──────────────────────────────────────────────
function FM08DocumentRegisterPage() {
  const [search,setSearch]=useState("");
  const filtered=MOCK_FM08_DOCS.filter(o=>!search||String(o.idMaster).includes(search)||o.docNumber.toLowerCase().includes(search.toLowerCase())||o.docTitle.toLowerCase().includes(search.toLowerCase()));
  return (
    <div>
      <PageTitle title="SY-QS-FM-08" sub="Document Register"/>
      <FormPageTable
        search={<SearchBar value={search} onChange={setSearch} placeholder="Search doc number, title or ID Master..."/>}
        headers={["ID","ID Master","Doc Number","Doc Type","Revision","Doc Title","Date Issued","Proposed Date"]}
        rawItems={filtered} rows={filtered.map(r=>[<IdCell v={r.id}/>,r.idMaster,r.docNumber,r.docType,r.docRevision,<MidCell v={r.docTitle}/>,<DateCell v={r.dateIssued}/>,<DateCell v={r.proposedDate}/>])}
      />
    </div>
  );
}
function FM08NotesPage(){return <NotesPage title="FM-08 Notes" subtitle="Document Register Notes" data={MOCK_FM08_NOTES}/>;}

// ── FM-09 pages ──────────────────────────────────────────────
function FM09DrawingRegisterPage() {
  const [search,setSearch]=useState("");
  const filtered=MOCK_FM09_DRAWINGS.filter(o=>!search||String(o.idMaster).includes(search)||o.number.toLowerCase().includes(search.toLowerCase())||o.title.toLowerCase().includes(search.toLowerCase()));
  return (
    <div>
      <PageTitle title="SY-QS-FM-09" sub="Drawing Register"/>
      <FormPageTable
        search={<SearchBar value={search} onChange={setSearch} placeholder="Search number, title or ID Master..."/>}
        headers={["ID","ID Master","Type","Number","Title","Revision","Date Issued"]}
        rawItems={filtered} rows={filtered.map(r=>[<IdCell v={r.id}/>,r.idMaster,r.type,r.number,<MidCell v={r.title}/>,r.revision,<DateCell v={r.dateIssued}/>])}
      />
    </div>
  );
}
function FM09NotesPage(){return <NotesPage title="FM-09 Notes" subtitle="Drawing Register Notes" data={MOCK_FM09_NOTES}/>;}

// ── FM-10 pages ──────────────────────────────────────────────
function FM10CommunicationsMatrixPage() {
  const [search,setSearch]=useState("");
  const filtered=MOCK_FM10_MATRIX.filter(o=>!search||String(o.idMaster).includes(search));
  return (
    <div>
      <PageTitle title="SY-QS-FM-10" sub="Communications Matrix"/>
      <FormPageTable
        search={<SearchBar value={search} onChange={setSearch} placeholder="Search ID Master..."/>}
        headers={["ID Master","Submitted","Comms ProDir","Comms ProMan","Variations ProDir","Variations ProMan","General ProDir","General ProMan"]}
        rawItems={filtered} rows={filtered.map(r=>[
          r.idMaster,
          <span style={{padding:"2px 8px",borderRadius:10,fontSize:11,fontWeight:600,background:r.isSubmitted?"#dcfce7":"#fef9c3",color:r.isSubmitted?"#166534":"#854d0e"}}>{r.isSubmitted?"Submitted":"Pending"}</span>,
          r.commsProDir||"—",r.commsProMan||"—",r.variationsProDir||"—",r.variationsProMan||"—",r.generalProDir||"—",r.generalProMan||"—",
        ])}
      />
    </div>
  );
}
function FM10NotesPage(){return <NotesPage title="FM-10 Notes" subtitle="Comms Matrix Notes" data={MOCK_FM10_NOTES}/>;}

function PlaceholderPage({title}) {
  return <div style={{display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",minHeight:340,gap:14,textAlign:"center"}}>
    <div style={{padding:22,borderRadius:"50%",background:ATC.crimsonPale}}><Layers size={40} strokeWidth={1.2} color={ATC.crimson}/></div>
    <h2 style={{margin:0,fontSize:18,fontWeight:700,color:ATC.textDark}}>{title}</h2>
    <p style={{margin:0,fontSize:13,color:ATC.textMuted}}>This module is available in the full release.</p>
  </div>;
}

// ── FM-11 pages ──────────────────────────────────────────────
function FM11ChangeRegisterPage() {
  const [search,setSearch]=useState("");
  const filtered=MOCK_FM11_CHANGE.filter(o=>!search||String(o.idMaster).includes(search)||o.identificationNumber.toLowerCase().includes(search.toLowerCase())||o.description.toLowerCase().includes(search.toLowerCase()));
  return (
    <div>
      <PageTitle title="SY-QS-FM-11" sub="Change Register"/>
      <FormPageTable
        search={<SearchBar value={search} onChange={setSearch} placeholder="Search ID Master or change number..."/>}
        headers={["ID","ID Master","ID Number","Type","Description","Initiation Date","Impact","Approved Date","Value"]}
        rawItems={filtered} rows={filtered.map(r=>[
          <IdCell v={r.id}/>,
          r.idMaster,
          <span style={{fontWeight:600,color:ATC.crimson}}>{r.identificationNumber}</span>,
          r.communicationType,
          <MidCell v={r.description}/>,
          <DateCell v={r.initiationDate}/>,
          <span style={{padding:"2px 8px",borderRadius:10,fontSize:11,fontWeight:600,background:r.impact==="High"||r.impact==="Critical"?ATC.crimsonPale:r.impact==="Medium"?"#fef9c3":"#dcfce7",color:r.impact==="High"||r.impact==="Critical"?ATC.crimson:r.impact==="Medium"?"#854d0e":"#166534"}}>{r.impact}</span>,
          <DateCell v={r.approvedDate}/>,
          `$${Number(r.value).toLocaleString()}`,
        ])}
      />
    </div>
  );
}
function FM11CostItemsPage() {
  const [search,setSearch]=useState("");
  const filtered=MOCK_FM11_COSTITEM.filter(o=>!search||o.role.toLowerCase().includes(search.toLowerCase())||o.costType.toLowerCase().includes(search.toLowerCase()));
  return (
    <div>
      <PageTitle title="FM-11 Cost Items" sub="Estimated Cost Items"/>
      <FormPageTable
        search={<SearchBar value={search} onChange={setSearch} placeholder="Search role or cost type..."/>}
        headers={["ID","FM-11 ID","Cost Type","Role","Staff Level","Est. Hours","Rate/Hr","Total"]}
        rawItems={filtered} rows={filtered.map(r=>[
          <IdCell v={r.id}/>,
          r.fm11Id,
          r.costType,
          r.role,
          <span style={{padding:"2px 6px",borderRadius:8,fontSize:11,fontWeight:600,background:ATC.crimsonPale,color:ATC.crimson}}>{r.staffLevel}</span>,
          r.estimatedHours,
          `$${r.ratePerHour}`,
          `$${Number(r.total).toLocaleString()}`,
        ])}
      />
    </div>
  );
}
function FM11NotesPage(){return <NotesPage title="FM-11 Notes" subtitle="Change Register Notes" data={MOCK_FM11_NOTES}/>;}

// ── FM-12 pages ──────────────────────────────────────────────
function FM12ChangeRegisterPage() {
  const [search,setSearch]=useState("");
  const filtered=MOCK_FM12_CHANGE.filter(o=>!search||String(o.idMaster).includes(search)||o.identificationNumber.toLowerCase().includes(search.toLowerCase())||o.description.toLowerCase().includes(search.toLowerCase()));
  return (
    <div>
      <PageTitle title="SY-QS-FM-12" sub="Scope Change Register"/>
      <FormPageTable
        search={<SearchBar value={search} onChange={setSearch} placeholder="Search ID Master or change number..."/>}
        headers={["ID","ID Master","ID Number","Type","Description","Initiation Date","Impact","Approved Date","Value"]}
        rawItems={filtered} rows={filtered.map(r=>[
          <IdCell v={r.id}/>,
          r.idMaster,
          <span style={{fontWeight:600,color:ATC.crimson}}>{r.identificationNumber}</span>,
          r.communicationType,
          <MidCell v={r.description}/>,
          <DateCell v={r.initiationDate}/>,
          <span style={{padding:"2px 8px",borderRadius:10,fontSize:11,fontWeight:600,background:r.impact==="High"?ATC.crimsonPale:r.impact==="Medium"?"#fef9c3":"#dcfce7",color:r.impact==="High"?ATC.crimson:r.impact==="Medium"?"#854d0e":"#166534"}}>{r.impact}</span>,
          <DateCell v={r.approvedDate}/>,
          `$${Number(r.value).toLocaleString()}`,
        ])}
      />
    </div>
  );
}
function FM12NotesPage(){return <NotesPage title="FM-12 Notes" subtitle="Scope Change Register Notes" data={MOCK_FM12_NOTES}/>;}

// ── FM-13 pages ──────────────────────────────────────────────
function FM13BasisOfDesignPage() {
  const [search,setSearch]=useState("");
  const filtered=MOCK_FM13_BOD.filter(o=>!search||String(o.idMaster).includes(search));
  return (
    <div>
      <PageTitle title="SY-QS-FM-13" sub="Basis of Design"/>
      <FormPageTable
        search={<SearchBar value={search} onChange={setSearch} placeholder="Search ID Master..."/>}
        headers={["ID","ID Master","Attachments"]}
        rawItems={filtered} rows={filtered.map(r=>[
          <IdCell v={r.id}/>,
          r.idMaster,
          <span style={{padding:"2px 8px",borderRadius:10,fontSize:11,fontWeight:600,background:r.attachments?"#dcfce7":"#f1f5f9",color:r.attachments?"#166534":"#475569"}}>{r.attachments?"Yes":"No"}</span>,
        ])}
      />
    </div>
  );
}
function FM13TemplateFilePage() {
  const [search,setSearch]=useState("");
  const filtered=MOCK_FM13_TEMPLATE.filter(o=>!search||o.title.toLowerCase().includes(search.toLowerCase()));
  return (
    <div>
      <PageTitle title="FM-13 Template File" sub="Template Files"/>
      <FormPageTable
        search={<SearchBar value={search} onChange={setSearch} placeholder="Search template title..."/>}
        headers={["ID","Title","Attachments"]}
        rawItems={filtered} rows={filtered.map(r=>[<IdCell v={r.id}/>,<MidCell v={r.title}/>,r.attachments])}
      />
    </div>
  );
}
function FM13NotesPage(){return <NotesPage title="FM-13 Notes" subtitle="Basis of Design Notes" data={MOCK_FM13_NOTES}/>;}

// ── FM-14 pages ──────────────────────────────────────────────
function FM14WorkPackagePlanPage() {
  const [search,setSearch]=useState("");
  const filtered=MOCK_FM14_WPP.filter(o=>!search||String(o.idMaster).includes(search)||o.workPackageDescription.toLowerCase().includes(search.toLowerCase()));
  return (
    <div>
      <PageTitle title="SY-QS-FM-14" sub="Work Package Plan"/>
      <FormPageTable
        search={<SearchBar value={search} onChange={setSearch} placeholder="Search ID Master or description..."/>}
        headers={["ID","ID Master","Work Package Description","Deliverables","Verification","Date Assigned","Date Required"]}
        rawItems={filtered} rows={filtered.map(r=>[
          <IdCell v={r.id}/>,
          r.idMaster,
          <MidCell v={r.workPackageDescription}/>,
          <MidCell v={r.deliverables}/>,
          <MidCell v={r.verificationRequirements}/>,
          <DateCell v={r.dateAssigned}/>,
          <DateCell v={r.dateRequired}/>,
        ])}
      />
    </div>
  );
}
function FM14TasksPage() {
  const [search,setSearch]=useState("");
  const filtered=MOCK_FM14_TASKS.filter(o=>!search||o.tasksNo.toLowerCase().includes(search.toLowerCase())||o.tasksDescription.toLowerCase().includes(search.toLowerCase()));
  return (
    <div>
      <PageTitle title="FM-14 Tasks" sub="Work Package Tasks"/>
      <FormPageTable
        search={<SearchBar value={search} onChange={setSearch} placeholder="Search task number or description..."/>}
        headers={["ID","FM-14 ID","Task No","Description","Person Hours","Cost/Hr"]}
        rawItems={filtered} rows={filtered.map(r=>[
          <IdCell v={r.id}/>,
          r.fm14Id,
          <span style={{fontWeight:600,color:ATC.crimson}}>{r.tasksNo}</span>,
          <MidCell v={r.tasksDescription}/>,
          r.personHours,
          `$${r.costPHour}`,
        ])}
      />
    </div>
  );
}
function FM14NotesPage(){return <NotesPage title="FM-14 Notes" subtitle="Work Package Plan Notes" data={MOCK_FM14_NOTES}/>;}

// ── FM-15 pages ──────────────────────────────────────────────
function FM15CADDRequestPage() {
  const [search,setSearch]=useState("");
  const filtered=MOCK_FM15_CADD.filter(o=>!search||String(o.idMaster).includes(search)||o.caddDescription.toLowerCase().includes(search.toLowerCase()));
  return (
    <div>
      <PageTitle title="SY-QS-FM-15" sub="CADD Request"/>
      <FormPageTable
        search={<SearchBar value={search} onChange={setSearch} placeholder="Search ID Master or description..."/>}
        headers={["ID","ID Master","Description","Total Drawings","Budgeted Hrs","Draft Due","Final Due","Software","Formats"]}
        rawItems={filtered} rows={filtered.map(r=>[
          <IdCell v={r.id}/>,
          r.idMaster,
          <MidCell v={r.caddDescription}/>,
          r.totalDrawings,
          r.budgetedHours,
          <DateCell v={r.draftDueDate}/>,
          <DateCell v={r.finalDueDate}/>,
          r.software,
          [r.dwg&&"DWG",r.pdf&&"PDF",r.dxf&&"DXF"].filter(Boolean).join(", "),
        ])}
      />
    </div>
  );
}
function FM15DrawsFigsPage() {
  const [search,setSearch]=useState("");
  const filtered=MOCK_FM15_DRAWSFIGS.filter(o=>!search||o.drawFigNumber.toLowerCase().includes(search.toLowerCase())||o.title.toLowerCase().includes(search.toLowerCase()));
  return (
    <div>
      <PageTitle title="FM-15 Drawings/Figs" sub="Drawings & Figures"/>
      <FormPageTable
        search={<SearchBar value={search} onChange={setSearch} placeholder="Search drawing number or title..."/>}
        headers={["ID","FM-15 ID","Drawing/Fig Number","Title","Scale","Page Size","Est. Hours"]}
        rawItems={filtered} rows={filtered.map(r=>[
          <IdCell v={r.id}/>,
          r.fm15Id,
          <span style={{fontWeight:600,color:ATC.crimson}}>{r.drawFigNumber}</span>,
          <MidCell v={r.title}/>,
          r.scale,
          r.pageSize,
          r.estimatedHours,
        ])}
      />
    </div>
  );
}
function FM15DataLocPage() {
  const [search,setSearch]=useState("");
  const filtered=MOCK_FM15_DATALOC.filter(o=>!search||o.fileName.toLowerCase().includes(search.toLowerCase())||o.fileLocation.toLowerCase().includes(search.toLowerCase()));
  return (
    <div>
      <PageTitle title="FM-15 CADD Data Location" sub="CADD Data Locations"/>
      <FormPageTable
        search={<SearchBar value={search} onChange={setSearch} placeholder="Search file name or location..."/>}
        headers={["ID","FM-15 ID","File Location","File Name","Comments"]}
        rawItems={filtered} rows={filtered.map(r=>[
          <IdCell v={r.id}/>,
          r.fm15Id,
          <NoteCell v={r.fileLocation}/>,
          <span style={{fontFamily:"monospace",fontSize:12}}>{r.fileName}</span>,
          <MidCell v={r.comments}/>,
        ])}
      />
    </div>
  );
}
function FM15TitleBlockPage() {
  const [search,setSearch]=useState("");
  const filtered=MOCK_FM15_TITLEBLOCK.filter(o=>!search||o.clientNameRow1.toLowerCase().includes(search.toLowerCase())||o.projectTitle.toLowerCase().includes(search.toLowerCase()));
  return (
    <div>
      <PageTitle title="FM-15 Title Block" sub="Title Block Headings"/>
      <FormPageTable
        search={<SearchBar value={search} onChange={setSearch} placeholder="Search client or project title..."/>}
        headers={["ID","FM-15 ID","Client Name Row 1","Client Name Row 2","Project Title"]}
        rawItems={filtered} rows={filtered.map(r=>[
          <IdCell v={r.id}/>,
          r.fm15Id,
          r.clientNameRow1,
          r.clientNameRow2,
          <MidCell v={r.projectTitle}/>,
        ])}
      />
    </div>
  );
}
function FM15NotesPage(){return <NotesPage title="FM-15 Notes" subtitle="CADD Request Notes" data={MOCK_FM15_NOTES}/>;}

// ── FM-16 pages ──────────────────────────────────────────────
function FM16DocumentReviewPage() {
  const [search,setSearch]=useState("");
  const filtered=MOCK_FM16_REVIEW.filter(o=>!search||String(o.idMaster).includes(search)||o.deliverableTitle.toLowerCase().includes(search.toLowerCase())||o.documentNo.toLowerCase().includes(search.toLowerCase()));
  return (
    <div>
      <PageTitle title="SY-QS-FM-16" sub="Document Review Register"/>
      <FormPageTable
        search={<SearchBar value={search} onChange={setSearch} placeholder="Search ID Master or document number..."/>}
        headers={["ID","ID Master","Deliverable Title","Document No","Submitted By","Date Submitted","Review Type","Reviewer 1","Doc Type","Rev","Review Date"]}
        rawItems={filtered} rows={filtered.map(r=>[
          <IdCell v={r.id}/>,
          r.idMaster,
          <MidCell v={r.deliverableTitle}/>,
          <span style={{fontFamily:"monospace",fontSize:12,color:ATC.crimson}}>{r.documentNo}</span>,
          r.submittedBy,
          <DateCell v={r.dateSubmitted}/>,
          r.reviewType,
          r.review1,
          r.docType,
          r.docRev,
          <DateCell v={r.reviewDate}/>,
        ])}
      />
    </div>
  );
}
function FM16ReviewDocsPage() {
  const [search,setSearch]=useState("");
  const filtered=MOCK_FM16_REVDOCS.filter(o=>!search||String(o.idMaster).includes(search)||o.title.toLowerCase().includes(search.toLowerCase()));
  return (
    <div>
      <PageTitle title="FM-16 Review Docs" sub="Review Documents"/>
      <FormPageTable
        search={<SearchBar value={search} onChange={setSearch} placeholder="Search ID Master or title..."/>}
        headers={["ID","ID Master","FM-16 ID","Title","Attachments","Review Date"]}
        rawItems={filtered} rows={filtered.map(r=>[
          <IdCell v={r.id}/>,
          r.idMaster,
          r.fm16Id,
          <MidCell v={r.title}/>,
          r.attachments,
          <DateCell v={r.reviewDate}/>,
        ])}
      />
    </div>
  );
}
function FM16NotesPage(){return <NotesPage title="FM-16 Notes" subtitle="Document Review Register Notes" data={MOCK_FM16_NOTES}/>;}

// ── FM-17 pages ──────────────────────────────────────────────
function FM17TransmittalPage() {
  const [search,setSearch]=useState("");
  const filtered=MOCK_FM17_TRANS.filter(o=>!search||String(o.idMaster).includes(search)||o.toCompany.toLowerCase().includes(search.toLowerCase())||o.sender.toLowerCase().includes(search.toLowerCase()));
  return (
    <div>
      <PageTitle title="SY-QS-FM-17" sub="Document Transmittal"/>
      <FormPageTable
        search={<SearchBar value={search} onChange={setSearch} placeholder="Search ID Master, company or sender..."/>}
        headers={["ID","ID Master","Doc Pack Description","From Company","Sender","To Company","Attention","Reason for Issue","Sent By"]}
        rawItems={filtered} rows={filtered.map(r=>[
          <IdCell v={r.id}/>,
          r.idMaster,
          <MidCell v={r.docPackDescription}/>,
          r.fromCompany,
          r.sender,
          r.toCompany,
          r.attention,
          r.reasonForIssue,
          r.sentBy,
        ])}
      />
    </div>
  );
}
function FM17DocumentsPage() {
  const [search,setSearch]=useState("");
  const filtered=MOCK_FM17_DOCS.filter(o=>!search||o.docNumber.toLowerCase().includes(search.toLowerCase())||o.docDescription.toLowerCase().includes(search.toLowerCase()));
  return (
    <div>
      <PageTitle title="FM-17 Documents" sub="Transmitted Documents"/>
      <FormPageTable
        search={<SearchBar value={search} onChange={setSearch} placeholder="Search document number or description..."/>}
        headers={["ID","FM-17 ID","Date of Issue","Doc Number","Rev","Doc Type","Description"]}
        rawItems={filtered} rows={filtered.map(r=>[
          <IdCell v={r.id}/>,
          r.fm17Id,
          <DateCell v={r.dateOfIssue}/>,
          <span style={{fontFamily:"monospace",fontSize:12,color:ATC.crimson}}>{r.docNumber}</span>,
          r.revNum,
          r.docType,
          <MidCell v={r.docDescription}/>,
        ])}
      />
    </div>
  );
}
function FM17NotesPage(){return <NotesPage title="FM-17 Notes" subtitle="Document Transmittal Notes" data={MOCK_FM17_NOTES}/>;}

// ── FM-18 pages ──────────────────────────────────────────────
function FM18ClientFeedbackPage() {
  const [search,setSearch]=useState("");
  const filtered=MOCK_FM18_CF.filter(o=>!search||String(o.fm08Id).includes(search)||o.projectDescription.toLowerCase().includes(search.toLowerCase()));
  return (
    <div>
      <PageTitle title="SY-QS-FM-18" sub="Client Feedback"/>
      <FormPageTable
        search={<SearchBar value={search} onChange={setSearch} placeholder="Search FM-08 ID or project description..."/>}
        headers={["ID","FM-08 ID","Project Description","Attachments","Feedback Received","Created"]}
        rawItems={filtered} rows={filtered.map(r=>[
          <IdCell v={r.id}/>,
          r.fm08Id,
          <MidCell v={r.projectDescription}/>,
          r.attachments,
          <span style={{padding:"2px 8px",borderRadius:10,fontSize:11,fontWeight:600,background:r.feedbackReceived?"#dcfce7":"#fef9c3",color:r.feedbackReceived?"#166534":"#854d0e"}}>{r.feedbackReceived?"Received":"Pending"}</span>,
          <DateCell v={r.created}/>,
        ])}
      />
    </div>
  );
}
function FM18UploadsPage() {
  const [search,setSearch]=useState("");
  const filtered=MOCK_FM18_UPLOADS.filter(o=>!search||String(o.fm08Id).includes(search));
  return (
    <div>
      <PageTitle title="FM-18 Uploads" sub="Feedback Uploads"/>
      <FormPageTable
        search={<SearchBar value={search} onChange={setSearch} placeholder="Search FM-08 ID..."/>}
        headers={["ID","FM-08 ID","Attachments"]}
        rawItems={filtered} rows={filtered.map(r=>[<IdCell v={r.id}/>,r.fm08Id,r.attachments])}
      />
    </div>
  );
}
function FM18NotesPage(){return <NotesPage title="FM-18 Notes" subtitle="Client Feedback Notes" data={MOCK_FM18_NOTES}/>;}

// ── FM-19 pages ──────────────────────────────────────────────
function FM19ProjectClosurePage() {
  const [search,setSearch]=useState("");
  const filtered=MOCK_FM19_CLOSURE.filter(o=>!search||String(o.idMaster).includes(search)||o.projectDescription.toLowerCase().includes(search.toLowerCase())||o.submittedBy.toLowerCase().includes(search.toLowerCase()));
  return (
    <div>
      <PageTitle title="SY-QS-FM-19" sub="Project Closure"/>
      <FormPageTable
        search={<SearchBar value={search} onChange={setSearch} placeholder="Search ID Master, description or submitted by..."/>}
        headers={["ID","ID Master","Project Description","Have All Agreed","Invoiced Value","Total Charges","Submitted By","End Date","Closure Type"]}
        rawItems={filtered} rows={filtered.map(r=>[
          <IdCell v={r.id}/>,
          r.idMaster,
          <MidCell v={r.projectDescription}/>,
          <span style={{padding:"2px 8px",borderRadius:10,fontSize:11,fontWeight:600,background:r.haveAllAgreed==="Yes"?"#dcfce7":"#fef9c3",color:r.haveAllAgreed==="Yes"?"#166534":"#854d0e"}}>{r.haveAllAgreed}</span>,
          r.invoicedValue,
          r.totalCharges,
          r.submittedBy,
          <DateCell v={r.actualEndDate}/>,
          <span style={{padding:"2px 8px",borderRadius:10,fontSize:11,fontWeight:600,background:r.closureType==="Completed"?"#dcfce7":ATC.crimsonPale,color:r.closureType==="Completed"?"#166534":ATC.crimson}}>{r.closureType}</span>,
        ])}
      />
    </div>
  );
}
function FM19NotesPage(){return <NotesPage title="FM-19 Notes" subtitle="Project Closure Notes" data={MOCK_FM19_NOTES}/>;}

// --- App root -----------------------------------------------------------------
export default function App() {
  const [nav,setNav]=useState("dashboard");
  const [showForm,setShowForm]=useState(false);
  const [sidebarOpen,setSidebarOpen]=useState(false);
  const [profileOpen,setProfileOpen]=useState(false);
  const [isMobile,setIsMobile]=useState(window.innerWidth<1024);

  useEffect(()=>{ const fn=()=>setIsMobile(window.innerWidth<1024); window.addEventListener("resize",fn); return ()=>window.removeEventListener("resize",fn); },[]);
  useEffect(()=>{ if(!profileOpen) return; const fn=(e)=>{ if(!e.target.closest("[data-profile]")) setProfileOpen(false); }; document.addEventListener("mousedown",fn); return ()=>document.removeEventListener("mousedown",fn); },[profileOpen]);

  return (
    <div style={{fontFamily:"'Inter','Helvetica Neue',Arial,sans-serif",background:ATC.bg,minHeight:"100vh"}}>
      <Sidebar active={nav} onNavigate={n=>{setNav(n);setShowForm(false);}} open={sidebarOpen||!isMobile} onClose={()=>setSidebarOpen(false)} isMobile={isMobile} onNewJob={()=>{setShowForm(true);setNav("dashboard");}}/>

      <header style={{position:"fixed",top:0,left:isMobile?0:236,right:0,height:56,background:ATC.bgWhite,borderBottom:`3px solid ${ATC.crimson}`,display:"flex",alignItems:"center",justifyContent:"space-between",padding:"0 22px",zIndex:30,boxShadow:"0 1px 6px rgba(0,0,0,0.07)"}}>
        <div style={{display:"flex",alignItems:"center",gap:12}}>
          {isMobile&&<button onClick={()=>setSidebarOpen(true)} style={{background:"none",border:"none",color:ATC.textDark,cursor:"pointer",display:"flex",padding:4}}><Menu size={20}/></button>}
          {isMobile?<ATCLogo width={130}/>:<span style={{color:ATC.textMuted,fontSize:12}}>Quality Management System</span>}
        </div>
        <div style={{display:"flex",alignItems:"center",gap:16}}>
          <div style={{position:"relative",cursor:"pointer"}}>
            <Bell size={18} color={ATC.textMid}/>
            <span style={{position:"absolute",top:-5,right:-5,background:ATC.crimson,borderRadius:"50%",width:15,height:15,fontSize:9,fontWeight:800,color:"#fff",display:"flex",alignItems:"center",justifyContent:"center",border:`2px solid ${ATC.bgWhite}`}}>
              {MOCK_PENDING.length}
            </span>
          </div>
          <div data-profile="1" style={{position:"relative"}}>
            <div onClick={()=>setProfileOpen(o=>!o)} style={{display:"flex",alignItems:"center",gap:9,cursor:"pointer",padding:"4px 6px",borderRadius:8,background:profileOpen?ATC.bg:"transparent",transition:"background 0.15s"}}>
              <div style={{width:31,height:31,borderRadius:"50%",background:ATC.crimson,display:"flex",alignItems:"center",justifyContent:"center",color:"#fff",fontSize:11,fontWeight:800,flexShrink:0}}>DF</div>
            </div>
            {profileOpen&&(
              <div style={{position:"absolute",top:"calc(100% + 8px)",right:0,width:260,background:ATC.bgWhite,borderRadius:10,boxShadow:"0 8px 24px rgba(0,0,0,0.12)",border:`1px solid ${ATC.border}`,zIndex:100,overflow:"hidden"}}>
                {/* Header strip */}
                <div style={{background:ATC.crimson,padding:"16px 18px",display:"flex",alignItems:"center",gap:12}}>
                  <div style={{width:42,height:42,borderRadius:"50%",background:"rgba(255,255,255,0.25)",display:"flex",alignItems:"center",justifyContent:"center",color:"#fff",fontSize:15,fontWeight:800,flexShrink:0}}>DF</div>
                  <div>
                    <div style={{color:"#fff",fontSize:14,fontWeight:700,lineHeight:1.2}}>Dilum Fernando</div>
                    <div style={{color:"rgba(255,255,255,0.75)",fontSize:11,marginTop:3}}>Administrator</div>
                  </div>
                </div>
                {/* Email row */}
                <div style={{padding:"12px 18px",borderBottom:`1px solid ${ATC.border}`,display:"flex",alignItems:"center",gap:10}}>
                  <div style={{width:28,height:28,borderRadius:6,background:ATC.crimsonPale,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={ATC.crimson} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>
                  </div>
                  <div style={{minWidth:0}}>
                    <div style={{fontSize:10,fontWeight:700,color:ATC.textMuted,textTransform:"uppercase",letterSpacing:"0.05em",marginBottom:2}}>Email</div>
                    <div style={{fontSize:12,color:ATC.textDark,wordBreak:"break-all"}}>dilumf@atcwilliams.com.au</div>
                  </div>
                </div>
                {/* Sign out */}
                <div style={{padding:"8px"}}>
                  <button style={{width:"100%",display:"flex",alignItems:"center",gap:9,padding:"9px 10px",borderRadius:7,border:"none",background:"transparent",color:ATC.textMid,fontSize:13,cursor:"pointer",textAlign:"left"}}>
                    <LogOut size={14} color={ATC.textMuted}/> Sign out
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      <main style={{marginLeft:isMobile?0:236,marginTop:56,padding:isMobile?"20px 14px":"28px 32px",minHeight:"calc(100vh - 56px)",background:showForm?"#E8E9ED":undefined}}>
        {showForm
          ? <NewJobForm onBack={()=>setShowForm(false)} isMobile={isMobile}/>
          : <>
              {nav==="dashboard"    && <DashboardPage summary={MOCK_SUMMARY} onNewJob={()=>setShowForm(true)}/>}
              {nav==="qmsmaster"    && <QMSMasterPage/>}
              {nav==="clientcontacts"&&<ClientContactsPage isMobile={isMobile}/>}
              {nav==="clients"      && <ClientsPage isMobile={isMobile}/>}
              {nav==="sites"        && <SitesPage isMobile={isMobile}/>}
              {nav==="qmsforms"        && <QMSFormsPage onNavigate={setNav}/>}
              {nav==="fm01a"           && <FM01APage/>}
              {nav==="fm01a-mc"        && <FM01AMCPage/>}
              {nav==="fm01b"           && <FM01BPage/>}
              {nav==="fm01b-notes"     && <FM01BNotesPage/>}
              {nav==="fm01b-tasks"     && <FM01BTasksPage/>}
              {nav==="fm02"            && <FM02Page/>}
              {nav==="fm02-notes"      && <FM02NotesPage/>}
              {nav==="fm03a"           && <FM03APage/>}
              {nav==="fm03a-notes"     && <FM03ANotesPage/>}
              {nav==="fm03b"           && <FM03BPage/>}
              {nav==="fm03b-notes"     && <FM03BNotesPage/>}
              {nav==="fm04"            && <FM04Page/>}
              {nav==="fm04-notes"      && <FM04NotesPage/>}
              {nav==="fm04-reviewers"  && <FM04ReviewersPage/>}
              {nav==="fm04-revdocs"    && <FM04RevDocsPage/>}
              {nav==="fm05"            && <FM05ReviewPlanPage/>}
              {nav==="fm05-notes"      && <FM05NotesPage/>}
              {nav==="fm05-scope"      && <FM05ScopePage/>}
              {nav==="fm06"             && <FM06ProjectPlanPage/>}
              {nav==="fm06-notes"       && <FM06NotesPage/>}
              {nav==="fm06-milestones"  && <FM06MilestonesPage/>}
              {nav==="fm06-categories"  && <FM06CategoriesPage/>}
              {nav==="fm06-deliverables"&& <FM06DeliverablesPage/>}
              {nav==="fm06-extresources"&& <FM06ExtResourcesPage/>}
              {nav==="fm07"             && <FM07SIDPage/>}
              {nav==="fm07-main"        && <FM07MainPage/>}
              {nav==="fm07-notes"       && <FM07NotesPage/>}
              {nav==="fm08"             && <FM08DocumentRegisterPage/>}
              {nav==="fm08-notes"       && <FM08NotesPage/>}
              {nav==="fm09"             && <FM09DrawingRegisterPage/>}
              {nav==="fm09-notes"       && <FM09NotesPage/>}
              {nav==="fm10"             && <FM10CommunicationsMatrixPage/>}
              {nav==="fm10-notes"       && <FM10NotesPage/>}
              {nav==="fm11"             && <FM11ChangeRegisterPage/>}
              {nav==="fm11-costItems"   && <FM11CostItemsPage/>}
              {nav==="fm11-notes"       && <FM11NotesPage/>}
              {nav==="fm12"             && <FM12ChangeRegisterPage/>}
              {nav==="fm12-notes"       && <FM12NotesPage/>}
              {nav==="fm13"             && <FM13BasisOfDesignPage/>}
              {nav==="fm13-template"    && <FM13TemplateFilePage/>}
              {nav==="fm13-notes"       && <FM13NotesPage/>}
              {nav==="fm14"             && <FM14WorkPackagePlanPage/>}
              {nav==="fm14-tasks"       && <FM14TasksPage/>}
              {nav==="fm14-notes"       && <FM14NotesPage/>}
              {nav==="fm15"             && <FM15CADDRequestPage/>}
              {nav==="fm15-drawsFigs"   && <FM15DrawsFigsPage/>}
              {nav==="fm15-dataLoc"     && <FM15DataLocPage/>}
              {nav==="fm15-titleBlock"  && <FM15TitleBlockPage/>}
              {nav==="fm15-notes"       && <FM15NotesPage/>}
              {nav==="fm16"             && <FM16DocumentReviewPage/>}
              {nav==="fm16-reviewDocs"  && <FM16ReviewDocsPage/>}
              {nav==="fm16-notes"       && <FM16NotesPage/>}
              {nav==="fm17"             && <FM17TransmittalPage/>}
              {nav==="fm17-docs"        && <FM17DocumentsPage/>}
              {nav==="fm17-notes"       && <FM17NotesPage/>}
              {nav==="fm18"             && <FM18ClientFeedbackPage/>}
              {nav==="fm18-uploads"     && <FM18UploadsPage/>}
              {nav==="fm18-notes"       && <FM18NotesPage/>}
              {nav==="fm19"             && <FM19ProjectClosurePage/>}
              {nav==="fm19-notes"       && <FM19NotesPage/>}
              {!["dashboard","qmsmaster","clientcontacts","opportunities","approvals","clients","sites","qmsforms","fm01a","fm01a-mc","fm01b-notes","fm01b-tasks","fm02","fm02-notes","fm03a","fm03a-notes","fm03b","fm03b-notes","fm04","fm04-notes","fm04-reviewers","fm04-revdocs","fm05","fm05-notes","fm05-scope","fm06","fm06-notes","fm06-milestones","fm06-categories","fm06-deliverables","fm06-extresources","fm07","fm07-main","fm07-notes","fm08","fm08-notes","fm09","fm09-notes","fm10","fm10-notes","fm11","fm11-costItems","fm11-notes","fm12","fm12-notes","fm13","fm13-template","fm13-notes","fm14","fm14-tasks","fm14-notes","fm15","fm15-drawsFigs","fm15-dataLoc","fm15-titleBlock","fm15-notes","fm16","fm16-reviewDocs","fm16-notes","fm17","fm17-docs","fm17-notes","fm18","fm18-uploads","fm18-notes","fm19","fm19-notes"].includes(nav)&&<PlaceholderPage title={NAV_ITEMS.find(n=>n.id===nav)?.label??QMS_FORMS.find(f=>f.id===nav)?.label??""}/>}
            </>
        }
        <footer style={{marginTop:48,paddingTop:14,borderTop:`1px solid ${ATC.border}`,display:"flex",alignItems:"center",justifyContent:"center",gap:14}}>
          <ATCLogo width={120}/>
          <span style={{fontSize:11,color:ATC.textMuted}}>(c) 2024 ATC Williams - Quality Management System</span>
        </footer>
      </main>
    </div>
  );
}

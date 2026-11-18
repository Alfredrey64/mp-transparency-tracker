// One loader per data file that more than one place draws on, so they share a single fetch and a single cached copy (see useDataFile).
export const councilsIndex = () => import("../data/councilsIndex.json");
export const constituencies = () => import("../data/constituencies.json");
export const crimePeople = () => import("../data/crimePeople.json");
export const deprivationNations = () => import("../data/deprivationNations.json");
export const lordsVotes = () => import("../data/lordsVotes.json");
export const committeeReports = () => import("../data/committeeReports.json");
export const statutoryInstruments = () => import("../data/statutoryInstruments.json");
export const parliamentCalendar = () => import("../data/parliamentCalendar.json");
export const regionalBreakdowns = () => import("../data/regionalBreakdowns.json");
export const backbench = () => import("../data/backbench.json");
export const auditReports = () => import("../data/auditReports.json");
export const councilComplaints = () => import("../data/councilComplaints.json");
export const aeNearYou = () => import("../data/aeNearYou.json");

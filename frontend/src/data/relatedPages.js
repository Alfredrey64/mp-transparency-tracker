// Pages that belong together in a reader's mind but sit in different menu groups or sections. Each pair is shown both ways, as "Related pages" under both of
// them (SectionNav), using the other page's own name and one-line hint from the menu. Pages in the same menu group already have tabs, so a pair is only
// worth listing when the two are NOT in one group (a test checks this, and that every key is a real page).
export const RELATED_PAIRS = [
  // Watching the government
  ["watchdogs", "auditWatch"], ["watchdogs", "committees"], ["auditWatch", "departments"], ["civilService", "specialAdvisers"], ["auditWatch", "govContracts"], ["inquiries", "committeeReports"],
  ["civilService", "cabinet"], ["civilService", "revolvingDoor"], ["cabinet", "revolvingDoor"], ["cabinet", "ministerialMeetings"],
  // Money and influence
  ["appg", "lobbyingRegister"], ["appg", "list"], ["appg", "donors"], ["foreignInfluence", "lobbyingRegister"], ["foreignInfluence", "darkMoney"],
  ["list", "standards"], ["standards", "appg"], ["standards", "rebels"], ["ministerialMeetings", "lobbyingRegister"],
  ["thinkTanks", "mediaLiteracy"], ["darkMoney", "howPartyFundingWorks"], ["honours", "partyFinances"], ["honours", "darkMoney"],
  ["electionSpending", "generalElection"], ["partyFinances", "parties"],
  // How laws and money are made
  ["howLawMade", "backbench"], ["howLawMade", "statutoryInstruments"], ["howLawMade", "voting"], ["backbench", "petitions"],
  ["statutoryInstruments", "committees"], ["statutoryInstruments", "consultations"], ["howBudgetWorks", "taxRates"], ["howBudgetWorks", "publicFinances"],
  ["howBudgetWorks", "departments"], ["departments", "publicFinances"], ["taxRates", "calculators"], 
  ["writtenQuestions", "getThingsDone"], ["topics", "howitworks"],
  // Elections and your area
  ["howtovote", "localElections"], ["polling", "spotMisleadingStats"], ["polling", "mediaLiteracy"], ["spotMisleadingStats", "indicators"],
  ["constituency", "myArea"], ["constituency", "generalElection"], ["myArea", "nearYou"], ["myArea", "councils"], ["councils", "localElections"], ["councils", "councilComplaints"],
  ["policeCommissioners", "crime"], ["policeCommissioners", "localElections"], ["planning", "housing"], ["mayors", "devolved"],
  ["formerMps", "byElections"], ["history", "generalElection"],
  // The state and the nations
  ["devolved", "union"], ["constitution", "lords"], ["justice", "constitution"],
  // Britain in numbers
  ["nhs", "departments"], ["care", "councilSpending"], ["defence", "departments"], ["energy", "housing"], ["energy", "prices"],
  ["inequality", "welfare"], ["immigration", "brexit"],
  ["education", "nearYou"], ["transport", "regions"], 
];

// key -> the pages it is related to, in the order listed.
export const RELATED = (() => {
  const map = new Map();
  const add = (a, b) => { if (!map.has(a)) map.set(a, []); if (!map.get(a).includes(b)) map.get(a).push(b); };
  for (const [a, b] of RELATED_PAIRS) { add(a, b); add(b, a); }
  return map;
})();

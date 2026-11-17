// Everything on the site that a person types in, with how often it is looked at again. The weekly content check (audit-content.mjs) lists a row as soon as it is overdue, so
// "update the hand-kept bits regularly" does not depend on anyone remembering. The `content-review` issue it opens names the row, the source to read and the files to change.
//
// To retire a row: read the source, correct the file, and only then change `checked` to today (or, for a file that carries its own date, update that date). Bumping the date
// without reading the source defeats the alarm. `checked` below starts from the day each file was last edited, which is the best record there is.
//
// A new file in src/data must be one of: a row below, listed in AUTOMATIC (a scheduled job rewrites it), or listed in FIXED (history, structure, wording that cannot go stale).
// frontend/scripts/hand-kept.test.js fails if one is none of these, so a new hand-typed file cannot be forgotten.

// every: days between looks. stamp: a file that holds its own date, { file, key } (JSON). where: what to read. checked: "YYYY-MM-DD".
export const HAND_KEPT = [
  { id: "salary-yardsticks", files: ["referenceFigures.js"], every: 90, checked: "2026-11-16", what: "Everyday yardsticks (average salary, and the other figures money is compared with)", source: "ONS ASHE bulletin (each October), ONS and DWP releases named in the file" },
  { id: "inequality-hand-figures", files: ["inequality.js"], every: 60, checked: "2026-11-16", what: "Gender, disability and wealth gaps typed from ONS bulletins", source: "ONS gender pay gap, disability pay gap and Wealth and Assets Survey releases (the yearly check only sees the first)" },
  { id: "foreign-influence-register", files: ["firsRegister.json"], every: 30, stamp: { file: "firsRegister.json", key: "checked" }, what: "Foreign Influence Registration Scheme register: counts and entries, counted by hand", source: "foreign-influence-registration-scheme.service.gov.uk public register (read it in the browser)" },
  { id: "office-holder-stories", files: ["chancellors.js", "governments.js"], every: 45, checked: "2026-10-13", what: "Chancellors and governments: dates and the short story for each", source: "GOV.UK; the office-holders workflow raises an issue when the Prime Minister or Chancellor changes, this row also checks the wording" },
  { id: "public-inquiries", files: ["publicInquiries.js"], every: 30, checked: "2026-11-03", what: "Public inquiries: status and latest report", source: "each inquiry's own website and GOV.UK" },
  { id: "spending-plans", files: ["departmentSpending.js", "publicSpending.js"], every: 60, checked: "2026-11-02", what: "Department spending plans and the categories of public spending", source: "HM Treasury Spending Review tables and the OBR's latest forecast" },
  { id: "ministerial-meetings", files: ["ministerialMeetings.js"], every: 30, checked: "2026-11-16", what: "The hand-picked sample of ministers' declared meetings", source: "GOV.UK transparency data for ministerial meetings" },
  { id: "party-positions", files: ["partyManifestos.js", "answerPartyPositions.js", "manifestoPledges.js"], every: 120, checked: "2026-10-26", what: "What each party's manifesto promised, and what the winning parties delivered", source: "party manifestos and the Commons Library; new policy documents or a new manifesto mean a re-read" },
  { id: "devolved-elections", files: ["devolvedElections.js"], every: 90, checked: "2026-10-12", what: "Scottish, Welsh and Northern Ireland election results", source: "each parliament's results page" },
  { id: "campaign-limits", files: ["spendLimits.js"], every: 90, checked: "2026-11-12", what: "Campaign spending limits", source: "Representation of the People Act 1983 s.76, PPERA 2000 Sch 9, and the Electoral Commission" },
  { id: "tax-wording", files: ["taxCatalogue.js", "taxStories.js"], every: 45, checked: "2026-11-14", what: "What each tax is and the stories behind the big changes (the rates themselves are fetched)", source: "GOV.UK and the latest Budget documents" },
  { id: "pledge-selection", files: ["promises.js"], every: 30, checked: "2026-11-16", what: "The curated subset of government pledges (Full Fact verdicts are fetched daily)", source: "fullfact.org/government-tracker" },
  { id: "donor-profiles", files: ["donorProfiles.json"], every: 90, checked: "2026-11-16", what: "One-paragraph profiles of the biggest donors (the Monday check also lists any individual over £100,000 with no profile)", source: "a page you have read that names the donor (Wikipedia, a company or charity page, a named news report); leave a donor blank rather than guess" },
  { id: "consultant-lobbyists", files: ["consultantLobbyists.json"], every: 60, checked: "2026-09-27", what: "Register of consultant lobbyists", source: "registrarofconsultantlobbyists.org.uk" },
  { id: "who-is-involved-in-crime", files: ["crimePeople.json"], every: 90, stamp: { file: "crimePeople.json", key: "fetchedAt" }, what: "Crime by ethnicity and background; rebuilt by running node fetch-crime-people.js", source: "Home Office, Ministry of Justice and ONS releases listed at the top of fetch-crime-people.js" },
  { id: "justice-statistics", files: ["justiceFigures.js"], every: 100, checked: "2026-11-17", what: "Courts, police and prisons headline figures (open court cases, prison population, police officers); the quarterly editions bring new ones", source: "GOV.UK: Criminal court statistics quarterly, Offender management statistics quarterly and Police workforce, England and Wales (the Justice page lists each link). Change the JUSTICE block and its wording" },
  { id: "prison-projection", files: ["justiceFigures.js"], every: 380, checked: "2026-11-17", what: "Prison population projection and the places available (PRISON_PROJECTION)", source: "GOV.UK: Prison population projections, published each December; capacity from the weekly prison population figures" },
  { id: "crime-outcomes", files: ["justiceFigures.js"], every: 380, checked: "2026-11-17", what: "What happens to 100 recorded crimes (CRIME_OUTCOMES): charged, evidence, no suspect, open", source: "Home Office, Crime outcomes in England and Wales, published each July" },
  { id: "deprivation", files: ["deprivation.json", "deprivationNations.json", "deprivationConstituencies.json", "deprivationKinds.js"], every: 180, checked: "2026-10-09", what: "Indices of deprivation for England, Wales, Scotland and Northern Ireland; rebuilt with node fetch-deprivation.js and fetch-deprivation-nations.js", source: "MHCLG, Welsh Government, Scottish Government and NISRA release pages" },
];

// Files a scheduled job rewrites (daily or weekly), so nobody types them.
export const AUTOMATIC = [
  /^(ageing|care|defence|education|health|inequality|transport|trust|brexit|devolution|energy)Data\.json$/, /^(inequalityAbroad|inequalityPlace)\.json$/, /^ons\//,
  /^(benchmarks|billStages|committeeReports|constituencies|constituencyHistory|constituencySummary|councilsIndex|donorSectors|donorSectorsMeta|entryNotes|fullFactPledges|lawExample|lordsCareers|lordsVotes|mpCareers|parliamentCalendar|partyDonorSectors|partyDonorSectorsMeta|partyLeaders|pipelineStatus|plainEnglish|regionalBreakdowns|representatives|standardsReportAuto|standardsReportDetails|statutoryInstruments|taxBands|taxSeries)\.json$/,
  /^(careerDetail|councilDetail|lordsCareerDetail)\//, /^(councilTaxByCouncil|devolvedLeaders|pmPortraits)\.json$/,
];

// Files that are history, structure or wording that cannot go stale, or that carry their own date in CHECKED / `checked:` (the weekly check reads those separately).
export const FIXED = [
  /^(ageing|care|defence|education|health|inequality|transport|trust|brexit|devolution|energy)\.js$/, // the page's own CHECKED date is watched (45 days); inequality.js is also a row above
  /^(generalElection2024|spending2024|electionHistory|electionMargins|electionSeatNames|electionsHistory|seatHexes|seatHexes2019|regionMap|regionalProfile)\.(js|json)$/,
  /^(glossary\w*|pageGuides|siteMenu|sidebarSections|siteUpdates|explainerKeys|hubs|voteSteps|governmentTiers|compareStories|answers|landmarkExplainers|teacherExtras|teacherMode|partyMatchQuiz|partyMatchEvidence)\.js$/,
  /^(ons[A-Z]\w+|regionMetrics)\.js$/, // series wiring and plain-English notes; the sector's CHECKED date is watched
  /^(taxEvents)\.js$/, // NEXT_BUDGET is watched by the weekly check (a Budget that has passed)
];

// The files in src/data (top level and one folder down) that none of the three lists name.
export function unclassified(files) {
  const named = new Set(HAND_KEPT.flatMap((r) => r.files));
  return files.filter((f) => !named.has(f) && !AUTOMATIC.some((re) => re.test(f)) && !FIXED.some((re) => re.test(f)));
}

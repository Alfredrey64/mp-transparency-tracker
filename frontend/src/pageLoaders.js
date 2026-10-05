// The code behind each page, loaded on demand. App renders these through
// React.lazy; Sidebar also calls preloadView() when a link is hovered, focused
// or touched, so by the time it is clicked the page is usually already here.

export const LOADERS = {
  appg: () => import("./components/AppgMemberships"),
  howitworks: () => import("./components/HowParliamentWorks"),
  voting: () => import("./components/VotingRecords"),
  donors: () => import("./components/DonorsLobbying"),
  partyFinances: () => import("./components/PartyFinances"),
  parties: () => import("./components/PartyPolicies"),
  history: () => import("./components/PoliticalHistory"),
  timeline: () => import("./components/Timeline"),
  devolved: () => import("./components/DevolvedAdministrations"),
  tracker: () => import("./components/GovernmentTracker"),
  budget: () => import("./components/GovernmentBudget"),
  cabinet: () => import("./components/Cabinet"),
  lords: () => import("./components/HouseOfLords"),
  formerMps: () => import("./components/FormerMps"),
  byElections: () => import("./components/ByElections"),
  petitions: () => import("./components/Petitions"),
  partymatch: () => import("./components/PartyMatch"),
  committees: () => import("./components/Committees"),
  compare: () => import("./components/ComparePoliticians"),
  ministerialMeetings: () => import("./components/MinisterialMeetings"),
  writtenQuestions: () => import("./components/WrittenQuestions"),
  standards: () => import("./components/StandardsReports"),
  rankings: () => import("./components/Rankings"),
  myMP: () => import("./components/MyMP"),
  mediaLiteracy: () => import("./components/MediaLiteracy"),
  darkMoney: () => import("./components/DarkMoney"),
  revolvingDoor: () => import("./components/RevolvingDoor"),
  thinkTanks: () => import("./components/ThinkTankFunding"),
  lobbyingRegister: () => import("./components/LobbyingRegister"),
  followTheMoney: () => import("./components/FollowTheMoney"),
  watchlist: () => import("./components/WatchlistDigest"),
  numbers: () => import("./components/ParliamentNumbers"),
  topics: () => import("./components/AskedAbout"),
  start: () => import("./components/StartHere"),
  rebels: () => import("./components/Rebels"),
  offices: () => import("./components/Offices"),
  councils: () => import("./components/Councils"),
  constituency: () => import("./components/ConstituencyHub"),
  methodology: () => import("./components/Methodology"),
  glossary: () => import("./components/Glossary"),
  settings: () => import("./components/Settings"),
  privacy: () => import("./components/PrivacyPolicy"),
  terms: () => import("./components/TermsConditions"),
  list: () => import("./components/PoliticianList"),
};

const started = new Set();

export function preloadView(key) {
  if (started.has(key) || !LOADERS[key]) return;
  started.add(key);
  LOADERS[key]().catch(() => started.delete(key));
}

import {
  IconFlow, IconCoin, IconVote, IconGroup, IconInfluence, IconManifesto, IconTracker,
  IconGlossary, IconHistory, IconDevolved, IconFormerMP, IconBudget, IconCabinet, IconTimeline,
  IconPartyFinance, IconByElection, IconLords, IconPetition, IconCompass, IconCommittee, IconCompare, IconMeeting,
  IconQuestion, IconGavel, IconRankings, IconDarkMoney, IconThinkTank, IconDoor, IconRegister,
  IconSearch, IconBook, IconChartBars, IconTopic, IconRoute, IconSplit, IconHexMap, IconCouncil,
} from "../components/icons";

// Lives outside both Sidebar.jsx and shared.jsx specifically so neither has
// to import the other to share this data: Sidebar renders these groups,
// and PageHeader (in shared.jsx) derives each page's header colour from
// them via SECTION_ACCENT_BY_ICON below — a real circular import between
// the two component files otherwise.
//
// One accent hue per section, used for its label dot, its card tint, its
// active-item highlight, and its active item's icon colour — the fastest
// way to tell at a glance which group you're in, independent of reading
// the (smaller, uppercase) section label itself. Turned up to real,
// saturated colour rather than the muted institutional tones this used to
// be — the whole point is that sections read as visually distinct, which a
// set of near-identical desaturated browns and greens never quite managed.
// Each section renders as its own faintly tinted card so the groups stay
// visually distinct even with every item on screen at once.
export const SECTIONS = [
  {
    key: "learn",
    label: "Understand it",
    blurb: "How politics works, in plain English",
    accent: "#2F80ED",
    items: [
      { key: "start", label: "Take the guided tour", icon: IconRoute, hint: "5 minutes, no jargon", essential: true },
      { key: "howitworks", label: "How Parliament works", icon: IconFlow, hint: "From idea to law, step by step", essential: true, aka: ["parliament", "laws"] },
      { key: "devolved", label: "Scotland, Wales & N. Ireland", icon: IconDevolved, hint: "Who decides what where you live", aka: ["devolved administrations", "devolution"] },
      { key: "parties", label: "What parties promise", icon: IconManifesto, hint: "Manifesto positions side by side", aka: ["party policies", "manifesto"] },
      { key: "glossary", label: "Jargon buster", icon: IconGlossary, hint: "Plain meanings of political words", essential: true, aka: ["glossary", "terms", "definitions"] },
      { key: "mediaLiteracy", label: "How news is regulated", icon: IconBook, hint: "Telling fact from opinion", aka: ["media literacy", "bbc", "impartiality"] },
      { key: "numbers", label: "Parliament in numbers", icon: IconChartBars, hint: "Who sits there, in charts", essential: true, aka: ["statistics", "stats", "women", "lords"] },
    ],
  },
  {
    // Interactive, participatory tools — as distinct from Learn's static
    // reference material above. Find Your Party lived under Learn before,
    // but it's a personalised tool, not something to read; Petitions used
    // to sit under The Government, but a petition is something a citizen
    // does, not a government institution.
    key: "involved",
    label: "Your area & your say",
    blurb: "Things you can look up and do",
    accent: "#E0367A",
    items: [
      { key: "constituency", label: "Your constituency", icon: IconHexMap, hint: "Your MP, seat and local results", essential: true, aka: ["constituency", "seat", "map", "election result"] },
      { key: "councils", label: "Your council", icon: IconCouncil, hint: "Councillors and local elections", essential: true, aka: ["councillors", "local elections", "council"] },
      { key: "partymatch", label: "Which party suits me?", icon: IconCompass, hint: "A short quiz", aka: ["find your party", "quiz"] },
      { key: "petitions", label: "Petitions", icon: IconPetition, hint: "Ask Parliament to act", essential: true },
    ],
  },
  {
    key: "government",
    label: "Who's in charge",
    blurb: "The people running the country",
    accent: "#D9A62A",
    items: [
      { key: "cabinet", label: "Cabinet ministers", icon: IconCabinet, hint: "The top government jobs", aka: ["cabinet", "prime minister"] },
      { key: "offices", label: "Who held which job", icon: IconCabinet, hint: "Search any minister's role", aka: ["who held office", "secretary of state"] },
      { key: "lords", label: "The House of Lords", icon: IconLords, hint: "The unelected second chamber", aka: ["peers", "lords"] },
      { key: "committees", label: "Watchdog committees", icon: IconCommittee, hint: "MPs who question ministers", aka: ["select committees"] },
      { key: "budget", label: "Where taxes go", icon: IconBudget, hint: "Government spending in charts", aka: ["government budget", "spending"] },
      { key: "tracker", label: "Promises tracker", icon: IconTracker, hint: "Has the government kept its word?", aka: ["manifesto promises"] },
      { key: "byElections", label: "By-elections", icon: IconByElection, hint: "Votes between general elections", aka: ["elections", "by election"] },
    ],
  },
  {
    // Where the money is — declared interests, who funds MPs individually,
    // and who funds parties directly. "Financial Interests" lives here
    // (not under MP Accountability below) because it's the app's core
    // follow-the-money page, not a record of an MP's personal conduct.
    // Kept to the four *declared-register* pages — somewhere to look up a
    // real name and a real figure — so it doesn't blur into the explainer
    // pages just below, which are about what the registers can't show you.
    key: "money",
    label: "Money & influence",
    blurb: "Who pays whom, and what's declared",
    accent: "#F2622A",
    items: [
      { key: "followTheMoney", label: "Trace a donor", icon: IconSearch, hint: "See everyone a donor has funded", aka: ["follow the money", "donor"] },
      { key: "list", label: "Gifts, jobs & donations", icon: IconCoin, hint: "What every MP has declared", essential: true, aka: ["financial interests", "register of interests", "declared"] },
      { key: "donors", label: "Who funds MPs", icon: IconInfluence, hint: "Donors and lobbyists, by industry", essential: true, aka: ["donors & lobbying", "donations", "lobbying"] },
      { key: "partyFinances", label: "Who funds the parties", icon: IconPartyFinance, hint: "Donations to political parties", aka: ["party finances", "party funding"] },
      { key: "ministerialMeetings", label: "Ministers' meetings", icon: IconMeeting, hint: "Who gets a minister's time", aka: ["ministerial meetings"] },
    ],
  },
  {
    // The other side of "Money in Politics": not a register of names and
    // figures, but an explanation of where those registers run out — a
    // legal gap, an expired rule, an undisclosed funder. Split out from
    // "Money in Politics" itself once it grew to four pages of its own,
    // so neither section reads as a long, undifferentiated list.
    key: "gaps",
    label: "What's hidden",
    blurb: "Where the public records run out",
    accent: "#E63946",
    items: [
      { key: "darkMoney", label: "Hidden donations", icon: IconDarkMoney, hint: "Money with no named donor", aka: ["dark money"] },
      { key: "revolvingDoor", label: "Ministers' later jobs", icon: IconDoor, hint: "From government into industry", aka: ["revolving door"] },
      { key: "lobbyingRegister", label: "Paid lobbyists", icon: IconRegister, hint: "The official list, and its limits", aka: ["consultant lobbyists", "lobbyists"] },
      { key: "thinkTanks", label: "Who funds think tanks", icon: IconThinkTank, hint: "The money behind the experts", aka: ["think tank funding"] },
    ],
  },
  {
    // What MPs actually do in Parliament, as distinct from money — how
    // they vote and which cross-party groups they join.
    key: "accountability",
    label: "How MPs behave",
    blurb: "What MPs do with their power",
    accent: "#9B4FE0",
    items: [
      { key: "voting", label: "How MPs voted", icon: IconVote, hint: "Every vote, in plain English", essential: true, aka: ["voting records", "bills", "divisions"] },
      { key: "rebels", label: "MPs who defy their party", icon: IconSplit, hint: "Who breaks ranks", aka: ["rebels", "rebellion"] },
      { key: "writtenQuestions", label: "Questions to ministers", icon: IconQuestion, hint: "What MPs are asking", aka: ["written questions"] },
      { key: "topics", label: "Who's asking about a topic", icon: IconTopic, hint: "Search any subject", aka: ["who's asking about"] },
      { key: "standards", label: "Conduct & standards", icon: IconGavel, hint: "When MPs break the rules", aka: ["standards & sanctions", "sanctions"] },
      { key: "appg", label: "Cross-party groups", icon: IconGroup, hint: "APPGs, and who funds them", aka: ["appg memberships", "appg"] },
      { key: "compare", label: "Compare MPs", icon: IconCompare, hint: "Side by side" },
      { key: "rankings", label: "MP league tables", icon: IconRankings, hint: "Expenses, votes and earnings", aka: ["rankings"] },
    ],
  },
  {
    key: "history",
    label: "History",
    blurb: "How we got here",
    accent: "#1FA97C",
    items: [
      { key: "history", label: "Landmark votes", icon: IconHistory, hint: "Moments that shaped today", aka: ["political history"] },
      { key: "timeline", label: "Timeline", icon: IconTimeline, hint: "Every government since 1721" },
      { key: "formerMps", label: "Recent departures", icon: IconFormerMP, hint: "MPs who have just left", aka: ["former mps"] },
    ],
  },
];

// Every page's PageHeader already passes a distinct icon component — this
// map lets PageHeader ask "whose icon is this" and colour its header to
// match that icon's sidebar section, with no changes needed to any
// individual page file. Pages outside any section (Home-level items,
// Methodology/Settings, standalone pages like Privacy/Terms) fall back to
// the plain sitewide accent.
export const SECTION_ACCENT_BY_ICON = new Map(
  SECTIONS.flatMap((section) => section.items.map((item) => [item.icon, section.accent]))
);

// The small label above each page's title is the name of the sidebar section the
// page lives in, so a page and its menu group always read the same way. Pages
// that sit outside every section get a plain label of their own.
const OUTSIDE_SECTIONS = {
  myMP: "Your area & your say",
  watchlist: "Your area & your say",
  methodology: "About this site",
  settings: "About this site",
  privacy: "About this site",
  terms: "About this site",
};
export const SECTION_LABEL_BY_KEY = new Map([
  ...Object.entries(OUTSIDE_SECTIONS),
  ...SECTIONS.flatMap((section) => section.items.map((item) => [item.key, section.label])),
]);

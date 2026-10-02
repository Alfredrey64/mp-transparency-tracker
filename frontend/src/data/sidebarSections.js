import {
  IconFlow, IconCoin, IconVote, IconGroup, IconInfluence, IconManifesto, IconTracker,
  IconGlossary, IconHistory, IconDevolved, IconFormerMP, IconBudget, IconCabinet, IconTimeline,
  IconPartyFinance, IconByElection, IconLords, IconPetition, IconCompass, IconCommittee, IconCompare, IconMeeting,
  IconQuestion, IconGavel, IconRankings, IconDarkMoney, IconThinkTank, IconDoor, IconRegister,
  IconSearch, IconBook, IconChartBars, IconTopic,
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
    label: "Learn",
    accent: "#2F80ED",
    items: [
      { key: "howitworks", label: "How Parliament Works", icon: IconFlow },
      { key: "devolved", label: "Devolved Administrations", icon: IconDevolved },
      { key: "parties", label: "Party Policies", icon: IconManifesto },
      { key: "glossary", label: "Glossary", icon: IconGlossary },
      { key: "mediaLiteracy", label: "Media Literacy", icon: IconBook },
      { key: "numbers", label: "Parliament in Numbers", icon: IconChartBars },
    ],
  },
  {
    // Interactive, participatory tools — as distinct from Learn's static
    // reference material above. Find Your Party lived under Learn before,
    // but it's a personalised tool, not something to read; Petitions used
    // to sit under The Government, but a petition is something a citizen
    // does, not a government institution.
    key: "involved",
    label: "Get Involved",
    accent: "#E0367A",
    items: [
      { key: "partymatch", label: "Find Your Party", icon: IconCompass },
      { key: "petitions", label: "Petitions", icon: IconPetition },
    ],
  },
  {
    key: "government",
    label: "The Government",
    accent: "#D9A62A",
    items: [
      { key: "cabinet", label: "Cabinet", icon: IconCabinet },
      { key: "lords", label: "House of Lords", icon: IconLords },
      { key: "committees", label: "Select Committees", icon: IconCommittee },
      { key: "budget", label: "Government Budget", icon: IconBudget },
      { key: "tracker", label: "Promises Tracker", icon: IconTracker },
      { key: "byElections", label: "Elections", icon: IconByElection },
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
    label: "Money in Politics",
    accent: "#F2622A",
    items: [
      { key: "followTheMoney", label: "Follow the Money", icon: IconSearch },
      { key: "list", label: "Financial Interests", icon: IconCoin },
      { key: "donors", label: "Donors & Lobbying", icon: IconInfluence },
      { key: "partyFinances", label: "Party Finances", icon: IconPartyFinance },
      { key: "ministerialMeetings", label: "Ministerial Meetings", icon: IconMeeting },
    ],
  },
  {
    // The other side of "Money in Politics": not a register of names and
    // figures, but an explanation of where those registers run out — a
    // legal gap, an expired rule, an undisclosed funder. Split out from
    // "Money in Politics" itself once it grew to four pages of its own,
    // so neither section reads as a long, undifferentiated list.
    key: "gaps",
    label: "Transparency Gaps",
    accent: "#E63946",
    items: [
      { key: "darkMoney", label: "Dark Money", icon: IconDarkMoney },
      { key: "revolvingDoor", label: "Revolving Door", icon: IconDoor },
      { key: "lobbyingRegister", label: "Consultant Lobbyists", icon: IconRegister },
      { key: "thinkTanks", label: "Think Tank Funding", icon: IconThinkTank },
    ],
  },
  {
    // What MPs actually do in Parliament, as distinct from money — how
    // they vote and which cross-party groups they join.
    key: "accountability",
    label: "MP Accountability",
    accent: "#9B4FE0",
    items: [
      { key: "voting", label: "Voting Records & Bills", icon: IconVote },
      { key: "writtenQuestions", label: "Written Questions", icon: IconQuestion },
      { key: "topics", label: "Who's Asking About…", icon: IconTopic },
      { key: "standards", label: "Standards & Sanctions", icon: IconGavel },
      { key: "appg", label: "APPG Memberships", icon: IconGroup },
      { key: "compare", label: "Compare MPs", icon: IconCompare },
      { key: "rankings", label: "Rankings", icon: IconRankings },
    ],
  },
  {
    key: "history",
    label: "History",
    accent: "#1FA97C",
    items: [
      { key: "history", label: "Political History", icon: IconHistory },
      { key: "timeline", label: "Timeline", icon: IconTimeline },
      { key: "formerMps", label: "Former MPs", icon: IconFormerMP },
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

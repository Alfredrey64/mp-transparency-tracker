import {
  IconFlow, IconCoin, IconVote, IconGroup, IconInfluence, IconManifesto, IconTracker,
  IconGlossary, IconHistory, IconDevolved, IconFormerMP, IconCabinet, IconScales, IconEuStars, IconDefence, IconMortarboard, IconClassroom, IconPension, IconPulse, IconBolt, IconHeart, IconTransport, IconTimeline,
  IconPartyFinance, IconByElection, IconLords, IconPetition, IconCompass, IconCommittee, IconCompare, IconMeeting,
  IconQuestion, IconGavel, IconRankings, IconDarkMoney, IconThinkTank, IconDoor, IconRegister,
  IconSearch, IconBook, IconChartBars, IconTopic, IconRoute, IconSplit, IconHexMap, IconCouncil,
  IconTaxes, IconCalculator, IconRates, IconMigration, IconMap, IconAsk, IconDeprivation, IconSwing, IconSeatCompare, IconFactory, IconTrend, IconBasket, IconBriefcase, IconLedger, IconPopulation, IconHeartbeat, IconBallot, IconCalendar, IconHouse, IconGlobe, IconLeaf, IconCompareTime, IconShield, IconLordsVote, IconCouncillor, IconFeed, IconPinHome, IconWhoStands, IconCompareAreas
} from "../components/icons";
import {
  IconContract, IconPeerage, IconElectionSpend, IconForeignAgent, IconMayor, IconCouncilBudget, IconPolice, IconPlanning, IconCivilService, IconCourt, IconCrown, IconAudit,
  IconJustice, IconWater, IconPoll, IconAid, IconWheat, IconFlood, IconSignal,
} from "../components/newIcons";

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
      { key: "thisWeek", label: "What changed this week", icon: IconFeed, hint: "New votes, bills, money and petitions", essential: true, aka: ["news", "latest", "this week", "new", "updates", "what happened", "recent"] },
      { key: "answers", label: "Ask a question", icon: IconAsk, hint: "Why is housing so expensive?", essential: true, aka: ["why", "how", "explain", "question", "questions", "answers", "faq", "ask"] },
      { key: "howitworks", label: "How Parliament works", icon: IconFlow, hint: "From idea to law, step by step", essential: true, aka: ["parliament", "laws"] },
      { key: "devolved", label: "Scotland, Wales & N. Ireland", icon: IconDevolved, hint: "Who decides what where you live", aka: ["devolved administrations", "devolution"] },
      { key: "parties", label: "What parties promise", icon: IconManifesto, hint: "Manifesto positions side by side", aka: ["party policies", "manifesto"] },
      { key: "teacher", label: "Teacher mode", standalone: true, icon: IconClassroom, hint: "Animated lessons for a class", aka: ["teacher", "teachers", "school", "lesson", "classroom", "children", "kids", "pupils", "students", "education", "citizenship"] },
      { key: "funding", label: "Funding and independence", standalone: true, icon: IconLedger, hint: "Who pays for this site, and the rules that keep it fair", aka: ["funding", "who pays", "independence", "sponsors", "advertising", "neutral", "bias", "who runs this", "about us"] },
      { key: "glossary", label: "Jargon buster", icon: IconGlossary, hint: "Plain meanings of political words", essential: true, aka: ["glossary", "terms", "definitions"] },
      { key: "mediaLiteracy", label: "How news is regulated", icon: IconBook, hint: "Telling fact from opinion", aka: ["media literacy", "bbc", "impartiality"] },
      { key: "civilService", label: "The Civil Service", icon: IconCivilService, hint: "Who runs the departments", aka: ["civil servants", "special advisers", "whitehall", "permanent secretary"] },
      { key: "constitution", label: "Courts and the constitution", icon: IconCourt, hint: "Judges, laws and the rules behind them", aka: ["supreme court", "human rights act", "judges"] },
      { key: "monarchy", label: "The monarchy", icon: IconCrown, hint: "The King's role and the money", aka: ["king", "sovereign grant", "royal family", "crown estate"] },
      { key: "watchdogs", label: "Watchdogs and inquiries", icon: IconAudit, hint: "Auditors, forecasters and inquiries", aka: ["nao", "obr", "public inquiry", "national audit office"] },
      { key: "numbers", label: "Parliament in numbers", icon: IconChartBars, hint: "Who sits there, and who they are", essential: true, aka: ["statistics", "stats", "women", "lords", "mp backgrounds", "diversity", "private school", "women mps", "who mps are"] },
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
      { key: "myArea", label: "Your area", icon: IconPinHome, hint: "One postcode, everything local", essential: true, aka: ["my area", "postcode", "local", "near me", "where i live", "dashboard"] },
      { key: "constituency", label: "Your constituency", icon: IconHexMap, hint: "Your MP, seat and local results", essential: true, aka: ["constituency", "seat", "map", "election result"] },
      { key: "councils", label: "Your council", icon: IconCouncil, hint: "Councillors and local elections", essential: true, aka: ["councillors", "local elections", "council"] },
      { key: "councillors", label: "Your councillors", icon: IconCouncillor, hint: "Search every councillor in the UK", essential: true, aka: ["councillor", "cllr", "ward", "local councillor", "who is my councillor", "defected"] },
      { key: "marginals", label: "Marginal seats", icon: IconSwing, hint: "How close each seat was, and what could flip", aka: ["swing", "marginals", "majority", "safe seat", "target seats", "election"] },
      { key: "compareSeats", label: "Compare constituencies", icon: IconSeatCompare, hint: "Two seats side by side", aka: ["compare seats", "compare constituencies", "versus"] },
      { key: "compareCouncils", label: "Compare councils", icon: IconCompareAreas, hint: "Two areas side by side", essential: true, aka: ["compare areas", "compare places", "compare councils", "compare towns", "compare cities", "compare my area", "versus", "council tax", "who runs", "deprivation"] },
      { key: "partymatch", label: "Which party suits me?", icon: IconCompass, hint: "A short quiz", aka: ["find your party", "quiz"] },
      { key: "petitions", label: "Petitions", icon: IconPetition, hint: "Ask Parliament to act", essential: true },
      { key: "mayors", label: "Mayors and regional authorities", icon: IconMayor, hint: "England's elected regional leaders", aka: ["combined authorities", "metro mayors", "devolution"] },
      { key: "councilSpending", label: "Council budgets", icon: IconCouncilBudget, hint: "Where your council spends", aka: ["council spending", "section 114", "social care spending"] },
      { key: "policeCommissioners", label: "Police and crime commissioners", icon: IconPolice, hint: "Who answers for your police force", aka: ["pcc", "police commissioner"] },
      { key: "planning", label: "Planning and building", icon: IconPlanning, hint: "Who decides what gets built", aka: ["planning permission", "nimby", "planning committee"] },
    ],
  },
  {
    // Everything about elections in one place: the last general election's result, the votes in between, the next council elections, and
    // how to take part. How to vote and Local elections used to sit under "Your area & your say" and By-elections under "Who's in charge".
    key: "elections",
    label: "Elections",
    blurb: "Results, and how to take part",
    accent: "#7A5AF0",
    items: [
      { key: "generalElection", label: "General elections", icon: IconVote, hint: "Every result since 1945, and who governed", essential: true, aka: ["general election", "general elections", "election result", "election results", "past elections", "election history", "2024 election", "1997", "landslide", "first past the post", "fptp", "seats and votes", "results", "july 2024", "who won", "governments", "prime ministers", "manifesto promises", "kept promises", "history of governments", "thatcher", "blair", "attlee", "scottish parliament", "holyrood", "senedd", "stormont", "northern ireland assembly", "devolved elections", "compare elections", "swing", "how elections work", "hung parliament", "d'hondt", "your seat history"] },
      { key: "byElections", label: "By-elections", icon: IconByElection, hint: "Votes between general elections", essential: true, aka: ["elections", "by election", "bye election"] },
      { key: "localElections", label: "Local elections", icon: IconCalendar, hint: "When your council next votes", essential: true, aka: ["council elections", "next election", "polling day", "local vote", "election date", "councillors", "when do i vote"] },
      { key: "howtovote", label: "How to vote", icon: IconBallot, hint: "Register, ID and polling day", essential: true, aka: ["register to vote", "voting", "polling station", "photo id", "postal vote", "proxy vote", "election day", "ballot"] },
      { key: "myBallot", label: "Who is on my ballot", icon: IconWhoStands, hint: "The candidates standing where you live", essential: true, aka: ["candidates", "who is standing", "who can i vote for", "ballot paper", "my ballot", "by-election", "candidate list", "who is running", "postcode", "whocanivotefor"] },
      { key: "polling", label: "Opinion polls explained", icon: IconPoll, hint: "How polls work, and when they miss", aka: ["polls", "polling", "mrp", "voting intention"] },
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
      { key: "lordsVotes", label: "How peers vote", icon: IconLordsVote, hint: "Loyalty, rebels and defeats in the Lords", aka: ["lords votes", "peers voting", "lords divisions", "lords rebels", "content not content"] },
      { key: "committees", label: "Watchdog committees", icon: IconCommittee, hint: "MPs who question ministers", aka: ["select committees"] },
      { key: "tracker", label: "Promises tracker", icon: IconTracker, hint: "Has the government kept its word?", aka: ["manifesto promises"] },
    ],
  },
  {
    // Official statistics (from the Office for National Statistics) on how the
    // country is doing. Each page is built from the same template in
    // components/SectorPage.jsx, using the series in data/onsSectors.js.
    key: "country",
    label: "Britain in numbers",
    blurb: "Official statistics, in plain English",
    accent: "#0E9AA7",
    items: [
      { key: "economy", label: "The economy", icon: IconTrend, hint: "Growth, output and productivity", essential: true, aka: ["gdp", "growth", "recession", "productivity", "ons"] },
      { key: "prices", label: "Prices and bills", icon: IconBasket, hint: "Inflation, food, energy and rents", essential: true, aka: ["inflation", "cost of living", "cpi", "food prices", "energy bills"] },
      { key: "jobs", label: "Jobs and pay", icon: IconBriefcase, hint: "Unemployment, wages and vacancies", aka: ["unemployment", "wages", "earnings", "employment", "vacancies"] },
      { key: "inequality", label: "Inequality", icon: IconScales, hint: "Income, wealth and poverty, where, and against other countries", essential: true, aka: ["inequality", "gini", "gini coefficient", "regional inequality", "north south divide", "levelling up", "deprivation map", "oecd", "poverty", "wealth", "income inequality", "wealth inequality", "gini", "child poverty", "pay gap", "gender pay gap", "rich and poor", "wealth gap", "regional inequality", "north south divide", "cost of living", "living standards", "disposable income", "median income"] },
      { key: "brexit", label: "Brexit", icon: IconEuStars, hint: "Ten years on: economy, trade, people and the arguments", essential: true, aka: ["brexit", "eu", "european union", "leave", "remain", "referendum", "trade deal", "single market", "customs union", "windsor framework", "northern ireland protocol", "tca", "trade and cooperation agreement", "erasmus", "reset", "free movement", "fishing", "sovereignty"] },
      { key: "defence", label: "Defence", icon: IconDefence, hint: "Spending, the armed forces and the arguments", essential: true, aka: ["defence", "defense", "military", "army", "navy", "raf", "armed forces", "nato", "defence spending", "3.5%", "ukraine", "nuclear", "trident", "security", "war"] },
      { key: "education", label: "Education", icon: IconMortarboard, hint: "Schools, the attainment gap, special needs and university fees", essential: true, aka: ["education", "schools", "teachers", "gcse", "attainment", "send", "special educational needs", "ehcp", "free school meals", "university", "tuition fees", "student loans", "student finance", "pupil premium", "disadvantage gap"] },
      { key: "ageing", label: "Ageing and pensions", icon: IconPension, hint: "The State Pension, the triple lock, the pension age and the cost", essential: true, aka: ["pensions", "state pension", "triple lock", "pension age", "retirement", "ageing", "older people", "elderly", "pensioners", "old age", "dependency ratio", "national insurance"] },
      { key: "welfare", label: "Welfare and benefits", icon: IconCoin, hint: "What is spent, who gets it and what each pays", aka: ["welfare", "benefits", "universal credit", "pip", "disability benefits", "state pension rate", "pension credit", "carers allowance", "two child limit", "benefit cap", "dwp", "social security", "jobseekers allowance", "benefit fraud", "welfare bill"] },
      { key: "nhs", label: "The NHS", icon: IconPulse, hint: "Waiting times by region, A&E, staff, funding and how the UK compares", essential: true, aka: ["nhs", "waiting list", "waiting lists", "a&e", "ambulance", "cancer waiting", "hospital", "health service", "nhs funding", "doctors", "nurses", "18 weeks", "rtt", "gp", "healthcare"] },
      { key: "energy", label: "Net zero and energy bills", icon: IconBolt, hint: "Emissions, electricity, what bills are made of, and the arguments", essential: true, aka: ["energy", "net zero", "energy bills", "price cap", "ofgem", "electricity", "gas", "emissions", "carbon budget", "climate", "climate change", "renewables", "wind", "solar", "nuclear", "fuel poverty", "heat pump", "clean power", "decarbonisation", "greenhouse gas", "co2", "gas prices", "electricity prices"] },
      { key: "trust", label: "Trust in politics", icon: IconBallot, hint: "Trust in government, turnout, votes against seats, and the arguments", essential: true, aka: ["trust", "trust in government", "trust in politicians", "turnout", "voter turnout", "voting system", "proportional representation", "first past the post", "electoral reform", "political trust", "confidence in parliament", "disillusion", "politicians lie", "honesty", "apathy", "non voters"] },
      { key: "justice", label: "Courts, police and prisons", icon: IconJustice, hint: "Backlogs, officers and prisoners", aka: ["crown court backlog", "prisons", "police numbers"] },
      { key: "water", label: "Water and sewage", icon: IconWater, hint: "Spills, ratings and the new law", aka: ["sewage", "thames water", "storm overflows", "water companies"] },
      { key: "flooding", label: "Flooding and air quality", icon: IconFlood, hint: "Homes at risk, defences and the 2025 air results, with a postcode check", aka: ["flooding", "flood", "flood risk", "flood warnings", "air quality", "air pollution", "pm2.5", "nitrogen dioxide", "clean air", "environment agency"] },
      { key: "foreignPolicy", label: "The UK abroad", icon: IconAid, hint: "Overseas aid and treaties", aka: ["foreign aid", "overseas aid", "treaties", "oda"] },
      { key: "digital", label: "Digital and online safety", icon: IconSignal, hint: "Broadband, the Online Safety Act, children and social media, and AI", aka: ["online safety", "online safety act", "ofcom", "social media ban", "under 16", "broadband", "fibre", "gigabit", "ai", "artificial intelligence", "age checks", "internet", "tech"] },
      { key: "care", label: "Social care and childcare", icon: IconHeart, hint: "Care spending, carers and care workers, and funded childcare", essential: true, aka: ["social care", "adult social care", "care homes", "carers", "unpaid carers", "care workers", "home care", "childcare", "free childcare", "30 hours", "nursery", "early years", "funded hours", "childminders", "care costs", "dementia care", "care funding", "elderly care"] },
      { key: "transport", label: "Transport", icon: IconTransport, hint: "Roads and cars, trains, buses and where it differs", essential: true, aka: ["transport", "trains", "rail", "railways", "buses", "roads", "potholes", "cars", "electric cars", "ev", "road deaths", "road safety", "traffic", "fares", "great british railways", "network rail", "hs2", "bus franchising", "public transport", "commuting"] },
      { key: "union", label: "Devolution and the union", icon: IconSplit, hint: "Spending, taxes and output by nation and region, and who decides what", essential: true, aka: ["devolution", "union", "scottish independence", "independence", "barnett formula", "block grant", "regional inequality", "north south divide", "english devolution", "mayors", "combined authorities", "levelling up", "welsh", "stormont", "holyrood", "senedd", "border poll"] },
      { key: "publicFinances", label: "Public finances", icon: IconLedger, hint: "Borrowing, debt and public sector jobs", aka: ["national debt", "borrowing", "deficit", "public sector"] },
      { key: "population", label: "Population", icon: IconPopulation, hint: "How many of us there are", aka: ["census", "people", "growth", "demographics"] },
      { key: "health", label: "Health", icon: IconHeartbeat, hint: "NHS staff, sickness and deaths", aka: ["nhs", "deaths", "sickness", "healthcare"] },
      { key: "housing", label: "Housing", icon: IconHouse, hint: "House prices, rents and bills", essential: true, aka: ["rent", "renters", "house prices", "mortgage", "property", "energy"] },
      { key: "crime", label: "Crime", icon: IconShield, hint: "What the survey and police figures show", aka: ["police", "knife crime", "burglary", "violence", "theft", "fraud", "shoplifting"] },
      { key: "trade", label: "Trade", icon: IconGlobe, hint: "What we sell abroad and buy in", aka: ["exports", "imports", "trade deficit", "current account"] },
      { key: "business", label: "Business and industry", icon: IconFactory, hint: "Output by industry and online shopping", aka: ["industry", "manufacturing", "construction", "retail", "online shopping", "high street", "hospitality", "farming", "factories"] },
      { key: "farming", label: "Farming and food", icon: IconWheat, hint: "What farms produce, how farmers are paid and food prices", aka: ["farming", "farmers", "food", "agriculture", "farm subsidies", "sfi", "sustainable farming incentive", "food security", "food prices", "inheritance tax farms", "agricultural property relief", "defra"] },
      { key: "immigration", label: "Immigration", icon: IconMigration, hint: "Net migration, small boats and asylum", essential: true, aka: ["migration", "asylum", "small boats", "channel crossings", "visas", "refugees", "net migration", "deportation", "returns"] },
      { key: "taxRates", label: "Taxes", icon: IconTaxes, hint: "What is collected, every rate since 1945, and who set it", essential: true, aka: ["tax rates", "income tax rate", "vat rate", "basic rate", "top rate", "corporation tax rate", "business rates", "council tax", "fuel duty", "alcohol duty", "beer duty", "tobacco duty", "sin tax", "sugar tax", "stamp duty", "capital gains tax", "inheritance tax", "national insurance rate", "air passenger duty", "gambling tax", "landfill tax", "tax history", "who raised taxes", "tax cuts", "tax rises", "taxes and spending", "tax", "income tax", "vat", "national insurance", "corporation tax", "public spending", "welfare", "benefits", "debt interest", "where taxes go", "how much tax", "tax receipts"] },
      { key: "calculators", label: "Money calculators", icon: IconCalculator, hint: "Take-home pay and stamp duty", essential: true, aka: ["calculator", "take home pay", "salary", "after tax", "net pay", "stamp duty", "sdlt", "house buying", "first time buyer", "second home", "buy to let", "wage", "payslip"] },
      { key: "rates", label: "Interest rates", icon: IconRates, hint: "Mortgages, savings and the pound", essential: true, aka: ["bank rate", "mortgage", "mortgages", "savings", "exchange rate", "pound", "dollar", "gilt", "base rate"] },
      { key: "environment", label: "Energy and environment", icon: IconLeaf, hint: "Emissions and energy use", aka: ["climate", "emissions", "net zero", "carbon", "energy"] },
      { key: "deprivation", label: "Deprivation", icon: IconDeprivation, hint: "The most and least deprived areas, in four nations", essential: true, aka: ["poverty", "poor", "imd", "index of multiple deprivation", "deprived", "wealthy", "rich", "left behind", "levelling up", "council"] },
      { key: "regions", label: "Regions and nations", icon: IconMap, hint: "Maps of prices, jobs and more", essential: true, aka: ["map", "regional", "north south divide", "levelling up", "london", "scotland", "wales", "northern ireland", "region"] },
      { key: "indicators", label: "Compare over time", icon: IconCompareTime, hint: "Pick measures and watch them move", essential: true, aka: ["timeline", "history", "compare", "trends", "over time"] },
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
      { key: "govContracts", label: "Government contracts", icon: IconContract, hint: "Who wins public money, and how", aka: ["procurement", "ppe", "tenders", "vip lane"] },
      { key: "honours", label: "Peerages and honours", icon: IconPeerage, hint: "Who ends up in the Lords", aka: ["peers", "lords appointments", "cash for honours", "holac"] },
      { key: "electionSpending", label: "Election spending", icon: IconElectionSpend, hint: "What campaigns may spend", aka: ["campaign spending", "spending limits", "election expenses"] },
      { key: "foreignInfluence", label: "Foreign influence", icon: IconForeignAgent, hint: "The register of foreign agents", aka: ["firs", "foreign agents", "foreign influence registration scheme"] },
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
  accessibility: "About this site",
  whatsnew: "About this site",
  teacher: "For teachers",
  funding: "About this site",
};
// The section names those pages go under, without repeats (used to keep the Welsh in step).
export const OUTSIDE_SECTIONS_LIST = [...new Set(Object.values(OUTSIDE_SECTIONS))];
// Pages that sit outside every group still get a colour of their own, so none of them is plain navy.
export const OUTSIDE_ACCENT = {
  methodology: "#0E9AA7", settings: "#7A5AF0", privacy: "#1FA97C", terms: "#C9962A", accessibility: "#1E4FB8", whatsnew: "#E8741A", funding: "#2A9D8F", watchlist: "#E0367A", myMP: "#2F80ED",
  // The Britain in numbers pages each get their own colour (the data pages already do, from onsSectors.js), so the section is not one long run of teal.
  inequality: "#A66BBE", brexit: "#3D5AFE", defence: "#4C6FA6", education: "#E07A1F", ageing: "#B5651D", nhs: "#1FA97C", energy: "#3F9B3F",
  trust: "#7B5BD6", care: "#D4577A", transport: "#2C7DA0", union: "#D9453B", taxRates: "#2E86C1", publicFinances: "#2F9E6E",
};
export const SECTION_LABEL_BY_KEY = new Map([
  ...SECTIONS.flatMap((section) => section.items.map((item) => [item.key, section.label])),
  ...Object.entries(OUTSIDE_SECTIONS),
]);

// Pages that belong together are shown as ONE entry in the menus, with a strip of tabs across the top of each of them to move between the pages in
// the group. Every page keeps its own address and its own name in search, so nothing is lost: only the menus get shorter. The first page in a
// group is the one the menu entry opens. All the pages of a group sit in the same menu section.
export const HUBS = [
  { key: "ministers", label: "Ministers and their jobs", hint: "The Cabinet, and every past post", pages: [["cabinet", "Cabinet now"], ["offices", "Who held which job"]] },
  { key: "lords", label: "The House of Lords", hint: "The peers, and how they vote", pages: [["lords", "The peers"], ["lordsVotes", "How peers vote"]] },
  { key: "mpvotes", label: "How MPs vote", hint: "Every vote, and who breaks ranks", pages: [["voting", "How MPs voted"], ["rebels", "MPs who defy their party"]] },
  { key: "mpcompare", label: "Compare MPs", hint: "Side by side, and in league tables", pages: [["compare", "Compare MPs"], ["rankings", "League tables"]] },
  { key: "questions", label: "Questions to ministers", hint: "What MPs ask ministers", pages: [["writtenQuestions", "Questions to ministers"], ["topics", "Who's asking about a topic"]] },
  { key: "funders", label: "Who funds politics", hint: "Donors to MPs and parties", pages: [["donors", "Who funds MPs"], ["partyFinances", "Who funds the parties"], ["followTheMoney", "Trace a donor"]] },
  { key: "hidden", label: "What's hidden", hint: "Where the public records run out", pages: [["darkMoney", "Hidden donations"], ["revolvingDoor", "Ministers' later jobs"], ["lobbyingRegister", "Paid lobbyists"], ["thinkTanks", "Think tank funding"]] },
  { key: "publicmoney", label: "Contracts, honours and spending", hint: "Public contracts, peerages, campaign spending and foreign influence", pages: [["govContracts", "Government contracts"], ["honours", "Peerages"], ["electionSpending", "Election spending"], ["foreignInfluence", "Foreign influence"]] },
  { key: "results", label: "Election results", hint: "General, by- and local elections", pages: [["generalElection", "General elections"], ["byElections", "By-elections"], ["localElections", "Local elections"], ["polling", "Polls explained"]] },
  { key: "yourvote", label: "Your vote", hint: "How to vote, and who is on your ballot", pages: [["howtovote", "How to vote"], ["myBallot", "Who is on my ballot"]] },
  { key: "seat", label: "Your constituency", hint: "Your seat, and close contests", pages: [["constituency", "Your constituency"], ["marginals", "Marginal seats"], ["compareSeats", "Compare seats"]] },
  { key: "council", label: "Your council", hint: "Who runs it, your councillors, and how it compares", pages: [["councils", "Your council"], ["councillors", "Your councillors"], ["compareCouncils", "Compare councils"], ["councilSpending", "Budgets"]] },
  { key: "localpower", label: "Local power", hint: "Mayors, police commissioners and planning", pages: [["mayors", "Mayors"], ["policeCommissioners", "Police commissioners"], ["planning", "Planning"]] },
  { key: "state", label: "How the state works", hint: "The Civil Service, the courts, the Crown and the watchdogs", pages: [["civilService", "Civil Service"], ["constitution", "Courts"], ["monarchy", "Monarchy"], ["watchdogs", "Watchdogs"]] },
  { key: "past", label: "History", hint: "Landmark votes and every government", pages: [["history", "Landmark votes"], ["timeline", "Every government"], ["formerMps", "Recent departures"]] },
  { key: "economy", label: "The economy", hint: "Growth, jobs, public money and trade", pages: [["economy", "The economy"], ["jobs", "Jobs and pay"], ["publicFinances", "Public finances"], ["trade", "Trade"], ["business", "Business"]] },
  { key: "living", label: "Cost of living", hint: "Prices, homes, taxes and bills", pages: [["prices", "Prices and bills"], ["housing", "Housing"], ["rates", "Interest rates"], ["taxRates", "Taxes"], ["calculators", "Calculators"], ["energy", "Energy bills"], ["farming", "Farming and food"]] },
  { key: "care", label: "Health and care", hint: "The NHS, care, pensions and ageing", pages: [["nhs", "The NHS"], ["health", "Health"], ["care", "Social care"], ["ageing", "Ageing and pensions"], ["welfare", "Welfare and benefits"]] },
  { key: "services", label: "Public services", hint: "Schools, defence, transport and crime", pages: [["education", "Education"], ["defence", "Defence"], ["transport", "Transport"], ["crime", "Crime"], ["justice", "Courts and prisons"], ["digital", "Digital and online safety"]] },
  { key: "society", label: "People and places", hint: "Population, migration, inequality", pages: [["population", "Population"], ["immigration", "Immigration"], ["inequality", "Inequality"], ["deprivation", "Deprivation"], ["regions", "Regions and nations"]] },
  { key: "questions2", label: "The big questions", hint: "Brexit, the union, trust and the environment", pages: [["brexit", "Brexit"], ["union", "The union"], ["trust", "Trust in politics"], ["environment", "Environment"], ["water", "Water"], ["flooding", "Flooding and air quality"], ["foreignPolicy", "The UK abroad"]] },
];

export const HUB_BY_PAGE = new Map(HUBS.flatMap((h) => h.pages.map(([key], i) => [key, { ...h, at: i }])));
// The page a group's menu entry opens: for a page in a group, the group's first page; for any other page, itself.
export const hubLead = (key) => HUB_BY_PAGE.get(key)?.pages[0][0] ?? key;

// A menu section's pages with each group shown once: the first page stands for the group, under the group's name.
export function collapseItems(items) {
  const out = [];
  for (const item of items) {
    const hub = HUB_BY_PAGE.get(item.key);
    if (!hub) { out.push(item); continue; }
    if (hub.at !== 0) continue;
    const members = hub.pages.map(([k]) => items.find((i) => i.key === k)).filter(Boolean);
    out.push({ ...item, label: hub.label, hint: hub.hint, hub: hub.key, essential: members.some((m) => m.essential) || undefined });
  }
  // The groups are listed in the order written in HUBS, in the places the groups already held; other pages stay where they were.
  const slots = out.flatMap((i, n) => (i.hub ? [n] : []));
  const sorted = slots.map((n) => out[n]).sort((a, b) => HUBS.findIndex((h) => h.key === a.hub) - HUBS.findIndex((h) => h.key === b.hub));
  slots.forEach((n, k) => { out[n] = sorted[k]; });
  return out;
}

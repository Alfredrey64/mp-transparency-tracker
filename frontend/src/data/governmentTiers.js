// The tiers of government in the UK, for the "Who does what?" diagram on the
// How Parliament Works page. Plain-English, and deliberately approximate where
// the real picture is messy (the number of councils shifts as areas are
// reorganised, so those are "around" figures).
//
// `here` says, per nation, whether the tier exists where you live and, if it
// does, a short note on what it looks like there. A tier with no entry for a
// nation doesn't exist there.

export const NATIONS = [
  { key: "england", label: "England" },
  { key: "scotland", label: "Scotland" },
  { key: "wales", label: "Wales" },
  { key: "ni", label: "Northern Ireland" },
];

export const TIERS = [
  {
    key: "parliament",
    name: "UK Parliament",
    keywords: "Makes laws, sets taxes, questions ministers",
    short: "Makes the laws and checks the government",
    figure: { value: "650 + ~800", label: "MPs and peers" },
    color: "#4F46E5",
    chosen: "You vote for one MP in your constituency, at least every five years. Peers are appointed, not elected.",
    does: [
      "Debates and passes laws for the whole UK, and for England alone on the things nobody else decides.",
      "Votes on taxes and approves what the government plans to spend.",
      "Questions ministers and investigates them through committees.",
      "Can force a government out by withdrawing the Commons' support.",
    ],
    here: {
      england: "Decides almost everything that affects you, from the NHS to schools.",
      scotland: "Still decides defence, foreign policy, immigration and most tax and benefits. Holyrood handles much else.",
      wales: "Still decides tax rules, benefits, defence and policing. The Senedd handles much else.",
      ni: "Still decides tax rules, defence and foreign policy. The Assembly handles much else.",
    },
    links: [
      { label: "Who sits in Parliament", href: "#/numbers" },
      { label: "How MPs voted", href: "#/voting" },
      { label: "Watchdog committees", href: "#/committees" },
    ],
  },
  {
    key: "government",
    name: "UK Government",
    keywords: "Runs departments, writes rules, spends money",
    short: "Runs the country day to day",
    figure: { value: "~120", label: "ministers" },
    color: "#B5533C",
    chosen: "Nobody votes for it directly. The Prime Minister is whoever can command a majority in the Commons, and picks the ministers.",
    does: [
      "Ministers run departments such as Health, Treasury and Defence.",
      "Civil servants, who don't change with the government, do the detailed work.",
      "Proposes most new laws and turns passed laws into rules and services.",
      "Collects taxes and decides how the money is shared out, including to the other tiers.",
    ],
    here: {
      england: "Runs the NHS, schools and most public services directly or through councils.",
      scotland: "Runs reserved matters only: defence, foreign affairs, most benefits and the economy's big levers.",
      wales: "Runs reserved matters only: defence, foreign affairs, most benefits and the economy's big levers.",
      ni: "Runs reserved matters only: defence, foreign affairs, tax and the economy's big levers.",
    },
    links: [
      { label: "Cabinet ministers", href: "#/cabinet" },
      { label: "Who ministers meet", href: "#/ministerialMeetings" },
      { label: "Where taxes go", href: "#/budget" },
    ],
  },
  {
    key: "devolved",
    name: "Devolved governments",
    keywords: "Health, schools, housing, transport",
    short: "Scotland, Wales and Northern Ireland run their own affairs",
    figure: { value: "315", label: "MSPs, MSs and MLAs" },
    figureHere: {
      scotland: { value: "129", label: "MSPs" },
      wales: { value: "96", label: "Members of the Senedd" },
      ni: { value: "90", label: "MLAs" },
    },
    color: "#2F6F4E",
    chosen: "Elected by voters in each nation every five years: 129 MSPs in Scotland, 96 Members of the Senedd in Wales, 90 MLAs in Northern Ireland.",
    does: [
      "Make their own laws on health, education, housing, transport and much more.",
      "Each has its own government, led by a First Minister, that runs those services.",
      "Get most of their money as a grant from the UK Government, and can raise some taxes themselves.",
      "Were created by Acts of the UK Parliament, which could in principle change them.",
    ],
    here: {
      scotland: "The Scottish Parliament (Holyrood) and Scottish Government.",
      wales: "The Senedd and Welsh Government.",
      ni: "The Northern Ireland Assembly and Executive, which share power between the main communities.",
    },
    links: [{ label: "Scotland, Wales & N. Ireland", href: "#/devolved" }],
    absentNote: "England has no government of its own. The UK Parliament and Government make England's decisions on these matters too.",
  },
  {
    key: "combined",
    name: "Mayors and combined authorities",
    slabName: "Regional mayors",
    keywords: "Buses and trams, skills, housing plans",
    short: "Big city regions in England with a shared mayor",
    figure: { value: "~12", label: "mayors outside London" },
    color: "#8A5A9E",
    chosen: "A directly elected mayor, chosen by voters across the whole region, usually every four years.",
    does: [
      "Plan transport, buses and trams across several councils at once.",
      "Often take on adult skills, regeneration and some housing money.",
      "Get their powers and funding through 'devolution deals' agreed with the UK Government.",
      "London has its own version: the Mayor of London and the London Assembly.",
    ],
    here: {
      england: "Covers parts of England only, such as Greater Manchester, West Yorkshire and the West Midlands. Many areas have none.",
    },
    links: [{ label: "Your council", href: "#/councils" }],
    absentNote: "There are no regional mayors here. Their jobs are done by the devolved government and the councils.",
  },
  {
    key: "council",
    name: "Local councils",
    keywords: "Bins, planning, social care, roads",
    short: "Deliver the services on your doorstep",
    figure: { value: "~370", label: "councils across the UK" },
    figureHere: {
      england: { value: "~300", label: "councils in England" },
      scotland: { value: "32", label: "councils" },
      wales: { value: "22", label: "councils" },
      ni: { value: "11", label: "councils" },
    },
    color: "#C28A1E",
    chosen: "You elect councillors for your ward, normally every four years. Some areas elect only a third of their councillors at a time.",
    does: [
      "Collect bins, maintain most roads, run libraries, parks and leisure centres.",
      "Decide planning applications, such as extensions and new housing.",
      "Provide social care, children's services, and help for people who are homeless.",
      "Set council tax, which pays for part of all this. The rest comes from the government.",
    ],
    here: {
      england: "Either one council does everything (a unitary), or two share it: a county for roads and social care, a district for bins and planning.",
      scotland: "32 councils, each doing everything in its area.",
      wales: "22 councils, each doing everything in its area.",
      ni: "11 councils. They do far less: bins, leisure and planning, but not schools or social care.",
    },
    links: [
      { label: "Your council", href: "#/councils" },
      { label: "Your constituency", href: "#/constituency" },
    ],
  },
  {
    key: "parish",
    name: "Parish and town councils",
    keywords: "Parks, village halls, allotments",
    short: "The smallest tier, for a village or a town",
    figure: { value: "~10,000", label: "in England" },
    figureHere: {
      scotland: { value: "~1,200", label: "community councils" },
      wales: { value: "~700", label: "community and town councils" },
    },
    color: "#5A8A8A",
    chosen: "You elect parish councillors, often unopposed, and anyone can stand. They are mostly unpaid.",
    does: [
      "Look after allotments, village halls, play areas, benches and local events.",
      "Are asked their view on planning applications nearby, though the district or unitary council decides.",
      "Raise a small charge, the precept, which appears on your council tax bill.",
    ],
    here: {
      england: "About a third of the population lives in a parish. Towns and villages choose to have one.",
      scotland: "Community councils exist, but they are advisory with no real powers or budget.",
      wales: "Community and town councils do this job.",
    },
    links: [],
    absentNote: "Northern Ireland has no parish tier. Its 11 councils cover everything local.",
  },
];

// The voter, at the bottom of the diagram.
export const YOU = {
  name: "You, the voter",
  short: "Every tier answers to you at the ballot box",
  figure: { value: "~48m", label: "registered voters" },
  does: [
    "Elect your MP, your councillors and, depending on where you live, a mayor, devolved members and parish councillors.",
    "Between elections you can write to your MP, back a petition, comment on a planning application or go to a council meeting.",
    "You can stand for office yourself. Most parish councils are glad of new faces.",
  ],
  links: [
    { label: "Your constituency", href: "#/constituency" },
    { label: "Your council", href: "#/councils" },
    { label: "Petitions", href: "#/petitions" },
  ],
};

// Between one tier and the next: what passes down and what flows back up.
export const CONNECTORS = [
  "The government stays in power only while the Commons backs it, and answers its questions",
  "The government hands down a yearly grant, and Parliament decides which powers are devolved",
  "Devolution deals give city regions powers and money from the government",
  "Councils work with the mayor, and take rules and grants from above",
  "Councils collect the parish charge with council tax, and ask parishes for views on planning",
];

export const VOTE_FOR = {
  england: "your MP, your councillors, your parish councillors if you have a parish, and a regional mayor in some areas",
  scotland: "your MP, your MSPs at Holyrood, and your councillors",
  wales: "your MP, your Members of the Senedd, and your councillors",
  ni: "your MP, your MLAs at the Assembly, and your councillors",
};

export const CHECKS = [
  { name: "The courts", what: "Can rule that a government, council or minister broke the law." },
  { name: "National Audit Office", what: "Checks that government money was spent as Parliament intended." },
  { name: "Ombudsmen", what: "Investigate complaints when a public body treated you badly." },
  { name: "Electoral Commission", what: "Oversees elections and who funds political parties." },
  { name: "Auditors and regulators", what: "Inspect councils, schools, hospitals and care homes." },
  { name: "The press and public", what: "Publish what they find, and you can ask for records under Freedom of Information." },
];

// "I've got a problem with…" — where to start. `england` is the default
// answer; `elsewhere` applies in Scotland, Wales and Northern Ireland where
// it differs.
export const WHO_TO_CONTACT = [
  { issue: "Missed bin collections, potholes, fly-tipping", england: "Your council", tier: "council" },
  {
    issue: "A planning application near you",
    england: "Your council. You can also tell your parish council.",
    scotland: "Your council. You can also tell your community council.",
    wales: "Your council. You can also tell your community council.",
    ni: "Your council",
    tier: "council",
  },
  {
    issue: "A bench, play area or allotment in your village",
    england: "Your parish or town council",
    scotland: "Your community council, if you have one. Otherwise your council.",
    wales: "Your community or town council",
    ni: "Your council",
    tier: "parish",
  },
  {
    issue: "Bus services and trams across a city region",
    england: "Your regional mayor, if you have one. Otherwise your council.",
    elsewhere: "Your council, or your devolved government for national services",
    tier: "combined",
  },
  { issue: "Hospitals and waiting times", england: "Your MP", elsewhere: "Your MSP, MS or MLA", tier: "government" },
  { issue: "Schools and exams", england: "Your council for places, your MP for the national rules", elsewhere: "Your MSP, MS or MLA", tier: "government" },
  { issue: "Benefits, tax and immigration", england: "Your MP", tier: "parliament" },
  { issue: "A law you want changed", england: "Your MP, or start a petition", tier: "parliament" },
];

export function contactAnswer(row, nation) {
  if (nation === "england") return row.england;
  return row[nation] ?? row.elsewhere ?? row.england;
}

// "See it in action": three simplified walk-throughs of power cascading down
// the tiers. Each step lights up one tier (or "you"), in order from the top.
// A step with `nations` only applies in those nations; a step for a tier that
// doesn't exist where you live is skipped. Every walk-through ends with you
// getting the result, then voting.
export const SCENARIOS = [
  {
    key: "law",
    label: "A new law",
    blurb: "How a law passed in Westminster ends up on your street",
    steps: [
      { tier: "parliament", token: "The Act", title: "Parliament passes the law", text: "MPs vote on it at each stage and peers check the detail. Once it has Royal Assent it is an Act, and every tier below has to work within it." },
      { tier: "government", token: "The rules", title: "Ministers turn it into rules and money", text: "The department writes the detailed regulations and sets funding aside. Civil servants do most of the work." },
      { tier: "devolved", token: "The local version", title: "Devolved governments apply it", text: "If the law touches something devolved, such as health or education, the Scottish, Welsh or Northern Ireland government decides how it works there and pays for it from its own budget." },
      { tier: "combined", token: "The regional plan", title: "A regional mayor plans across councils", text: "Where there is a mayor, they join up transport, skills and housing across a whole city region." },
      { tier: "council", token: "The service", title: "Your council delivers it", text: "Councils hire the staff, sign the contracts and decide who gets what, and where. This is the tier you actually meet." },
      { tier: "parish", token: "The local detail", title: "Your parish council adds the local detail", text: "It can't change the rules, but it can tell the council what your village needs and run small projects of its own." },
      { tier: "you", token: "The result", title: "You feel the difference", text: "A law passed in Westminster turns into a bin collection, a school place or a bus route." },
      { tier: "vote", title: "Then you get your say", text: "If it isn't working, you can vote out your councillors, mayor, MP or devolved government when their next election comes round." },
    ],
  },
  {
    key: "money",
    label: "Where the money goes",
    blurb: "How a pound of tax reaches local services",
    steps: [
      { tier: "parliament", token: "The Budget", title: "Parliament approves taxes and spending", text: "The Chancellor proposes taxes in the Budget and MPs vote on them. Nothing can be spent without Parliament's approval." },
      { tier: "government", token: "Grants", title: "The Treasury shares it out", text: "The government keeps some for national services such as defence and benefits, and sends the rest down as grants." },
      { tier: "devolved", token: "Block grant", title: "Devolved governments get a block grant", text: "Scotland, Wales and Northern Ireland each receive a lump sum and choose how to spend it, on top of any taxes they raise themselves." },
      { tier: "combined", token: "Deal funding", title: "Mayors get money through devolution deals", text: "City regions receive funding for transport and skills, agreed in a deal with the government." },
      { tier: "council", token: "Council budget", title: "Councils add your council tax", text: "Your council combines government grants, business rates and your council tax, then pays for care, bins, roads and more." },
      { tier: "parish", token: "The precept", title: "Parishes add a small charge", text: "The parish precept appears on your council tax bill and pays for local benches, halls and play areas." },
      { tier: "you", token: "Your bill", title: "You pay in, and you get services back", text: "You pay income tax, VAT and council tax, and see the money again as hospitals, schools and clean streets." },
      { tier: "vote", title: "Then you get your say", text: "How the money is spent is a choice. Parties set out their plans before each election and you decide which to back." },
    ],
  },
  {
    key: "estate",
    label: "A new housing estate",
    blurb: "Who decides when homes are proposed near you",
    steps: [
      { tier: "parliament", nations: ["england"], token: "Planning law", title: "Parliament writes the planning law", text: "Acts of Parliament set the basic rules in England for what can be built and who gets to decide." },
      { tier: "government", nations: ["england"], token: "National policy", title: "Ministers set national planning policy", text: "The government publishes the national rules councils must follow, including targets for how many homes are needed." },
      { tier: "devolved", token: "Planning policy", title: "The devolved government sets planning policy", text: "Planning is devolved, so the Scottish, Welsh or Northern Ireland government writes the rules for its own nation." },
      { tier: "combined", token: "Regional plan", title: "A regional mayor can set a plan for the area", text: "Some mayors draw up a strategy showing where homes and transport links should go across several councils." },
      { tier: "council", token: "The decision", title: "Your council decides the application", text: "Councillors on the planning committee weigh up the plans and local objections, and approve or refuse. Their decision can be appealed." },
      { tier: "parish", nations: ["england", "scotland", "wales"], token: "Local views", title: "Your parish council gives its view", text: "It is asked for an opinion on nearby applications. It doesn't decide, but councils have to take the view into account." },
      { tier: "you", token: "Your say", title: "You can have your say too", text: "Anyone can comment on an application and councils must consider what residents say before deciding." },
      { tier: "vote", title: "Then you get your say again", text: "Councillors are elected, so planning decisions are one of the things voters can judge them on at the next local election." },
    ],
  },
];

// The steps that apply where you live, in order.
export function scenarioSteps(scenario, nation) {
  const tierExists = (key) => TIERS.find((t) => t.key === key)?.here[nation] !== undefined;
  return scenario.steps.filter((s) => {
    if (s.tier === "you" || s.tier === "vote") return true;
    if (s.nations && !s.nations.includes(nation)) return false;
    return tierExists(s.tier);
  });
}

// The tiers that exist where you live, top to bottom, ending with the voter.
export function visibleTierKeys(nation) {
  return [...TIERS.filter((t) => t.here[nation] !== undefined).map((t) => t.key), "you"];
}

// How two neighbouring tiers connect. Tiers that don't exist in a nation are
// left out of the diagram, so what sits above or below a tier can change.
const LINKS = {
  "parliament>government": CONNECTORS[0],
  "government>devolved": CONNECTORS[1],
  "government>combined": CONNECTORS[2],
  "devolved>combined": CONNECTORS[2],
  "government>council": "The government hands down grants and sets the rules councils work to",
  "devolved>council": "The devolved government funds councils and sets what they are responsible for",
  "combined>council": CONNECTORS[3],
  "council>parish": CONNECTORS[4],
};
export function linkBetween(upper, lower) {
  return LINKS[`${upper}>${lower}`] ?? null;
}

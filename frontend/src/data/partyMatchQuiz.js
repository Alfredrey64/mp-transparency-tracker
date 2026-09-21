// Data behind the "Find Your Party" quiz.
//
// How this works, in plain terms: each statement below is scored -2 to +2
// for how closely each party's actual 2024 manifesto commitments (and,
// where a manifesto was silent, their clearly and consistently stated
// public position since) align with it — the same scale a user's own
// answer is recorded on. A user's match score with a party is how close
// their answers sit to that party's positions across all statements,
// weighted double for whichever issues the user marked as mattering most
// to them.
//
// This is inevitably a simplification — a single number can't fully
// capture a party's position on a complex issue, and manifestos get
// reinterpreted or partly abandoned in office. Scores here are our own,
// independent, good-faith reading of publicly available material (mainly
// each party's 2024 general election manifesto — see the Party Policies
// tab for fuller summaries of those), not an official or endorsed rating
// by any party. Treat the result as a conversation-starter, not a verdict.
//
// Deliberately scoped to the parties with a comparable UK-wide or
// devolved-nation policy platform to score against — Northern Ireland's
// parties campaign on a fundamentally different axis (the constitutional
// question) that a shared left-right/issue-position scale doesn't fit,
// so they're left out rather than force-fitted.
//
// Party `key`s match `frontend/src/data/partyManifestos.js` exactly, so a
// result can link straight through to that party's fuller manifesto page.

export const QUIZ_PARTIES = [
  { key: "labour", name: "Labour", color: "#C8102E" },
  { key: "conservative", name: "Conservative", color: "#0087DC" },
  { key: "liberal-democrat", name: "Liberal Democrats", color: "#FAA61A" },
  { key: "reform-uk", name: "Reform UK", color: "#12B6CF" },
  { key: "green", name: "Green Party", color: "#6AB023" },
  { key: "snp", name: "SNP", color: "#B8960C" },
  { key: "plaid-cymru", name: "Plaid Cymru", color: "#005B54" },
];

// A user picks up to 5 of these as "matters most to me" — the matching
// question(s) then count double toward their result.
export const ISSUES = [
  { key: "economy", label: "Economy & Tax" },
  { key: "nhs", label: "NHS & Health" },
  { key: "immigration", label: "Immigration" },
  { key: "climate", label: "Climate & Environment" },
  { key: "housing", label: "Housing" },
  { key: "europe", label: "Europe & Brexit" },
  { key: "crime", label: "Crime & Justice" },
  { key: "education", label: "Education" },
  { key: "welfare", label: "Welfare & Benefits" },
  { key: "voting", label: "Voting Reform" },
  { key: "devolution", label: "Devolution" },
  { key: "defence", label: "Defence" },
  { key: "ownership", label: "Public Ownership" },
  { key: "aid", label: "Foreign Aid" },
  { key: "workers", label: "Workers' Rights" },
  { key: "asylum", label: "Asylum & Borders" },
];

// positions: -2 strongly disagree ... +2 strongly agree, on the statement
// as written — from each party's perspective.
export const QUESTIONS = [
  {
    id: "tax",
    issue: "economy",
    statement: "The government should raise taxes on the highest earners to fund public services.",
    explainer: "Income tax is the single biggest source of government revenue. \"Highest earners\" usually means the top additional-rate band (income over £125,140) — where exactly that line should sit is itself a political choice, not a fixed definition.",
    positions: { labour: 1, conservative: -2, "liberal-democrat": 1, "reform-uk": -2, green: 2, snp: 1, "plaid-cymru": 1 },
  },
  {
    id: "nhs",
    issue: "nhs",
    statement: "The NHS should stay fully publicly funded, with no expansion of private-sector involvement.",
    explainer: "A share of NHS treatment is already delivered by private providers under NHS contracts, mainly to cut waiting lists. This question is about whether that share should grow, shrink, or stay as it is — not about introducing charges for patients.",
    positions: { labour: 1, conservative: 0, "liberal-democrat": 1, "reform-uk": -1, green: 2, snp: 2, "plaid-cymru": 2 },
  },
  {
    id: "immigration",
    issue: "immigration",
    statement: "Net migration to the UK should be significantly reduced.",
    explainer: "\"Net migration\" is people arriving minus people leaving, and covers work, study and family visas — not just asylum, which is a separate question below. It peaked at around 900,000 a year before falling sharply; this is about the overall visa system.",
    positions: { labour: 1, conservative: 2, "liberal-democrat": -1, "reform-uk": 2, green: -2, snp: -1, "plaid-cymru": -1 },
  },
  {
    id: "climate",
    issue: "climate",
    statement: "The UK should speed up its transition to net zero, even if it means higher costs in the short term.",
    explainer: "\"Net zero\" is the UK's legal target to cut greenhouse gas emissions to (near) zero by 2050. Speeding it up usually means faster rollout of renewables, home insulation and electric vehicles — often at a higher upfront cost to consumers or taxpayers.",
    positions: { labour: 1, conservative: -1, "liberal-democrat": 1, "reform-uk": -2, green: 2, snp: 1, "plaid-cymru": 1 },
  },
  {
    id: "housing",
    issue: "housing",
    statement: "The target for new homes built each year should rise sharply, including on green belt land if needed.",
    explainer: "England has consistently built fewer homes than the roughly 300,000-a-year target most economists say is needed. \"Green belt\" is protected countryside ringing cities like London — building on it is one of the most contested ways to hit housing targets.",
    positions: { labour: 2, conservative: 0, "liberal-democrat": 1, "reform-uk": 0, green: -1, snp: 1, "plaid-cymru": 0 },
  },
  {
    id: "europe",
    issue: "europe",
    statement: "The UK should seek to rejoin the EU single market.",
    explainer: "The UK left the EU single market and customs union in January 2021. Rejoining the single market alone (short of full EU membership) would mean accepting EU trade rules and free movement of people, in exchange for tariff-free trade in goods.",
    positions: { labour: -1, conservative: -2, "liberal-democrat": 2, "reform-uk": -2, green: 2, snp: 2, "plaid-cymru": 1 },
  },
  {
    id: "sentencing",
    issue: "crime",
    statement: "Prison sentences for serious violent crime should be made significantly longer.",
    explainer: "Under current rules, most offenders serve up to two-thirds of their sentence before automatic release. Longer sentencing is often proposed alongside — or as an alternative to — spending more on policing, prevention or prison capacity itself.",
    positions: { labour: 0, conservative: 2, "liberal-democrat": -1, "reform-uk": 2, green: -1, snp: -1, "plaid-cymru": -1 },
  },
  {
    id: "tuition",
    issue: "education",
    statement: "University tuition fees in England should be abolished.",
    explainer: "English tuition fees are currently £9,250 a year, covered upfront by government-backed loans that graduates repay once they earn above a threshold. Scotland, by contrast, charges its own resident students no fees at all.",
    positions: { labour: -1, conservative: -2, "liberal-democrat": 1, "reform-uk": -1, green: 2, snp: 2, "plaid-cymru": 1 },
  },
  {
    id: "welfare",
    issue: "welfare",
    statement: "Welfare and disability benefit spending should be reduced to encourage more people into work.",
    explainer: "Welfare, including disability and unemployment benefits, is one of the largest areas of government spending after health and pensions. \"Reducing spending to encourage work\" usually means tighter eligibility rules or stricter sanctions for claimants judged fit to work.",
    positions: { labour: 0, conservative: 2, "liberal-democrat": -1, "reform-uk": 1, green: -2, snp: -1, "plaid-cymru": -1 },
  },
  {
    id: "pr",
    issue: "voting",
    statement: "Westminster elections should switch from First Past the Post to a proportional system.",
    explainer: "First Past the Post elects one MP per constituency by simple plurality, which can turn a minority of the national vote into a large majority of seats. Proportional systems allocate seats closer to each party's vote share, but tend to produce more coalition governments.",
    positions: { labour: -1, conservative: -2, "liberal-democrat": 2, "reform-uk": 2, green: 2, snp: 1, "plaid-cymru": 1 },
  },
  {
    id: "devolution",
    issue: "devolution",
    statement: "More powers should be devolved from Westminster to Scotland, Wales, and Northern Ireland.",
    explainer: "Scotland, Wales and Northern Ireland already have their own parliaments or assemblies with varying control over health, education and (partially) tax. \"More devolution\" usually means transferring further powers — such as welfare or justice — away from Westminster.",
    positions: { labour: 0, conservative: -1, "liberal-democrat": 1, "reform-uk": -1, green: 1, snp: 2, "plaid-cymru": 2 },
  },
  {
    id: "defence",
    issue: "defence",
    statement: "UK defence spending should be increased significantly.",
    explainer: "UK defence spending currently sits at around 2.3% of GDP, above NATO's 2% minimum. The debate is usually about whether to raise this further — and, if so, what gets cut or taxed elsewhere to pay for it.",
    positions: { labour: 1, conservative: 1, "liberal-democrat": 0, "reform-uk": 1, green: -1, snp: -1, "plaid-cymru": -1 },
  },
  {
    id: "ownership",
    issue: "ownership",
    statement: "Key utilities like rail and energy should be brought back into public ownership.",
    explainer: "Rail and energy in Great Britain were privatised in the 1980s and 90s. Proposals range from renationalising specific failing operators (as has already happened with some rail franchises) to a wholesale return to state-run utilities.",
    positions: { labour: 1, conservative: -2, "liberal-democrat": 0, "reform-uk": 0, green: 2, snp: 1, "plaid-cymru": 1 },
  },
  {
    id: "aid",
    issue: "aid",
    statement: "The UK should increase its foreign aid budget back to 0.7% of national income.",
    explainer: "The UK cut foreign aid from 0.7% to 0.5% of national income in 2021 to help fund pandemic recovery spending, and the effective amount spent overseas has fallen further since, as more of the aid budget is used to house asylum seekers domestically.",
    positions: { labour: 0, conservative: -1, "liberal-democrat": 2, "reform-uk": -2, green: 2, snp: 1, "plaid-cymru": 1 },
  },
  {
    id: "workers",
    issue: "workers",
    statement: "Workers should get stronger employment rights, such as protection from unfair dismissal from day one of a new job.",
    explainer: "Currently, most employees need two years' service before they can claim unfair dismissal. A \"day one\" right would remove that qualifying period — a change businesses argue could make hiring feel riskier, and unions argue is overdue.",
    positions: { labour: 2, conservative: -1, "liberal-democrat": 1, "reform-uk": -1, green: 2, snp: 1, "plaid-cymru": 1 },
  },
  {
    id: "asylum",
    issue: "asylum",
    statement: "Asylum seekers who arrive via unauthorised routes, such as small boats, should automatically lose the right to claim asylum.",
    explainer: "Under current and international law, how someone arrives doesn't by itself determine whether their asylum claim can be heard or granted. This statement asks about removing that right automatically, regardless of the merits of the individual claim — a bigger change than reducing arrivals alone.",
    positions: { labour: -1, conservative: 2, "liberal-democrat": -2, "reform-uk": 2, green: -2, snp: -2, "plaid-cymru": -2 },
  },
];

export const ANSWER_SCALE = [
  { value: -2, label: "Strongly Disagree" },
  { value: -1, label: "Disagree" },
  { value: 0, label: "Not Sure" },
  { value: 1, label: "Agree" },
  { value: 2, label: "Strongly Agree" },
];

// answers: { [questionId]: -2..2 }, priorities: Set/array of issue keys.
// Returns parties sorted by descending match percentage.
export function scoreQuiz(answers, priorities) {
  const prioritySet = new Set(priorities);
  const results = QUIZ_PARTIES.map((party) => {
    let earned = 0;
    let possible = 0;
    for (const q of QUESTIONS) {
      const userAnswer = answers[q.id];
      if (userAnswer === undefined) continue;
      const weight = prioritySet.has(q.issue) ? 2 : 1;
      const partyPosition = q.positions[party.key] ?? 0;
      const distance = Math.abs(userAnswer - partyPosition); // 0..4
      earned += (4 - distance) * weight;
      possible += 4 * weight;
    }
    const pct = possible > 0 ? Math.round((earned / possible) * 100) : 0;
    return { ...party, pct };
  });
  return results.sort((a, b) => b.pct - a.pct);
}

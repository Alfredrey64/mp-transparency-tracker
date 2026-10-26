import { IconNorthernIreland } from "../components/icons";

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
// Checked again on 26 October 2026 against the text of each party's 2024 manifesto (the official PDFs; for Plaid Cymru the PDF could not be downloaded, so its
// scores rest on the summary on this site and are capped at +/-1 unless that summary is explicit). Every score has a note and a page reference in
// partyMatchEvidence.js. 2024 is still the latest UK general election manifesto for every party here. A score is
// +/-2 where the manifesto commits to it or against it clearly, +/-1 for a lean, and 0 where the party is silent or mixed. Where a manifesto
// says nothing, the score follows the party's long-standing public position, and is kept to +/-1 at most.
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

// SNP and Plaid Cymru only stand candidates in Scotland and Wales
// respectively — a strong match with either is meaningless (and mildly
// misleading) for someone who couldn't actually vote for them. `onlyIn`
// restricts a party to one nation's results; parties without it are
// treated as standing UK-wide (England, Scotland, and Wales — Northern
// Ireland's parties are out of scope entirely, see the note below).
// England/Scotland/Wales each have a real Unicode flag emoji; Northern
// Ireland doesn't (no ISO 3166-2 tag sequence is registered for it), so
// its entry uses `flagIcon` — a drawn Ulster Banner component — instead
// of the `flag` emoji string the other three use.
export const NATIONS = [
  { key: "england", label: "England", flag: "🏴󠁧󠁢󠁥󠁮󠁧󠁿" },
  { key: "scotland", label: "Scotland", flag: "🏴󠁧󠁢󠁳󠁣󠁴󠁿" },
  { key: "wales", label: "Wales", flag: "🏴󠁧󠁢󠁷󠁬󠁳󠁿" },
  { key: "northern-ireland", label: "Northern Ireland", flagIcon: IconNorthernIreland },
];

// Where a quiz statement has a matching question on the Ask a question pages, which shows what each party said it would do and the latest
// figures. The results link there so you can check the reading for yourself.
export const QUESTION_ANSWER = {
  tax: "where-does-tax-go",
  nhs: "why-nhs-waiting-list",
  immigration: "what-is-immigration-level",
  climate: "is-uk-on-track-net-zero",
  housing: "why-housing-expensive",
  europe: "why-economy-slow",
  sentencing: "is-crime-rising",
  welfare: "benefits-and-pensions-spending",
  workers: "why-are-there-strikes",
  asylum: "why-small-boats",
};

const NATION_RESTRICTED = { snp: "scotland", "plaid-cymru": "wales" };

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
    statement: "The wealthiest people should pay more tax than they do now.",
    explainer: "This can mean different things: a higher top rate of income tax, taxing capital gains (the profit from selling assets) at the same rates as earnings, or a tax on very large fortunes. Parties disagree about which of these, if any, would raise money without driving wealth abroad.",
    positions: { labour: 0, conservative: -2, "liberal-democrat": 1, "reform-uk": -2, green: 2, snp: 1, "plaid-cymru": 2 },
  },
  {
    id: "nhs",
    issue: "nhs",
    statement: "The NHS should stay fully publicly funded, with no expansion of private-sector involvement.",
    explainer: "A share of NHS treatment is already delivered by private providers under NHS contracts, mainly to cut waiting lists. This question is about whether that share should grow, shrink, or stay as it is, not about introducing charges for patients.",
    positions: { labour: -1, conservative: -2, "liberal-democrat": 0, "reform-uk": -2, green: 2, snp: 2, "plaid-cymru": 1 },
  },
  {
    id: "immigration",
    issue: "immigration",
    statement: "Net migration to the UK should be significantly reduced.",
    explainer: "\"Net migration\" is people arriving minus people leaving, and covers work, study and family visas, not just asylum, which is a separate question below. It reached a record of around 900,000 in the year to mid-2023 and has fallen since; this is about the overall level of legal migration.",
    positions: { labour: 1, conservative: 2, "liberal-democrat": -1, "reform-uk": 2, green: -2, snp: -1, "plaid-cymru": -1 },
  },
  {
    id: "climate",
    issue: "climate",
    statement: "The UK should speed up its transition to net zero, even if it means higher costs in the short term.",
    explainer: "\"Net zero\" is the UK's legal target, set in 2019, to cut greenhouse gas emissions to (near) zero by 2050. Speeding it up usually means a faster rollout of renewables, home insulation and electric vehicles, often with higher upfront costs for consumers or taxpayers.",
    positions: { labour: 1, conservative: -1, "liberal-democrat": 2, "reform-uk": -2, green: 2, snp: 1, "plaid-cymru": 1 },
  },
  {
    id: "housing",
    issue: "housing",
    statement: "The government should set a much higher target for new homes each year.",
    explainer: "England has built fewer homes than the 300,000 a year that governments have aimed for in recent years. Parties disagree about how many to aim for, where to build them, and who should build them: private developers, councils or housing associations.",
    positions: { labour: 2, conservative: 0, "liberal-democrat": 2, "reform-uk": 0, green: 1, snp: 0, "plaid-cymru": 0 },
  },
  {
    id: "europe",
    issue: "europe",
    statement: "The UK should seek to rejoin the EU single market.",
    explainer: "The UK left the EU single market and customs union at the end of 2020. Rejoining the single market alone, short of full membership, would mean accepting EU trade rules and free movement of people, in exchange for tariff-free trade in goods and wider access for services.",
    positions: { labour: -2, conservative: -2, "liberal-democrat": 2, "reform-uk": -2, green: 2, snp: 2, "plaid-cymru": 2 },
  },
  {
    id: "sentencing",
    issue: "crime",
    statement: "Prison sentences for serious violent crime should be made significantly longer.",
    explainer: "How much of a prison sentence is spent inside, and how much on licence in the community, is set by law and has been changed several times recently. Longer sentences are often proposed alongside, or as an alternative to, spending more on policing, prevention or prison capacity.",
    positions: { labour: 0, conservative: 2, "liberal-democrat": -1, "reform-uk": 2, green: -1, snp: 0, "plaid-cymru": 0 },
  },
  {
    id: "tuition",
    issue: "education",
    statement: "University tuition fees in England should be abolished.",
    explainer: "In England universities can charge more than £9,000 a year, paid upfront by government-backed loans that graduates repay once they earn above a threshold, and the cap is rising with inflation. Scotland charges its own resident students no tuition fees at all.",
    positions: { labour: -1, conservative: -1, "liberal-democrat": 0, "reform-uk": -1, green: 2, snp: 1, "plaid-cymru": 0 },
  },
  {
    id: "welfare",
    issue: "welfare",
    statement: "Welfare and disability benefit spending should be reduced to encourage more people into work.",
    explainer: "Welfare, including disability and unemployment benefits, is one of the largest areas of government spending after health and pensions. Reducing it to encourage work usually means tighter eligibility rules or stricter conditions for claimants. Critics say that risks pushing sick and disabled people into hardship; supporters say it helps people into jobs and saves money.",
    positions: { labour: 0, conservative: 2, "liberal-democrat": -1, "reform-uk": 1, green: -2, snp: -2, "plaid-cymru": -2 },
  },
  {
    id: "pr",
    issue: "voting",
    statement: "Westminster elections should switch from First Past the Post to a proportional system.",
    explainer: "First Past the Post elects one MP per constituency by simple plurality, which can turn a minority of the national vote into a large majority of seats. Proportional systems allocate seats closer to each party's share of the vote, but tend to produce more coalitions.",
    positions: { labour: -1, conservative: -2, "liberal-democrat": 2, "reform-uk": 1, green: 2, snp: 2, "plaid-cymru": 1 },
  },
  {
    id: "devolution",
    issue: "devolution",
    statement: "More powers should be devolved from Westminster to Scotland, Wales, and Northern Ireland.",
    explainer: "Scotland, Wales and Northern Ireland already have their own parliaments or assemblies with varying control over health, education and some taxes. \"More devolution\" usually means transferring further powers, such as welfare, justice or immigration, away from Westminster.",
    positions: { labour: 0, conservative: -2, "liberal-democrat": 2, "reform-uk": 0, green: 1, snp: 2, "plaid-cymru": 2 },
  },
  {
    id: "defence",
    issue: "defence",
    statement: "UK defence spending should be increased significantly.",
    explainer: "Defence spending is usually measured as a share of national income. NATO members have agreed targets above the old 2% line, and the larger parties all promised increases in 2024. The debate is about how fast, how far, and what is cut or taxed elsewhere to pay for it.",
    positions: { labour: 1, conservative: 1, "liberal-democrat": 1, "reform-uk": 2, green: -1, snp: -1, "plaid-cymru": 0 },
  },
  {
    id: "ownership",
    issue: "ownership",
    statement: "Key utilities like rail and energy should be brought back into public ownership.",
    explainer: "Rail and energy in Great Britain were largely privatised in the 1980s and 90s. Proposals range from taking particular operators back into state hands as their contracts end, to a wholesale return to state-run utilities.",
    positions: { labour: 1, conservative: -2, "liberal-democrat": 0, "reform-uk": 1, green: 2, snp: 1, "plaid-cymru": 0 },
  },
  {
    id: "aid",
    issue: "aid",
    statement: "The UK should increase its foreign aid budget back to 0.7% of national income.",
    explainer: "The UK spent 0.7% of national income on aid for years until 2021, when it was cut to 0.5%. In 2025 the government announced a further cut, to 0.3% by 2027, and part of the aid budget goes on supporting refugees in the UK.",
    positions: { labour: 1, conservative: 1, "liberal-democrat": 2, "reform-uk": -2, green: 2, snp: 2, "plaid-cymru": 2 },
  },
  {
    id: "workers",
    issue: "workers",
    statement: "Workers should get stronger employment rights, such as protection from unfair dismissal from day one of a new job.",
    explainer: "Most employees have needed two years' service before they can claim unfair dismissal. A law passed in 2025 cuts this to six months from 1 January 2027. A \"day one\" right would remove the qualifying period altogether, which businesses argue could make hiring feel riskier and unions argue is overdue.",
    positions: { labour: 2, conservative: -1, "liberal-democrat": 1, "reform-uk": -1, green: 2, snp: 1, "plaid-cymru": 0 },
  },
  {
    id: "asylum",
    issue: "asylum",
    statement: "Asylum seekers who arrive via unauthorised routes, such as small boats, should automatically lose the right to claim asylum.",
    explainer: "This asks whether the way someone arrives should, by itself, remove their right to have an asylum claim heard, whatever its merits. Supporters say it would deter dangerous crossings; critics say it conflicts with the Refugee Convention and would leave people with genuine claims unprotected.",
    positions: { labour: -1, conservative: 2, "liberal-democrat": -2, "reform-uk": 2, green: -2, snp: -1, "plaid-cymru": -1 },
  },
];

export const ANSWER_SCALE = [
  { value: -2, label: "Strongly Disagree" },
  { value: -1, label: "Disagree" },
  { value: 0, label: "Not Sure" },
  { value: 1, label: "Agree" },
  { value: 2, label: "Strongly Agree" },
];

// answers: { [questionId]: -2..2 }, priorities: Set/array of issue keys,
// nation: one of NATIONS' keys, or null if skipped. Returns parties sorted
// by descending match percentage — nation-restricted parties (SNP, Plaid
// Cymru) are left out entirely unless the given nation is the one they
// actually stand in, rather than being scored and shown as if they were a
// real option everywhere.
export function scoreQuiz(answers, priorities, nation = null) {
  const prioritySet = new Set(priorities);
  const eligibleParties = QUIZ_PARTIES.filter((party) => {
    const restrictedTo = NATION_RESTRICTED[party.key];
    if (!restrictedTo) return true;
    return nation === restrictedTo;
  });
  const results = eligibleParties.map((party) => {
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

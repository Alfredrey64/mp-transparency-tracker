// Plain-English context for the things an MP has been doing: what a debate, a question, a vote or a bill is, and what the record does and does not say about it.
// Parliament publishes what a member did; it never publishes why. So the only "why" this offers is a link the records themselves show (the subject names the MP's own
// area, one of their committees, a bill they sponsor, or something people in their seat have petitioned about), said as a possible link and never as a motive.

const STOP = new Set("about after again against also been before between bill bills committee council department from have into more most other over regarding should some than that their there these they this those under until upon were what when where which while will with without would your government minister ministers secretary state services service".split(" "));
const words = (text) => new Set(String(text ?? "").toLowerCase().replace(/[^a-z0-9 ]+/g, " ").split(/\s+/).filter((w) => w.length >= 5 && !STOP.has(w)).map((w) => w.replace(/(ies|es|s)$/, "")));

// What kind of sitting a debate was in, from the section Parliament files it under.
export function debateKind(section) {
  const s = String(section ?? "").toLowerCase();
  if (/westminster hall/.test(s)) return { label: "Westminster Hall", plain: "A debate in the second debating room of the House of Commons. MPs use it to raise local and topical issues with a minister. Nothing is voted on." };
  if (/public bill|bill committee/.test(s)) return { label: "Bill committee", plain: "A small group of MPs going through a bill line by line and suggesting changes." };
  if (/grand committee/.test(s)) return { label: "Grand Committee", plain: "The House of Lords' side room for going through a bill in detail. No votes are taken there." };
  if (/lords chamber/.test(s)) return { label: "House of Lords", plain: "The main chamber of the House of Lords." };
  if (/written statement/.test(s)) return { label: "Written statement", plain: "A ministerial announcement made in writing rather than spoken in the chamber." };
  if (/commons chamber/.test(s)) return { label: "Commons chamber", plain: "The main debating room of the House of Commons, where laws are debated and ministers can be questioned." };
  return { label: section || "A sitting of Parliament", plain: "A sitting of Parliament. The title is the subject that was being debated." };
}

// What an MP's contribution to a debate was, from the counts Parliament keeps.
export function contributionWords({ speeches, questions, interventions }) {
  const parts = [];
  if (speeches > 0) parts.push(speeches === 1 ? "made a speech" : `made ${speeches} speeches`);
  if (questions > 0) parts.push(questions === 1 ? "asked a question" : `asked ${questions} questions`);
  if (interventions > 0) parts.push(interventions === 1 ? "made an intervention (a short question put to the speaker, who gives way)" : `made ${interventions} interventions (short questions put to the speaker, who gives way)`);
  return parts.length ? `They ${parts.join(", ")}.` : "They took part in this debate.";
}

// A one-line description of what each government department does, for the question's answering body.
const DEPARTMENTS = [
  [/education/i, "Schools, colleges, children's services and early years in England."],
  [/health and social care/i, "The NHS, social care and public health in England."],
  [/transport/i, "Roads, rail, buses, aviation and ports."],
  [/treasury/i, "The government's money: taxes, spending and the economy."],
  [/home office/i, "Policing, immigration, borders and national security."],
  [/justice/i, "Courts, prisons, probation and the law in England and Wales."],
  [/work and pensions/i, "Benefits, pensions and helping people into work."],
  [/housing, communities|local government/i, "Housing, planning, councils and regeneration in England."],
  [/environment, food/i, "Farming, food, water, flooding and the natural environment."],
  [/energy security/i, "Energy supply and bills, and the move to net zero."],
  [/business and trade/i, "Business support, trade deals and consumer rules."],
  [/culture, media/i, "Arts, sport, broadcasting, tourism and the digital economy."],
  [/science, innovation/i, "Science, research, technology and digital services."],
  [/defence/i, "The armed forces and the defence of the UK."],
  [/foreign, commonwealth/i, "Relations with other countries, aid and the UK's embassies."],
  [/cabinet office/i, "The running of government, the Civil Service and elections policy."],
  [/scotland office/i, "The UK government's link with Scotland."],
  [/wales office/i, "The UK government's link with Wales."],
  [/northern ireland office/i, "The UK government's link with Northern Ireland."],
  [/attorney general/i, "The government's chief legal adviser."],
];
export function departmentInfo(name) { return DEPARTMENTS.find(([re]) => re.test(name ?? ""))?.[1] ?? null; }

// Where a written question stands.
export function questionStatus({ tabled, answered }, today = new Date()) {
  const day = (iso) => new Date(`${iso}T00:00:00Z`).getTime();
  if (answered && tabled) {
    const days = Math.round((day(answered) - day(tabled)) / 86400000);
    return { answered: true, plain: days <= 0 ? "Answered the same day." : `Answered after ${days} ${days === 1 ? "day" : "days"}.` };
  }
  if (tabled) {
    const days = Math.max(0, Math.floor((today.getTime() - day(tabled)) / 86400000));
    return { answered: false, plain: `Still waiting for an answer after ${days} ${days === 1 ? "day" : "days"}. Ministers aim to answer within about a week, though many take longer.` };
  }
  return { answered: Boolean(answered), plain: answered ? "Answered." : "Waiting for an answer." };
}

// The ways a subject ties to things the records show about the MP. Each is a plain sentence; an empty list means the records show no link.
export function connections({ text, seatName, committees = [], petitions = [], sponsored = [] }) {
  const out = [];
  const lower = String(text ?? "").toLowerCase();
  const seatWords = [...words(seatName)];
  if (seatName && (lower.includes(String(seatName).toLowerCase()) || (seatWords.length > 0 && seatWords.every((w) => words(text).has(w))))) out.push("The subject names their constituency.");
  const mine = words(text);
  for (const c of committees) { const shared = [...words(c)].filter((w) => mine.has(w)); if (shared.length > 0) { out.push(`It touches the work of the ${c}, which they sit on.`); break; } }
  for (const b of sponsored) { const shared = [...words(b)].filter((w) => mine.has(w)); if (shared.length >= 2 || (shared.length === 1 && words(b).size === 1)) { out.push(`It relates to a bill they sponsor, the ${b}.`); break; } }
  for (const p of petitions) { const shared = [...words(p)].filter((w) => mine.has(w)); if (shared.length >= 2) { out.push(`People in their seat have signed a petition on a similar subject: "${p}".`); break; } }
  return out;
}

export const NO_WHY = "Parliament records what a member did, not why. Anything beyond the links above would be a guess, so we leave it out.";

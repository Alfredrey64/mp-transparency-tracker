import { CATEGORIES } from "../data/publicSpending";

// The rules and facts behind the Teacher mode games. Pure, so they can be tested without a screen. Everything a game says is something the lesson also
// says, and nothing here favours a party.

// ---- Who decides? ----------------------------------------------------------------------------------------------------------------------------------
export const DECIDERS = [
  { key: "council", title: "Your council", colour: "#C7871A", blurb: "Councillors, elected locally" },
  { key: "devolved", title: "Scotland, Wales and Northern Ireland", colour: "#7A5AF0", blurb: "Each has its own parliament or assembly" },
  { key: "uk", title: "The UK Parliament and government", colour: "#1E4FB8", blurb: "MPs and ministers, for the whole UK" },
];

export const DECISIONS = [
  { id: "bins", text: "When the bins are collected", answer: "council", why: "Councils run bin collections and recycling." },
  { id: "tax", text: "How much income tax people pay", answer: "uk", why: "Tax rates are set by the UK government and Parliament (with some tax powers in Scotland and Wales)." },
  { id: "nhs-sco", text: "How the NHS is run in Scotland", answer: "devolved", why: "Health is devolved: Scotland runs its own health service." },
  { id: "lights", text: "Whether to put in a new street light", answer: "council", why: "Councils look after local roads and street lights." },
  { id: "defence", text: "Whether to buy new ships for the navy", answer: "uk", why: "Defence and the armed forces are looked after by the UK government." },
  { id: "schools-wales", text: "How schools are run in Wales", answer: "devolved", why: "Education is devolved: Wales runs its own schools." },
  { id: "library", text: "Whether the town library stays open", answer: "council", why: "Councils run local libraries, parks and leisure." },
  { id: "borders", text: "Who is allowed to enter the country", answer: "uk", why: "Immigration and borders are kept for the UK government." },
  { id: "hospital-ni", text: "How hospitals are run in Northern Ireland", answer: "devolved", why: "Health is devolved: Northern Ireland runs its own health service." },
  { id: "planning", text: "Whether to allow a new block of flats on your street", answer: "council", why: "Councils decide local planning applications, within national rules." },
  { id: "pensions", text: "How much the State Pension is", answer: "uk", why: "Most benefits and pensions are decided by the UK government." },
  { id: "housing-sco", text: "Some of the rules on housing in Scotland", answer: "devolved", why: "Some housing and transport decisions are devolved." },
];

// A fixed shuffle, so a class sees the same order each time and the game can be tested.
export const shuffled = (items, seed = 7) => {
  const out = [...items];
  let s = seed;
  for (let i = out.length - 1; i > 0; i--) {
    s = (s * 1103515245 + 12345) & 0x7fffffff;
    const j = s % (i + 1);
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
};

export const isRight = (decision, key) => decision.answer === key;

// ---- Make a law ------------------------------------------------------------------------------------------------------------------------------------
// Where the bill is for each of the eight steps, as a place on the picture: the first House (steps 1 to 5), the other House (6), back and forth (7), the King (8).
export const BILL_PLACES = [
  { place: "first", at: 0 }, { place: "first", at: 1 }, { place: "first", at: 2 }, { place: "first", at: 3 }, { place: "first", at: 4 },
  { place: "second", at: 0 }, { place: "between", at: 0 }, { place: "king", at: 0 },
];
export const nextCorrect = (placed, choice) => choice === placed.length;

// ---- Build a majority ------------------------------------------------------------------------------------------------------------------------------
export const SEATS = 650;
export const majorityOf = (total = SEATS) => Math.floor(total / 2) + 1;

// Made-up parties on purpose: the real numbers change, and a class should practise the sums without a real party being picked.
export const SCENARIOS = [
  { key: "clear", title: "A clear win", blurb: "One party did very well.", parties: [["Red", "#D64550", 372], ["Blue", "#2A6FDB", 168], ["Green", "#2F9E6B", 62], ["Gold", "#E0A526", 48]] },
  { key: "hung", title: "A hung parliament", blurb: "Nobody has enough alone.", parties: [["Red", "#D64550", 291], ["Blue", "#2A6FDB", 268], ["Green", "#2F9E6B", 52], ["Gold", "#E0A526", 39]] },
  { key: "tight", title: "A tight squeeze", blurb: "Four parties, and every seat matters.", parties: [["Red", "#D64550", 240], ["Blue", "#2A6FDB", 232], ["Green", "#2F9E6B", 94], ["Gold", "#E0A526", 84]] },
];

export const seatsOf = (scenario, chosen) => scenario.parties.reduce((t, [name, , n]) => t + (chosen.includes(name) ? n : 0), 0);

// The fewest parties that can reach a majority, and every way of doing it with that many.
export function smallestCoalitions(scenario, total = SEATS) {
  const names = scenario.parties.map(([n]) => n);
  const need = majorityOf(total);
  let best = null;
  const out = [];
  for (let mask = 1; mask < 1 << names.length; mask++) {
    const group = names.filter((_, i) => mask & (1 << i));
    if (seatsOf(scenario, group) < need) continue;
    if (best === null || group.length < best) { best = group.length; out.length = 0; }
    if (group.length === best) out.push(group);
  }
  return out;
}

export function verdict(scenario, chosen, total = SEATS) {
  const need = majorityOf(total);
  const seats = seatsOf(scenario, chosen);
  if (!chosen.length) return { state: "empty", seats, need };
  if (seats < need) return { state: "short", seats, need, gap: need - seats };
  const fewest = smallestCoalitions(scenario, total)[0].length;
  return { state: chosen.length === fewest ? "best" : "spare", seats, need, spare: chosen.length - fewest };
}

// Seats laid out as a half-circle, left to right, so a party's seats sit side by side. Returns [x, y] in a box 0..2R wide.
export function hemicycle(total = SEATS, rows = 10, inner = 56, outer = 150) {
  const radii = Array.from({ length: rows }, (_, r) => inner + ((outer - inner) * r) / (rows - 1));
  const sum = radii.reduce((t, r) => t + r, 0);
  let left = total;
  const pts = [];
  radii.forEach((r, row) => {
    const n = row === rows - 1 ? left : Math.round((total * r) / sum);
    left -= n;
    for (let i = 0; i < n; i++) {
      const a = Math.PI * (n === 1 ? 0.5 : i / (n - 1));
      pts.push({ angle: a, x: outer - Math.cos(a) * r, y: outer - Math.sin(a) * r });
    }
  });
  return pts.sort((p, q) => p.angle - q.angle || p.y - q.y);
}

// ---- Role detective --------------------------------------------------------------------------------------------------------------------------------
export const ROLES = [
  { key: "mp", name: "A Member of Parliament", clues: ["People in one area voted for me.", "I sit in the House of Commons, with 649 others.", "I speak up for my area and vote on new laws."] },
  { key: "peer", name: "A member of the House of Lords", clues: ["The public did not vote for me.", "I help check and improve new laws.", "I sit in the Lords, the other part of Parliament."] },
  { key: "pm", name: "The Prime Minister", clues: ["I lead the government.", "My office is at 10 Downing Street.", "The King asked me to form a government because I can win the support of the Commons."] },
  { key: "speaker", name: "The Speaker of the House of Commons", clues: ["I keep order when the Commons is debating.", "I decide which MP speaks next.", "MPs chose me, and I do not take sides between parties."] },
  { key: "councillor", name: "A local councillor", clues: ["I was elected in a local election.", "I speak up for one small area called a ward.", "I help decide about bins, parks and planning where I live."] },
  { key: "king", name: "The King", clues: ["I give my signature to turn a bill into a law.", "I open each new session of Parliament.", "I do not take sides in politics."] },
  { key: "opposition", name: "The Leader of the Opposition", clues: ["I lead the biggest party that is not in government.", "I ask the Prime Minister questions in the Commons.", "My job is to challenge the government and offer another way."] },
  { key: "minister", name: "A government minister", clues: ["The Prime Minister gave me this job.", "I help run a part of the government, such as health or transport.", "I answer questions about it in Parliament."] },
];

// Four choices for a role: the right one and three others, in a fixed shuffle.
export function options(roleKey, seed = 3) {
  const right = ROLES.find((r) => r.key === roleKey);
  const others = shuffled(ROLES.filter((r) => r.key !== roleKey), seed + roleKey.length).slice(0, 3);
  return shuffled([right, ...others], seed + roleKey.length * 2);
}

// Points for a right answer: three for one clue, two for two, one for three. A wrong guess shows the next clue.
export const pointsFor = (cluesShown) => Math.max(1, 4 - cluesShown);

// ---- Follow the £10 --------------------------------------------------------------------------------------------------------------------------------
// The eight slices of planned public spending, in plain words. The shares come from the same figures as the Where taxes go page, so the two always agree.
const PLAIN = {
  welfare: ["Pensions and benefits", "The State Pension, Universal Credit and disability support"],
  health: ["Health", "The NHS, hospitals, GPs and mental health care"],
  otherAme: ["Public sector pensions and more", "Pensions for retired public workers, and other spending that follows need"],
  otherDept: ["Police, courts, councils and the rest", "The Home Office, prisons, local government funding, aid and every other department"],
  capital: ["Building and investment", "Roads, railways, hospitals, schools and other things that last"],
  debt: ["Interest on debt", "What the government pays to borrow, like interest on a loan"],
  education: ["Schools and education", "Running schools, colleges and early years"],
  defence: ["Defence", "The army, navy, air force and equipment"],
};
export const TEN = 10;

// What each of ten pounds goes on, worked out from the real shares, so the slices add up to exactly ten.
export function tenPounds() {
  const total = CATEGORIES.reduce((t, c) => t + c.amountBn, 0);
  return CATEGORIES.map((c) => ({ key: c.key, label: PLAIN[c.key][0], example: PLAIN[c.key][1], colour: c.color, pounds: (c.amountBn / total) * TEN }));
}
export const poundText = (x) => `£${x.toFixed(2)}`;

// How many of the ten pounds a guess put in the wrong place (0 is a perfect match), and the slice that was furthest out.
export function howFar(guess, real = tenPounds()) {
  const gaps = real.map((r) => ({ key: r.key, label: r.label, guess: guess[r.key] ?? 0, real: r.pounds, diff: (guess[r.key] ?? 0) - r.pounds }));
  const misplaced = gaps.reduce((t, g) => t + Math.abs(g.diff), 0) / 2;
  const biggest = [...gaps].sort((a, b) => Math.abs(b.diff) - Math.abs(a.diff))[0];
  return { misplaced, biggest, gaps };
}

// ---- Election day ----------------------------------------------------------------------------------------------------------------------------------
export const DAY_SLOTS = [
  { key: "before", title: "Before the day", sub: "Weeks and days before", colour: "#1E4FB8" },
  { key: "voting", title: "Polling day", sub: "7am to 10pm", colour: "#C7871A" },
  { key: "close", title: "10pm", sub: "The polls close", colour: "#7A5AF0" },
  { key: "night", title: "Overnight", sub: "The count", colour: "#2B3A67" },
  { key: "after", title: "The days after", sub: "A new government", colour: "#E0367A" },
];
export const DAY_EVENTS = [
  { id: "register", text: "You register to vote and a poll card comes through the door", slot: "before", why: "You have to be on the electoral register, and your poll card tells you where to vote." },
  { id: "campaign", text: "Candidates knock on doors and parties deliver leaflets", slot: "before", why: "The campaign runs for weeks before polling day." },
  { id: "open", text: "The polling stations open", slot: "voting", why: "They open at 7am and stay open all day." },
  { id: "id", text: "You show your photo ID and are given a ballot paper", slot: "voting", why: "You show ID at the polling station, then are handed a paper with the candidates on it." },
  { id: "cross", text: "You mark an X next to one candidate, in secret, and post it in the box", slot: "voting", why: "Voting is secret. Nobody can see or ask who you chose." },
  { id: "exit", text: "Television shows the exit poll, a forecast of the result", slot: "close", why: "Broadcasters publish an exit poll the moment the polls close, based on asking voters as they left." },
  { id: "count", text: "The ballot boxes are opened and the papers are counted", slot: "night", why: "The counting is overnight, in a hall in each area, with the candidates and their helpers watching." },
  { id: "declare", text: "The returning officer reads out the winner for the area", slot: "night", why: "The candidate with the most votes in an area wins and becomes its MP." },
  { id: "king", text: "The King asks the leader of the party that can win votes in the Commons to be Prime Minister", slot: "after", why: "Usually that is the leader of the party with the most seats." },
  { id: "ministers", text: "The new Prime Minister chooses the ministers", slot: "after", why: "The Prime Minister decides who runs each part of the government." },
];

// ---- Spot the layer --------------------------------------------------------------------------------------------------------------------------------
export const NATIONS = [
  { key: "england", name: "England", devolved: "Scotland, Wales and Northern Ireland" },
  { key: "scotland", name: "Scotland", devolved: "The Scottish Parliament and Government" },
  { key: "wales", name: "Wales", devolved: "The Senedd and Welsh Government" },
  { key: "ni", name: "Northern Ireland", devolved: "The Northern Ireland Assembly and Executive" },
];
// Things in a town. Some have the same answer everywhere, and some change with the nation, which is the point of the game.
const everywhere = (answer, why) => ({ england: [answer, why], scotland: [answer, why], wales: [answer, why], ni: [answer, why] });
const health = (what) => ({
  england: ["uk", `In England the NHS is run by the UK government, through the Department of Health and Social Care.`],
  scotland: ["devolved", `Health is devolved: Scotland runs NHS Scotland.`],
  wales: ["devolved", `Health is devolved: Wales runs NHS Wales.`],
  ni: ["devolved", `Health is devolved: Northern Ireland runs its own health and social care.`],
  what,
});
export const TOWN = [
  { id: "hospital", name: "The hospital", ask: "how the hospital is run and paid for", answers: health() },
  { id: "school", name: "The school", ask: "what children are taught at school", answers: {
    england: ["uk", "In England the curriculum is set by the UK government's Department for Education."],
    scotland: ["devolved", "Education is devolved: Scotland sets its own curriculum."],
    wales: ["devolved", "Education is devolved: Wales sets its own curriculum."],
    ni: ["devolved", "Education is devolved: Northern Ireland sets its own curriculum."],
  } },
  { id: "police", name: "The police station", ask: "how the police are run", answers: {
    england: ["uk", "Policing in England is not devolved, so the UK government's Home Office sets the rules."],
    scotland: ["devolved", "Policing is devolved in Scotland, which has one national force."],
    wales: ["uk", "Policing in Wales is not devolved, so the UK government's Home Office sets the rules."],
    ni: ["devolved", "Policing and justice are devolved in Northern Ireland."],
  } },
  { id: "tax", name: "The tax office", ask: "VAT and National Insurance", answers: everywhere("uk", "Most taxes, including VAT and National Insurance, are set by the UK government.") },
  { id: "bins", name: "The bin lorry", ask: "when the bins are collected", answers: everywhere("council", "Councils run bin collections and recycling.") },
  { id: "park", name: "The park", ask: "looking after the park and playground", answers: everywhere("council", "Councils look after local parks and play areas.") },
  { id: "flats", name: "The new flats", ask: "whether the new flats can be built", answers: everywhere("council", "Councils decide local planning applications, within national rules.") },
  { id: "navy", name: "The warship", ask: "whether to buy new ships for the navy", answers: everywhere("uk", "Defence and the armed forces are looked after by the UK government.") },
];
export const answerFor = (item, nation) => item.answers[nation][0];
export const whyFor = (item, nation) => item.answers[nation][1];
export const tally = (nation) => TOWN.reduce((t, i) => { const a = answerFor(i, nation); return { ...t, [a]: (t[a] ?? 0) + 1 }; }, {});
// The things whose answer is different in another nation, so the end of the game can say what to try next.
export const changesWith = (nation) => TOWN.filter((i) => NATIONS.some((n) => answerFor(i, n.key) !== answerFor(i, nation)));

// ---- Team quiz -------------------------------------------------------------------------------------------------------------------------------------
export const TEAM_COLOURS = ["#7A5AF0", "#0E9AA7", "#E0367A", "#C7871A"];
export const QUESTION_POINTS = 2;
export const TEAM_QUESTIONS = [
  { id: "bins", q: "Who decides when your bins are collected?", options: ["The local council", "The King", "The Prime Minister"], answer: 0, why: "Councils look after local services such as bins, parks and libraries." },
  { id: "mps", q: "How many MPs are there in the House of Commons?", options: ["100", "650", "5,000"], answer: 1, why: "There are 650 MPs, one for each of 650 areas called constituencies." },
  { id: "lords", q: "Which House has members who are not elected?", options: ["The House of Commons", "The House of Lords", "Both of them"], answer: 1, why: "Peers in the Lords are not elected. MPs in the Commons are." },
  { id: "party", q: "What is a political party?", options: ["A group of people who share ideas about how the country should be run", "A birthday celebration", "A kind of government office"], answer: 0, why: "Parties offer voters a set of ideas, and try to win seats so they can put those ideas into action." },
  { id: "speaker", q: "What does the Speaker of the House of Commons do?", options: ["Chairs the debates and keeps order", "Leads the country", "Writes the laws alone"], answer: 0, why: "The Speaker is chosen by MPs and keeps debates fair and in order." },
  { id: "constituency", q: "What is a constituency?", options: ["An area that elects one MP", "A government department", "A type of tax"], answer: 0, why: "The country is divided into 650 constituencies, and each one elects one MP." },
  { id: "majority", q: "How many seats does a party usually need to win a majority in the Commons?", options: ["100", "326", "650"], answer: 1, why: "326 is more than half of the 650 seats." },
  { id: "hansard", q: "What is Hansard?", options: ["The written record of what is said in Parliament", "A kind of vote", "The name of the Speaker's chair"], answer: 0, why: "Hansard is the official report of the debates, so anyone can read what was said." },
  { id: "act", q: "What is a bill called once it has become a law?", options: ["A manifesto", "An Act of Parliament", "A petition"], answer: 1, why: "A bill becomes an Act of Parliament after both Houses agree and it gets Royal Assent." },
  { id: "opposition", q: "What does the Opposition do?", options: ["Challenges the government and offers another way", "Runs the government", "Counts the votes"], answer: 0, why: "The biggest party that is not in government leads the Opposition and questions ministers." },
  { id: "manifesto", q: "What is a manifesto?", options: ["A party's plan for what it will do if it wins", "A list of MPs", "A ballot paper"], answer: 0, why: "Parties publish a manifesto before an election so voters can see their plans." },
  { id: "bye", q: "What is a by-election?", options: ["An election in one area when its MP leaves between general elections", "An election for the Lords", "A vote on a bill"], answer: 0, why: "It fills one empty seat without a whole new general election." },
  { id: "five", q: "What is the longest time allowed between general elections?", options: ["Two years", "Five years", "Ten years"], answer: 1, why: "A Parliament can last up to five years, and then there must be an election." },
  { id: "green", q: "What colour are the benches in the House of Commons?", options: ["Green", "Red", "Blue"], answer: 0, why: "The Commons is green and the Lords is red." },
  { id: "head", q: "Who is the head of state of the United Kingdom?", options: ["The Prime Minister", "The King", "The Speaker"], answer: 1, why: "The King is head of state. He does not take sides in politics." },
  { id: "pm", q: "What does the Prime Minister do?", options: ["Leads the government", "Chairs the Commons", "Runs the courts"], answer: 0, why: "The Prime Minister leads the government and chooses its ministers." },
  { id: "petition", q: "What does a petition get when it reaches 10,000 signatures?", options: ["A reply from the government", "A new law", "A day off school"], answer: 0, why: "At 10,000 signatures the government replies. At 100,000 Parliament considers a debate." },
  { id: "coalition", q: "What is a coalition?", options: ["Two or more parties working together in government", "A kind of election", "A department"], answer: 0, why: "When no party wins a majority, parties can join together to reach one." },
  { id: "tax", q: "Which of these brings in the most money for the government?", options: ["Income tax", "Fuel duty", "Alcohol duty"], answer: 0, why: "Income tax raises the most, with National Insurance and VAT next." },
  { id: "spend", q: "Which of these takes the biggest slice of government spending?", options: ["Defence", "Pensions and benefits", "Schools"], answer: 1, why: "Pensions and benefits are the single biggest area, about a quarter of the money." },
  { id: "scot", q: "Who decides how schools are run in Scotland?", options: ["The Scottish Government", "Your local library", "The House of Lords"], answer: 0, why: "Education is devolved, so Scotland runs its own." },
  { id: "councillor", q: "What does a councillor do?", options: ["Speaks up for a local area on the council", "Sits in the House of Lords", "Leads the army"], answer: 0, why: "Councillors are elected locally and help decide about local services." },
];
export function pickQuestions(n = 10, seed = 11) { return shuffled(TEAM_QUESTIONS, seed).slice(0, n); }

// Teams from the top score down. Teams on the same score share a place, and say so.
export function rankTeams(teams) {
  const sorted = [...teams].sort((a, b) => b.score - a.score);
  return sorted.map((t, i) => ({ ...t, place: i > 0 && sorted[i - 1].score === t.score ? null : i + 1, tied: sorted.filter((x) => x.score === t.score).length > 1 }))
    .map((t, i, all) => ({ ...t, place: t.place ?? all[i - 1].place }));
}

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

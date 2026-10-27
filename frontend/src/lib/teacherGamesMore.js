// The rules and facts behind the second wave of Teacher mode games, and the extra rounds added to the first ones. Pure, so they can be tested without a
// screen. Parties and policies in the made-up puzzles are invented on purpose, so no real party is picked on.
import { DECISIONS, shuffled, SCENARIOS, seatsOf, majorityOf, SEATS } from "./teacherGames";

// ---- Who decides?: three rounds of four ------------------------------------------------------------------------------------------------------------
export const ROUND_SIZE = 4;
export function rounds(items = DECISIONS, size = ROUND_SIZE, seed = 7) {
  const order = shuffled(items, seed);
  return Array.from({ length: Math.ceil(order.length / size) }, (_, i) => order.slice(i * size, i * size + size));
}
// Three stars for a round with no wrong answers, two for one, one for more.
export const starsFor = (mistakes) => (mistakes === 0 ? 3 : mistakes === 1 ? 2 : 1);

// ---- Make a law: the bill in trouble ---------------------------------------------------------------------------------------------------------------
// Where the bill goes on the track for each question: a step number (0 to 7) from the picture in MakeALaw.
export const LAW_TROUBLE = [
  { q: "MPs vote against the bill at its second reading. What happens?", options: ["The bill stops there", "It goes to the Lords anyway", "The King signs it"], answer: 0, at: 1, mood: "stopped", why: "A government bill that loses its vote at second reading does not go any further. That is why governments count their votes carefully." },
  { q: "The Lords want to change the bill and the Commons disagrees. What happens?", options: ["The Lords win", "The bill goes back and forth until both agree", "The bill is thrown away"], answer: 1, at: 6, mood: "bounce", why: "This is called ping-pong. The bill goes back and forth. The Lords can ask the Commons to think again, but the elected Commons has the final say." },
  { q: "Both Houses agree. Who has to give the bill Royal Assent before it is law?", options: ["The Speaker", "The Prime Minister", "The King"], answer: 2, at: 7, mood: "done", why: "The King gives Royal Assent. By long tradition it is always given, so it is the last step in making a law." },
];

// ---- Build a majority: hold the government together ------------------------------------------------------------------------------------------------
// What happens to a government's vote in three events. "Gov" votes against everyone else's: the government wins only if it has more.
export function govEvents(scenario, chosen, total = SEATS) {
  const seats = seatsOf(scenario, chosen);
  const sizes = scenario.parties.filter(([n]) => chosen.includes(n)).map(([, , n]) => n).sort((a, b) => b - a);
  const smallest = sizes[sizes.length - 1] ?? 0;
  const out = [
    { text: "An ordinary vote on a new law. Everyone in the government votes for it.", lose: 0, label: "Nobody rebels" },
    { text: "Ten MPs from the biggest government party rebel and vote against the new law.", lose: 10, label: "10 rebels" },
    { text: chosen.length > 1 ? "The smallest party in the government walks out over a row, and votes against it." : "A group of twenty of the party's own MPs walks out over a row, and votes against it.", lose: chosen.length > 1 ? smallest : 20, label: chosen.length > 1 ? "A party leaves" : "20 walk out" },
  ];
  return out.map((e) => {
    const gov = seats - e.lose;
    const rest = total - seats + e.lose;
    return { ...e, gov, rest, wins: gov > rest };
  });
}

// ---- Role detective: where they work ---------------------------------------------------------------------------------------------------------------
export const PLACES = [
  { key: "commons", name: "The House of Commons", colour: "#2F9E6B" },
  { key: "lords", name: "The House of Lords", colour: "#C13A4E" },
  { key: "downing", name: "10 Downing Street", colour: "#2B3350" },
  { key: "palace", name: "Buckingham Palace", colour: "#C7871A" },
  { key: "hall", name: "The town hall", colour: "#1E4FB8" },
  { key: "dept", name: "A government department", colour: "#6B7487" },
];
export const ROLE_PLACE = { mp: "commons", peer: "lords", pm: "downing", speaker: "commons", councillor: "hall", king: "palace", opposition: "commons", minister: "dept" };
export function placeOptions(roleKey, seed = 5) {
  const right = ROLE_PLACE[roleKey];
  const others = shuffled(PLACES.filter((p) => p.key !== right), seed + roleKey.length).slice(0, 3);
  return shuffled([PLACES.find((p) => p.key === right), ...others], seed + roleKey.length * 3);
}

// ---- Election day: count the votes -----------------------------------------------------------------------------------------------------------------
export const CANDIDATES = [
  { key: "a", name: "The Sunshine Party", colour: "#E8A21A" },
  { key: "b", name: "The Book Club Party", colour: "#7A5AF0" },
  { key: "c", name: "The Pizza Party", colour: "#E0367A" },
];
// Twelve ballot papers in the order they come out of the box. "x" is a paper with two crosses, which cannot be counted.
export const BALLOTS = ["a", "b", "a", "x", "c", "b", "a", "b", "a", "c", "b", "a"];
export function countBallots(papers = BALLOTS) {
  const out = { a: 0, b: 0, c: 0, x: 0 };
  for (const p of papers) out[p] += 1;
  const valid = out.a + out.b + out.c;
  const top = Math.max(out.a, out.b, out.c);
  const winners = ["a", "b", "c"].filter((k) => out[k] === top);
  return { ...out, valid, winners, share: top / valid, majority: top > valid / 2 };
}

// ---- Higher or lower (Follow the £10) --------------------------------------------------------------------------------------------------------------
export const HIGHER_LOWER = [["welfare", "health"], ["debt", "education"], ["education", "defence"], ["otherDept", "capital"], ["debt", "defence"]];

// ---- Lords and Commons ping-pong -------------------------------------------------------------------------------------------------------------------
export const AMENDMENTS = [
  { id: "review", text: "Look at how the bill is working after three years" },
  { id: "cost", text: "Stop the bill costing more than £1 million" },
  { id: "trial", text: "Try the bill out in a few places first" },
];
// What the Lords do when the Commons answers. "accept": the Commons agrees to the change. "reject": the Commons says no. "compromise": the Commons offers a
// smaller change. A first rejection is sent back by the Lords, who ask the Commons to think again. A second rejection, or a compromise, ends it.
export function lordsReply(action, timesRejected) {
  if (action === "accept") return { end: true, trips: 0, line: "The Lords and the Commons agree." };
  if (action === "compromise") return { end: true, trips: 1, line: "The Lords agree to the smaller change." };
  if (timesRejected === 0) return { end: false, trips: 1, line: "The Lords ask the Commons to think again." };
  return { end: true, trips: 1, line: "The Lords give way. The elected Commons has the final say." };
}
export const pingPongStars = (trips) => (trips <= 1 ? 3 : trips <= 3 ? 2 : 1);

// ---- Coalition negotiator --------------------------------------------------------------------------------------------------------------------------
export const POLICIES = [
  { key: "bikes", name: "More bike lanes" },
  { key: "swim", name: "Free swimming for under-16s" },
  { key: "trees", name: "Plant a million trees" },
  { key: "bus", name: "Cheaper bus fares" },
  { key: "lib", name: "Longer library hours" },
  { key: "sport", name: "More school sport" },
];
export const MAX_POLICIES = 4;
const party = (name, needs, refuses) => ({ name, needs, refuses });
export const PUZZLES = [
  { key: "hung", title: "A hung parliament", scenario: "hung", parties: [party("Red", ["bus", "swim"], ["lib"]), party("Blue", ["sport"], ["bus"]), party("Green", ["trees", "bikes"], ["sport"]), party("Gold", ["lib"], ["swim"])] },
  { key: "tight", title: "A tight squeeze", scenario: "tight", parties: [party("Red", ["bus", "lib"], ["trees"]), party("Blue", ["sport"], ["swim", "bus"]), party("Green", ["trees"], ["lib"]), party("Gold", ["swim"], ["sport"])] },
];
export const puzzleScenario = (puzzle) => SCENARIOS.find((s) => s.key === puzzle.scenario);

// Does a deal work? Every party in it must get what it needs, and nothing it will not accept, and together they need a majority.
export function checkDeal(puzzle, invited, policies, total = SEATS) {
  const sc = puzzleScenario(puzzle);
  const seats = seatsOf(sc, invited);
  const reactions = puzzle.parties.filter((p) => invited.includes(p.name)).map((p) => {
    const missing = p.needs.filter((k) => !policies.includes(k));
    const bad = p.refuses.filter((k) => policies.includes(k));
    if (bad.length) return { party: p.name, ok: false, why: `We will never agree to "${POLICIES.find((x) => x.key === bad[0]).name}".` };
    if (missing.length) return { party: p.name, ok: false, why: `We cannot join unless the deal has "${POLICIES.find((x) => x.key === missing[0]).name}".` };
    return { party: p.name, ok: true, why: "We can work with this." };
  });
  const allHappy = reactions.length > 0 && reactions.every((r) => r.ok);
  const enough = seats >= majorityOf(total);
  return { seats, reactions, allHappy, enough, ok: allHappy && enough };
}
// Every party group that can form a government in a puzzle, with the policies that would let it.
export function solutions(puzzle, total = SEATS) {
  const names = puzzle.parties.map((p) => p.name);
  const out = [];
  for (let mask = 1; mask < 1 << names.length; mask++) {
    const group = names.filter((_, i) => mask & (1 << i));
    const members = puzzle.parties.filter((p) => group.includes(p.name));
    const needs = [...new Set(members.flatMap((p) => p.needs))];
    const refused = new Set(members.flatMap((p) => p.refuses));
    if (needs.some((k) => refused.has(k)) || needs.length > MAX_POLICIES) continue;
    if (!checkDeal(puzzle, group, needs, total).ok) continue;
    out.push({ group, policies: needs });
  }
  return out;
}

// ---- Letter to your MP -----------------------------------------------------------------------------------------------------------------------------
export const TARGETS = [
  { key: "councillor", name: "A local councillor", blurb: "Decides about local things like parks and roads", greeting: "Dear Councillor Patel," },
  { key: "mp", name: "Your MP", blurb: "Speaks up for your area in Parliament, where national laws are made", greeting: "Dear Ms Okafor," },
  { key: "pm", name: "The Prime Minister", blurb: "Leads the government and is very busy", greeting: "Dear Prime Minister," },
];
export const ISSUES = [
  { key: "playground", title: "The playground is closing", target: "councillor", problem: "The playground on Mill Road is going to close, and nowhere else nearby has swings.", ask: "Please ask the council to keep it open.", right: "Councils look after parks and playgrounds, so a local councillor can act.", close: "Your MP can sometimes help by writing to the council, but councillors are the ones who decide about parks." },
  { key: "potholes", title: "Big potholes on our road", target: "councillor", problem: "There are deep potholes on our road, and they are dangerous for people on bikes.", ask: "Please ask the council to mend them.", right: "Councils look after most local roads, so a local councillor can act.", close: "Your MP can sometimes help by writing to the council, but councillors are the ones who decide about local roads." },
  { key: "plastic", title: "Too much plastic wrapping", target: "mp", problem: "Shops wrap fruit and vegetables in plastic that nobody needs, and it ends up as rubbish.", ask: "Please ask the government to change the rules so that shops use less plastic.", right: "Rules for the whole country are made in Parliament, so your MP is the person to ask.", close: "A councillor cannot change rules for the whole country, so your MP is a better person to ask." },
];
export const PM_NOTE = "You can write to the Prime Minister, but they get a huge number of letters. Your own MP is the best first step, because they speak up for your area.";
export const letterParts = (issue, target) => [
  target.greeting,
  "My name is Sam and I am 11. I live at 5 Orchard Lane, in your area.",
  issue.problem,
  issue.ask,
  "Thank you for reading my letter. I hope to hear back from you. Yours sincerely, Sam",
];
export const LETTER_SHUFFLE = [3, 0, 4, 2, 1];
export const NEXT_STEPS = [
  "Your letter arrives, with your address on it so they know you live in their area.",
  "Someone in the office reads it and decides how best to help.",
  "They may write to the people in charge, or ask a question in public.",
  "You get a reply, usually within a few weeks. It might be a yes, a no, or an explanation.",
];

// ---- Parliament bingo ------------------------------------------------------------------------------------------------------------------------------
export const TERMS = [
  ["Speaker", "I chair the debates in the Commons and keep order."],
  ["Hansard", "The written record of everything said in Parliament."],
  ["Whip", "An MP whose job is to make sure their party's MPs turn up and vote."],
  ["Division", "When MPs vote by walking through one of two doorways, called lobbies."],
  ["Bill", "An idea for a new law, before it has been agreed."],
  ["Act of Parliament", "A bill that has become a law."],
  ["Constituency", "The area an MP is elected to speak up for."],
  ["Manifesto", "A party's plan for what it will do if it wins."],
  ["Opposition", "The biggest party that is not in government. It questions what the government does."],
  ["Cabinet", "The group of senior ministers who meet to decide what the government will do."],
  ["Backbencher", "An MP who does not have a government or opposition front-bench job."],
  ["Minister", "A person picked by the head of the government to run one part of it, such as health or transport."],
  ["Peer", "A member of the House of Lords."],
  ["House of Lords", "The second part of Parliament, where members are not elected by the public."],
  ["House of Commons", "The part of Parliament where elected MPs debate and vote."],
  ["Mace", "A golden club on the table in the Commons that shows the House is at work."],
  ["Black Rod", "An officer who knocks three times on the Commons door at the State Opening."],
  ["Hung parliament", "When no party wins more than half of the seats."],
  ["By-election", "An election in one area when its MP leaves between general elections."],
  ["Majority", "More than half of the seats."],
  ["Coalition", "Two or more parties working together in government."],
  ["Amendment", "A change that someone suggests to a bill."],
  ["Royal Assent", "The King's agreement that turns a bill into a law."],
  ["Prime Minister's Questions", "The weekly time when MPs question the Prime Minister live in the Commons."],
  ["Select committee", "A small group of MPs who look into something and question experts."],
  ["Ballot paper", "The paper you mark with a cross to vote."],
  ["Candidate", "A person who is standing in an election."],
  ["Polling station", "The place where people go to vote."],
  ["Petition", "A request, signed by lots of people, asking for something to change."],
  ["Debate", "When MPs take turns to speak about an issue."],
].map(([term, clue]) => ({ term, clue }));
export const CARD = 16;
// A card of 16 different terms and the order the clues are read out. Both are fixed by the seed, so a class can replay the same one.
export function bingoCard(seed = 3) {
  const card = shuffled(TERMS, seed).slice(0, CARD);
  return { card, calls: shuffled(card, seed + 100) };
}
// Rows, columns and the two diagonals of a 4 by 4 card, as lists of square numbers.
export const LINES = [
  ...Array.from({ length: 4 }, (_, r) => [0, 1, 2, 3].map((c) => r * 4 + c)),
  ...Array.from({ length: 4 }, (_, c) => [0, 1, 2, 3].map((r) => r * 4 + c)),
  [0, 5, 10, 15], [3, 6, 9, 12],
];
export const completedLines = (marked) => LINES.filter((l) => l.every((i) => marked.includes(i)));

// ---- Jargon matcher --------------------------------------------------------------------------------------------------------------------------------
export const JARGON_ROUNDS = [
  { title: "In Parliament", colour: "#1E4FB8", pairs: [["Speaker", "Keeps order in the Commons"], ["Hansard", "The record of what is said in Parliament"], ["Whip", "Makes sure their party's MPs vote"], ["Mace", "A golden club that shows the Commons is at work"], ["Division", "A vote where MPs walk through doorways"], ["Amendment", "A change suggested to a bill"]] },
  { title: "Elections", colour: "#E0367A", pairs: [["Manifesto", "A party's plan if it wins"], ["Candidate", "A person standing in an election"], ["Constituency", "The area an MP speaks up for"], ["Ballot paper", "The paper you mark with a cross"], ["By-election", "A vote in one area when its MP leaves"], ["Majority", "More than half of the seats"]] },
  { title: "Money and power", colour: "#0E9AA7", pairs: [["Tax", "Money people and businesses pay to the government"], ["Budget", "The government's plan for raising and spending money"], ["National debt", "All the money the government has borrowed and not yet paid back"], ["Devolution", "Giving some decisions to Scotland, Wales and Northern Ireland"], ["Referendum", "A vote where everyone is asked one question"], ["Council tax", "What households pay to their local council"]] },
];
// The meanings in a fixed shuffle, so the right one is never beside its term.
export function meaningsOf(round, seed = 9) {
  const items = round.pairs.map(([term, meaning]) => ({ term, meaning }));
  let out = shuffled(items, seed);
  if (out.some((m, i) => m.term === round.pairs[i][0])) out = [...out.slice(1), out[0]];
  return out;
}

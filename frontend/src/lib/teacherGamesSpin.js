// Spot the spin: the content and rules for the media-literacy game in Teacher mode. Every claim is MADE UP, set in an invented town (Brookvale) and printed in an
// invented paper, so it can teach how a claim can mislead without pointing at any real person, party, paper or place. Each claim has a trick to name and a
// question a careful reader would ask, and ends by showing the fair version. Pure and tested.

// The tricks a pupil can name, in plain words. Each claim offers four of them, one of which is right.
export const TRICKS = {
  axis: "The chart does not start at zero",
  small: "A big percentage of a tiny number",
  quote: "A quote cut short",
  cause: "Two things that happen together, said to cause each other",
  sample: "Too few people asked, and not a fair mix",
  old: "The figure is out of date",
  loaded: "Words chosen to make you feel something",
  rate: "A count with nothing to compare it to",
  source: "No one says where it comes from",
};

export const PAPER = "The Brookvale Bugle";

// kind says which picture to draw (see components/teacher/games/SpotTheSpin.jsx). `seen` is what the claim shows, and `fair` what it hides. `options` lists the
// four tricks on offer and `trick` is the right one. `ask` is the question step: the first option is always written as the best one here, and shuffled by `order`.
export const SPIN_ROUNDS = [
  {
    title: "Look closely",
    blurb: "Tricks you can see in a picture or a number.",
    claims: [
      {
        id: "library", kind: "axis", headline: "Library visits SOAR in Brookvale!",
        seen: { bars: [["Last year", 90400], ["This year", 92100]], min: 90000 }, fair: { min: 0 },
        trick: "axis", options: ["small", "loaded", "axis", "old"],
        ask: ["Where does the bottom of the chart start, and what are the real numbers?", "Are the two bars the same colour?", "How many people work at the library?"],
        reveal: "Visits went from 90,400 to 92,100. That is up about 2%. The chart cut off the bottom of the bars, so a small rise looked like a leap.",
      },
      {
        id: "swim", kind: "small", headline: "Early swim club up 50%!",
        seen: { big: "+50%" }, fair: { before: 4, after: 6, unit: "members" },
        trick: "small", options: ["axis", "small", "cause", "quote"],
        ask: ["Fifty per cent of how many?", "Is the pool heated?", "Who is the lifeguard?"],
        reveal: "The club grew from 4 members to 6. That is 50%, but it is only two more people. A big percentage of a tiny number sounds bigger than it is.",
      },
      {
        id: "bus-lane", kind: "quote", headline: "Councillor on new bus lane: it is \"a disaster\"",
        seen: { said: "The new bus lane is a disaster" }, fair: { rest: " if the signs stay confusing, but with clear signs it will help buses run on time." },
        trick: "quote", options: ["cause", "sample", "loaded", "quote"],
        ask: ["What else did they say, and can I see all of it?", "What colour is the bus?", "How long is the bus lane?"],
        reveal: "The councillor was warning about confusing signs. Cutting the sentence short made it sound like the opposite of what they meant.",
      },
    ],
  },
  {
    title: "Think it through",
    blurb: "Tricks that need you to stop and wonder.",
    claims: [
      {
        id: "ice-cream", kind: "cause", headline: "Ice cream causes sunburn, says study!",
        seen: { a: "Ice creams sold", b: "Sunburn cases" }, fair: { hidden: "Hot, sunny weather" },
        trick: "cause", options: ["loaded", "rate", "cause", "sample"],
        ask: ["Is there something else that could cause both?", "Is ice cream expensive?", "Who drew the chart?"],
        reveal: "Both rise on hot days. Ice cream does not cause sunburn: the sunshine does. Two things moving together does not mean one makes the other happen.",
      },
      {
        id: "cafe", kind: "sample", headline: "9 out of 10 love the new café!",
        seen: { yes: 9, of: 10 }, fair: { who: "All ten were asked by the owner, at the café's own opening party." },
        trick: "sample", options: ["source", "old", "small", "sample"],
        ask: ["How many people were asked, and who were they?", "Is the café open on Sundays?", "What does the café sell?"],
        reveal: "Only ten people were asked, all at the café's party. That is too few, and not a fair mix of the town.",
      },
      {
        id: "waits", kind: "old", headline: "Brookvale has the longest bus waits in the county",
        seen: { fig: "35 minutes", label: "average wait" }, fair: { counted: "2009" },
        trick: "old", options: ["rate", "old", "quote", "axis"],
        ask: ["When was this counted?", "How many buses are there?", "Are the buses double-deckers?"],
        reveal: "The 35 minutes was counted in 2009. Buses and timetables may have changed a lot since. Always check when a figure was counted.",
      },
    ],
  },
  {
    title: "Words and sources",
    blurb: "Tricks in the way it is said, and who says it.",
    claims: [
      {
        id: "benches", kind: "loaded", headline: "SHOCKING! Council WASTES £2 million on benches!",
        seen: { loud: ["SHOCKING!", "WASTES"] }, fair: { plain: "The council spent £2 million on 4,000 benches over ten years." },
        trick: "loaded", options: ["loaded", "axis", "old", "small"],
        ask: ["What are the plain facts without the shouty words?", "Who painted the benches?", "Are the benches comfortable?"],
        reveal: "Take out the shouty words and the facts are: £2 million, 4,000 benches, ten years. Then you can decide for yourself whether that is good value.",
      },
      {
        id: "bypass", kind: "rate", headline: "More crashes on the bypass: 30 this year, up from 20!",
        seen: { bars: [["Last year", 20], ["This year", 30]] }, fair: { cars: [10000, 30000], per: [2, 1] },
        trick: "rate", options: ["small", "quote", "rate", "cause"],
        ask: ["How many cars use the road now, and how many did before?", "How long is the bypass?", "Who built the bypass?"],
        reveal: "Three times as many cars used the road. That is 2 crashes for every 1,000 cars last year and 1 for every 1,000 this year, so each journey was safer, even though the count went up.",
      },
      {
        id: "tram", kind: "source", headline: "Experts say the new tram will save £5 million",
        seen: { says: "Experts say" }, fair: { missing: "No names. No organisation. No report to read." },
        trick: "source", options: ["cause", "sample", "axis", "source"],
        ask: ["Which experts, and where can I read their report?", "How fast is the tram?", "Where will the tram stop?"],
        reveal: "Nobody says who the experts are or where the £5 million comes from, so there is nothing to check. A claim you cannot trace is only an opinion.",
      },
    ],
  },
];

// Last layer: four places a number might come from. The pupil picks the one closest to where it was really counted.
export const TRACE = [
  {
    id: "damp", q: "A post says \"1 in 5 Brookvale homes is damp\". Which of these is closest to where that number really came from?",
    options: ["A shared post with a screenshot of a headline", "A news site article that says \"a report found\"", "A charity's press release about its survey", "The survey report itself, with the questions, numbers and method"],
    answer: 3,
    why: "The closer you get to the people who counted, the more you can check. The post, the article and the press release each pass the number along, and each can change it a little on the way.",
  },
  {
    id: "people", q: "You want to know how many people live in Brookvale. Which is the best place to check?",
    options: ["A friend's message", "A company selling flats in Brookvale", "The official census results, published with their method", "A comment under a news article"],
    answer: 2,
    why: "Official statistics are counted carefully and published with how they were counted, so anyone can check them. A friend may be right, and a seller may be too, but they may only be guessing, or have a reason to make the number big.",
  },
];

// The four questions to carry away.
export const TOOLKIT = [
  ["Who says so?", "Is there a name, and a place to read the original?"],
  ["Compared with what?", "A number alone means little. How many before, and how many people or cars in all?"],
  ["What is missing?", "The rest of the quote, the other side of the chart, when it was counted, who was asked."],
  ["How does it make me feel?", "If it is shouting at you, slow down. Strong feelings are a good reason to check."],
];

// A claim's four tricks, as { key, text } in the order they are offered.
export const trickOptions = (claim) => claim.options.map((key) => ({ key, text: TRICKS[key] }));
// The three questions for a claim, shuffled by a fixed order so the best one is not always first, as { text, best }.
const ORDERS = [[0, 1, 2], [1, 0, 2], [2, 0, 1], [1, 2, 0], [0, 2, 1], [2, 1, 0]];
export function questionOptions(claim, index = 0) {
  const order = ORDERS[index % ORDERS.length];
  return order.map((i) => ({ text: claim.ask[i], best: i === 0 }));
}

// Bar heights for a pair of values from a chosen minimum, as 0 to 1. A minimum above zero is the squashed-axis trick.
export function barHeights(values, min) {
  const top = Math.max(...values);
  if (top <= min) return values.map(() => 1);
  return values.map((v) => Math.max(0, (v - min) / (top - min)));
}

// How much one value is above another, in whole per cent.
export const percentUp = (from, to) => Math.round(((to - from) / from) * 100);

export const allClaims = () => SPIN_ROUNDS.flatMap((r) => r.claims);

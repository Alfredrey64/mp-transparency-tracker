// The words and numbers behind the How to vote page that are not sentences in the page itself: the four steps, the three deadlines, the three answers the checker can
// give and the links at the foot. They live here so the Welsh version can be checked against them (see i18n/keys.js).

// The four steps: each has its own colour all the way through, from the route at the top to the card it opens.
export const STEPS = [
  { n: 1, id: "register", title: "Register to vote", short: "Register", colour: "#E0367A", fact: "12", unit: "working days before polling day", line: "Five minutes online" },
  { n: 2, id: "how", title: "Choose how you will vote", short: "Choose how", colour: "#7A5AF0", fact: "3", unit: "ways to vote", line: "Post, proxy or in person" },
  { n: 3, id: "id", title: "Get your photo ID ready", short: "Photo ID", colour: "#0E9AA7", fact: "Free", unit: "ID card if you have none", line: "Passport or licence will do" },
  { n: 4, id: "day", title: "Polling day", short: "Polling day", colour: "#E8741A", fact: "7am", unit: "to 10pm, and the queue at 10pm still votes", line: "A few minutes at the station" },
];

// The three deadlines that matter, drawn as bars hanging back from polling day: the longer the bar, the earlier you have to act.
export const DEADLINES = [
  { label: "Register to vote", days: 12, colour: "#E0367A" },
  { label: "Apply for a postal vote", days: 11, colour: "#7A5AF0" },
  { label: "Apply for a proxy vote", days: 6, colour: "#0E9AA7" },
];

// What the "Can I vote?" checker can say about an election.
export const RESULT_LABEL = { yes: "You can vote", check: "Check on gov.uk", no: "You can't vote" };

// The links at the foot of the page, as [address, name].
export const AFTER_LINKS = [["/marginals", "Which seats are close"], ["/constituency", "Look up your seat"], ["/partymatch", "Which party suits me?"], ["/howitworks", "How Parliament works"]];

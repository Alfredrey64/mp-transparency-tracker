// The walk-through on the bills page: one route a bill can take through Parliament, as steps for the animation and its caption.
// Bills can start in either House, so there is a route for each. See components/BillJourney.jsx.

export const STAGE_DEFS = [
  { key: "1st reading", label: "1st Reading" },
  { key: "2nd reading", label: "2nd Reading" },
  { key: "committee", label: "Committee" },
  { key: "report", label: "Report" },
  { key: "3rd reading", label: "3rd Reading" },
];

const WHO = { Commons: "MPs", Lords: "Peers" };
const STAGE_TEXT = {
  "1st reading": () => "The bill is introduced. Nothing is debated yet.",
  "2nd reading": (house) => `${WHO[house]} debate the main idea of the bill.`,
  committee: () => "The bill is checked line by line and changes are suggested.",
  report: () => "The changes made in committee are looked at again.",
  "3rd reading": (house) => (house === "Commons" ? "A final vote on the bill in the Commons." : "A last chance to change the wording, then the Lords pass it."),
};
const houseName = (h) => (h === "Commons" ? "House of Commons" : "House of Lords");

// One route: [{ house, col, show, glide, ms, phase, title, text }]. `phase` is which part of the journey it is: 0 the first House, 1 the other House, 2 ping-pong, 3 Royal Assent. `glide` false means the ring appears in place instead of sliding there.
export function buildRoute(first) {
  const second = first === "Commons" ? "Lords" : "Commons";
  const steps = [];
  const last = STAGE_DEFS.length - 1;
  const lead = first === "Commons" ? "Many bills start in the House of Commons." : "Some bills start in the House of Lords instead.";
  STAGE_DEFS.forEach((stage, col) => {
    steps.push({ phase: 0, house: first, col, show: true, glide: col > 0, ms: col === 0 ? 2300 : 1900, title: `${houseName(first)}: ${stage.label}`, text: `${col === 0 ? `${lead} ` : ""}${STAGE_TEXT[stage.key](first)}` });
  });
  steps.push({ phase: 1, house: first, col: last, show: false, glide: false, ms: 500, title: `Over to the ${houseName(second)}`, text: `The first House has passed it, so it goes to the other House.` });
  STAGE_DEFS.forEach((stage, col) => {
    steps.push({ phase: 1, house: second, col, show: true, glide: false, ms: col === 0 ? 2100 : 1900, title: `${houseName(second)}: ${stage.label}`, text: `${col === 0 ? "The other House goes through the same stages. " : ""}${STAGE_TEXT[stage.key](second)}` });
  });
  // Ping-pong: back and forth between the two Houses until they agree.
  const pong = "If the Houses disagree on changes, the bill goes back and forth between them until both agree. This is called ping-pong.";
  [first, second, first, second].forEach((house, i) => steps.push({ phase: 2, house, col: last, show: true, glide: true, ms: 1100, title: "Ping-pong", text: pong, hop: i }));
  const assent = { title: "Royal Assent", text: "When both Houses agree, the King gives Royal Assent and the bill becomes law.", done: true };
  steps.push({ phase: 3, house: second, col: last, show: true, glide: true, ms: 3200, ...assent });
  // A pause with the ring gone, so the next route's ring appears at its start instead of sliding back across the board.
  steps.push({ phase: 3, house: second, col: last, show: false, glide: false, ms: 700, ...assent });
  return steps;
}

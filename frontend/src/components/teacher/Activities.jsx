/** @jsxImportSource react */
import { useCallback, useEffect, useState } from "react";
import { MockElection, BudgetGame, PetitionGame } from "./Classroom";
import WhoDecides from "./games/WhoDecides";
import MakeALaw from "./games/MakeALaw";
import BuildMajority from "./games/BuildMajority";
import RoleDetective from "./games/RoleDetective";
import FollowTenPounds from "./games/FollowTenPounds";
import ElectionDay from "./games/ElectionDay";
import SpotTheLayer from "./games/SpotTheLayer";
import TeamQuiz from "./games/TeamQuiz";
import LordsPingPong from "./games/LordsPingPong";
import CoalitionNegotiator from "./games/CoalitionNegotiator";
import LetterToMP from "./games/LetterToMP";
import ParliamentBingo from "./games/ParliamentBingo";
import JargonMatcher from "./games/JargonMatcher";
import SpotTheSpin from "./games/SpotTheSpin";
import { HowTo } from "./games/kit";
import ClassCode from "./ClassCode";
import { GAME_KEYS, decode, encode, gamePath } from "../../lib/classCode";
import "../../classroom.css";
import "../../games.css";

// Every classroom activity and game, as a grid of cards. Pick one to play it in place, with a way back to the grid. All of them run in the browser, on a big
// screen or a pupil's own device, and nothing a pupil does is saved or sent anywhere.
const ACTIVITIES = [
  { key: "decide", title: "Who decides?", kind: "Game", time: "10 min", colour: "#C7871A", learn: "Sort everyday decisions into the council, the devolved governments and the UK Parliament, over three rounds.", how: ["Read the decision.", "Tap the layer that makes it.", "Earn up to three stars in each round."], icon: "layers", Component: WhoDecides },
  { key: "spot", title: "Spot the layer", kind: "Game", time: "12 min", colour: "#E8741A", learn: "Sort the things in a town by who decides, then collect a stamp for every nation as some answers change.", how: ["Pick England, Scotland, Wales or Northern Ireland.", "Tap things in the town and say who decides.", "Sort all four towns to fill your passport."], icon: "town", Component: SpotTheLayer },
  { key: "law", title: "Make a law", kind: "Game", time: "10 min", colour: "#1E4FB8", learn: "Put the eight steps of a bill in order, then face three challenges where the bill gets into trouble.", how: ["Tap the step that comes next and watch the bill move.", "When it is a law, take the challenge.", "Pick what really happens to the bill."], icon: "route", Component: MakeALaw },
  { key: "pingpong", title: "Lords and Commons ping-pong", kind: "Game", time: "8 min", colour: "#C13A4E", learn: "Send a bill back and forth between the two Houses and find out who has the final say.", how: ["The Lords suggest a change.", "Say yes, say no, or offer a smaller change.", "Count the trips before the bill reaches the King."], icon: "pingpong", Component: LordsPingPong },
  { key: "majority", title: "Build a majority", kind: "Game", time: "12 min", colour: "#2F9E6B", learn: "Join parties together to reach 326 of 650 seats, then test whether your government can survive three votes.", how: ["Tap parties to put them in the government.", "Reach 326 seats, with as few parties as you can.", "Test it: will it win each vote?"], icon: "seats", Component: BuildMajority },
  { key: "coalition", title: "Coalition negotiator", kind: "Game", time: "12 min", colour: "#7A5AF0", learn: "Nobody won enough seats. Find the one government that works, and the policies every party will accept.", how: ["Invite parties until you have 326 seats.", "Pick up to four policies for the deal.", "Propose it and see who walks out."], icon: "handshake", Component: CoalitionNegotiator },
  { key: "role", title: "Role detective", kind: "Game", time: "10 min", colour: "#7A5AF0", learn: "Work out who is who in politics from three clues, then find where they work for a bonus point.", how: ["Read the first clue and guess who it is.", "A wrong guess turns over the next clue.", "Pick the right building for a bonus point."], icon: "search", Component: RoleDetective },
  { key: "day", title: "Election day", kind: "Game", time: "12 min", colour: "#E0367A", learn: "Put ten events in order from the poll card to the new Prime Minister, then count the votes yourself.", how: ["Read each event and pick when it happens.", "Then you are the counting officer.", "Sort twelve ballot papers into piles and find the winner."], icon: "clock", Component: ElectionDay },
  { key: "letter", title: "Letter to your MP", kind: "Game", time: "10 min", colour: "#1E4FB8", learn: "Pick a problem, work out who can fix it, write the letter in the right order and send it.", how: ["Pick a problem to write about.", "Choose who to write to.", "Build the letter, then send it and see what happens next."], icon: "mail", Component: LetterToMP },
  { key: "ten", title: "Follow the £10", kind: "Game", time: "12 min", colour: "#0E9AA7", learn: "Share out ten pounds of public spending, see where it really goes, then play higher or lower.", how: ["Place all ten coins on the slices you think get most.", "Find out where the money really goes.", "Play higher or lower with five pairs."], icon: "pound", Component: FollowTenPounds },
  { key: "bingo", title: "Parliament bingo", kind: "Game", time: "10 min", colour: "#E8741A", learn: "A clue rolls out of the bingo machine. Find the word on your card and stamp it. Get a line, then a full house.", how: ["Read the clue.", "Tap the word on your card that it describes.", "Make a line for a bingo, then fill the card."], icon: "bingo", Component: ParliamentBingo },
  { key: "jargon", title: "Jargon matcher", kind: "Game", time: "8 min", colour: "#0E9AA7", learn: "Match hard political words with their plain-English meanings, over three rounds.", how: ["Tap a word on the left.", "Tap the meaning on the right.", "Match all six to finish the round."], icon: "cards", Component: JargonMatcher },
  { key: "spin", title: "Spot the spin", kind: "Game", time: "15 min", colour: "#D4577A", learn: "Read nine made-up news claims, name the trick that makes each one misleading, ask the question that gets to the truth, then trace where a number really came from.", how: ["Read the made-up claim and look at its picture.", "Name the trick, then pick the best question to ask.", "Watch the picture flip to the fair version."], icon: "spin", Component: SpotTheSpin },
  { key: "quiz", title: "Team quiz", kind: "Class activity", time: "15 min", colour: "#7A5AF0", learn: "Run a buzzer quiz for two to four teams, with a countdown and a scoreboard.", how: ["Split the class into teams.", "Tap the team that calls out first.", "Tap the answer they give."], icon: "buzzer", Component: TeamQuiz },
  { key: "election", title: "Run a mock election", kind: "Class activity", time: "20 min", colour: "#E0367A", learn: "Hold a vote by area, then announce the results like a real election night.", how: ["Name the parties and areas.", "Count the class's votes.", "Announce the results area by area."], icon: "ballot", Component: MockElection },
  { key: "budget", title: "Build the budget", kind: "Class activity", time: "20 min", colour: "#E8741A", learn: "Share out the real public budget, and see what every choice costs.", how: ["Move the sliders to share out the money.", "Watch what is left to place.", "Try the challenges."], icon: "coin", Component: BudgetGame },
  { key: "petition", title: "Run a petition", kind: "Class activity", time: "10 min", colour: "#0E9AA7", learn: "Gather signatures and see what 10,000 and 100,000 really do in Parliament.", how: ["Tap who signs.", "Watch the signatures climb.", "See what happens at 10,000 and 100,000."], icon: "paper", Component: PetitionGame },
];

const ICONS = {
  layers: <><path d="M4 8h16M6 13h12M8 18h8" /><path d="M12 3v2" /></>,
  route: <><circle cx="5" cy="6" r="2" /><circle cx="19" cy="18" r="2" /><path d="M7 6h6a3 3 0 0 1 0 6H9a3 3 0 0 0 0 6h8" /></>,
  seats: <><path d="M3 18a9 9 0 0 1 18 0" /><path d="M7 18a5 5 0 0 1 10 0" /><circle cx="12" cy="18" r="0.8" /></>,
  spin: <><circle cx="10" cy="10" r="6" /><path d="m15 15 6 6" /><path d="M7 12l2-2.6 2 1.6 2.2-3.2" /></>,
  search: <><circle cx="10" cy="10" r="6" /><path d="m15 15 6 6" /><path d="M8 10h4" /></>,
  ballot: <><rect x="5" y="9" width="14" height="11" rx="2" /><path d="M9 9V6l3-3 3 3v3M9 14l2 2 4-4" /></>,
  coin: <><circle cx="12" cy="12" r="8" /><path d="M9.5 9.5a3 3 0 0 1 5 1c0 2-3 2-3 4M12 17.5v.01" /></>,
  pound: <><circle cx="12" cy="12" r="8" /><path d="M14.5 8.5c-1-1-3.5-1-4.5.5-.8 1.3-.2 2.5-.5 4-.2 1-.8 1.5-1.5 2h8M8.5 12.5h5" /></>,
  clock: <><circle cx="12" cy="12" r="8" /><path d="M12 7v5l3 2" /></>,
  town: <><path d="M3 20V10l5-3 5 3v10M13 20v-7l4-2 4 2v7M3 20h18" /><path d="M6 13h4M6 16h4" /></>,
  buzzer: <><path d="M5 17h14l-1-5a6 6 0 0 0-12 0z" /><path d="M12 6V3M9 20h6" /></>,
  pingpong: <><path d="M4 8h12l-3-3M20 16H8l3 3" /></>,
  handshake: <><path d="M3 12l4-4 4 3 3-3 5 5-4 4-3-1-2 2-3-2z" /></>,
  mail: <><rect x="3" y="6" width="18" height="13" rx="2" /><path d="M3 8l9 6 9-6" /></>,
  bingo: <><rect x="4" y="4" width="16" height="16" rx="3" /><path d="M4 9.5h16M4 14.5h16M9.5 4v16M14.5 4v16" /></>,
  cards: <><rect x="3" y="6" width="10" height="13" rx="2" /><rect x="11" y="5" width="10" height="13" rx="2" /></>,
  paper: <><path d="M6 3h9l4 4v14H6z" /><path d="M14 3v5h5M9 12h6M9 16h6" /></>,
};

// A class code opens a game with its setup. `code` is one that came in the address. `pupil` is true when the page was opened from a class link, so the pupil
// sees the game and a way to more, and not the teacher's tabs.
export default function Activities({ code = null, pupil = false }) {
  const start = code ? decode(code, GAME_KEYS) : null;
  const [picked, setPicked] = useState(start?.key ?? null);
  const [settings, setSettings] = useState(start?.settings ?? {});
  const [kind, setKind] = useState("All");
  const [typed, setTyped] = useState(code && !start ? code : "");
  const [bad, setBad] = useState(Boolean(code && !start));
  const shown = ACTIVITIES.filter((x) => kind === "All" || x.kind === kind);
  const a = ACTIVITIES.find((x) => x.key === picked);
  const current = a ? encode(a.key, settings) : null;

  // The address follows the game and its setup, so a link copied from the browser is the same as the class code.
  useEffect(() => {
    window.history.replaceState(null, "", current ? gamePath(current) : "#/teacher/activities");
  }, [current]);
  const report = useCallback((s) => setSettings((prev) => (JSON.stringify(prev) === JSON.stringify(s) ? prev : s)), []);
  const open = (key, given = {}) => { setSettings(given); setPicked(key); setBad(false); };
  const join = (e) => {
    e.preventDefault();
    const found = decode(typed, GAME_KEYS);
    if (!found) { setBad(true); return; }
    setTyped("");
    open(found.key, found.settings);
  };

  if (a) {
    const Component = a.Component;
    return (
      <section className="cr act" aria-labelledby="h-tm-act" style={{ "--ac": a.colour }}>
        {pupil
          ? <a className="act-back" href="#/teacher/activities">More activities and games</a>
          : <button type="button" className="act-back" onClick={() => setPicked(null)}>All activities and games</button>}
        <h2 id="h-tm-act">{a.title}</h2>
        <p>{a.learn}</p>
        <HowTo steps={a.how} />
        {!pupil && <ClassCode code={current} />}
        <Component key={a.key} settings={settings} onSettings={report} />
      </section>
    );
  }
  return (
    <section className="cr act" aria-labelledby="h-tm-acts">
      <h2 id="h-tm-acts">Activities and games</h2>
      <p>Pick one. Each runs on a big screen or on pupils' own tablets, and nothing anyone does is saved or sent anywhere. The games teach one idea each, with a picture that moves as you play. The class activities are bigger and work well in groups. Every one has a class code to write on the board.</p>
      <form className="act-join" onSubmit={join}>
        <label htmlFor="act-code">Got a class code?</label>
        <div>
          <input id="act-code" value={typed} onChange={(e) => { setTyped(e.target.value); setBad(false); }} placeholder="For example BINGO-12" autoComplete="off" autoCapitalize="characters" spellCheck={false} aria-invalid={bad ? "true" : undefined} aria-describedby={bad ? "act-code-err" : undefined} />
          <button type="submit" className="btn btn-primary">Open the game</button>
        </div>
        {bad && <p id="act-code-err" role="alert">That code is not one of ours. A code starts with the name of a game, such as BINGO or QUIZ, and you can find each game's code on its card below.</p>}
      </form>
      <div className="act-filter" role="group" aria-label="Show">
        {["All", "Game", "Class activity"].map((k) => <button key={k} type="button" aria-pressed={kind === k} onClick={() => setKind(k)}>{k === "Game" ? "Games" : k === "Class activity" ? "Class activities" : "All"} <i>{ACTIVITIES.filter((x) => k === "All" || x.kind === k).length}</i></button>)}
      </div>
      <ul className="act-grid">
        {shown.map((x) => (
          <li key={x.key}>
            <button type="button" className="act-card" style={{ "--ac": x.colour }} onClick={() => open(x.key)}>
              <span className="act-ico" aria-hidden="true"><svg viewBox="0 0 24 24" width="30" height="30" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">{ICONS[x.icon]}</svg></span>
              <span className="act-tags"><i>{x.kind}</i><i>{x.time}</i></span>
              <b>{x.title}</b>
              <small>{x.learn}</small>
              <span className="act-code">Class code <code>{encode(x.key)}</code></span>
              <em>Play</em>
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}

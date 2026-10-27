/** @jsxImportSource react */
import { useState } from "react";
import { MockElection, BudgetGame, PetitionGame } from "./Classroom";
import WhoDecides from "./games/WhoDecides";
import MakeALaw from "./games/MakeALaw";
import BuildMajority from "./games/BuildMajority";
import RoleDetective from "./games/RoleDetective";
import "../../classroom.css";
import "../../games.css";

// Every classroom activity and game, as a grid of cards. Pick one to play it in place, with a way back to the grid. All of them run in the browser, on a big
// screen or a pupil's own device, and nothing a pupil does is saved or sent anywhere.
const ACTIVITIES = [
  { key: "decide", title: "Who decides?", kind: "Game", time: "8 min", colour: "#C7871A", learn: "Sort everyday decisions into the council, the devolved governments and the UK Parliament.", icon: "layers", Component: WhoDecides },
  { key: "law", title: "Make a law", kind: "Game", time: "6 min", colour: "#1E4FB8", learn: "Put the eight steps of a bill in order and watch it travel to Royal Assent.", icon: "route", Component: MakeALaw },
  { key: "majority", title: "Build a majority", kind: "Game", time: "10 min", colour: "#2F9E6B", learn: "Join parties together to reach 326 of 650 seats, and see why coalitions happen.", icon: "seats", Component: BuildMajority },
  { key: "role", title: "Role detective", kind: "Game", time: "8 min", colour: "#7A5AF0", learn: "Work out who is who in politics from three clues. Guess early for more points.", icon: "search", Component: RoleDetective },
  { key: "election", title: "Run a mock election", kind: "Class activity", time: "20 min", colour: "#E0367A", learn: "Hold a vote by area, then announce the results like a real election night.", icon: "ballot", Component: MockElection },
  { key: "budget", title: "Build the budget", kind: "Class activity", time: "20 min", colour: "#E8741A", learn: "Share out the real public budget, and see what every choice costs.", icon: "coin", Component: BudgetGame },
  { key: "petition", title: "Run a petition", kind: "Class activity", time: "10 min", colour: "#0E9AA7", learn: "Gather signatures and see what 10,000 and 100,000 really do in Parliament.", icon: "paper", Component: PetitionGame },
];

const ICONS = {
  layers: <><path d="M4 8h16M6 13h12M8 18h8" /><path d="M12 3v2" /></>,
  route: <><circle cx="5" cy="6" r="2" /><circle cx="19" cy="18" r="2" /><path d="M7 6h6a3 3 0 0 1 0 6H9a3 3 0 0 0 0 6h8" /></>,
  seats: <><path d="M3 18a9 9 0 0 1 18 0" /><path d="M7 18a5 5 0 0 1 10 0" /><circle cx="12" cy="18" r="0.8" /></>,
  search: <><circle cx="10" cy="10" r="6" /><path d="m15 15 6 6" /><path d="M8 10h4" /></>,
  ballot: <><rect x="5" y="9" width="14" height="11" rx="2" /><path d="M9 9V6l3-3 3 3v3M9 14l2 2 4-4" /></>,
  coin: <><circle cx="12" cy="12" r="8" /><path d="M9.500 9.500a3 3 0 0 1 5 1c0 2-3 2-3 4M12 17.500v.01" /></>,
  paper: <><path d="M6 3h9l4 4v14H6z" /><path d="M14 3v5h5M9 12h6M9 16h6" /></>,
};

export default function Activities() {
  const [picked, setPicked] = useState(null);
  const a = ACTIVITIES.find((x) => x.key === picked);
  if (a) {
    const Component = a.Component;
    return (
      <section className="cr act" aria-labelledby="h-tm-act" style={{ "--ac": a.colour }}>
        <button type="button" className="act-back" onClick={() => setPicked(null)}>All activities and games</button>
        <h2 id="h-tm-act">{a.title}</h2>
        <p>{a.learn}</p>
        <Component />
      </section>
    );
  }
  return (
    <section className="cr act" aria-labelledby="h-tm-acts">
      <h2 id="h-tm-acts">Activities and games</h2>
      <p>Pick one. Each runs on a big screen or on pupils' own tablets, and nothing anyone does is saved or sent anywhere. The games teach one idea each, with a picture that moves as you play. The class activities are bigger and work well in groups.</p>
      <ul className="act-grid">
        {ACTIVITIES.map((x) => (
          <li key={x.key}>
            <button type="button" className="act-card" style={{ "--ac": x.colour }} onClick={() => setPicked(x.key)}>
              <span className="act-ico" aria-hidden="true"><svg viewBox="0 0 24 24" width="30" height="30" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">{ICONS[x.icon]}</svg></span>
              <span className="act-tags"><i>{x.kind}</i><i>{x.time}</i></span>
              <b>{x.title}</b>
              <small>{x.learn}</small>
              <em>Play</em>
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}

/** @jsxImportSource react */
import { useState } from "react";
import { DECIDERS, NATIONS, TOWN, answerFor, whyFor, tally, changesWith } from "../../../lib/teacherGames";

// Spot the layer: a little town with eight things in it. Tap one (in the picture or in the list) and say who decides about it. Pick a different nation and
// the town stays the same, but some answers change, because health, schools and policing are run differently in England, Scotland, Wales and Northern Ireland.
const SHORT = { council: "Council", devolved: "Devolved", uk: "UK" };
const colourOf = (key) => DECIDERS.find((d) => d.key === key).colour;

// Each thing has a place on the ground line (y 236) and a size for the invisible area that catches a tap.
// "tag" is where the label of the answer sits once a thing has been sorted, kept clear of its neighbours.
const SPOTS = {
  hospital: { x: 14, w: 112, top: 112, tag: [70, 100] },
  school: { x: 134, w: 118, top: 138, tag: [193, 96] },
  police: { x: 260, w: 92, top: 148, tag: [306, 140] },
  tax: { x: 362, w: 92, top: 146, tag: [408, 124] },
  flats: { x: 468, w: 72, top: 100, tag: [504, 92] },
  park: { x: 556, w: 96, top: 140, tag: [602, 120] },
  navy: { x: 668, w: 122, top: 170, tag: [730, 170] },
  bins: { x: 166, w: 122, top: 248, road: true, tag: [338, 270] },
};

function Thing({ id }) {
  switch (id) {
    case "hospital": return <g><rect x="22" y="126" width="96" height="110" rx="6" fill="#fff" stroke="#C8D2E6" strokeWidth="2" /><rect x="54" y="150" width="32" height="32" rx="4" fill="#fff" /><path d="M64 154h12v10h10v12H76v10H64v-10H54v-12h10z" fill="#D64550" /><rect x="40" y="198" width="20" height="38" rx="3" fill="#9FB4D9" /><rect x="80" y="198" width="20" height="38" rx="3" fill="#9FB4D9" /></g>;
    case "school": return <g><rect x="142" y="158" width="102" height="78" rx="5" fill="#C9694A" /><path d="M134 160l59-34 59 34z" fill="#8E3F2B" /><circle cx="193" cy="152" r="8" fill="#fff" /><rect x="180" y="198" width="26" height="38" rx="3" fill="#F5E2B8" />{[152, 218].map((x) => <rect key={x} x={x} y="176" width="18" height="18" rx="2" fill="#F5E2B8" />)}<line x1="193" y1="126" x2="193" y2="108" stroke="#5B6784" strokeWidth="2" /><path d="M193 108h16l-4 5 4 5h-16z" fill="#E8741A" /></g>;
    case "police": return <g><rect x="268" y="168" width="76" height="68" rx="5" fill="#2C4A8F" /><rect x="298" y="198" width="18" height="38" rx="3" fill="#C9D6F2" /><circle cx="306" cy="182" r="9" fill="#fff" /><circle cx="306" cy="182" r="5" fill="#2C4A8F" /><rect x="272" y="156" width="68" height="14" rx="3" fill="#1B2F63" /></g>;
    case "tax": return <g><rect x="370" y="162" width="76" height="74" rx="4" fill="#E6E9F0" stroke="#B7BFD0" strokeWidth="2" /><path d="M362 164l46-28 46 28z" fill="#B7BFD0" />{[380, 400, 420].map((x) => <rect key={x} x={x} y="176" width="10" height="60" fill="#fff" stroke="#B7BFD0" />)}<text x="408" y="159" textAnchor="middle" fontSize="20" fontWeight="800" fill="#3F4A66" fontFamily="Newsreader, Georgia, serif">£</text></g>;
    case "flats": return <g><rect x="474" y="108" width="60" height="128" rx="4" fill="#8FA7C9" />{[0, 1, 2, 3, 4].map((r) => [0, 1].map((c) => <rect key={`${r}${c}`} x={484 + c * 24} y={120 + r * 22} width="14" height="14" rx="2" fill="#F5F8FF" />))}<rect x="538" y="196" width="3" height="40" fill="#6B5A3C" /><rect x="528" y="184" width="24" height="16" rx="2" fill="#fff" stroke="#6B5A3C" strokeWidth="2" /></g>;
    case "park": return <g><rect x="562" y="206" width="82" height="30" rx="8" fill="#BFE5B0" /><rect x="598" y="170" width="8" height="40" fill="#7A5A3A" /><circle cx="602" cy="156" r="26" fill="#2F9E6B" /><circle cx="586" cy="168" r="16" fill="#3FB37C" /><rect x="618" y="218" width="22" height="5" rx="2" fill="#7A5A3A" /><rect x="620" y="223" width="3" height="10" fill="#7A5A3A" /><rect x="636" y="223" width="3" height="10" fill="#7A5A3A" /></g>;
    case "navy": return <g><rect x="660" y="210" width="140" height="40" fill="#5AA9E6" /><path d="M676 214h104l-14 22h-76z" fill="#6B7487" /><rect x="706" y="192" width="30" height="22" rx="3" fill="#8C95A8" /><rect x="718" y="178" width="6" height="16" fill="#6B7487" /><rect x="742" y="200" width="22" height="6" rx="3" fill="#59627A" /></g>;
    default: return <g><rect x="170" y="252" width="86" height="28" rx="6" fill="#2F9E6B" /><rect x="256" y="258" width="26" height="22" rx="4" fill="#1F7A52" /><circle cx="190" cy="282" r="8" fill="#2B3350" /><circle cx="240" cy="282" r="8" fill="#2B3350" /><circle cx="190" cy="282" r="3" fill="#fff" /><circle cx="240" cy="282" r="3" fill="#fff" /><rect x="184" y="258" width="48" height="6" rx="2" fill="#fff" opacity="0.4" /></g>;
  }
}

export default function SpotTheLayer() {
  const [nation, setNation] = useState("england");
  const [done, setDone] = useState({});
  const [picked, setPicked] = useState(null);
  const [feedback, setFeedback] = useState(null);
  const n = NATIONS.find((x) => x.key === nation);
  const item = TOWN.find((i) => i.id === picked);
  const finished = Object.keys(done).length === TOWN.length;

  const choose = (key) => { setNation(key); setDone({}); setPicked(null); setFeedback(null); };
  const pickItem = (id) => { if (done[id]) return; setPicked(id); setFeedback(null); };
  const answer = (layer) => {
    if (!item) return;
    if (layer === answerFor(item, nation)) {
      setDone((d) => ({ ...d, [item.id]: layer }));
      setFeedback({ right: true, why: whyFor(item, nation) });
      setPicked(null);
    } else {
      setFeedback({ right: false, why: "Not quite. Think about who looks after it, and try another layer." });
    }
  };
  const counts = tally(nation);
  const layerName = (d) => (d.key === "devolved" ? n.devolved : d.title);
  const changes = changesWith(nation);

  return (
    <div className="gm gm-spot">
      <div className="gm-scen" role="tablist" aria-label="Which nation is the town in?">
        {NATIONS.map((x) => <button key={x.key} type="button" role="tab" aria-selected={nation === x.key} onClick={() => choose(x.key)}>{x.name}</button>)}
      </div>
      <p className="gm-help">This town is in <b>{n.name}</b>. Tap something in the town, then say who decides about it. Try another nation afterwards: the town stays the same, but some answers change.</p>
      <svg className="gm-pyramid gm-town" viewBox="0 0 800 300" aria-hidden="true">
        <defs><linearGradient id="gs-sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#BFE3FF" /><stop offset="1" stopColor="#F4FAFF" /></linearGradient></defs>
        <rect width="800" height="300" rx="22" fill="url(#gs-sky)" />
        <circle cx="720" cy="52" r="26" fill="#F9D66A" />
        <ellipse cx="150" cy="56" rx="46" ry="14" fill="#fff" opacity="0.9" /><ellipse cx="190" cy="46" rx="30" ry="12" fill="#fff" opacity="0.9" />
        <path d="M0 220 Q150 160 300 210 T600 200 T800 205 V240 H0z" fill="#CBEBC0" />
        <rect y="236" width="800" height="64" fill="#8C95A8" /><rect y="236" width="660" height="6" fill="#B9C1D2" />
        <path d="M20 270h50M120 270h50M300 270h50M400 270h50M500 270h50M600 270h50" stroke="#fff" strokeWidth="4" strokeLinecap="round" opacity="0.8" />
        {TOWN.map((i) => {
          const s = SPOTS[i.id];
          const layer = done[i.id];
          const on = picked === i.id;
          return (
            <g key={i.id} className="gm-thing" data-state={layer ? "done" : on ? "picked" : "idle"} style={{ "--gc": layer ? colourOf(layer) : "#1E4FB8" }} onClick={() => pickItem(i.id)}>
              <Thing id={i.id} />
              <rect className="gm-ring" x={s.x - 4} y={s.top - 6} width={s.w + 8} height={(s.road ? 300 : 240) - s.top + 4} rx="14" fill="none" />
              {layer && <g transform={`translate(${s.tag[0]} ${s.tag[1]})`}><rect x="-34" y="-11" width="68" height="22" rx="11" fill={colourOf(layer)} /><text y="4" textAnchor="middle" fontSize="12" fontWeight="800" fill="#fff" fontFamily="Public Sans, system-ui, sans-serif">{SHORT[layer]}</text></g>}
            </g>
          );
        })}
      </svg>
      <ul className="gm-things">
        {TOWN.map((i) => (
          <li key={i.id}>
            <button type="button" className="gm-thing-btn" data-state={done[i.id] ? "done" : picked === i.id ? "picked" : "idle"} style={{ "--gc": done[i.id] ? colourOf(done[i.id]) : "#1E4FB8" }} onClick={() => pickItem(i.id)} aria-pressed={picked === i.id}>
              <b>{i.name}</b>
              <small>{done[i.id] ? SHORT[done[i.id]] : "Tap to sort"}</small>
            </button>
          </li>
        ))}
      </ul>
      {!finished ? (
        <>
          <div className="gm-prompt" data-empty={item ? "0" : "1"}>
            <small>{Object.keys(done).length} of {TOWN.length} sorted</small>
            <b>{item ? `Who decides ${item.ask}?` : "Pick something in the town."}</b>
            <span>{item ? `In ${n.name}` : "Tap it in the picture or in the list."}</span>
          </div>
          <div className="gm-choices" role="group" aria-label="Who decides?">
            {DECIDERS.map((d) => (
              <button key={d.key} type="button" className="gm-choice" style={{ "--gc": d.colour }} data-state="idle" onClick={() => answer(d.key)} disabled={!item}>
                <b>{layerName(d)}</b>
                <small>{d.blurb}</small>
              </button>
            ))}
          </div>
          <p className="gm-feedback" data-right={feedback?.right ? "1" : "0"} aria-live="polite">{feedback ? (feedback.right ? `Yes. ${feedback.why}` : feedback.why) : "Your answer will show here."}</p>
        </>
      ) : (
        <div className="gm-end">
          <b>The whole town is sorted</b>
          <p>
            In {n.name}, {counts.council ?? 0} {counts.council === 1 ? "thing is" : "things are"} looked after by the council, {counts.devolved ?? 0} by {nation === "england" ? "a devolved government (England has none, so it is never the answer here)" : n.devolved}, and {counts.uk ?? 0} by the UK government.
            {changes.length > 0 && ` Try another nation. The ${changes.map((c) => c.name.replace(/^The /, "")).join(", ")} change${changes.length === 1 ? "s" : ""} from place to place.`}
          </p>
          <button type="button" className="btn btn-primary btn-lg" onClick={() => choose(nation)}>Sort it again</button>
        </div>
      )}
    </div>
  );
}

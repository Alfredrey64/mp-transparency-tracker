/** @jsxImportSource react */
import { useEffect, useRef, useState } from "react";
import { AMENDMENTS, lordsReply, pingPongStars } from "../../../lib/teacherGamesMore";
import { Coach, Confetti, Dots, Stars } from "./kit";

// Lords and Commons ping-pong: the Lords have sent a bill back with three changes. As the Commons, the class says yes, no, or offers a smaller change, and
// the bill hops across to the Lords and back. Every trip is counted. The Lords ask the Commons to think again once, and then give way, because the
// elected House has the final say.
const SPOT = { commons: [170, 168], lords: [630, 168], king: [400, 70] };
const CHOICES = [["accept", "Accept the change", "Say yes. The bill stays with the Commons."], ["reject", "Say no", "Send the bill back to the Lords."], ["compromise", "Offer a smaller change", "Meet the Lords halfway."]];

export default function LordsPingPong() {
  const [idx, setIdx] = useState(0);
  const [phase, setPhase] = useState("choose");
  const [at, setAt] = useState("commons");
  const [rejected, setRejected] = useState(0);
  const [trips, setTrips] = useState(0);
  const [hop, setHop] = useState(0);
  const [line, setLine] = useState(null);
  const [burst, setBurst] = useState(0);
  const timer = useRef(null);
  const done = phase === "done";
  const amendment = AMENDMENTS[idx];

  useEffect(() => () => clearTimeout(timer.current), []);

  const decide = (action) => {
    if (phase !== "choose") return;
    const reply = lordsReply(action, rejected);
    setPhase("flying");
    if (action === "accept") {
      setLine({ mood: "happy", text: reply.line });
      timer.current = setTimeout(() => setPhase(reply.end ? "between" : "choose"), 700);
      return;
    }
    setAt("lords"); setHop((h) => h + 1);
    setLine({ mood: "think", text: "The bill hops across to the Lords…" });
    timer.current = setTimeout(() => {
      setTrips((t) => t + reply.trips);
      setAt("commons"); setHop((h) => h + 1);
      if (reply.end) { setPhase("between"); setLine({ mood: "happy", text: reply.line }); setRejected(0); }
      else { setRejected((r) => r + 1); setPhase("choose"); setLine({ mood: "oops", text: `${reply.line} The bill is back with you.` }); }
    }, 1100);
  };
  const next = () => {
    if (idx + 1 >= AMENDMENTS.length) {
      setAt("king"); setHop((h) => h + 1); setPhase("done"); setBurst((b) => b + 1); setLine(null);
    } else { setIdx(idx + 1); setPhase("choose"); setRejected(0); setLine(null); }
  };
  const restart = () => { clearTimeout(timer.current); setIdx(0); setPhase("choose"); setAt("commons"); setRejected(0); setTrips(0); setLine(null); setHop((h) => h + 1); };
  const [x, y] = SPOT[at];

  return (
    <div className="gm gm-pp">
      <Confetti burst={burst} />
      <p className="gm-help">The Lords have passed a bill and sent it back with <b>three changes</b>. You are the <b>Commons</b>. Decide what to do with each one. Every trip to the Lords takes time, so try to get the bill to the King quickly.</p>
      <svg className="gm-pyramid gm-pp-scene" viewBox="0 0 800 260" role="img" aria-label={`The bill is with ${at === "king" ? "the King" : at === "lords" ? "the Lords" : "the Commons"}. Trips so far: ${trips}`}>
        <defs><linearGradient id="pp-sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#DDE9FF" /><stop offset="1" stopColor="#F7FAFF" /></linearGradient></defs>
        <rect width="800" height="260" rx="22" fill="url(#pp-sky)" />
        <g className="gm-pp-house" data-on={at === "commons" ? "1" : "0"}>
          <rect x="60" y="120" width="220" height="110" rx="14" fill="#2F9E6B" />
          <path d="M50 124 L170 82 L290 124z" fill="#1F7A52" />
          {[90, 130, 170, 210, 250].map((px) => <rect key={px} x={px - 8} y="140" width="16" height="64" rx="3" fill="#E4F6EC" />)}
          <text x="170" y="222" textAnchor="middle" fontSize="16" fontWeight="800" fill="#fff" fontFamily="Public Sans, system-ui, sans-serif">The Commons</text>
          <text x="170" y="250" textAnchor="middle" fontSize="12.5" fontWeight="700" fill="#1F7A52" fontFamily="Public Sans, system-ui, sans-serif">Elected MPs</text>
        </g>
        <g className="gm-pp-house" data-on={at === "lords" ? "1" : "0"}>
          <rect x="520" y="120" width="220" height="110" rx="14" fill="#C13A4E" />
          <path d="M510 124 L630 82 L750 124z" fill="#9C2A3C" />
          {[550, 590, 630, 670, 710].map((px) => <rect key={px} x={px - 8} y="140" width="16" height="64" rx="3" fill="#FBE5E8" />)}
          <text x="630" y="222" textAnchor="middle" fontSize="16" fontWeight="800" fill="#fff" fontFamily="Public Sans, system-ui, sans-serif">The Lords</text>
          <text x="630" y="250" textAnchor="middle" fontSize="12.5" fontWeight="700" fill="#9C2A3C" fontFamily="Public Sans, system-ui, sans-serif">Members who are not elected</text>
        </g>
        <path d="M200 90 Q400 -10 600 90" fill="none" stroke="#B8C3D9" strokeWidth="4" strokeDasharray="2 10" strokeLinecap="round" />
        <g className="gm-pp-crown" data-on={at === "king" ? "1" : "0"} transform="translate(400 70)"><path d="M-30 18 l-6 -34 l18 14 l18 -26 l18 26 l18 -14 l-6 34z" fill="#F2B632" stroke="#C7871A" strokeWidth="3" strokeLinejoin="round" /><rect x="-30" y="18" width="60" height="10" rx="3" fill="#C7871A" /></g>
        <g className="gm-bill" style={{ transform: `translate(${x}px, ${y - 40}px)` }}>
          <g key={hop} className="gm-hop">
            <rect x="-17" y="-22" width="34" height="44" rx="5" fill="#fff" stroke="#1B2438" strokeWidth="2.5" />
            <path d="M-8 -10 h16 M-8 0 h16 M-8 10 h10" stroke="#1B2438" strokeWidth="2.5" strokeLinecap="round" />
            {done && <path d="M-6 6 l6 7 l12 -16" stroke="#1FA97C" strokeWidth="5" fill="none" strokeLinecap="round" strokeLinejoin="round" />}
          </g>
        </g>
      </svg>
      <div className="gm-score"><span>{done ? "The bill is law" : `Change ${idx + 1} of ${AMENDMENTS.length}`}</span><b aria-live="polite">{trips} {trips === 1 ? "trip" : "trips"} to the Lords</b></div>
      <Dots at={done ? AMENDMENTS.length : idx + (phase === "between" ? 1 : 0)} total={AMENDMENTS.length} label="Changes dealt with" />
      {!done ? (
        <>
          <div className="gm-prompt" key={`${idx}-${rejected}`}>
            <small>{rejected ? "The Lords ask you to think again" : "The Lords suggest a change"}</small>
            <b>{amendment.text}</b>
            <span>{rejected ? "Will you still say no?" : "What will the Commons do?"}</span>
          </div>
          <div className="gm-choices" role="group" aria-label="What will the Commons do?">
            {CHOICES.map(([k, title, sub]) => (
              <button key={k} type="button" className="gm-choice" style={{ "--gc": k === "accept" ? "#2F9E6B" : k === "reject" ? "#C13A4E" : "#C7871A" }} data-state="idle" disabled={phase !== "choose"} onClick={() => decide(k)}>
                <b>{k === "reject" && rejected ? "Say no again" : title}</b><small>{sub}</small>
              </button>
            ))}
          </div>
          <Coach mood={line?.mood ?? "think"} right={line?.mood === "happy"}>{line?.text ?? "Pick what the Commons will do. Saying no sends the bill back to the Lords."}</Coach>
          <div className="cr-row">{phase === "between" && <button type="button" className="btn btn-primary btn-lg" onClick={next}>{idx + 1 >= AMENDMENTS.length ? "Send the bill to the King" : "Next change"}</button>}</div>
        </>
      ) : (
        <div className="gm-end">
          <Stars n={pingPongStars(trips)} />
          <b>Royal Assent: the bill is now a law</b>
          <p>It made {trips} {trips === 1 ? "trip" : "trips"} to the Lords. The Lords can ask the Commons to think again, and that can slow a bill down, but the elected Commons has the final say. That is why most of the time the Lords give way after one or two rounds.</p>
          <button type="button" className="btn btn-primary btn-lg" onClick={restart}>Play again</button>
        </div>
      )}
    </div>
  );
}

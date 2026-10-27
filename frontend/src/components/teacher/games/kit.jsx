/** @jsxImportSource react */
// The small pieces every Teacher mode game shares: a friendly owl coach whose face and wings change with how the answer went, a burst of confetti, progress
// dots, stars, and a how-to-play strip. Everything here is drawn in SVG or CSS, so it stays sharp and light, and calms down for anyone who asks for less motion.

// mood: "think" (waiting), "happy" (right), "oops" (not quite), "cheer" (a round or game won).
export function Owl({ mood = "think", size = 64 }) {
  const eye = mood === "oops" ? [0, 2] : mood === "think" ? [1.5, -1] : [0, 0];
  return (
    <svg className="gm-owl" data-mood={mood} viewBox="0 0 64 64" width={size} height={size} aria-hidden="true">
      <g className="gm-owl-wing gm-owl-wl"><ellipse cx="11" cy="40" rx="7" ry="14" fill="#6C4BD6" /></g>
      <g className="gm-owl-wing gm-owl-wr"><ellipse cx="53" cy="40" rx="7" ry="14" fill="#6C4BD6" /></g>
      <path d="M16 20 L12 6 L26 14z M48 20 L52 6 L38 14z" fill="#7A5AF0" />
      <ellipse cx="32" cy="38" rx="21" ry="22" fill="#8A6BF0" />
      <ellipse cx="32" cy="46" rx="12" ry="12" fill="#F1EBFF" />
      <circle cx="23" cy="30" r="9" fill="#fff" /><circle cx="41" cy="30" r="9" fill="#fff" />
      <g className="gm-owl-eyes"><circle cx={23 + eye[0]} cy={30 + eye[1]} r="4.5" fill="#1B2438" /><circle cx={41 + eye[0]} cy={30 + eye[1]} r="4.5" fill="#1B2438" /><circle cx={24.5 + eye[0]} cy={28.5 + eye[1]} r="1.5" fill="#fff" /><circle cx={42.5 + eye[0]} cy={28.5 + eye[1]} r="1.5" fill="#fff" /></g>
      {mood === "oops" && <path d="M15 20l9 3M49 20l-9 3" stroke="#3B2A8F" strokeWidth="2.5" strokeLinecap="round" />}
      {mood === "think" && <path d="M36 20l9-2" stroke="#3B2A8F" strokeWidth="2.5" strokeLinecap="round" />}
      <path d="M28 37 L32 43 L36 37z" fill="#F2A71B" />
      <path d="M24 58 l-2 4 M28 58 l0 4 M36 58 l0 4 M40 58 l2 4" stroke="#F2A71B" strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  );
}

// A speech bubble from the owl. It keeps the "gm-feedback" class and the data-right flag that the rest of the page and the tests look for.
export function Coach({ mood = "think", right, children }) {
  return (
    <div className="gm-feedback gm-coach" data-right={right ? "1" : "0"} data-mood={mood} aria-live="polite">
      <Owl mood={mood} size={56} />
      <p key={String(children)}>{children}</p>
    </div>
  );
}

// Twenty-four pieces that fly out and fall. The key makes a new burst each time `burst` goes up, and a burst of zero shows nothing.
const BITS = ["#F2B632", "#E0367A", "#7A5AF0", "#2F9E6B", "#1E4FB8", "#E8741A"];
export function Confetti({ burst = 0 }) {
  if (!burst) return null;
  return (
    <div className="gm-confetti" key={burst} aria-hidden="true">
      {Array.from({ length: 28 }, (_, i) => {
        const a = (i / 28) * Math.PI * 2 + (burst % 5) * 0.3;
        const d = 120 + ((i * 53) % 150);
        return <i key={i} style={{ "--dx": `${Math.cos(a) * d}px`, "--dy": `${Math.sin(a) * d - 80}px`, "--r": `${(i * 97) % 720}deg`, "--c": BITS[i % BITS.length], animationDelay: `${(i % 6) * 22}ms` }} />;
      })}
    </div>
  );
}

export function Dots({ at, total, label = "Progress" }) {
  return (
    <ol className="gm-dots" aria-label={`${label}: ${Math.min(at, total)} of ${total}`}>
      {Array.from({ length: total }, (_, i) => <li key={i} data-state={i < at ? "done" : i === at ? "now" : "todo"} />)}
    </ol>
  );
}

export function Stars({ n, of = 3 }) {
  return (
    <span className="gm-stars" role="img" aria-label={`${n} of ${of} stars`}>
      {Array.from({ length: of }, (_, i) => (
        <svg key={i} viewBox="0 0 24 24" width="38" height="38" data-on={i < n ? "1" : "0"} style={{ animationDelay: `${i * 160}ms` }}>
          <path d="M12 2.5l2.9 6.1 6.6.8-4.9 4.6 1.3 6.6L12 17.3 6.1 20.6l1.3-6.6L2.5 9.400l6.6-.8z" />
        </svg>
      ))}
    </span>
  );
}

// A strip above each game: three short steps, and what the game is for.
export function HowTo({ steps, learn }) {
  return (
    <div className="gm-howto">
      <b>How to play</b>
      <ol>{steps.map((s, i) => <li key={s}><span aria-hidden="true">{i + 1}</span>{s}</li>)}</ol>
      {learn && <p><i>You will learn:</i> {learn}</p>}
    </div>
  );
}

// Round pictures of the places a role works, for the detective game.
export function PlaceIcon({ k, size = 44 }) {
  const body = {
    commons: <><rect x="6" y="20" width="36" height="20" rx="3" fill="#2F9E6B" /><rect x="10" y="14" width="6" height="26" fill="#3FB37C" /><rect x="32" y="14" width="6" height="26" fill="#3FB37C" /><rect x="20" y="8" width="8" height="32" fill="#fff" /><circle cx="24" cy="16" r="3" fill="#2F9E6B" /></>,
    lords: <><rect x="6" y="20" width="36" height="20" rx="3" fill="#C13A4E" /><path d="M6 20l18-12 18 12z" fill="#9C2A3C" /><rect x="20" y="28" width="8" height="12" fill="#F7D7DC" /></>,
    downing: <><rect x="8" y="8" width="32" height="32" rx="3" fill="#2B3350" /><rect x="17" y="18" width="14" height="22" rx="2" fill="#111827" /><text x="24" y="15.5" textAnchor="middle" fontSize="8" fontWeight="800" fill="#fff" fontFamily="Public Sans, sans-serif">10</text><circle cx="24" cy="30" r="1.5" fill="#F2B632" /></>,
    palace: <><rect x="6" y="22" width="36" height="18" fill="#E9C56A" /><rect x="6" y="18" width="36" height="5" fill="#C7871A" /><path d="M20 18v-6l4-4 4 4v6z" fill="#C7871A" /><rect x="20" y="28" width="8" height="12" fill="#8E5E0E" /></>,
    hall: <><rect x="8" y="18" width="32" height="22" fill="#1E4FB8" /><rect x="19" y="4" width="10" height="16" fill="#4A78D8" /><circle cx="24" cy="11" r="3.5" fill="#fff" /><path d="M24 11v-2.5M24 11l2 1" stroke="#1E4FB8" strokeWidth="1.2" /><rect x="21" y="28" width="6" height="12" fill="#C9D6F2" /></>,
    dept: <><rect x="8" y="10" width="32" height="30" rx="3" fill="#6B7487" />{[0, 1, 2].map((r) => [0, 1, 2].map((c) => <rect key={`${r}${c}`} x={13 + c * 9} y={15 + r * 8} width="5" height="5" fill="#E6EAF2" />))}</>,
  };
  return <svg viewBox="0 0 48 48" width={size} height={size} aria-hidden="true">{body[k]}</svg>;
}

// A tiny picture for each made-up policy in the coalition game.
export function PolicyIcon({ k, size = 26 }) {
  const body = {
    bikes: <><circle cx="7" cy="17" r="5" /><circle cx="19" cy="17" r="5" /><path d="M7 17l5-8h5l2 8M12 9l3 8M10 9h4" /></>,
    swim: <><circle cx="16" cy="6" r="2.2" /><path d="M3 18c2-2 4-2 6 0s4 2 6 0 4-2 6 0M5 13l6-3 4 3" /></>,
    trees: <><path d="M12 3l6 8h-3l5 7H4l5-7H6z" /><path d="M12 18v4" /></>,
    bus: <><rect x="3" y="5" width="18" height="12" rx="3" /><path d="M3 11h18M7 20v-3M17 20v-3" /><circle cx="7.5" cy="14" r="0.8" /><circle cx="16.5" cy="14" r="0.8" /></>,
    lib: <><path d="M4 5h6a2 2 0 0 1 2 2v13a2 2 0 0 0-2-2H4zM20 5h-6a2 2 0 0 0-2 2v13a2 2 0 0 1 2-2h6z" /></>,
    sport: <><circle cx="12" cy="12" r="8" /><path d="M4.5 8c4 1 11 1 15 0M4.5 16c4-1 11-1 15 0M12 4v16" /></>,
  };
  return <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{body[k]}</svg>;
}

// A round face for a party at the negotiating table.
export function Face({ colour, mood = "calm", size = 56 }) {
  return (
    <svg className="gm-face" data-mood={mood} viewBox="0 0 56 56" width={size} height={size} aria-hidden="true">
      <circle cx="28" cy="28" r="25" fill={colour} />
      <circle cx="19" cy="23" r="5" fill="#fff" /><circle cx="37" cy="23" r="5" fill="#fff" />
      <circle cx="19" cy={mood === "angry" ? 24.5 : 23} r="2.5" fill="#1B2438" /><circle cx="37" cy={mood === "angry" ? 24.5 : 23} r="2.5" fill="#1B2438" />
      {mood === "angry" && <path d="M12 16l13 5M44 16l-13 5" stroke="#1B2438" strokeWidth="3" strokeLinecap="round" />}
      {mood === "happy" && <path d="M16 35q12 12 24 0" fill="none" stroke="#fff" strokeWidth="3.5" strokeLinecap="round" />}
      {mood === "angry" && <path d="M18 42q10-8 20 0" fill="none" stroke="#fff" strokeWidth="3.5" strokeLinecap="round" />}
      {mood === "calm" && <path d="M19 38h18" stroke="#fff" strokeWidth="3.5" strokeLinecap="round" />}
    </svg>
  );
}

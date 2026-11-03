/** @jsxImportSource react */
import { useEffect, useRef, useState } from "react";
import { useGo } from "./useGo";
import "../../handover.css";

// What changes when a government changes, and what does not: for each kind of person, a row of posts that someone holds. Press "After the change" (or wait, it plays once
// as it scrolls into view) and the people in a minister's or special adviser's posts leave while new people take them, and the civil servants stay where they are. The point it
// makes is that the job stays and the person changes.
//   tiers  [{ name, colour, before, after, stays }]
const POSTS = 5;

function Person() {
  return (
    <svg viewBox="0 0 30 40" aria-hidden="true">
      <circle cx="15" cy="10" r="7.5" />
      <path d="M2 40 C2 26 8 21 15 21 C22 21 28 26 28 40 Z" />
    </svg>
  );
}

export default function Handover({ tiers, head = "What happens to each when the government changes", before = "Before the change", after = "After the change" }) {
  const [ref, go] = useGo(0.3);
  const [stage, setStage] = useState(0);
  const chosen = useRef(false);

  // Left alone, it plays by itself a moment after it comes into view. Pressing either button takes over.
  useEffect(() => {
    if (go !== "1") return undefined;
    const t = setTimeout(() => { if (!chosen.current) setStage(1); }, 1500);
    return () => clearTimeout(t);
  }, [go]);
  const pick = (n) => { chosen.current = true; setStage(n); };

  return (
    <figure ref={ref} className="ho" data-go={go} data-stage={stage}>
      <figcaption>{head}</figcaption>
      <div className="ho-ctl" role="group" aria-label="Before or after the change">
        <button type="button" aria-pressed={stage === 0} onClick={() => pick(0)}>{before}</button>
        <span className="ho-track" aria-hidden="true"><i /></span>
        <button type="button" aria-pressed={stage === 1} onClick={() => pick(1)}>{after}</button>
      </div>
      <ul>
        {tiers.map((t, i) => (
          <li key={t.name} className="ho-lane" data-stays={t.stays ? "1" : "0"} style={{ "--tc": t.colour, "--i": i }}>
            <div className="ho-who">
              <b>{t.name}</b>
              <span className="ho-chip">
                <span data-on={stage === 0 ? "1" : "0"}>In post</span>
                <span data-on={stage === 1 ? "1" : "0"}>{t.stays ? "Still in post" : "New people"}</span>
              </span>
            </div>
            <div className="ho-posts" aria-hidden="true">
              {Array.from({ length: POSTS }, (_, k) => (
                <span key={k} className="ho-post" style={{ "--k": k }}>
                  <span className="ho-old"><Person /></span>
                  {!t.stays && <span className="ho-new"><Person /></span>}
                  {t.stays && <span className="ho-tick" />}
                </span>
              ))}
            </div>
            <p className="ho-say" aria-live="polite">
              <span data-on={stage === 0 ? "1" : "0"}>{t.before}</span>
              <span data-on={stage === 1 ? "1" : "0"}>{t.after}</span>
            </p>
          </li>
        ))}
      </ul>
    </figure>
  );
}

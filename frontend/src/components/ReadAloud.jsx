/** @jsxImportSource react */
import { useEffect, useRef, useState } from "react";
import { createReader, collectBlocks, langOf, hasVoice } from "../lib/readAloud";
import { useT } from "../lib/useLang";
import "../access.css";

// The small player that appears while a page is being read aloud: play or pause, back and forward a paragraph, speed, and stop. The paragraph being read is
// lit on the page and kept in view. It reads what is selected if there is a selection, and the main part of the page if not.
const RATES = [0.8, 1, 1.25, 1.5];

export default function ReadAloud({ onClose }) {
  const t = useT();
  // The language of what will be read: Welsh only where the page itself is in Welsh.
  const [lang] = useState(() => langOf(document.getElementById("main-content")));
  const noVoice = lang === "cy" && !hasVoice("cy");
  const [state, setState] = useState("idle");
  const [now, setNow] = useState(-1);
  const [info, setInfo] = useState({ text: "", count: 0 });
  const [rate, setRate] = useState(1);
  const reader = useRef(null);
  const blocks = useRef([]);
  const lit = useRef(null);

  const clear = () => { lit.current?.classList.remove("ra-now"); lit.current = null; };
  const show = (i) => {
    clear();
    setNow(i);
    const b = blocks.current[i];
    if (!b) return;
    setInfo({ text: b.text, count: blocks.current.length });
    lit.current = b.el; b.el.classList.add("ra-now");
    const r = b.el.getBoundingClientRect();
    if (r.top < 90 || r.bottom > window.innerHeight - 110) b.el.scrollIntoView({ block: "center", behavior: document.documentElement.hasAttribute("data-calm") ? "auto" : "smooth" });
  };

  useEffect(() => {
    if (noVoice) return undefined;
    const r = createReader({ lang, onBlock: (i) => { if (i < 0) { clear(); setNow(-1); } else show(i); }, onState: setState });
    reader.current = r;
    const sel = window.getSelection?.();
    const chosen = sel && !sel.isCollapsed ? sel.toString().replace(/\s+/g, " ").trim() : "";
    const main = document.getElementById("main-content") ?? document.body;
    if (chosen.length > 1) blocks.current = [{ el: sel.anchorNode?.parentElement ?? main, text: chosen }];
    else blocks.current = collectBlocks(main);
    // The first heading is the page's name, so the reading starts there.
    r.play(blocks.current);
    return () => { r.stop(); clear(); };
  // eslint-disable-next-line react-hooks/exhaustive-deps -- started once, when the player opens
  }, []);

  const excerpt = info.text;
  const toggle = () => { const r = reader.current; if (state === "playing") r.pause(); else if (state === "paused") r.resume(); else r.play(blocks.current, 0); };
  const ended = state === "idle";
  if (noVoice) {
    return (
      <div className="ra-bar" role="region" aria-label={t("Reading aloud")}>
        <div className="ra-text"><small>{t("No Welsh voice")}</small><span>{t("This device has no Welsh voice, so it cannot read this page aloud. A screen reader that speaks Welsh will still work.")}</span></div>
        <div className="ra-ctl"><button type="button" onClick={onClose} aria-label={t("Stop and close")}><svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18" /></svg></button></div>
      </div>
    );
  }
  return (
    <div className="ra-bar" role="region" aria-label={t("Reading aloud")}>
      <div className="ra-text" aria-live="off"><small>{ended ? t("Finished") : state === "paused" ? t("Paused") : t("Reading {n} of {total}", { n: now + 1, total: info.count })}</small><span>{ended ? t("Press play to hear it again.") : excerpt.slice(0, 110) + (excerpt.length > 110 ? "…" : "")}</span></div>
      <div className="ra-ctl">
        <button type="button" onClick={() => reader.current.skip(-1)} aria-label={t("Back a paragraph")} disabled={ended}><svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor" aria-hidden="true"><path d="M6 6h2v12H6zM20 6v12L9.5 12z" /></svg></button>
        <button type="button" className="ra-play" onClick={toggle} aria-label={state === "playing" ? t("Pause") : t("Play")}>
          {state === "playing"
            ? <svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor" aria-hidden="true"><path d="M7 5h4v14H7zM13 5h4v14h-4z" /></svg>
            : <svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor" aria-hidden="true"><path d="M8 5v14l11-7z" /></svg>}
        </button>
        <button type="button" onClick={() => reader.current.skip(1)} aria-label={t("Forward a paragraph")} disabled={ended}><svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor" aria-hidden="true"><path d="M16 6h2v12h-2zM4 6v12l10.5-6z" /></svg></button>
        <label className="ra-rate"><span className="sr-only">{t("Speed, times normal")}</span>
          <select value={rate} onChange={(e) => { const v = Number(e.target.value); setRate(v); reader.current.setRate(v); }}>
            {RATES.map((r) => <option key={r} value={r}>{`${r}x`}</option>)}
          </select>
        </label>
        <button type="button" onClick={onClose} aria-label={t("Stop and close")}><svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18" /></svg></button>
      </div>
    </div>
  );
}

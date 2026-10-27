/** @jsxImportSource react */
import { useState, useEffect } from "react";
import { SIZE_LABELS, isDefault } from "../lib/display";
import { useDisplay, startListening } from "../lib/useDisplay";
import { supported } from "../lib/readAloud";
import { useTheme } from "../lib/ThemeContext";
import "../access.css";

// The controls for how the site looks and sounds. Shown in the panel from the header and on the Accessibility page. Every change applies at once and is kept
// on this device only.
function Switch({ on, onChange, label, hint }) {
  const id = `ax-sw-${label.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;
  return (
    <li className="ax-row">
      <span><b id={id}>{label}</b><small>{hint}</small></span>
      <button type="button" role="switch" aria-checked={on} aria-labelledby={id} className="ax-switch" onClick={() => onChange(!on)}><i /></button>
    </li>
  );
}

export default function AccessibilityControls({ onListen }) {
  const [prefs, change, reset] = useDisplay();
  const { theme, toggleTheme } = useTheme();
  const [narrow, setNarrow] = useState(() => window.innerWidth < 470);
  useEffect(() => {
    const on = () => setNarrow(window.innerWidth < 470);
    window.addEventListener("resize", on);
    return () => window.removeEventListener("resize", on);
  }, []);
  const canSpeak = supported();

  return (
    <div className="ax">
      <section aria-labelledby="ax-size-h">
        <h3 id="ax-size-h">Text size</h3>
        <div className="ax-seg" role="group" aria-label="Text size">
          {SIZE_LABELS.map((l, i) => <button key={l} type="button" aria-pressed={prefs.size === i} onClick={() => change({ size: i })} style={{ fontSize: 14 + i * 2 }}>{l}</button>)}
        </div>
        {narrow && prefs.size > 0 && <p className="ax-note">On a small screen the text grows only as far as the page can fit.</p>}
      </section>
      <section aria-labelledby="ax-look-h">
        <h3 id="ax-look-h">How it looks</h3>
        <ul className="ax-list">
          <Switch on={theme === "dark"} onChange={toggleTheme} label="Dark mode" hint="Light writing on a dark background." />
          <Switch on={prefs.readable} onChange={(v) => change({ readable: v })} label="Easy-to-read letters" hint="A plain typeface with clear, different letter shapes, and no italics." />
          <Switch on={prefs.spacing} onChange={(v) => change({ spacing: v })} label="Roomier text" hint="More space between lines, words and letters, with lines lined up on the left." />
          <Switch on={prefs.contrast} onChange={(v) => change({ contrast: v })} label="Stronger contrast" hint="Darker text, darker lines and a thicker ring around whatever you have selected." />
          <Switch on={prefs.links} onChange={(v) => change({ links: v })} label="Underline links" hint="Every link underlined, so none depends on colour." />
          <Switch on={prefs.calm} onChange={(v) => change({ calm: v })} label="Calmer motion" hint="Nothing moves, drifts or fades on its own." />
        </ul>
      </section>
      <section aria-labelledby="ax-listen-h">
        <h3 id="ax-listen-h">Listen</h3>
        {canSpeak
          ? <><p className="ax-note">Hear this page read out loud, using the voice on your device. Select some text first to hear just that.</p><button type="button" className="btn btn-primary" onClick={() => { onListen?.(); startListening(); }}>Listen to this page</button></>
          : <p className="ax-note">This browser cannot read pages aloud. Your device&apos;s own screen reader or reading tool will still work on this site.</p>}
      </section>
      <div className="ax-foot">
        <button type="button" className="btn btn-secondary" onClick={reset} disabled={isDefault(prefs)}>Put everything back to standard</button>
        <p className="ax-note">These choices stay on this device. They are never sent to us.</p>
      </div>
    </div>
  );
}

/** @jsxImportSource react */
import { useState, useEffect } from "react";
import { SIZE_LABELS, isDefault } from "../lib/display";
import { useDisplay, startListening } from "../lib/useDisplay";
import { supported } from "../lib/readAloud";
import { useTheme } from "../lib/ThemeContext";
import { useT, useLang } from "../lib/useLang";
import { LANG_NAMES, LANGS } from "../lib/i18n";
import "../access.css";

// The controls for how the site looks and sounds. Shown in the panel from the header and on the Accessibility page. Every change applies at once and is kept
// on this device only.
function Switch({ name, on, onChange, label, hint }) {
  // The id comes from a fixed name, so it stays the same whatever language is on.
  const id = `ax-sw-${name}`;
  return (
    <li className="ax-row">
      <span><b id={id}>{label}</b><small>{hint}</small></span>
      <button type="button" role="switch" aria-checked={on} aria-labelledby={id} className="ax-switch" onClick={() => onChange(!on)}><i /></button>
    </li>
  );
}

export default function AccessibilityControls({ onListen }) {
  const t = useT();
  const [lang, setLang] = useLang();
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
        <h3 id="ax-size-h">{t("Text size")}</h3>
        <div className="ax-seg" role="group" aria-label={t("Text size")}>
          {SIZE_LABELS.map((l, i) => <button key={l} type="button" aria-pressed={prefs.size === i} onClick={() => change({ size: i })} style={{ fontSize: 14 + i * 2 }}>{t(l)}</button>)}
        </div>
        {narrow && prefs.size > 0 && <p className="ax-note">{t("On a small screen the text grows only as far as the page can fit.")}</p>}
      </section>
      <section aria-labelledby="ax-lang-h">
        <h3 id="ax-lang-h">{t("Language")}</h3>
        <div className="ax-seg" role="group" aria-label={t("Language")}>
          {LANGS.map((code) => <button key={code} type="button" lang={code} aria-pressed={lang === code} onClick={() => setLang(code)}>{LANG_NAMES[code]}</button>)}
        </div>
      </section>
      <section aria-labelledby="ax-look-h">
        <h3 id="ax-look-h">{t("How it looks")}</h3>
        <ul className="ax-list">
          <Switch name="dark" on={theme === "dark"} onChange={toggleTheme} label={t("Dark mode")} hint={t("Light writing on a dark background.")} />
          <Switch name="readable" on={prefs.readable} onChange={(v) => change({ readable: v })} label={t("Easy-to-read letters")} hint={t("A plain typeface with clear, different letter shapes, and no italics.")} />
          <Switch name="spacing" on={prefs.spacing} onChange={(v) => change({ spacing: v })} label={t("Roomier text")} hint={t("More space between lines, words and letters, with lines lined up on the left.")} />
          <Switch name="contrast" on={prefs.contrast} onChange={(v) => change({ contrast: v })} label={t("Stronger contrast")} hint={t("Darker text, darker lines and a thicker ring around whatever you have selected.")} />
          <Switch name="links" on={prefs.links} onChange={(v) => change({ links: v })} label={t("Underline links")} hint={t("Every link underlined, so none depends on colour.")} />
          <Switch name="calm" on={prefs.calm} onChange={(v) => change({ calm: v })} label={t("Calmer motion")} hint={t("Nothing moves, drifts or fades on its own.")} />
        </ul>
      </section>
      <section aria-labelledby="ax-listen-h">
        <h3 id="ax-listen-h">{t("Listen")}</h3>
        {canSpeak
          ? <><p className="ax-note">{t("Hear this page read out loud, using the voice on your device. Select some text first to hear just that.")}</p><button type="button" className="btn btn-primary" onClick={() => { onListen?.(); startListening(); }}>{t("Listen to this page")}</button></>
          : <p className="ax-note">{t("This browser cannot read pages aloud. Your device's own screen reader or reading tool will still work on this site.")}</p>}
      </section>
      <div className="ax-foot">
        <button type="button" className="btn btn-secondary" onClick={reset} disabled={isDefault(prefs)}>{t("Put everything back to standard")}</button>
        <p className="ax-note">{t("These choices stay on this device. They are never sent to us.")}</p>
      </div>
    </div>
  );
}

import { COLORS, FONT_BODY, FONT_DISPLAY } from "../../theme";
import { Person } from "./art";
import { SKIN } from "./palette";
import { CHARACTERS, DEFAULT_NAMES, NAME_LIMIT, cleanName, shuffleNames } from "./characters";

// "Name the characters": four boxes, one for each child in the chapter 1 stories. What is typed changes the words under every story picture, the
// name tags in the pictures and the preview on this page, and is kept on this device only.

const LOOKS = {
  sam: { kid: true, long: true, shirt: "#E0365B", skin: SKIN[2], hair: "#2B1D14" },
  maya: { kid: true, long: true, shirt: "#7A5AF0", skin: SKIN[3], hair: "#1E1410" },
  leo: { kid: true, shirt: "#0E9AA7", skin: SKIN[1], hair: "#2B1D14" },
  amira: { kid: true, long: true, shirt: "#F2622A", skin: SKIN[2], hair: "#1E1410" },
};
const COLOURS = { sam: "#E0365B", maya: "#7A5AF0", leo: "#0E9AA7", amira: "#F2622A" };

export default function NameThem({ names, onChange }) {
  const set = (key, raw) => onChange({ ...names, [key]: raw.replace(/[^\p{L}\p{M}' -]/gu, "").slice(0, NAME_LIMIT) });
  const tidy = (key) => onChange({ ...names, [key]: cleanName(names[key], DEFAULT_NAMES[key]) });
  const changed = CHARACTERS.some((c) => names[c.key] !== DEFAULT_NAMES[c.key]);
  return (
    <section aria-labelledby="h-tm-names" className="tm-names" style={{ marginTop: 34 }}>
      <div className="tm-names-head">
        <div>
          <h2 id="h-tm-names" style={{ fontFamily: FONT_DISPLAY, fontSize: 26, fontWeight: 700, color: COLORS.ink, margin: 0 }}>Name the characters</h2>
          <p style={{ fontFamily: FONT_BODY, fontSize: 15, lineHeight: 1.55, color: COLORS.inkSoft, margin: "6px 0 0", maxWidth: 620 }}>
            Four children star in the stories in chapter 1. Give them names from your class, or let the class vote on them. The new names appear in the words and on name tags in the pictures. They are kept on this device only.
          </p>
        </div>
        <div className="tm-names-actions">
          <button type="button" className="btn btn-secondary" onClick={() => onChange(shuffleNames())}>Surprise me</button>
          <button type="button" className="btn btn-secondary" disabled={!changed} onClick={() => onChange({ ...DEFAULT_NAMES })}>Back to the originals</button>
        </div>
      </div>
      <ul className="tm-names-grid">
        {CHARACTERS.map((c) => (
          <li key={c.key} style={{ "--c": COLOURS[c.key] }}>
            <svg viewBox="-44 -128 88 140" aria-hidden="true" className="tm-names-face"><Person x={0} y={0} {...LOOKS[c.key]} mood="happy" /></svg>
            <label htmlFor={`tm-name-${c.key}`}>
              <b>{c.story}</b>
              <span>The child who {c.role}</span>
            </label>
            <input
              id={`tm-name-${c.key}`} value={names[c.key]} maxLength={NAME_LIMIT} autoComplete="off" spellCheck="false"
              onChange={(e) => set(c.key, e.target.value)} onBlur={() => tidy(c.key)}
            />
          </li>
        ))}
      </ul>
    </section>
  );
}

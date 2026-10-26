import { useState } from "react";
import { COLORS, FONT_BODY, FONT_DISPLAY } from "../../theme";
import { Person } from "./art";
import { SKIN } from "./palette";
import { CHARACTERS, DEFAULT_NAMES, NAME_LIMIT, cleanName, shuffleNames, parseClassList, pickFromList, loadClassList, saveClassList } from "./characters";

// "Name the characters": four boxes, one for each child in the chapter 1 stories. What is typed changes the words under every story picture, the
// name tags in the pictures and the preview on this page, and is kept on this device only. A class list can be pasted in, and four names are picked
// from it at random (or choose them one by one, by hand).

const LOOKS = {
  sam: { kid: true, long: true, shirt: "#E0365B", skin: SKIN[2], hair: "#2B1D14" },
  maya: { kid: true, long: true, shirt: "#7A5AF0", skin: SKIN[3], hair: "#1E1410" },
  leo: { kid: true, shirt: "#0E9AA7", skin: SKIN[1], hair: "#2B1D14" },
  amira: { kid: true, long: true, shirt: "#F2622A", skin: SKIN[2], hair: "#1E1410" },
};
const COLOURS = { sam: "#E0365B", maya: "#7A5AF0", leo: "#0E9AA7", amira: "#F2622A" };

// The four boxes on their own, with the buttons that fill them in. Used here and in the presenter's Names panel.
export function NameFields({ names, onChange, compact = false }) {
  const [list, setList] = useState(loadClassList);
  const [note, setNote] = useState("");
  const parsed = parseClassList(list);
  const set = (key, raw) => onChange({ ...names, [key]: raw.replace(/[^\p{L}\p{M}' -]/gu, "").slice(0, NAME_LIMIT) });
  const tidy = (key) => onChange({ ...names, [key]: cleanName(names[key], DEFAULT_NAMES[key]) });
  const changed = CHARACTERS.some((c) => names[c.key] !== DEFAULT_NAMES[c.key]);
  const fromList = () => {
    const picked = pickFromList(parsed);
    if (picked) { onChange(picked); setNote(""); } else setNote(parsed.length === 0 ? "Paste your class list first." : "Add at least four different names.");
  };
  return (
    <div className="tm-namefields" data-compact={compact ? "1" : "0"}>
      <ul className="tm-names-grid">
        {CHARACTERS.map((c) => (
          <li key={c.key} style={{ "--c": COLOURS[c.key] }}>
            {!compact && <svg viewBox="-44 -128 88 140" aria-hidden="true" className="tm-names-face"><Person x={0} y={0} {...LOOKS[c.key]} mood="happy" /></svg>}
            <label htmlFor={`tm-name-${c.key}${compact ? "-p" : ""}`}>
              <b>{c.story}</b>
              <span>The child who {c.role}</span>
            </label>
            <input
              id={`tm-name-${c.key}${compact ? "-p" : ""}`} value={names[c.key]} maxLength={NAME_LIMIT} autoComplete="off" spellCheck="false"
              onChange={(e) => set(c.key, e.target.value)} onBlur={() => tidy(c.key)}
            />
          </li>
        ))}
      </ul>
      <div className="tm-names-actions">
        <button type="button" className="btn btn-secondary" onClick={() => { onChange(shuffleNames()); setNote(""); }}>Pick for me</button>
        {parsed.length >= 4 && <button type="button" className="btn btn-secondary" onClick={fromList}>Pick from my class list</button>}
        <button type="button" className="btn btn-secondary" disabled={!changed} onClick={() => { onChange({ ...DEFAULT_NAMES }); setNote(""); }}>Back to the originals</button>
      </div>
      <details className="tm-classlist" open={!compact && parsed.length > 0 ? undefined : undefined}>
        <summary>Use names from my class</summary>
        <label htmlFor={`tm-classlist${compact ? "-p" : ""}`}>Type or paste your class's first names, one on each line. Four are picked at random. Kept on this device only.</label>
        <textarea
          id={`tm-classlist${compact ? "-p" : ""}`} rows={compact ? 3 : 5} spellCheck="false" value={list}
          onChange={(e) => { setList(e.target.value); saveClassList(e.target.value); setNote(""); }}
          placeholder={"Ava\nKofi\nPriya\nOllie\nMaya"}
        />
        <div className="tm-classlist-row">
          <span>{parsed.length} {parsed.length === 1 ? "name" : "names"}</span>
          <button type="button" className="btn btn-secondary" disabled={parsed.length < 4} onClick={fromList}>Pick four at random</button>
          {list && <button type="button" className="btn btn-secondary" onClick={() => { setList(""); saveClassList(""); }}>Clear the list</button>}
        </div>
        {note && <p role="status" className="tm-classlist-note">{note}</p>}
      </details>
    </div>
  );
}

export default function NameThem({ names, onChange }) {
  return (
    <section aria-labelledby="h-tm-names" className="tm-names" style={{ marginTop: 34 }}>
      <div className="tm-names-head">
        <div>
          <h2 id="h-tm-names" style={{ fontFamily: FONT_DISPLAY, fontSize: 26, fontWeight: 700, color: COLORS.ink, margin: 0 }}>Name the characters</h2>
          <p style={{ fontFamily: FONT_BODY, fontSize: 15, lineHeight: 1.55, color: COLORS.inkSoft, margin: "6px 0 0", maxWidth: 640 }}>
            Four children star in the stories in chapter 1. Type the names you want, pick them at random or take them from your class list. The new names appear in the words and on name tags in the pictures. You can also change them during the lesson with the Names button. They are kept on this device only.
          </p>
        </div>
      </div>
      <NameFields names={names} onChange={onChange} />
    </section>
  );
}

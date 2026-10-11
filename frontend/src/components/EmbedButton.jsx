/** @jsxImportSource react */
import { useRef, useState } from "react";
import { COLORS, FONT_BODY, FONT_DISPLAY } from "../theme";
import { pillStyle } from "../lib/onsStyles";
import { embedUrl, embedHeight, iframeCode, RESIZE_SNIPPET } from "../lib/embed";

// "Embed" button and the box it opens: a live preview of the card, a light or dark choice, and the code to paste into another page.
export default function EmbedButton({ spec, title }) {
  const dialog = useRef(null);
  const [theme, setTheme] = useState("light");
  const [note, setNote] = useState("");
  const code = iframeCode({ spec, theme, title });

  async function copy(text, done) {
    try {
      await navigator.clipboard.writeText(text);
      setNote(done);
    } catch {
      window.prompt("Copy this", text);
    }
  }

  const choice = (value, label) => (
    <button type="button" className="ons-tap" aria-pressed={theme === value} onClick={() => setTheme(value)} style={pillStyle(theme === value)}>{label}</button>
  );
  const codeBox = { display: "block", width: "100%", boxSizing: "border-box", margin: "6px 0 8px", padding: "10px 12px", border: `1px solid ${COLORS.hairline}`, borderRadius: 10, background: COLORS.paper, color: COLORS.ink, fontFamily: "ui-monospace, Menlo, monospace", fontSize: 12.5, lineHeight: 1.5, resize: "vertical" };

  return (
    <>
      <button type="button" className="ons-tap" style={{ ...pillStyle(false), textDecoration: "none" }} onClick={() => { setNote(""); dialog.current?.showModal(); }}>Embed</button>
      <dialog
        ref={dialog}
        aria-labelledby="embed-title"
        onClick={(e) => { if (e.target === dialog.current) dialog.current.close(); }}
        style={{ width: "min(680px, calc(100vw - 24px))", maxHeight: "calc(100dvh - 24px)", padding: 0, border: `1px solid ${COLORS.hairline}`, borderRadius: 18, background: COLORS.paperCard, color: COLORS.ink }}
      >
        <div style={{ padding: "20px clamp(16px, 4vw, 24px) 22px", fontFamily: FONT_BODY }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
            <h2 id="embed-title" style={{ fontFamily: FONT_DISPLAY, fontSize: 22, fontWeight: 700, margin: 0, lineHeight: 1.25 }}>Put this on your own page</h2>
            <button type="button" className="ons-tap" onClick={() => dialog.current?.close()} style={pillStyle(false)}>Close</button>
          </div>
          <p style={{ fontSize: 14, lineHeight: 1.55, color: COLORS.inkSoft, margin: "6px 0 14px" }}>
            Free to use on a website, blog or in a lesson. The figures update by themselves, and the card links back to Simple Politics. Please keep that link in place.
          </p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center", marginBottom: 12 }}>
            <span style={{ fontSize: 13, fontWeight: 700 }}>Card</span>
            {choice("light", "Light")}
            {choice("dark", "Dark")}
          </div>
          <div style={{ borderRadius: 14, overflow: "hidden", border: `1px solid ${COLORS.hairline}`, background: theme === "dark" ? "#0F1018" : "#E9E5D8", padding: 10 }}>
            <iframe
              key={theme}
              title={`Preview: ${title}`}
              src={embedUrl(window.location.origin, spec, theme)}
              style={{ display: "block", width: "100%", height: embedHeight(spec.kind), border: 0, maxWidth: 640, margin: "0 auto" }}
            />
          </div>
          <label htmlFor="embed-code" style={{ display: "block", fontSize: 13, fontWeight: 700, marginTop: 16 }}>Paste this where the card should go</label>
          <textarea id="embed-code" readOnly rows={4} value={code} onFocus={(e) => e.target.select()} style={codeBox} />
          <div style={{ display: "flex", flexWrap: "wrap", gap: "8px 10px", alignItems: "center" }}>
            <button type="button" className="ons-tap" style={pillStyle(true)} onClick={() => copy(code, "Code copied. Paste it into your page.")}>Copy the code</button>
            <span role="status" aria-live="polite" style={{ fontSize: 12.5, color: COLORS.inkSoft }}>{note}</span>
          </div>
          <details style={{ marginTop: 14 }}>
            <summary className="ons-tap" style={{ fontSize: 13.5, fontWeight: 600, cursor: "pointer", padding: "6px 0" }}>Make the card fit its content exactly (optional)</summary>
            <p style={{ fontSize: 13, lineHeight: 1.55, color: COLORS.inkSoft, margin: "4px 0 0" }}>
              Add this once to the same page. It resizes the card so there is no scrollbar and no empty space.
            </p>
            <textarea readOnly rows={7} value={RESIZE_SNIPPET} onFocus={(e) => e.target.select()} style={codeBox} aria-label="Optional resize script" />
            <button type="button" className="ons-tap" style={pillStyle(false)} onClick={() => copy(RESIZE_SNIPPET, "Script copied.")}>Copy the script</button>
          </details>
          <p style={{ fontSize: 12, lineHeight: 1.5, color: COLORS.inkSoft, margin: "14px 0 0" }}>
            Figures are from the Office for National Statistics and other official sources, used under the Open Government Licence. The card does not set cookies or track the people who see it.
          </p>
        </div>
      </dialog>
    </>
  );
}

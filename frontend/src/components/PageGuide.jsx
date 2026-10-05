import { useState, useEffect } from "react";
import { COLORS, FONT_BODY } from "../theme";

// "What you're looking at": three plain lines at the top of a page (what it
// is, why it matters, what it doesn't show), the same on every page so people
// learn to expect it. It can be folded away, and the choice is remembered for
// every page. The text is loaded on demand.

const STORAGE_KEY = "mpTracker.guideOpen";

function readOpen() {
  try {
    // Hidden until someone chooses to open it, then remembered.
    return localStorage.getItem(STORAGE_KEY) === "open";
  } catch {
    return false;
  }
}

const ROWS = [
  ["what", "What this is"],
  ["why", "Why it matters"],
  ["notShown", "What it doesn't show"],
];

export default function PageGuide({ viewKey, style }) {
  // The loaded text and the page it belongs to, so a stale one is never shown.
  const [loaded, setLoaded] = useState({ key: null, guide: null });
  const [open, setOpen] = useState(readOpen);

  useEffect(() => {
    let cancelled = false;
    if (!viewKey) return undefined;
    import("../data/pageGuides")
      .then((m) => {
        if (!cancelled) setLoaded({ key: viewKey, guide: m.PAGE_GUIDES[m.GUIDE_ALIASES[viewKey] ?? viewKey] ?? null });
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [viewKey]);

  const guide = loaded.key === viewKey ? loaded.guide : null;
  if (!guide) return null;

  function toggle() {
    const next = !open;
    setOpen(next);
    try {
      localStorage.setItem(STORAGE_KEY, next ? "open" : "closed");
    } catch {
      // Private browsing: the choice just won't be remembered.
    }
  }

  return (
    <section aria-label="What you're looking at" style={{ marginTop: 18, background: COLORS.paperCard, border: `1px solid ${COLORS.hairline}`, borderLeft: `3px solid ${COLORS.accent}`, borderRadius: 12, ...style }}>
      <button
        type="button"
        onClick={toggle}
        aria-expanded={open}
        style={{ display: "flex", alignItems: "center", gap: 10, width: "100%", textAlign: "left", background: "none", border: "none", cursor: "pointer", padding: "10px 14px", color: "inherit" }}
      >
        <span aria-hidden="true" style={{ width: 20, height: 20, borderRadius: "50%", background: `${COLORS.accent}22`, color: COLORS.accent, fontFamily: FONT_BODY, fontSize: 12, fontWeight: 800, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>i</span>
        <span style={{ fontFamily: FONT_BODY, fontSize: 13.5, fontWeight: 700, color: COLORS.ink, flex: 1 }}>What you're looking at</span>
        <span style={{ fontFamily: FONT_BODY, fontSize: 12, color: COLORS.inkSoft }}>{open ? "Hide" : "Show"}</span>
        <span aria-hidden="true" style={{ color: COLORS.inkSoft, fontSize: 11, transform: open ? "rotate(180deg)" : "none", transition: "transform 0.15s" }}>▾</span>
      </button>
      {open && (
        <div style={{ padding: "0 14px 12px 44px", display: "flex", flexDirection: "column", gap: 8 }}>
          {ROWS.map(([key, label]) => (
            <div key={key} style={{ display: "grid", gridTemplateColumns: "minmax(0, 1fr)", gap: 1 }}>
              <span style={{ fontFamily: FONT_BODY, fontSize: 11.5, fontWeight: 700, color: COLORS.accent }}>{label}</span>
              <span style={{ fontFamily: FONT_BODY, fontSize: 13.5, color: COLORS.ink, lineHeight: 1.55 }}>{guide[key]}</span>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

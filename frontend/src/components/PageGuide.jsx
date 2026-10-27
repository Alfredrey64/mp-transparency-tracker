import { useState, useEffect } from "react";
import { COLORS, FONT_BODY } from "../theme";
import { useT } from "../lib/useLang";

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
  const t = useT();
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
    <section aria-label={t("What you're looking at")} style={{ marginTop: 0, marginBottom: 28, background: COLORS.paperCard, border: `1px solid ${COLORS.hairline}`, borderLeft: `4px solid var(--page-accent, ${COLORS.accent})`, borderRadius: 12, boxShadow: "var(--shadow-1)", ...style }}>
      <button
        type="button"
        onClick={toggle}
        aria-expanded={open}
        style={{ display: "flex", alignItems: "center", gap: 10, width: "100%", textAlign: "left", background: "none", border: "none", cursor: "pointer", padding: "12px 16px", minHeight: 48, color: "inherit" }}
      >
        <span aria-hidden="true" style={{ width: 20, height: 20, borderRadius: "50%", background: `color-mix(in srgb, var(--page-accent, ${COLORS.accent}) 22%, transparent)`, color: COLORS.ink, fontFamily: FONT_BODY, fontSize: 12, fontWeight: 800, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>i</span>
        <span style={{ fontFamily: FONT_BODY, fontSize: 15, fontWeight: 700, color: COLORS.ink, flex: 1 }}>{t("What you're looking at")}</span>
        <span style={{ fontFamily: FONT_BODY, fontSize: 12, color: COLORS.inkSoft }}>{open ? t("Hide") : t("Show")}</span>
        <span aria-hidden="true" style={{ color: COLORS.inkSoft, fontSize: 11, transform: open ? "rotate(180deg)" : "none", transition: "transform 0.15s" }}>▾</span>
      </button>
      {open && (
        <div style={{ padding: "0 18px 16px 46px", display: "flex", flexDirection: "column", gap: 12 }}>
          {ROWS.map(([key, label]) => (
            <div key={key} style={{ display: "grid", gridTemplateColumns: "minmax(0, 1fr)", gap: 1 }}>
              <span style={{ fontFamily: FONT_BODY, fontSize: 13, fontWeight: 700, color: COLORS.accentText }}>{t(label)}</span>
              <span style={{ fontFamily: FONT_BODY, fontSize: 15, color: COLORS.ink, lineHeight: 1.6 }}>{t(guide[key])}</span>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

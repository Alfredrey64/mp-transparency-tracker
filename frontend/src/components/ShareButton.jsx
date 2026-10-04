import { useState, lazy, Suspense } from "react";
import { COLORS, FONT_BODY } from "../theme";

// The dialog and the canvas drawing code load only when someone clicks.
const ShareDialog = lazy(() => import("./ShareDialog"));

function IconShare({ size = 15 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 15V3" />
      <path d="m7.5 7.5 4.5-4.5 4.5 4.5" />
      <path d="M5 12v6a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-6" />
    </svg>
  );
}

// A "Share" button. getSpec returns what goes on the card (see
// lib/shareSpecs.js), when the button is clicked, so nothing is worked out
// until someone asks for it. `filename` names the downloaded image.
export default function ShareButton({ getSpec, filename = "uk-parliament-tracker", label = "Share", style }) {
  const [open, setOpen] = useState(null);
  return (
    <>
      <button
        type="button"
        onClick={(e) => setOpen({ opener: e.currentTarget })}
        style={{ display: "inline-flex", alignItems: "center", gap: 7, fontFamily: FONT_BODY, fontSize: 13, fontWeight: 700, color: COLORS.accent, background: `${COLORS.accent}12`, border: `1px solid ${COLORS.accent}40`, borderRadius: 999, padding: "7px 14px", cursor: "pointer", ...style }}
      >
        <IconShare />
        {label}
      </button>
      {open && (
        <Suspense fallback={null}>
          <ShareDialog getSpec={getSpec} filename={filename} returnFocusTo={open.opener} onClose={() => setOpen(null)} />
        </Suspense>
      )}
    </>
  );
}

/** @jsxImportSource react */
import { useEffect, useState } from "react";
import { COLORS } from "../theme";
import { useT } from "../lib/useLang";

// What a page or a card shows while its figures arrive. It holds roughly the height of what is coming, so the page does not collapse and
// then jump open, and its soft shapes say "something is on its way" more calmly than a line of text. Screen readers still hear "Loading".
// `compact` is for a box inside a page (a few soft lines); the default fills the space a whole page's content will take, drawn as the
// things a page is made of (a row of figure tiles, then a card of lines) rather than a bare stack of bars.
// If a page is still not here after a while the placeholder says so, and after longer still offers a way to try again, so nobody is left
// watching a skeleton with no explanation. The message sits inside the placeholder's own height, so nothing moves when it appears.
const SLOW_MS = 9000;
const STUCK_MS = 20000;

export default function Loading({ compact = false }) {
  const t = useT();
  const [wait, setWait] = useState(0);
  useEffect(() => {
    const a = setTimeout(() => setWait(1), SLOW_MS);
    const b = compact ? null : setTimeout(() => setWait(2), STUCK_MS);
    return () => { clearTimeout(a); if (b) clearTimeout(b); };
  }, [compact]);
  return (
    <div role="status" aria-live="polite" className={compact ? "loading-block" : "loading-block loading-page"} style={{ minHeight: compact ? 96 : "min(55vh, 520px)", color: COLORS.inkSoft }}>
      <span className="sr-only">{t("Loading…")}</span>
      {(wait > 0 || !compact) && (
        <p className="loading-slow" data-on={wait > 0 ? "1" : undefined}>
          {wait === 1 ? t("This is taking longer than usual. It will keep trying.") : wait === 2 ? t("Still nothing. Check your connection, then try again.") : null}
          {wait === 2 && <button type="button" onClick={() => window.location.reload()}>{t("Try again")}</button>}
        </p>
      )}
      {compact ? (
        <span aria-hidden="true" className="loading-bars">
          <i style={{ width: "62%" }} />
          <i style={{ width: "88%" }} />
          <i style={{ width: "74%" }} />
        </span>
      ) : (
        <span aria-hidden="true" className="loading-skel">
          <span className="loading-tiles"><b /><b /><b /></span>
          <span className="loading-bars">
            <i style={{ width: "34%", height: 18 }} />
            <i style={{ width: "88%" }} />
            <i style={{ width: "74%" }} />
            <i style={{ width: "50%" }} />
          </span>
        </span>
      )}
    </div>
  );
}

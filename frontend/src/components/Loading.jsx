/** @jsxImportSource react */
import { COLORS } from "../theme";

// What a page or a card shows while its figures arrive. It holds roughly the height of what is coming, so the page does not collapse and
// then jump open, and its soft bars say "something is on its way" more calmly than a line of text. Screen readers still hear "Loading".
// `compact` is for a box inside a page; the default fills the space a whole page's content will take.
export default function Loading({ compact = false }) {
  return (
    <div role="status" aria-live="polite" className="loading-block" style={{ minHeight: compact ? 96 : "min(55vh, 520px)", color: COLORS.inkSoft }}>
      <span className="sr-only">Loading…</span>
      <span aria-hidden="true" className="loading-bars">
        <i style={{ width: "62%" }} />
        <i style={{ width: "88%" }} />
        <i style={{ width: "74%" }} />
        {!compact && <i style={{ width: "50%" }} />}
      </span>
    </div>
  );
}

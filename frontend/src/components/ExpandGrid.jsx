/** @jsxImportSource react */
import { useState, useEffect, useRef, useCallback } from "react";
import "../expandGrid.css";

// A grid of cards where pressing one opens its details as a panel under the whole row it is in, instead of growing the card itself. No card moves sideways or changes size, so
// a row never ends up with one tall box beside short ones. The panel is drawn closed, opens on the next frame, and is taken away again once it has closed.
//   items     the things to show, in order
//   itemKey   (item) => a stable key
//   card      (item, { open, toggle, index, panelId }) => the closed card; the button inside it should carry aria-expanded={open}, aria-controls={panelId} and onClick={toggle}
//   panel     (item) => the contents of the open panel
//   label     (item) => the name read out for the panel
//   initialKey  the key of an item to start open, for a link that points at one
//   min       the narrowest a card may be, in px, which with the width decides how many fit in a row
function Panel({ id, label, open, onGone, children }) {
  const [mounted, setMounted] = useState(false);
  const ref = useRef(null);
  // Drawn closed first, then opened on the next frame (one frame, not two), so the opening transition starts almost at once.
  useEffect(() => {
    const frame = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(frame);
  }, []);
  useEffect(() => {
    if (open) return undefined;
    const timer = setTimeout(onGone, 360);
    return () => clearTimeout(timer);
  }, [open, onGone]);
  const shown = open && mounted;
  // Once the panel has opened, bring it into view if it is off screen, so pressing a card at the top of a tall row shows what it opened.
  useEffect(() => {
    if (!shown) return undefined;
    const timer = setTimeout(() => {
      const box = ref.current?.getBoundingClientRect();
      if (box && (box.bottom > window.innerHeight || box.top < 80)) ref.current.scrollIntoView({ block: "nearest", behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" });
    }, 380);
    return () => clearTimeout(timer);
  }, [shown]);
  return (
    <div ref={ref} id={id} className="eg-detail" data-open={shown ? "true" : "false"} inert={!shown} role="region" aria-label={label}>
      <div className="eg-detail-in">{children}</div>
    </div>
  );
}

export default function ExpandGrid({ items, itemKey, card, panel, label, min = 320, gap = 14, initialKey = null, className = "" }) {
  const [openKey, setOpenKey] = useState(initialKey);
  // The items whose panel is on the page: the open one, and one that is still closing.
  const [panelKeys, setPanelKeys] = useState(initialKey == null ? [] : [initialKey]);
  const gridRef = useRef(null);
  const [columns, setColumns] = useState(1);
  useEffect(() => {
    const grid = gridRef.current;
    if (!grid || typeof ResizeObserver === "undefined") return undefined;
    // The count of columns auto-fill makes: as many minimum-width cards as fit across, counting the gaps. Worked out from the width, not read back from the grid, because the
    // grid's own columns change when a short last row is centred (below).
    const measure = () => { const w = grid.clientWidth; setColumns(Math.max(1, Math.floor((w + gap) / (Math.min(w, min) + gap)))); };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(grid);
    return () => ro.disconnect();
  }, [items.length, min, gap]);
  const toggle = (key) => {
    if (openKey === key) { setOpenKey(null); return; }
    setPanelKeys((keys) => (keys.includes(key) ? keys : [...keys, key]));
    setOpenKey(key);
  };
  const dropPanel = useCallback((key) => setPanelKeys((keys) => keys.filter((k) => k !== key)), []);

  const rowEnd = (at) => Math.min(items.length - 1, (Math.floor(at / columns) + 1) * columns - 1);
  // A last row with fewer cards than the rows above sits centred under them, not against the left edge. The grid then has two tracks for every card column, each card spans two,
  // and an empty spacer before the first card of the last row takes up half the missing cards' width.
  const short = columns > 1 ? items.length % columns : 0;
  const pad = short ? columns - short : 0;
  return (
    <div ref={gridRef} data-no-balance="" data-padded={pad ? "" : undefined} className={`eg-grid ${className}`} style={{ "--eg-gap": `${gap}px`, gridTemplateColumns: pad ? `repeat(${columns * 2}, minmax(0, 1fr))` : `repeat(auto-fill, minmax(min(100%, ${min}px), 1fr))` }}>
      {items.flatMap((item, i) => {
        const key = itemKey(item);
        const out = [];
        if (pad && i === items.length - short) out.push(<span key="eg-pad" className="eg-pad" aria-hidden="true" style={{ gridColumn: `span ${pad}` }} />);
        out.push(card(item, { open: openKey === key, toggle: () => toggle(key), index: i, panelId: `eg-${key}` }));
        // An item's panel sits under the last card of the row it is in.
        items.forEach((other, at) => {
          const otherKey = itemKey(other);
          if (rowEnd(at) === i && at <= i && panelKeys.includes(otherKey)) {
            out.push(<Panel key={`panel-${otherKey}`} id={`eg-${otherKey}`} label={label(other)} open={openKey === otherKey} onGone={() => dropPanel(otherKey)}>{panel(other)}</Panel>);
          }
        });
        return out;
      })}
    </div>
  );
}

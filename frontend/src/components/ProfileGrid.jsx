import { Children, useCallback, useLayoutEffect, useRef, useState } from "react";

// The MP page's two columns: the declared-interests list on the left, the summary cards on the right. When the list is short, the cards do not carry on alone in the right
// column with a blank left side beside them: once the list ends, the remaining cards flow into the space under it, so the page is used across its whole width.
//
// It is a grid of one-pixel rows. Each piece reports its height and takes that many rows, so the browser packs the cards into whichever column has room first, a little like
// a masonry layout. On a phone (one column, see .pg-grid in index.css) none of this applies and everything simply stacks as it did.
const GAP = 16;
// A card taller than this when it is one column wide takes the whole width instead (a long list of speeches or questions), so one long card does not leave a tall empty space beside it.
const TALL = 1400;

function useHeight(onHeight) {
  const ref = useRef(null);
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return undefined;
    const read = () => onHeight(el.offsetHeight);
    read();
    if (typeof ResizeObserver === "undefined") return undefined;
    const watcher = new ResizeObserver(read);
    watcher.observe(el);
    return () => watcher.disconnect();
  }, [onHeight]);
  return ref;
}

function Slot({ index, onSize, children }) {
  const report = useCallback((h) => onSize(index, h), [index, onSize]);
  const ref = useHeight(report);
  return <div ref={ref} className="pg-slot">{children}</div>;
}

export default function ProfileGrid({ left, cards, leftFull = false }) {
  const [leftHeight, setLeftHeight] = useState(0);
  const [heights, setHeights] = useState({});
  const onLeft = useCallback((h) => setLeftHeight((old) => (old === h ? old : h)), []);
  const [wide, setWide] = useState({});
  const onSize = useCallback((i, h) => {
    setHeights((old) => (old[i] === h ? old : { ...old, [i]: h }));
    // Decided once, from the one-column height: spanning halves the height, which must not flip the card back.
    if (h > TALL) setWide((old) => (old[i] ? old : { ...old, [i]: true }));
  }, []);
  const leftRef = useHeight(onLeft);
  const items = Children.toArray(cards);

  return (
    <div className="pg-grid" data-full={leftFull ? "1" : "0"}>
      <div className="pg-left" style={{ gridRow: `1 / span ${Math.max(1, Math.ceil(leftHeight) + GAP)}` }}>
        <div ref={leftRef} className="pg-left-inner">{left}</div>
      </div>
      {!leftFull && items.map((card, i) => {
        const h = heights[i] ?? 0;
        // A card that draws nothing takes no space and no gap.
        const span = h < 1 ? 1 : Math.ceil(h) + GAP;
        return <div key={card.key ?? i} className="pg-cell" data-wide={wide[i] ? "1" : "0"} style={{ gridRow: `span ${span}` }}><Slot index={i} onSize={onSize}>{card}</Slot></div>;
      })}
    </div>
  );
}

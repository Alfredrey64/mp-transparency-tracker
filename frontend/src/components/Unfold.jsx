import { Fragment, useState } from "react";
import { m as motion, AnimatePresence } from "motion/react";
import { FOLD, FOLD_SHUT } from "../lib/foldMotion";

// Content that opens and closes under something you press: it grows to its own height with its words fading in (and the same in reverse), so the page below glides rather than
// jumps. The box is clipped, never scaled, so nothing stretches. Honours the site's reduced-motion setting (MotionConfig in App.jsx). Not to be confused with Reveal, which
// fades a block in once as it scrolls into view.
//   appear: also grow in when it is first drawn (for a batch of rows added by a "Show more" button, which mounts already open).
//   settle: once it has finished growing, stop clipping, so card shadows at the edges are not cut off.
export default function Unfold({ open, children, className, appear = false, settle = false }) {
  const [done, setDone] = useState(false);
  return (
    <AnimatePresence initial={appear}>
      {open && (
        <motion.div key="unfold" className={className} initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0, transition: FOLD_SHUT }} transition={FOLD} style={{ overflow: settle && done ? "visible" : "hidden" }}
          onAnimationStart={() => setDone(false)} onAnimationComplete={() => setDone(true)}>
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// A list shown a page at a time ("Show ten more"). The first page is drawn as it always was; each page added after it grows in under the rows already there, so the button and everything
// below it glide down instead of being shoved a screenful in one frame. `render(item, indexInWholeList)` draws one row; `className` and `Tag` are the list's own; `gap` is the space the
// list leaves between rows (px), kept between one page and the next.
export function Batches({ items, shown, page, Tag = "ul", className, gap = 10, render }) {
  const visible = items.slice(0, shown);
  const out = [];
  for (let start = 0, k = 0; start < visible.length; start += page, k += 1) {
    const rows = visible.slice(start, start + page).map((x, i) => render(x, start + i));
    out.push(k === 0
      ? <Fragment key={0}><Tag className={className}>{rows}</Tag></Fragment>
      : <Unfold key={k} open appear settle><Tag className={className} style={{ paddingTop: gap }}>{rows}</Tag></Unfold>);
  }
  return out;
}

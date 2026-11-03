import { m as motion, AnimatePresence } from "motion/react";

// Content that opens and closes under something you press: it grows to its own height with its words fading in (and the same in reverse), so the page below glides rather than
// jumps. The box is clipped, never scaled, so nothing stretches. Honours the site's reduced-motion setting (MotionConfig in App.jsx). Not to be confused with Reveal, which
// fades a block in once as it scrolls into view.
export default function Unfold({ open, children, className }) {
  return (
    <AnimatePresence initial={false}>
      {open && (
        <motion.div key="unfold" className={className} initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.26, ease: [0.22, 1, 0.36, 1] }} style={{ overflow: "hidden" }}>
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/** @jsxImportSource react */
import { useState, useEffect, useLayoutEffect, useRef, useMemo, useContext, useCallback } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { COLORS, FONT_BODY } from "../theme";
import { findGlossaryEntry } from "../data/glossaryTerms";
import { GlossBlockedContext } from "../glossJsx/blockContext";

// Kept out of shared.jsx deliberately — shared.jsx is eagerly bundled
// (Home and Sidebar, the two pages that load before any code-splitting
// kicks in, both depend on it), and the full glossary term list is big
// enough that importing it from there added this entire site's glossary
// text to the one bundle every single page pays for, whether or not that
// page ever renders a GlossaryTerm. Living in its own file means it (and
// the data it needs) only ends up in the lazy chunk of whichever pages
// actually import it.

// True hover support, not just "wide enough to probably be a desktop" —
// a touchscreen laptop or a tablet with a trackpad can be wide, and a
// narrow desktop window is still a mouse. (hover: hover) asks the actual
// question: can this pointer rest on something without clicking it.
// Checked once per mount rather than reactively, since a device doesn't
// switch input types mid-session in any case this needs to handle.
function useSupportsHover() {
  const [supportsHover] = useState(() =>
    typeof window !== "undefined" && window.matchMedia?.("(hover: hover)").matches
  );
  return supportsHover;
}

// Wraps an unfamiliar term so its Glossary definition is available right
// where it's read — hover to preview on a device that has hover, tap to
// toggle a small popover on one that doesn't — instead of making every
// reader who doesn't already know the term go find the Glossary page
// themselves. `term` is looked up via findGlossaryEntry (case-insensitive,
// and resolves an acronym like "IPSA" to its full glossary entry), and
// this renders its own children unchanged with no popover affordance at
// all if the term isn't found, rather than ever silently showing a blank
// or broken tooltip.
export function GlossaryTerm({ term, children }) {
  const [open, setOpen] = useState(false);
  // Where the popover sits, in viewport coordinates. It's rendered into
  // document.body rather than next to the term, because anywhere inside the
  // page it can be clipped by an ancestor with overflow: hidden/auto (cards,
  // clamped text boxes, scroll areas) or hidden behind a later sibling's
  // stacking context — a fixed-position box at the top level is neither.
  const [pos, setPos] = useState({ left: 0, top: 0, above: false });
  const supportsHover = useSupportsHover();
  const ref = useRef(null);
  const buttonRef = useRef(null);
  const popoverRef = useRef(null);
  const entry = useMemo(() => findGlossaryEntry(term), [term]);
  const blocked = useContext(GlossBlockedContext);

  useEffect(() => {
    if (!open) return;
    function handleOutside(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener("click", handleOutside);
    return () => document.removeEventListener("click", handleOutside);
  }, [open]);

  // Measured from the term's own line boxes, not its bounding box: a term
  // that wraps onto two lines has a bounding box covering both and the empty
  // space beside them, so below/above must be judged from the last/first line.
  // Flips above when the text beneath it wouldn't fit the popover, centres on
  // the term, and is clamped so it can't cross either edge of the screen.
  const place = useCallback(() => {
    const button = buttonRef.current;
    const popover = popoverRef.current;
    if (!button || !popover) return;
    const rects = button.getClientRects();
    if (!rects.length) return;
    const margin = 12;
    const gap = 8;
    const width = popover.offsetWidth;
    const height = popover.offsetHeight;
    const first = rects[0];
    const last = rects[rects.length - 1];
    const roomBelow = window.innerHeight - last.bottom - gap - margin;
    const roomAbove = first.top - gap - margin;
    const above = height > roomBelow && roomAbove > roomBelow;
    const anchor = above ? first : last;
    const left = Math.max(margin, Math.min(anchor.left + anchor.width / 2 - width / 2, window.innerWidth - margin - width));
    const top = Math.max(margin, above ? anchor.top - gap - height : anchor.bottom + gap);
    setPos((p) => (p.left === left && p.top === top && p.above === above ? p : { left, top, above }));
  }, []);

  // Layout effect, not a plain effect: runs before the browser paints, so the
  // first visible frame is already at the right place.
  useLayoutEffect(() => {
    if (!open) return;
    place();
    window.addEventListener("scroll", place, true);
    window.addEventListener("resize", place);
    return () => {
      window.removeEventListener("scroll", place, true);
      window.removeEventListener("resize", place);
    };
  }, [open, place]);

  // No entry, or sitting inside a link/button where a nested button is
  // invalid: just the plain text.
  if (!entry || blocked) return children;

  return (
    <span ref={ref} data-gloss-term={entry.term} style={{ position: "relative", display: "inline" }}>
      <button
        ref={buttonRef}
        type="button"
        onClick={(e) => { e.stopPropagation(); setOpen(true); }}
        onMouseEnter={supportsHover ? () => setOpen(true) : undefined}
        onMouseLeave={supportsHover ? () => setOpen(false) : undefined}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
        aria-expanded={open}
        style={{
          background: "none", border: "none", padding: 0, margin: 0, font: "inherit", color: "inherit",
          cursor: supportsHover ? "help" : "pointer", display: "inline", lineHeight: 1,
          borderBottom: "1px dotted currentColor",
        }}
      >
        {children}
      </button>
      {/* motion.span, not motion.div: the popover can still end up inside a
          <p> in React's tree (portals keep their React parent for events and
          context), and a <span> is the safe choice anywhere. pointer-events:
          none so it never intercepts a tap meant for the text beneath it. */}
      {createPortal(
        <AnimatePresence>
          {open && (
            <motion.span
              ref={popoverRef}
              role="tooltip"
              initial={{ opacity: 0, y: pos.above ? -4 : 4, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: pos.above ? -4 : 4, scale: 0.98 }}
              transition={{ duration: 0.15 }}
              style={{
                position: "fixed", zIndex: 2000, top: pos.top, left: pos.left, pointerEvents: "none",
                display: "block", width: "max-content", maxWidth: "min(300px, calc(100vw - 24px))",
                maxHeight: "calc(100vh - 24px)", overflowY: "auto",
                background: COLORS.paperCard, border: `1px solid ${COLORS.hairline}`, borderRadius: 10,
                padding: "10px 13px", boxShadow: "0 10px 28px rgba(0,0,0,0.3)", textAlign: "left",
              }}
            >
              <span style={{ display: "block", fontFamily: FONT_BODY, fontWeight: 700, fontSize: 12, color: COLORS.ink, marginBottom: 3 }}>
                {entry.term}
              </span>
              <span style={{ display: "block", fontFamily: FONT_BODY, fontSize: 12.5, color: COLORS.inkSoft, lineHeight: 1.5 }}>
                {entry.def}
              </span>
            </motion.span>
          )}
        </AnimatePresence>,
        document.body
      )}
    </span>
  );
}

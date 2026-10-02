/** @jsxImportSource react */
import { useState, useEffect, useLayoutEffect, useRef, useMemo, useContext } from "react";
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
  // The popover's `left`, in pixels relative to the anchor span (its
  // positioned ancestor) — computed fresh on every open from the anchor's
  // and popover's actual measured widths, clamped so it never runs off
  // either edge of the viewport. Expressed as a plain `left` rather than
  // framer-motion's usual centring trick (left: 50% + transform) because
  // motion.div fully owns the `transform` property for its own y/scale
  // animation here and silently drops a hand-written transform string
  // passed alongside it — confirmed by inspecting the rendered style
  // directly, not assumed.
  const [leftPx, setLeftPx] = useState(0);
  const supportsHover = useSupportsHover();
  const ref = useRef(null);
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

  // Layout effect, not a plain effect: runs synchronously before the
  // browser paints, so the popover's first visible frame is already at
  // its corrected position instead of flashing at left:0 for one frame.
  useLayoutEffect(() => {
    if (!open || !popoverRef.current || !ref.current) return;
    const margin = 12;
    const anchorRect = ref.current.getBoundingClientRect();
    const popoverWidth = popoverRef.current.offsetWidth;
    let left = (anchorRect.width - popoverWidth) / 2;
    const absoluteLeft = anchorRect.left + left;
    const absoluteRight = absoluteLeft + popoverWidth;
    if (absoluteRight > window.innerWidth - margin) left -= absoluteRight - (window.innerWidth - margin);
    else if (absoluteLeft < margin) left += margin - absoluteLeft;
    setLeftPx(left);
  }, [open]);

  // No entry, or sitting inside a link/button where a nested button is
  // invalid: just the plain text.
  if (!entry || blocked) return children;

  return (
    <span ref={ref} data-gloss-term={entry.term} style={{ position: "relative", display: "inline" }}>
      <button
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
      {/* motion.span, not motion.div: GlossaryTerm gets used inline inside
          a <p> (PageHeader's subtitle, among others), and a <div> is flow
          content — invalid as a descendant of <p> under the HTML spec, so
          browsers silently closed the <p> early and warned about it.
          <span> is phrasing content, valid anywhere this is, and
          display: block below makes it box-lay-out identically. */}
      <AnimatePresence>
        {open && (
          <motion.span
            ref={popoverRef}
            initial={{ opacity: 0, y: 4, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 4, scale: 0.98 }}
            transition={{ duration: 0.15 }}
            style={{
              position: "absolute", zIndex: 60, top: "calc(100% + 8px)", left: leftPx,
              display: "block", width: "max-content", maxWidth: "min(280px, 80vw)",
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
      </AnimatePresence>
    </span>
  );
}

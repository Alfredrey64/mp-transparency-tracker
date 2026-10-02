/** @jsxImportSource react */
import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { motion, useReducedMotion } from "framer-motion";
import { COLORS, FONT_BODY, FONT_DISPLAY, numeric } from "../theme";
import { formatDate, partyColour } from "../lib/format";

// The questions one MP or peer has put on a topic, in a pop-up over the page.
// Opts out of the glossary's automatic underlining (the pragma above): this
// is government Q&A text, where a match could be wrong.
//
// Behaves like a proper dialog: focus moves into it and returns to the row
// that opened it, Escape and a click on the backdrop close it, Tab stays
// inside, and the page behind doesn't scroll.
export default function AskerQuestionsModal({ person, questions, topic, returnFocusTo, onClose, onOpenProfile, onOpenAllQuestions }) {
  const reduce = useReducedMotion();
  const panelRef = useRef(null);
  const closeRef = useRef(null);
  // Where focus goes back to on close. The caller passes the element that was
  // clicked, because Safari doesn't focus a button on click, so asking the
  // document "what was focused?" would find nothing.
  const opener = useRef(returnFocusTo ?? (typeof document !== "undefined" ? document.activeElement : null));
  // Held in a ref so the effect below (focus, scroll lock, key handling) runs
  // once per opening, not again every time the parent re-renders.
  const onCloseRef = useRef(onClose);
  useEffect(() => {
    onCloseRef.current = onClose;
  });

  useEffect(() => {
    const trigger = opener.current;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeRef.current?.focus();

    function onKeyDown(e) {
      if (e.key === "Escape") {
        e.stopPropagation();
        onCloseRef.current();
        return;
      }
      if (e.key !== "Tab" || !panelRef.current) return;
      const focusable = [...panelRef.current.querySelectorAll('a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])')];
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
      trigger?.focus?.();
    };
  }, []);

  const colour = partyColour(person.colour, COLORS.inkSoft);

  return createPortal(
    <motion.div
      initial={reduce ? false : { opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.18 }}
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      style={{ position: "fixed", inset: 0, zIndex: 3000, background: "rgba(8, 9, 20, 0.62)", backdropFilter: "blur(3px)", display: "flex", alignItems: "center", justifyContent: "center", padding: "clamp(10px, 4vw, 32px)" }}
    >
      <motion.div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={`${person.name}'s questions about ${topic}`}
        initial={reduce ? false : { opacity: 0, y: 24, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
        style={{ width: "min(680px, 100%)", maxHeight: "min(86vh, 760px)", display: "flex", flexDirection: "column", background: COLORS.paper, border: `1px solid ${COLORS.hairline}`, borderTop: `4px solid ${colour}`, borderRadius: 18, boxShadow: "0 30px 80px rgba(0,0,0,0.45)", overflow: "hidden" }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 14, padding: "18px 20px 14px", borderBottom: `1px solid ${COLORS.hairline}` }}>
          {person.thumbnail ? (
            <img src={person.thumbnail} alt="" width={52} height={52} style={{ width: 52, height: 52, borderRadius: "50%", objectFit: "cover", background: COLORS.paperCard, border: `2px solid ${colour}`, flexShrink: 0 }} />
          ) : (
            <span style={{ width: 52, height: 52, borderRadius: "50%", background: `${colour}33`, flexShrink: 0 }} />
          )}
          <div style={{ minWidth: 0, flex: 1 }}>
            <div style={{ fontFamily: FONT_DISPLAY, fontSize: 20, color: COLORS.ink, lineHeight: 1.2 }}>{person.name}</div>
            <div style={{ fontFamily: FONT_BODY, fontSize: 12.5, color: COLORS.inkSoft, marginTop: 2 }}>{[person.party, person.house].filter(Boolean).join(" · ")}</div>
          </div>
          <button
            ref={closeRef}
            type="button"
            onClick={onClose}
            aria-label="Close"
            style={{ flexShrink: 0, width: 36, height: 36, borderRadius: "50%", border: `1px solid ${COLORS.hairline}`, background: COLORS.paperCard, color: COLORS.ink, cursor: "pointer", fontSize: 18, lineHeight: 1 }}
          >
            ×
          </button>
        </div>

        <div style={{ padding: "12px 20px 4px", fontFamily: FONT_BODY, fontSize: 13.5, color: COLORS.inkSoft }}>
          <span style={{ ...numeric, fontSize: 22, fontWeight: 700, color: COLORS.ink }}>{questions.length}</span>{" "}
          {questions.length === 1 ? "question" : "questions"} mentioning “{topic}” in the last 30 days
        </div>

        <div style={{ overflowY: "auto", padding: "8px 20px 18px", display: "flex", flexDirection: "column", gap: 10 }}>
          {questions.map((r) => {
            const answered = Boolean(r.date_answered);
            return (
              <div key={r.id} style={{ background: COLORS.paperCard, border: `1px solid ${COLORS.hairline}`, borderLeft: `3px solid ${answered ? COLORS.accent : "#B08A3E"}`, borderRadius: 12, padding: "12px 14px" }}>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "4px 10px", alignItems: "center", fontFamily: FONT_BODY, fontSize: 12, color: COLORS.inkSoft, marginBottom: 5 }}>
                  <span>{formatDate(r.date_tabled)}</span>
                  <span>→ {r.answering_body_name ?? "the government"}</span>
                  <span style={{ fontWeight: 700, color: answered ? COLORS.accent : "#B08A3E" }}>{answered ? `Answered ${formatDate(r.date_answered)}` : "Awaiting answer"}</span>
                </div>
                {r.heading && <div style={{ fontFamily: FONT_BODY, fontSize: 11.5, fontWeight: 700, color: COLORS.inkSoft, marginBottom: 3 }}>{r.heading}</div>}
                <div style={{ fontFamily: FONT_DISPLAY, fontSize: 14.5, color: COLORS.ink, lineHeight: 1.5 }}>{r.question_text}</div>
                <a
                  href={`https://questions-statements.parliament.uk/written-questions/detail/${r.date_tabled}/${r.uin}`}
                  target="_blank"
                  rel="noreferrer"
                  style={{ display: "inline-block", marginTop: 6, fontFamily: FONT_BODY, fontSize: 11.5, fontWeight: 700, color: COLORS.accent }}
                >
                  Full record, with the answer ↗
                </a>
              </div>
            );
          })}
        </div>

        {(onOpenProfile || onOpenAllQuestions) && (
          <div style={{ display: "flex", flexWrap: "wrap", gap: "8px 18px", padding: "12px 20px", borderTop: `1px solid ${COLORS.hairline}`, background: COLORS.paperCard }}>
            {onOpenProfile && (
              <button type="button" onClick={onOpenProfile} style={{ background: "none", border: "none", padding: 0, cursor: "pointer", fontFamily: FONT_BODY, fontSize: 13, fontWeight: 700, color: COLORS.accent }}>
                See their full profile →
              </button>
            )}
            {onOpenAllQuestions && (
              <button type="button" onClick={onOpenAllQuestions} style={{ background: "none", border: "none", padding: 0, cursor: "pointer", fontFamily: FONT_BODY, fontSize: 13, fontWeight: 700, color: COLORS.accent }}>
                All their written questions →
              </button>
            )}
          </div>
        )}
      </motion.div>
    </motion.div>,
    document.body
  );
}

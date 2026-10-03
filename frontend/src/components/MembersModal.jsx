/** @jsxImportSource react */
import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { motion, useReducedMotion } from "framer-motion";
import { COLORS, FONT_BODY, FONT_DISPLAY, numeric } from "../theme";
import { partyColour } from "../lib/format";

// A pop-up list of the MPs behind a figure: tap a bar or number on the
// Parliament in Numbers page and see who it counts. Each row opens that MP's
// profile. Opts out of the glossary's automatic underlining (the pragma
// above): it's a list of names and parties, where a match could be wrong.
//
// Behaves like a proper dialog: focus moves in and returns to what was
// clicked, Escape and a backdrop click close it, Tab stays inside, and the
// page behind doesn't scroll.

const PAGE = 80;

function Avatar({ member, colour }) {
  const [broken, setBroken] = useState(false);
  if (member.thumbnail && !broken) {
    return (
      <img
        src={member.thumbnail}
        alt=""
        width={40}
        height={40}
        loading="lazy"
        decoding="async"
        onError={() => setBroken(true)}
        style={{ width: 40, height: 40, borderRadius: "50%", objectFit: "cover", objectPosition: "top", background: COLORS.paper, border: `2px solid ${colour}`, flexShrink: 0 }}
      />
    );
  }
  return <span style={{ width: 40, height: 40, borderRadius: "50%", background: `${colour}33`, border: `2px solid ${colour}`, flexShrink: 0, boxSizing: "border-box" }} />;
}

export default function MembersModal({ title, note, members, badge, returnFocusTo, onClose, onSelect, noun = "MP" }) {
  const reduce = useReducedMotion();
  const panelRef = useRef(null);
  const closeRef = useRef(null);
  const opener = useRef(returnFocusTo ?? null);
  const onCloseRef = useRef(onClose);
  useEffect(() => {
    onCloseRef.current = onClose;
  });
  const [query, setQuery] = useState("");
  const [shown, setShown] = useState(PAGE);

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
      const focusable = [...panelRef.current.querySelectorAll('a[href], button:not([disabled]), input, [tabindex]:not([tabindex="-1"])')];
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

  const q = query.trim().toLowerCase();
  const filtered = useMemo(
    () => (q ? members.filter((m) => `${m.name} ${m.party ?? ""} ${m.constituency ?? ""}`.toLowerCase().includes(q)) : members),
    [members, q]
  );
  const visible = filtered.slice(0, shown);

  return createPortal(
    <motion.div
      initial={reduce ? false : { opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.16 }}
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      style={{ position: "fixed", inset: 0, zIndex: 3000, background: "rgba(8, 9, 20, 0.66)", display: "flex", alignItems: "center", justifyContent: "center", padding: "clamp(10px, 4vw, 32px)" }}
    >
      <motion.div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        initial={reduce ? false : { opacity: 0, y: 18, scale: 0.985 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
        style={{ width: "min(640px, 100%)", maxHeight: "min(86vh, 780px)", display: "flex", flexDirection: "column", background: COLORS.paper, border: `1px solid ${COLORS.hairline}`, borderTop: `4px solid ${COLORS.accent}`, borderRadius: 18, boxShadow: "0 30px 80px rgba(0,0,0,0.45)", overflow: "hidden", willChange: "transform, opacity" }}
      >
        <div style={{ display: "flex", alignItems: "flex-start", gap: 14, padding: "18px 20px 12px" }}>
          <div style={{ minWidth: 0, flex: 1 }}>
            <div style={{ fontFamily: FONT_DISPLAY, fontSize: 21, color: COLORS.ink, lineHeight: 1.2 }}>{title}</div>
            <div style={{ fontFamily: FONT_BODY, fontSize: 13, color: COLORS.inkSoft, marginTop: 4, lineHeight: 1.5 }}>
              <strong style={{ ...numeric, fontSize: 15, color: COLORS.ink }}>{members.length.toLocaleString("en-GB")}</strong> {members.length === 1 ? noun : `${noun}s`}
              {note ? ` · ${note}` : ""}
            </div>
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

        {members.length > 12 && (
          <div style={{ padding: "0 20px 10px" }}>
            <input
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setShown(PAGE);
              }}
              placeholder="Filter by name, party or seat"
              aria-label="Filter this list"
              style={{ width: "100%", boxSizing: "border-box", padding: "9px 12px", fontFamily: FONT_BODY, fontSize: 13.5, border: `1px solid ${COLORS.hairline}`, borderRadius: 10, background: COLORS.paperCard, color: COLORS.ink }}
            />
          </div>
        )}

        <div style={{ overflowY: "auto", padding: "0 12px 14px", borderTop: `1px solid ${COLORS.hairline}` }}>
          {filtered.length === 0 && <div style={{ padding: "18px 8px", fontFamily: FONT_BODY, fontSize: 13.5, color: COLORS.inkSoft }}>Nobody in this list matches that.</div>}
          {visible.map((m) => {
            const colour = partyColour(m.colour, COLORS.inkSoft);
            const extra = badge?.(m);
            return (
              <button
                key={m.id ?? m.mid}
                type="button"
                className="member-row"
                onClick={() => {
                  if (onSelect) onSelect(m);
                  else window.location.hash = `#/mp/${m.id}`;
                }}
                style={{ display: "grid", gridTemplateColumns: "40px minmax(0, 1fr) auto", gap: 12, alignItems: "center", width: "100%", textAlign: "left", background: "none", border: "none", borderBottom: `1px solid ${COLORS.hairline}`, padding: "9px 8px", cursor: "pointer", borderRadius: 8 }}
              >
                <Avatar member={m} colour={colour} />
                <span style={{ minWidth: 0 }}>
                  <span style={{ display: "block", fontFamily: FONT_BODY, fontSize: 14, fontWeight: 600, color: COLORS.ink, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{m.name}</span>
                  <span style={{ display: "block", fontFamily: FONT_BODY, fontSize: 12, color: COLORS.inkSoft, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {[m.party, m.constituency].filter(Boolean).join(" · ")}
                  </span>
                </span>
                {extra ? <span style={{ fontFamily: FONT_BODY, fontSize: 12, fontWeight: 600, color: COLORS.inkSoft, textAlign: "right", maxWidth: 150 }}>{extra}</span> : <span aria-hidden="true" style={{ color: COLORS.inkSoft }}>›</span>}
              </button>
            );
          })}
          {filtered.length > shown && (
            <button
              type="button"
              onClick={() => setShown((n) => n + PAGE)}
              style={{ display: "block", margin: "12px auto 0", background: "none", border: `1px solid ${COLORS.hairline}`, borderRadius: 999, padding: "8px 18px", cursor: "pointer", fontFamily: FONT_BODY, fontSize: 13, fontWeight: 700, color: COLORS.accent }}
            >
              Show {Math.min(PAGE, filtered.length - shown)} more ({(filtered.length - shown).toLocaleString("en-GB")} left)
            </button>
          )}
        </div>
      </motion.div>
    </motion.div>,
    document.body
  );
}

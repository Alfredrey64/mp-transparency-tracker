/** @jsxImportSource react */
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { COLORS, FONT_BODY, FONT_DISPLAY } from "../theme";
import { renderShareCard } from "../lib/shareCard";

// The pop-up behind a Share button: draws the card, shows it, and offers to
// share it with the device's own share sheet (phones), download it as a PNG,
// or copy the page's link. Opts out of the glossary underlining (pragma
// above) because it is mostly a picture. Behaves like a proper dialog:
// focus moves in and returns, Escape and a click outside close it, Tab stays
// inside, and the page behind doesn't scroll.
export default function ShareDialog({ getSpec, filename, returnFocusTo, onClose }) {
  const [url, setUrl] = useState(null);
  const [blob, setBlob] = useState(null);
  const [error, setError] = useState(false);
  const [copied, setCopied] = useState(false);
  const panelRef = useRef(null);
  const closeRef = useRef(null);
  const opener = useRef(returnFocusTo ?? null);
  const onCloseRef = useRef(onClose);
  useEffect(() => {
    onCloseRef.current = onClose;
  });

  useEffect(() => {
    let cancelled = false;
    let objectUrl = null;
    Promise.resolve()
      .then(() => getSpec())
      .then((spec) => renderShareCard(spec))
      .then((b) => {
        if (cancelled) return;
        objectUrl = URL.createObjectURL(b);
        setBlob(b);
        setUrl(objectUrl);
      })
      .catch(() => {
        if (!cancelled) setError(true);
      });
    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
    // getSpec is read once, when the dialog opens.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
      const focusable = [...panelRef.current.querySelectorAll('a[href], button:not([disabled])')];
      if (!focusable.length) return;
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

  const file = blob ? new File([blob], `${filename}.png`, { type: "image/png" }) : null;
  const canShareFile = Boolean(file && typeof navigator !== "undefined" && navigator.canShare?.({ files: [file] }));

  async function share() {
    try {
      await navigator.share({ files: [file], title: filename, url: window.location.href });
    } catch {
      // Dismissed: nothing to do.
    }
  }

  async function copy() {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }

  const button = { fontFamily: FONT_BODY, fontSize: 14, fontWeight: 700, padding: "10px 18px", borderRadius: 999, cursor: "pointer", border: `1px solid ${COLORS.hairline}`, background: "transparent", color: COLORS.ink, textDecoration: "none", display: "inline-block" };
  const primary = { ...button, background: COLORS.accent, borderColor: COLORS.accent, color: "#fff" };

  return createPortal(
    <div
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      style={{ position: "fixed", inset: 0, zIndex: 3000, background: "rgba(8, 9, 20, 0.66)", display: "flex", alignItems: "center", justifyContent: "center", padding: "clamp(10px, 4vw, 32px)" }}
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label="Share this as an image"
        style={{ width: "min(720px, 100%)", maxHeight: "92vh", overflowY: "auto", background: COLORS.paper, border: `1px solid ${COLORS.hairline}`, borderTop: `4px solid ${COLORS.accent}`, borderRadius: 18, boxShadow: "0 30px 80px rgba(0,0,0,0.45)", padding: "18px 20px 20px" }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14 }}>
          <div style={{ fontFamily: FONT_DISPLAY, fontSize: 20, color: COLORS.ink, flex: 1 }}>Share this as an image</div>
          <button ref={closeRef} type="button" onClick={onClose} aria-label="Close" style={{ width: 36, height: 36, borderRadius: "50%", border: `1px solid ${COLORS.hairline}`, background: COLORS.paperCard, color: COLORS.ink, cursor: "pointer", fontSize: 18, lineHeight: 1 }}>
            ×
          </button>
        </div>

        <div style={{ aspectRatio: "1200 / 630", background: COLORS.paperCard, border: `1px solid ${COLORS.hairline}`, borderRadius: 12, overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center" }}>
          {url ? (
            <img src={url} alt="The share card: a picture summarising this page" style={{ width: "100%", height: "100%", display: "block" }} />
          ) : (
            <span style={{ fontFamily: FONT_BODY, fontSize: 13.5, color: COLORS.inkSoft }}>{error ? "Couldn't make the image. Try again in a moment." : "Drawing your card…"}</span>
          )}
        </div>

        <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginTop: 16 }}>
          {canShareFile && <button type="button" onClick={share} style={primary}>Share…</button>}
          {url && (
            <a href={url} download={`${filename}.png`} style={canShareFile ? button : primary}>
              Download image
            </a>
          )}
          <button type="button" onClick={copy} style={button}>{copied ? "Link copied ✓" : "Copy link to this page"}</button>
        </div>
        <p style={{ fontFamily: FONT_BODY, fontSize: 12, color: COLORS.inkSoft, lineHeight: 1.55, margin: "12px 0 0" }}>
          The link opens this same page. Link previews on social media show the site's general card, so attach this image to show the details.
        </p>
      </div>
    </div>,
    document.body
  );
}

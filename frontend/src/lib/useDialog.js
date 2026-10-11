import { useEffect, useRef } from "react";

// Makes a box behave like a proper dialog while it is open: focus moves into it, Tab stays inside it, Escape closes it, the page behind
// does not scroll, and focus goes back to what opened it. (The older pop-ups on the site each carry their own copy of this.)
//   panelRef: the dialog element (give it tabIndex={-1})
//   returnFocusRef: the element that opened it. Safari does not focus a button when it is clicked, so asking the page "what was
//   focused?" would find nothing; the caller says instead.
//   initialFocusRef: what to focus first, if not the panel itself (a close button, say).
const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

export function focusableIn(panel) {
  return [...panel.querySelectorAll(FOCUSABLE)].filter((el) => {
    const style = getComputedStyle(el);
    return !el.hidden && style.display !== "none" && style.visibility !== "hidden";
  });
}

export function useDialog({ open, onClose, panelRef, returnFocusRef, initialFocusRef, lockScroll = true }) {
  const closeRef = useRef(onClose);
  useEffect(() => { closeRef.current = onClose; });

  useEffect(() => {
    if (!open) return undefined;
    const panel = panelRef.current;
    const opener = returnFocusRef?.current ?? document.activeElement;
    (initialFocusRef?.current ?? panel)?.focus?.({ preventScroll: true });
    const before = document.body.style.overflow;
    if (lockScroll) document.body.style.overflow = "hidden";

    function onKey(event) {
      if (event.key === "Escape") {
        event.stopPropagation();
        closeRef.current?.();
        return;
      }
      if (event.key !== "Tab" || !panel) return;
      const items = focusableIn(panel);
      if (items.length === 0) {
        event.preventDefault();
        panel.focus();
        return;
      }
      const first = items[0];
      const last = items[items.length - 1];
      const active = document.activeElement;
      if (!panel.contains(active)) {
        event.preventDefault();
        first.focus();
      } else if (event.shiftKey && (active === first || active === panel)) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && active === last) {
        event.preventDefault();
        first.focus();
      }
    }
    document.addEventListener("keydown", onKey, true);
    return () => {
      document.removeEventListener("keydown", onKey, true);
      if (lockScroll) document.body.style.overflow = before;
      opener?.focus?.({ preventScroll: true });
    };
  }, [open, panelRef, returnFocusRef, initialFocusRef, lockScroll]);
}

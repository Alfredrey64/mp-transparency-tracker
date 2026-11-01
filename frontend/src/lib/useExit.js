import { useCallback, useEffect, useRef, useState } from "react";

// A box that eases away instead of vanishing. `close` marks it as closing (the box's CSS plays its exit for `data-closing`) and calls `onClose` once that has played;
// with reduced motion it closes at once. A second call while it is on its way out does nothing.
export function useExit(onClose, ms = 150) {
  const [closing, setClosing] = useState(false);
  const timer = useRef(0);
  const latest = useRef(onClose);
  useEffect(() => { latest.current = onClose; });
  useEffect(() => () => window.clearTimeout(timer.current), []);
  const close = useCallback(() => {
    if (timer.current) return;
    if (typeof matchMedia === "function" && matchMedia("(prefers-reduced-motion: reduce)").matches) { latest.current?.(); return; }
    setClosing(true);
    timer.current = window.setTimeout(() => latest.current?.(), ms);
  }, [ms]);
  return [closing, close];
}

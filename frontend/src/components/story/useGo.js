import { useCallback, useEffect, useRef, useState } from "react";
import { useReducedMotion } from "motion/react";
import { useInView } from "../../lib/useInView";

// For a picture that plays once, when it scrolls into view: attach `ref` to its figure and put `data-go={go}` on it. It is "1" once the picture is in view, and at
// once for anyone who has asked for calmer motion, so they see the finished picture and not an empty one.
export function useGo(threshold = 0.2) {
  const [ref, seen] = useInView(threshold);
  const still = useReducedMotion();
  return [ref, seen || still ? "1" : "0"];
}

// For a picture whose boxes arrive first and whose moving parts (coins, letters, speech bubbles) only set off once they are there. Like useGo, plus a third value: the time on the
// picture's own animation clock (in seconds) at which the moving parts should start, or null until `delay` seconds after it came into view (and always null for anyone who has
// asked for calmer motion). Give each moving part `begin = start + its own offset`; SMIL counts from when the picture was drawn, not from when it scrolled into view, so
// without this the coins would already be halfway along their routes while the boxes are still arriving.
export function useGoMotion(threshold = 0.2, delay = 2) {
  const [inView, seen] = useInView(threshold);
  const still = useReducedMotion();
  const node = useRef(null);
  const ref = useCallback((n) => { node.current = n; inView(n); }, [inView]);
  const [t0, setT0] = useState(null);
  useEffect(() => {
    if (!seen || still) return undefined;
    const id = window.setTimeout(() => setT0(node.current?.getCurrentTime?.() ?? 0), delay * 1000);
    return () => window.clearTimeout(id);
  }, [seen, still, delay]);
  return [ref, seen || still ? "1" : "0", still ? null : t0];
}

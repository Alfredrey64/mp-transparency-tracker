import { useLayoutEffect, useState } from "react";
import { useReducedMotion } from "motion/react";

// A figure that counts up to `target` once, when `go` (from useGo) turns "1". It starts out at the target, so the page as first drawn (and for anyone who has asked for calmer motion, or
// before the picture is in view and still hidden) already reads correctly; the count only runs from zero when the picture comes into view.
export function useCount(target, go, ms = 1400, delay = 0) {
  const [v, setV] = useState(target);
  const still = useReducedMotion();
  // A layout effect, so the figure drops to zero before the first frame it is in view and does not flash its full value first; `delay` (ms) holds it at zero while the card around it is still arriving.
  useLayoutEffect(() => {
    if (go !== "1" || still) return undefined;
    let raf = 0;
    setV(0); // eslint-disable-line react-hooks/set-state-in-effect
    const t0 = performance.now() + delay;
    const step = (t) => {
      const p = Math.min(1, Math.max(0, (t - t0) / ms));
      setV(p >= 1 ? target : target * (1 - (1 - p) ** 3));
      if (p < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [go, still, target, ms, delay]);
  return v;
}

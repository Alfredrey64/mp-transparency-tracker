import { useEffect, useRef, useState } from "react";
import { animate, useInView, useReducedMotion } from "framer-motion";

// A number that counts up to its value the first time it scrolls into view.
// Shows the final value straight away for anyone who prefers reduced motion,
// and `format` lets callers keep their own formatting (commas, %, decimals).
export default function CountUp({ value, format = (n) => Math.round(n).toLocaleString("en-GB"), duration = 1.1 }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-40px" });
  const reduce = useReducedMotion();
  const [shown, setShown] = useState(null);

  useEffect(() => {
    if (!inView || reduce) return;
    const controls = animate(0, value, { duration, ease: "easeOut", onUpdate: setShown });
    return () => controls.stop();
  }, [inView, reduce, value, duration]);

  const display = reduce ? value : shown ?? (inView ? 0 : value);
  return <span ref={ref}>{format(display)}</span>;
}

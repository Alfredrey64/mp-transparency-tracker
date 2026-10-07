import { useEffect, useRef, useState } from "react";
import { animate, useInView, useReducedMotion } from "framer-motion";

// A number that counts up to its value the first time it scrolls into view.
// Shows the final value straight away for anyone who prefers reduced motion,
// and `format` lets callers keep their own formatting (commas, %, decimals).
//
// The final value is laid out invisibly underneath the counting number, so the space
// it needs is reserved from the start. Without that, the text grows as the digits
// climb and can wrap onto another line, which makes the whole box jump.
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

  const final = format(value);
  if (reduce) return <span ref={ref}>{final}</span>;
  return (
    <span ref={ref} style={{ display: "inline-grid" }}>
      <span aria-hidden="true" style={{ gridArea: "1 / 1", visibility: "hidden" }}>{final}</span>
      <span style={{ gridArea: "1 / 1" }} aria-label={final}>{format(shown ?? 0)}</span>
    </span>
  );
}

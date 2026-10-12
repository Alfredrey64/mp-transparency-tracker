import { useEffect, useRef, useState } from "react";
import { useReducedMotion } from "framer-motion";
import { useInView } from "../lib/useInView";

// A block that eases up and fades in the first time it scrolls into view. Nothing slides or grows: the content is already the right size
// and in the right place, it only becomes visible. Skipped entirely when the visitor has asked for reduced motion.
export function Reveal({ as: Tag = "div", delay = 0, children, style, className = "", ...rest }) {
  const [ref, seen] = useInView();
  const reduce = useReducedMotion();
  return (
    <Tag ref={ref} className={`reveal ${className}`} data-in={seen || reduce ? "true" : "false"} style={{ "--reveal-delay": `${delay}ms`, ...style }} {...rest}>
      {children}
    </Tag>
  );
}

const easeOut = (t) => 1 - (1 - t) ** 3;

// A number that counts up to its value once, when it scrolls into view. Assistive technology reads the final number, not the count.
export function CountUp({ value, decimals = 0, prefix = "", suffix = "", duration = 1100, style }) {
  const [ref, seen] = useInView(0.3);
  const reduce = useReducedMotion();
  const [shown, setShown] = useState(null);
  const raf = useRef(0);

  useEffect(() => {
    if (!seen || reduce) return undefined;
    const t0 = performance.now();
    const tick = (now) => {
      const p = Math.min(1, (now - t0) / duration);
      setShown(value * easeOut(p));
      if (p < 1) raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf.current);
  }, [seen, reduce, value, duration]);

  const fmt = (n) => n.toLocaleString("en-GB", { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
  const done = `${prefix}${fmt(value)}${suffix}`;
  const live = shown == null || reduce ? done : `${prefix}${fmt(shown)}${suffix}`;
  return (
    <span ref={ref} style={style}>
      <span aria-hidden="true" style={{ fontVariantNumeric: "tabular-nums" }}>{seen ? live : done}</span>
      <span className="sr-only">{done}</span>
    </span>
  );
}

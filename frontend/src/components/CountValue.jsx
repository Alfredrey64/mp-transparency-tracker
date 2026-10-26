import { useEffect, useRef, useState } from "react";
import { animate, useInView } from "motion/react";

// A headline figure that counts up to its value the first time it scrolls into view. The text it settles on is exactly the text it was given
// ("£39,200", "5.6 times", "32.7%"); a value that is not a plain figure, or a visitor who asks for less motion, just gets the text.
const PLAIN = /^(\D*?)(\d[\d,]*(?:\.\d+)?)(\D*)$/;

function parse(text) {
  if (typeof text !== "string") return null;
  const m = PLAIN.exec(text.trim());
  if (!m) return null;
  const raw = m[2];
  const value = Number(raw.replace(/,/g, ""));
  if (!Number.isFinite(value) || value === 0 || value > 1e9) return null;
  return { pre: m[1], post: m[3], value, decimals: raw.includes(".") ? raw.split(".")[1].length : 0, commas: raw.includes(",") };
}

const show = (p, v) => `${p.pre}${v.toLocaleString("en-GB", { minimumFractionDigits: p.decimals, maximumFractionDigits: p.decimals, useGrouping: p.commas })}${p.post}`;

export default function CountValue({ children }) {
  const ref = useRef(null);
  const parts = parse(children);
  const calm = typeof window === "undefined" || !window.matchMedia || typeof IntersectionObserver === "undefined" || window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const active = Boolean(parts) && !calm;
  const inView = useInView(ref, { once: true, margin: "0px 0px -10% 0px" });
  const [text, setText] = useState(children);

  useEffect(() => {
    if (!active || !inView) return undefined;
    const controls = animate(0, parts.value, { duration: 1.1, ease: [0.22, 1, 0.36, 1], onUpdate: (v) => setText(show(parts, v)), onComplete: () => setText(children) });
    return () => controls.stop();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active, inView, children]);

  return <span ref={ref}>{active && !inView ? show(parts, 0) : text}</span>;
}

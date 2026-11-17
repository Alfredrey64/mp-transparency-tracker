import { useEffect, useRef, useState } from "react";
import { useT } from "../lib/useLang";

// A round button that appears once a long page has been scrolled, with a ring around it that fills as you read down the page. Tapping it
// returns to the top.
const R = 21;
const CIRC = 2 * Math.PI * R;

export default function BackToTop() {
  const t = useT();
  const ref = useRef(null);
  const [on, setOn] = useState(false);
  const shown = useRef(false);

  useEffect(() => {
    let frame = 0;
    const update = () => {
      frame = 0;
      const max = document.documentElement.scrollHeight - window.innerHeight;
      const y = window.scrollY;
      ref.current?.style.setProperty("--p", (max > 0 ? Math.min(1, y / max) : 0).toFixed(4));
      // Once it is showing it stays until the visitor is clearly back near the top or the page has clearly become short, so a page that
      // changes height while it loads (or a scroll that hovers around the line) never makes the button blink.
      shown.current = shown.current ? y > 480 && max > 1000 : y > 700 && max > 1600;
      setOn(shown.current);
    };
    const onScroll = () => { if (!frame) frame = requestAnimationFrame(update); };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => { cancelAnimationFrame(frame); window.removeEventListener("scroll", onScroll); window.removeEventListener("resize", onScroll); };
  }, []);

  function toTop() {
    const calm = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    window.scrollTo({ top: 0, behavior: calm ? "auto" : "smooth" });
  }

  return (
    <button
      ref={ref} type="button" className={`to-top${on ? " to-top-on" : ""}`} onClick={toTop}
      aria-label={t("Back to top")} tabIndex={on ? 0 : -1} aria-hidden={on ? undefined : "true"}
      style={{ position: "fixed" }}
    >
      <svg width="48" height="48" viewBox="0 0 48 48" aria-hidden="true" focusable="false">
        <circle cx="24" cy="24" r={R} fill="none" stroke="rgba(255,255,255,0.22)" strokeWidth="3" />
        <circle className="to-top-ring" cx="24" cy="24" r={R} fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeDasharray={CIRC} style={{ strokeDashoffset: `calc(${CIRC}px * (1 - var(--p, 0)))` }} transform="rotate(-90 24 24)" />
        <path d="M17.5 27.5 24 21l6.5 6.5" fill="none" stroke="#fff" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </button>
  );
}

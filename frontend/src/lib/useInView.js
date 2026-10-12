import { useCallback, useState } from "react";

// Whether an element has scrolled into view yet. It becomes true once and stays true, so a reveal plays one time. Without
// IntersectionObserver (old browsers, some test setups) everything counts as seen straight away.
export function useInView(threshold = 0.12) {
  const [seen, setSeen] = useState(false);
  const ref = useCallback((node) => {
    if (!node) return;
    if (typeof IntersectionObserver === "undefined") {
      setSeen(true);
      return;
    }
    const io = new IntersectionObserver((entries) => {
      if (entries.some((e) => e.isIntersecting)) {
        setSeen(true);
        io.disconnect();
      }
    }, { threshold, rootMargin: "0px 0px -6% 0px" });
    io.observe(node);
  }, [threshold]);
  return [ref, seen];
}

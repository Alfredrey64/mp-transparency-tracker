import { useRef } from "react";
import { useInView } from "motion/react";

// Notes when a box has first scrolled into view, so its bars, lines and numbers can draw themselves once, at the moment they can be seen.
export function useSeen(margin = "0px 0px -12% 0px") {
  const ref = useRef(null);
  const seen = useInView(ref, { once: true, margin });
  return [ref, seen];
}

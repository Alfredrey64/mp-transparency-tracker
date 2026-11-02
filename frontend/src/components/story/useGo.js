import { useReducedMotion } from "motion/react";
import { useInView } from "../../lib/useInView";

// For a picture that plays once, when it scrolls into view: attach `ref` to its figure and put `data-go={go}` on it. It is "1" once the picture is in view, and at
// once for anyone who has asked for calmer motion, so they see the finished picture and not an empty one.
export function useGo(threshold = 0.2) {
  const [ref, seen] = useInView(threshold);
  const still = useReducedMotion();
  return [ref, seen || still ? "1" : "0"];
}

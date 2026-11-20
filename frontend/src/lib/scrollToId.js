// Scrolls smoothly to an element on the page, or jumps there for anyone who has asked for less motion.
export function scrollToId(id) {
  const reduce = typeof matchMedia === "function" && matchMedia("(prefers-reduced-motion: reduce)").matches;
  document.getElementById(id)?.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });
}

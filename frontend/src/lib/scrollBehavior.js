// How to scroll to somewhere on the page: smoothly, unless the visitor has asked for calmer motion (the accessibility panel's setting, or their device's "reduce motion"), when the
// page simply jumps there. Pass it as `behavior` to scrollIntoView or scrollTo.
export function glide() {
  if (typeof document !== "undefined" && document.documentElement.hasAttribute("data-calm")) return "auto";
  if (typeof matchMedia === "function" && matchMedia("(prefers-reduced-motion: reduce)").matches) return "auto";
  return "smooth";
}

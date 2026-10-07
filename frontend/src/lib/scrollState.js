// Whether the page has scrolled in the last moment. When a page scrolls under a pointer that is not moving, the
// browser still reports the pointer "entering" whatever slides beneath it. Hover effects that ignore those reports
// (see BreakdownCard) stay still while a person scrolls, instead of flickering from one box to the next.

let last = 0;
if (typeof window !== "undefined") {
  window.addEventListener("scroll", () => { last = performance.now(); }, { passive: true, capture: true });
}

export const isScrolling = (quietMs = 180) => performance.now() - last < quietMs;

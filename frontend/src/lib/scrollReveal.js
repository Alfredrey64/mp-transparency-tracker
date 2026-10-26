// Cards that start below the fold rise into place as they scroll into view, one after another when they sit side by side; bars and lines inside
// them draw in at the same moment (see .rv-in in chrome.css). Anything already on screen when a page opens is left alone, so nothing flashes, and
// people who ask for less motion get none of it.
const TARGETS = "section, aside, article, .box-row > *, .home-features > *, .home-col > *";
const SKIP = "[role='dialog'], .page-hero, .site-header, .site-footer, .ons-noprint, .tm-print-card";

export function installScrollReveal(root) {
  if (typeof window === "undefined" || !root || typeof IntersectionObserver === "undefined" || !window.matchMedia) return () => {};
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return () => {};

  const seen = new WeakSet();
  const io = new IntersectionObserver(
    (entries) => {
      for (const e of entries) {
        if (!e.isIntersecting && e.boundingClientRect.top > 0) continue;
        e.target.classList.add("rv-in");
        io.unobserve(e.target);
      }
    },
    { rootMargin: "0px 0px -8% 0px", threshold: 0.02 },
  );

  function scan() {
    // Only the outermost candidates are handled: a card inside a card rises with its parent.
    const outer = [...root.querySelectorAll(TARGETS)].filter((el) => !seen.has(el) && !el.closest(SKIP) && !el.parentElement?.closest(TARGETS));
    const groups = new Map();
    for (const el of outer) {
      seen.add(el);
      const r = el.getBoundingClientRect();
      if (r.height < 40) continue;
      if (r.top < window.innerHeight * 0.92) { el.classList.add("rv-now"); continue; }
      const parent = el.parentElement;
      const n = groups.get(parent) ?? 0;
      groups.set(parent, n + 1);
      el.style.setProperty("--rv-d", `${Math.min(n, 5) * 70}ms`);
      el.classList.add("rv");
      io.observe(el);
    }
  }

  let frame = 0;
  const mo = new MutationObserver(() => { cancelAnimationFrame(frame); frame = requestAnimationFrame(scan); });
  mo.observe(root, { childList: true, subtree: true });
  frame = requestAnimationFrame(scan);
  const onPrint = () => root.querySelectorAll(".rv").forEach((el) => el.classList.add("rv-in"));
  window.addEventListener("beforeprint", onPrint);
  return () => { cancelAnimationFrame(frame); mo.disconnect(); io.disconnect(); window.removeEventListener("beforeprint", onPrint); };
}

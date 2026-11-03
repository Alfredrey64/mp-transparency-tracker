// Every <details> fold-out on the site opens and closes with the same short movement: the box grows (or shrinks) to the height of what is inside while its words fade in
// behind the edge, so nothing is stretched or scaled and the content below simply eases down. The browser's own open and close is instant, so this takes over the click on
// a summary, and does nothing for people who ask for less motion. Pressing again part way through reverses from where the box has got to.
const MS = 280;
const EASE = "cubic-bezier(0.22, 1, 0.36, 1)";
const running = new WeakMap();

const px = (v) => parseFloat(v) || 0;
function closedHeight(d, summary) {
  const cs = getComputedStyle(d);
  return summary.getBoundingClientRect().height + px(cs.paddingTop) + px(cs.paddingBottom) + px(cs.borderTopWidth) + px(cs.borderBottomWidth);
}

function toggle(d, summary) {
  const closing = running.get(d)?.closing ?? d.open;
  const from = d.getBoundingClientRect().height;
  running.get(d)?.anim.cancel();
  const body = [...d.children].filter((c) => c !== summary);
  let to;
  if (closing) to = closedHeight(d, summary);
  else { d.open = true; to = d.getBoundingClientRect().height; }
  const done = () => { running.delete(d); if (closing) d.open = false; };
  if (Math.abs(to - from) < 1) { done(); return; }
  const anim = d.animate([{ height: `${from}px`, overflow: "hidden" }, { height: `${to}px`, overflow: "hidden" }], { duration: MS, easing: EASE });
  running.set(d, { anim, closing });
  body.forEach((c) => c.animate(closing ? [{ opacity: 1 }, { opacity: 0 }] : [{ opacity: 0 }, { opacity: 1 }], { duration: closing ? MS * 0.6 : MS * 0.8, delay: closing ? 0 : MS * 0.15, easing: "ease-out", fill: closing ? "forwards" : "backwards" }));
  anim.finished.then(done, () => {});
}

export function installDetailsMotion(doc = document) {
  doc.addEventListener("click", (ev) => {
    const summary = ev.target instanceof Element ? ev.target.closest("summary") : null;
    const d = summary?.parentElement;
    if (!d || d.tagName !== "DETAILS" || ev.defaultPrevented || !d.animate || d.closest(".page-ghost")) return;
    if (doc.defaultView.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;
    // A link or button inside the summary keeps its own job.
    if (ev.target.closest("a, button, input, select, textarea") && ev.target.closest("a, button, input, select, textarea") !== summary) return;
    ev.preventDefault();
    toggle(d, summary);
  });
}

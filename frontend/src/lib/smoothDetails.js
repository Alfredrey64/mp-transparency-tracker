// Native <details> fold-outs open and shut with a jump. Browsers that can animate to an automatic height do it in CSS (index.css). For the rest (Safari and the browsers built on its
// engine), this does the same job with the Web Animations API: pressing a summary measures the box before and after, then grows or shrinks it between the two on the site's usual
// fold curve. It only runs where the CSS version is unavailable, leaves everything alone under reduced motion, and a press in the middle of a move turns it round from where it is.
const OPEN_MS = 340;
const SHUT_MS = 240;
const EASE_OUT = "cubic-bezier(0.22, 1, 0.36, 1)";
const EASE_IN = "cubic-bezier(0.4, 0, 0.2, 1)";
const running = new WeakMap();
const intent = new WeakMap();

function animateDetails(details, opening) {
  const previous = running.get(details);
  const from = details.getBoundingClientRect().height;
  if (previous) previous.cancel();
  const summary = details.querySelector(":scope > summary");
  const shut = (summary ? summary.getBoundingClientRect().height : 0) + parseFloat(getComputedStyle(details).borderTopWidth || 0) + parseFloat(getComputedStyle(details).borderBottomWidth || 0) + parseFloat(getComputedStyle(details).paddingTop || 0) + parseFloat(getComputedStyle(details).paddingBottom || 0);
  if (opening) details.open = true;
  const full = opening ? details.getBoundingClientRect().height : from;
  const to = opening ? full : shut;
  details.style.overflow = "hidden";
  const anim = details.animate({ height: [`${from}px`, `${to}px`] }, { duration: opening ? OPEN_MS : SHUT_MS, easing: opening ? EASE_OUT : EASE_IN });
  running.set(details, anim);
  const done = (finished) => {
    if (running.get(details) !== anim) return;
    running.delete(details);
    details.style.overflow = "";
    if (finished && !opening) details.open = false;
  };
  anim.onfinish = () => done(true);
  anim.oncancel = () => done(false);
}

export function installSmoothDetails() {
  if (typeof document === "undefined" || typeof CSS === "undefined" || typeof CSS.supports !== "function") return;
  if (CSS.supports("interpolate-size: allow-keywords")) return; // the stylesheet already does it
  if (typeof Element === "undefined" || typeof Element.prototype.animate !== "function") return;
  document.addEventListener("click", (event) => {
    if (event.defaultPrevented || event.button !== 0) return;
    const summary = event.target instanceof Element ? event.target.closest("summary") : null;
    const details = summary?.parentElement;
    if (!details || details.tagName !== "DETAILS" || details.firstElementChild !== summary) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    if (details.hasAttribute("data-no-smooth") || details.closest("[data-no-smooth]")) return;
    event.preventDefault();
    // What the box is heading for: while a move is under way that is the last thing asked, otherwise it is the opposite of how it stands.
    const heading = running.has(details) ? intent.get(details) : details.open;
    const opening = !heading;
    intent.set(details, opening);
    animateDetails(details, opening);
  });
}

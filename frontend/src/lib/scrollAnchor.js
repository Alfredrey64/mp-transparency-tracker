// Scroll anchoring for browsers that do not do it themselves (Safari, and every browser on an iPhone).
//
// When something above where a visitor is reading changes height (a card that finishes loading, an image that gets its size, a list that fills in), Chrome and Firefox quietly move the
// scroll position by the same amount so the words under the visitor's eyes stay put. Safari does not, so the page lurches down by that much. This does what they do: it remembers which
// element sits at the top of the screen and how far down the page it is, and when the page's height changes it scrolls by however far that element has been pushed.
//
// It uses layout positions (offsetTop), not where an element is drawn, so a card that is sliding into place with a transform is not mistaken for a shift. It does nothing at the very top of the
// page, while the visitor is dragging, for a moment after a tap or key press (what that changes is the visitor's own doing, and the code that opens and closes boxes keeps its own control still), while a box
// around the anchor is changing size, or for a moment after code that has positioned the page deliberately calls pauseScrollAnchor(). Chrome and Firefox get none of this.
// (Safari answers "yes" if asked whether it supports `overflow-anchor`, and then does not do it, so the check is on the browser's engine instead.)

let pausedUntil = 0;
// Called by code that scrolls or positions the page on purpose (an in-page tab switch, a fold-out that keeps its button still), so this does not add its own correction.
export function pauseScrollAnchor(ms = 600) { pausedUntil = Math.max(pausedUntil, performance.now() + ms); }

// Distance from the top of the document to the top of an element, from layout alone (ignores transforms).
export function layoutTop(el) {
  let top = 0;
  for (let e = el; e; e = e.offsetParent) top += e.offsetTop;
  return top;
}

// Chrome does not anchor while the anchor or a box around it is having its size animated; this checks the same thing (Web Animations and CSS transitions on a layout property).
const LAYOUT_PROPS = /^(height|width|blockSize|inlineSize|margin|padding|top|bottom|left|right|maxHeight|minHeight|flex|gridTemplate)/i;
export function sizeAnimating(el) {
  for (let e = el; e && e !== document.body; e = e.parentElement) {
    for (const a of e.getAnimations?.() ?? []) {
      let props = [];
      try { props = (a.effect?.getKeyframes?.() ?? []).flatMap((k) => Object.keys(k)); } catch { /* an animation we cannot read */ }
      if (a.transitionProperty ? LAYOUT_PROPS.test(a.transitionProperty.replace(/-(\w)/g, (_, c) => c.toUpperCase())) : props.some((p) => LAYOUT_PROPS.test(p))) return true;
    }
  }
  return false;
}

const fixedAbove = (el) => { for (let e = el; e && e !== document.body; e = e.parentElement) { const p = getComputedStyle(e).position; if (p === "fixed" || p === "sticky") return true; } return false; };

// The element at the top of the screen that makes a good anchor: a block (not a run of text), not fixed to the screen.
export function pickAnchor(doc = document) {
  const x = Math.round(doc.documentElement.clientWidth / 2);
  for (const y of [12, 60, 140]) {
    for (const el of doc.elementsFromPoint(x, y)) {
      if (el === doc.documentElement || el === doc.body || el.id === "root" || fixedAbove(el)) continue;
      let a = el;
      while (a.parentElement && a.parentElement !== doc.body && getComputedStyle(a).display.startsWith("inline")) a = a.parentElement;
      if (a.offsetParent === null) continue;
      return a;
    }
  }
  return null;
}

// True for browsers built on WebKit without Chrome's engine: Safari, other browsers on a Mac that use WebKit, and every browser on an iPhone or iPad (Chrome and Firefox there say CriOS / FxiOS).
export const lacksScrollAnchoring = (ua = "") => /AppleWebKit/.test(ua) && (!/Chrome\//.test(ua) || /(CriOS|FxiOS|EdgiOS|OPiOS)/.test(ua));

export function installScrollAnchor(win = window) {
  const doc = win.document;
  if (!lacksScrollAnchoring(win.navigator?.userAgent)) return () => {};
  let anchor = null;
  let lastTop = 0;
  let dragging = false;
  let settle = 0;
  let touchedAt = -Infinity;
  const GRACE = 900;
  const poked = () => { touchedAt = performance.now(); };
  const remember = () => { anchor = pickAnchor(doc); lastTop = anchor ? layoutTop(anchor) : 0; };
  const onScroll = () => { win.clearTimeout(settle); settle = win.setTimeout(remember, 120); };
  const onResize = () => {
    if (!anchor || !anchor.isConnected) { remember(); return; }
    const top = layoutTop(anchor);
    const shift = top - lastTop;
    lastTop = top;
    if (Math.abs(shift) < 1 || dragging || win.scrollY < 1 || performance.now() < pausedUntil || performance.now() - touchedAt < GRACE || sizeAnimating(anchor)) return;
    win.scrollTo({ top: win.scrollY + shift, behavior: "instant" });
  };
  const ro = new win.ResizeObserver(onResize);
  ro.observe(doc.body);
  const touch = (v) => () => { dragging = v; if (!v) remember(); };
  const start = touch(true); const end = touch(false);
  win.addEventListener("pointerdown", poked, { passive: true, capture: true });
  win.addEventListener("keydown", poked, { passive: true, capture: true });
  win.addEventListener("scroll", onScroll, { passive: true });
  win.addEventListener("touchstart", start, { passive: true });
  win.addEventListener("touchend", end, { passive: true });
  win.addEventListener("touchcancel", end, { passive: true });
  remember();
  return () => {
    ro.disconnect();
    win.removeEventListener("pointerdown", poked, true); win.removeEventListener("keydown", poked, true);
    win.removeEventListener("scroll", onScroll); win.removeEventListener("touchstart", start); win.removeEventListener("touchend", end); win.removeEventListener("touchcancel", end);
    win.clearTimeout(settle);
  };
}

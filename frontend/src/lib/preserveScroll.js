import { flushSync } from "react-dom";
import { pauseScrollAnchor } from "./scrollAnchor";

// Switching an in-page tab, filter or accordion can change the content's height enough that the browser clamps the current scroll
// position, which reads as an unwanted jump. This applies the change and puts the page back where it was in the same frame, before
// the browser paints, so nothing visibly moves. (It used to restore two frames later, which showed as a flicker.) A second restore
// follows once layout has settled, for late-sizing content such as images and charts.
//
// Call it from an event handler.
export function withScrollPreserved(fn) {
  pauseScrollAnchor(700);
  const y = window.scrollY;
  flushSync(fn);
  if (window.scrollY !== y) window.scrollTo(0, y);
  requestAnimationFrame(() => {
    if (Math.abs(window.scrollY - y) > 1) window.scrollTo(0, y);
  });
}

// For a control that opens one thing while another, above it, closes (an accordion that keeps one open): holding the page's scroll still would leave the control sliding up the
// screen by the height of what closed, away from the finger that pressed it. This keeps the control itself where it was, in the same frame, and keeps it there for the length of
// a fold-out's movement, so it stays put if the thing above is still closing. Anything the reader does in the meantime (scrolling, a touch) ends it at once.
const HOLD_MS = 450;
export function holdPlace(control, fn) {
  if (!control || !control.isConnected) { flushSync(fn); return; }
  pauseScrollAnchor(HOLD_MS + 250);
  const top = control.getBoundingClientRect().top;
  const settle = () => {
    if (!control.isConnected) return;
    const drift = control.getBoundingClientRect().top - top;
    if (Math.abs(drift) >= 1) window.scrollBy(0, drift);
  };
  flushSync(fn);
  settle();
  let stop = false;
  const end = () => { stop = true; };
  const opts = { once: true, passive: true };
  window.addEventListener("wheel", end, opts);
  window.addEventListener("touchstart", end, opts);
  window.addEventListener("keydown", end, { once: true });
  const t0 = performance.now();
  const tick = () => {
    if (stop || performance.now() - t0 > HOLD_MS) { window.removeEventListener("wheel", end); window.removeEventListener("touchstart", end); window.removeEventListener("keydown", end); return; }
    settle();
    requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
}

// For a press that swaps the whole view for a different one (a list for one person's page, and back) and should land at the top of the new view. Done in one frame: the new view is drawn and
// the page is put at the top before anything is painted, so there is no moment when the browser, finding the new view shorter than where the reader was standing, throws the page to its
// bottom and then glides back up. Call it from an event handler or a promise that follows one.
export function swapView(fn) {
  pauseScrollAnchor(700);
  flushSync(fn);
  window.scrollTo(0, 0);
}

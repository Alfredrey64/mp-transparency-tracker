import { flushSync } from "react-dom";

// Switching an in-page tab, filter or accordion can change the content's height enough that the browser clamps the current scroll
// position, which reads as an unwanted jump. This applies the change and puts the page back where it was in the same frame, before
// the browser paints, so nothing visibly moves. (It used to restore two frames later, which showed as a flicker.) A second restore
// follows once layout has settled, for late-sizing content such as images and charts.
//
// Call it from an event handler.
export function withScrollPreserved(fn) {
  const y = window.scrollY;
  flushSync(fn);
  if (window.scrollY !== y) window.scrollTo(0, y);
  requestAnimationFrame(() => {
    if (Math.abs(window.scrollY - y) > 1) window.scrollTo(0, y);
  });
}

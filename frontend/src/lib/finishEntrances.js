// A page change is already one motion (the old page lifts away and the new one rises into place, see chrome.css). The cards, bars and lines of the new page each have
// their own opening animation as well, and those would run underneath it, so the page would move in two ways at once. This jumps every one-off animation inside
// the page to its end, so only the page-wide motion is seen. Animations that repeat for ever (a running light, a pulse) are left going.
export function finishEntrances(scope = typeof document === "undefined" ? null : document.getElementById("main-content")) {
  if (!scope || typeof scope.getAnimations !== "function") return 0;
  let done = 0;
  for (const a of scope.getAnimations({ subtree: true })) {
    if (typeof CSSAnimation !== "undefined" && !(a instanceof CSSAnimation)) continue;
    const iterations = a.effect?.getComputedTiming?.().iterations;
    if (!Number.isFinite(iterations)) continue;
    try { a.finish(); done++; } catch { /* an animation that cannot be finished is left to run */ }
  }
  return done;
}

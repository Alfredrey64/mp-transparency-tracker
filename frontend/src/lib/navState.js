import { useSyncExternalStore } from "react";

// Where a page change is heading, and whether its code is still arriving. Kept outside App so that a click only updates the pieces that show it (the
// highlighted link and the progress line) and does not draw the whole page you are leaving a second time before it fades.
let state = { target: null, fetching: false };
const listeners = new Set();

export function setNavState(patch) {
  const next = { ...state, ...patch };
  if (next.target === state.target && next.fetching === state.fetching) return;
  state = next;
  listeners.forEach((l) => l());
}

function subscribe(l) {
  listeners.add(l);
  return () => listeners.delete(l);
}

export function useNavState() {
  return useSyncExternalStore(subscribe, () => state, () => state);
}

// Runs `fn` once the page change that has just started has put the new page in and begun to show it (at once if no change is under way). A menu or search panel that
// sits over the page uses this to close, so the page behind it is never seen between the old page and the new one. It runs after `limit` ms at most.
export function afterSwap(fn, limit = 3000) {
  if (!state.fetching) { fn(); return; }
  const start = performance.now();
  let done = false;
  const finish = () => { if (done) return; done = true; listeners.delete(check); fn(); };
  // Once the pages are swapped, wait for the new one to start fading in.
  const waitShown = () => {
    if (done) return;
    if (!document.documentElement.dataset.leaving || performance.now() - start > limit) finish();
    else requestAnimationFrame(waitShown);
  };
  const check = () => { if (!state.fetching) { listeners.delete(check); waitShown(); } };
  listeners.add(check);
  setTimeout(finish, limit);
}

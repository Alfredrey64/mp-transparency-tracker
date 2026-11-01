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

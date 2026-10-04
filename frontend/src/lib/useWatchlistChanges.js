import { useEffect, useState } from "react";
import { WATCHLIST_EVENT } from "./watchlist";

// { following, changes } for the MPs this browser follows, or null until
// known. The counting code loads on demand so it doesn't weigh down the first
// paint, and runs again whenever the watchlist or its last-checked time changes.
export function useWatchlistChanges() {
  const [state, setState] = useState(null);
  useEffect(() => {
    let cancelled = false;
    function refresh() {
      import("./watchlistChanges")
        .then((m) => m.countWatchlistChanges())
        .then((r) => {
          if (!cancelled) setState(r);
        })
        .catch(() => {});
    }
    refresh();
    window.addEventListener(WATCHLIST_EVENT, refresh);
    return () => {
      cancelled = true;
      window.removeEventListener(WATCHLIST_EVENT, refresh);
    };
  }, []);
  return state;
}

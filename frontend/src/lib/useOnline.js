import { useSyncExternalStore } from "react";

// Whether the browser thinks it has a connection. It is a hint (a network can be connected and still slow or broken), used only to say
// "you are offline" and never to block anything.
function subscribe(callback) {
  window.addEventListener("online", callback);
  window.addEventListener("offline", callback);
  return () => {
    window.removeEventListener("online", callback);
    window.removeEventListener("offline", callback);
  };
}

export function useOnline() {
  return useSyncExternalStore(subscribe, () => navigator.onLine, () => true);
}

import { useSyncExternalStore } from "react";

// True on a phone-sized screen (700px wide or less), and follows the screen if it is turned or resized. Pictures and animations that only work with room to spare use it to
// give a phone something simpler instead.
const QUERY = "(max-width: 700px)";

function subscribe(onChange) {
  if (typeof matchMedia !== "function") return () => {};
  const m = matchMedia(QUERY);
  m.addEventListener("change", onChange);
  return () => m.removeEventListener("change", onChange);
}

const now = () => typeof matchMedia === "function" && matchMedia(QUERY).matches;

export function usePhone() {
  return useSyncExternalStore(subscribe, now, () => false);
}

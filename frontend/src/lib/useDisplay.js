import { useCallback, useEffect, useState } from "react";
import { load, save, apply, clean, DEFAULTS } from "./display";

// The visitor's display choices as React state. Every part of the page that shows or changes them (the panel in the header, the Accessibility page, the app
// itself for calmer motion) hears about a change through one window event, so they never disagree.
const EVENT = "sp-display";

export function useDisplay() {
  const [prefs, setPrefs] = useState(load);
  useEffect(() => {
    const on = () => setPrefs(load());
    window.addEventListener(EVENT, on);
    return () => window.removeEventListener(EVENT, on);
  }, []);
  const change = useCallback((patch) => {
    const next = clean({ ...load(), ...patch });
    save(next); apply(next);
    window.dispatchEvent(new Event(EVENT));
  }, []);
  const reset = useCallback(() => change({ ...DEFAULTS }), [change]);
  return [prefs, change, reset];
}

// Asks the page to start reading itself aloud. The player (components/ReadAloud.jsx) is only loaded when this is first called.
export const LISTEN_EVENT = "sp-listen";
export const startListening = () => window.dispatchEvent(new Event(LISTEN_EVENT));

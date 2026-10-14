import { useSyncExternalStore } from "react";

// Install-to-home-screen support. Chrome and Edge on Android and desktop offer an install prompt through the beforeinstallprompt event, which can
// fire before the page has finished loading, so it is caught here as soon as the file loads. Safari on iPhone and iPad has no such event: the
// only way there is Share, then Add to Home Screen, so people on those get the steps instead of a button.

const listeners = new Set();
let deferred = null;
let installed = false;
let snapshot = null;

const read = (storage, key) => { try { return storage.getItem(key); } catch { return null; } };
const write = (storage, key, value) => { try { storage.setItem(key, value); } catch { /* private window or blocked storage: the banner just shows again next time */ } };

function emit() { snapshot = null; listeners.forEach((l) => l()); }
function subscribe(l) { listeners.add(l); return () => listeners.delete(l); }

// How many separate visits this device has made, counted once per browser session. The banner waits until the second.
let visits = 0;
if (typeof window !== "undefined") {
  visits = Number(read(window.localStorage, "sp-visits")) || 0;
  if (!read(window.sessionStorage, "sp-visit-counted")) {
    visits += 1;
    write(window.localStorage, "sp-visits", String(visits));
    write(window.sessionStorage, "sp-visit-counted", "1");
  }
  window.addEventListener("beforeinstallprompt", (e) => { e.preventDefault(); deferred = e; emit(); });
  window.addEventListener("appinstalled", () => { installed = true; deferred = null; emit(); });
}

export const isStandalone = () => typeof window !== "undefined" && (window.matchMedia?.("(display-mode: standalone)").matches || window.navigator.standalone === true);
export const isIos = () => typeof navigator !== "undefined" && (/iphone|ipad|ipod/i.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1));

function compute() {
  const standalone = isStandalone() || installed;
  return { standalone, canPrompt: Boolean(deferred) && !standalone, ios: isIos() && !standalone && !deferred, visits };
}
const getSnapshot = () => {
  if (snapshot === null) snapshot = compute();
  return snapshot;
};
const server = { standalone: false, canPrompt: false, ios: false, visits: 0 };

export const useInstall = () => useSyncExternalStore(subscribe, getSnapshot, () => server);

// Shows the browser's own install dialog. Resolves to true if the person accepted.
export async function promptInstall() {
  if (!deferred) return false;
  const event = deferred;
  deferred = null;
  emit();
  await event.prompt();
  const choice = await event.userChoice;
  return choice.outcome === "accepted";
}

const DISMISS_KEY = "sp-install-dismissed";
export const installDismissed = () => read(window.localStorage, DISMISS_KEY) === "1";
export const dismissInstall = () => write(window.localStorage, DISMISS_KEY, "1");

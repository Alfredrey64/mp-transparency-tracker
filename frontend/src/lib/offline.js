// Registers the service worker (public/sw.js) so the site can open without a connection, and tells it which files this visit loaded so
// the whole app is saved after the first visit. Production only: in development it would hold on to old code.

const sameOriginBuiltFiles = () =>
  performance
    .getEntriesByType("resource")
    .map((entry) => entry.name)
    .filter((name) => {
      try {
        const url = new URL(name);
        return url.origin === window.location.origin && /^\/(assets|fonts)\//.test(url.pathname);
      } catch {
        return false;
      }
    });

export function registerOffline() {
  if (!import.meta.env.PROD || !("serviceWorker" in navigator)) return;
  window.addEventListener("load", async () => {
    try {
      await navigator.serviceWorker.register("/sw.js");
      const ready = await navigator.serviceWorker.ready;
      ready.active?.postMessage({ type: "cache-urls", urls: sameOriginBuiltFiles() });
    } catch {
      // Offline support is an extra: if it cannot start, the site works as it always did.
    }
  });
}

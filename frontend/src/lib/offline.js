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

// When the site is installed as an app, quietly fetch every page's code once so the whole app works without a connection, not only the pages
// that were opened. Only on a good connection that is not metered, not when the person has asked for less data, and once per app version.
async function saveWholeApp(ready) {
  const link = navigator.connection;
  if (link && (link.saveData || link.type === "cellular" || (link.effectiveType && link.effectiveType !== "4g"))) return;
  const standalone = window.matchMedia?.("(display-mode: standalone)").matches || window.navigator.standalone === true;
  if (!standalone || !navigator.onLine) return;
  const build = document.querySelector('script[type="module"][src*="/assets/"]')?.getAttribute("src") ?? "dev";
  try {
    if (localStorage.getItem("sp-offline-saved") === build) return;
    const { LOADERS } = await import("../pageLoaders.js");
    for (const load of Object.values(LOADERS)) {
      if (!navigator.onLine) return;
      await load().catch(() => {});
      await new Promise((r) => setTimeout(r, 250));
    }
    ready.active?.postMessage({ type: "cache-urls", urls: sameOriginBuiltFiles() });
    localStorage.setItem("sp-offline-saved", build);
  } catch {
    // An extra: if it cannot finish, pages are still saved as they are opened.
  }
}

export function registerOffline() {
  if (!import.meta.env.PROD || !("serviceWorker" in navigator)) return;
  window.addEventListener("load", async () => {
    try {
      await navigator.serviceWorker.register("/sw.js");
      const ready = await navigator.serviceWorker.ready;
      ready.active?.postMessage({ type: "cache-urls", urls: sameOriginBuiltFiles() });
      const later = window.requestIdleCallback ?? ((fn) => setTimeout(fn, 4000));
      later(() => saveWholeApp(ready), { timeout: 15000 });
    } catch {
      // Offline support is an extra: if it cannot start, the site works as it always did.
    }
  });
}

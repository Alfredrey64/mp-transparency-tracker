// When a new version of the site is published while someone still has it open, the files the old version would load next no longer exist,
// and opening a page they had not visited yet fails. Vite reports that as a "preload error", and the browser words it differently
// ("Failed to fetch dynamically imported module", or in Safari "'text/html' is not a valid JavaScript MIME type", because the host answers a missing file with a web page).
// Rather than leave an error on screen, throw away the saved copies and reload once, which fetches the new version and carries on.
// Once only per tab session, so a genuine outage cannot cause a reload loop.

const KEY = "sp-reloaded-for-update";

// Does this error mean "a file of the site has been replaced by a newer publish" and not "a page has a bug"?
export function isStaleFileError(error) {
  const text = `${error?.name ?? ""} ${error?.message ?? error ?? ""}`;
  return /Failed to fetch dynamically imported module|error loading dynamically imported module|Importing a module script failed|not a valid JavaScript MIME type|Unable to preload CSS|Loading (CSS )?chunk [\w-]+ failed|ChunkLoadError/i.test(text);
}

// Forgets the service worker and every saved copy it kept, so the reload cannot be answered from an old publish. Never waits more than a moment, never throws.
export async function clearSavedFiles(win = window) {
  const work = (async () => {
    try { for (const r of (await win.navigator?.serviceWorker?.getRegistrations?.()) ?? []) await r.unregister(); } catch { /* nothing to forget */ }
    try { for (const k of (await win.caches?.keys?.()) ?? []) await win.caches.delete(k); } catch { /* nothing to forget */ }
  })();
  await Promise.race([work, new Promise((resolve) => setTimeout(resolve, 1500))]);
}

// Reloads (after clearing saved copies) unless that was already done a moment ago in this tab. Returns whether a reload was started.
export function reloadForUpdate(win = window, storage = window.sessionStorage) {
  let already;
  try {
    already = storage.getItem(KEY) === "1";
    if (!already) storage.setItem(KEY, "1");
  } catch {
    already = true; // Storage blocked: do not risk a loop.
  }
  if (already) return false;
  clearSavedFiles(win).then(() => win.location.reload());
  return true;
}

export function installChunkReload(win = window, storage = window.sessionStorage) {
  const handler = (event) => {
    if (reloadForUpdate(win, storage)) event.preventDefault();
  };
  win.addEventListener("vite:preloadError", handler);
  // A script that is asked for in the background (the search's word lists, a map's data) and has gone fails without any page noticing; treat it the same way.
  const rejected = (event) => { if (isStaleFileError(event.reason)) reloadForUpdate(win, storage); };
  win.addEventListener("unhandledrejection", rejected);
  // Once a page has loaded fine, a later update can trigger one more reload.
  const clear = () => { try { storage.removeItem(KEY); } catch { /* nothing to clear */ } };
  const timer = setTimeout(clear, 15000);
  return () => { win.removeEventListener("vite:preloadError", handler); win.removeEventListener("unhandledrejection", rejected); clearTimeout(timer); };
}

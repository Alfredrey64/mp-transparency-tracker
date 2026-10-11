// When a new version of the site is published while someone still has it open, the files the old version would load next no longer exist,
// and opening a page they had not visited yet fails. Vite reports that as a "preload error". Rather than leave an error on screen, reload
// once, which fetches the new version and carries on. Once only per tab session, so a genuine outage cannot cause a reload loop.

const KEY = "sp-reloaded-for-update";

export function installChunkReload(win = window, storage = window.sessionStorage) {
  const handler = (event) => {
    let already;
    try {
      already = storage.getItem(KEY) === "1";
      if (!already) storage.setItem(KEY, "1");
    } catch {
      already = true; // Storage blocked: do not risk a loop.
    }
    if (already) return;
    event.preventDefault();
    win.location.reload();
  };
  win.addEventListener("vite:preloadError", handler);
  // Once a page has loaded fine, a later update can trigger one more reload.
  const clear = () => { try { storage.removeItem(KEY); } catch { /* nothing to clear */ } };
  const timer = setTimeout(clear, 15000);
  return () => { win.removeEventListener("vite:preloadError", handler); clearTimeout(timer); };
}

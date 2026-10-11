// Simple Politics service worker: lets the site open and keep working without a connection, using what was loaded before.
//
//   Pages           network first; if offline, the copy saved last time (the app shell for the main address)
//   Built files     (/assets, /fonts) cache first. Their names change whenever their contents do, so a saved copy is never stale
//   Other files     (icons, manifest) saved copy at once, refreshed in the background
//   Figures         Supabase reads are network first, with a short wait; if the connection is slow or gone, the last copy is used
//
// Nothing here uses cookies or sends anything anywhere new. Uploads, posts and other requests are left alone.
// Bump VERSION to throw away everything saved so far.

const VERSION = "sp-v1";
const PAGES = `${VERSION}-pages`;
const FILES = `${VERSION}-files`;
const DATA = `${VERSION}-data`;
const MAX_FILES = 500;
const MAX_DATA = 150;
const DATA_WAIT_MS = 5000;

const OFFLINE_PAGE = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Offline | Simple Politics</title><style>body{margin:0;min-height:100vh;display:grid;place-items:center;background:#EDE5D3;color:#1c1b22;font-family:system-ui,sans-serif;padding:24px;text-align:center}main{max-width:420px}h1{font-size:24px;margin:0 0 8px}p{line-height:1.55;margin:0 0 16px}a{color:#3730a3;font-weight:600}</style></head><body><main><h1>You are offline</h1><p>This page was not saved the last time you were connected. Pages you have already opened will still work, and everything loads again once you are back online.</p><p><a href="/">Try the home page</a></p></main></body></html>`;

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(PAGES).then((cache) => cache.add("/")).catch(() => {}).then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys()
      .then((names) => Promise.all(names.filter((n) => !n.startsWith(VERSION)).map((n) => caches.delete(n))))
      .then(() => self.clients.claim()),
  );
});

// The page tells us which files it loaded, so the whole app is saved after the first visit, not only what is asked for from now on.
self.addEventListener("message", (event) => {
  if (event.data?.type !== "cache-urls" || !Array.isArray(event.data.urls)) return;
  const wanted = event.data.urls.filter((u) => typeof u === "string" && isBuiltFile(new URL(u, self.location.href)));
  event.waitUntil(
    caches.open(FILES).then(async (cache) => {
      for (const url of wanted) {
        if (!(await cache.match(url, { ignoreVary: true }))) await cache.add(url).catch(() => {});
      }
      await trim(cache, MAX_FILES);
    }),
  );
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET") return;
  const url = new URL(request.url);

  if (url.origin === self.location.origin) {
    if (url.pathname.startsWith("/_vercel/")) return;
    if (request.mode === "navigate") return event.respondWith(page(request, url));
    if (isBuiltFile(url)) return event.respondWith(cacheFirst(request, FILES, MAX_FILES));
    return event.respondWith(staleWhileRevalidate(request, FILES, MAX_FILES));
  }
  if (url.hostname.endsWith(".supabase.co") && url.pathname.startsWith("/rest/v1/")) {
    return event.respondWith(networkFirst(request, DATA, MAX_DATA));
  }
});

function isBuiltFile(url) {
  return url.origin === self.location.origin && /^\/(assets|fonts)\//.test(url.pathname);
}

async function trim(cache, max) {
  const keys = await cache.keys();
  for (const key of keys.slice(0, Math.max(0, keys.length - max))) await cache.delete(key);
}

async function save(name, request, response, max) {
  if (!response || response.status !== 200) return;
  const cache = await caches.open(name);
  await cache.put(request, response);
  await trim(cache, max);
}

async function page(request, url) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      const copy = response.clone();
      const key = url.pathname === "/index.html" ? "/" : request;
      save(PAGES, key, copy, 60);
    }
    return response;
  } catch {
    const own = await caches.match(request, { ignoreSearch: true, ignoreVary: true });
    if (own) return own;
    if (url.pathname === "/" || url.pathname === "/index.html") {
      const shell = await caches.match("/", { ignoreVary: true });
      if (shell) return shell;
    }
    return new Response(OFFLINE_PAGE, { status: 503, headers: { "Content-Type": "text/html; charset=utf-8" } });
  }
}

async function cacheFirst(request, name, max) {
  const hit = await caches.match(request, { ignoreVary: true });
  if (hit) return hit;
  const response = await fetch(request);
  save(name, request, response.clone(), max);
  return response;
}

async function staleWhileRevalidate(request, name, max) {
  const hit = await caches.match(request, { ignoreVary: true });
  const refresh = fetch(request).then((response) => {
    save(name, request, response.clone(), max);
    return response;
  });
  if (hit) {
    refresh.catch(() => {});
    return hit;
  }
  return refresh;
}

async function networkFirst(request, name, max) {
  const cache = await caches.open(name);
  const saved = await cache.match(request, { ignoreVary: true });
  const network = fetch(request).then((response) => {
    if (response.status === 200) {
      cache.put(request, response.clone()).then(() => trim(cache, max));
    }
    return response;
  });
  if (!saved) return network;
  // With a saved copy to fall back on, do not keep the visitor waiting on a slow connection.
  const slow = new Promise((resolve) => setTimeout(() => resolve(saved), DATA_WAIT_MS));
  return Promise.race([network.catch(() => saved), slow]);
}

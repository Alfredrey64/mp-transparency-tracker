import { afterEach, describe, expect, it, vi } from "vitest";
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";

// Runs public/sw.js against a small fake of the service worker environment, to check what it saves and what it serves.

const source = fs.readFileSync(path.join(path.dirname(new URL(import.meta.url).pathname), "../../public/sw.js"), "utf8");
const ORIGIN = "https://site.test";

function fakeCaches(getFetch) {
  const stores = new Map();
  const cacheFor = (name) => {
    if (!stores.has(name)) stores.set(name, new Map());
    const store = stores.get(name);
    const keyOf = (r) => (typeof r === "string" ? new URL(r, ORIGIN).href : r.url);
    return {
      async match(r) { const hit = store.get(keyOf(r)); return hit ? new Response(hit.body, { status: hit.status }) : undefined; },
      async put(r, res) { store.set(keyOf(r), { body: await res.text(), status: res.status }); },
      async add(r) { const res = await getFetch()(keyOf(r)); await this.put(r, res); },
      async keys() { return [...store.keys()].map((url) => ({ url })); },
      async delete(r) { return store.delete(typeof r === "string" ? r : r.url); },
    };
  };
  return {
    stores,
    open: async (name) => cacheFor(name),
    async match(r) { for (const name of stores.keys()) { const hit = await cacheFor(name).match(r); if (hit) return hit; } return undefined; },
    keys: async () => [...stores.keys()],
    delete: async (n) => stores.delete(n),
  };
}

function boot(fetchImpl) {
  const listeners = {};
  const caches = fakeCaches(() => fetchImpl);
  const self = {
    location: { href: `${ORIGIN}/sw.js`, origin: ORIGIN },
    addEventListener: (type, fn) => { listeners[type] = fn; },
    skipWaiting: vi.fn(),
    clients: { claim: vi.fn() },
  };
  const context = { self, caches, fetch: fetchImpl, Response, URL, Promise, setTimeout: (...a) => setTimeout(...a), clearTimeout: (...a) => clearTimeout(...a), Array, Map };
  vm.runInNewContext(source, context);
  const request = (url, { method = "GET", mode = "cors" } = {}) => ({ url: new URL(url, ORIGIN).href, method, mode });
  async function fire(req) {
    let answer;
    let pending = Promise.resolve();
    listeners.fetch({ request: req, respondWith: (p) => { answer = p; }, waitUntil: (p) => { pending = p; } });
    return { handled: answer !== undefined, response: answer ? await answer : undefined, settle: () => pending };
  }
  return { caches, listeners, request, fire };
}

const ok = (body = "ok") => () => Promise.resolve(new Response(body, { status: 200 }));
const down = () => Promise.reject(new TypeError("offline"));
const tick = () => new Promise((r) => setTimeout(r, 0));

afterEach(() => vi.useRealTimers());

describe("service worker", () => {
  it("serves the saved home page when a visit happens offline", async () => {
    let online = true;
    const sw = boot(() => (online ? ok("<html>shell</html>")() : down()));
    expect((await (await sw.fire(sw.request("/", { mode: "navigate" }))).response.text())).toBe("<html>shell</html>");
    await tick();
    online = false;
    const offline = await sw.fire(sw.request("/", { mode: "navigate" }));
    expect(await offline.response.text()).toBe("<html>shell</html>");
  });

  it("shows a plain offline page for an address it never saved", async () => {
    const sw = boot(down);
    const { response } = await sw.fire(sw.request("/p/never-seen", { mode: "navigate" }));
    expect(response.status).toBe(503);
    expect(await response.text()).toContain("You are offline");
  });

  it("keeps built files and does not ask the network twice for them", async () => {
    const fetchSpy = vi.fn(ok("body{}"));
    const sw = boot(fetchSpy);
    await sw.fire(sw.request("/assets/main-abc123.js"));
    await tick();
    const again = await sw.fire(sw.request("/assets/main-abc123.js"));
    expect(await again.response.text()).toBe("body{}");
    expect(fetchSpy).toHaveBeenCalledTimes(1);
  });

  it("leaves anything that is not a read alone", async () => {
    const sw = boot(ok());
    expect((await sw.fire(sw.request("/assets/x.js", { method: "POST" }))).handled).toBe(false);
    expect((await sw.fire(sw.request("/_vercel/insights/script.js"))).handled).toBe(false);
    expect((await sw.fire({ url: "https://api.postcodes.io/postcodes/SW1A", method: "GET", mode: "cors" })).handled).toBe(false);
  });

  it("falls back to the last figures when the data service cannot be reached", async () => {
    let online = true;
    const sw = boot(() => (online ? ok('[{"id":1}]')() : down()));
    const req = sw.request("https://abc.supabase.co/rest/v1/politicians?select=id");
    await sw.fire(req);
    await tick();
    online = false;
    expect(await (await sw.fire(req)).response.text()).toBe('[{"id":1}]');
  });

  it("does not make a visitor wait on a slow data connection when it has a saved copy", async () => {
    let slow = false;
    const sw = boot(() => (slow ? new Promise(() => {}) : ok("saved")()));
    const req = sw.request("https://abc.supabase.co/rest/v1/bills?select=*");
    await sw.fire(req);
    await tick();
    slow = true;
    vi.useFakeTimers();
    const pending = sw.fire(req);
    await vi.advanceTimersByTimeAsync(5100);
    expect(await (await pending).response.text()).toBe("saved");
  });

  it("saves only the app's own built files when the page lists what it loaded", async () => {
    const fetchSpy = vi.fn(ok("file"));
    const sw = boot(fetchSpy);
    let done;
    sw.listeners.message({
      data: { type: "cache-urls", urls: [`${ORIGIN}/assets/a.js`, `${ORIGIN}/fonts/f.woff2`, "https://evil.test/assets/x.js", `${ORIGIN}/other.js`] },
      waitUntil: (p) => { done = p; },
    });
    await done;
    expect(fetchSpy).toHaveBeenCalledTimes(2);
  });

  it("throws away saved copies from an older version when it starts", async () => {
    const sw = boot(ok());
    await sw.caches.open("old-version-files");
    let done;
    sw.listeners.activate({ waitUntil: (p) => { done = p; } });
    await done;
    expect(await sw.caches.keys()).not.toContain("old-version-files");
  });
});

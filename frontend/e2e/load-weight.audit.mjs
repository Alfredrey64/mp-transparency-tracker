// How much a first visit downloads and how long it takes to become usable, per page, on a mid-range phone on a decent mobile connection
// (4x slower CPU, 1.6 Mbit/s down, 150 ms delay). Prints, for each page: requests, kilobytes of script/style/data, and the time to the main heading and to the page being quiet.
// Usage: node e2e/load-weight.audit.mjs [baseUrl] [page,page...]    (needs `npx vite preview --port 4178 --strictPort`)
import { chromium } from "@playwright/test";

const base = process.argv[2] ?? "http://localhost:4178";
const pages = (process.argv[3] ?? "home,list,taxRates,constituencies,lords,ageing").split(",");
const browser = await chromium.launch();
for (const pg of pages) {
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true });
  const page = await ctx.newPage();
  const cdp = await ctx.newCDPSession(page);
  await cdp.send("Network.enable");
  await cdp.send("Network.emulateNetworkConditions", { offline: false, latency: 150, downloadThroughput: (1.6 * 1024 * 1024) / 8, uploadThroughput: (750 * 1024) / 8 });
  await cdp.send("Emulation.setCPUThrottlingRate", { rate: 4 });
  let bytes = 0, count = 0; const big = [];
  cdp.on("Network.loadingFinished", (e) => { bytes += e.encodedDataLength; count += 1; });
  cdp.on("Network.responseReceived", (e) => { big.push({ url: e.response.url, type: e.type }); });
  await page.route("**/127.0.0.1:54321/**", (r) => r.abort());
  const t0 = Date.now();
  await page.goto(`${base}/${pg === "home" ? "" : pg}`, { waitUntil: "commit" });
  await page.waitForSelector("h1", { timeout: 60000 });
  const tH1 = Date.now() - t0;
  await page.waitForLoadState("networkidle", { timeout: 60000 }).catch(() => {});
  const tIdle = Date.now() - t0;
  const m = await page.evaluate(() => {
    const nav = performance.getEntriesByType("navigation")[0];
    const lcp = new Promise((res) => { new PerformanceObserver((l) => res(l.getEntries().at(-1).startTime)).observe({ type: "largest-contentful-paint", buffered: true }); setTimeout(() => res(null), 500); });
    return lcp.then((v) => ({ lcp: v && Math.round(v), dcl: Math.round(nav.domContentLoadedEventEnd) }));
  });
  console.log(`${pg.padEnd(14)} requests ${String(count).padStart(3)}  transferred ${String(Math.round(bytes / 1024)).padStart(5)} kB  heading ${tH1} ms  quiet ${tIdle} ms  LCP ${m.lcp} ms`);
  await ctx.close();
}
await browser.close();

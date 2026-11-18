// Finds anything in the banner pictures (.hs-scene / .fm-scene) that the top edge of the picture box cuts off (a cloud, the sun, a crane), at several screen widths and moments.
// Run it against a preview build: BASE=http://localhost:4178 WIDTHS=390,1000,1440,1900,2400 node e2e/banner-cutoff.audit.mjs   (ONLY=economy,jobs to limit the pages).
import { chromium } from "@playwright/test";
import { PAGE_NAMES } from "./pageList.mjs";

const BASE = process.env.BASE ?? "http://localhost:4178";
const WIDTHS = (process.env.WIDTHS ?? "1440").split(",").map(Number);
const ONLY = process.env.ONLY?.split(",");
const TIMES = (process.env.TIMES ?? "500,2500,5500,9000").split(",").map(Number);

function scan() {
  const out = [];
  for (const sc of document.querySelectorAll(".hs-scene, .fm-scene")) {
    const svg = sc.querySelector("svg");
    if (!svg) continue;
    const box = sc.getBoundingClientRect();
    const ctm = svg.getScreenCTM();
    if (!ctm) continue;
    const inv = ctm.inverse();
    const kind = sc.dataset.kind ?? (sc.className.includes("fm") ? "farm" : "?");
    const clipTop = parseFloat((getComputedStyle(sc).clipPath.match(/inset\(([-\d.]+)px/) || [0, 0])[1]) || 0; // negative = may draw above
    const limitTop = box.top + clipTop;
    for (const el of svg.querySelectorAll("path,rect,circle,ellipse,polygon,polyline,line,text,image")) {
      if (el.closest("defs, clipPath, mask, pattern, filter, linearGradient, radialGradient, symbol, marker")) continue;
      const cs = getComputedStyle(el);
      if (cs.display === "none" || cs.visibility === "hidden") continue;
      let op = 1; for (let p = el; p && p !== svg; p = p.parentElement) op *= parseFloat(getComputedStyle(p).opacity);
      if (op < 0.05) continue;
      if (cs.fill === "none" && (cs.stroke === "none" || !parseFloat(cs.strokeWidth))) continue;
      const r = el.getBoundingClientRect();
      if (r.width < 0.5 && r.height < 0.5) continue;
      const topCut = r.top < limitTop - 0.75 && r.bottom > limitTop + 1.5;
      const botCut = r.bottom > box.bottom + 0.75 && r.top < box.bottom - 1.5 && r.height < box.height * 0.5 && !el.closest(".sv-ground,.hs-3") ;
      if (!topCut) continue;
            const pt = (x, y) => { const p = svg.createSVGPoint(); p.x = x; p.y = y; return p.matrixTransform(inv); };
      const tl = pt(r.left, r.top), br = pt(r.right, r.bottom);
      const g = el.closest("[class]:not(svg)");
      const lbl = `${el.tagName}.${(el.getAttribute("class") || "").split(" ")[0]} in ${(g?.getAttribute("class") || "").split(" ")[0] || "-"}`;
      const hid = Math.round(Math.max(0, limitTop - r.top) / (r.height || 1) * 100);
      out.push({ kind, side: topCut ? "TOP" : "BOTTOM", lbl, vb: `x ${tl.x.toFixed(0)}..${br.x.toFixed(0)} y ${tl.y.toFixed(0)}..${br.y.toFixed(0)}`, hiddenPct: topCut ? hid : 0, fill: cs.fill.slice(0, 22) });
    }
  }
  return out;
}

const b = await chromium.launch();
const found = new Map();
for (const width of WIDTHS) {
  const ctx = await b.newContext({ viewport: { width, height: 900 }, deviceScaleFactor: 1 });
  for (const name of PAGE_NAMES) {
    if (ONLY && !ONLY.includes(name)) continue;
    const page = await ctx.newPage();
    await page.route("**/127.0.0.1:54321/**", (r) => r.abort());
    await page.route("**/api.postcodes.io/**", (r) => r.abort());
    try {
      await page.goto(`${BASE}/${name}`, { waitUntil: "load" });
      await page.waitForSelector("h1", { timeout: 15000 });
      if (!(await page.$(".hs-scene, .fm-scene"))) { await page.close(); continue; }
      let prev = 0;
      for (const t of TIMES) {
        await page.waitForTimeout(t - prev); prev = t;
        for (const f of await page.evaluate(scan)) {
          const key = `${name}|${f.kind}|${f.side}|${f.lbl}|${f.vb}|w${width}`;
          if (!found.has(key) || found.get(key).hiddenPct < f.hiddenPct) found.set(key, { ...f, name, width });
        }
      }
    } catch (e) { console.log(name, "ERR", String(e.message).split("\n")[0]); }
    await page.close();
  }
  await ctx.close();
}
await b.close();
const rows = [...found.values()];
console.log(`${rows.length} cut-off items`);
const byPage = new Map();
for (const r of rows) { const k = `${r.name} (${r.kind})`; byPage.set(k, [...(byPage.get(k) ?? []), r]); }
for (const [k, list] of byPage) { console.log(`\n${k}`); for (const r of list) console.log(`  w${r.width} ${r.side} ${r.lbl} ${r.vb} hidden~${r.hiddenPct}% fill ${r.fill}`); }

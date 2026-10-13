// A page-speed budget. After `npm run build` it measures what a first visit has to download (the scripts and styles that index.html loads straight
// away) and the largest lazy chunk, as gzip sizes, and fails if either is over the limits in bundle-budget.json. The limits sit a little above
// today's sizes, so a change that makes the site noticeably heavier is noticed in review instead of by visitors on a slow phone.
// Usage: node scripts/check-bundle-size.mjs [--update]   (--update rewrites the budget from the current build, with 12% headroom)
import { readFileSync, writeFileSync, readdirSync, existsSync } from "node:fs";
import { gzipSync } from "node:zlib";
import { join } from "node:path";

const root = new URL("../", import.meta.url).pathname;
const dist = join(root, "dist");
if (!existsSync(join(dist, "index.html"))) {
  console.error("No dist/index.html. Run `npm run build` first.");
  process.exit(2);
}
const gz = (file) => gzipSync(readFileSync(join(dist, file))).length;
const kb = (n) => `${(n / 1024).toFixed(1)} kB`;

// What index.html loads at once: its module script, modulepreloads and stylesheets.
const html = readFileSync(join(dist, "index.html"), "utf8");
const refs = [...html.matchAll(/(?:src|href)="(\/assets\/[^"]+)"/g)].map((m) => m[1].slice(1));
const initialJs = [...new Set(refs.filter((f) => f.endsWith(".js")))];
const initialCss = [...new Set(refs.filter((f) => f.endsWith(".css")))];
const sum = (files) => files.reduce((n, f) => n + gz(f), 0);

const chunks = readdirSync(join(dist, "assets")).filter((f) => f.endsWith(".js")).map((f) => ({ f, size: gz(`assets/${f}`) })).sort((a, b) => b.size - a.size);
const measured = { initialJs: sum(initialJs), initialCss: sum(initialCss), largestChunk: chunks[0].size, largestChunkName: chunks[0].f };

const budgetPath = join(root, "bundle-budget.json");
if (process.argv.includes("--update")) {
  const pad = (n) => Math.ceil((n * 1.12) / 1024) * 1024;
  writeFileSync(budgetPath, `${JSON.stringify({ initialJs: pad(measured.initialJs), initialCss: pad(measured.initialCss), largestChunk: pad(measured.largestChunk) }, null, 2)}\n`);
  console.log("Budget updated.");
}
const budget = JSON.parse(readFileSync(budgetPath, "utf8"));

const rows = [
  ["First visit: scripts", measured.initialJs, budget.initialJs],
  ["First visit: styles", measured.initialCss, budget.initialCss],
  [`Largest lazy chunk (${measured.largestChunkName})`, measured.largestChunk, budget.largestChunk],
];
let failed = false;
for (const [name, size, limit] of rows) {
  const over = size > limit;
  failed ||= over;
  console.log(`${over ? "FAIL" : "ok  "}  ${name}: ${kb(size)} of ${kb(limit)} (${Math.round((size / limit) * 100)}%)`);
}
console.log("\nHeaviest chunks:");
for (const c of chunks.slice(0, 6)) console.log(`  ${kb(c.size).padStart(9)}  ${c.f}`);
if (failed) {
  console.error("\nOver budget. If the extra weight is worth it, run `npm run check:size -- --update` and say why in the commit message.");
  process.exit(1);
}

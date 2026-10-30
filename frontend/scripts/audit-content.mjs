// A weekly check on whether what the site says is still sound. It looks for three things a person would otherwise have to notice by chance:
//   - pages of facts (components/explainers) whose figures were last checked against their sources more than 60 days ago,
//   - saved data (src/data) that has stopped being rebuilt,
//   - source links on those pages that have disappeared.
// It prints a report and exits with 1 if there is anything to look at. The weekly workflow (.github/workflows/content-check.yml) opens an issue from it.
//
//   node scripts/audit-content.mjs [--no-links]

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { staleExplainers, staleData, brokenLinks, report } from "./audit-content-lib.mjs";

const here = path.dirname(fileURLToPath(import.meta.url));
const data = path.join(here, "../src/data");
const explainers = path.join(here, "../src/components/explainers");
const now = new Date();

const pages = fs.readdirSync(explainers).filter((f) => f.endsWith(".jsx")).map((f) => {
  const text = fs.readFileSync(path.join(explainers, f), "utf8");
  return { name: f.replace(/\.jsx$/, ""), checked: /checked: "([^"]+)"/.exec(text)?.[1], urls: [...text.matchAll(/url: "(https:\/\/[^"]+)"/g)].map((m) => m[1]) };
});

const files = [];
(function walk(dir, rel = "") {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (e.isDirectory()) walk(path.join(dir, e.name), `${rel}${e.name}/`);
    else if (e.name.endsWith(".json")) {
      try {
        const j = JSON.parse(fs.readFileSync(path.join(dir, e.name), "utf8"));
        const stamp = j && typeof j === "object" ? (j.fetchedAt ?? j.generatedAt ?? j.built ?? j.checked ?? null) : null;
        files.push({ name: `${rel}${e.name}`, stamp: typeof stamp === "string" ? (/^\d{4}-\d{2}-\d{2}$/.test(stamp) ? `${stamp}T12:00:00Z` : stamp) : null });
      } catch { /* not a data file this check understands */ }
    }
  }
})(data);

async function check(url) {
  for (let attempt = 0; attempt < 2; attempt += 1) {
    try {
      const c = new AbortController();
      const t = setTimeout(() => c.abort(), 20000);
      const res = await fetch(url, { redirect: "follow", signal: c.signal, headers: { "User-Agent": "simple-politics-content-check/1.0 (+https://simple-politics.vercel.app)" } });
      clearTimeout(t);
      if (res.status === 429 && attempt === 0) { await new Promise((r) => setTimeout(r, 5000)); continue; }
      return { url, status: res.status };
    } catch (e) { if (attempt === 1) return { url, status: 0, error: e.cause?.code ?? e.name }; }
  }
  return { url, status: 0 };
}

let links = [];
if (!process.argv.includes("--no-links")) {
  const urls = [...new Set(pages.flatMap((p) => p.urls))];
  let i = 0;
  await Promise.all(Array.from({ length: 4 }, async () => { while (i < urls.length) { const u = urls[i++]; links.push(await check(u)); } }));
}

const { text, total } = report([
  ["Pages whose figures are due a re-check", staleExplainers(pages, now)],
  ["Saved data that has stopped refreshing", staleData(files, now)],
  ["Source links that have gone", brokenLinks(links)],
]);
console.log(text);
process.exit(total ? 1 : 0);

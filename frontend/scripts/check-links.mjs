// Checks that every outside web address written into the site's source still answers. It sends ordinary requests with an honest identifier, one
// per address, a few at a time, and does not try to get past a site that refuses automated visitors: those come back as "refused" and need a
// person to look. Run `node scripts/check-links.mjs` from the frontend folder.
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

const roots = ["src"];
const files = [];
const walk = (dir) => { for (const f of readdirSync(dir)) { const p = join(dir, f); if (statSync(p).isDirectory()) walk(p); else if (/\.(jsx?|json)$/.test(f) && !/\.test\./.test(f)) files.push(p); } };
roots.forEach(walk);

const urls = new Map();
for (const file of files) {
  for (const m of readFileSync(file, "utf8").matchAll(/https?:\/\/[A-Za-z0-9._~:/?#@!$&'()*+,;=%-]+/g)) {
    const url = m[0].replace(/[.,;:)]+$/, "");
    // Pieces of a template (an address that ends in $ or = and has the rest filled in by the code) and the made-up example host in route.js are not links.
    if (/[$=]$/.test(url) || url.startsWith("https://site/")) continue;
    if (/x\.test|localhost|127\.0\.0\.1|example\.|\$\{|\.supabase\.co|w3\.org|schema\.org/.test(url)) continue;
    if (!urls.has(url)) urls.set(url, file);
  }
}

const list = [...urls.keys()];
const results = [];
let next = 0;
async function check(url) {
  const ctl = new AbortController();
  const timer = setTimeout(() => ctl.abort(), 20000);
  try {
    const res = await fetch(url, { redirect: "follow", signal: ctl.signal, headers: { "User-Agent": "SimplePoliticsLinkCheck/1.0 (+https://simple-politics.vercel.app)" } });
    await res.body?.cancel();
    return { url, status: res.status, final: res.url !== url ? res.url : null };
  } catch (e) {
    return { url, status: 0, error: e.cause?.code ?? e.name };
  } finally { clearTimeout(timer); }
}
await Promise.all(Array.from({ length: 8 }, async () => { while (next < list.length) { const url = list[next++]; results.push({ ...(await check(url)), file: urls.get(url) }); } }));

const bad = results.filter((r) => r.status === 0 || r.status >= 400).sort((a, b) => a.url.localeCompare(b.url));
const refused = bad.filter((r) => [401, 403, 429, 999].includes(r.status));
const broken = bad.filter((r) => !refused.includes(r));
console.log(`${list.length} addresses checked: ${results.filter((r) => r.status > 0 && r.status < 400).length} answer, ${refused.length} refused automated visitors, ${broken.length} broken or unreachable.`);
for (const r of broken) console.log(`BROKEN  ${r.status || r.error}  ${r.url}  (${r.file})`);
for (const r of refused) console.log(`REFUSED ${r.status}  ${r.url}`);
process.exit(broken.length ? 1 : 0);

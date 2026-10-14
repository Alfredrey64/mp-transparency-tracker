import { describe, it, expect } from "vitest";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { buildSeoPages, readSidebarPages, pageList, routeEntries, clip, SITE } from "./build-seo-pages.mjs";
import { prerender, render } from "./prerender.mjs";
import { SECTIONS } from "../src/data/sidebarSections";
import { ANSWERS } from "../src/data/answers";

const here = path.dirname(new URL(import.meta.url).pathname);
const source = fs.readFileSync(path.join(here, "../src/data/sidebarSections.js"), "utf8");

describe("search and link-preview pages", () => {
  it("find every page in the sidebar", () => {
    const keys = new Set(readSidebarPages(source).map((p) => p.key));
    for (const item of SECTIONS.flatMap((s) => s.items)) expect(keys.has(item.key), item.key).toBe(true);
  });
  it("write a page for every section and answer, and a sitemap that lists them", () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "seo-"));
    const urls = buildSeoPages(dir, source);
    expect(urls.length).toBe(routeEntries(source).length);
    expect(urls.length).toBeGreaterThan(pageList(source).length + ANSWERS.length);
    for (const a of ANSWERS) expect(fs.existsSync(path.join(dir, "p", "answers", `${a.id}.html`)), a.id).toBe(true);
    const page = fs.readFileSync(path.join(dir, "p", "howtovote.html"), "utf8");
    expect(page).toContain("<title>How to vote | Simple Politics</title>");
    expect(page).toContain(`${SITE}/howtovote`);
    expect(page).toContain('data-go="/howtovote"');
    expect(page).toContain('og:image');
    const sitemap = fs.readFileSync(path.join(dir, "sitemap.xml"), "utf8");
    expect(sitemap).toContain(`${SITE}/answers/why-housing-expensive`);
    expect(sitemap).toContain(`${SITE}/taxRates/vat`);
    expect(sitemap).not.toContain("/p/");
    expect(sitemap).toContain(`<loc>${SITE}/</loc>`);
    expect(fs.readFileSync(path.join(dir, "p", "go.js"), "utf8")).toContain("location.replace");
  });
  it("keep a question's text safe inside the page", () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "seo-"));
    buildSeoPages(dir, source);
    const html = fs.readFileSync(path.join(dir, "p", "answers", "what-is-gdp.html"), "utf8");
    expect(html).not.toMatch(/<script>(?!\s*<\/script>)/);
    expect(html).toContain("What is GDP?");
  });
  it("clips text at the end of a sentence or a word", () => {
    expect(clip("Short.")).toBe("Short.");
    const long = `${"A sentence that goes on. ".repeat(12)}Tail`;
    expect(clip(long, 100).endsWith(".")).toBe(true);
    expect(clip("word ".repeat(80), 50).endsWith("\u2026")).toBe(true);
  });
});

describe("prerendered pages", () => {
  const template = '<!doctype html><html><head><title>Simple Politics</title><meta name="description" content="old" /><link rel="canonical" href="https://x/" /><meta property="og:title" content="old" /><meta property="og:description" content="old" /><meta property="og:url" content="https://x/" /><meta name="twitter:title" content="old" /><meta name="twitter:description" content="old" /></head><body><div id="root"></div></body></html>';
  it("give a page its own title, tags and opening text", () => {
    const html = render(template, { path: "/taxRates/vat", title: "VAT | Simple Politics", description: "About \"VAT\" & more", heading: "VAT", bodyHtml: "<ul><li>x</li></ul>" });
    expect(html).toContain("<title>VAT | Simple Politics</title>");
    expect(html).toContain('content="About &quot;VAT&quot; &amp; more"');
    expect(html).toContain(`href="${SITE}/taxRates/vat"`);
    expect(html).toContain('<div id="root"><div class="pre"><p class="k">Simple Politics</p><h1>VAT</h1>');
    expect(html.match(/<h1>/g)).toHaveLength(1);
    expect(html).not.toContain("content=\"old\"");
  });
  it("write a copy of the built page for every address, and a plain one for the rest", () => {
    const dist = fs.mkdtempSync(path.join(os.tmpdir(), "dist-"));
    fs.writeFileSync(path.join(dist, "index.html"), template);
    const n = prerender(dist, source);
    expect(n).toBe(routeEntries(source).length);
    expect(fs.readFileSync(path.join(dist, "app.html"), "utf8")).toBe(template);
    expect(fs.readFileSync(path.join(dist, "taxRates", "vat", "index.html"), "utf8")).toContain("<h1>VAT: how the rate has changed</h1>");
    expect(fs.readFileSync(path.join(dist, "answers", "what-is-gdp", "index.html"), "utf8")).toContain("What is GDP?");
    expect(fs.readFileSync(path.join(dist, "index.html"), "utf8")).toContain("A simple breakdown of UK politics");
  });
});

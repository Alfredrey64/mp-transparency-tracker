import { describe, it, expect } from "vitest";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { buildSeoPages, readSidebarPages, pageList, SITE } from "./build-seo-pages.mjs";
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
    expect(urls.length).toBe(pageList(source).length + ANSWERS.length);
    for (const a of ANSWERS) expect(fs.existsSync(path.join(dir, "p", "answers", `${a.id}.html`)), a.id).toBe(true);
    const page = fs.readFileSync(path.join(dir, "p", "howtovote.html"), "utf8");
    expect(page).toContain("<title>How to vote | Simple Politics</title>");
    expect(page).toContain(`${SITE}/p/howtovote`);
    expect(page).toContain('data-go="/#/howtovote"');
    expect(page).toContain('og:image');
    const sitemap = fs.readFileSync(path.join(dir, "sitemap.xml"), "utf8");
    expect(sitemap).toContain(`${SITE}/p/answers/why-housing-expensive`);
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
});

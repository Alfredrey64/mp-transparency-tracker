import { describe, it, expect } from "vitest";
import fs from "node:fs";

// Only addresses that begin with a real page are answered with the app (see vercel.json); anything else gets a proper "not found" (public/404.html) instead of the home page with a
// success code. This keeps the list in vercel.json in step with the pages the app knows.
const read = (p) => fs.readFileSync(new URL(p, import.meta.url), "utf8");
const app = read("../App.jsx");
const loaders = read("../pageLoaders.js");
const block = app.slice(app.indexOf("const VALID_VIEWS = new Set(["));
const literal = block.slice(0, block.indexOf("]);"));
const views = new Set([
  ...[...literal.matchAll(/"([A-Za-z0-9_]+)"/g)].map((m) => m[1]),
  ...[...loaders.slice(loaders.indexOf("export const LOADERS")).matchAll(/^ {2}([A-Za-z0-9_]+): /gm)].map((m) => m[1]),
  "mp", "seatmap", "mpProfile", "upcoming", "tax", "budget",
]);
views.delete("home");

const rule = JSON.parse(read("../../vercel.json")).rewrites[0];
const listed = new Set(rule.source.match(/\(([^)]*)\)/)[1].split("|"));

describe("vercel.json rewrite", () => {
  it("sends every page the app knows to the app", () => {
    expect([...views].filter((v) => !listed.has(v))).toEqual([]);
  });
  it("lists nothing the app does not know", () => {
    expect([...listed].filter((v) => !views.has(v))).toEqual([]);
  });
  it("has a not-found page to answer everything else", () => {
    expect(fs.existsSync(new URL("../../public/404.html", import.meta.url))).toBe(true);
  });
});

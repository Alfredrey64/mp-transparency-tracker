import { describe, it, expect } from "vitest";
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import process from "node:process";

// Every stylesheet is loaded on every page, so a class name written in two files is styled by both at once. That is how the MP debate cards came to wear the games page's dark
// cover. A class may be defined in two files only if it is on this list, which holds the ones that were already shared on purpose when this test was written (the page-hero and
// hero-scene families, and the Your area cards that build on each other). A new class goes in one file, under a name that file owns.
const SHARED = new Set([
  "career-bar", "cm-card", "hs-scene", "ib-card", "ma-card", "ma-domains", "ma-months", "mg", "page-hero", "rv-in", "seg",
]);

describe("stylesheets", () => {
  it("do not share a top-level class name", () => {
    const dir = join(process.cwd(), "src");
    const seen = new Map();
    for (const f of readdirSync(dir).filter((n) => n.endsWith(".css"))) {
      const css = readFileSync(join(dir, f), "utf8");
      for (const m of css.matchAll(/^\.([a-zA-Z][\w-]*)/gm)) {
        const files = seen.get(m[1]) ?? new Set();
        files.add(f);
        seen.set(m[1], files);
      }
    }
    const clashes = [...seen].filter(([name, files]) => files.size > 1 && !SHARED.has(name)).map(([name, files]) => `.${name}: ${[...files].join(", ")}`);
    expect(clashes, "a class name is styled in more than one stylesheet; rename one").toEqual([]);
  });
});

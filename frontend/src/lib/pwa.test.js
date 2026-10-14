import { describe, expect, it } from "vitest";
import { existsSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { SECTIONS } from "../data/sidebarSections";

const root = (p) => fileURLToPath(new URL(`../../public/${p}`, import.meta.url));
const manifest = JSON.parse(readFileSync(root("manifest.json"), "utf8"));
const file = (src) => src.split("?")[0].replace(/^\//, "");

describe("web app manifest", () => {
  it("points every icon at a file that exists, with a padded maskable icon", () => {
    expect(manifest.icons.length).toBeGreaterThanOrEqual(4);
    for (const i of [...manifest.icons, ...manifest.shortcuts.flatMap((s) => s.icons)]) expect(existsSync(root(file(i.src))), i.src).toBe(true);
    const masks = manifest.icons.filter((i) => i.purpose === "maskable");
    expect(masks.every((i) => i.src.includes("maskable"))).toBe(true);
  });
  it("has shortcuts that open real pages", () => {
    const keys = new Set((SECTIONS ?? []).flatMap((s) => s.items.map((i) => i.key)));
    expect(manifest.shortcuts.length).toBeGreaterThanOrEqual(3);
    expect(manifest.shortcuts.length).toBeLessThanOrEqual(4);
    for (const s of manifest.shortcuts) {
      expect(s.url.startsWith("/")).toBe(true);
      expect(keys.has(s.url.slice(1)), s.url).toBe(true);
      expect(s.name.length).toBeGreaterThan(0);
    }
  });
});

import { describe, it, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { ANSWERS, ANSWER_TOPICS } from "./answers";
import { SECTORS } from "./onsSectors";
import { resolveSeries } from "../lib/onsData";
import { fillKeyPoint, keyPointText } from "../lib/onsKeyPoints";
import { SECTIONS } from "./sidebarSections";

const dir = path.join(path.dirname(new URL(import.meta.url).pathname), "ons");
const loaded = {};
const seriesOf = (key) => (loaded[key] ??= resolveSeries(SECTORS.find((s) => s.key === key), JSON.parse(fs.readFileSync(path.join(dir, `${key}.json`), "utf8"))));
const pages = new Set(SECTIONS.flatMap((s) => s.items.map((i) => i.key)));

describe("written answers", () => {
  it("uses only real series, and every figure fills in from the saved data", () => {
    for (const a of ANSWERS) {
      for (const f of a.facts) {
        const item = seriesOf(f.sector)[f.series];
        expect(item, `${a.id}: ${f.sector}/${f.series}`).toBeTruthy();
        const parts = fillKeyPoint(f.text, item.def, item.points);
        expect(parts, `${a.id}/${f.series}`).not.toBeNull();
        expect(keyPointText(parts), `${a.id}/${f.series}`).not.toMatch(/[{}]|undefined|NaN/);
      }
    }
  });

  it("puts every answer in a known topic and links to pages that exist", () => {
    for (const a of ANSWERS) {
      expect(ANSWER_TOPICS, a.id).toContain(a.topic);
      for (const n of a.next) {
        const page = /^#\/([A-Za-z]+)/.exec(n.href)?.[1];
        expect(pages.has(page), `${a.id}: ${n.href}`).toBe(true);
      }
      for (const v of a.views) expect(v.who.length + v.says.length).toBeGreaterThan(60);
    }
  });

  it("does not put figures in the answer text that would go out of date", () => {
    for (const a of ANSWERS) {
      for (const text of [a.short, ...a.reasons.map((r) => r.text)]) {
        expect(text, `${a.id}: ${text.slice(0, 40)}`).not.toMatch(/\b(2025|2026)\b/);
      }
    }
  });
});

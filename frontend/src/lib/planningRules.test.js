import { describe, it, expect, vi } from "vitest";
import { shapeRules, planningAt } from "./planningRules";

const e = (dataset, extra = {}) => ({ dataset, name: "", ...extra });

describe("shapeRules", () => {
  it("returns nothing for no entities", () => {
    expect(shapeRules([])).toEqual({ authorities: [], items: [] });
    expect(shapeRules(null)).toEqual({ authorities: [], items: [] });
  });

  it("names the deciding council without the LPA suffix, once each", () => {
    const out = shapeRules([e("local-planning-authority", { name: "Leeds LPA" }), e("local-planning-authority", { name: "Leeds LPA" })]);
    expect(out.authorities).toEqual(["Leeds"]);
    expect(out.items).toEqual([]);
  });

  it("keeps the highest flood zone only", () => {
    const out = shapeRules([e("flood-risk-zone", { "flood-risk-level": "2" }), e("flood-risk-zone", { "flood-risk-level": "3" })]);
    expect(out.items).toHaveLength(1);
    expect(out.items[0].label).toBe("Flood zone 3");
  });

  it("ignores a flood entity with no usable level", () => {
    expect(shapeRules([e("flood-risk-zone", { "flood-risk-level": "" })]).items).toEqual([]);
  });

  it("lists conservation areas by name with their link and earliest date", () => {
    const out = shapeRules([
      e("conservation-area", { name: "Redcliffe", "designation-date": "1976-11-03", "documentation-url": "https://example.gov.uk/ca" }),
      e("conservation-area", { name: "Old Market", "designation-date": "1970-01-01" }),
    ]);
    expect(out.items[0]).toMatchObject({ label: "Conservation area", names: ["Redcliffe", "Old Market"], link: "https://example.gov.uk/ca", date: "1970-01-01" });
  });

  it("drops code-like names and unfinished links", () => {
    const out = shapeRules([e("article-4-direction-area", { name: "A4D01", "documentation-url": "https://uk-air.defra.gov.uk/aqma/details?aqma_ref=" })]);
    expect(out.items[0].names).toEqual([]);
    expect(out.items[0].link).toBeNull();
  });

  it("keeps a long descriptive Article 4 name", () => {
    const out = shapeRules([e("article-4-direction-area", { name: "Ashley Ward and Cabot Ward (1999 ward boundary)" })]);
    expect(out.items[0].names).toEqual(["Ashley Ward and Cabot Ward (1999 ward boundary)"]);
  });

  it("orders notes with protections before air quality", () => {
    const out = shapeRules([e("air-quality-management-area", { name: "Bristol AQMA" }), e("green-belt", { name: "Bristol Green Belt" }), e("conservation-area", { name: "Redcliffe" })]);
    expect(out.items.map((i) => i.key)).toEqual(["conservation-area", "green-belt", "air-quality-management-area"]);
  });

  it("ignores datasets it does not describe", () => {
    expect(shapeRules([e("brownfield-land", { name: "Yard" })]).items).toEqual([]);
  });
});

describe("planningAt", () => {
  it("returns null for a missing point without calling out", async () => {
    const fetcher = vi.fn();
    expect(await planningAt(NaN, 1, { fetcher })).toBeNull();
    expect(fetcher).not.toHaveBeenCalled();
  });

  it("asks for the point, leaves out geometry and shapes the answer", async () => {
    const fetcher = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ entities: [e("green-belt", { name: "Green Belt" })] }) });
    const out = await planningAt(51.45, -2.58, { fetcher });
    const url = new URL(fetcher.mock.calls[0][0]);
    expect(url.searchParams.get("latitude")).toBe("51.45");
    expect(url.searchParams.get("longitude")).toBe("-2.58");
    expect(url.searchParams.getAll("exclude_field")).toContain("geometry");
    expect(url.searchParams.getAll("dataset")).toContain("conservation-area");
    expect(out.items[0].key).toBe("green-belt");
  });

  it("returns null when the service fails", async () => {
    expect(await planningAt(51, -2, { fetcher: async () => ({ ok: false }) })).toBeNull();
    expect(await planningAt(51, -2, { fetcher: async () => { throw new Error("down"); } })).toBeNull();
  });
});

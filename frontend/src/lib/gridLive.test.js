import { describe, it, expect } from "vitest";
import { parseNow, parseMix, parseDay, groups, clock, nowSentence } from "./gridLive";

const mixJson = { data: { from: "2026-11-23T13:00Z", to: "2026-11-23T13:30Z", generationmix: [
  { fuel: "biomass", perc: 6.4 }, { fuel: "coal", perc: 0 }, { fuel: "imports", perc: 4.9 }, { fuel: "gas", perc: 50.3 }, { fuel: "nuclear", perc: 12.8 },
  { fuel: "other", perc: 0 }, { fuel: "hydro", perc: 0 }, { fuel: "solar", perc: 9.2 }, { fuel: "wind", perc: 16.4 },
] } };

describe("parseNow", () => {
  it("prefers the measured figure and falls back to the forecast", () => {
    const base = { from: "a", to: "b" };
    expect(parseNow({ data: [{ ...base, intensity: { forecast: 165, actual: 162, index: "moderate" } }] }).value).toBe(162);
    expect(parseNow({ data: [{ ...base, intensity: { forecast: 165, actual: null, index: "moderate" } }] }).value).toBe(165);
  });
  it("refuses an answer that is not the expected shape or has an unknown band", () => {
    expect(parseNow({})).toBeNull();
    expect(parseNow({ data: [{ intensity: { forecast: 1, actual: 1, index: "weird" } }] })).toBeNull();
    expect(parseNow({ data: [{ intensity: { forecast: null, actual: null, index: "low" } }] })).toBeNull();
  });
});

describe("parseMix", () => {
  it("keeps real fuels, largest first, and drops empty ones", () => {
    const mix = parseMix(mixJson);
    expect(mix.rows[0]).toEqual({ fuel: "gas", perc: 50.3 });
    expect(mix.rows.map((r) => r.fuel)).not.toContain("coal");
  });
  it("groups wind, solar, hydro and nuclear as low-carbon, and leaves biomass and imports apart", () => {
    const g = groups(parseMix(mixJson));
    expect(g.low).toBeCloseTo(38.4, 5);
    expect(g.fossil).toBeCloseTo(50.3, 5);
    expect(g.biomass).toBeCloseTo(6.4, 5);
    expect(g.imports).toBeCloseTo(4.9, 5);
  });
  it("does not trust shares that do not add up", () => {
    const bad = { data: { ...mixJson.data, generationmix: mixJson.data.generationmix.map((m) => ({ ...m, perc: m.perc / 2 })) } };
    expect(parseMix(bad)).toBeNull();
    expect(parseMix({ data: { generationmix: [{ fuel: "gas", perc: 100 }] } })).toBeNull();
  });
});

describe("parseDay", () => {
  const slot = (i, actual) => ({ from: `2026-11-23T${String(Math.floor(i / 2)).padStart(2, "0")}:${i % 2 ? "30" : "00"}Z`, intensity: { forecast: 150 + i, actual, index: "moderate" } });
  it("keeps all the half hours and leaves the future ones without a measured figure", () => {
    const rows = Array.from({ length: 48 }, (_, i) => slot(i, i < 20 ? 140 + i : null));
    const day = parseDay({ data: rows });
    expect(day).toHaveLength(48);
    expect(day[19].actual).toBe(159);
    expect(day[30].actual).toBeNull();
  });
  it("refuses a short day or one with nothing measured", () => {
    expect(parseDay({ data: [slot(0, 1)] })).toBeNull();
    expect(parseDay({ data: Array.from({ length: 48 }, (_, i) => slot(i, null)) })).toBeNull();
  });
});

describe("words", () => {
  it("shows UK clock time, not UTC, in summer", () => {
    expect(clock("2026-07-01T12:00Z")).toBe("13:00");
    expect(clock("2026-12-01T12:00Z")).toBe("12:00");
    expect(clock("nonsense")).toBe("");
  });
  it("says only what the source says about the band", () => {
    expect(nowSentence({ value: 162.4, index: "moderate" })).toContain("162 grams");
    expect(nowSentence({ value: 162.4, index: "moderate" })).toContain("moderate");
  });
});

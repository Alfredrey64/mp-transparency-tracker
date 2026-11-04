import { describe, it, expect } from "vitest";
import { tidyInstrument, summariseInstruments, monthsBack, procedureOf } from "./statutoryInstruments.js";

const si = (over = {}) => ({ value: { id: "a1", name: "The Widgets Regulations 2026", paperPrefix: "SI", paperNumber: 12, paperYear: "2026", procedure: { name: "Made negative" }, paperMadeDate: "2026-10-01T00:00:00", commonsLayingDate: "2026-10-05T00:00:00", lordsLayingDate: "2026-10-05T00:00:00", ...over } });

describe("tidyInstrument", () => {
  it("keeps the name, procedure, route, dates and reference", () => {
    expect(tidyInstrument(si().value)).toEqual({ id: "a1", name: "The Widgets Regulations 2026", procedure: "Made negative", route: "object", laid: "2026-10-05", made: "2026-10-01", ref: "SI 2026/12" });
  });
  it("gives a draft no reference or made date", () => {
    const t = tidyInstrument(si({ procedure: { name: "Draft affirmative" }, paperNumber: null, paperMadeDate: null }).value);
    expect(t).toMatchObject({ route: "approve", made: null, ref: null });
  });
  it("uses the Lords date when the Commons was not given it", () => {
    expect(tidyInstrument(si({ commonsLayingDate: null }).value).laid).toBe("2026-10-05");
  });
  it("drops entries with an unknown procedure, no date or no name", () => {
    expect(tidyInstrument(si({ procedure: { name: "Something new" } }).value)).toBeNull();
    expect(tidyInstrument(si({ commonsLayingDate: null, lordsLayingDate: null }).value)).toBeNull();
    expect(tidyInstrument(si({ name: " " }).value)).toBeNull();
  });
  it("knows what each procedure means in plain words", () => {
    expect(procedureOf("Draft affirmative").say).toMatch(/cannot become law until Parliament approves/);
    expect(procedureOf("Nope")).toBeNull();
  });
});

describe("monthsBack", () => {
  it("lists twelve months ending with this one, across a year boundary", () => {
    const m = monthsBack("2026-02-10");
    expect(m).toHaveLength(12);
    expect(m[0]).toBe("2025-03");
    expect(m.at(-1)).toBe("2026-02");
  });
});

describe("summariseInstruments", () => {
  const items = [
    si({ id: "a" }),
    si({ id: "b", name: "The Gadgets Order 2026", procedure: { name: "Draft affirmative" }, commonsLayingDate: "2026-10-20T00:00:00" }),
    si({ id: "c", name: "Old", commonsLayingDate: "2025-01-01T00:00:00" }),
    si({ id: "a" }),
  ];
  const out = summariseInstruments(items, { b: { value: { layingBody: { name: "HM Treasury" }, paperComingIntoForceDate: "2026-12-01T00:00:00", link: "https://www.legislation.gov.uk/uksi/2026/9/made" } } }, { from: "2025-11-04", generated: "2026-11-04" });

  it("counts each once, inside the window only", () => {
    expect(out.total).toBe(2);
    expect(out.procedures).toMatchObject({ "Made negative": 1, "Draft affirmative": 1, "Draft negative": 0, "Made affirmative": 0 });
  });
  it("carries the plain-words account of each kind", () => {
    expect(out.kinds["Made negative"]).toMatchObject({ route: "object", say: expect.stringMatching(/already law/) });
  });
  it("counts the months by route", () => {
    const oct = out.months.find((m) => m.month === "2026-10");
    expect(oct).toEqual({ month: "2026-10", approve: 1, object: 1 });
    expect(out.months).toHaveLength(12);
  });
  it("lists the newest first and adds department, date in force and link when known", () => {
    expect(out.recent.map((r) => r.id)).toEqual(["b", "a"]);
    expect(out.recent[0]).toMatchObject({ department: "HM Treasury", inForce: "2026-12-01", link: "https://www.legislation.gov.uk/uksi/2026/9/made" });
    expect(out.recent[1]).toMatchObject({ department: null, inForce: null, link: null });
  });
  it("only accepts links to legislation.gov.uk", () => {
    const bad = summariseInstruments([si({ id: "z" })], { z: { value: { link: "https://evil.example/x" } } }, { from: "2025-11-04", generated: "2026-11-04" });
    expect(bad.recent[0].link).toBeNull();
  });
});

import { describe, expect, it } from "vitest";
import SERIES from "../data/taxSeries.json";
import { GROUPS, TAXES } from "../data/taxCatalogue";
import { CHANCELLORS, chancellorOn } from "../data/chancellors";
import { allChanges, allTaxes, changesByGovernment, changesOf, comingUp, decidedBy, fmt, getTax, governmentOn, headlinesFor, pastChanges, valueOn, HEADLINES } from "./taxRates";

const NOW = Date.parse("2026-10-13T12:00:00Z");
const line = (taxId, key) => getTax(taxId).lines.find((l) => l.key === key);

describe("tax series data", () => {
  it("has a series for every line in the catalogue and no unused series", () => {
    const used = new Set(TAXES.flatMap((t) => t.panels.flatMap((p) => p.lines.map((l) => l.key))));
    for (const k of used) expect(SERIES[k], k).toBeTruthy();
    for (const k of Object.keys(SERIES)) expect(used.has(k), `${k} is not on any tax`).toBe(true);
  });

  it("keeps every series in date order with real dates and numeric values", () => {
    for (const [key, pts] of Object.entries(SERIES)) {
      expect(pts.length, key).toBeGreaterThan(0);
      let prev = "";
      for (const [date, value, opts] of pts) {
        expect(date, key).toMatch(/^\d{4}-\d{2}-\d{2}$/);
        expect(Number.isNaN(Date.parse(date)), `${key} ${date}`).toBe(false);
        expect(date > prev, `${key}: ${date} is not after ${prev}`).toBe(true);
        prev = date;
        expect(value === null || typeof value === "number", `${key} ${date}`).toBe(true);
        if (value !== null) expect(value, `${key} ${date}`).toBeGreaterThanOrEqual(0);
        if (opts?.ann) expect(opts.ann <= date, `${key} ${date}: decided ${opts.ann} must not be after it began`).toBe(true);
      }
    }
  });

  it("never repeats the same value twice in a row", () => {
    for (const [key, pts] of Object.entries(SERIES)) {
      for (let i = 1; i < pts.length; i += 1) expect(pts[i][1] === pts[i - 1][1], `${key} repeats ${pts[i][1]} on ${pts[i][0]}`).toBe(false);
    }
  });

  it("gives every tax a group, a headline line, an explanation and at least one source", () => {
    const groups = new Set(GROUPS.map((g) => g.key));
    const ids = new Set();
    for (const t of TAXES) {
      expect(groups.has(t.group), t.id).toBe(true);
      expect(ids.has(t.id), `duplicate id ${t.id}`).toBe(false);
      ids.add(t.id);
      expect(t.about.length, t.id).toBeGreaterThan(60);
      expect(t.sources.length, t.id).toBeGreaterThan(0);
      for (const [, url] of t.sources) expect(url, t.id).toMatch(/^https:\/\//);
      expect(getTax(t.id).lines.some((l) => l.key === t.headline), `${t.id} headline`).toBe(true);
      // Plain wording: no dashes used as punctuation or arrows.
      const text = [t.about, t.summary, ...t.notes].join(" ");
      expect(text, t.id).not.toMatch(/—|–|→|->/);
    }
  });

  it("orders the chancellors by date", () => {
    for (let i = 1; i < CHANCELLORS.length; i += 1) expect(CHANCELLORS[i].from > CHANCELLORS[i - 1].from).toBe(true);
  });
});

describe("values on a date", () => {
  it("returns the rate in force", () => {
    expect(valueOn(line("vat", "vat.standard"), "2011-01-03")).toBe(17.5);
    expect(valueOn(line("vat", "vat.standard"), "2011-01-04")).toBe(20);
    expect(valueOn(line("vat", "vat.standard"), "1972-12-31")).toBeUndefined();
    expect(valueOn(line("income-tax", "incomeTax.basic"), "1979-06-11")).toBe(33);
    expect(valueOn(line("income-tax", "incomeTax.basic"), "1979-06-12")).toBe(30);
    expect(valueOn(line("fuel", "fuel.petrol"), "2022-03-22")).toBe(57.95);
    expect(valueOn(line("fuel", "fuel.petrol"), "2022-03-23")).toBe(52.95);
    expect(valueOn(line("corporation-tax", "corp.main"), "2023-04-01")).toBe(25);
    expect(valueOn(line("income-tax", "incomeTax.starting"), "2008-04-06")).toBeNull();
  });

  it("matches the figures HMRC publishes for 2026 to 2027", () => {
    expect(valueOn(line("income-tax", "incomeTax.allowance"), "2026-10-13")).toBe(12570);
    expect(valueOn(line("income-tax", "incomeTax.higherStarts"), "2026-10-13")).toBe(50270);
    expect(valueOn(line("national-insurance", "ni.employee"), "2026-10-13")).toBe(8);
    expect(valueOn(line("national-insurance", "ni.employer"), "2026-10-13")).toBe(15);
    expect(valueOn(line("inheritance-tax", "iht.nrb"), "2026-10-13")).toBe(325000);
    expect(valueOn(line("council-tax", "councilTax.bandD"), "2026-10-13")).toBe(2392);
    expect(valueOn(line("business-rates", "rates.standard"), "2026-10-13")).toBe(48);
    expect(valueOn(line("stamp-duty", "sdlt.threshold"), "2026-10-13")).toBe(125000);
  });

  it("formats values for each unit", () => {
    expect(fmt("pct", 17.5)).toBe("17.5%");
    expect(fmt("pct", 20)).toBe("20%");
    expect(fmt("gbp0", 12570)).toBe("£12,570");
    expect(fmt("gbp2", 7.07)).toBe("£7.07");
    expect(fmt("gbpp", 0.4335)).toBe("43.4p");
    expect(fmt("gbpp", 9.5)).toBe("£9.50");
    expect(fmt("pence", 52.95)).toBe("52.95p");
    expect(fmt("pct", null)).toBe("none");
  });
});

describe("changes and who set them", () => {
  it("says whether a change means more or less tax, with allowances the other way round", () => {
    const up = changesOf(line("vat", "vat.standard")).find((c) => c.date === "2011-01-04");
    expect(up.move).toBe("up");
    expect(up.effect).toBe("more");
    const allowance = changesOf(line("income-tax", "incomeTax.allowance")).find((c) => c.date === "2021-04-06");
    expect(allowance.move).toBe("up");
    expect(allowance.effect).toBe("less");
    const cut = changesOf(line("income-tax", "incomeTax.basic")).find((c) => c.date === "2008-04-06");
    expect(cut.move).toBe("down");
    expect(cut.effect).toBe("less");
  });

  it("treats the first step as a change only when the tax was brought in then", () => {
    const vat = changesOf(line("vat", "vat.standard"))[0];
    expect(vat.first).toBe(false);
    expect(vat.move).toBe("start");
    const fuel = changesOf(line("fuel", "fuel.petrol"))[0];
    expect(fuel.first).toBe(true);
    expect(fuel.move).toBe("record");
    expect(allChanges(getTax("fuel")).some((c) => c.first)).toBe(false);
  });

  it("credits a rate to the government that decided it", () => {
    const vat2011 = changesOf(line("vat", "vat.standard")).find((c) => c.date === "2011-01-04");
    expect(vat2011.gov.id).toBe("coalition");
    expect(vat2011.chancellor.short).toBe("Osborne");
    expect(vat2011.decidedEarlier).toBe(true);
    // Set by Labour in 2008, in force under the coalition... the 17.5% return began in January 2010 under Labour.
    const back = changesOf(line("vat", "vat.standard")).find((c) => c.date === "2010-01-01");
    expect(back.gov.id).toBe("brown");
    expect(back.chancellor.short).toBe("Darling");
    // Corporation tax at 25% began in 2023 but was decided in 2021.
    const ct = changesOf(line("corporation-tax", "corp.main")).find((c) => c.date === "2023-04-01");
    expect(ct.gov.id).toBe("johnson");
    expect(ct.chancellor.short).toBe("Sunak");
    // The July 2026 electricity VAT cut was set by the Burnham government.
    const elec = changesOf(line("vat", "vat.electricity")).find((c) => c.date === "2026-10-01");
    expect(elec.gov.id).toBe("burnham");
  });

  it("does not name a Chancellor who had only just taken office unless the decision date is known", () => {
    const d = decidedBy({ date: "1974-04-06", ann: null, budgetDay: false });
    expect(d.gov.id).toBe("wilson2");
    expect(d.chancellor).toBeNull();
    const withDate = decidedBy({ date: "1974-04-06", ann: "1974-03-26" });
    expect(withDate.chancellor.short).toBe("Healey");
  });

  it("finds the government and Chancellor on a date", () => {
    expect(governmentOn("1979-06-12").id).toBe("thatcher");
    expect(governmentOn("2026-07-20").id).toBe("burnham");
    expect(governmentOn("2026-07-19").id).toBe("starmer");
    expect(chancellorOn("2022-09-23").short).toBe("Kwarteng");
    expect(chancellorOn("2026-08-01").short).toBe("Healey");
  });

  it("separates what is in force from what is still to come", () => {
    const fuel = getTax("fuel");
    const coming = comingUp(fuel, NOW);
    expect(coming.map((c) => c.date)).toEqual(["2026-12-01", "2026-12-01", "2027-03-01", "2027-03-01"]);
    expect(pastChanges(fuel, NOW).every((c) => c.date <= "2026-10-13")).toBe(true);
    expect(pastChanges(fuel, NOW).length + coming.length).toBe(allChanges(fuel).length);
  });
});

describe("by government", () => {
  it("lists changes decided under a government and the headline rates", () => {
    const thatcher = changesByGovernment("thatcher", NOW);
    expect(thatcher.length).toBeGreaterThan(20);
    expect(thatcher.every((c) => c.gov.id === "thatcher")).toBe(true);
    const heads = headlinesFor("thatcher", NOW);
    expect(heads).toHaveLength(HEADLINES.length);
    const basic = heads.find((h) => h.key === "incomeTax.basic");
    expect([basic.start, basic.end]).toEqual([33, 25]);
    const top = heads.find((h) => h.key === "incomeTax.top");
    expect([top.start, top.end]).toEqual([83, 40]);
  });

  it("shows the current government up to today and never counts future steps", () => {
    const burnham = changesByGovernment("burnham", NOW);
    expect(burnham.every((c) => c.date <= "2026-10-13")).toBe(true);
    const heads = headlinesFor("burnham", NOW);
    expect(heads.find((h) => h.key === "vat.standard").end).toBe(20);
  });

  it("counts every change under exactly one government", () => {
    const today = "2026-10-13";
    let total = 0;
    for (const t of allTaxes()) for (const l of t.lines) total += changesOf(l).filter((c) => !c.first && c.date <= today).length;
    const govIds = [...new Set(allTaxes().flatMap((t) => t.lines.flatMap((l) => changesOf(l).map((c) => c.gov?.id).filter(Boolean))))];
    const counted = govIds.reduce((n, id) => n + changesByGovernment(id, NOW).length, 0);
    expect(counted).toBe(total);
  });
});

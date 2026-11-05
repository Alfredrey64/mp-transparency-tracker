import { describe, it, expect } from "vitest";
import { tidyInstrument, summariseInstruments, monthsBack, procedureOf, summariseNote, kindOf } from "./statutoryInstruments.js";

const si = (over = {}) => ({ value: { id: "a1", name: "The Widgets Regulations 2026", paperPrefix: "SI", paperNumber: 12, paperYear: "2026", procedure: { name: "Made negative" }, paperMadeDate: "2026-10-01T00:00:00", commonsLayingDate: "2026-10-05T00:00:00", lordsLayingDate: "2026-10-05T00:00:00", ...over } });

describe("summariseNote", () => {
  it("drops an unfilled statutory instrument number from the wording", () => {
    const xml = "<ExplanatoryNotes><p>These Regulations make changes in consequence of the Consumer Subscription Contracts (Cancellation and Information) Regulations 2026 (S.I. 2026/XXXX) coming into force.</p></ExplanatoryNotes>";
    expect(summariseNote(xml)?.join(" ")).not.toMatch(/XXXX/);
  });
});

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

const note = (body) => `<Legislation><ExplanatoryNotes><ExplanatoryNote><Pblock><P>EXPLANATORY NOTE</P><P>(This note is not part of the Regulations)</P><P>${body}</P></Pblock></ExplanatoryNote></ExplanatoryNotes></Legislation>`;

describe("summariseNote", () => {
  it("takes the opening sentences and drops the heading, citations and bracketed shorthand", () => {
    const xml = note("These Regulations amend the Control of Asbestos Regulations 2012 ( S.I. 2012/632 ) (\u201C the 2012 Regulations \u201D) to require an independent check. Regulation 2 does this. Regulation 3 does that.");
    expect(summariseNote(xml)).toEqual(["These Regulations amend the Control of Asbestos Regulations 2012 to require an independent check."]);
  });
  it("removes act chapter numbers and keeps (EU Exit) in a title", () => {
    const xml = note("These Regulations extend the transitional arrangements under the Financial Services (Gibraltar) (Amendment) (EU Exit) Regulations 2019 ( S.I. 2019/589 ) and the Energy Act 2013 (c. 32).");
    expect(summariseNote(xml)[0]).toBe("These Regulations extend the transitional arrangements under the Financial Services (Gibraltar) (Amendment) (EU Exit) Regulations 2019 and the Energy Act 2013.");
  });
  it("keeps the next sentences up to three and stops at a list of what each regulation does", () => {
    const xml = note("This Order makes changes to the wards of North Somerset. It does not change the boundary. Article 3 abolishes the wards. Article 4 sets numbers.");
    expect(summariseNote(xml)).toEqual(["This Order makes changes to the wards of North Somerset.", "It does not change the boundary."]);
  });
  it("does not split on No. or St.", () => {
    const xml = note("These Regulations amend the Customs (Tariff) (No. 7) Regulations 2026 for goods landed at St. Helens in the north.");
    expect(summariseNote(xml)).toHaveLength(1);
  });
  it("keeps a first sentence that starts with a regulation number", () => {
    expect(summariseNote(note("Regulation 2 amends the definition of the authorised use document in regulation 32(2) to refer to a new version. The new version cuts duty on nine goods."))).toHaveLength(2);
  });
  it("reads entities and returns null when there is no note or too little text", () => {
    expect(summariseNote(note("These Regulations set fees for planning &amp; building control in England and Wales."))[0]).toMatch(/planning & building/);
    expect(summariseNote("<Legislation></Legislation>")).toBeNull();
    expect(summariseNote(note("Short."))).toBeNull();
    expect(summariseNote(null)).toBeNull();
  });
});

describe("kindOf", () => {
  it("names what kind of change a title says it is, and nothing when it does not say", () => {
    expect(kindOf("The Herefordshire (Electoral Changes) Order 2026")).toBe("Redraws a council\u2019s wards");
    expect(kindOf("The Widgets (Commencement No. 3) Regulations 2026")).toBe("Brings part of an Act into force");
    expect(kindOf("The Control of Asbestos (Amendment etc.) Regulations 2026")).toBe("Changes existing rules");
    expect(kindOf("The Planning (Fees) Regulations 2026")).toBe("Sets fees");
    expect(kindOf("The Bus Franchising Regulations 2026")).toBeNull();
  });
  it("is carried with the summary on the newest instruments", () => {
    const out = summariseInstruments([si({ id: "a", name: "The Widgets (Amendment) Regulations 2026" })], {}, { from: "2025-11-04", generated: "2026-11-04", notes: { a: ["It changes widgets."] } });
    expect(out.recent[0]).toMatchObject({ kind: "Changes existing rules", summary: ["It changes widgets."] });
  });
});

import { describe, it, expect } from "vitest";
import { pickLawExample, royalAssentDate } from "./lawExample";

const st = (house, stage, ...dates) => ({ house, stage, dates });
const act = (id, title, stages) => ({ bill: { billId: id, shortTitle: title, longTitle: `A Bill ${id}`, originatingHouse: "Commons" }, stages });
const short = [st("Commons", "1st reading", "2026-06-01"), st("Commons", "2nd reading", "2026-06-02"), st("Commons", "Committee stage", "2026-06-03"), st("Commons", "3rd reading", "2026-06-04"), st("Lords", "1st reading", "2026-06-05"), st("Unassigned", "Royal Assent", "2026-06-20")];
const long = [...short.slice(0, 5), st("Lords", "2nd reading", "2026-06-09"), st("Lords", "Report stage", "2026-06-11"), st("Commons", "Consideration of Lords amendments", "2026-06-15"), st("Unassigned", "Royal Assent", "2026-06-16")];

describe("royalAssentDate", () => {
  it("is the last day on the Royal Assent stage, or null without one", () => {
    expect(royalAssentDate(long)).toBe("2026-06-16");
    expect(royalAssentDate(short.slice(0, 3))).toBeNull();
    expect(royalAssentDate([st("Unassigned", "Royal Assent")])).toBeNull();
    expect(royalAssentDate(null)).toBeNull();
  });
});

describe("pickLawExample", () => {
  it("takes the Act with the most stages", () => {
    const pick = pickLawExample([act(1, "Short Act", short), act(2, "Long Act", long)]);
    expect(pick.bill.shortTitle).toBe("Long Act");
    expect(pick.bill.url).toBe("https://bills.parliament.uk/bills/2");
    expect(pick.royalAssent).toBe("2026-06-16");
    expect(pick.stages).toHaveLength(long.length);
  });
  it("breaks a tie with the later Royal Assent", () => {
    const later = long.map((s) => (s.stage === "Royal Assent" ? st("Unassigned", "Royal Assent", "2026-09-01") : s));
    expect(pickLawExample([act(1, "Earlier", long), act(2, "Later", later)]).bill.shortTitle).toBe("Later");
  });
  it("ignores an Act with no dated Royal Assent, or too few stages, and gives null when none is left", () => {
    expect(pickLawExample([act(1, "No assent", long.slice(0, 7)), act(2, "Tiny", short.slice(0, 2))])).toBeNull();
    expect(pickLawExample([])).toBeNull();
    expect(pickLawExample(null)).toBeNull();
  });
});

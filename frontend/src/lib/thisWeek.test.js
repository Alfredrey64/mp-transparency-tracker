import { describe, it, expect } from "vitest";
import { sinceDate, billItems, voteItems, moneyItems, petitionItems, standardsItems, electionItems, buildFeed, collapseBills, countByKind, dayLabel, groupByDay } from "./thisWeek";

const NOW = new Date("2026-10-26T10:00:00Z");

describe("this week", () => {
  it("counts back whole days", () => {
    expect(sinceDate(7, NOW)).toBe("2026-10-19");
    expect(sinceDate(0, NOW)).toBe("2026-10-26");
  });
  it("keeps only bills updated in the window and describes them plainly", () => {
    const items = billItems([
      { bill_id: 1, short_title: "Rail Bill", last_updated: "2026-10-25T09:00:00", current_stage: "Committee stage", current_house: "Lords" },
      { bill_id: 2, short_title: "Old Bill", last_updated: "2026-01-01T09:00:00" },
      { bill_id: 3, short_title: "Water Act", last_updated: "2026-10-24", is_act: true },
    ], "2026-10-19");
    expect(items.map((i) => i.title)).toEqual(["Rail Bill", "Water Act"]);
    expect(items[0].detail).toBe("Now at Committee stage in the Lords.");
    expect(items[1].detail).toMatch(/law/);
  });
  it("turns one-row-per-MP votes into one item per division", () => {
    const rows = [
      { division_id: 9, title: "Tax Bill", date: "2026-10-23", voted_aye: true }, { division_id: 9, title: "Tax Bill", date: "2026-10-23", voted_aye: true }, { division_id: 9, title: "Tax Bill", date: "2026-10-23", voted_aye: false },
      { division_id: 8, title: "Old", date: "2026-01-01", voted_aye: true },
    ];
    const items = voteItems(rows, "2026-10-19");
    expect(items).toHaveLength(1);
    expect(items[0].detail).toBe("2 MPs voted aye and 1 voted no. It passed.");
  });
  it("lists the biggest new declarations first, named", () => {
    const items = moneyItems([
      { id: 1, politician_id: 5, donor_name: "Acme Ltd", value_amount: 5000, date_registered: "2026-10-22", category: "Donations" },
      { id: 2, politician_id: 5, donor_name: "Big Co", value_amount: 20000, date_registered: "2026-10-23", category: "Gifts" },
      { id: 3, politician_id: 5, donor_name: "Nobody", value_amount: null, date_registered: "2026-10-23" },
    ], [{ id: 5, name: "Alex Doe", party: "Labour", party_colour: "#d50000" }], "2026-10-19");
    expect(items.map((i) => i.title)).toEqual(["Alex Doe declared £20,000 from Big Co", "Alex Doe declared £5,000 from Acme Ltd"]);
    expect(items[0].href).toBe("#/followTheMoney/Big%20Co");
  });
  it("covers petitions, conduct reports and by-elections", () => {
    expect(petitionItems([{ id: 1, action: "Ban X", signature_count: 120000, government_responded_at: "2026-10-24T00:00:00", debate_scheduled_on: "2026-11-02" }], "2026-10-19", "2026-10-26").map((i) => i.title)).toEqual(['The government responded to "Ban X"', 'Debate scheduled on "Ban X"']);
    expect(standardsItems([{ id: 4, title: "Report on Y", publication_date: "2026-10-21", politician_name: "Y" }], "2026-10-19")[0].detail).toBe("Concerns Y.");
    expect(electionItems([{ election_id: 1, constituency_name: "Z", election_date: "2026-11-05", status: "scheduled" }, { election_id: 2, constituency_name: "Far", election_date: "2027-03-01" }], "2026-10-19", "2026-11-25")).toHaveLength(1);
  });
  it("shows the first few bills of a busy day and sums up the rest", () => {
    const bills = Array.from({ length: 6 }, (_, i) => ({ id: `b${i}`, kind: "bill", date: "2026-10-25", title: `Bill ${i}` }));
    const out = collapseBills([...bills, { id: "v", kind: "vote", date: "2026-10-25", title: "V" }], 4);
    expect(out.filter((i) => i.kind === "bill")).toHaveLength(5);
    expect(out.find((i) => i.id === "bills-more-2026-10-25").title).toBe("2 more bills moved");
    expect(collapseBills(bills.slice(0, 3), 4)).toHaveLength(3);
  });
  it("builds one feed, newest first, and groups it by day", () => {
    const feed = buildFeed([[{ id: "a", kind: "vote", date: "2026-10-20", title: "B" }], [{ id: "b", kind: "bill", date: "2026-10-25", title: "A" }, { id: "c", kind: "vote", date: "2026-10-25", title: "C" }]]);
    expect(feed.map((i) => i.id)).toEqual(["b", "c", "a"]);
    expect(countByKind(feed)).toMatchObject({ bill: 1, vote: 2, money: 0 });
    expect(groupByDay(feed).map((g) => [g.date, g.items.length])).toEqual([["2026-10-25", 2], ["2026-10-20", 1]]);
    expect(dayLabel("2026-10-26", "2026-10-26")).toBe("Today");
    expect(dayLabel("2026-10-25", "2026-10-26")).toBe("Yesterday");
  });
});

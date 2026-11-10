import { describe, it, expect } from "vitest";
import { billMore } from "./billMore";

describe("billMore", () => {
  it("gives the points and the official wording for a title with several clauses", () => {
    const more = billMore({ short_title: "Glue Traps Bill", long_title: "A Bill to ban glue traps; to require licences; and for connected purposes" });
    expect(more.points).toEqual(["Bans glue traps", "Requires licences"]);
    expect(more.extra).toBe(0);
    expect(more.official).toBe("A Bill to ban glue traps; to require licences; and for connected purposes");
  });
  it("counts the points it leaves out", () => {
    const more = billMore({ short_title: "Big Bill", long_title: "A Bill to ban a; to ban b; to ban c; to ban d; to ban e; to ban f; to ban g; to ban h" });
    expect(more.points).toHaveLength(6);
    expect(more.extra).toBe(2);
  });
  it("offers nothing when a single clause would only repeat the summary", () => {
    expect(billMore({ short_title: "Rail Bill", long_title: "A Bill to make provision about railways; and for connected purposes" })).toBeNull();
  });
  it("still offers the official wording when a hand-written description replaces the summary", () => {
    const more = billMore({ short_title: "Health Bill", long_title: "A Bill to make provision about health" });
    expect(more.points).toEqual(["Sets rules on health"]);
    expect(more.official).toBe("A Bill to make provision about health");
  });
  it("offers nothing without a title", () => {
    expect(billMore(null)).toBeNull();
    expect(billMore({ short_title: "X", long_title: "  " })).toBeNull();
  });
});

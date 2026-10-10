import { describe, it, expect } from "vitest";
import { mpGiftKind, partyGiftKind, declaredAs } from "./giftPurpose";

describe("mpGiftKind", () => {
  it("names each register category in plain words", () => {
    expect(mpGiftKind("Donations and other support (including loans) for activities as an MP").key).toBe("support");
    expect(mpGiftKind("Gifts, benefits and hospitality from UK sources").label).toBe("Gift or hospitality");
    expect(mpGiftKind("Visits outside the UK").key).toBe("visit");
    expect(mpGiftKind("Employment and earnings - Ad hoc payments").key).toBe("paid-work");
  });
  it("falls back to other", () => {
    expect(mpGiftKind("Something new").key).toBe("other");
    expect(mpGiftKind(null).key).toBe("other");
  });
});

describe("partyGiftKind", () => {
  it("separates cash, goods and public money", () => {
    expect(partyGiftKind("Cash").label).toMatch(/Cash gift/);
    expect(partyGiftKind("Non Cash").key).toBe("party-goods");
    expect(partyGiftKind("Public Funds").label).toMatch(/not a private gift/);
    expect(partyGiftKind("Mystery").key).toBe("party-other");
  });
});

describe("declaredAs", () => {
  it("adds up each kind and puts the biggest first", () => {
    const out = declaredAs(
      [{ category: "Visits outside the UK", value_amount: 2000 }, { category: "Visits outside the UK", value_amount: 500 }],
      [{ donation_type: "Cash", value: 10000 }, { donation_type: "Non Cash", value: null }],
    );
    expect(out.map((o) => o.key)).toEqual(["party-cash", "visit", "party-goods"]);
    expect(out.find((o) => o.key === "visit")).toMatchObject({ total: 2500, count: 2 });
  });
});

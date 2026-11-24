import { describe, it, expect } from "vitest";
import { standing, summariseHygiene, loadFoodHygiene } from "./foodHygiene.js";

const e = (RatingValue, extra = {}) => ({ RatingValue, SchemeType: "FHRS", BusinessName: "Shop " + RatingValue, FHRSID: Math.random(), Distance: 0.3, LocalAuthorityName: "Bristol", ...extra });

describe("standing", () => {
  it("reads numbers, Scottish results and unrated places", () => {
    expect(standing(e("5"))).toEqual({ kind: "rated", value: 5 });
    expect(standing({ RatingValue: "Pass", SchemeType: "FHIS" })).toEqual({ kind: "pass" });
    expect(standing({ RatingValue: "Improvement Required", SchemeType: "FHIS" })).toEqual({ kind: "improve" });
    expect(standing(e("AwaitingInspection")).kind).toBe("waiting");
    expect(standing({ RatingValue: "Awaiting Inspection", SchemeType: "FHIS" }).kind).toBe("waiting");
    expect(standing(e("Exempt")).kind).toBe("exempt");
    expect(standing(e("")).kind).toBe("other");
  });
});

describe("summariseHygiene", () => {
  const list = [e("5"), e("5"), e("4"), e("3"), e("1", { Distance: 0.5 }), e("0", { Distance: 0.9 }), e("2", { Distance: 0.1 }), e("AwaitingInspection"), e("Exempt")];
  const s = summariseHygiene(list);
  it("counts each rating and keeps unrated places apart", () => {
    expect(s.counts).toEqual({ 0: 1, 1: 1, 2: 1, 3: 1, 4: 1, 5: 2 });
    expect(s).toMatchObject({ scheme: "FHRS", total: 9, rated: 7, waiting: 1, exempt: 1, judged: 7, authority: "Bristol" });
    expect(s.goodShare).toBeCloseTo(3 / 7);
  });
  it("lists the lowest-rated first, nearest first within a rating", () => {
    expect(s.weakCount).toBe(3);
    expect(s.weak.map((w) => w.rating)).toEqual([0, 1, 2]);
  });
  it("keeps every weak place, so the list on the page can be opened out in full", () => {
    const many = Array.from({ length: 40 }, (_, k) => ({ RatingValue: String(k % 3), SchemeType: "FHRS", BusinessName: `Place ${k}`, Distance: k / 10 }));
    expect(summariseHygiene(many).weak).toHaveLength(40);
    expect(summariseHygiene(many, { show: 5 }).weak).toHaveLength(5);
  });
  it("handles the Scottish scheme", () => {
    const sc = summariseHygiene([{ RatingValue: "Pass", SchemeType: "FHIS" }, { RatingValue: "Pass", SchemeType: "FHIS" }, { RatingValue: "Improvement Required", SchemeType: "FHIS", BusinessName: "X" }, { RatingValue: "Awaiting Inspection", SchemeType: "FHIS" }]);
    expect(sc).toMatchObject({ scheme: "FHIS", judged: 3, pass: 2, improve: 1, waiting: 1, weakCount: 1 });
    expect(sc.goodShare).toBeCloseTo(2 / 3);
  });
  it("copes with nothing", () => {
    expect(summariseHygiene([])).toMatchObject({ total: 0, judged: 0, goodShare: null });
  });
});

describe("loadFoodHygiene", () => {
  it("asks the service for places within the radius", async () => {
    let seen;
    const fetcher = async (url, init) => { seen = { url, init }; return { ok: true, json: async () => ({ establishments: [e("5")], meta: { totalCount: 1 } }) }; };
    const r = await loadFoodHygiene({ lat: 51.4545, lon: -2.5879 }, 1, fetcher);
    expect(seen.url).toContain("latitude=51.45450&longitude=-2.58790&maxDistanceLimit=1");
    expect(seen.init.headers["x-api-version"]).toBe("2");
    expect(r.total).toBe(1);
  });
  it("throws on a failure or a strange answer", async () => {
    await expect(loadFoodHygiene({ lat: 1, lon: 1 }, 1, async () => ({ ok: false, status: 500 }))).rejects.toThrow();
    await expect(loadFoodHygiene({ lat: 1, lon: 1 }, 1, async () => ({ ok: true, json: async () => ({}) }))).rejects.toThrow();
  });
});

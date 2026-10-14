import { describe, expect, it } from "vitest";
import { planOptions } from "./balanceBoxes";

const best = (n, width, natural) => planOptions(n, width, 10, natural)[0] ?? null;

// planOptions(n, width, gap, natural): the page's own layout gives each box `natural` pixels.
describe("planOptions", () => {
  it("leaves rows that already fit across alone", () => {
    expect(planOptions(4, 1000, 10, 240)).toEqual([]);
  });
  it("prefers one row when that keeps the boxes a sensible width", () => {
    expect(best(5, 1000, 240)).toEqual({ columns: 5, lastCount: 5, fullLast: false });
    expect(best(4, 760, 240)).toEqual({ columns: 4, lastCount: 4, fullLast: false });
  });
  it("then the fewest rows, split evenly: five becomes three and two, seven four and three", () => {
    expect(planOptions(5, 1000, 10, 240).map((o) => o.columns)).toEqual([5, 3]);
    expect(best(5, 700, 300)).toEqual({ columns: 3, lastCount: 2, fullLast: false });
    expect(best(7, 960, 300)).toEqual({ columns: 4, lastCount: 3, fullLast: false });
    expect(best(8, 960, 330)).toEqual({ columns: 4, lastCount: 4, fullLast: false });
  });
  it("runs a lone last box full width when only two fit across", () => {
    // A phone: 335 wide, boxes 160. Three across would be 105, too narrow, so 2, 2 and a full-width last.
    expect(best(5, 335, 160)).toEqual({ columns: 2, lastCount: 1, fullLast: true });
    expect(best(3, 335, 160)).toEqual({ columns: 2, lastCount: 1, fullLast: true });
  });
  it("centres a lone last box when three or more fit across and nothing better fits", () => {
    expect(best(7, 650, 300)).toEqual({ columns: 3, lastCount: 1, fullLast: false });
    expect(best(7, 650, 220)).toEqual({ columns: 4, lastCount: 3, fullLast: false });
  });
  it("never makes boxes much narrower than the page chose", () => {
    for (let n = 3; n <= 8; n += 1) {
      for (const width of [335, 480, 700, 960, 1200]) {
        for (const natural of [150, 200, 260, 320]) {
          const nat = Math.min(natural, width);
          for (const plan of planOptions(n, width, 12, nat)) {
            const each = (width - (plan.columns - 1) * 12) / plan.columns;
            const naturalColumns = Math.max(1, Math.floor((width + 12) / (nat + 12)));
            if (plan.columns > naturalColumns) expect(each, `${n} boxes in ${width}, natural ${natural}`).toBeGreaterThanOrEqual(Math.min(Math.max(130, nat * 0.6), nat) - 0.5);
          }
        }
      }
    }
  });
});

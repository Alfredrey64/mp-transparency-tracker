import { describe, it, expect } from "vitest";
import { pointNear, changeBetween, compareStats, valueAtOrBefore } from "./onsStats";
import { formatValue, changeWords, changeShort } from "./onsFormat";

const years = Array.from({ length: 12 }, (_, i) => [String(2015 + i), [3, 2, 5, 4, 1, 6, 5, 4, 3, 4, 5, 4][i]]);

describe("comparing a series with its past", () => {
  it("finds the reading near a date", () => {
    expect(pointNear(years, 2020)[0]).toBe("2020");
    expect(pointNear(years, 2100)).toBeNull();
  });

  it("measures change in points for rates and per cent for levels", () => {
    expect(changeBetween({ kind: "rate" }, 3, 4.5)).toEqual({ type: "points", amount: 1.5 });
    expect(changeBetween({ kind: "level" }, 50, 75).amount).toBeCloseTo(50);
    const deficit = changeBetween({ kind: "level", format: "gbpbn" }, -11400, -12500);
    expect(deficit.type).toBe("amount");
    expect(deficit.amount).toBe(-1100);
    expect(deficit.text).toBe("£1.1bn");
  });

  it("gives then-and-now figures and the extremes", () => {
    const s = compareStats({ kind: "rate" }, years);
    expect(s.latest.value).toBe(4);
    expect(s.yearAgo.value).toBe(5);
    expect(s.yearAgo.change.amount).toBe(-1);
    expect(s.fiveAgo.period).toBe("2021");
    expect(s.tenAgo.period).toBe("2016");
    expect(s.high.value).toBe(6);
    expect(s.low.value).toBe(1);
    expect(s.low.isNow).toBe(false);
    expect(s.higherThanShare).toBe(Math.round((years.filter((p) => p[1] < 4).length / years.length) * 100));
  });

  it("leaves out comparisons the history can't support", () => {
    const short = compareStats({ kind: "rate" }, years.slice(-3));
    expect(short.tenAgo).toBeNull();
    expect(short.yearAgo).not.toBeNull();
    expect(compareStats({ kind: "rate" }, [])).toBeNull();
  });

  it("looks up the latest reading on or before a date", () => {
    expect(valueAtOrBefore(years, 2018.5)[0]).toBe("2018");
    expect(valueAtOrBefore(years, 2000)).toBeNull();
  });
});

describe("negative figures", () => {
  it("writes the minus sign before the pound", () => {
    expect(formatValue("gbpbn", -12522)).toBe("-£12.5bn");
    expect(formatValue("gbpbn", 12522)).toBe("£12.5bn");
  });

  it("describes a change in a figure that crosses zero as an amount", () => {
    const c = changeBetween({ kind: "level", format: "gbpbn" }, 10500, -12500);
    expect(changeWords(c)).toBe("down £23.0bn on a year earlier");
    expect(changeShort(c)).toBe("down £23.0bn");
  });
});

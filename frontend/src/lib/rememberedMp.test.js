import { describe, it, expect } from "vitest";
import { readRememberedSeat, rememberSeat, forgetSeat } from "./rememberedMp";

const fakeStorage = (initial = {}) => {
  const m = new Map(Object.entries(initial));
  return { getItem: (k) => m.get(k) ?? null, setItem: (k, v) => m.set(k, v), removeItem: (k) => m.delete(k), _m: m };
};
const seat = { name: "Gainsborough", mp: { memberId: 345, name: "Sir Edward Leigh", party: "Conservative", colour: "0063ba", extra: "dropped" }, results: "dropped" };

describe("remembered seat", () => {
  it("round-trips the public details and drops everything else", () => {
    const s = fakeStorage();
    rememberSeat(seat, s);
    expect(readRememberedSeat(s)).toEqual({ name: "Gainsborough", mp: { memberId: 345, name: "Sir Edward Leigh", party: "Conservative", colour: "0063ba" } });
  });
  it("forgets on request", () => {
    const s = fakeStorage();
    rememberSeat(seat, s);
    forgetSeat(s);
    expect(readRememberedSeat(s)).toBeNull();
  });
  it("ignores corrupt or wrongly shaped stored values", () => {
    expect(readRememberedSeat(fakeStorage({ "mpTracker.rememberedSeat.v1": "{not json" }))).toBeNull();
    expect(readRememberedSeat(fakeStorage({ "mpTracker.rememberedSeat.v1": JSON.stringify({ name: 3 }) }))).toBeNull();
    expect(readRememberedSeat(fakeStorage())).toBeNull();
  });
  it("doesn't throw when storage is missing or blocked", () => {
    expect(readRememberedSeat(null)).toBeNull();
    const blocked = { getItem: () => { throw new Error("denied"); }, setItem: () => { throw new Error("denied"); }, removeItem: () => { throw new Error("denied"); } };
    expect(() => rememberSeat(seat, blocked)).not.toThrow();
    expect(() => forgetSeat(blocked)).not.toThrow();
    expect(readRememberedSeat(blocked)).toBeNull();
  });
  it("won't store an invalid seat", () => {
    const s = fakeStorage();
    rememberSeat({ name: "X" }, s);
    expect(s._m.size).toBe(0);
  });
});

// @vitest-environment jsdom
import { describe, it, expect, beforeEach } from "vitest";
import { getWatchedBills, isBillWatched, toggleWatchBill, removeWatchedBill, billChange, markBillsSeen } from "./billWatch";

const bill = { bill_id: 7, short_title: "Rail Bill", current_stage: "Committee stage", is_act: false, is_defeated: false };

beforeEach(() => localStorage.clear());

describe("following a bill", () => {
  it("adds and removes a bill, remembering where it stood", () => {
    expect(isBillWatched(7)).toBe(false);
    expect(toggleWatchBill(bill, 1000)).toBe(true);
    expect(getWatchedBills()).toEqual([{ bill_id: 7, title: "Rail Bill", stage: "Committee stage", is_act: false, is_defeated: false, since: 1000 }]);
    expect(isBillWatched(7)).toBe(true);
    expect(toggleWatchBill(bill)).toBe(false);
    expect(getWatchedBills()).toEqual([]);
  });
  it("removes by id and survives unreadable storage", () => {
    toggleWatchBill(bill);
    removeWatchedBill(7);
    expect(getWatchedBills()).toEqual([]);
    localStorage.setItem("mp-tracker-bill-watch", "not json");
    expect(getWatchedBills()).toEqual([]);
  });
  it("tells the page to count again", () => {
    let n = 0;
    const on = () => { n += 1; };
    window.addEventListener("mp-tracker-watchlist-changed", on);
    toggleWatchBill(bill);
    window.removeEventListener("mp-tracker-watchlist-changed", on);
    expect(n).toBe(1);
  });
});

describe("billChange", () => {
  const entry = { bill_id: 7, title: "Rail Bill", stage: "Committee stage", is_act: false, is_defeated: false };
  it("is null when nothing has moved", () => {
    expect(billChange(entry, { current_stage: "Committee stage", is_act: false, is_defeated: false })).toBeNull();
    expect(billChange(entry, null)).toBeNull();
  });
  it("reports a new stage", () => {
    expect(billChange(entry, { current_stage: "Report stage", last_updated: "2026-11-05" })).toEqual({ from: "Committee stage", to: "Report stage", becameLaw: false, defeated: false, updated: "2026-11-05" });
  });
  it("reports becoming law and being defeated", () => {
    expect(billChange(entry, { current_stage: "Royal Assent", is_act: true }).becameLaw).toBe(true);
    expect(billChange(entry, { current_stage: "Committee stage", is_defeated: true }).defeated).toBe(true);
  });
});

describe("markBillsSeen", () => {
  it("moves the baseline to where each found bill stands now", () => {
    toggleWatchBill(bill);
    toggleWatchBill({ ...bill, bill_id: 8, short_title: "Other Bill" });
    markBillsSeen([{ bill_id: 7, current_stage: "Report stage", is_act: false, is_defeated: false }]);
    const [a, b] = getWatchedBills();
    expect(a.stage).toBe("Report stage");
    expect(b.stage).toBe("Committee stage");
  });
});

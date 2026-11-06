import { describe, it, expect, vi, beforeEach } from "vitest";

const single = vi.fn();
vi.mock("../supabaseClient", () => ({ supabase: { from: () => ({ select: () => ({ eq: () => ({ single }) }) }) } }));
const { MP_LIST_COLUMNS, PEER_LIST_COLUMNS, hasFullRow, fullRow, hasFullPeer, fullPeer } = await import("./mpRows");

describe("MP rows", () => {
  beforeEach(() => single.mockReset());

  it("leaves the heavy profile columns out of a list", () => {
    const columns = MP_LIST_COLUMNS.split(",").map((c) => c.trim());
    for (const heavy of ["recent_activity", "ipsa_expenses", "biography", "parliamentary_email"]) expect(columns).not.toContain(heavy);
    for (const needed of ["id", "name", "party", "constituency", "thumbnail_url"]) expect(columns).toContain(needed);
  });

  it("calls a row whole when it carries both profile columns, even empty ones", () => {
    expect(hasFullRow({ id: 1, recent_activity: null, ipsa_expenses: null })).toBe(true);
    expect(hasFullRow({ id: 1, name: "A" })).toBe(false);
    expect(hasFullRow(null)).toBe(false);
  });

  it("returns a whole row as it is, without asking again", async () => {
    const row = { id: 1, recent_activity: {}, ipsa_expenses: null };
    expect(await fullRow(row)).toBe(row);
    expect(single).not.toHaveBeenCalled();
  });

  it("fetches the whole row for a slim one", async () => {
    const whole = { id: 1, name: "A", recent_activity: {}, ipsa_expenses: null };
    single.mockResolvedValue({ data: whole, error: null });
    expect(await fullRow({ id: 1, name: "A" })).toBe(whole);
  });

  it("falls back to the slim row when the fetch fails", async () => {
    const slim = { id: 1, name: "A" };
    single.mockResolvedValue({ data: null, error: { message: "down" } });
    expect(await fullRow(slim)).toBe(slim);
  });

  it("keeps the heavy columns out of a list of peers, and fetches the whole row on opening one", async () => {
    const columns = PEER_LIST_COLUMNS.split(",").map((c) => c.trim());
    for (const heavy of ["recent_activity", "committees", "wikipedia_bio", "ministerial_history", "biography"]) expect(columns).not.toContain(heavy);
    expect(hasFullPeer({ id: 1, recent_activity: null, committees: null, wikipedia_bio: null, ministerial_history: null, biography: null })).toBe(true);
    const whole = { id: 1, recent_activity: {}, committees: [], wikipedia_bio: "x" };
    single.mockResolvedValue({ data: whole, error: null });
    expect(await fullPeer({ id: 1, name: "A" })).toBe(whole);
    single.mockResolvedValue({ data: null, error: { message: "down" } });
    const slim = { id: 2, name: "B" };
    expect(await fullPeer(slim)).toBe(slim);
  });
});

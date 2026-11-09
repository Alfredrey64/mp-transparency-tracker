import { describe, it, expect } from "vitest";
import { leaderFromInfobox, plausibleName, decide, PARTIES, MAX_CHANGES_PER_RUN } from "./partyLeaders.js";

describe("leaderFromInfobox", () => {
  it("reads leader1_name when its title is Leader", () => {
    const box = "| leader1_title = [[Leader of X|Leader]]\n| leader1_name = [[Ed Davey]]\n| leader2_title = Deputy Leader\n| leader2_name = [[Daisy Cooper]]";
    expect(leaderFromInfobox(box)).toEqual({ role: "Leader", page: "Ed Davey", name: "Ed Davey" });
  });
  it("reads a plain `leader` line even when leader1 is the deputy", () => {
    const box = "| leader = [[Gavin Robinson]]\n| leader1_title = Deputy Leader\n| leader1_name = [[Michelle McIlveen]]";
    expect(leaderFromInfobox(box).name).toBe("Gavin Robinson");
  });
  it("does not take a deputy as the leader", () => {
    expect(leaderFromInfobox("| leader1_title = Deputy Leader\n| leader1_name = [[Someone Else]]")).toBeNull();
  });
  it("calls the head of Sinn Féin the President, and uses the displayed name of a piped link", () => {
    const box = "| leader1_title = [[President of Sinn Féin|President]]\n| leader1_name = [[Mary Lou McDonald|Mary Lou McDonald]]<ref>cite</ref>";
    expect(leaderFromInfobox(box)).toEqual({ role: "President", page: "Mary Lou McDonald", name: "Mary Lou McDonald" });
  });
  it("returns null when there is no leader", () => {
    expect(leaderFromInfobox("| name = Something")).toBeNull();
    expect(leaderFromInfobox(undefined)).toBeNull();
  });
});

describe("plausibleName", () => {
  it("accepts real names, with accents, apostrophes and Welsh particles", () => {
    for (const n of ["Kemi Badenoch", "Rhun ap Iorwerth", "Mary Lou McDonald", "Seán Ó Néill", "Mary-Jane O'Brien"]) expect(plausibleName(n), n).toBe(true);
  });
  it("rejects things that are not a name", () => {
    for (const n of ["", "Vacant", "TBA", "Leader of the Labour Party (UK) 2024 2025 2026 and more and more", "John 3rd", "[[x y]]", null, undefined]) expect(plausibleName(n), String(n)).toBe(false);
  });
});

describe("decide", () => {
  const found = (name, photo = "https://thumb.wikimedia.org/a.jpg") => ({ name, role: "Leader", page: name.replace(/ /g, "_"), photo });
  const had = { name: "Old Leader", role: "Leader", page: "Old_Leader", photo: "https://thumb.wikimedia.org/old.jpg", confirmed: "2026-11-01" };

  it("stores a first reading", () => {
    expect(decide(undefined, found("New Person"), "2026-11-09")).toMatchObject({ change: "new", entry: { name: "New Person", confirmed: "2026-11-09" } });
  });
  it("refreshes the same leader and takes the newest portrait", () => {
    const r = decide(had, { ...found("Old Leader"), photo: "https://thumb.wikimedia.org/newer.jpg" }, "2026-11-09");
    expect(r.change).toBe("same");
    expect(r.entry.photo).toBe("https://thumb.wikimedia.org/newer.jpg");
    expect(r.entry.confirmed).toBe("2026-11-09");
  });
  it("keeps the old portrait of the same leader when this lookup finds none", () => {
    expect(decide(had, found("Old Leader", null), "2026-11-09").entry.photo).toBe(had.photo);
  });
  it("does not change leader the first time a different name appears, only notes it", () => {
    const r = decide(had, found("New Person"), "2026-11-09");
    expect(r.change).toBe("pending");
    expect(r.entry.name).toBe("Old Leader");
    expect(r.entry.photo).toBe(had.photo);
    expect(r.entry.pending).toMatchObject({ name: "New Person", seen: "2026-11-09" });
  });
  it("does not adopt on a second look the same day", () => {
    const pending = decide(had, found("New Person"), "2026-11-09").entry;
    expect(decide(pending, found("New Person"), "2026-11-09").change).toBe("pending");
  });
  it("adopts the new leader, with their own portrait and none of the old one, when seen again on a later day", () => {
    const pending = decide(had, found("New Person", "https://thumb.wikimedia.org/new.jpg"), "2026-11-09").entry;
    const r = decide(pending, found("New Person", null), "2026-11-10");
    expect(r.change).toBe("adopted");
    expect(r.entry).toMatchObject({ name: "New Person", photo: null, confirmed: "2026-11-10" });
    expect(r.entry.pending).toBeUndefined();
  });
  it("forgets a note when the old leader comes back (a reverted edit)", () => {
    const pending = decide(had, found("Vandal Name"), "2026-11-09").entry;
    const r = decide(pending, found("Old Leader"), "2026-11-10");
    expect(r.change).toBe("same");
    expect(r.entry.pending).toBeUndefined();
  });
  it("starts the wait again when a third name appears", () => {
    const pending = decide(had, found("Name One"), "2026-11-09").entry;
    expect(decide(pending, found("Name Two"), "2026-11-10").entry.pending).toMatchObject({ name: "Name Two", seen: "2026-11-10" });
  });
  it("adopts at once when told to", () => {
    expect(decide(had, found("New Person"), "2026-11-09", { immediate: true }).change).toBe("adopted");
  });
});

describe("the list of parties", () => {
  it("covers twelve parties and allows only a few changes at once", () => {
    expect(Object.keys(PARTIES)).toHaveLength(12);
    expect(MAX_CHANGES_PER_RUN).toBeLessThan(6);
  });
});

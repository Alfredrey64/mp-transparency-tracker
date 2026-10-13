import { describe, it, expect } from "vitest";
import book from "../data/electionSeatNames.json";
import { buildElectionIndex, findElections } from "./electionSearch";

const index = buildElectionIndex(book);

describe("election search", () => {
  it("finds an election by year", () => {
    const r = findElections("1997", index);
    expect(r[0]).toMatchObject({ kind: "election", hash: "#/generalElection/history/1997" });
  });

  it("finds both 1974 elections", () => {
    const hashes = findElections("1974", index, 6).filter((x) => x.kind === "election").map((x) => x.hash);
    expect(hashes).toContain("#/generalElection/history/1974a");
    expect(hashes).toContain("#/generalElection/history/1974b");
  });

  it("finds a government by Prime Minister", () => {
    expect(findElections("thatcher", index)[0]).toMatchObject({ kind: "government", hash: "#/generalElection/governments/thatcher" });
    expect(findElections("coalition", index)[0].kind).toBe("government");
  });

  it("finds devolved elections by what people call the building", () => {
    expect(findElections("senedd 2026", index)[0].hash).toBe("#/generalElection/devolved/wales/2026");
    expect(findElections("stormont", index)[0].kind).toBe("devolved");
    expect(findElections("holyrood 2021", index)[0].hash).toBe("#/generalElection/devolved/scotland/2021");
  });

  it("finds old seats that no longer exist, after the pages", () => {
    const r = findElections("bristol north west", index);
    expect(r.some((x) => x.kind === "seat")).toBe(true);
    expect(findElections("zzzz", index)).toEqual([]);
  });
});

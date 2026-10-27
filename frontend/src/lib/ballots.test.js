import { describe, it, expect, vi } from "vitest";
import {
  cleanPostcode, surnameOf, bySurname, daysTo, prettyDate, fullDate, shortDate, roleText, byElectionText, howToMark, howToMarkParts, deadlinesOf, toContest, contests, candidatesOf,
  findContests, findCandidates, lookUpBallots, ELECTIONS_URL, BALLOTS_URL, MAX_CONTESTS,
} from "./ballots";

const ballot = (over = {}) => ({
  election_id: "local.manchester.harpurhey.by.2026-11-26", election_title: "Manchester local election Harpurhey by-election", poll_open_date: "2026-11-26",
  timetable: { close_of_nominations: "2026-10-30", registration_deadline: "2026-11-10", postal_vote_application_deadline: "2026-11-11", proxy_vote_application_deadline: "2026-11-18" },
  election_type: { election_type: "local" }, organisation: { common_name: "Manchester" }, division: { name: "Harpurhey" }, group_type: null,
  elected_role: "Local Councillor", seats_contested: 1, voting_system: { slug: "FPTP", name: "First-past-the-post" }, requires_voter_id: "EA-2022", cancelled: false,
  by_election_reason: "DEATH", deleted: false, ...over,
});
const group = { election_id: "local.manchester.2026-11-26", poll_open_date: "2026-11-26", group_type: "organisation", election_title: "Manchester local election" };
const json = (body, status = 200) => ({ ok: status < 400, status, json: async () => body });

describe("postcodes", () => {
  it("accepts well-shaped postcodes however they are typed", () => {
    expect(cleanPostcode("sw1a 1aa")).toBe("SW1A1AA");
    expect(cleanPostcode("  M9 4FP ")).toBe("M9 4FP".replace(" ", ""));
    expect(cleanPostcode("BT1 1AA")).toBe("BT11AA");
    expect(cleanPostcode("EH1 1YZ")).toBe("EH11YZ");
  });
  it("rejects anything else, so nothing odd is ever sent on", () => {
    for (const bad of ["", "hello", "SW1A", "12345", "SW1A 1AA&current=0", "SW1A1AA/../x", null, undefined, "<script>"]) expect(cleanPostcode(bad), String(bad)).toBeNull();
  });
});

describe("names", () => {
  it("finds the surname", () => {
    expect(surnameOf("Gerald David Dickson")).toBe("Dickson");
    expect(surnameOf("Jo Ramsay")).toBe("Ramsay");
    expect(surnameOf("")).toBe("");
    expect(surnameOf(undefined)).toBe("");
  });
  it("orders by surname and nothing else, without changing the input", () => {
    const people = [{ name: "Zara Young", party: "A" }, { name: "Adam Smith", party: "Z" }, { name: "Bea Smith", party: "M" }, { name: "Carl Adams", party: "Q" }];
    const copy = JSON.stringify(people);
    expect(bySurname(people).map((p) => p.name)).toEqual(["Carl Adams", "Adam Smith", "Bea Smith", "Zara Young"]);
    expect(JSON.stringify(people)).toBe(copy);
  });
});

describe("dates", () => {
  it("counts whole days", () => {
    const today = new Date(2026, 9, 27, 23, 59);
    expect(daysTo("2026-10-27", today)).toBe(0);
    expect(daysTo("2026-10-28", today)).toBe(1);
    expect(daysTo("2026-10-20", today)).toBe(-7);
    expect(daysTo("2026-11-26", today)).toBe(30);
  });
  it("writes dates in either language", () => {
    expect(prettyDate("2026-11-26")).toMatch(/^Thursday,? 26 November 2026$/);
    expect(prettyDate("2026-11-26", "cy-GB")).toBe("Dydd Iau 26 Tachwedd 2026");
    expect(fullDate("2026-11-26")).toBe("26 November 2026");
    expect(fullDate("2026-11-26", "cy-GB")).toBe("26 Tachwedd 2026");
    expect(shortDate("2026-11-26")).toBe("26 November");
    expect(shortDate("2026-11-26", "cy-GB")).toBe("26 Tachwedd");
  });
});

describe("plain words", () => {
  it("names roles", () => {
    expect(roleText("Local Councillor")).toBe("Councillor");
    expect(roleText("Member of Parliament")).toBe("MP");
    expect(roleText("mayor")).toBe("Mayor");
    expect(roleText(null)).toBeNull();
  });
  it("explains by-elections only when there is one", () => {
    expect(byElectionText("")).toBeNull();
    expect(byElectionText(undefined)).toBeNull();
    expect(byElectionText("DEATH")).toMatch(/died/);
    expect(byElectionText("RESIGNATION")).toMatch(/resigned/);
    expect(byElectionText("SOMETHING_NEW")).toMatch(/became empty/);
  });
  it("explains how to mark the paper only for systems it is sure of", () => {
    expect(howToMark("FPTP", 1)).toMatch(/one X/);
    expect(howToMark("FPTP", 3)).toMatch(/up to 3 votes/);
    expect(howToMark("STV", 4)).toMatch(/1, 2, 3/);
    expect(howToMark("STV", 4)).toMatch(/4 people are/);
    expect(howToMark("STV", 1)).toMatch(/One person is/);
    expect(howToMark("SV", 1)).toMatch(/second choice/);
    expect(howToMark("AMS", 1)).toBeNull();
    expect(howToMark(null, 1)).toBeNull();
    expect(howToMarkParts("FPTP", 3)).toEqual({ text: expect.stringContaining("{n}"), vars: { n: 3 } });
    expect(howToMarkParts("FPTP", 1).vars).toEqual({});
  });
  it("lists key dates in order, and marks the ones that have gone", () => {
    const today = new Date(2026, 10, 1);
    const d = deadlinesOf(ballot().timetable, today);
    expect(d.map((x) => x.key)).toEqual(["close_of_nominations", "registration_deadline", "postal_vote_application_deadline", "proxy_vote_application_deadline"]);
    expect(d[0].passed).toBe(true);
    expect(d[1].passed).toBe(false);
    expect(deadlinesOf(null)).toEqual([]);
    expect(deadlinesOf({ registration_deadline: "soon" })).toEqual([]);
  });
});

describe("contests", () => {
  it("keeps single ballots and drops groups and deleted ones", () => {
    const out = contests([group, ballot(), ballot({ election_id: "x.deleted.2026-11-26", deleted: true }), null, { election_id: 5 }]);
    expect(out).toHaveLength(1);
    expect(out[0]).toMatchObject({ id: "local.manchester.harpurhey.by.2026-11-26", title: "Harpurhey, Manchester", role: "Councillor", seats: 1, system: "FPTP", voterId: true, cancelled: false });
    expect(out[0].byElection).toMatch(/died/);
  });
  it("sorts by date then name", () => {
    const out = contests([ballot({ election_id: "b", poll_open_date: "2027-05-06", division: { name: "B" } }), ballot({ election_id: "a", poll_open_date: "2026-11-26", division: { name: "Z" } }), ballot({ election_id: "c", poll_open_date: "2026-11-26", division: { name: "A" } })]);
    expect(out.map((c) => c.id)).toEqual(["c", "a", "b"]);
  });
  it("does not claim a voter ID rule it was not told", () => {
    expect(toContest(ballot({ requires_voter_id: null })).voterId).toBe(false);
  });
  it("copes with a missing division and a bad list", () => {
    expect(toContest(ballot({ division: null })).title).toBe("Manchester local election Harpurhey by-election");
    expect(contests(undefined)).toEqual([]);
    expect(contests("nope")).toEqual([]);
  });
});

describe("candidates", () => {
  const api = {
    candidates_locked: true,
    candidacies: [
      { person: { id: 2, name: "Sarah Myers" }, party_name: "Reform UK" },
      { person: { id: 1, name: "Gerald Dickson" }, party_name: "Labour Party" },
      { person: { id: 3, name: "Withdrawn Person" }, party_name: "X", deselected: true },
      { person: { id: "7", name: "No Number" }, party: { name: "Independent" } },
    ],
  };
  it("lists people by surname, skips the deselected, and links profiles by number only", () => {
    const c = candidatesOf(api);
    expect(c.list.map((p) => p.name)).toEqual(["Gerald Dickson", "Sarah Myers", "No Number"].sort((a, b) => surnameOf(a).localeCompare(surnameOf(b))));
    expect(c.locked).toBe(true);
    expect(c.list.find((p) => p.name === "Gerald Dickson").profile).toBe("https://whocanivotefor.co.uk/person/1/");
    expect(c.list.find((p) => p.name === "No Number").profile).toBeNull();
    expect(c.list.find((p) => p.name === "No Number").party).toBe("Independent");
  });
  it("copes with nothing", () => {
    expect(candidatesOf({})).toEqual({ list: [], locked: false, uncontested: false });
    expect(candidatesOf(null).list).toEqual([]);
  });
});

describe("fetching", () => {
  it("refuses a bad postcode without calling out", async () => {
    const f = vi.fn();
    await expect(findContests("nonsense", { fetchImpl: f })).rejects.toMatchObject({ status: 400 });
    expect(f).not.toHaveBeenCalled();
  });
  it("asks only for the cleaned postcode, upcoming only", async () => {
    const f = vi.fn(async () => json({ results: [group, ballot()], next: null }));
    const out = await findContests("m9 4fp", { fetchImpl: f });
    expect(f.mock.calls[0][0]).toBe(`${ELECTIONS_URL}?postcode=M94FP&current=1&limit=100`);
    expect(out).toHaveLength(1);
  });
  it("follows paging, upgrades http, and never follows a link to another site", async () => {
    const f = vi.fn()
      .mockResolvedValueOnce(json({ results: [ballot({ election_id: "one" })], next: `${ELECTIONS_URL.replace("https", "http")}?page=2` }))
      .mockResolvedValueOnce(json({ results: [ballot({ election_id: "two" })], next: "https://evil.example/steal" }));
    const out = await findContests("M94FP", { fetchImpl: f });
    expect(out.map((c) => c.id).sort()).toEqual(["one", "two"]);
    expect(f).toHaveBeenCalledTimes(2);
    expect(f.mock.calls[1][0].startsWith("https://elections.democracyclub.org.uk/")).toBe(true);
  });
  it("treats a missing candidates page as no candidates yet, but passes other failures on", async () => {
    expect(await findCandidates("x", { fetchImpl: async () => json({}, 404) })).toMatchObject({ list: [], missing: true });
    await expect(findCandidates("x", { fetchImpl: async () => json({}, 500) })).rejects.toMatchObject({ status: 500 });
  });
  it("puts the ballot id safely in the address", async () => {
    const f = vi.fn(async () => json({ candidacies: [] }));
    await findCandidates("a/b?c", { fetchImpl: f });
    expect(f.mock.calls[0][0]).toBe(`${BALLOTS_URL}a%2Fb%3Fc/`);
  });
  it("fills in candidates for each contest, and keeps going when one list fails", async () => {
    const f = vi.fn(async (url) => {
      if (url.startsWith(ELECTIONS_URL)) return json({ results: [ballot({ election_id: "ok" }), ballot({ election_id: "bad" }), ballot({ election_id: "gone", cancelled: true }), ballot({ election_id: "vote", election_type: { election_type: "ref" } })] });
      if (url.includes("/bad/")) return json({}, 500);
      return json({ candidates_locked: false, candidacies: [{ person: { id: 1, name: "A B" }, party_name: "P" }] });
    });
    const { contests: out, more } = await lookUpBallots("M94FP", { fetchImpl: f });
    const by = Object.fromEntries(out.map((c) => [c.id, c]));
    expect(by.ok.candidates.list).toHaveLength(1);
    expect(by.bad.error).toBe(true);
    expect(by.bad.candidates).toBeNull();
    expect(by.gone.candidates).toBeNull();
    expect(by.vote.candidates).toBeNull();
    expect(more).toBe(0);
    expect(f.mock.calls.filter(([u]) => u.includes("candidates.democracyclub")).length).toBe(2);
  });
  it("caps how many contests it fills in", async () => {
    const many = Array.from({ length: MAX_CONTESTS + 3 }, (_, i) => ballot({ election_id: `c${String(i).padStart(2, "0")}` }));
    const f = vi.fn(async (url) => (url.startsWith(ELECTIONS_URL) ? json({ results: many }) : json({ candidacies: [] })));
    const out = await lookUpBallots("M94FP", { fetchImpl: f });
    expect(out.contests).toHaveLength(MAX_CONTESTS);
    expect(out.more).toBe(3);
  });
});

describe("Welsh dates", () => {
  it("names every month and every day of the week, with no browser data needed", () => {
    const months = Array.from({ length: 12 }, (_, i) => fullDate(`2026-${String(i + 1).padStart(2, "0")}-05`, "cy").split(" ")[1]);
    expect(months).toEqual(["Ionawr", "Chwefror", "Mawrth", "Ebrill", "Mai", "Mehefin", "Gorffennaf", "Awst", "Medi", "Hydref", "Tachwedd", "Rhagfyr"]);
    const days = Array.from({ length: 7 }, (_, i) => prettyDate(`2026-11-${String(22 + i).padStart(2, "0")}`, "cy").replace(/ \d.*$/, ""));
    expect(days).toEqual(["Dydd Sul", "Dydd Llun", "Dydd Mawrth", "Dydd Mercher", "Dydd Iau", "Dydd Gwener", "Dydd Sadwrn"]);
  });
  it("does not shift a date across midnight, whatever the time zone", () => {
    expect(fullDate("2026-01-01", "cy")).toBe("1 Ionawr 2026");
    expect(fullDate("2026-12-31", "cy")).toBe("31 Rhagfyr 2026");
  });
});

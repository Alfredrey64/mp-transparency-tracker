import { describe, expect, it } from "vitest";
import { plain, sameName, entityName, postHolders, currentHeadId, devolvedHoldersOnSite, primeMinisterOnSite, chancellorOnSite, differences } from "./officeHolders.js";

describe("names", () => {
  it("ignores titles, accents and punctuation", () => {
    expect(sameName("Rt Hon John Healey MP", "John Healey")).toBe(true);
    expect(sameName("Michelle O'Neill", "Michelle O’Neill")).toBe(true);
    expect(sameName("Mary Lou McDonald TD", "Mary Lou McDonald")).toBe(true);
    expect(sameName("Rhun ap Iorwerth", "Rhun ap Iorwerth MS")).toBe(true);
    expect(sameName("Rhun ap Iorwerth", "Eluned Morgan")).toBe(false);
  });
  it("never treats two empty names as the same person", () => {
    expect(sameName("", "")).toBe(false);
    expect(sameName(null, undefined)).toBe(false);
  });
});

describe("Parliament's posts", () => {
  const posts = [
    { value: { name: "Prime Minister and First Lord of the Treasury", postHolders: [{ endDate: "2026-07-20", member: { value: { nameDisplayAs: "Keir Starmer" } } }, { endDate: null, member: { value: { nameDisplayAs: "Andy Burnham" } } }] } },
    { value: { name: "Chancellor of the Exchequer", postHolders: [{ endDate: null, member: { value: { nameDisplayAs: "John Healey" } } }] } },
  ];
  it("finds the holder with no end date by the start of the post's name", () => {
    expect(postHolders(posts, "Prime Minister")).toEqual(["Andy Burnham"]);
    expect(postHolders(posts, "Chancellor of the Exchequer")).toEqual(["John Healey"]);
  });
  it("returns null when there is no such post, so the check says it could not be sure", () => {
    expect(postHolders(posts, "Home Secretary")).toBeNull();
    expect(postHolders(undefined, "Prime Minister")).toBeNull();
  });
});

describe("a Wikidata item's name", () => {
  it("prefers the English Wikipedia title, then an English label, then the neutral one", () => {
    expect(entityName({ sitelinks: { enwiki: { title: "A" } }, labels: { en: { value: "B" } } })).toBe("A");
    expect(entityName({ labels: { en: { value: "B" }, mul: { value: "C" } } })).toBe("B");
    expect(entityName({ labels: { mul: { value: "C" } } })).toBe("C");
    expect(entityName({ labels: {} })).toBeNull();
  });
});

describe("Wikidata head of government", () => {
  const claim = (id, rank, ended) => ({ rank, mainsnak: { datavalue: { value: { id } } }, qualifiers: ended ? { P582: [{}] } : undefined });
  it("takes the preferred claim, else the latest one without an end date", () => {
    expect(currentHeadId({ claims: { P6: [claim("Q1", "normal", true), claim("Q2", "preferred", false)] } })).toBe("Q2");
    expect(currentHeadId({ claims: { P6: [claim("Q1", "normal", true), claim("Q3", "normal", false)] } })).toBe("Q3");
    expect(currentHeadId({ claims: { P6: [claim("Q1", "normal", true)] } })).toBeNull();
    expect(currentHeadId({})).toBeNull();
  });
});

describe("what the site says", () => {
  it("reads the three First Ministers out of the page's text", () => {
    const src = `x\n  {\n    name: "Scottish Parliament",\n    holders: [{ role: "First Minister", name: "A One", party: "P" }],\n  },\n  {\n    name: "Senedd Cymru",\n    holders: [{ role: "First Minister of Wales", name: "B Two" }],\n  },\n  {\n    name: "Northern Ireland Assembly",\n    holders: [\n      { role: "First Minister", name: "C Three" },\n      { role: "Deputy First Minister", name: "D Four" },\n    ],\n  },\n`;
    expect(devolvedHoldersOnSite(src)).toEqual({ scotland: "A One", wales: "B Two", northernIreland: "C Three" });
  });
  it("reads the real page", async () => {
    const fs = await import("node:fs");
    const found = devolvedHoldersOnSite(fs.readFileSync(new URL("./frontend/src/components/DevolvedAdministrations.jsx", import.meta.url), "utf8"));
    expect(Object.values(found).every(Boolean), JSON.stringify(found)).toBe(true);
  });
  it("finds the open government and the latest Chancellor in the real files", async () => {
    const { GOVERNMENTS } = await import("./frontend/src/data/governments.js");
    const { CHANCELLORS } = await import("./frontend/src/data/chancellors.js");
    expect(primeMinisterOnSite(GOVERNMENTS)).toBeTruthy();
    expect(chancellorOnSite(CHANCELLORS)).toBeTruthy();
  });
  it("is unsure when two governments are open at once", () => {
    expect(primeMinisterOnSite([{ pm: "A", to: null }, { pm: "B", to: null }])).toBeNull();
  });
});

describe("differences", () => {
  const same = { primeMinister: "A B", chancellor: "C D", scotland: "E F", wales: "G H", northernIreland: "I J" };
  it("is empty when everything agrees, whatever the titles", () => {
    expect(differences(same, { ...same, primeMinister: ["Rt Hon A B MP"] })).toEqual([]);
  });
  it("names the office, the site's holder and the source's", () => {
    expect(differences(same, { ...same, chancellor: ["New Person"] })).toEqual([{ office: "Chancellor of the Exchequer", site: "C D", live: "New Person" }]);
  });
  it("flags two people holding one post, and a source that gave nothing", () => {
    expect(differences(same, { ...same, primeMinister: ["A B", "X Y"] }).map((d) => d.office)).toEqual(["Prime Minister"]);
    expect(differences(same, { ...same, wales: null }).map((d) => d.office)).toEqual(["First Minister of Wales"]);
  });
});

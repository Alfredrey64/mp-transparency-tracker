import { describe, it, expect } from "vitest";
import { reportSource, instrumentSource, checkRewrite, fromCache, toCache, userMessage, hash, SYSTEM, NOT_ENOUGH } from "./plainEnglish.js";

const report = { id: 7, committee: "Health and Social Care Committee", title: "Obesity", about: ["The committee looked into how the Government could cut obesity among the 29% of adults it affects."] };
const instrument = { id: "abc", name: "The Fishing (Quotas) Regulations 2026", department: "Defra", summary: ["These Regulations set the 2026 quota for 14 stocks of fish."] };

describe("sources", () => {
  it("builds one from the official wording and skips records with none", () => {
    expect(reportSource(report)).toMatchObject({ key: "report:7", kind: "report", by: "Health and Social Care Committee" });
    expect(instrumentSource(instrument)).toMatchObject({ key: "si:abc", kind: "instrument", by: "Defra" });
    expect(reportSource({ ...report, about: [] })).toBeNull();
    expect(instrumentSource({ ...instrument, summary: undefined })).toBeNull();
  });
  it("sends the model the title, the body and the official text, and a different instruction for each kind", () => {
    const msg = userMessage(reportSource(report));
    expect(msg).toContain("Report: Obesity");
    expect(msg).toContain("Committee: Health and Social Care Committee");
    expect(msg).toContain("29%");
    expect(SYSTEM.report).not.toBe(SYSTEM.instrument);
    expect(SYSTEM.report).toMatch(/Use only facts that are in the text/);
  });
});

describe("checkRewrite", () => {
  const s = reportSource(report);
  const good = "The committee looked at how the Government could bring down obesity, which affects 29% of adults. It asked what is working and what is not.";
  it("accepts a plain paragraph that uses only figures from the source", () => {
    expect(checkRewrite(good, s)).toBe(good);
    expect(checkRewrite(`“${good}”`, s)).toBe(good);
  });
  it("rejects a figure the source does not contain", () => {
    expect(checkRewrite(good.replace("29%", "31%"), s)).toBeNull();
  });
  it("rejects the model declining, links, markdown, chatter and the wrong length", () => {
    expect(checkRewrite(NOT_ENOUGH, s)).toBeNull();
    expect(checkRewrite("", s)).toBeNull();
    expect(checkRewrite(`${good} See https://example.org`, s)).toBeNull();
    expect(checkRewrite(`**${good}**`, s)).toBeNull();
    expect(checkRewrite(`Here is a plain English version: ${good}`, s)).toBeNull();
    expect(checkRewrite("Too short.", s)).toBeNull();
    expect(checkRewrite(`${good} ${good} ${good} ${good}`, s)).toBeNull();
  });
});

describe("cache", () => {
  const s = instrumentSource(instrument);
  it("reuses a rewrite while the source is unchanged and asks again when it changes", () => {
    const cache = toCache({}, s, "Sets this year's fishing limits.");
    expect(fromCache(cache, s)).toBe("Sets this year's fishing limits.");
    expect(fromCache(cache, { ...s, text: `${s.text} And more.` })).toBeUndefined();
    expect(fromCache({}, s)).toBeUndefined();
  });
  it("remembers a rewrite that was not fit to show as empty, so it is not asked for every day", () => {
    expect(fromCache(toCache({}, s, ""), s)).toBe("");
  });
  it("hashes the same wording the same way", () => {
    expect(hash(s)).toBe(hash({ ...s }));
    expect(hash(s)).not.toBe(hash({ ...s, title: "Another" }));
  });
});

import { describe, it, expect } from "vitest";
import { analyticsAllowed, pathFor, isScript } from "./analytics";

describe("analytics privacy", () => {
  it("stays off when the browser asks not to be tracked", () => {
    expect(analyticsAllowed({ doNotTrack: "1" })).toBe(false);
    expect(analyticsAllowed({ globalPrivacyControl: true })).toBe(false);
    expect(analyticsAllowed({ doNotTrack: "0" })).toBe(true);
    expect(analyticsAllowed({})).toBe(true);
  });
  it("reports pages by name only, so searches, postcodes, donors and MPs are never sent", () => {
    expect(pathFor("followTheMoney", "Unite the Union")).toBe("/followTheMoney");
    expect(pathFor("constituency", "Hackney North")).toBe("/constituency");
    expect(pathFor("myMP", null)).toBe("/myMP");
    expect(pathFor("list", "career=minister")).toBe("/list");
  });
  it("keeps the question for an answer page, which is not personal", () => {
    expect(pathFor("answers", "why-housing-expensive")).toBe("/answers/why-housing-expensive");
    expect(pathFor("answers", null)).toBe("/answers");
  });

  it("only starts when Vercel serves a real script, so a switched-off project causes no console error", () => {
    const res = (ok, type) => ({ ok, headers: { get: () => type } });
    expect(isScript(res(true, "text/javascript; charset=utf-8"))).toBe(true);
    expect(isScript(res(true, "text/html; charset=utf-8"))).toBe(false);
    expect(isScript(res(false, "text/javascript"))).toBe(false);
    expect(isScript(undefined)).toBe(false);
  });
});

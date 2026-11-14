import { describe, it, expect } from "vitest";
import { annotation } from "./ci-notes.js";

describe("annotation", () => {
  it("keeps the last lines, drops stack frames and escapes breaks", () => {
    const err = "Error: 503  for https://x\n    at getJson (file:///a.js:24:22)\n    at async main (file:///a.js:36:18)\n\nNode.js v22.1.0\n";
    expect(annotation("fetch-x.js", err)).toBe("::error title=fetch-x.js failed::Error: 503  for https://x");
    expect(annotation("a", "one\ntwo\nthree\nfour")).toBe("::error title=a failed::two | three | four");
    expect(annotation("a", "100% done\n")).toContain("100%25 done");
  });
  it("copes with nothing written and long messages", () => {
    expect(annotation("a", "")).toBe("::error title=a failed::no message");
    expect(annotation("a", "x".repeat(900)).length).toBeLessThan(450);
  });
});

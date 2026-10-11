import { describe, it, expect } from "vitest";
import { embedHash, embedUrl, parseEmbedHash, iframeCode, embedHeight, RESIZE_SNIPPET } from "./embed";
import { ANSWERS } from "../data/answers";
import { SECTORS } from "../data/onsSectors";

describe("embed addresses", () => {
  it("round-trip an answer and a chart", () => {
    expect(parseEmbedHash(embedHash({ kind: "answer", id: "why-housing-expensive" }))).toEqual({ kind: "answer", id: "why-housing-expensive", theme: "light" });
    expect(parseEmbedHash(embedHash({ kind: "chart", sector: "housing", id: "hpi-uk" }, "dark"))).toEqual({ kind: "chart", sector: "housing", id: "hpi-uk", theme: "dark" });
  });
  it("reject anything that is not a card", () => {
    expect(parseEmbedHash("")).toBeNull();
    expect(parseEmbedHash("#/answer")).toBeNull();
    expect(parseEmbedHash("#/chart/housing")).toBeNull();
    expect(parseEmbedHash("#/other/x")).toBeNull();
  });
  it("builds the page address and the iframe code", () => {
    const spec = { kind: "answer", id: "what-is-gdp" };
    expect(embedUrl("https://x.test", spec, "light")).toBe("https://x.test/embed.html#/answer/what-is-gdp");
    const code = iframeCode({ origin: "https://x.test", spec, theme: "dark", title: 'What is "GDP"?' });
    expect(code).toContain('src="https://x.test/embed.html#/answer/what-is-gdp?theme=dark"');
    expect(code).toContain('title="What is &quot;GDP&quot;?"');
    expect(code).toContain(`height="${embedHeight("answer")}"`);
    expect(code).toContain("loading=\"lazy\"");
  });
  it("only resizes the frame that sent the message", () => {
    expect(RESIZE_SNIPPET).toContain("f.contentWindow === e.source");
  });
  it("can address every answer and every chart", () => {
    for (const a of ANSWERS) expect(parseEmbedHash(embedHash({ kind: "answer", id: a.id })).id).toBe(a.id);
    for (const s of SECTORS) for (const d of s.series) expect(parseEmbedHash(embedHash({ kind: "chart", sector: s.key, id: d.id }))).toMatchObject({ sector: s.key, id: d.id });
  });
});

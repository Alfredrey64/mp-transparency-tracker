import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

// The live site's security headers live in vercel.json, so no test run against a local server sees them. This holds the two halves of the Embed feature to each other:
// the page that shows the preview must be allowed to frame the site's own embed page, and the embed page must be allowed to sit on other people's websites.
const { headers } = JSON.parse(readFileSync(new URL("../vercel.json", import.meta.url), "utf8"));
const csp = (source) => {
  const rule = headers.find((h) => h.source === source);
  return Object.fromEntries(rule.headers.find((h) => h.key === "Content-Security-Policy").value.split(";").map((d) => d.trim().split(/\s+(.*)/s)));
};

describe("the Embed feature under the site's security headers", () => {
  it("lets every ordinary page frame the site's own embed page for the preview, and nothing else", () => {
    expect(csp("/((?!embed).*)")["frame-src"]).toBe("'self'");
  });
  it("never lets another website frame an ordinary page", () => {
    const rule = headers.find((h) => h.source === "/((?!embed).*)");
    expect(csp("/((?!embed).*)")["frame-ancestors"]).toBe("'none'");
    expect(rule.headers.find((h) => h.key === "X-Frame-Options").value).toBe("DENY");
  });
  it("lets the embed page itself sit on any website, and frame nothing", () => {
    expect(csp("/embed(.html)?")["frame-ancestors"]).toBe("*");
    expect(csp("/embed(.html)?")["frame-src"]).toBe("'none'");
  });
});

import { describe, it, expect } from "vitest";
import { pageName, citeAddress, citations, longDate, problemLink } from "./cite";

describe("citing a page", () => {
  it("takes the site's name off the end of the page title", () => {
    expect(pageName("Voting records | Domesday Live")).toBe("Voting records");
    expect(pageName("Domesday Live")).toBe("Domesday Live");
    expect(pageName("Care | Britain in numbers | Domesday Live")).toBe("Care: Britain in numbers");
  });
  it("cites a personal lookup by the page's name only", () => {
    expect(citeAddress({ origin: "https://x.test", pathname: "/myArea/SW1A1AA" })).toBe("https://x.test/myArea");
    expect(citeAddress({ origin: "https://x.test", pathname: "/care/workers" })).toBe("https://x.test/care/workers");
    expect(citeAddress({ origin: "https://x.test", pathname: "/" })).toBe("https://x.test");
  });
  it("builds three styles with the date", () => {
    const now = new Date(2026, 9, 27);
    const [h, a, b] = citations("Care", "https://x.test/care", now);
    expect(longDate(now)).toBe("27 October 2026");
    expect(h.text).toBe("Domesday Live (2026) Care. Available at: https://x.test/care (Accessed: 27 October 2026).");
    expect(a.text).toContain("Retrieved October 27, 2026, from https://x.test/care");
    expect(b.text).toMatch(/^@misc\{domesdaylive2026care,/);
  });
  it("makes a problem link with the page in it", () => {
    const link = problemLink("Care", "https://x.test/care");
    expect(link).toContain("/issues/new?title=Problem%20on%3A%20Care");
    expect(decodeURIComponent(link)).toContain("https://x.test/care");
  });
});

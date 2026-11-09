import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { resolveFile, serve } from "./serve-dist.mjs";

// The speed check serves dist/ the way Vercel does, so a page is sent with its own HTML and an unknown address falls back to the home page's.
describe("serve-dist", () => {
  let dist, server, base;
  beforeAll(async () => {
    dist = fs.mkdtempSync(path.join(os.tmpdir(), "dist-"));
    fs.mkdirSync(path.join(dist, "taxRates"));
    fs.mkdirSync(path.join(dist, "assets"));
    fs.writeFileSync(path.join(dist, "index.html"), "home");
    fs.writeFileSync(path.join(dist, "taxRates", "index.html"), "tax page");
    fs.writeFileSync(path.join(dist, "assets", "a.js"), "console.log(1)");
    server = await serve(0, dist);
    base = `http://localhost:${server.address().port}`;
  });
  afterAll(() => { server.close(); fs.rmSync(dist, { recursive: true, force: true }); });

  it("finds a file, or a folder's index.html, and nothing outside dist", () => {
    expect(resolveFile(dist, "/assets/a.js")).toBe(path.join(dist, "assets", "a.js"));
    expect(resolveFile(dist, "/taxRates")).toBe(path.join(dist, "taxRates", "index.html"));
    expect(resolveFile(dist, "/taxRates/")).toBe(path.join(dist, "taxRates", "index.html"));
    expect(resolveFile(dist, "/mp/jane-doe")).toBeNull();
    expect(resolveFile(dist, "/../../etc/passwd")).toBeNull();
  });
  it("sends a page its own HTML and every other address the home page's, compressed when asked", async () => {
    expect(await (await fetch(`${base}/taxRates`)).text()).toBe("tax page");
    expect(await (await fetch(`${base}/mp/jane-doe`)).text()).toBe("home");
    const res = await fetch(`${base}/assets/a.js`);
    expect(res.headers.get("cache-control")).toMatch(/immutable/);
    expect(res.headers.get("content-type")).toBe("text/javascript");
  });
});

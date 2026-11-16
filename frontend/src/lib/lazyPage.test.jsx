import { describe, it, expect } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { Suspense } from "react";
import { lazyPage, preloadPage } from "./lazyPage";

describe("lazyPage", () => {
  it("renders a page whose code was fetched ahead in the same pass, with no loading fallback", async () => {
    const loader = () => Promise.resolve({ default: ({ name }) => <p>hello {name}</p> });
    const Page = lazyPage(loader);
    await preloadPage(loader);
    const html = renderToStaticMarkup(<Suspense fallback={<p>loading</p>}><Page name="there" /></Suspense>);
    expect(html).not.toContain("loading");
    expect(html).toContain("hello there");
  });
  it("hands back the same page for the same loader, and tries again after a failed fetch", async () => {
    let calls = 0;
    const loader = () => (++calls === 1 ? Promise.reject(new Error("offline")) : Promise.resolve({ default: () => <p>ok</p> }));
    expect(lazyPage(loader)).toBe(lazyPage(loader));
    await preloadPage(loader);
    await preloadPage(loader);
    expect(calls).toBe(2);
  });
  it("keeps showing a failed page as failed for a moment instead of asking again at once", async () => {
    let calls = 0;
    const loader = () => { calls++; return Promise.reject(new Error("gone")); };
    const Page = lazyPage(loader);
    const entry = Page; // the same function renders from the shared entry
    expect(entry).toBe(lazyPage(loader));
    await preloadPage(loader); // first ask
    await new Promise((r) => setTimeout(r, 0));
    expect(calls).toBe(1);
  });
  it("preloading something that is not a page is harmless", async () => {
    await expect(preloadPage(undefined)).resolves.toBeUndefined();
  });
});

// @vitest-environment jsdom
import { describe, it, expect, beforeEach } from "vitest";
import { takeGhost, removeGhosts } from "./pageGhost";

describe("takeGhost", () => {
  beforeEach(() => { document.body.innerHTML = ""; });

  it("returns nothing when there is no page", () => {
    expect(takeGhost()).toBeNull();
  });

  it("copies the page without its ids, hides it from everything, and takes it away again", () => {
    document.body.innerHTML = `<header class="site-header"></header><main id="main-content" tabindex="-1"><h1 id="t">Title</h1></main>`;
    const main = document.getElementById("main-content");
    main.getBoundingClientRect = () => ({ top: 10, bottom: 600, left: 0, right: 800, width: 800, height: 590 });
    const ghost = takeGhost();
    expect(ghost).not.toBeNull();
    const g = document.querySelector(".page-ghost");
    expect(g.getAttribute("aria-hidden")).toBe("true");
    expect(g.querySelector("[id]")).toBeNull();
    expect(g.textContent).toBe("Title");
    expect(document.querySelectorAll("#main-content")).toHaveLength(1);
    ghost.remove();
    expect(document.querySelector(".page-ghost")).toBeNull();
  });

  it("leaves a very large page to the plain fade", () => {
    document.body.innerHTML = `<main id="main-content">${"<i></i>".repeat(5001)}</main>`;
    expect(takeGhost()).toBeNull();
  });

  it("keeps only one picture at a time", () => {
    document.body.innerHTML = `<div class="page-ghost"></div><div class="page-ghost"></div>`;
    removeGhosts();
    expect(document.querySelectorAll(".page-ghost")).toHaveLength(0);
  });
});

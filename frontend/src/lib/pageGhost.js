// A picture of the page you are leaving, laid over the new one while its words fade away, so the old page's words are gone before the new page's words arrive (the two are
// never both on screen) and the background holds still between them. It is a copy of the page's own markup (not a screenshot), placed where the old page was on screen, under the header and everything fixed to
// the screen. Very large pages are not copied (the page then fades out and in instead), and nothing in the copy can be clicked, focused or read out.
const MAX_NODES = 5000;
const FADE_MS = 320;

export function takeGhost(doc = document) {
  removeGhosts(doc);
  const main = doc.getElementById("main-content");
  if (!main || main.getElementsByTagName("*").length > MAX_NODES) return null;
  const view = doc.defaultView;
  const header = doc.querySelector(".site-header");
  const top = Math.max(0, header ? header.getBoundingClientRect().bottom : 0);
  const rect = main.getBoundingClientRect();
  if (rect.bottom <= top || rect.top >= view.innerHeight) return null;

  const copy = main.cloneNode(true);
  copy.removeAttribute("id");
  copy.removeAttribute("tabindex");
  copy.querySelectorAll("[id]").forEach((e) => e.removeAttribute("id"));

  const inner = doc.createElement("div");
  inner.className = "page-ghost-inner";
  inner.style.cssText = `top:${rect.top - top}px;left:${rect.left}px;width:${rect.width}px`;
  inner.appendChild(copy);
  const ghost = doc.createElement("div");
  ghost.className = "page-ghost";
  ghost.setAttribute("aria-hidden", "true");
  ghost.inert = true;
  ghost.style.top = `${top}px`;
  ghost.appendChild(inner);
  doc.body.appendChild(ghost);

  let gone = false;
  const remove = () => { if (!gone) { gone = true; ghost.remove(); } };
  setTimeout(remove, FADE_MS + 600);
  return {
    remove,
    // Fades the words of the picture away over its own steady background (the new page waits, unseen, underneath), then takes it away and calls `done`, which is when the
    // new page starts to fade in.
    fade(done) {
      if (gone) { done?.(); return; }
      const finish = () => { remove(); done?.(); };
      if (!inner.animate) { finish(); return; }
      inner.animate([{ opacity: 1 }, { opacity: 0 }], { duration: FADE_MS, easing: "cubic-bezier(0.4, 0, 1, 1)", fill: "forwards" }).finished.then(finish, finish);
    },
  };
}

export function removeGhosts(doc = document) {
  doc.querySelectorAll(".page-ghost").forEach((g) => g.remove());
}

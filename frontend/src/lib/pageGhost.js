// A picture of the page you are leaving, laid over the new one for a moment while it fades away, so one page dissolves into the next and there is never a blank
// gap between them. It is a copy of the page's own markup (not a screenshot), placed where the old page was on screen, under the header and everything fixed to
// the screen. Very large pages are not copied (the page then fades out and in instead), and nothing in the copy can be clicked, focused or read out.
const MAX_NODES = 5000;
const FADE_MS = 220;

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
    // Fades the picture out over the new page, then takes it away.
    fade() {
      if (gone) return;
      if (!ghost.animate) { remove(); return; }
      ghost.animate([{ opacity: 1 }, { opacity: 0 }], { duration: FADE_MS, easing: "cubic-bezier(0.2, 0.7, 0.2, 1)", fill: "forwards" }).finished.then(remove, remove);
    },
  };
}

export function removeGhosts(doc = document) {
  doc.querySelectorAll(".page-ghost").forEach((g) => g.remove());
}

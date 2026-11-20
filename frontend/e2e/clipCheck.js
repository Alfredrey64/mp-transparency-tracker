// Runs inside the page (pass it to page.evaluate). Finds content that is cut off or pushed off the screen on a phone, which the page-level "does it scroll sideways" check cannot see:
//   - "cut": an element that sticks out past a box that hides overflow (a card with rounded corners and overflow: hidden, say), so the part outside is simply not shown;
//   - "off screen": an element that sticks out past the right or left edge of the screen with nothing around it that scrolls.
// A box the reader can scroll sideways on purpose (a row of tabs or chips, a wide table) is allowed, and so are things that are fixed to the screen, hidden, or drawn inside a graphic.
// It has to be one self-contained function: it is sent to the page as text.
export function findClipped(reportScroll = false) {
  const vw = document.documentElement.clientWidth;
  const name = (el) => `${el.tagName.toLowerCase()}${el.id ? "#" + el.id : ""}${typeof el.className === "string" && el.className.trim() ? "." + el.className.trim().split(/\s+/).slice(0, 3).join(".") : ""}`;
  const found = [];
  const seen = new Set();
  for (const el of document.body.querySelectorAll("*")) {
    if (el.closest("svg") && el.tagName.toLowerCase() !== "svg") continue;
    if (el.closest("[aria-hidden='true'], [hidden], [inert]")) continue;
    const cs = getComputedStyle(el);
    if (cs.display === "none" || cs.visibility === "hidden" || Number(cs.opacity) === 0 || cs.position === "fixed") continue;
    const r = el.getBoundingClientRect();
    if (r.width < 3 || r.height < 3) continue;
    let from = el.parentElement;
    if (cs.position === "absolute") from = el.offsetParent && el.offsetParent !== document.body ? el.offsetParent : null;
    let verdict = null;
    let scrollsInside = false;
    for (let a = from; a && a !== document.documentElement; a = a.parentElement) {
      if (a === document.body) break;
      const s = getComputedStyle(a);
      if (s.display === "none") break;
      if (s.position === "fixed") { scrollsInside = true; break; }
      if (s.overflowX === "visible") continue;
      const ar = a.getBoundingClientRect();
      const over = Math.max(r.right - ar.right, ar.left - r.left);
      if (over > 1.5) {
        if (s.overflowX === "auto" || s.overflowX === "scroll") {
          scrollsInside = true;
          if (reportScroll) { const key = `scroll|${name(a)}`; if (!seen.has(key)) { seen.add(key); found.push({ kind: "scrolls", by: name(a), el: name(el), over: Math.round(over), text: (el.textContent || "").trim().replace(/\s+/g, " ").slice(0, 40) }); } }
          break;
        }
        // A line of text cut off with an ellipsis is the box doing its job.
        if (s.textOverflow === "ellipsis") { scrollsInside = true; break; }
        verdict = { kind: "cut", by: name(a), over: Math.round(over) };
        break;
      }
    }
    if (!verdict && !scrollsInside && (r.right > vw + 1.5 || r.left < -1.5)) verdict = { kind: "off screen", by: "the screen", over: Math.round(Math.max(r.right - vw, -r.left)) };
    if (!verdict) continue;
    const key = `${verdict.kind}|${verdict.by}|${name(el)}`;
    if (seen.has(key)) continue;
    seen.add(key);
    found.push({ ...verdict, el: name(el), text: (el.textContent || "").trim().replace(/\s+/g, " ").slice(0, 40) });
  }
  return found;
}

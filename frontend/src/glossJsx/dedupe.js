// Every mention of a glossary term gets a popover, but underlining all of
// them would be noise: the first mention of each term on the page keeps its
// underline and popover, later ones go back to plain text.
//
// Done against the rendered page rather than during render because "first"
// is a fact about reading order across the whole page, which no single
// component can know — and render has to stay pure. `inert` takes a later
// mention out of hover, tap and keyboard focus; the stylesheet hides its
// underline. Neither touches anything React manages.
export function startGlossDedupe(root) {
  let scheduled = false;

  function run() {
    scheduled = false;
    const seen = new Set();
    for (const el of root.querySelectorAll("[data-gloss-term]")) {
      if (!el.getClientRects().length) continue;
      const term = el.dataset.glossTerm;
      const duplicate = seen.has(term);
      seen.add(term);
      if (el.inert !== duplicate) el.inert = duplicate;
      if (el.hasAttribute("data-gloss-dup") !== duplicate) el.toggleAttribute("data-gloss-dup", duplicate);
    }
  }

  const observer = new MutationObserver(() => {
    if (scheduled) return;
    scheduled = true;
    queueMicrotask(run);
  });
  observer.observe(root, { childList: true, subtree: true });
  run();
  return () => observer.disconnect();
}

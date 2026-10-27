// Keeps rows of boxes tidy at every screen width.
//
// A row of three to eight equal boxes (the tabs at the top of a page, a set of figures, a short list of cards) is laid out by the browser to fit
// as many across as it can, which leaves a single box on its own in the last row (4 and 1, 3 and 2 pushed left, 2 and 1). This looks at every such
// row after it is drawn and, where the last row would be short, lays it out again so that:
//   - if every box fits in one row at a sensible width, they all go in one row;
//   - otherwise they go in the fewest rows that keep each box a sensible width, split as evenly as possible (5 becomes 3 and 2, 7 becomes 4 and 3);
//   - a short last row is centred under the rows above, so it looks deliberate rather than like a box is missing;
//   - on a narrow screen with two boxes to a row, a lone last box runs the full width.
// It never makes the boxes much narrower than the page's own layout chose, and tries the next layout if anything would overflow its box. A page can opt a
// row out with data-no-balance. It runs before the screen is painted, so nothing is seen to jump. See .bal-grid in index.css.

const MIN_KIDS = 3;
const MAX_KIDS = 8;
const SHRINK = 0.6; // a box may become this fraction as wide as the page's own layout made it, no narrower
const FLOOR = 130; // and never below this many pixels

// The ways to lay out n equal boxes in a row of width `width` with `gap` between them, when the page's own layout gives each box `natural` pixels
// and leaves a short last row. Best first: the fewest rows, split as evenly as possible. Each is { columns, lastCount, fullLast }.
export function planOptions(n, width, gap, natural) {
  const naturalColumns = Math.max(1, Math.floor((width + gap) / (natural + gap)));
  if (naturalColumns >= n) return [];
  const need = Math.max(FLOOR, natural * SHRINK);
  const naturalRows = Math.ceil(n / naturalColumns);
  const out = [];
  for (let rows = 1; rows <= naturalRows; rows += 1) {
    const columns = Math.ceil(n / rows);
    if (out.some((o) => o.columns === columns)) continue;
    if ((width - (columns - 1) * gap) / columns < need && columns !== naturalColumns) continue;
    const lastCount = n - Math.floor((n - 1) / columns) * columns;
    out.push({ columns, lastCount, fullLast: columns === 2 && lastCount === 1 });
  }
  return out;
}

const seen = new WeakMap();

function clear(el) {
  el.classList.remove("bal-grid");
  el.style.removeProperty("--bal-c");
  for (const kid of el.children) { kid.removeAttribute("data-bal-start"); kid.removeAttribute("data-bal-full"); kid.style.removeProperty("--bal-start"); }
}

function candidates(root) {
  const out = [];
  for (const el of root.querySelectorAll("*")) {
    const n = el.children.length;
    if (n < MIN_KIDS || n > MAX_KIDS || !(el instanceof HTMLElement) || el.closest("[data-no-balance], svg, .cr, .ma-bento, .lv-board, .hubtabs")) continue;
    out.push(el);
  }
  return out;
}

function process(el) {
  const n = el.children.length;
  const rect = el.getBoundingClientRect();
  const sig = `${Math.round(rect.width)}|${n}`;
  if (seen.get(el) === sig) return;
  seen.set(el, sig);
  clear(el);
  const style = getComputedStyle(el);
  if (style.display === "none" || style.display === "inline" || rect.width < 200) return;
  const kids = [...el.children];
  const rects = kids.map((k) => k.getBoundingClientRect());
  const styles = kids.map((k) => getComputedStyle(k));
  if (!kids.every((k, i) => rects[i].width >= 80 && rects[i].height >= 40 && styles[i].display !== "none" && styles[i].position !== "absolute" && styles[i].position !== "fixed")) return;
  const w0 = rects[0].width;
  if (!rects.every((r) => Math.abs(r.width - w0) < 3)) return;
  const rows = [];
  for (const r of rects) {
    const row = rows.find((x) => Math.abs(x.top - r.top) < 6);
    if (row) row.n += 1; else rows.push({ top: r.top, n: 1 });
  }
  if (rows.length < 2 || rows.at(-1).n >= rows[0].n) return;
  const padding = parseFloat(style.paddingLeft) + parseFloat(style.paddingRight);
  const width = el.clientWidth - padding;
  const gap = parseFloat(style.columnGap) || 0;
  // Boxes in a flex row with margins instead of a gap would be laid out wrongly by a grid, so leave those alone.
  if (!gap && kids.some((_, i) => parseFloat(styles[i].marginLeft) + parseFloat(styles[i].marginRight) > 0)) return;
  // Try each layout, best first, and keep the first that does not make anything overflow its box more than it already did.
  const overflowed = kids.map((k) => k.scrollWidth - k.clientWidth);
  for (const { columns, lastCount, fullLast } of planOptions(n, width, gap, w0)) {
    el.style.setProperty("--bal-c", String(columns));
    el.classList.add("bal-grid");
    const first = kids[n - lastCount];
    first.setAttribute("data-bal-start", "");
    if (fullLast) first.setAttribute("data-bal-full", "");
    else if (lastCount < columns) first.style.setProperty("--bal-start", String(columns - lastCount + 1));
    if (!kids.some((k, i) => k.scrollWidth - k.clientWidth > Math.max(overflowed[i], 0) + 2)) return;
    clear(el);
  }
}

export function balanceBoxes(root = document.getElementById("root")) {
  if (!root) return;
  for (const el of candidates(root)) process(el);
}

export function startBalancingBoxes() {
  if (typeof window === "undefined" || typeof MutationObserver === "undefined") return;
  const root = document.getElementById("root");
  if (!root) return;
  let queued = false;
  const run = () => {
    if (queued) return;
    queued = true;
    requestAnimationFrame(() => { queued = false; balanceBoxes(root); });
  };
  new MutationObserver(run).observe(root, { childList: true, subtree: true });
  window.addEventListener("resize", run);
  run();
}

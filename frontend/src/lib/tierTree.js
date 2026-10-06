// The "who does what" diagram as a branching tree: each tier hangs off the tier
// it answers to, indented under it, with an elbow branch running down the left
// and a trunk of votes running up the right. This file works out where
// everything goes (in pixels) and the paths the branches and the travelling
// bead follow. It is pure geometry so the layout can be tested.

// Parent of each tier, per nation, listed in reading order (top to bottom).
const TREES = {
  england: [["parliament", null], ["government", "parliament"], ["combined", "government"], ["council", "government"], ["parish", "council"]],
  scotland: [["parliament", null], ["government", "parliament"], ["devolved", "parliament"], ["council", "devolved"], ["parish", "council"]],
  wales: [["parliament", null], ["government", "parliament"], ["devolved", "parliament"], ["council", "devolved"], ["parish", "council"]],
  ni: [["parliament", null], ["government", "parliament"], ["devolved", "parliament"], ["council", "devolved"]],
};

export function treeFor(nation) {
  const rows = TREES[nation] ?? TREES.england;
  const depth = {};
  const list = rows.map(([key, parent], index) => {
    depth[key] = parent ? depth[parent] + 1 : 0;
    return { key, parent, depth: depth[key], index };
  });
  list.push({ key: "you", parent: null, depth: 0, index: list.length, isYou: true });
  return list;
}

// Sizes shrink with the width the diagram has to work with.
export function metrics(width) {
  if (width < 430) return { row: 64, gap: 30, indent: 18, trunk: 30, radius: 9, spine: 12 };
  if (width < 600) return { row: 76, gap: 34, indent: 26, trunk: 38, radius: 10, spine: 14 };
  return { row: 96, gap: 40, indent: 34, trunk: 46, radius: 11, spine: 16 };
}

export function buildLayout(nation, width) {
  const m = metrics(width);
  const list = treeFor(nation);
  const nodes = list.map((n) => {
    const top = n.index * (m.row + m.gap);
    const left = n.depth * m.indent;
    const w = Math.max(120, width - m.trunk - left);
    return { ...n, top, left, width: w, height: m.row, right: left + w, bottom: top + m.row, midY: top + m.row / 2, spineX: left + m.spine };
  });
  const byKey = Object.fromEntries(nodes.map((n) => [n.key, n]));
  const height = nodes.length * m.row + (nodes.length - 1) * m.gap;
  const r = m.radius;
  const you = byKey.you;
  const tiers = nodes.filter((n) => !n.isYou);
  const last = tiers[tiers.length - 1];

  // Down: from a tier, along its spine, then right into each child.
  const childPath = (p, c) => `M ${p.spineX} ${p.bottom} V ${c.midY - r} Q ${p.spineX} ${c.midY} ${p.spineX + r} ${c.midY} H ${c.left - 2}`;
  const edges = tiers.filter((n) => n.parent).map((n) => ({ key: n.key, d: childPath(byKey[n.parent], n) }));
  // The last tier hands things on to you.
  edges.push({ key: "you", d: `M ${last.spineX} ${last.bottom} V ${you.top - 1}` });

  // Up: votes leave you on the right, climb the trunk, and branch left into every tier.
  const tx = width - m.trunk / 2;
  const first = tiers[0];
  const trunk = `M ${you.right} ${you.midY} H ${tx - r} Q ${tx} ${you.midY} ${tx} ${you.midY - r} V ${first.midY + r} Q ${tx} ${first.midY} ${tx - r} ${first.midY} H ${first.right + 1}`;
  const stubs = tiers.slice(1).map((n) => ({ key: n.key, d: `M ${tx} ${n.midY} H ${n.right + 1}`, at: 1 - n.midY / height }));

  return { metrics: m, nodes, byKey, height, edges, trunk, stubs, trunkX: tx, width };
}

// The path the bead takes from one tier to the next, or null when there isn't
// a natural one (it then just appears at its destination).
export function routeBetween(layout, fromKey, toKey) {
  const { byKey, metrics: m } = layout;
  const from = byKey[fromKey];
  const to = byKey[toKey];
  if (!from || !to || from.key === to.key) return null;
  const r = m.radius;
  if (to.isYou) return `M ${from.spineX} ${from.bottom} V ${to.top - 1}`;
  if (to.parent === from.key) {
    return `M ${from.spineX} ${from.bottom} V ${to.midY - r} Q ${from.spineX} ${to.midY} ${from.spineX + r} ${to.midY} H ${to.left - 9}`;
  }
  if (to.parent && to.parent === from.parent) {
    const sx = byKey[to.parent].spineX;
    return `M ${from.left} ${from.midY} H ${sx + r} Q ${sx} ${from.midY} ${sx} ${from.midY + r} V ${to.midY - r} Q ${sx} ${to.midY} ${sx + r} ${to.midY} H ${to.left - 9}`;
  }
  return null;
}

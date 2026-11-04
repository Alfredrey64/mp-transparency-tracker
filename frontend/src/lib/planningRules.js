// Planning designations at a point, from the government's planning data service (planning.data.gov.uk), which the browser can call directly.
// England only. The service holds what each council has submitted, so an empty answer means "none on record", never "none".
export const PLANNING_DATASETS = [
  "conservation-area",
  "article-4-direction-area",
  "green-belt",
  "flood-risk-zone",
  "air-quality-management-area",
  "area-of-outstanding-natural-beauty",
  "national-park",
  "tree-preservation-zone",
  "site-of-special-scientific-interest",
  "world-heritage-site",
  "local-planning-authority",
];

// In the order a buyer or neighbour would want to read them.
const RULES = {
  "conservation-area": {
    label: "Conservation area",
    text: "Extra controls protect the area's character. Pulling down most buildings, and cutting or removing trees, usually needs the council's consent first.",
  },
  "article-4-direction-area": {
    label: "Article 4 direction",
    text: "The council has withdrawn some of the usual “permitted development” rights here, so work that normally needs no application (some extensions, or changing how a building is used) may need planning permission.",
  },
  "green-belt": {
    label: "Green belt",
    text: "Building here is tightly limited. Most new development counts as inappropriate unless there are very special circumstances.",
  },
  "area-of-outstanding-natural-beauty": {
    label: "National Landscape",
    text: "Formerly called an Area of Outstanding Natural Beauty. Councils must give great weight to protecting its scenery when they decide planning applications.",
  },
  "national-park": {
    label: "National park",
    text: "The strongest landscape protection. The park authority, not the district council, decides most planning applications here.",
  },
  "world-heritage-site": {
    label: "World Heritage Site",
    text: "Recognised for its outstanding value to humanity. Planning decisions nearby must take care to protect what makes it special.",
  },
  "site-of-special-scientific-interest": {
    label: "Site of Special Scientific Interest",
    text: "Nationally important wildlife or geology. Natural England has to be consulted on developments that could affect it.",
  },
  "tree-preservation-zone": {
    label: "Tree preservation order",
    text: "Some trees here are protected. Cutting, pruning or removing them needs the council's consent.",
  },
  "flood-risk-zone": {
    label: "Flood zone",
    text: null,
  },
  "air-quality-management-area": {
    label: "Air quality management area",
    text: "Air pollution here has gone over legal limits, so the council must have a plan to bring it down. Applications can be asked to show they will not make it worse.",
  },
};

const FLOOD_TEXT = {
  3: "High chance of flooding from rivers or the sea (at least a 1 in 100 chance in any year for rivers). A flood risk assessment is needed with most applications.",
  2: "Medium chance of flooding from rivers or the sea (between a 1 in 1,000 and 1 in 100 chance in any year for rivers). Bigger applications need a flood risk assessment.",
};

// Some councils name an area by a code such as "A4D01"; a code tells a reader nothing.
const readable = (name) => {
  const s = String(name ?? "").trim();
  return s && /\s|[a-z]{4,}/i.test(s) && !/^[A-Z]{1,5}[\s-]?\d+$/i.test(s) ? s : null;
};

// A link that stops at "=" is a template the service holds without its last part.
const usable = (url) => (/^https?:\/\//.test(url ?? "") && !/[=/]$/.test(url) ? url : null);

const unique = (list) => [...new Set(list)];

// Turns the service's list of entities into plain-English notes, ordered as RULES is, plus the councils that decide applications there.
export function shapeRules(entities) {
  const list = Array.isArray(entities) ? entities : [];
  const authorities = unique(list.filter((e) => e.dataset === "local-planning-authority").map((e) => String(e.name ?? "").replace(/\s+LPA$/i, "").trim()).filter(Boolean));

  const items = [];
  for (const [dataset, rule] of Object.entries(RULES)) {
    const found = list.filter((e) => e.dataset === dataset);
    if (found.length === 0) continue;
    if (dataset === "flood-risk-zone") {
      const level = Math.max(...found.map((e) => Number(e["flood-risk-level"]) || 0));
      if (!FLOOD_TEXT[level]) continue;
      items.push({ key: dataset, label: `Flood zone ${level}`, text: FLOOD_TEXT[level], names: [], link: null, date: null });
      continue;
    }
    const withDate = found.map((e) => e["designation-date"]).filter(Boolean).sort();
    items.push({
      key: dataset,
      label: rule.label,
      text: rule.text,
      names: unique(found.map((e) => readable(e.name)).filter(Boolean)),
      link: found.map((e) => usable(e["documentation-url"])).find(Boolean) ?? null,
      date: withDate[0] ?? null,
    });
  }
  return { authorities, items };
}

export async function planningAt(latitude, longitude, { fetcher = fetch } = {}) {
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return null;
  const params = new URLSearchParams({ longitude, latitude, geometry_relation: "intersects", limit: 100 });
  for (const d of PLANNING_DATASETS) params.append("dataset", d);
  params.append("exclude_field", "geometry");
  params.append("exclude_field", "point");
  try {
    const res = await fetcher(`https://www.planning.data.gov.uk/entity.json?${params}`);
    if (!res.ok) return null;
    const json = await res.json();
    return shapeRules(json.entities);
  } catch { return null; }
}

// Links that open a Britain in numbers page at a particular chart, range and setting.
//
// The part after the page name reads  <chart>.<range>.<flags>[.<places>]
//   chart   a series id, or the id of a places chart
//   range   years to show, 0 for everything
//   flags   r = in today's money, g = government shading, i = indexed (places), - = none
//   places  for a places chart, the places ticked, joined with +
// For example  #/housing/hpi-london.10.r  or  #/population/population-nations.0.i.england+wales

export function buildShareParam({ target, range, real, governments, indexed, places }) {
  const flags = `${real ? "r" : ""}${governments ? "g" : ""}${indexed ? "i" : ""}` || "-";
  return [target, String(range), flags, ...(places?.length ? [places.join("+")] : [])].join(".");
}

export function parseShareParam(param) {
  if (!param || typeof param !== "string") return null;
  const [target, rangeText, flags = "-", places] = param.split(".");
  if (!target) return null;
  const range = Number(rangeText);
  return {
    target,
    range: Number.isFinite(range) && range >= 0 && range <= 200 ? range : null,
    real: flags.includes("r"),
    governments: flags.includes("g"),
    indexed: flags.includes("i"),
    places: places ? places.split("+").filter(Boolean) : null,
  };
}

export function shareUrl(view, param) {
  const { origin, pathname } = window.location;
  return `${origin}${pathname}#/${view}/${encodeURIComponent(param)}`;
}

// The small photos of regional office-holders (commissioners, mayors, members of the Senedd, Scottish Parliament and Assembly), saved by fetch-rep-portraits.js in public/portraits/reps/
// and listed in data/repPortraits.json. Pure; also read by the data script so both sides build the same key.

// "pcc:clare-moody": the kind of office plus the name, lower case, no accents, anything else a dash.
export const repKey = (kind, name) => `${kind}:${String(name ?? "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "")}`;

// The photo for a person: { src, credit, licence, source, page } or null. `list` is the `people` object of repPortraits.json. `page` is set only for photos from Wikimedia Commons.
export function repPhoto(list, kind, name) {
  const p = list?.[repKey(kind, name)];
  if (!p) return null;
  return { src: `/portraits/reps/${p.file}`, credit: p.credit, licence: p.licence ?? null, source: p.source, page: p.page ?? null };
}

// The office website for a commissioner or regional mayor, from data/repLinks.json (`links` is its `links` object): { url, office } or null. Only https addresses are ever returned.
export function repSite(links, kind, name) {
  const l = links?.[repKey(kind, name)];
  return l && /^https:\/\//.test(l.url ?? "") ? { url: l.url, office: l.office ?? null } : null;
}

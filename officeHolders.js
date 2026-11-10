// officeHolders.js
//
// Who holds the offices the site names by hand, compared with who holds them according to an official source. The Prime Minister, the Chancellor and the First Ministers of
// Scotland, Wales and Northern Ireland are written into the site's own files (data/governments.js, data/chancellors.js, components/DevolvedAdministrations.jsx), because each
// comes with a story that no feed can write. That means a reshuffle, a resignation or an election changes real life while the site goes on naming the old holder until someone
// notices. check-office-holders.js runs this daily and opens an issue naming the office and the new holder.
//
// Sources: Parliament's Members API for the posts in government; Wikidata's "head of government" for the devolved administrations (Parliament does not cover them).
//
// It has no dependencies, so it can be tested without the network.

// A name reduced to what identifies the person: no titles, accents or punctuation, so "Rt Hon John Healey MP" and "John Healey" are the same.
export function plain(name) {
  return String(name ?? "")
    .normalize("NFD").replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z\s]/g, " ")
    .replace(/\b(rt|hon|mp|mr|mrs|ms|miss|dr|sir|dame|lord|lady|ms|msp|mla|td|mep|the)\b/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export const sameName = (a, b) => plain(a) !== "" && plain(a) === plain(b);

// The people holding a government post right now (no end date), from Parliament's GovernmentPosts reply. A post is found by the start of its name, because Parliament calls the
// Prime Minister's post "Prime Minister and First Lord of the Treasury".
export function postHolders(posts, nameStart) {
  const post = (posts ?? []).map((p) => p.value ?? p).find((p) => String(p.name ?? "").toLowerCase().startsWith(nameStart.toLowerCase()));
  if (!post) return null;
  return (post.postHolders ?? [])
    .filter((h) => !h.endDate)
    .map((h) => h.member?.value?.nameDisplayAs ?? h.member?.nameDisplayAs)
    .filter(Boolean);
}

// The id of the person who is head of government now, from Wikidata's claims for property P6: the one marked preferred, otherwise any without an end date.
export function currentHeadId(claims) {
  const list = claims?.claims?.P6 ?? [];
  const id = (c) => c.mainsnak?.datavalue?.value?.id ?? null;
  const open = list.filter((c) => !c.qualifiers?.P582 && id(c));
  const preferred = open.find((c) => c.rank === "preferred");
  return id(preferred ?? open[open.length - 1] ?? {}) ?? null;
}

// A person's name from a Wikidata item: the title of their English Wikipedia page, else an English label, else the language-neutral one (the Welsh First Minister's item has no
// English label at all).
export function entityName(entity) {
  return entity?.sitelinks?.enwiki?.title ?? entity?.labels?.en?.value ?? entity?.labels?.mul?.value ?? null;
}

// The First Minister the site names for each nation, read from the text of components/DevolvedAdministrations.jsx.
export function devolvedHoldersOnSite(source) {
  const blocks = String(source).split(/\n {2}\{\n {4}name: "/).slice(1);
  const find = (re) => {
    const block = blocks.find((b) => re.test(b.slice(0, 80)));
    return block ? /role: "First Minister[^"]*", name: "([^"]+)"/.exec(block)?.[1] ?? null : null;
  };
  return { scotland: find(/Scottish/), wales: find(/Senedd|Welsh/), northernIreland: find(/Northern Ireland/) };
}

// The Prime Minister the site names: the government with no end date.
export function primeMinisterOnSite(governments) {
  const open = (governments ?? []).filter((g) => !g.to);
  return open.length === 1 ? open[0].pm : null;
}

export const chancellorOnSite = (chancellors) => (chancellors?.length ? chancellors[chancellors.length - 1].name : null);

// Each office where the site and the source disagree: [{ office, site, live }]. A missing value on either side is reported too, because it means the check could not be sure.
export function differences(site, live) {
  const rows = [
    ["Prime Minister", site.primeMinister, live.primeMinister],
    ["Chancellor of the Exchequer", site.chancellor, live.chancellor],
    ["First Minister of Scotland", site.scotland, live.scotland],
    ["First Minister of Wales", site.wales, live.wales],
    ["First Minister of Northern Ireland", site.northernIreland, live.northernIreland],
  ];
  return rows.filter(([, a, b]) => !(Array.isArray(b) ? b.some((n) => sameName(a, n)) && b.length === 1 : sameName(a, b)))
    .map(([office, a, b]) => ({ office, site: a ?? "(not found on the site)", live: Array.isArray(b) ? b.join(" and ") || "(nobody listed)" : b ?? "(not found at the source)" }));
}

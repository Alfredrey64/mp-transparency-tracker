// Searching and describing councillors, over public/data/councillors.json (see scripts/build-councillors.mjs). Pure, so it can be tested.
//
// File shape: { generatedAt, parties: [[short, colour]], councils: [[id, name]], c: [[name, councilIndex, ward, partyIndex, moved]] } with c sorted by name.

const norm = (s) => String(s ?? "").toLowerCase().replace(/['’]/g, "").replace(/&/g, " and ").replace(/[^a-z0-9]+/g, " ").trim();

export function prepare(file) {
  const parties = file.parties.map(([name, colour]) => ({ name, colour: colour || "#8A94A6" }));
  const rows = file.c.map(([name, ci, ward, party, moved], i) => ({
    i, name, council: file.councils[ci][1], councilId: file.councils[ci][0], ward, party, moved: moved === 1,
    key: norm(`${name} ${ward} ${file.councils[ci][1]}`),
  }));
  return { parties, rows, generatedAt: file.generatedAt };
}

// Every word typed must appear somewhere in the name, ward or council. People whose name starts with the first word come first.
export function search(rows, query, { party = null, movedOnly = false } = {}) {
  const words = norm(query).split(" ").filter(Boolean);
  const out = [];
  for (const r of rows) {
    if (party !== null && r.party !== party) continue;
    if (movedOnly && !r.moved) continue;
    if (words.length && !words.every((w) => r.key.includes(w))) continue;
    out.push(r);
  }
  if (words.length) {
    const first = words[0];
    const starts = (r) => (norm(r.name).startsWith(first) ? 0 : 1);
    out.sort((a, b) => starts(a) - starts(b));
  }
  return out;
}

export const councillorPath = (r) => `/councillors/${r.councilId}/${encodeURIComponent(r.ward)}/${encodeURIComponent(r.name)}`;

// "E07000224/Arundel & Walberton/Stephen McAuliffe" -> its three parts, or null.
export function parseParam(param) {
  const [councilId, ward, ...rest] = String(param ?? "").split("/");
  const name = rest.join("/");
  return councilId && ward && name ? { councilId, ward, name } : null;
}

export const partyCounts = (rows, parties) => {
  const n = new Map();
  for (const r of rows) n.set(r.party, (n.get(r.party) ?? 0) + 1);
  return [...n.entries()].map(([idx, count]) => ({ idx, count, ...parties[idx] })).sort((a, b) => b.count - a.count);
};

// Downloads and prepares the list once; later callers get the same promise.
let loading = null;
export function loadCouncillorList() {
  if (!loading) {
    loading = fetch("/data/councillors.json")
      .then((res) => { if (!res.ok) throw new Error(String(res.status)); return res.json(); })
      .then(prepare)
      .catch((err) => { loading = null; throw err; });
  }
  return loading;
}

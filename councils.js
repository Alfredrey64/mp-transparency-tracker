// Turns Open Council Data UK's two free CSVs into the files the Your Council
// page reads: a small index of every council (who runs it, how many seats each
// party holds, when it next votes) and, separately, each council's wards and
// councillors plus its party make-up since 2016. Pure, so the rules can be
// tested against a few made-up rows.
//
// Source: Open Council Data UK (opencouncildata.co.uk), CC BY-SA 4.0.
//   csv2.php?y=<year>      Council, Ward Name, Councillor Name, Next Election, Party Name, party code
//   history2016-26.csv     one row per council per year, with seats by party, who runs it, and its ONS code

// Which of SHARDS files a council's detail goes in, so opening one council
// downloads a small file rather than all of them.
export const SHARDS = 16;
export function shardOf(id) {
  let h = 0;
  for (const ch of String(id)) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return h % SHARDS;
}

// A small CSV reader that copes with quoted fields, commas inside quotes and
// doubled quotes.
export function parseCsv(text) {
  const rows = [];
  let row = [];
  let field = "";
  let quoted = false;
  const src = String(text ?? "").replace(/^﻿/, "");
  for (let i = 0; i < src.length; i++) {
    const ch = src[i];
    if (quoted) {
      if (ch === '"' && src[i + 1] === '"') {
        field += '"';
        i++;
      } else if (ch === '"') quoted = false;
      else field += ch;
    } else if (ch === '"') quoted = true;
    else if (ch === ",") {
      row.push(field);
      field = "";
    } else if (ch === "\n" || ch === "\r") {
      if (ch === "\r" && src[i + 1] === "\n") i++;
      row.push(field);
      if (row.length > 1 || row[0] !== "") rows.push(row);
      row = [];
      field = "";
    } else field += ch;
  }
  if (field !== "" || row.length) {
    row.push(field);
    rows.push(row);
  }
  return rows;
}

// How the parties are shown: a short name and a colour. Parties not listed get
// their own name and a neutral colour picked by name on the page.
const KNOWN = {
  "Labour Party": { short: "Labour", colour: "#d50000" },
  "Conservative and Unionist": { short: "Conservative", colour: "#0063ba" },
  "Liberal Democrats": { short: "Liberal Democrat", colour: "#fc7d0b" },
  "Reform UK": { short: "Reform UK", colour: "#12b6cf" },
  "Green Party (E&W)": { short: "Green", colour: "#78b82a" },
  "Scottish Green Party": { short: "Scottish Green", colour: "#78b82a" },
  "Scottish National Party (SNP)": { short: "SNP", colour: "#d9b900" },
  "Plaid Cymru - The Party of Wales": { short: "Plaid Cymru", colour: "#348837" },
  "Sinn Féin": { short: "Sinn Féin", colour: "#02665f" },
  "Democratic Unionist Party - D.U.P.": { short: "DUP", colour: "#d46a4c" },
  "Alliance - Alliance Party of Northern Ireland": { short: "Alliance", colour: "#cdaf2d" },
  "Ulster Unionist Party": { short: "UUP", colour: "#6ba3d6" },
  "SDLP (Social Democratic & Labour Party)": { short: "SDLP", colour: "#4ea268" },
  "Independent / Other": { short: "Independent or other", colour: "#909090" },
  Vacant: { short: "Vacant", colour: "#3a3d4d" },
};

// What the dataset's short codes in the "who runs it" column stand for.
const TOKENS = {
  LAB: "Labour",
  CON: "Conservative",
  LD: "Liberal Democrat",
  GRN: "Green",
  REF: "Reform UK",
  SNP: "SNP",
  PC: "Plaid Cymru",
  IND: "Independent",
  CIIP: "Canvey Island Independent Party",
  PIP: "The People's Independent Party",
};

// "LAB" -> "Labour majority"; "LAB min" -> "Labour minority"; "LD/GRN" -> a
// partnership; "LAB Mayor" -> "Labour elected mayor"; "NULL"/"NOC" -> no overall control.
export function controlLabel(raw) {
  const text = String(raw ?? "").trim();
  if (!text || text === "NULL" || text === "NOC") return "No overall control";
  const name = (t) => TOKENS[t] ?? t;
  const mayor = /^(.+?)\s+Mayor$/i.exec(text);
  if (mayor) return `${name(mayor[1])} elected mayor`;
  const minority = /^(.+?)\s+min$/i.exec(text);
  const body = (minority ? minority[1] : text).replace(/\s+plurality$/i, "");
  const parts = body.split("/").map((t) => name(t.trim()));
  if (parts.length > 1) return `${parts.join(", ")} (partnership${minority ? ", minority" : ""})`;
  return `${parts[0]} ${minority ? "minority" : /plurality/i.test(text) ? "largest party" : "majority"}`;
}

const HISTORY_COLUMNS = ["total", "con", "lab", "ld", "green", "ukip", "ref", "pc", "snp", "other"];

// Who controls a council, worked out from its seats: the party holding more
// than half of them, or "noc" (no overall control). This doesn't depend on how
// the source labels a council in a given year, so years can be compared.
const CONTROL_KEYS = ["con", "lab", "ld", "green", "ukip", "ref", "pc", "snp", "other"];
export function controlOfRow(row) {
  const total = row.total;
  if (!total) return "noc";
  return CONTROL_KEYS.find((k) => (row[k] ?? 0) * 2 > total) ?? "noc";
}

// councillor key -> party index, for one year's list.
function readCouncillors(csv, partyOf) {
  const [head, ...rows] = parseCsv(csv);
  const col = (name) => head.indexOf(name);
  const C = { council: col("Council"), ward: col("Ward Name"), name: col("Councillor Name"), party: col("Party Name"), code: col("Electoral Commission Party Code") };
  const out = new Map();
  for (const r of rows) {
    if (!r[C.council]) continue;
    out.set(`${r[C.council]}|${r[C.ward]}|${r[C.name]}`, partyOf(r[C.party], r[C.code]));
  }
  return out;
}

export function buildCouncils({ councillorsCsv, historyCsv, previousCsv = null, previousYear = null, now = new Date() }) {
  const parties = [];
  const partyIndex = new Map();
  const partyOf = (name, code) => {
    const key = name || "Independent / Other";
    if (!partyIndex.has(key)) {
      const known = KNOWN[key];
      partyIndex.set(key, parties.length);
      parties.push({ name: key, short: known?.short ?? key, colour: known?.colour ?? null, code: code || null });
    }
    return partyIndex.get(key);
  };

  const councillors = parseCsv(councillorsCsv);
  const [head, ...rows] = councillors;
  const col = (name) => head.indexOf(name);
  const C = { council: col("Council"), ward: col("Ward Name"), name: col("Councillor Name"), next: col("Next Election"), party: col("Party Name"), code: col("Electoral Commission Party Code") };

  const byCouncil = new Map();
  const currentParties = new Map();
  for (const r of rows) {
    const council = r[C.council];
    if (!council) continue;
    if (!byCouncil.has(council)) byCouncil.set(council, { wards: new Map(), next: new Map(), seats: new Map(), total: 0 });
    const c = byCouncil.get(council);
    const p = partyOf(r[C.party], r[C.code]);
    const ward = r[C.ward] || "Unknown ward";
    if (!c.wards.has(ward)) c.wards.set(ward, []);
    c.wards.get(ward).push([r[C.name], p]);
    currentParties.set(`${council}|${ward}|${r[C.name]}`, p);
    if (/^\d{4}-\d{2}-\d{2}$/.test(r[C.next] ?? "")) c.next.set(r[C.next], (c.next.get(r[C.next]) ?? 0) + 1);
    c.seats.set(p, (c.seats.get(p) ?? 0) + 1);
    c.total += 1;
  }

  const [hHead, ...hRows] = parseCsv(historyCsv);
  const hCol = (name) => hHead.indexOf(name);
  const H = { authority: hCol("authority"), year: hCol("year"), majority: hCol("majority") };
  const hIdx = Object.fromEntries(HISTORY_COLUMNS.map((k) => [k, hCol(k)]));
  const codeColumn = hHead.length - 1; // the last column is each council's ONS code
  const history = new Map();
  for (const r of hRows) {
    const name = r[H.authority];
    if (!name || !/^\d{4}$/.test(r[H.year] ?? "")) continue;
    if (!history.has(name)) history.set(name, { id: null, rows: [], control: null, latest: 0 });
    const h = history.get(name);
    h.rows.push([Number(r[H.year]), ...HISTORY_COLUMNS.map((k) => Number(r[hIdx[k]]) || 0)]);
    if (/^[A-Z]\d{8}$/.test(r[codeColumn] ?? "")) h.id = r[codeColumn];
    if (Number(r[H.year]) >= h.latest) {
      h.latest = Number(r[H.year]);
      h.control = r[H.majority];
    }
  }

  // Councillors who changed party since the previous list: the same person, in
  // the same ward of the same council, under a different party.
  const previous = previousCsv ? readCouncillors(previousCsv, partyOf) : null;
  const moved = new Map();
  const flows = new Map();
  const previousSeats = new Map();
  if (previous) {
    for (const p of previous.values()) previousSeats.set(p, (previousSeats.get(p) ?? 0) + 1);
    for (const [key, now_] of currentParties) {
      const before = previous.get(key);
      if (before == null || before === now_) continue;
      const [council, ward, name] = key.split("|");
      if (!moved.has(council)) moved.set(council, []);
      moved.get(council).push([ward, name, before, now_]);
      const f = `${before}>${now_}`;
      flows.set(f, (flows.get(f) ?? 0) + 1);
    }
  }

  // Control of each council in each year, from its seats, for the trend and
  // for "changed hands".
  const trend = new Map();
  const changesByYear = new Map();
  const changesNow = [];
  const control = new Map();
  for (const [name, h] of history) {
    // Only councils that exist today, so each year counts the same set.
    if (!byCouncil.has(name)) continue;
    const rows = h.rows.map((r) => ({ year: r[0], ...Object.fromEntries(HISTORY_COLUMNS.map((k, i) => [k, r[i + 1]])) })).sort((a, b) => a.year - b.year);
    const byYear = rows.map((r) => [r.year, controlOfRow(r)]);
    control.set(name, byYear);
    byYear.forEach(([year, key], i) => {
      if (!trend.has(year)) trend.set(year, {});
      trend.get(year)[key] = (trend.get(year)[key] ?? 0) + 1;
      if (i > 0 && byYear[i - 1][0] === year - 1 && byYear[i - 1][1] !== key) changesByYear.set(year, (changesByYear.get(year) ?? 0) + 1);
    });
  }
  const latestYear = Math.max(...[...trend.keys()]);

  const index = [];
  const detail = {};
  for (const [name, c] of [...byCouncil.entries()].sort((a, b) => a[0].localeCompare(b[0]))) {
    const h = history.get(name);
    const id = h?.id ?? name;
    const ctl = control.get(name) ?? [];
    const now2 = ctl.find(([y]) => y === latestYear)?.[1] ?? null;
    const before = ctl.find(([y]) => y === latestYear - 1)?.[1] ?? null;
    if (now2 && before && now2 !== before) changesNow.push({ id, name, from: before, to: now2 });
    index.push({
      id,
      name,
      control_by_seats: now2,
      total: c.total,
      control: controlLabel(h?.control),
      // When its seats next come up, and how many on each date.
      next: [...c.next.entries()].sort((a, b) => a[0].localeCompare(b[0])),
      seats: [...c.seats.entries()].sort((a, b) => b[1] - a[1]),
    });
    detail[id] = {
      moved: (moved.get(name) ?? []).sort((a, b) => a[1].localeCompare(b[1])),
      history: (h?.rows ?? []).sort((a, b) => a[0] - b[0]),
      wards: [...c.wards.entries()].sort((a, b) => a[0].localeCompare(b[0])).map(([ward, list]) => [ward, list.sort((a, b) => a[0].localeCompare(b[0]))]),
    };
  }

  return {
    generatedAt: now.toISOString(),
    source: "Open Council Data UK (opencouncildata.co.uk), CC BY-SA 4.0",
    historyColumns: ["year", ...HISTORY_COLUMNS],
    parties,
    index,
    detail,
    latestYear,
    // How many councils each party (or no one) controlled by seats, year by year.
    trend: [...trend.entries()].sort((a, b) => a[0] - b[0]).map(([year, counts]) => ({ year, ...counts })),
    // How many councils changed control between consecutive years.
    changesByYear: [...changesByYear.entries()].sort((a, b) => a[0] - b[0]).map(([year, count]) => ({ year, count })),
    // The councils whose control changed in the latest year, and how.
    changes: changesNow.sort((a, b) => a.name.localeCompare(b.name)),
    // Councillors who changed party since the previous list.
    defections: previous
      ? {
          since: previousYear,
          total: [...flows.values()].reduce((n, v) => n + v, 0),
          flows: [...flows.entries()].map(([k, count]) => ({ from: Number(k.split(">")[0]), to: Number(k.split(">")[1]), count })).sort((a, b) => b.count - a.count).slice(0, 40),
          byCouncil: [...moved.entries()].map(([name, list]) => ({ name, count: list.length })).sort((a, b) => b.count - a.count).slice(0, 15),
          previousSeats: [...previousSeats.entries()].sort((a, b) => b[1] - a[1]),
        }
      : null,
  };
}

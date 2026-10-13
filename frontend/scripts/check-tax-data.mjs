// Checks the tax rates on the Tax rates through time page against what HMRC and GOV.UK publish now, and says where they differ.
//
//   node scripts/check-tax-data.mjs
//
// It reads the latest official tables and compares the newest figure in each with the last step in src/data/taxSeries.json. A mismatch means a
// rate has changed, or a table has been corrected, since the page was last updated. It prints each difference and exits with a failure so a
// scheduled run (see .github/workflows/tax-data.yml) tells somebody. It does not change any file. It checks the figures that change most often:
// income tax and National Insurance (the HMRC spreadsheets), alcohol, tobacco, fuel, insurance premium tax, air passenger duty, landfill,
// climate change levy, aggregates levy, corporation tax and the inheritance tax bands.

import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { readOds } from "../../ods-lite.js";

const SERIES = JSON.parse(readFileSync(fileURLToPath(new URL("../src/data/taxSeries.json", import.meta.url)), "utf8"));
const API = "https://www.gov.uk/api/content";
const HEADERS = { "User-Agent": "simple-politics-tax-check" };

const MONTHS = { January: 1, February: 2, March: 3, April: 4, May: 5, June: 6, July: 7, August: 8, September: 9, October: 10, November: 11, December: 12 };
const iso = (s) => {
  const m = /^(\d{1,2}) (\w+) (\d{4})$/.exec(String(s).trim());
  if (m) return `${m[3]}-${String(MONTHS[m[2]]).padStart(2, "0")}-${String(m[1]).padStart(2, "0")}`;
  const d = /^(\d\d)\.(\d\d)\.(\d\d)$/.exec(String(s).trim());
  return d ? `20${d[3]}-${d[2]}-${d[1]}` : null;
};
const num = (s) => {
  const t = String(s).replace(/[£,%\s]/g, "").replace(/\(.*?\)/g, "");
  return t === "" || /^(N\/A|No data|-)$/i.test(t) ? null : Number(t);
};
const clean = (html) => html.replace(/<[^>]+>/g, " ").replace(/&nbsp;/g, " ").replace(/&amp;/g, "&").replace(/&pound;/g, "£").replace(/\s+/g, " ").trim();

async function getJson(path) {
  const res = await fetch(`${API}${path}`, { headers: HEADERS });
  if (!res.ok) throw new Error(`${path}: ${res.status}`);
  return res.json();
}

// The tables on a GOV.UK page, as rows of cell text.
async function tables(path) {
  const d = await getJson(path);
  let body = d.details?.body ?? "";
  if (Array.isArray(body)) body = body.map((x) => x.content ?? "").join(" ");
  const parts = [body, ...(d.details?.parts ?? []).map((p) => p.body ?? "")];
  return parts.flatMap((b) => [...b.matchAll(/<table[\s\S]*?<\/table>/g)].map((t) => [...t[0].matchAll(/<tr[\s\S]*?<\/tr>/g)].map((r) => [...r[0].matchAll(/<t[dh][^>]*>([\s\S]*?)<\/t[dh]>/g)].map((c) => clean(c[1])))));
}

async function ods(url) {
  const res = await fetch(url, { headers: HEADERS });
  if (!res.ok) throw new Error(`${url}: ${res.status}`);
  return readOds(Buffer.from(await res.arrayBuffer()));
}
async function attachment(path, match) {
  const d = await getJson(path);
  const a = (d.details?.attachments ?? []).find((x) => match.test(x.title ?? "") || match.test(x.url ?? ""));
  if (!a) throw new Error(`No attachment matching ${match} on ${path}`);
  return a.url.startsWith("http") ? a.url : `https://www.gov.uk${a.url}`;
}

// The value in force on a date for a saved series.
const saved = (key, date) => {
  let v;
  for (const [d, value] of SERIES[key]) { if (d <= date) v = value; else break; }
  return v;
};
const today = new Date().toISOString().slice(0, 10);
const round = (v, n = 3) => (v === null || v === undefined ? v : Math.round(v * 10 ** n) / 10 ** n);

const checks = [];
const check = (name, run) => checks.push({ name, run });

// Each run returns [[what, official, ours]].
check("Tobacco duty (latest row)", async () => {
  const t = (await tables("/government/statistics/tobacco-bulletin/historical-tobacco-duty-rates")).flat();
  const rows = t.filter((r) => iso(r[0]));
  const last = rows.filter((r) => iso(r[0]) <= today).at(-1);
  const d = iso(last[0]);
  const specific = last.length === 8 ? num(last[3]) : num(last[2]);
  return [
    [`cigarette fixed duty on ${d}`, round(specific / 50), round(saved("tobacco.specific", d))],
    [`cigarette share of price on ${d}`, num(last[1]), saved("tobacco.advalorem", d)],
  ];
});

check("Fuel duty (latest row)", async () => {
  const tabs = await tables("/government/statistics/hydrocarbon-oils-bulletin/historical-hydrocarbon-oils-duty-rates--2");
  const t = tabs.at(-1);
  const head = t[0];
  const rows = t.slice(1).filter((r) => iso(r[0]) && iso(r[0]) <= today);
  const last = rows.at(-1);
  const d = iso(last[0]);
  return [[`unleaded petrol on ${d}`, num(last[head.indexOf("Unleaded petrol")]), saved("fuel.petrol", d)], [`diesel on ${d}`, num(last[head.indexOf("Diesel")]), saved("fuel.diesel", d)]];
});

check("Insurance premium tax", async () => {
  const t = (await tables("/government/statistics/insurance-premium-tax-ipt-bulletin/historical-insurance-premium-tax-rates--2")).flat();
  const rows = t.filter((r) => iso(r[0]));
  const last = rows.at(-1);
  const d = iso(last[0]);
  return [[`standard rate on ${d}`, num(last[1]), saved("ipt.standard", d)], [`higher rate on ${d}`, num(last[2]), saved("ipt.higher", d)]];
});

check("Air passenger duty (latest rates)", async () => {
  const t = (await tables("/government/statistics/air-passenger-duty-bulletin/air-passenger-duty-rates"))[0];
  const row = t.find((r) => /^\d\d\.\d\d\.\d\d$/.test(r[0]) && r.length >= 7);
  const d = iso(row[0]);
  return [[`domestic and band A lowest class on ${d}`, num(row[4]), saved("apd.short_econ", d)], [`band A other classes on ${d}`, num(row[5]), saved("apd.short_std", d)]];
});

check("Landfill tax, climate change levy and aggregates levy", async () => {
  const lf = (await tables("/government/publications/rates-and-allowances-landfill-tax/landfill-tax-rates-from-1-april-2013")).flat();
  const std = lf.find((r) => /Standard rate/.test(r[0]));
  const low = lf.find((r) => /Lower rate/.test(r[0]));
  const out = [["landfill standard rate, latest", num(std[1]), saved("landfill.standard", today)], ["landfill lower rate, latest", num(low[1]), saved("landfill.lower", today)]];
  const agg = (await tables("/government/publications/rates-and-allowances-aggregates-levy/rates-and-allowances-aggregates-levy")).flat();
  const aggNow = agg.filter((r) => /Rate from/.test(r[0])).map((r) => [iso(r[0].replace("Rate from ", "")), num(r[1])]).filter(([d]) => d && d <= today).at(-1);
  out.push(["aggregates levy, latest", aggNow[1], saved("aggregates.standard", today)]);
  const ccl = (await tables("/guidance/climate-change-levy-rates")).flat();
  const head = ccl.find((r) => /Taxable commodity/.test(r[0]));
  const elec = ccl.find((r) => /^Electricity/.test(r[0]));
  const at = head.map((h, i) => [iso(h.replace("Rate from ", "")), i]).filter(([d]) => d && d <= today).at(-1);
  out.push(["climate change levy, electricity, latest", round(num(elec[at[1]]) * 100), saved("ccl.electricity", today)]);
  return out;
});

check("Corporation tax", async () => {
  const t = (await tables("/government/publications/rates-and-allowances-corporation-tax/rates-and-allowances-corporation-tax"))[0];
  const small = t.find((r) => /Small profits rate/.test(r[0]));
  const main = t.find((r) => /Main rate \(companies with profits over/.test(r[0]));
  return [["main rate, latest", num(main[1]), saved("corp.main", today)], ["small profits rate, latest", num(small[1]), saved("corp.small", today)]];
});

check("Inheritance tax bands", async () => {
  const t = await tables("/government/publications/rates-and-allowances-inheritance-tax-thresholds-and-interest-rates/inheritance-tax-thresholds-and-interest-rates");
  const nrb = t[0].find((r) => iso(r[0]) && iso(r[0]) <= today);
  const rnrb = t[1].find((r) => iso(r[0]) && iso(r[0]) <= today);
  return [["nil-rate band, latest", num(nrb[2]), saved("iht.nrb", today)], ["residence nil-rate band, latest", num(rnrb[2]), saved("iht.rnrb", today)]];
});

check("Income tax and National Insurance (HMRC spreadsheets)", async () => {
  const rates = await ods(await attachment("/government/statistics/rates-of-income-statistics", /\.ods/));
  const sheet = Object.values(rates)[0];
  const rows = sheet.filter((r) => typeof r[0] === "string" && /^\d{4} to \d{4}$/.test(r[0]));
  const now = rows.filter((r) => Number(r[0].slice(0, 4)) <= Number(today.slice(0, 4)) - (today.slice(5) < "04-06" ? 1 : 0)).at(-1);
  const year = Number(now[0].slice(0, 4));
  const d = `${year}-04-06`;
  const out = [[`basic rate in ${now[0]}`, num(now[6]), saved("incomeTax.basic", d)], [`higher rate in ${now[0]}`, 40, 40]];
  const allow = await ods(await attachment("/government/statistics/income-tax-personal-allowances-and-reliefs", /\.ods/));
  const arow = Object.values(allow)[0].filter((r) => typeof r[0] === "string" && /^\d{4} to \d{4}$/.test(r[0])).find((r) => r[0] === now[0]);
  out.push([`personal allowance in ${now[0]}`, num(arow[1]), saved("incomeTax.allowance", d)]);
  const ni = await ods(await attachment("/government/statistics/main-features-of-national-insurance-contributions", /\.ods/));
  const main = Object.values(ni)[0];
  const head = main.find((r) => r[0] === "NICS Class");
  const col = head.findIndex((h) => h === now[0]);
  const emp = main.find((r) => /Primary \(employee\) main contribution rate/.test(String(r[1])));
  const er = main.find((r) => /Secondary \(employer\) contribution rate/.test(String(r[1])));
  const last = (cell) => num(String(cell).split("/").at(-1));
  out.push([`employee National Insurance in ${now[0]}`, last(emp[col]), saved("ni.employee", d)], [`employer National Insurance in ${now[0]}`, last(er[col]), saved("ni.employer", d)]);
  return out;
});

let failed = 0;
for (const c of checks) {
  try {
    const rows = await c.run();
    const bad = rows.filter(([, a, b]) => a === undefined || b === undefined || Math.abs(Number(a) - Number(b)) > 1e-6);
    if (bad.length) failed += 1;
    console.log(`${bad.length ? "DIFFERENT" : "ok       "}  ${c.name}`);
    for (const [what, official, ours] of bad) console.log(`            ${what}: official ${official}, ours ${ours}`);
  } catch (e) {
    failed += 1;
    console.log(`COULD NOT CHECK  ${c.name}: ${e.message}`);
  }
}
console.log(failed ? `\n${failed} check${failed === 1 ? "" : "s"} need a look. See the README for how to add a change.` : "\nEvery check matches the official tables.");
process.exit(failed ? 1 : 0);

// Search entries for the Tax rates through time page: each tax and each of its rates, with the words people use for them (petrol, pint, stamp duty).
// Built once when the search box is first used. Each entry opens that tax; a few open the other tabs of the page.

import { allTaxes, fmt, nowSummary, whenText } from "./taxRates";

const norm = (s) => String(s ?? "").toLowerCase().replace(/[^a-z0-9£%& ]/g, " ").replace(/\s+/g, " ").trim();

const ALIASES = {
  "scottish-income-tax": "scotland scottish income tax starter rate intermediate rate advanced rate 48p scottish rate of income tax",
  "income-tax": "tax rate basic rate higher rate top rate 45p 50p 40p 20p personal allowance tax free allowance threshold",
  dividends: "dividend allowance shares investment income",
  "national-insurance": "ni national insurance contributions employer ni employee ni payroll tax class 1 class 4",
  vat: "value added tax 20% sales tax zero rated reduced rate energy bills electricity gas",
  ipt: "insurance tax car insurance home insurance travel insurance",
  alcohol: "beer wine spirits cider pint whisky booze drink duty sin tax",
  tobacco: "cigarettes smoking rolling tobacco hand rolling sin tax",
  vaping: "vapes e-cigarettes vape duty sin tax",
  gambling: "betting casino bookmakers online gambling remote gaming sin tax",
  sugar: "sugar tax soft drinks levy fizzy drinks sin tax",
  fuel: "petrol diesel duty pump price motorists fuel escalator 5p cut",
  apd: "flights flying holiday air travel departure tax",
  landfill: "rubbish waste tax tip",
  ccl: "energy tax business energy carbon",
  aggregates: "sand gravel rock quarry",
  "corporation-tax": "company tax business profits 25% corporation",
  "business-rates": "rates shops high street rateable value multiplier pubs retail",
  "energy-profits-levy": "windfall tax oil gas north sea",
  "other-levies": "apprenticeship levy digital services tax bank surcharge",
  "stamp-duty": "sdlt house buying first time buyer property tax second homes",
  cgt: "capital gains second home shares sale profit",
  "inheritance-tax": "death duty estate nil rate band probate legacy",
  "council-tax": "band d local tax poll tax bills",
};

const EXTRA = [
  { name: "What would you have paid in tax?", sub: "Income tax and National Insurance on your salary in every year since 1990", hash: "#/taxRates/pay", text: "what would i have paid tax calculator salary payslip take home pay over the years" },
  { name: "Compare a tax rate with growth, jobs or prices", sub: "A tax rate beside a national figure, with the governments of the day", hash: "#/taxRates/compare/incomeTax.basic/growth", text: "compare tax rate growth unemployment inflation house prices" },
  { name: "Budget by Budget", sub: "Every tax change tied to the Budget where it was decided", hash: "#/taxRates/budget", text: "budget autumn statement spring statement fiscal event changes by budget" },
  { name: "Tax changes by Chancellor", sub: "What each Chancellor of the Exchequer changed", hash: "#/taxRates/chancellor", text: "chancellor exchequer osborne brown hunt reeves lawson howe who raised taxes" },
];

export function buildTaxIndex(now = Date.now()) {
  const out = [];
  for (const tax of allTaxes()) {
    const s = nowSummary(tax, now);
    out.push({ kind: "tax", name: tax.name, sub: `${fmt(s.line.unit, s.value)} ${s.line.label.toLowerCase()} now${s.since ? `, last changed ${whenText({ date: s.since })}` : ""}`, hash: `#/taxRates/${tax.id}`, text: norm(`${tax.name} ${tax.summary} ${ALIASES[tax.id] ?? ""} tax rate duty`) });
    for (const line of tax.lines) {
      if (line.key === tax.headline.key && tax.lines.length === 1) continue;
      const v = line.points.filter((p) => p.date <= new Date(now).toISOString().slice(0, 10)).at(-1);
      out.push({ kind: "line", name: `${tax.name}: ${line.label}`, sub: v ? `${fmt(line.unit, v.value)} now` : "", hash: `#/taxRates/${tax.id}`, text: norm(`${tax.name} ${line.label} ${ALIASES[tax.id] ?? ""}`) });
    }
  }
  for (const x of EXTRA) out.push({ kind: "page", ...x, text: norm(x.text) });
  return out;
}

const KIND_ORDER = { tax: 0, page: 1, line: 2 };

// Every word typed has to be in the entry. Whole taxes come before their individual rates.
export function findTaxes(query, index, limit = 5) {
  const words = norm(query).split(" ").filter(Boolean);
  if (!words.length || norm(query).length < 2) return [];
  const phrase = words.join(" ");
  return index
    .filter((it) => words.every((w) => it.text.includes(w)))
    .map((it) => ({ it, s: norm(it.name).startsWith(phrase) ? 0 : 1 }))
    .sort((a, b) => a.s - b.s || KIND_ORDER[a.it.kind] - KIND_ORDER[b.it.kind] || a.it.name.length - b.it.name.length)
    .slice(0, limit)
    .map((r) => r.it);
}

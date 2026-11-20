// The Your area house price card's figures, read from the table built by housePrices.js (UK House Price Index: HM Land Registry with the ONS, Registers of Scotland and Land & Property
// Services Northern Ireland). Prices are averages of all sales, in pounds, for the council area.

const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
export const monthLabel = (ym) => { const [y, m] = String(ym ?? "").split("-").map(Number); return y && m ? `${MONTHS[m - 1]} ${y}` : ""; };
export const monthOnly = (ym) => MONTHS[Number(String(ym ?? "").split("-")[1]) - 1] ?? "";

const COMPARE = { England: "E92000001", Wales: "W92000004", Scotland: "S92000003", "Northern Ireland": "N92000002" };
const KINDS = [["d", "Detached"], ["s", "Semi-detached"], ["t", "Terraced"], ["f", "Flat or maisonette"]];

export function priceView(data, code, country) {
  const a = data?.areas?.[code];
  if (!a || a.p == null) return null;
  const uk = data.areas.K02000001;
  const nation = data.areas[COMPARE[country]] ?? null;
  const history = (a.h ?? []).map((price, k) => ({ year: data.years[k], price })).filter((p) => p.price != null);
  const first = history[0];
  const sinceFirst = first && first.price > 0 ? (a.p / first.price - 1) * 100 : null;
  return {
    price: a.p, change: a.c, month: data.month, sales: a.s, salesMonth: a.sm,
    kinds: KINDS.map(([k, label]) => ({ key: k, label, price: a.t?.[k] ?? null })).filter((x) => x.price != null),
    history, sinceFirst, sinceYear: first?.year ?? null,
    nation: nation ? { name: nation.n, price: nation.p, change: nation.c } : null,
    uk: uk ? { price: uk.p, change: uk.c } : null,
  };
}

export const pounds = (n) => `£${Math.round(n).toLocaleString("en-GB")}`;

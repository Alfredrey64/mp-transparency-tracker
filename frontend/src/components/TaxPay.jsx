import { useEffect, useState } from "react";
import { COLORS, FONT_BODY, numeric, readable, solid } from "../theme";
import { card, cardTitle, pillStyle } from "../lib/onsStyles";
import { scrollRegion } from "../lib/a11y";
import { GOVERNMENTS } from "../data/governments";
import { FIRST_YEAR, LAST_YEAR, payslip, taxYearLabel } from "../lib/payCalc";
import { loadPriceIndex, priceLabel } from "../lib/priceIndex";
import { bandsBetween, PARTY_COLOURS } from "../lib/governments";
import { PARTY_NAMES } from "../lib/taxRates";
import { yearTicks } from "../lib/onsChart";
import { Reveal } from "./Motion";
import LineChart from "./LineChart";
import Loading from "./Loading";

// Your pay through the years: what a person on a given salary would have paid in income tax and National Insurance under each year's rules since
// 1990. By default the pay is held at the same buying power, so the chart shows what the tax system did, not what inflation did to the salary.

const para = { fontFamily: FONT_BODY, fontSize: 15, lineHeight: 1.65, color: COLORS.inkSoft, margin: "6px 0 0", maxWidth: 780 };
const label = { display: "block", fontFamily: FONT_BODY, fontSize: 13, fontWeight: 700, color: COLORS.ink, marginBottom: 6 };
const PRESETS = [20000, 30000, 50000, 100000];
const money = (v) => `£${Math.round(v).toLocaleString("en-GB")}`;
const pct = (v) => `${v.toFixed(1)}%`;
// The tax year (starting in April) in force on a date.
const taxYearOn = (iso) => {
  const y = Number(iso.slice(0, 4));
  return iso.slice(5) >= "04-06" ? y : y - 1;
};

export default function TaxPay() {
  const [salary, setSalary] = useState(30000);
  const [text, setText] = useState("30000");
  const [real, setReal] = useState(true);
  const [year, setYear] = useState(LAST_YEAR);
  const [index, setIndex] = useState(null);
  const [failed, setFailed] = useState(false);
  const [hover, setHover] = useState(null);
  const [today] = useState(() => new Date().toISOString().slice(0, 10));

  useEffect(() => {
    let alive = true;
    loadPriceIndex().then((i) => { if (alive) setIndex(i); }).catch(() => { if (alive) { setFailed(true); setReal(false); } });
    return () => { alive = false; };
  }, []);

  const adjusted = real && index;
  // The pay in that year's money.
  const nominal = (y) => (adjusted ? salary / (index.factor(`${y}-04-15`) ?? 1) : salary);
  const years = Array.from({ length: LAST_YEAR - FIRST_YEAR + 1 }, (_, i) => FIRST_YEAR + i);
  const slips = years.map((y) => payslip(y, nominal(y)));
  const hoverYear = hover === null ? null : Math.min(LAST_YEAR, Math.max(FIRST_YEAR, Math.floor(hover - 0.27 + 0.5)));
  const shownYear = hoverYear ?? year;
  const slip = slips[shownYear - FIRST_YEAR];
  const pts = (key) => slips.map((s) => ({ x: s.y + 0.27, y: s[key], label: taxYearLabel(s.y) }));
  const lines = [
    { name: "Income tax and National Insurance together", points: pts("totalShare"), color: "#D6455D" },
    { name: "Income tax", points: pts("taxShare"), color: "#0E9AA7" },
    { name: "National Insurance", points: pts("niShare"), color: "#7B5BD6" },
  ];
  const from = FIRST_YEAR;
  const to = LAST_YEAR + 0.9;
  const bands = bandsBetween(from, to, to).map((b) => ({ ...b, color: PARTY_COLOURS[b.party] }));

  const setPay = (v) => { setSalary(v); setText(String(v)); };
  const onText = (e) => {
    setText(e.target.value);
    const v = Number(e.target.value.replace(/[^0-9.]/g, ""));
    if (Number.isFinite(v) && v >= 5000 && v <= 1000000) setSalary(Math.round(v));
  };

  const rows = GOVERNMENTS.filter((g) => !g.to || taxYearOn(g.to) >= FIRST_YEAR).map((g) => {
    const a = Math.max(FIRST_YEAR, taxYearOn(g.from));
    const b = Math.min(LAST_YEAR, taxYearOn(g.to ? new Date(Date.parse(g.to) - 86400000).toISOString().slice(0, 10) : today));
    return { g, a: slips[a - FIRST_YEAR], b: slips[b - FIRST_YEAR] };
  }).filter((r) => r.a && r.b);

  return (
    <div>
      <Reveal as="section" aria-labelledby="h-tax-pay" style={{ ...card, marginTop: 14 }}>
        <h2 id="h-tax-pay" style={cardTitle}>What would you have paid?</h2>
        <p style={para}>Enter a yearly salary and see how much income tax and National Insurance an employee on it would have paid in every tax year since {FIRST_YEAR}, under that year's rates and allowances. It uses the rules for England, Wales and Northern Ireland.</p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 260px), 1fr))", gap: 16, marginTop: 16 }}>
          <div>
            <label htmlFor="tp-pay" style={label}>Yearly pay, before tax</label>
            <input id="tp-pay" inputMode="numeric" value={text} onChange={onText} aria-describedby="tp-pay-help" style={{ fontFamily: FONT_BODY, fontSize: 18, padding: "10px 12px", borderRadius: 12, border: `1px solid ${COLORS.hairline}`, background: COLORS.paper, color: COLORS.ink, width: "100%", boxSizing: "border-box" }} />
            <div id="tp-pay-help" style={{ fontFamily: FONT_BODY, fontSize: 12.5, color: COLORS.inkSoft, marginTop: 4 }}>Between £5,000 and £1,000,000.</div>
            <div role="group" aria-label="Example salaries" style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 8 }}>
              {PRESETS.map((p) => <button key={p} type="button" aria-pressed={salary === p} onClick={() => setPay(p)} style={pillStyle(salary === p)}>{money(p)}</button>)}
            </div>
          </div>
          <div>
            <span style={label}>What the pay means</span>
            <div role="group" aria-label="What the pay means" style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <button type="button" aria-pressed={real} disabled={failed} onClick={() => setReal(true)} style={{ ...pillStyle(real), textAlign: "left", borderRadius: 14 }}>The same buying power each year</button>
              <button type="button" aria-pressed={!real} onClick={() => setReal(false)} style={{ ...pillStyle(!real), textAlign: "left", borderRadius: 14 }}>The same number of pounds each year</button>
            </div>
            <div style={{ fontFamily: FONT_BODY, fontSize: 12.5, color: COLORS.inkSoft, marginTop: 6, lineHeight: 1.45 }}>
              {real ? (index ? `The pay is ${money(salary)} in ${priceLabel(index)} prices, and the same buying power in earlier years (so less in pounds then).` : "Loading prices...") : `The pay is ${money(salary)} every year, as written, with no allowance for rising prices.`}
            </div>
          </div>
        </div>
      </Reveal>

      <Reveal as="section" aria-labelledby="h-tax-pay-chart" style={{ ...card, marginTop: 16 }}>
        <h2 id="h-tax-pay-chart" style={{ ...cardTitle, fontSize: 20 }}>The share of pay that goes in tax</h2>
        {!slips.every(Boolean) || (real && !index && !failed) ? <Loading /> : (
          <>
            <div style={{ marginTop: 10 }}>
              <LineChart
                lines={lines} xTicks={yearTicks(from, to)} yFormat={(v) => `${Math.round(v)}%`} accent="#D6455D" height={250} bands={bands} domainX={[from, to]}
                hoverX={hover} onHoverX={setHover}
                ariaLabel={`Share of ${money(salary)} paid in income tax and National Insurance, ${FIRST_YEAR} to ${LAST_YEAR}. ${taxYearLabel(FIRST_YEAR)}: ${pct(slips[0].totalShare)}. ${taxYearLabel(LAST_YEAR)}: ${pct(slips.at(-1).totalShare)}.`}
              />
            </div>
            <p style={{ fontFamily: FONT_BODY, fontSize: 12.5, color: COLORS.inkSoft, margin: "6px 0 0" }}>Shaded bands show who was in government. Touch or hover on the chart to see a year, or use the slider below.</p>

            <div style={{ marginTop: 18 }}>
              <label htmlFor="tp-year" style={label}>Tax year: <span style={{ ...numeric, color: readable("#D6455D") }}>{taxYearLabel(shownYear)}</span></label>
              <input id="tp-year" type="range" min={FIRST_YEAR} max={LAST_YEAR} step={1} value={shownYear} onChange={(e) => { setHover(null); setYear(Number(e.target.value)); }} style={{ width: "100%", accentColor: "#D6455D" }} />
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 150px), 1fr))", gap: 10, marginTop: 12 }}>
              {[
                ["Pay that year", money(slip.gross), "#2F6DB5", false],
                ["Income tax", money(slip.incomeTax), "#0E9AA7", false],
                ["National Insurance", money(slip.ni), "#7B5BD6", false],
                ["Left after both", money(slip.takeHome), "#D6455D", true],
              ].map(([name, v, c, on]) => (
                <div key={name} style={{ padding: "12px 14px", borderRadius: 15, background: on ? solid(c) : COLORS.paper, border: on ? "none" : `1px solid ${COLORS.hairline}`, borderLeft: on ? "none" : `4px solid ${c}`, color: on ? "#fff" : COLORS.ink }}>
                  <div style={{ ...numeric, fontSize: 24, fontWeight: 600, lineHeight: 1.05 }}>{v}</div>
                  <div style={{ fontFamily: FONT_BODY, fontSize: 13, marginTop: 5, color: on ? "#fff" : COLORS.inkSoft }}>{name}</div>
                </div>
              ))}
            </div>
            <p style={{ ...para, fontSize: 14, marginTop: 10 }}>
              In {taxYearLabel(shownYear)}, {pct(slip.totalShare)} of pay went in income tax ({pct(slip.taxShare)}) and National Insurance ({pct(slip.niShare)}). The tax-free personal allowance was {money(slip.allowance)}.
            </p>
          </>
        )}
        <p style={{ ...para, fontSize: 13, marginTop: 10 }}>
          This is a simple picture: one job, no pension contributions, no other income, under State Pension age, and no benefits or tax credits. It leaves out employers' National Insurance, VAT and every other tax you pay on spending, so it is for comparing years, not for working out a real bill. The rates and allowances come from HMRC's published tables.
        </p>
      </Reveal>

      <Reveal as="section" aria-labelledby="h-tax-pay-gov" style={{ ...card, marginTop: 16 }}>
        <h2 id="h-tax-pay-gov" style={{ ...cardTitle, fontSize: 20 }}>Government by government</h2>
        <p style={para}>The share of {money(salary)} {real ? "(in today's money)" : ""} paid in the first and last tax year of each government. A tax year runs from 6 April, so a government that began in the middle of one is shown from that year.</p>
        {slips.every(Boolean) && (
          <div {...scrollRegion("Pay and tax by government, scrollable")} style={{ overflowX: "auto", marginTop: 10 }}>
            <table style={{ width: "100%", minWidth: 560, borderCollapse: "collapse", fontFamily: FONT_BODY, fontSize: 14 }}>
              <caption style={{ position: "absolute", left: -9999 }}>Share of pay paid in income tax and National Insurance by government</caption>
              <thead>
                <tr style={{ color: COLORS.inkSoft, textAlign: "left", fontSize: 12.5 }}>
                  <th scope="col" style={{ fontWeight: 600, padding: "6px 0" }}>Government</th>
                  <th scope="col" style={{ fontWeight: 600, padding: "6px 0 6px 12px" }}>Income tax</th>
                  <th scope="col" style={{ fontWeight: 600, padding: "6px 0 6px 12px" }}>National Insurance</th>
                  <th scope="col" style={{ fontWeight: 600, padding: "6px 0 6px 12px" }}>Together</th>
                </tr>
              </thead>
              <tbody>
                {rows.map(({ g, a, b }) => {
                  const cell = (k) => (a.y === b.y || Math.abs(a[k] - b[k]) < 0.05 ? pct(b[k]) : `${pct(a[k])} to ${pct(b[k])}`);
                  return (
                    <tr key={g.id} style={{ borderTop: `1px solid ${COLORS.hairline}` }}>
                      <th scope="row" style={{ textAlign: "left", fontWeight: 600, color: COLORS.ink, padding: "9px 0" }}>
                        <span aria-hidden="true" style={{ display: "inline-block", width: 10, height: 10, borderRadius: "50%", background: g.party === "l" ? PARTY_COLOURS.Labour : PARTY_COLOURS.Conservative, marginRight: 8 }} />
                        {g.pm.split(" and ")[0]} <span style={{ color: COLORS.inkSoft, fontWeight: 500, fontSize: 12.5 }}>{PARTY_NAMES[g.party].split(" and ")[0]}, {g.from.slice(0, 4)} to {g.to ? g.to.slice(0, 4) : "now"}</span>
                      </th>
                      <td style={{ ...numeric, padding: "9px 0 9px 12px", color: COLORS.ink }}>{cell("taxShare")}</td>
                      <td style={{ ...numeric, padding: "9px 0 9px 12px", color: COLORS.ink }}>{cell("niShare")}</td>
                      <td style={{ ...numeric, padding: "9px 0 9px 12px", color: COLORS.ink, fontWeight: 700 }}>{cell("totalShare")}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Reveal>
    </div>
  );
}


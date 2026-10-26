import { useState } from "react";
import { COLORS, FONT_BODY, FONT_DISPLAY, PAGE_PADDING, numeric, solid } from "../theme";
import { PageHeader } from "./shared";
import { IconCalculator, IconCoin, IconTaxes } from "./icons";
import { Segmented } from "./DeprivationControls";
import { Reveal } from "./Motion";
import { PageLink } from "./SiteHeader";
import { card, cardTitle } from "../lib/onsStyles";
import { takeHome, TAX_YEAR } from "../lib/takeHome";
import { stampDuty, STANDARD, FIRST_TIME, FIRST_TIME_LIMIT } from "../lib/stampDuty";
import { CATEGORIES, TOTAL_BN } from "../data/publicSpending";
import { taxYearLabel } from "../lib/payCalc";

// Two plain calculators for the money questions people search for: what is left of a salary after tax, and what stamp duty a home costs. Both run in the
// browser and nothing typed in is sent or saved. They use the same published rates as the Taxes pages, and say what they leave out.

const ACCENT = "#1FA97C";
const para = { fontFamily: FONT_BODY, fontSize: 14.5, lineHeight: 1.65, color: COLORS.inkSoft, margin: "6px 0 0", maxWidth: 720 };
const label = { display: "block", fontFamily: FONT_BODY, fontSize: 13, fontWeight: 700, color: COLORS.ink, marginBottom: 6 };
const money = (v) => `£${Math.round(v).toLocaleString("en-GB")}`;
const pounds = (v) => (v < 10 && v > 0 ? `£${v.toFixed(2)}` : money(v));

const TABS = [
  { key: "pay", label: "Take-home pay", blurb: "What is left of a salary after income tax and National Insurance, by the year, month and week.", colour: "#1FA97C" },
  { key: "stamp", label: "Stamp duty", blurb: "The tax on buying a home in England or Northern Ireland, band by band.", colour: "#2E86C1" },
];

function MoneyField({ id, text, onChange, hint }) {
  return (
    <div>
      <label htmlFor={id} style={label}>{hint}</label>
      <div style={{ position: "relative", maxWidth: 260 }}>
        <span aria-hidden="true" style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", fontFamily: FONT_BODY, fontSize: 17, fontWeight: 700, color: COLORS.inkSoft }}>£</span>
        <input
          id={id} inputMode="numeric" autoComplete="off" value={text} onChange={(e) => onChange(e.target.value)}
          style={{ width: "100%", boxSizing: "border-box", minHeight: 48, padding: "0 14px 0 30px", borderRadius: 12, border: `1.5px solid ${COLORS.hairline}`, background: COLORS.paper, color: COLORS.ink, fontFamily: FONT_BODY, fontSize: 18, fontWeight: 700 }}
        />
      </div>
    </div>
  );
}

function Presets({ values, current, onPick, format = money }) {
  return (
    <div role="group" aria-label="Quick picks" style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 10 }}>
      {values.map((v) => (
        <button
          key={v} type="button" aria-pressed={current === v} onClick={() => onPick(v)}
          style={{ minHeight: 36, padding: "0 14px", borderRadius: 999, cursor: "pointer", fontFamily: FONT_BODY, fontSize: 13.5, fontWeight: 700, border: `1px solid ${current === v ? solid(ACCENT) : COLORS.hairline}`, background: current === v ? solid(ACCENT) : "transparent", color: current === v ? "#fff" : COLORS.inkSoft, transition: "background 0.15s, color 0.15s, border-color 0.15s" }}
        >{format(v)}</button>
      ))}
    </div>
  );
}

function Tile({ title, value, sub, colour }) {
  return (
    <div style={{ padding: "14px 16px", borderRadius: 16, background: COLORS.paper, border: `1px solid ${COLORS.hairline}`, boxShadow: `var(--shadow-1), inset 0 4px 0 ${colour}` }}>
      <div style={{ fontFamily: FONT_BODY, fontSize: 13, fontWeight: 700, color: COLORS.inkSoft }}>{title}</div>
      <div style={{ fontFamily: FONT_DISPLAY, fontSize: 30, fontWeight: 700, color: COLORS.ink, margin: "2px 0 0", ...numeric }}>{value}</div>
      {sub && <div style={{ fontFamily: FONT_BODY, fontSize: 12.5, color: COLORS.inkSoft, marginTop: 2 }}>{sub}</div>}
    </div>
  );
}

// ---- Take-home pay ----

const SALARIES = [20000, 30000, 50000, 80000, 120000];

function TakeHomePay({ onNavigate }) {
  const [salary, setSalary] = useState(35000);
  const [text, setText] = useState("35000");
  const [region, setRegion] = useState("england");
  const [pensionPct, setPensionPct] = useState(0);
  const set = (v) => { setSalary(v); setText(String(v)); };
  const onText = (raw) => {
    setText(raw);
    const v = Number(raw.replace(/[^0-9.]/g, ""));
    if (Number.isFinite(v) && v >= 0 && v <= 2000000) setSalary(Math.round(v));
  };
  const t = takeHome(salary, { region, pensionPct });
  const paid = t.incomeTax + t.ni;
  const parts = [
    { key: "home", label: "You keep", value: t.takeHome, colour: ACCENT },
    { key: "tax", label: "Income tax", value: t.incomeTax, colour: "#0E9AA7" },
    { key: "ni", label: "National Insurance", value: t.ni, colour: "#7B5BD6" },
    ...(t.pension > 0 ? [{ key: "pen", label: "Pension", value: t.pension, colour: "#C7871A" }] : []),
  ];
  const spend = [...CATEGORIES].sort((a, b) => b.amountBn - a.amountBn).slice(0, 6);

  return (
    <div>
      <Reveal as="section" aria-labelledby="h-pay" style={{ ...card, marginTop: 14 }}>
        <h2 id="h-pay" style={cardTitle}>What do you take home?</h2>
        <p style={para}>Type a yearly salary before tax. This uses the rules for the {taxYearLabel(TAX_YEAR)} tax year. Nothing you type leaves your device.</p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(300px, 100%), 1fr))", gap: "18px 24px", margin: "18px 0 0" }}>
          <div>
            <MoneyField id="calc-salary" text={text} onChange={onText} hint="Yearly pay before tax" />
            <Presets values={SALARIES} current={salary} onPick={set} />
          </div>
          <div>
            <div style={label}>Where do you live?</div>
            <Segmented label="Where you live" value={region} onChange={setRegion} accent={ACCENT} options={[{ id: "england", label: "England, Wales, NI", short: "Eng, Wales, NI" }, { id: "scotland", label: "Scotland" }]} />
          </div>
          <div>
            <div style={label}>Pension paid out of your pay</div>
            <Segmented label="Pension share of pay" value={pensionPct} onChange={setPensionPct} accent={ACCENT} options={[0, 3, 5, 8].map((n) => ({ id: n, label: n === 0 ? "None" : `${n}%` }))} />
          </div>
        </div>

        <div aria-live="polite" style={{ marginTop: 24 }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(190px, 100%), 1fr))", gap: 12 }}>
            <Tile title="A year" value={money(t.takeHome)} sub={`from ${money(salary)}`} colour={ACCENT} />
            <Tile title="A month" value={money(t.takeHome / 12)} sub={`${money(salary / 12)} before tax`} colour="#0E9AA7" />
            <Tile title="A week" value={money(t.takeHome / 52)} sub={`${money(salary / 52)} before tax`} colour="#7B5BD6" />
          </div>

          <figure style={{ margin: "22px 0 0" }}>
            <figcaption style={{ fontFamily: FONT_BODY, fontSize: 14, fontWeight: 700, color: COLORS.ink }}>Where each £1 of your pay goes</figcaption>
            <div role="img" aria-label={parts.map((p) => `${p.label} ${Math.round((p.value / Math.max(1, salary)) * 100)} pence`).join(", ")} style={{ display: "flex", height: 22, borderRadius: 11, overflow: "hidden", margin: "10px 0 12px", background: COLORS.paper, border: `1px solid ${COLORS.hairline}` }}>
              {parts.map((p) => (
                <span key={p.key} style={{ width: `${(p.value / Math.max(1, salary)) * 100}%`, background: p.colour, transition: "width 0.45s var(--ease-out)" }} />
              ))}
            </div>
            <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "grid", gap: 8 }}>
              {parts.map((p) => (
                <li key={p.key} style={{ display: "grid", gridTemplateColumns: "14px minmax(0, 1fr) auto auto", gap: 10, alignItems: "baseline", fontFamily: FONT_BODY, fontSize: 14.5, color: COLORS.ink }}>
                  <span aria-hidden="true" style={{ width: 12, height: 12, borderRadius: 4, background: p.colour, alignSelf: "center" }} />
                  <span style={{ fontWeight: 600 }}>{p.label}</span>
                  <span style={{ ...numeric, fontWeight: 700 }}>{money(p.value)}</span>
                  <span style={{ ...numeric, color: COLORS.inkSoft, minWidth: 64, textAlign: "right" }}>{Math.round((p.value / Math.max(1, salary)) * 100)}p in the £</span>
                </li>
              ))}
            </ul>
          </figure>
        </div>
        <p style={{ ...para, fontSize: 13, marginTop: 16 }}>
          This leaves out student loan repayments, a tax code other than the standard one, other income, benefits in kind and anything paid by your employer on top.
          Your payslip is the final word. The rates are on <a href="https://www.gov.uk/guidance/rates-and-thresholds-for-employers-2026-to-2027" target="_blank" rel="noreferrer" style={{ color: COLORS.inkSoft }}>GOV.UK</a>.
        </p>
      </Reveal>

      <Reveal as="section" aria-labelledby="h-where" style={{ ...card, marginTop: 20 }}>
        <h2 id="h-where" style={cardTitle}>Where your {money(paid)} of tax goes</h2>
        <p style={para}>
          Taxes go into one pot, so no pound is tied to one service. This shares your income tax and National Insurance out in the same proportions as the government's planned spending of £{TOTAL_BN.toLocaleString("en-GB")}bn in 2025 to 26, to show roughly what a payment like yours is part of.
        </p>
        <ul style={{ listStyle: "none", margin: "16px 0 0", padding: 0, display: "grid", gap: 10 }}>
          {spend.map((c) => (
            <li key={c.key} style={{ display: "grid", gridTemplateColumns: "minmax(0, 150px) minmax(0, 1fr) auto", gap: 12, alignItems: "center", fontFamily: FONT_BODY, fontSize: 14 }}>
              <span style={{ fontWeight: 600, color: COLORS.ink }}>{c.label}</span>
              <span aria-hidden="true" style={{ height: 12, borderRadius: 6, background: COLORS.paper, border: `1px solid ${COLORS.hairline}`, overflow: "hidden" }}>
                <span style={{ display: "block", height: "100%", width: `${(c.amountBn / TOTAL_BN) * 100}%`, background: c.color }} />
              </span>
              <span style={{ ...numeric, color: COLORS.ink, whiteSpace: "nowrap", fontWeight: 700 }}>{pounds((paid * c.amountBn) / TOTAL_BN)}</span>
            </li>
          ))}
        </ul>
        <p style={{ ...para, marginTop: 14 }}>
          See <PageLink to="taxRates" onNavigate={onNavigate} style={{ color: COLORS.inkSoft }}>the Taxes page</PageLink> for every rate since 1945 and who set it.
        </p>
      </Reveal>
    </div>
  );
}

// ---- Stamp duty ----

const PRICES = [250000, 350000, 500000, 750000, 1000000];
const BUYERS = [
  { id: "mover", label: "Buying my main home", short: "Main home" },
  { id: "first", label: "First-time buyer", short: "First-time" },
  { id: "additional", label: "Second home or buy to let", short: "Second home" },
];

function StampDuty() {
  const [price, setPrice] = useState(350000);
  const [text, setText] = useState("350000");
  const [buyer, setBuyer] = useState("mover");
  const [nonResident, setNonResident] = useState(false);
  const set = (v) => { setPrice(v); setText(String(v)); };
  const onText = (raw) => {
    setText(raw);
    const v = Number(raw.replace(/[^0-9.]/g, ""));
    if (Number.isFinite(v) && v >= 0 && v <= 100000000) setPrice(Math.round(v));
  };
  const r = stampDuty(price, { buyer, nonResident });
  const maxRate = Math.max(1, ...r.slices.map((s) => s.rate));
  const bandsShown = buyer === "first" && !r.reliefLost ? FIRST_TIME : STANDARD;

  return (
    <div>
      <Reveal as="section" aria-labelledby="h-sdlt" style={{ ...card, marginTop: 14 }}>
        <h2 id="h-sdlt" style={cardTitle}>How much stamp duty will you pay?</h2>
        <p style={para}>For homes in England and Northern Ireland. Scotland and Wales have their own taxes, so use the links at the foot of this card for them. Nothing you type leaves your device.</p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(260px, 100%), 1fr))", gap: "18px 24px", margin: "18px 0 0" }}>
          <div>
            <MoneyField id="calc-price" text={text} onChange={onText} hint="Price of the home" />
            <Presets values={PRICES} current={price} onPick={set} format={(v) => (v >= 1000000 ? "£1m" : `£${v / 1000}k`)} />
          </div>
          <div>
            <div style={label}>Which describes you?</div>
            <Segmented label="Which describes you" value={buyer} onChange={setBuyer} accent="#2E86C1" options={BUYERS} />
            <label style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 14, fontFamily: FONT_BODY, fontSize: 14, color: COLORS.ink, cursor: "pointer" }}>
              <input type="checkbox" checked={nonResident} onChange={(e) => setNonResident(e.target.checked)} style={{ width: 20, height: 20, accentColor: "#2E86C1" }} />
              I do not live in the UK
            </label>
          </div>
        </div>

        <div aria-live="polite" style={{ marginTop: 24 }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(200px, 100%), 1fr))", gap: 12 }}>
            <Tile title="Stamp duty to pay" value={money(r.total)} sub={r.total === 0 ? "Nothing to pay at this price" : `on a ${money(price)} home`} colour="#2E86C1" />
            <Tile title="Average rate" value={`${r.effective.toFixed(1)}%`} sub="of the price" colour="#1FA97C" />
          </div>
          {buyer === "first" && (
            <p style={{ ...para, marginTop: 12, color: r.reliefLost ? "#B3382E" : COLORS.inkSoft, fontWeight: r.reliefLost ? 700 : 400 }}>
              {r.reliefLost
                ? `First-time buyer relief stops at ${money(FIRST_TIME_LIMIT)}. Above that price you pay the standard rates on the whole price.`
                : `First-time buyer relief applies: nothing on the first ${money(FIRST_TIME[0].upTo)}, then 5% up to ${money(FIRST_TIME_LIMIT)}.`}
            </p>
          )}
          <div role="table" aria-label="Stamp duty by band" style={{ marginTop: 16, display: "grid", gap: 8 }}>
            {bandsShown.map((band, i) => {
              const lower = i === 0 ? 0 : bandsShown[i - 1].upTo;
              const slice = r.slices.find((s) => s.from === lower);
              const rate = slice?.rate ?? band.rate;
              return (
                <div role="row" key={band.upTo} style={{ display: "grid", gridTemplateColumns: "minmax(0, 1fr) 54px 84px", gap: 12, alignItems: "start", opacity: slice ? 1 : 0.45, fontFamily: FONT_BODY, fontSize: 14, color: COLORS.ink }}>
                  <div role="cell">
                    <div style={{ fontWeight: 600 }}>{band.upTo === Infinity ? `Over ${money(lower)}` : `${money(lower)} to ${money(band.upTo)}`}</div>
                    <div aria-hidden="true" style={{ height: 8, borderRadius: 4, marginTop: 5, background: COLORS.paper, border: `1px solid ${COLORS.hairline}`, overflow: "hidden" }}>
                      <span style={{ display: "block", height: "100%", width: `${(rate / Math.max(maxRate, 1)) * 100}%`, background: "#2E86C1", transition: "width 0.4s var(--ease-out)" }} />
                    </div>
                  </div>
                  <div role="cell" style={{ ...numeric, fontWeight: 700, textAlign: "right" }}>{rate}%</div>
                  <div role="cell" style={{ ...numeric, textAlign: "right", fontWeight: 700 }}>{slice ? money(slice.amount) : "£0"}</div>
                </div>
              );
            })}
          </div>
        </div>
        <p style={{ ...para, fontSize: 13, marginTop: 16 }}>
          Each rate is charged only on the slice of the price inside its band. These are the rates in force today, and they can change at a Budget.
          Another home means one you already own besides the one you are buying, and a few cases (such as replacing your main home) are treated differently, so check the rules before you buy.
          See <a href="https://www.gov.uk/stamp-duty-land-tax/residential-property-rates" target="_blank" rel="noreferrer" style={{ color: COLORS.inkSoft }}>GOV.UK</a>,
          and for the other nations <a href="https://revenue.scot/taxes/land-buildings-transaction-tax" target="_blank" rel="noreferrer" style={{ color: COLORS.inkSoft }}>Scotland (LBTT)</a> and <a href="https://www.gov.wales/land-transaction-tax-rates-and-bands" target="_blank" rel="noreferrer" style={{ color: COLORS.inkSoft }}>Wales (LTT)</a>.
        </p>
      </Reveal>
    </div>
  );
}

export default function Calculators({ param, onNavigate }) {
  const initial = TABS.some((t) => t.key === param) ? param : "pay";
  const [tab, setTab] = useState(initial);
  const [seen, setSeen] = useState(param);
  if (param !== seen) {
    setSeen(param);
    if (TABS.some((t) => t.key === param)) setTab(param);
  }
  const go = (key) => { setTab(key); window.history.replaceState(null, "", key === "pay" ? "/calculators" : `/calculators/${key}`); };
  const current = TABS.find((t) => t.key === tab);
  return (
    <div style={{ maxWidth: 1000, margin: "0 auto", padding: PAGE_PADDING }}>
      <PageHeader
        icon={IconCalculator}
        accent={ACCENT}
        kicker="Britain in numbers"
        title="Money calculators"
        subtitle="What is left of your pay after tax, and what stamp duty a home costs, worked out from the official rates. Nothing you type is sent anywhere."
      />
      <div role="tablist" aria-label="Pick a calculator" className="tab-pills">
        {TABS.map((t) => {
          const active = tab === t.key;
          return (
            <button
              key={t.key} role="tab" id={`calc-tab-${t.key}`} aria-selected={active} aria-controls="calc-panel" type="button" onClick={() => go(t.key)}
              style={{ display: "inline-flex", alignItems: "center", gap: 8, minHeight: 44, padding: "9px 18px", borderRadius: 999, cursor: "pointer", fontFamily: FONT_BODY, fontSize: 15, fontWeight: 700, border: `1.5px solid ${active ? solid(t.colour) : COLORS.hairline}`, background: active ? solid(t.colour) : COLORS.paperCard, color: active ? "#fff" : COLORS.ink, boxShadow: active ? `0 8px 18px -12px ${t.colour}` : "none", transition: "background 0.2s, color 0.2s, border-color 0.2s" }}
            >
              {t.key === "pay" ? <IconCoin size={17} /> : <IconTaxes size={17} />}
              {t.label}
            </button>
          );
        })}
      </div>
      <p style={{ fontFamily: FONT_BODY, fontSize: 15, lineHeight: 1.55, color: COLORS.inkSoft, margin: "12px 2px 0", maxWidth: 780 }}>{current.blurb}</p>
      <div key={tab} className="ge-fade" role="tabpanel" id="calc-panel" aria-labelledby={`calc-tab-${tab}`}>
        {tab === "pay" ? <TakeHomePay onNavigate={onNavigate} /> : <StampDuty />}
      </div>
    </div>
  );
}

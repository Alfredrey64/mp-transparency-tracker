import { Suspense, lazy, useRef, useState } from "react";
import { COLORS, FONT_BODY, PAGE_PADDING, solid } from "../theme";
import { PageHeader } from "./shared";
import { IconBudget, IconCabinet, IconCoin, IconCompareTime, IconQuestion, IconTaxes, IconTrend } from "./icons";
import { TAXES } from "../data/taxCatalogue";
import { GOVERNMENTS } from "../data/governments";
import TaxExplorer from "./TaxExplorer";
import TaxOverview from "./TaxOverview";
import TaxByGovernment from "./TaxByGovernment";
import TaxByChancellor from "./TaxByChancellor";
import TaxByBudget from "./TaxByBudget";
import TaxPay from "./TaxPay";
import { chancellorsWithChanges } from "../lib/taxRates";
import { pillStyle } from "../lib/onsStyles";
import { taxShareSpec } from "../lib/taxShare";
import TaxCompare from "./TaxCompare";
import TaxAbout from "./TaxAbout";
import Loading from "./Loading";
import { LOADERS } from "../pageLoaders";

// Taxes: one page with a row of toggles. Overview (rates today, what is coming up, what is collected and spent), where the spending goes, each tax's rate through time, who
// changed them, comparisons, what a salary pays and the sources. The address carries the toggle and what is picked inside it (#/taxRates/vat,
// #/taxRates/government/thatcher). The old Taxes and spending page, #/tax, is the Overview.

const TABS = [
  { key: "overview", label: "Overview", blurb: "The main rates today, what is coming up, and how much the government collects and spends.", icon: IconTaxes, colour: "#4F46E5" },
  { key: "where", label: "Where it goes", blurb: "How the government's spending is split, from health and welfare to defence.", icon: IconBudget, colour: "#C0561F" },
  { key: "taxes", label: "Rates over time", blurb: "Pick a tax and see how its rate has moved since 1945.", icon: IconTrend, colour: "#0E9AA7" },
  { key: "who", label: "Who changed them", blurb: "Every change, by government, by Chancellor or Budget by Budget.", icon: IconCabinet, colour: "#C7871A" },
  { key: "compare", label: "Compare", blurb: "Put a tax rate beside growth, jobs, prices and more.", icon: IconCompareTime, colour: "#D6455D" },
  { key: "pay", label: "What I pay", blurb: "Choose a salary and see the income tax and National Insurance, and where it goes.", icon: IconCoin, colour: "#1FA97C" },
  { key: "about", label: "Sources", blurb: "Where the figures come from, and what is left out.", icon: IconQuestion, colour: "#7A5AF0" },
];

const GovernmentBudget = lazy(LOADERS.budget);

const slug = (name) => name.toLowerCase().replace(/[^a-z]+/g, "-");
const chancellorNames = () => chancellorsWithChanges().map((c) => c.name);

function parse(param) {
  const [first, ...rest] = String(param ?? "").split("/");
  const lastGov = GOVERNMENTS[GOVERNMENTS.length - 1].id;
  if (first === "government") return { tab: "who", mode: "government", item: rest[0] && GOVERNMENTS.some((g) => g.id === rest[0]) ? rest[0] : lastGov };
  if (first === "chancellor") { const names = chancellorNames(); return { tab: "who", mode: "chancellor", item: names.find((n) => slug(n) === rest[0]) ?? names[names.length - 1] }; }
  if (first === "budget") return { tab: "who", mode: "budget", item: null };
  if (first === "overview") return { tab: "overview", item: rest.join("/") || null };
  if (first === "where") return { tab: "where", item: null };
  if (first === "about") return { tab: "about", item: null };
  if (first === "pay") return { tab: "pay", item: null };
  if (first === "compare") return { tab: "compare", item: rest.join("/") || "incomeTax.basic/growth" };
  if (TAXES.some((t) => t.id === first)) return { tab: "taxes", item: first };
  return { tab: "overview", item: null };
}

const hashFor = (nav) => {
  if (nav.tab === "overview") return nav.item ? `#/taxRates/overview/${nav.item}` : "#/taxRates";
  if (nav.tab === "taxes") return `#/taxRates/${nav.item ?? "income-tax"}`;
  if (nav.tab === "who") return nav.mode === "government" ? `#/taxRates/government/${nav.item}` : nav.mode === "chancellor" ? `#/taxRates/chancellor/${slug(nav.item)}` : "#/taxRates/budget";
  if (nav.tab === "compare") return `#/taxRates/compare/${nav.item}`;
  return `#/taxRates/${nav.tab}`;
};

const MODES = [["government", "Government"], ["chancellor", "Chancellor"], ["budget", "Budget by Budget"]];

export default function TaxRates({ param }) {
  const [nav, setNav] = useState(() => parse(param));
  const [seen, setSeen] = useState(param);
  const tabsRef = useRef(null);
  if (param !== seen) {
    setSeen(param);
    setNav(parse(param));
  }

  function go(tab, item = null, mode = null) {
    const lastGov = GOVERNMENTS[GOVERNMENTS.length - 1].id;
    let next;
    if (tab === "who") {
      const m = mode ?? "government";
      const names = chancellorNames();
      next = { tab, mode: m, item: item ?? (m === "government" ? lastGov : m === "chancellor" ? names[names.length - 1] : null) };
    } else {
      next = { tab, item: item ?? (tab === "taxes" ? "income-tax" : tab === "compare" ? "incomeTax.basic/growth" : null) };
    }
    const moved = next.tab !== nav.tab;
    setNav(next);
    window.history.replaceState(null, "", hashFor(next));
    // Switching view from further down the page (for example from a tile on the overview) puts the toggles back at the top.
    if (moved && tabsRef.current && tabsRef.current.getBoundingClientRect().top < 0) tabsRef.current.scrollIntoView({ block: "start" });
  }

  const current = TABS.find((t) => t.key === nav.tab);
  return (
    <div style={{ maxWidth: 1100, margin: "0 auto", padding: PAGE_PADDING }}>
      <PageHeader
        icon={IconTaxes}
        kicker="Britain in numbers"
        title="Taxes"
        subtitle="What the government collects and spends, how each tax rate has changed since 1945, and which government decided each change."
        share={() => taxShareSpec(nav, window.location.href)}
      />
      <div ref={tabsRef} style={{ scrollMarginTop: 12 }}>
        <div role="tablist" aria-label="What to look at" style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          {TABS.map((t) => {
            const active = nav.tab === t.key;
            const Icon = t.icon;
            return (
              <button
                key={t.key} role="tab" id={`tx-tab-${t.key}`} aria-selected={active} aria-controls="tx-panel" type="button"
                onClick={() => go(t.key)}
                style={{ display: "inline-flex", alignItems: "center", gap: 8, minHeight: 44, padding: "9px 16px", borderRadius: 999, cursor: "pointer", fontFamily: FONT_BODY, fontSize: 15, fontWeight: 700, lineHeight: 1.2, border: `1.5px solid ${active ? solid(t.colour) : COLORS.hairline}`, background: active ? solid(t.colour) : COLORS.paperCard, color: active ? "#fff" : COLORS.ink, boxShadow: active ? `0 8px 18px -12px ${t.colour}` : "none", transition: "background 0.2s, color 0.2s, border-color 0.2s" }}
              >
                <Icon size={17} />
                {t.label}
              </button>
            );
          })}
        </div>
        <p style={{ fontFamily: FONT_BODY, fontSize: 15, lineHeight: 1.55, color: COLORS.inkSoft, margin: "12px 2px 0", maxWidth: 780 }}>{current.blurb}</p>
      </div>
      <div key={nav.tab} className="ge-fade" role="tabpanel" id="tx-panel" aria-labelledby={`tx-tab-${nav.tab}`} style={{ fontFamily: FONT_BODY }}>
        {nav.tab === "overview" && <TaxOverview param={nav.item} onPick={(id) => go("taxes", id)} />}
        {nav.tab === "taxes" && <TaxExplorer taxId={nav.item} onPick={(id) => go("taxes", id)} />}
        {nav.tab === "who" && (
          <>
            <div role="group" aria-label="Group the changes by" style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 8 }}>
              {MODES.map(([k, text]) => <button key={k} type="button" aria-pressed={nav.mode === k} onClick={() => go("who", null, k)} style={pillStyle(nav.mode === k)}>{text}</button>)}
            </div>
            {nav.mode === "government" && <TaxByGovernment govId={nav.item} onPick={(id) => go("who", id, "government")} />}
            {nav.mode === "chancellor" && <TaxByChancellor name={nav.item} onPick={(name) => go("who", name, "chancellor")} />}
            {nav.mode === "budget" && <TaxByBudget />}
          </>
        )}
        {nav.tab === "where" && <Suspense fallback={<Loading />}><GovernmentBudget embedded /></Suspense>}
        {nav.tab === "pay" && <TaxPay />}
        {nav.tab === "compare" && <TaxCompare item={nav.item} onChange={(item) => go("compare", item)} />}
        {nav.tab === "about" && <TaxAbout />}
      </div>
    </div>
  );
}

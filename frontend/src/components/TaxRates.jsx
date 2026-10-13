import { useState } from "react";
import { COLORS, FONT_BODY, FONT_DISPLAY, PAGE_PADDING } from "../theme";
import { PageHeader } from "./shared";
import { IconCabinet, IconCoin, IconCompareTime, IconQuestion, IconTaxes, IconTrend } from "./icons";
import { TAXES } from "../data/taxCatalogue";
import { GOVERNMENTS } from "../data/governments";
import TaxExplorer from "./TaxExplorer";
import TaxByGovernment from "./TaxByGovernment";
import TaxByChancellor from "./TaxByChancellor";
import TaxByBudget from "./TaxByBudget";
import TaxPay from "./TaxPay";
import { chancellorsWithChanges } from "../lib/taxRates";
import { pillStyle } from "../lib/onsStyles";
import { taxShareSpec } from "../lib/taxShare";
import TaxCompare from "./TaxCompare";
import TaxAbout from "./TaxAbout";

// Tax rates through time: every main tax rate since 1945 where there is a record, who was in government when each changed, and the main rates
// under each government. The address carries the tab and the item picked (#/taxRates/vat, #/taxRates/government/thatcher).

const TABS = [
  { key: "taxes", label: "By tax", blurb: "How each rate moved", icon: IconTrend, colour: "#0E9AA7" },
  { key: "who", label: "Who set it", blurb: "Government, Chancellor, Budget", icon: IconCabinet, colour: "#C7871A" },
  { key: "compare", label: "Compare", blurb: "A tax beside growth, jobs, prices", icon: IconCompareTime, colour: "#D6455D" },
  { key: "pay", label: "Your pay", blurb: "What you would have paid", icon: IconCoin, colour: "#1FA97C" },
  { key: "about", label: "About the figures", blurb: "Sources and limits", icon: IconQuestion, colour: "#7A5AF0" },
];

const slug = (name) => name.toLowerCase().replace(/[^a-z]+/g, "-");
const chancellorNames = () => chancellorsWithChanges().map((c) => c.name);

function parse(param) {
  const [first, ...rest] = String(param ?? "").split("/");
  const lastGov = GOVERNMENTS[GOVERNMENTS.length - 1].id;
  if (first === "government") return { tab: "who", mode: "government", item: rest[0] && GOVERNMENTS.some((g) => g.id === rest[0]) ? rest[0] : lastGov };
  if (first === "chancellor") { const names = chancellorNames(); return { tab: "who", mode: "chancellor", item: names.find((n) => slug(n) === rest[0]) ?? names[names.length - 1] }; }
  if (first === "budget") return { tab: "who", mode: "budget", item: null };
  if (first === "about") return { tab: "about", item: null };
  if (first === "pay") return { tab: "pay", item: null };
  if (first === "compare") return { tab: "compare", item: rest.join("/") || "incomeTax.basic/growth" };
  return { tab: "taxes", item: TAXES.some((t) => t.id === first) ? first : "income-tax" };
}

const hashFor = (nav) => {
  if (nav.tab === "taxes") return `#/taxRates${nav.item && nav.item !== "income-tax" ? `/${nav.item}` : ""}`;
  if (nav.tab === "who") return nav.mode === "government" ? `#/taxRates/government/${nav.item}` : nav.mode === "chancellor" ? `#/taxRates/chancellor/${slug(nav.item)}` : "#/taxRates/budget";
  if (nav.tab === "compare") return `#/taxRates/compare/${nav.item}`;
  return `#/taxRates/${nav.tab}`;
};

const MODES = [["government", "Government"], ["chancellor", "Chancellor"], ["budget", "Budget by Budget"]];

export default function TaxRates({ param }) {
  const [nav, setNav] = useState(() => parse(param));
  const [seen, setSeen] = useState(param);
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
    setNav(next);
    window.history.replaceState(null, "", hashFor(next));
  }

  return (
    <div style={{ maxWidth: 1000, margin: "0 auto", padding: PAGE_PADDING }}>
      <PageHeader
        icon={IconTaxes}
        kicker="Britain in numbers"
        title="Tax rates through time"
        subtitle="How the main UK tax rates have changed since 1945, from income tax and VAT to business rates, drink, tobacco and gambling duties, and which government decided each change."
        share={() => taxShareSpec(nav, window.location.href)}
      />
      <div role="tablist" aria-label="Tax rates sections" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 128px), 1fr))", gap: 8, margin: "24px 0 6px" }}>
        {TABS.map((t, i) => {
          const active = nav.tab === t.key;
          const Icon = t.icon;
          return (
            <button
              key={t.key} role="tab" id={`tx-tab-${t.key}`} aria-selected={active} aria-controls="tx-panel" type="button" className="ge-tab ge-pop"
              onClick={() => go(t.key)}
              style={{ animationDelay: `${i * 70}ms`, display: "flex", flexDirection: "column", alignItems: "flex-start", gap: 8, textAlign: "left", cursor: "pointer", padding: "12px 13px", borderRadius: 16, border: `1.5px solid ${active ? t.colour : COLORS.hairline}`, background: active ? `color-mix(in srgb, ${t.colour} 13%, ${COLORS.paperCard})` : COLORS.paperCard, boxShadow: active ? `0 10px 24px -14px ${t.colour}` : "none", color: COLORS.ink }}
            >
              <span aria-hidden="true" style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 38, height: 38, borderRadius: 11, flexShrink: 0, background: active ? t.colour : `color-mix(in srgb, ${t.colour} 16%, transparent)`, color: active ? "#fff" : `color-mix(in srgb, ${t.colour} 70%, ${COLORS.ink})`, transition: "background 0.25s, color 0.25s" }}>
                <Icon size={19} />
              </span>
              <span style={{ minWidth: 0 }}>
                <span style={{ display: "block", fontFamily: FONT_DISPLAY, fontSize: 16.5, fontWeight: 700, lineHeight: 1.2 }}>{t.label}</span>
                <span style={{ display: "block", fontFamily: FONT_BODY, fontSize: 12.5, color: COLORS.inkSoft, marginTop: 2 }}>{t.blurb}</span>
              </span>
            </button>
          );
        })}
      </div>
      <div key={nav.tab} className="ge-fade" role="tabpanel" id="tx-panel" aria-labelledby={`tx-tab-${nav.tab}`} style={{ fontFamily: FONT_BODY }}>
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
        {nav.tab === "pay" && <TaxPay />}
        {nav.tab === "compare" && <TaxCompare item={nav.item} onChange={(item) => go("compare", item)} />}
        {nav.tab === "about" && <TaxAbout />}
      </div>
    </div>
  );
}

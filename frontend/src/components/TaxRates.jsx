import { useState } from "react";
import { COLORS, FONT_BODY, FONT_DISPLAY, PAGE_PADDING } from "../theme";
import { PageHeader } from "./shared";
import { IconCabinet, IconQuestion, IconTaxes, IconTrend } from "./icons";
import { TAXES } from "../data/taxCatalogue";
import { GOVERNMENTS } from "../data/governments";
import TaxExplorer from "./TaxExplorer";
import TaxByGovernment from "./TaxByGovernment";
import TaxAbout from "./TaxAbout";

// Tax rates through time: every main tax rate since 1945 where there is a record, who was in government when each changed, and the main rates
// under each government. The address carries the tab and the item picked (#/taxRates/vat, #/taxRates/government/thatcher).

const TABS = [
  { key: "taxes", label: "By tax", blurb: "How each rate moved", icon: IconTrend, colour: "#0E9AA7" },
  { key: "government", label: "By government", blurb: "What each one changed", icon: IconCabinet, colour: "#C7871A" },
  { key: "about", label: "About the figures", blurb: "Sources and limits", icon: IconQuestion, colour: "#7A5AF0" },
];

function parse(param) {
  const [first, ...rest] = String(param ?? "").split("/");
  if (first === "government") return { tab: "government", item: rest[0] && GOVERNMENTS.some((g) => g.id === rest[0]) ? rest[0] : GOVERNMENTS[GOVERNMENTS.length - 1].id };
  if (first === "about") return { tab: "about", item: null };
  return { tab: "taxes", item: TAXES.some((t) => t.id === first) ? first : "income-tax" };
}

const hashFor = (tab, item) => `#/taxRates${tab === "taxes" ? (item && item !== "income-tax" ? `/${item}` : "") : tab === "government" ? `/government/${item}` : `/${tab}`}`;

export default function TaxRates({ param }) {
  const [nav, setNav] = useState(() => parse(param));
  const [seen, setSeen] = useState(param);
  if (param !== seen) {
    setSeen(param);
    setNav(parse(param));
  }

  function go(tab, item = null) {
    const next = { tab, item: item ?? (tab === "taxes" ? "income-tax" : tab === "government" ? GOVERNMENTS[GOVERNMENTS.length - 1].id : null) };
    setNav(next);
    window.history.replaceState(null, "", hashFor(next.tab, next.item));
  }

  return (
    <div style={{ maxWidth: 1000, margin: "0 auto", padding: PAGE_PADDING }}>
      <PageHeader
        icon={IconTaxes}
        kicker="Britain in numbers"
        title="Tax rates through time"
        subtitle="How the main UK tax rates have changed since 1945, from income tax and VAT to business rates, drink, tobacco and gambling duties, and which government decided each change."
      />
      <div role="tablist" aria-label="Tax rates sections" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 170px), 1fr))", gap: 10, margin: "24px 0 6px" }}>
        {TABS.map((t, i) => {
          const active = nav.tab === t.key;
          const Icon = t.icon;
          return (
            <button
              key={t.key} role="tab" id={`tx-tab-${t.key}`} aria-selected={active} aria-controls="tx-panel" type="button" className="ge-tab ge-pop"
              onClick={() => go(t.key)}
              style={{ animationDelay: `${i * 70}ms`, display: "flex", alignItems: "center", gap: 12, textAlign: "left", cursor: "pointer", padding: "13px 16px", borderRadius: 16, border: `1.5px solid ${active ? t.colour : COLORS.hairline}`, background: active ? `color-mix(in srgb, ${t.colour} 13%, ${COLORS.paperCard})` : COLORS.paperCard, boxShadow: active ? `0 10px 24px -14px ${t.colour}` : "none", color: COLORS.ink }}
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
        {nav.tab === "government" && <TaxByGovernment govId={nav.item} onPick={(id) => go("government", id)} />}
        {nav.tab === "about" && <TaxAbout />}
      </div>
    </div>
  );
}

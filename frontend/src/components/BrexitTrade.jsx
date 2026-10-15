import { useState } from "react";
import { pillStyle } from "../lib/onsStyles";
import { BarRows, Caution, Panel, Stats, TrendExplorer } from "./insight";
import { EU_SHARES, SOURCES, TRADE_DEALS, TRADE_Q4_2025 } from "../data/brexit";
import { para, strong } from "../lib/insightStyle";
import { B, EVENT_LINES, EVENT_NOTE, NATIONS, euShare, nationYear, quarterLabel, tradeBn } from "../lib/brexit";

const ACCENT = "#1D4ED8";
const li = { margin: "0 0 8px", paddingLeft: 2 };
const bn = (v) => `£${v.toFixed(1)}bn`;
const OTHER = "#0E9AA7";

// The UK's goods trade since 2010, with the EU and the rest of the world.
function OverTime() {
  const tb = tradeBn();
  const line = (name, color, values) => ({ name, color, years: tb.times, values });
  const share = euShare("exports");
  const shareIn = euShare("imports");
  const base = { offset: 0, labelFn: quarterLabel, breaks: EVENT_LINES, from: 2010, to: 2027 };
  return (
    <Panel
      id="h-bxt-time" accent={ACCENT} title="UK goods trade since 2010"
      lead="Each quarter, in pounds at the prices of the time, seasonally adjusted. Pick exports, imports or the EU's share. Trade in goods only: services are not split by partner in this series."
      sources={[SOURCES.onsTradeSeries]}
    >
      <TrendExplorer
        accent={ACCENT}
        options={[
          { key: "exports", label: "Exports", lines: [line("To the EU", ACCENT, tb.euExports), line("To the rest of the world", OTHER, tb.nonEuExports)], yFormat: (v) => `£${Math.round(v)}bn`, captionFormat: (v) => bn(v), change: "percent", ...base, note: `UK goods exports. They include precious metals, which can swing the figures from quarter to quarter. ${EVENT_NOTE}` },
          { key: "imports", label: "Imports", lines: [line("From the EU", ACCENT, tb.euImports), line("From the rest of the world", OTHER, tb.nonEuImports)], yFormat: (v) => `£${Math.round(v)}bn`, captionFormat: (v) => bn(v), change: "percent", ...base, note: `UK goods imports. ${EVENT_NOTE}` },
          { key: "share", label: "The EU's share", lines: [line("Share of exports going to the EU", ACCENT, share), line("Share of imports from the EU", "#C0561F", shareIn)], yFormat: (v) => `${Math.round(v)}%`, captionFormat: (v) => `${v.toFixed(1)}%`, change: "pp", ...base, note: `The EU's share of what the UK sells and buys in goods. ${EVENT_NOTE}` },
        ]}
      />
      <Caution title="What the lines can and cannot tell you">Pounds at the prices of the time rise with inflation, and 2022 brought a surge in prices, so a rise in pounds is not a rise in the amount of goods. Researchers who find Brexit cut trade compare the UK with similar countries over the same years, which this chart does not do.</Caution>
    </Panel>
  );
}

// Each nation's goods trade since 2021, from HMRC's regional figures.
function ByNation() {
  const [key, setKey] = useState("england");
  const nt = B.nationTrade;
  const t = nt.nations[key];
  const y = nationYear(key);
  const name = NATIONS.find((n) => n.key === key).name;
  const base = { offset: 0, labelFn: quarterLabel, from: 2021, to: 2026, change: "percent", yFormat: (v) => `£${v.toFixed(v < 10 ? 1 : 0)}bn`, captionFormat: bn };
  return (
    <Panel
      id="h-bxt-nation" title="Trade in goods by nation since the deal began"
      lead={`HMRC splits the UK's goods trade by where it starts or ends. Choose a nation to see its exports and imports with the EU and the rest of the world each quarter from the start of 2021, and the latest year (${nt.quarters.at(-4)} to ${nt.quarters.at(-1)}).`}
      sources={[SOURCES.hmrcRegional]}
    >
      <div role="group" aria-label="Nation" style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 14 }}>
        {NATIONS.map((n) => <button key={n.key} type="button" aria-pressed={key === n.key} onClick={() => setKey(n.key)} style={pillStyle(key === n.key)}>{n.name}</button>)}
      </div>
      <Stats
        accent={ACCENT}
        items={[
          { value: bn(y.euExports), label: `${name}'s goods exports to the EU`, note: `${y.euShareExports}% of its goods exports in the latest four quarters`, spark: t.euExports },
          { value: bn(y.nonEuExports), label: "To the rest of the world", note: `${Math.round(100 - y.euShareExports)}% of its goods exports`, spark: t.nonEuExports },
          { value: bn(y.euImports), label: "Goods imports from the EU", note: `${y.euShareImports}% of its goods imports`, spark: t.euImports },
          { value: bn(y.nonEuImports), label: "From the rest of the world", note: `${Math.round(100 - y.euShareImports)}% of its goods imports`, spark: t.nonEuImports },
        ]}
      />
      <div style={{ height: 16 }} />
      <TrendExplorer
        key={key} accent={ACCENT}
        options={[
          { key: "exports", label: "Exports", lines: [{ name: "To the EU", color: ACCENT, years: nt.times, values: t.euExports }, { name: "To the rest of the world", color: OTHER, years: nt.times, values: t.nonEuExports }], ...base, note: `${name}'s goods exports each quarter. 2025 figures are provisional.` },
          { key: "imports", label: "Imports", lines: [{ name: "From the EU", color: ACCENT, years: nt.times, values: t.euImports }, { name: "From the rest of the world", color: OTHER, years: nt.times, values: t.nonEuImports }], ...base, note: `${name}'s goods imports each quarter. 2025 figures are provisional.` },
        ]}
      />
      <p style={para}>
        {key === "ni"
          ? `Northern Ireland is in a different position. Under the Windsor Framework it still follows EU rules for goods, so its trade with the EU has not faced the same new customs checks as trade elsewhere in the UK. It sold ${bn(y.euExports)} of goods to the EU in the latest year against ${bn(y.nonEuExports)} to the rest of the world.`
          : key === "scotland"
            ? `Scotland's goods exports to the EU fell by 12% in 2025, and HMRC says the biggest fall was in oil and gas products (petroleum), which count as goods. Oil and gas prices move these figures a great deal.`
            : `In the latest year ${name} sold ${bn(y.euExports)} of goods to the EU and ${bn(y.nonEuExports)} to the rest of the world, and bought ${bn(y.euImports)} from the EU and ${bn(y.nonEuImports)} from the rest of the world.`}
      </p>
      <Caution title="Where the goods are counted">HMRC assigns trade to the region of the business that declares it, which may not be where the goods were made. English regions are not split here: HMRC publishes them in separate tables, which show the South East as the largest English exporting region (11% of the UK total) and the North East the smallest (4.1%).</Caution>
    </Panel>
  );
}

export default function BrexitTrade() {
  const t = TRADE_Q4_2025;
  const expTotal = t.exportsEu + t.exportsNonEu;
  const impTotal = t.importsEu + t.importsNonEu;
  const sh = (a, b) => Math.round((a / b) * 100);
  const e = EU_SHARES;
  return (
    <div>
      <OverTime />
      <Panel
        id="h-bxt-now" accent={ACCENT} title="Who the UK trades with"
        lead={`UK trade in goods in ${t.period}, in pounds, excluding precious metals. Services are not split between the EU and the rest of the world in the monthly figures.`}
        sources={[SOURCES.onsTrade]}
      >
        <BarRows
          label="UK goods exports and imports by partner" accent={ACCENT} max={85}
          rows={[
            { label: "Exports to the EU", value: t.exportsEu, text: bn(t.exportsEu), note: `${sh(t.exportsEu, expTotal)}% of goods exports` },
            { label: "Exports to the rest of the world", value: t.exportsNonEu, text: bn(t.exportsNonEu), note: `${sh(t.exportsNonEu, expTotal)}% of goods exports`, tone: "#0E9AA7" },
            { label: "Imports from the EU", value: t.importsEu, text: bn(t.importsEu), note: `${sh(t.importsEu, impTotal)}% of goods imports` },
            { label: "Imports from the rest of the world", value: t.importsNonEu, text: bn(t.importsNonEu), note: `${sh(t.importsNonEu, impTotal)}% of goods imports`, tone: "#0E9AA7" },
          ]}
        />
        <p style={para}>The UK buys {bn(t.importsEu - t.exportsEu)} more goods from the EU than it sells to it in a quarter. The EU is still the UK's largest trading partner.</p>
      </Panel>

      <Panel
        id="h-bxt-eu" title="The UK in the EU's trade"
        lead="Seen from the other side, the UK is a smaller share of what the EU buys and sells in goods than it was ten years ago."
        sources={[SOURCES.eurostat]}
      >
        <BarRows
          label="The UK's share of the EU's trade in goods" accent={ACCENT} max={20}
          rows={[
            { label: `Share of EU goods exports going to the UK, ${e.years[0]}`, value: e.uk.exports.from, text: `${e.uk.exports.from}%`, tone: "#9CA3AF" },
            { label: `Share of EU goods exports going to the UK, ${e.years[1]}`, value: e.uk.exports.to, text: `${e.uk.exports.to}%` },
            { label: `Share of EU goods imports coming from the UK, ${e.years[0]}`, value: e.uk.imports.from, text: `${e.uk.imports.from}%`, tone: "#9CA3AF" },
            { label: `Share of EU goods imports coming from the UK, ${e.years[1]}`, value: e.uk.imports.to, text: `${e.uk.imports.to}%` },
          ]}
        />
        <Caution title="Do not read too much into one number">The UK's share is affected by the EU's trade with every other country as well as with the UK, so a falling share does not by itself show how much trade the UK lost. UK in a Changing Europe notes that the overall figures do not show a simple collapse in UK-EU trade compared with trade with the rest of the world, though it argues that is less reassuring than it looks, because fewer firms may now export to the EU.</Caution>
      </Panel>

      <ByNation />
      <Panel
        id="h-bxt-tca" title="What the trade deal changed"
        sources={[SOURCES.ukiceEconomy, SOURCES.obr]}
      >
        <ul style={{ ...para, margin: 0, paddingLeft: 20 }}>
          <li style={li}><strong style={strong}>Tariffs avoided.</strong> The Trade and Cooperation Agreement means no tariffs or quotas on goods that qualify.</li>
          <li style={li}><strong style={strong}>Other barriers returned.</strong> Firms now face customs declarations, rules about where goods come from, product checks and different regulations. UK in a Changing Europe says the deal did not come close to keeping the economic relationship the UK had as a member of the single market.</li>
          <li style={li}><strong style={strong}>Services held up better.</strong> Services have been more resilient overall, but financial, legal and other regulated sectors have lost the automatic right to sell across the EU.</li>
          <li style={li}><strong style={strong}>The official assumption.</strong> The OBR assumes exports and imports will end up about 15% lower than if the UK had stayed in. UK in a Changing Europe summarises the research as finding goods exports about 10% to 15% lower than they would have been.</li>
        </ul>
      </Panel>

      <Panel
        id="h-bxt-deals" title="New trade deals"
        lead="Outside the EU the UK can sign its own trade deals. The government's own assessments say what the main new ones add in the long run."
        sources={[SOURCES.indiaDeal, SOURCES.cptpp, SOURCES.ukiceEconomy]}
      >
        <Stats accent={ACCENT} items={TRADE_DEALS.map((d) => ({ value: d.value, label: d.name, note: d.note }))} />
        <p style={para}>Both are small next to the economy as a whole. UK in a Changing Europe concludes that official estimates suggest new trade deals outside the EU bring small benefits compared with the cost of less trade with the EU. Supporters of the deals answer that they open new markets and set rules for sectors where the UK is strong, and that gains from agreements keep adding up.</p>
      </Panel>
    </div>
  );
}

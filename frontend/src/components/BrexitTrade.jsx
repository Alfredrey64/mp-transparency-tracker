import { BarRows, Caution, Panel, Stats } from "./insight";
import { EU_SHARES, SOURCES, TRADE_DEALS, TRADE_Q4_2025 } from "../data/brexit";
import { para, strong } from "../lib/insightStyle";

const ACCENT = "#1D4ED8";
const li = { margin: "0 0 8px", paddingLeft: 2 };
const bn = (v) => `£${v.toFixed(1)}bn`;

export default function BrexitTrade() {
  const t = TRADE_Q4_2025;
  const expTotal = t.exportsEu + t.exportsNonEu;
  const impTotal = t.importsEu + t.importsNonEu;
  const sh = (a, b) => Math.round((a / b) * 100);
  const e = EU_SHARES;
  return (
    <div>
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

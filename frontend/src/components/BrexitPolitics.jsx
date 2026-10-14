import { COLORS, FONT_BODY, FONT_DISPLAY } from "../theme";
import { Caution, Panel } from "./insight";
import { OPTIONS, SOURCES } from "../data/brexit";
import { para, strong } from "../lib/insightStyle";

const ACCENT = "#1D4ED8";
const li = { margin: "0 0 8px", paddingLeft: 2 };

export default function BrexitPolitics() {
  return (
    <div>
      <Panel
        id="h-bxp-laws" accent={ACCENT} title="Whose laws, whose rules?"
        lead="'Taking back control' was the most repeated argument for leaving. How far it has changed who makes the rules is a separate question from whether it matters."
        sources={[SOURCES.ifgRegulation]}
      >
        <ul style={{ ...para, margin: 0, paddingLeft: 20 }}>
          <li style={li}><strong style={strong}>Parliament decides.</strong> The UK Parliament, not EU institutions, now makes UK law, and the UK is outside the Common Fisheries Policy and the EU's farm and trade rules.</li>
          <li style={li}><strong style={strong}>Less change than promised.</strong> The Institute for Government finds that Brexit has delivered far less difference from EU rules than supporters promised. Plans to let inherited EU laws simply lapse were scaled back because of business concerns about uncertainty and the cost of following two sets of rules. UK in a Changing Europe found only a handful of substantive reforms by July 2024.</li>
          <li style={li}><strong style={strong}>Choosing to follow.</strong> Many firms follow EU rules anyway to keep selling there. UK manufacturers kept to stricter EU limits on arsenic in baby food, and the UK's own product mark, the UKCA, is an optional alternative to the EU's CE mark, with no end date.</li>
          <li style={li}><strong style={strong}>Freedom where it helps.</strong> The Institute for Government sees real room to move faster than the EU in some fields, such as financial technology and life sciences.</li>
          <li style={li}><strong style={strong}>Less say in the rules.</strong> The UK has no seats in EU working groups and no EU agencies, so it has less influence over rules it still has to meet to sell to the EU, and it is squeezed between the EU, the US and China in many sectors.</li>
        </ul>
      </Panel>

      <Panel id="h-bxp-fish" title="Fishing" sources={[SOURCES.commonUnderstanding]} lead="Fishing was small in the economy but large in the argument.">
        <p style={{ ...para, marginTop: 0 }}>Outside the EU the UK sets its own fishing policy. Under the 2025 reset, boats from the UK and the EU keep <strong style={strong}>full reciprocal access to each other's waters until 30 June 2038</strong>, twelve years longer than the arrangement before. Supporters of the deal say it gives certainty and was a fair trade for easier food exports to the EU. Critics say it gives away the control over waters that leaving was meant to win.</p>
      </Panel>

      <Panel id="h-bxp-ni" title="Northern Ireland" sources={[SOURCES.windsor, SOURCES.commonUnderstanding]} lead="Northern Ireland shares a land border with the EU, so it was the hardest part of the leaving deal to settle.">
        <ul style={{ ...para, margin: 0, paddingLeft: 20 }}>
          <li style={li}>The Windsor Framework, agreed on 27 February 2023, replaced the Northern Ireland Protocol. Goods staying in Northern Ireland go through a green lane with fewer checks, and a 'Stormont brake' lets the UK block new EU goods laws that lack support from both communities.</li>
          <li style={li}>Northern Ireland still follows some EU rules on goods. The 2025 Common Understanding says it keeps dual access to both the EU single market and the UK internal market.</li>
          <li style={li}>Supporters say this protects trade across the border and with Great Britain. Critics, including some unionist politicians, say it leaves Northern Ireland treated differently from the rest of the UK.</li>
        </ul>
      </Panel>

      <Panel
        id="h-bxp-next" title="Where could it go from here?"
        lead="UK in a Changing Europe sets out five options for the relationship, each closer to the EU than the last, and says each brings more economic gain than the one before and more trade-offs."
        sources={[SOURCES.ukiceTenYears]}
      >
        <ol style={{ listStyle: "none", margin: 0, padding: 0, display: "grid", gap: 10 }}>
          {OPTIONS.map((o, i) => (
            <li key={o.name} style={{ display: "flex", gap: 12, padding: "12px 16px", borderRadius: 14, background: COLORS.paper, border: `1px solid ${COLORS.hairline}` }}>
              <span aria-hidden="true" style={{ flex: "0 0 auto", width: 28, height: 28, borderRadius: "50%", display: "grid", placeItems: "center", background: ACCENT, color: "#fff", fontFamily: FONT_BODY, fontWeight: 700, fontSize: 14 }}>{i + 1}</span>
              <div>
                <div style={{ fontFamily: FONT_DISPLAY, fontSize: 16, fontWeight: 700, color: COLORS.ink }}>{o.name}</div>
                <p style={{ ...para, marginTop: 2, fontSize: 14.5 }}>{o.text}</p>
              </div>
            </li>
          ))}
        </ol>
        <p style={para}>The same review estimates that the 2025 reset is unlikely to add more than half of 1% to UK GDP over fifteen years. Whether to go further is a political choice that depends on how much weight is put on the economy, on control over laws and borders, and on what the EU will accept. UK in a Changing Europe says the EU is unlikely to offer closer alignment unless the UK government gives up its manifesto red lines.</p>
        <Caution title="Not a forecast">These are options people argue about, not predictions of what will happen.</Caution>
      </Panel>
    </div>
  );
}

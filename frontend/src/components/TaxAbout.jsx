import { COLORS, FONT_BODY, FONT_DISPLAY } from "../theme";
import { card, cardTitle } from "../lib/onsStyles";
import { GROUPS, NOT_COVERED, TAXES } from "../data/taxCatalogue";
import { Reveal } from "./Motion";

// How the figures were put together, what is covered and what is not.

const para = { fontFamily: FONT_BODY, fontSize: 15, lineHeight: 1.65, color: COLORS.inkSoft, margin: "8px 0 0", maxWidth: 780 };
const h3 = { fontFamily: FONT_DISPLAY, fontSize: 17, fontWeight: 700, color: COLORS.ink, margin: "20px 0 0" };

export default function TaxAbout() {
  return (
    <div>
      <Reveal as="section" aria-labelledby="h-tax-how" style={{ ...card, marginTop: 14 }}>
        <h2 id="h-tax-how" style={cardTitle}>How to read this page</h2>
        <h3 style={h3}>What a rate is</h3>
        <p style={para}>Each line is a rate that stays the same until the day it changes, so the charts move in steps. We show the headline rates people usually quote, and for taxes with several rates we show the main ones. Amounts such as allowances and thresholds are shown in pounds and are not adjusted for inflation, so a figure that looks flat has often fallen in real terms.</p>
        <h3 style={h3}>Who set a rate</h3>
        <p style={para}>A change is credited to the government that was in power when the rate was decided, which is usually the Budget before it took effect. Where that differs from the government in power when the rate began, the list says so. A Chancellor is named only when we are sure which one it was. Rates set in an annual Budget are the Chancellor's proposals, passed by Parliament, so each one was also voted through by the House of Commons of the day.</p>
        <h3 style={h3}>In today's money</h3>
        <p style={para}>Where a chart shows pounds or pence, you can switch it to today's money. The figures are adjusted with the Retail Prices Index before 1988 and the Consumer Prices Index since, both from the Office for National Statistics. A figure that stays the same on paper falls in real terms, which is why frozen allowances and duties look so different this way.</p>
        <h3 style={h3}>Your pay</h3>
        <p style={para}>The Your pay tab works out income tax and employee National Insurance for one job on a chosen salary, using each year's published rates and bands. It leaves out pensions, other income, benefits and every tax on spending, so it is for comparing years, not for working out a real bill.</p>
        <h3 style={h3}>What the page does not say</h3>
        <p style={para}>It does not say whether a change was a good idea. A tax change can be a choice made for its own sake, a way to pay for something else, a reaction to a crisis, or a rise that followed from inflation or a decision to freeze a threshold. The number of changes a government made says little about how much it taxed. For that, the Britain in numbers page on taxes and spending shows what the government collected.</p>
        <h3 style={h3}>Where the figures come from</h3>
        <p style={para}>Wherever HMRC publishes a historic table of rates, we use it. Older rates come from Hansard and from the Acts of Parliament. A few recent changes come from the government's own policy papers. Every tax lists its sources at the bottom. Where sources disagreed, we followed the official table and say so in the notes. We have not guessed at any rate we could not find.</p>
      </Reveal>

      <Reveal as="section" aria-labelledby="h-tax-covered" style={{ ...card, marginTop: 18 }}>
        <h2 id="h-tax-covered" style={cardTitle}>What is covered</h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 260px), 1fr))", gap: 16, marginTop: 14 }}>
          {GROUPS.map((g) => (
            <div key={g.key}>
              <div style={{ fontFamily: FONT_DISPLAY, fontSize: 15.5, fontWeight: 700, color: COLORS.ink, display: "flex", alignItems: "center", gap: 8 }}>
                <span aria-hidden="true" style={{ width: 10, height: 10, borderRadius: "50%", background: g.accent }} />{g.label}
              </div>
              <ul style={{ margin: "6px 0 0", paddingLeft: 18, fontFamily: FONT_BODY, fontSize: 14, lineHeight: 1.7, color: COLORS.inkSoft }}>
                {TAXES.filter((t) => t.group === g.key).map((t) => (
                  <li key={t.id}><a href={`#/taxRates/${t.id}`} style={{ color: COLORS.ink, fontWeight: 600 }}>{t.name}</a></li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </Reveal>

      <Reveal as="section" aria-labelledby="h-tax-missing" style={{ ...card, marginTop: 18 }}>
        <h2 id="h-tax-missing" style={cardTitle}>What is left out, and why</h2>
        <dl style={{ margin: "10px 0 0", display: "grid", gap: 12 }}>
          {NOT_COVERED.map(([term, why]) => (
            <div key={term}>
              <dt style={{ fontFamily: FONT_BODY, fontSize: 14.5, fontWeight: 700, color: COLORS.ink }}>{term}</dt>
              <dd style={{ margin: "2px 0 0", fontFamily: FONT_BODY, fontSize: 14.5, lineHeight: 1.6, color: COLORS.inkSoft, maxWidth: 780 }}>{why}</dd>
            </div>
          ))}
        </dl>
      </Reveal>
    </div>
  );
}

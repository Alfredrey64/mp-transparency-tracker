import { COLORS, FONT_BODY, FONT_DISPLAY, numeric, solid } from "../theme";
import { HEADLINES, fmt, getTax, headlineLine, todayIso, valueOn } from "../lib/taxRates";

// The main rates today: one tile for each of the rates people ask about most. Picking one opens that tax's history.

const sectionTitle = { fontFamily: FONT_DISPLAY, fontSize: 19, fontWeight: 700, color: COLORS.ink, margin: 0 };
const TODAY = ["incomeTax.basic", "vat.standard", "corp.main", "ni.employee", "fuel.petrol", "councilTax.bandD"];

export default function TaxToday({ now, onPick }) {
  const iso = todayIso(now);
  return (
    <section aria-labelledby="h-tax-today" style={{ marginTop: 22 }}>
      <h2 id="h-tax-today" style={sectionTitle}>The main rates today</h2>
      <p style={{ fontFamily: FONT_BODY, fontSize: 14.5, lineHeight: 1.55, color: COLORS.inkSoft, margin: "4px 0 0" }}>Pick one to see how it has changed since it began.</p>
      <div className="box-row" style={{ "--n": 3, "--min": "150px", "--gap": "10px", marginTop: 10 }}>
        {TODAY.map((key, i) => {
          const [taxId, , label] = HEADLINES.find(([, k]) => k === key);
          const line = headlineLine(taxId, key);
          const tax = getTax(taxId);
          return (
            <button
              key={key} type="button" onClick={() => onPick(taxId)} className="ge-tab ge-pop"
              style={{ animationDelay: `${i * 60}ms`, textAlign: "left", cursor: "pointer", padding: "13px 15px", borderRadius: 16, border: "none", background: `linear-gradient(145deg, ${solid(tax.group.accent)}, color-mix(in srgb, ${solid(tax.group.accent)} 70%, #000))`, color: "#fff" }}
            >
              <span style={{ ...numeric, display: "block", fontSize: "clamp(26px, 6vw, 32px)", fontWeight: 600, lineHeight: 1, letterSpacing: "-0.02em" }}>{fmt(line.unit, valueOn(line, iso))}</span>
              <span style={{ display: "block", fontFamily: FONT_BODY, fontSize: 12.5, marginTop: 6, lineHeight: 1.3 }}>{label}</span>
            </button>
          );
        })}
      </div>
    </section>
  );
}


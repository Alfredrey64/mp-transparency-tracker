import { COLORS, FONT_BODY, FONT_DISPLAY, numeric, solid } from "../theme";
import { HEADLINES, fmt, getTax, headlineLine, todayIso, valueOn } from "../lib/taxRates";
import { W, H, monthYear, stepShape, lastMove } from "../lib/taxToday";
import "../taxaction.css";

// The main rates today: one tile for each of the rates people ask about most. Each shows the rate now, when it last moved, and a small picture of every rate it has had.
// Picking one opens that tax's history.

const sectionTitle = { fontFamily: FONT_DISPLAY, fontSize: 19, fontWeight: 700, color: COLORS.ink, margin: 0 };
const TODAY = ["incomeTax.basic", "vat.standard", "corp.main", "ni.employee", "fuel.petrol", "councilTax.bandD"];
export default function TaxToday({ now, onPick }) {
  const iso = todayIso(now);
  return (
    <section aria-labelledby="h-tax-today" style={{ marginTop: 22 }}>
      <h2 id="h-tax-today" style={sectionTitle}>The main rates today</h2>
      <p style={{ fontFamily: FONT_BODY, fontSize: 14.5, lineHeight: 1.55, color: COLORS.inkSoft, margin: "8px 0 0" }}>Pick one to see how it has changed since it began.</p>
      <div className="box-row" style={{ "--n": 3, "--min": "150px", "--gap": "12px", marginTop: 12 }}>
        {TODAY.map((key, i) => {
          const [taxId, , label] = HEADLINES.find(([, k]) => k === key);
          const line = headlineLine(taxId, key);
          const tax = getTax(taxId);
          const colour = solid(tax.group.accent);
          const shape = stepShape(line, iso);
          const move = lastMove(line, iso);
          return (
            <button key={key} type="button" onClick={() => onPick(taxId)} className="ge-tab ge-pop txt-tile" style={{ "--tc": colour, animationDelay: `${i * 60}ms` }}>
              <span className="txt-label">{label}</span>
              <span className="txt-fig" style={numeric}>{fmt(line.unit, valueOn(line, iso))}</span>
              {move && <span className="txt-move">{move}</span>}
              {shape && (
                <svg className="txt-line" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" role="img" aria-label={`${label}: every rate since ${monthYear(shape.started)}, as a line that steps up and down`}>
                  <path d={shape.area} className="txt-area" />
                  <path d={shape.line} className="txt-path" vectorEffect="non-scaling-stroke" />
                </svg>
              )}
              <span className="txt-open" aria-hidden="true">See the history</span>
            </button>
          );
        })}
      </div>
    </section>
  );
}

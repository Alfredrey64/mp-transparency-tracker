import { useEffect, useRef, useState } from "react";
import { COLORS, FONT_BODY, FONT_DISPLAY, numeric, solid } from "../theme";
import { getTax, todayIso } from "../lib/taxRates";
import { buildCards } from "../lib/taxInAction";
import { pillStyle } from "../lib/onsStyles";
import "../taxaction.css";

// What the main rates mean in pounds. A rate such as "20%" says little until it is set against an amount, so each card shows one amount as a block of squares: the squares
// that go in tax fill in one after another, and the rest are what you keep. Everything is worked out from the rates the page already holds (lib/taxRates), so when a Budget
// changes a rate the picture changes with it. The squares fill once, when the section first scrolls into view; "Play again" runs them again.

function Card({ card, onPick }) {
  const tax = getTax(card.id);
  const colour = solid(tax.group.accent);
  const cells = Array.from({ length: card.cells }, (_, i) => i);
  return (
    <article className="txa-card" style={{ "--tc": colour }}>
      <header className="txa-head">
        <h3>{card.title}</h3>
        <span className="txa-rate" style={numeric}>{card.rate}</span>
      </header>
      <div className="txa-grid" role="img" aria-label={card.alt} style={{ gridTemplateColumns: `repeat(${card.cols}, 1fr)` }}>
        {cells.map((i) => (
          <i key={i} className={i < card.tax ? "txa-on" : undefined} style={{ "--i": i }} />
        ))}
      </div>
      <p className="txa-legend"><span><b style={{ background: colour }} aria-hidden="true" />{card.take}</span><span>{card.tax < card.cells && <b className="txa-neutral" aria-hidden="true" />}{card.keep}</span></p>
      <p className="txa-line">{card.line}</p>
      <button type="button" className="txa-more" onClick={() => onPick(card.id)}>See how it has changed</button>
    </article>
  );
}

export default function TaxInAction({ now, onPick }) {
  const iso = todayIso(now);
  const [run, setRun] = useState(() => (typeof IntersectionObserver === "undefined" ? 1 : 0)); // 0 = waiting to scroll into view, then counts the plays
  const ref = useRef(null);
  useEffect(() => {
    const el = ref.current;
    if (!el || run > 0) return undefined;
    const io = new IntersectionObserver((entries) => { if (entries.some((e) => e.isIntersecting)) { setRun(1); io.disconnect(); } }, { threshold: 0.25 });
    io.observe(el);
    return () => io.disconnect();
  }, [run]);
  const cards = buildCards(iso);
  return (
    <section ref={ref} aria-labelledby="h-tax-action" style={{ marginTop: 34 }} className="txa" data-run={run > 0 ? "1" : "0"}>
      <div style={{ display: "flex", flexWrap: "wrap", alignItems: "baseline", justifyContent: "space-between", gap: "6px 16px" }}>
        <h2 id="h-tax-action" style={{ fontFamily: FONT_DISPLAY, fontSize: 19, fontWeight: 700, color: COLORS.ink, margin: 0 }}>What these rates mean in pounds</h2>
        <button type="button" onClick={() => setRun((n) => n + 1)} style={{ ...pillStyle(false), fontSize: 13 }}>Play again</button>
      </div>
      <p style={{ fontFamily: FONT_BODY, fontSize: 14.5, lineHeight: 1.55, color: COLORS.inkSoft, margin: "8px 0 0", maxWidth: 780 }}>
        A rate is easier to feel against an amount. Each block below is £100 (or a fill-up, or a year), and the coloured squares are what goes in tax.
      </p>
      <div className="txa-cards" key={Math.max(run, 1)}>{/* not re-keyed when the section first scrolls into view (the fill starts from data-run), only on "Play again", so a button is never swapped out from under a tap */}
        {cards.map((c) => <Card key={c.id} card={c} onPick={onPick} />)}
      </div>
    </section>
  );
}

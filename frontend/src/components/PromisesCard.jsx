import { memo, useMemo } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { COLORS, FONT_BODY } from "../theme";
import { SECTOR_PROMISES } from "../data/onsPromises";
import { STATUS, pledgeByPromise, LAST_CHECKED, SOURCE_URL } from "../data/promises";
import { describeMeasure } from "../lib/onsPledge";
import { card, cardTitle } from "../lib/onsStyles";

// The government's pledges that these figures bear on: Full Fact's verdict on each, and,
// where one of the charts on the page can measure the pledge, how the latest figure compares.

function Row({ item, def, points, accent }) {
  const reduce = useReducedMotion();
  const pledge = pledgeByPromise(item.promise);
  const status = STATUS[pledge.status];
  const measure = useMemo(() => (item.measure && def && points ? describeMeasure(def, points, item.measure) : null), [item.measure, def, points]);
  return (
    <li style={{ padding: "16px 0", borderTop: `1px solid ${COLORS.hairline}`, listStyle: "none" }}>
      <div style={{ display: "flex", flexWrap: "wrap", alignItems: "flex-start", gap: "8px 14px" }}>
        <span
          style={{
            fontFamily: FONT_BODY, fontSize: 12, fontWeight: 700, color: status.color, background: `${status.color}1c`, border: `1px solid ${status.color}55`,
            borderRadius: 999, padding: "3px 10px", whiteSpace: "nowrap", flexShrink: 0,
          }}
        >
          {status.label}
        </span>
        <h3 style={{ fontFamily: FONT_BODY, fontSize: 15, fontWeight: 700, color: COLORS.ink, margin: 0, lineHeight: 1.4, flex: "1 1 240px", minWidth: 0 }}>{pledge.promise}</h3>
      </div>
      {measure && (
        <div style={{ margin: "10px 0 0", padding: "10px 14px", borderRadius: 12, background: `${accent}12`, borderLeft: `4px solid ${accent}` }}>
          <div style={{ fontFamily: FONT_BODY, fontSize: 12, fontWeight: 700, color: accent, marginBottom: 3 }}>What the figures show</div>
          <div style={{ fontFamily: FONT_BODY, fontSize: 14, lineHeight: 1.5, color: COLORS.ink }}>{measure.text}</div>
          {measure.progress !== null && (
            <div aria-hidden="true" style={{ height: 8, borderRadius: 4, background: COLORS.hairline, marginTop: 8, overflow: "hidden" }}>
              <motion.div
                style={{ height: "100%", borderRadius: 4, background: measure.met ? "#2F6F4E" : accent }}
                initial={reduce ? false : { width: 0 }}
                animate={{ width: `${Math.round(measure.progress * 100)}%` }}
                transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
              />
            </div>
          )}
        </div>
      )}
      <p style={{ fontFamily: FONT_BODY, fontSize: 13.5, lineHeight: 1.55, color: COLORS.inkSoft, margin: "10px 0 0" }}>
        <strong style={{ color: COLORS.ink }}>Full Fact: </strong>{pledge.reality}
      </p>
    </li>
  );
}

function PromisesCard({ sector, series, accent }) {
  const items = SECTOR_PROMISES[sector];
  if (!items?.length) return null;
  return (
    <section id="s-promises" className="ons-anchor" aria-labelledby="h-promises" style={{ ...card, position: "relative", overflow: "hidden", marginTop: 28 }}>
      <span aria-hidden="true" style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: 5, background: `linear-gradient(180deg, ${accent}, ${accent}22)` }} />
      <h2 id="h-promises" style={cardTitle}>What the government promised</h2>
      <p style={{ fontFamily: FONT_BODY, fontSize: 14.5, lineHeight: 1.55, color: COLORS.inkSoft, margin: "10px 0 6px", maxWidth: 740 }}>
        Pledges from Labour's 2024 manifesto and since, with the verdict of the fact-checking charity Full Fact, set against the latest figures where they can measure the promise.
      </p>
      <ul style={{ margin: 0, padding: 0 }}>
        {items.map((item) => {
          const s = item.measure ? series[item.measure.series] : null;
          return <Row key={item.promise} item={item} def={s?.def} points={s?.points} accent={accent} />;
        })}
      </ul>
      <p style={{ fontFamily: FONT_BODY, fontSize: 12.5, lineHeight: 1.55, color: COLORS.inkSoft, margin: "6px 0 0" }}>
        Verdicts are Full Fact's, last checked {LAST_CHECKED}, and may have changed since. We have not judged them ourselves.{" "}
        <a href={SOURCE_URL} target="_blank" rel="noreferrer" style={{ color: COLORS.inkSoft, textDecoration: "underline" }}>Full Fact's Government Tracker</a>
        {" · "}
        <a href="#/tracker" style={{ color: COLORS.inkSoft, textDecoration: "underline" }}>All the promises on this site</a>
      </p>
    </section>
  );
}

export default memo(PromisesCard);

import { useState } from "react";
import { COLORS, FONT_BODY, FONT_DISPLAY } from "../theme";
import RegionCompare from "./RegionCompare";
import { REGIONS, inSentence } from "../data/regionMetrics";
import { formatValue } from "../lib/onsFormat";
import { card, cardTitle, pillStyle } from "../lib/onsStyles";

// "Who lives where", "Who works where" and the like: pick a kind of fact (a category), then one group within it, and
// see how it varies from place to place on a labelled map with a ranked list beside it.
//
//   categories: [{ id, title, blurb, format, kind, of, whole, source, period, groups: [{ id, label, values, all, uk }] }]
//     kind     "share" (a group's share of some whole, such as "of residents") or "value" (a figure for each group, such as a rate or a price)
//     whole    what the whole-country figure is for when a group has no UK figure of its own ("England and Wales")
//     values   { regionKey: number | null }; a place left null is greyed out
//     all / uk the whole-country figure to mark on the key

const sentenceFor = (group, cat, whole, wholeValue) => {
  const present = Object.entries(group.values).filter(([, v]) => v !== null && v !== undefined).sort((a, b) => b[1] - a[1]);
  if (present.length < 2) return "";
  const [hiKey, hi] = present[0];
  const [loKey, lo] = present.at(-1);
  const f = (v) => formatValue(cat.format, v);
  const wholeText = wholeValue === null || wholeValue === undefined ? "" : ` For ${whole} as a whole it is ${f(wholeValue)}.`;
  if (cat.kind === "share") return `${f(hi)} of ${cat.of.replace(/^of /, "")} are in this group in ${inSentence(hiKey)}, the most of any place, against ${f(lo)} in ${inSentence(loKey)}.${wholeText}`;
  return `Highest in ${inSentence(hiKey)} (${f(hi)}) and lowest in ${inSentence(loKey)} (${f(lo)}).${wholeText}`;
};

export default function RegionalExplorer({ id, title, intro, categories, accent, failed = false }) {
  const [catId, setCatId] = useState(null);
  const [groupIds, setGroupIds] = useState({});
  const cat = categories?.find((c) => c.id === catId) ?? categories?.[0];
  const group = cat?.groups.find((g) => g.id === groupIds[cat.id]) ?? cat?.groups[0];
  if (failed) return null;
  const whole = group?.uk != null ? "the UK" : cat?.whole ?? "England and Wales";
  const wholeValue = group ? group.uk ?? group.all ?? null : null;
  const missing = cat ? REGIONS.filter((r) => group?.values[r.key] === null || group?.values[r.key] === undefined).length : 0;

  return (
    <section id={`s-${id}`} className="ons-anchor" aria-labelledby={`h-${id}`} style={{ ...card, position: "relative", overflow: "hidden", gridColumn: "1 / -1" }}>
      <span aria-hidden="true" style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: 5, background: `linear-gradient(180deg, ${accent}, ${accent}22)` }} />
      <h2 id={`h-${id}`} style={cardTitle}>{title}</h2>
      <p style={{ fontFamily: FONT_BODY, fontSize: 14.5, lineHeight: 1.55, color: COLORS.ink, margin: "10px 0 14px", maxWidth: 780 }}>{intro}</p>
      {!cat && <p style={{ fontFamily: FONT_BODY, fontSize: 13.5, color: COLORS.inkSoft }}>Loading…</p>}
      {cat && group && (
        <>
          <div role="radiogroup" aria-label="Kind of fact" style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {categories.map((c) => (
              <button key={c.id} type="button" role="radio" aria-checked={cat.id === c.id} className="ons-chip" onClick={() => setCatId(c.id)}
                style={{ ...pillStyle(cat.id === c.id), background: cat.id === c.id ? accent : "transparent", borderColor: cat.id === c.id ? accent : COLORS.hairline, color: cat.id === c.id ? "#fff" : COLORS.inkSoft }}>
                {c.title}
              </button>
            ))}
          </div>
          <p style={{ fontFamily: FONT_BODY, fontSize: 13.5, lineHeight: 1.55, color: COLORS.inkSoft, margin: "12px 0 10px", maxWidth: 780 }}>{cat.blurb}</p>
          {cat.groups.length > 1 && (
            <div role="radiogroup" aria-label="Group" style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {cat.groups.map((g) => (
                <button key={g.id} type="button" role="radio" aria-checked={group.id === g.id} className="ons-chip" onClick={() => setGroupIds((cur) => ({ ...cur, [cat.id]: g.id }))} style={pillStyle(group.id === g.id)}>
                  {g.label}
                </button>
              ))}
            </div>
          )}
          <h3 style={{ fontFamily: FONT_DISPLAY, fontSize: 19, fontWeight: 700, color: COLORS.ink, margin: "18px 0 4px" }}>
            {cat.kind === "share" ? `${group.label}${cat.of ? `, as a share ${cat.of}` : ""}` : cat.groups.length > 1 ? `${cat.title}: ${group.label}` : group.label}
          </h3>
          <p style={{ fontFamily: FONT_BODY, fontSize: 14, lineHeight: 1.55, color: COLORS.ink, margin: "0 0 4px", maxWidth: 780 }} aria-live="polite">{sentenceFor(group, cat, whole, wholeValue)}</p>
          <RegionCompare
            key={`${cat.id}-${group.id}`}
            values={group.values} format={cat.format} accent={accent} noun={`${cat.title}, ${group.label}`}
            ukValue={wholeValue} ukLabel={`${whole} as a whole`}
            caption="Round-number steps. Each map has its own scale, so compare places within a map."
          />
          <div style={{ fontFamily: FONT_BODY, fontSize: 12, color: COLORS.inkSoft, marginTop: 14 }}>
            Source: {typeof cat.source === "string" ? cat.source : `${cat.source.name}`}{cat.period ? `, ${cat.period}` : ""}. Regions show the average for a whole region: the differences inside a region can be larger than the differences between regions.{missing > 0 ? "" : ""}
          </div>
        </>
      )}
    </section>
  );
}

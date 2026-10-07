import { useEffect, useMemo, useState } from "react";
import { COLORS, FONT_BODY, FONT_DISPLAY } from "../theme";
import RegionCompare from "./RegionCompare";
import { REGIONS, inSentence } from "../data/regionMetrics";
import { loadSector } from "../lib/onsData";
import { formatValue } from "../lib/onsFormat";
import { card, cardTitle, pillStyle } from "../lib/onsStyles";

// "Who lives where": pick a kind of fact about people (ethnic group, religion, age, qualifications, pay, ...) and one
// group within it, and see how big that group is in each region on a labelled map, ranked alongside.
// The census figures come from regionalProfile.json (see fetch-regional-profile.js): the regions of England and Wales
// for every group, and Scotland and Northern Ireland where a matching UK-wide table exists. Pay comes from the Regions
// page's own series, which cover all four nations.

const PAY_GROUPS = [
  ["pay", "Typical pay (the middle)", "Typical pay"],
  ["pay-low", "Lower earners (the 10th percentile)", "Pay for lower earners"],
  ["pay-high", "Higher earners (the 90th percentile)", "Pay for higher earners"],
];

const sentenceFor = (group, cat, values, all, format, wholeLabel) => {
  const present = Object.entries(values).filter(([, v]) => v !== null && v !== undefined).sort((a, b) => b[1] - a[1]);
  if (present.length < 2) return "";
  const name = inSentence;
  const [hiKey, hi] = present[0];
  const [loKey, lo] = present.at(-1);
  const f = (v) => formatValue(format, v);
  if (cat.id === "earnings") return `${group.subject} is highest in ${name(hiKey)} (${f(hi)}) and lowest in ${name(loKey)} (${f(lo)}). For the UK as a whole it is ${f(all)}.`;
  return `${f(hi)} of ${cat.of.replace(/^of /, "")} are in this group in ${name(hiKey)}, the most of any place, against ${f(lo)} in ${name(loKey)}. For ${wholeLabel} as a whole it is ${f(all)}.`;
};

export default function PopulationExplorer({ accent }) {
  const [profile, setProfile] = useState(null);
  const [pay, setPay] = useState(null);
  const [failed, setFailed] = useState(false);
  const [catId, setCatId] = useState("ethnicity");
  const [groupIds, setGroupIds] = useState({});

  useEffect(() => {
    let alive = true;
    Promise.all([import("../data/regionalProfile.json"), loadSector("regions")])
      .then(([p, regions]) => { if (alive) { setProfile(p.default); setPay(regions); } })
      .catch(() => alive && setFailed(true));
    return () => { alive = false; };
  }, []);

  // Every category as { id, title, blurb, of, format, groups: [{ id, label, values, all }] }.
  const categories = useMemo(() => {
    if (!profile) return [];
    const list = profile.categories.map((c) => ({ ...c, format: "pct", unit: "", source: "Census 2021, with Scotland's Census 2022", groups: c.groups }));
    if (pay) {
      const latest = (id) => pay.series[id]?.points.at(-1)?.[1] ?? null;
      const year = pay.series["pay-uk"]?.points.at(-1)?.[0]?.slice(0, 4);
      const groups = PAY_GROUPS.map(([prefix, label, subject]) => ({
        id: prefix, label, subject,
        values: Object.fromEntries(REGIONS.map((r) => [r.key, latest(`${prefix}-${r.key}`)])),
        all: latest(`${prefix}-uk`),
      }));
      list.push({
        id: "earnings", title: "Pay", of: "", format: "gbp", unit: "", source: `Annual Survey of Hours and Earnings, April ${year}`,
        blurb: "What employees living in each place are paid before tax, for a full year. Typical pay is the figure that half of people earn more than. Lower earners are at the 10th percentile: nine in ten earn more. Higher earners are at the 90th: only one in ten earn more.",
        groups,
      });
    }
    return list;
  }, [profile, pay]);

  const cat = categories.find((c) => c.id === catId) ?? categories[0];
  const group = cat?.groups.find((g) => g.id === groupIds[cat.id]) ?? cat?.groups[0];

  const wholeLabel = cat?.id === "earnings" || group?.uk != null ? "the UK" : "England and Wales";
  if (failed) return null;
  return (
    <section id="s-who-lives-where" className="ons-anchor" aria-labelledby="h-who-lives-where" style={{ ...card, position: "relative", overflow: "hidden", gridColumn: "1 / -1" }}>
      <span aria-hidden="true" style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: 5, background: `linear-gradient(180deg, ${accent}, ${accent}22)` }} />
      <h2 id="h-who-lives-where" style={cardTitle}>Who lives where</h2>
      <p style={{ fontFamily: FONT_BODY, fontSize: 14.5, lineHeight: 1.55, color: COLORS.ink, margin: "10px 0 14px", maxWidth: 780 }}>
        Pick a kind of fact about people, then a group, to see how it varies from place to place. Most of this is from the 2021 Census (Scotland held its census in 2022). The four nations ran separate censuses with different questions, so a place is greyed out where its figure is not published on matching terms: for example, Scotland and Northern Ireland have no figure for type of work.
      </p>
      {!cat && <p style={{ fontFamily: FONT_BODY, fontSize: 13.5, color: COLORS.inkSoft }}>Loading…</p>}
      {cat && (
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
          <div role="radiogroup" aria-label="Group" style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {cat.groups.map((g) => (
              <button key={g.id} type="button" role="radio" aria-checked={group.id === g.id} className="ons-chip" onClick={() => setGroupIds((cur) => ({ ...cur, [cat.id]: g.id }))} style={pillStyle(group.id === g.id)}>
                {g.label}
              </button>
            ))}
          </div>
          <h3 style={{ fontFamily: FONT_DISPLAY, fontSize: 19, fontWeight: 700, color: COLORS.ink, margin: "18px 0 4px" }}>
            {group.label}{cat.of ? `, as a share ${cat.of}` : ""}
          </h3>
          <p style={{ fontFamily: FONT_BODY, fontSize: 14, lineHeight: 1.55, color: COLORS.ink, margin: "0 0 4px", maxWidth: 780 }} aria-live="polite">{sentenceFor(group, cat, group.values, group.uk ?? group.all, cat.format, wholeLabel)}</p>
          <RegionCompare
            key={`${cat.id}-${group.id}`}
            values={group.values} format={cat.format} accent={accent} noun={`${group.label}${cat.of ? ` ${cat.of}` : ""}`}
            ukValue={group.uk ?? group.all} ukLabel={wholeLabel === "the UK" ? "the UK as a whole" : "England and Wales"}
            caption="Round-number steps. Each map has its own scale, so compare places within a map."
          />
          <div style={{ fontFamily: FONT_BODY, fontSize: 12, color: COLORS.inkSoft, marginTop: 14 }}>
            Source: {cat.source}{cat.id === "earnings" ? " (ONS, via Nomis)" : " (ONS and NISRA, via Nomis; Scotland: National Records of Scotland)"}. Regions show the average for a whole region: the differences inside a region can be larger than the differences between regions.
          </div>
        </>
      )}
    </section>
  );
}

import { useCallback, useEffect, useMemo, useState } from "react";
import { COLORS, FONT_BODY, FONT_DISPLAY, numeric } from "../theme";
import { card, cardTitle, pillStyle } from "../lib/onsStyles";
import history from "../data/electionsHistory.json";
import hexes2019 from "../data/seatHexes2019.json";
import { GROUPS, NO_MATCH, electionLabel } from "../lib/electionHistory";
import { compare, layout2024 } from "../lib/electionCompare";
import { loadConstituencies, loadMargins } from "../lib/electionData";
import ElectionMap from "./ElectionMap";
import { CountUp, Reveal } from "./Motion";
import Loading from "./Loading";

// Compare two elections: the seats that changed hands, where they went, and the swing between Labour and the Conservatives, on the 2010 map.
// A seat counts when a seat of the same name was fought at both elections.

const para = { fontFamily: FONT_BODY, fontSize: 15, lineHeight: 1.65, color: COLORS.inkSoft, margin: "6px 0 0", maxWidth: 760 };
const IDS = [...history.elections.map((e) => e.id).filter((id) => id !== "1945"), "2024"];
const nameOf = (id) => electionLabel({ id });
const select = { fontFamily: FONT_BODY, fontSize: 15, padding: "9px 12px", borderRadius: 12, border: `1px solid ${COLORS.hairline}`, background: COLORS.paper, color: COLORS.ink, minWidth: 130 };
const swingColour = (s) => {
  const c = s > 0 ? GROUPS.l.colour : GROUPS.c.colour;
  return `color-mix(in srgb, ${c} ${Math.round(20 + Math.min(1, Math.abs(s) / 15) * 80)}%, #efece0)`;
};
function winnerPaint(side, i) {
  const g = side?.w[i];
  if (!g || g === ".") return { fill: NO_MATCH, swatch: NO_MATCH, note: "No seat of this name" };
  return { fill: GROUPS[g].colour, swatch: GROUPS[g].colour, note: GROUPS[g].label };
}
const swingText = (s) => `${Math.abs(s).toFixed(1)} points to ${s > 0 ? "Labour" : "the Conservatives"}`;

export default function CompareElections() {
  const [pair, setPair] = useState(["2019", "2024"]);
  const [mode, setMode] = useState("changed");
  const [data, setData] = useState(null);

  useEffect(() => {
    let alive = true;
    Promise.all([loadMargins(), loadConstituencies()]).then(([margins, cons]) => alive && setData({ margins, cons }));
    return () => { alive = false; };
  }, []);

  const [from, to] = useMemo(() => [...pair].sort((x, y) => IDS.indexOf(x) - IDS.indexOf(y)), [pair]);
  const view = useMemo(() => {
    if (!data) return null;
    const side = (id) => (id === "2024" ? layout2024(hexes2019.hexes, data.cons) : { w: history.maps[id].w, d: data.margins[id] });
    const a = side(from);
    const b = side(to);
    return { a, b, cmp: compare(a, b) };
  }, [data, from, to]);

  const paintChange = useCallback((i) => {
    if (!view) return { fill: NO_MATCH, swatch: NO_MATCH, note: "Loading" };
    const { a, b, cmp } = view;
    if (a.w[i] === "." || b.w[i] === ".") return { fill: NO_MATCH, swatch: NO_MATCH, note: "No seat of this name at both elections" };
    const swing = cmp.swingBySeat.get(i);
    const hands = a.w[i] !== b.w[i];
    const note = `${hands ? `${GROUPS[a.w[i]].label} to ${GROUPS[b.w[i]].label}` : `${GROUPS[b.w[i]].label} held`}${swing != null ? ` · ${swingText(swing)}` : ""}`;
    if (mode === "swing") return swing == null ? { fill: NO_MATCH, swatch: NO_MATCH, note } : { fill: swingColour(swing), swatch: swing > 0 ? GROUPS.l.colour : GROUPS.c.colour, note };
    return { fill: GROUPS[b.w[i]].colour, swatch: GROUPS[b.w[i]].colour, dim: !hands, note };
  }, [view, mode]);

  const paintA = useCallback((i) => winnerPaint(view?.a, i), [view]);
  const paintB = useCallback((i) => winnerPaint(view?.b, i), [view]);

  const cmp = view?.cmp;
  const top = cmp?.flows[0];
  const seatName = (i) => hexes2019.hexes[i][1];

  return (
    <Reveal as="section" aria-labelledby="h-eh-compare" style={{ ...card, marginTop: 18 }}>
      <h2 id="h-eh-compare" style={cardTitle}>Compare two elections</h2>
      <p style={para}>Pick any two elections to see which seats changed hands, where they went, and how far the vote swung. Seats are matched by name, so the comparison covers the seats that kept their name at both elections.</p>
      <div style={{ display: "flex", gap: 14, flexWrap: "wrap", margin: "14px 0 4px", alignItems: "flex-end" }}>
        {[[0, "From"], [1, "To"]].map(([k, text]) => (
          <div key={k}>
            <label htmlFor={`cmp-${k}`} style={{ display: "block", fontFamily: FONT_BODY, fontSize: 13, fontWeight: 600, color: COLORS.ink, marginBottom: 5 }}>{text}</label>
            <select id={`cmp-${k}`} value={pair[k]} onChange={(e) => setPair((p) => (k === 0 ? [e.target.value, p[1]] : [p[0], e.target.value]))} style={select}>
              {IDS.map((id) => <option key={id} value={id}>{nameOf(id)}</option>)}
            </select>
          </div>
        ))}
        <div role="group" aria-label="What the big map shows" style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {[["changed", "Seats that changed hands"], ["swing", "Swing"]].map(([k, text]) => (
            <button key={k} type="button" aria-pressed={mode === k} onClick={() => setMode(k)} style={pillStyle(mode === k)}>{text}</button>
          ))}
        </div>
      </div>

      {!cmp ? <Loading /> : from === to ? <p style={para}>Choose two different elections.</p> : (
        <>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 10, marginTop: 16 }}>
            {[
              [cmp.changed.length, "", "seats changed hands", "#7A5AF0"],
              [cmp.both, "", "seats matched at both", "#0E9AA7"],
            ].map(([n, suffix, label, c]) => (
              <div key={label} style={{ padding: "12px 15px", borderRadius: 15, background: COLORS.paper, border: `1px solid ${COLORS.hairline}`, borderLeft: `4px solid ${c}` }}>
                <div style={{ ...numeric, fontSize: 32, fontWeight: 600, color: COLORS.ink, letterSpacing: "-0.02em" }}><CountUp key={`${from}${to}${label}`} value={n} suffix={suffix} /></div>
                <div style={{ fontFamily: FONT_BODY, fontSize: 13, color: COLORS.inkSoft, marginTop: 2 }}>{label}</div>
              </div>
            ))}
            {cmp.meanSwing != null && (
              <div style={{ padding: "12px 15px", borderRadius: 15, background: COLORS.paper, border: `1px solid ${COLORS.hairline}`, borderLeft: `4px solid ${cmp.meanSwing >= 0 ? GROUPS.l.colour : GROUPS.c.colour}` }}>
                <div style={{ ...numeric, fontSize: 32, fontWeight: 600, color: COLORS.ink, letterSpacing: "-0.02em" }}><CountUp key={`${from}${to}sw`} value={Math.abs(cmp.meanSwing)} decimals={1} /></div>
                <div style={{ fontFamily: FONT_BODY, fontSize: 13, color: COLORS.inkSoft, marginTop: 2 }}>points average swing to {cmp.meanSwing >= 0 ? "Labour" : "the Conservatives"}</div>
              </div>
            )}
          </div>
          <p style={para}>
            Between {nameOf(from)} and {nameOf(to)}, {cmp.changed.length} of the {cmp.both} matched seats changed hands.
            {top ? ` The biggest movement was ${GROUPS[top.from].label} to ${GROUPS[top.to].label}, in ${top.n} seats.` : ""}
          </p>

          <div style={{ marginTop: 16 }}>
            <ElectionMap
              key={`${from}${to}${mode}`}
              seats={hexes2019.hexes}
              flat
              paint={paintChange}
              label={`Hexagon map of seats compared between ${nameOf(from)} and ${nameOf(to)}, showing ${mode === "swing" ? "the swing between Labour and the Conservatives" : "which seats changed hands"}.`}
            />
          </div>
          <p style={{ ...para, fontSize: 13, marginTop: 8 }}>
            {mode === "swing"
              ? "Red seats swung to Labour and blue seats to the Conservatives, the deeper the colour the bigger the swing (15 points or more is the deepest). Grey seats do not appear at both elections."
              : "Seats that changed hands are in the winner's new colour. Faded seats were held by the same party. Grey seats do not appear at both elections."}
          </p>

          {cmp.flows.length > 0 && (
            <>
              <h3 style={{ fontFamily: FONT_DISPLAY, fontSize: 18, margin: "20px 0 0", color: COLORS.ink }}>Where the seats went</h3>
              <ul style={{ listStyle: "none", margin: "8px 0 0", padding: 0 }}>
                {cmp.flows.slice(0, 6).map((f) => (
                  <li key={f.from + f.to} style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: 10, padding: "9px 0", borderTop: `1px solid ${COLORS.hairline}`, fontFamily: FONT_BODY, fontSize: 14.5 }}>
                    <span style={{ display: "inline-flex", alignItems: "center", gap: 8, color: COLORS.ink, fontWeight: 600, flexWrap: "wrap" }}>
                      <span aria-hidden="true" style={{ width: 10, height: 10, borderRadius: "50%", background: GROUPS[f.from].colour }} />
                      {GROUPS[f.from].label} to
                      <span aria-hidden="true" style={{ width: 10, height: 10, borderRadius: "50%", background: GROUPS[f.to].colour }} />
                      {GROUPS[f.to].label}
                    </span>
                    <strong style={{ ...numeric, color: COLORS.ink }}>{f.n}</strong>
                  </li>
                ))}
              </ul>
            </>
          )}

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 20, marginTop: 20 }}>
            {[["Biggest swings to Labour", cmp.toLabour, GROUPS.l.colour], ["Biggest swings to the Conservatives", cmp.toConservative, GROUPS.c.colour]].map(([title, list, c]) => (
              <div key={title}>
                <h3 style={{ fontFamily: FONT_DISPLAY, fontSize: 17, margin: 0, color: COLORS.ink }}>{title}</h3>
                {list.length === 0 ? <p style={{ ...para, fontSize: 14 }}>None in this comparison.</p> : (
                  <ol style={{ listStyle: "none", margin: "6px 0 0", padding: 0 }}>
                    {list.map((s) => (
                      <li key={s.i} style={{ display: "flex", justifyContent: "space-between", gap: 10, padding: "8px 0", borderTop: `1px solid ${COLORS.hairline}`, fontFamily: FONT_BODY, fontSize: 14 }}>
                        <span style={{ color: COLORS.ink, fontWeight: 600 }}>{seatName(s.i)}</span>
                        <span style={{ color: `color-mix(in srgb, ${c} 60%, ${COLORS.ink})`, fontWeight: 700 }}>{Math.abs(s.swing).toFixed(1)} points</span>
                      </li>
                    ))}
                  </ol>
                )}
              </div>
            ))}
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 16, marginTop: 22 }}>
            {[[from, paintA, "a"], [to, paintB, "b"]].map(([id, paint, k]) => (
              <figure key={k} style={{ margin: 0 }}>
                <figcaption style={{ fontFamily: FONT_DISPLAY, fontSize: 16, fontWeight: 700, color: COLORS.ink, marginBottom: 6 }}>{nameOf(id)}</figcaption>
                <ElectionMap key={`${id}${k}`} seats={hexes2019.hexes} flat compact paint={paint} label={`Hexagon map of the winner of each matched seat at the ${nameOf(id)} election.`} />
              </figure>
            ))}
          </div>
          <p style={{ ...para, fontSize: 12.5, marginTop: 14 }}>
            Swing here is the usual two-party measure: half the change in the gap between Labour's share of the vote and the Conservatives', so it ignores other parties. A swing to the Conservatives means Labour's lead over them shrank, which can happen because Labour lost votes to other parties as well as because the Conservatives gained. Shares are rounded to whole points, so swings are good to about a point. The 2024 comparison uses today's seats matched by name to the 2010 map.
          </p>
        </>
      )}
    </Reveal>
  );
}

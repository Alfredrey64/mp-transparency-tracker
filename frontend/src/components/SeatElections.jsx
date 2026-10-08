import { useMemo } from "react";
import { COLORS, FONT_BODY, FONT_DISPLAY, numeric } from "../theme";
import { partyColour } from "../lib/format";
import { Panel } from "./Constituency";
import { electionList, changesOfParty, shortParty } from "../lib/seatElections";

// A seat's general elections side by side: the 2010, 2015, 2017 and 2019 results for the old seat of the same name (from
// Democracy Club, via electionHistory.json) and the 2024 result for today's seat. Boundaries changed in 2024, so 2024 is not
// a like-for-like comparison with the four before it, and the page says so.

const pct1 = (n) => `${(Math.round(n * 10) / 10).toFixed(1)}%`;
const fmt = (n) => Math.round(n).toLocaleString("en-GB");

function Lines({ list, colourOf }) {
  const W = 620, H = 260, L = 38, R = 96, T = 14, B = 30;
  // The parties that came in the top three at least once.
  const names = useMemo(() => {
    const set = new Map();
    for (const e of list) e.parties.slice(0, 3).forEach((p) => set.set(p.name, (set.get(p.name) ?? 0) + p.share));
    return [...set.entries()].sort((a, b) => b[1] - a[1]).map(([n]) => n);
  }, [list]);
  const top = Math.max(60, Math.ceil(Math.max(...list.flatMap((e) => e.parties.map((p) => p.share))) / 10) * 10);
  const x = (i) => L + (list.length === 1 ? (W - L - R) / 2 : (i / (list.length - 1)) * (W - L - R));
  const y = (v) => H - B - (v / top) * (H - B - T);
  // Labels at the right-hand end, pushed apart so two parties on nearly the same share can both be read.
  const labelY = useMemo(() => {
    const ends = names.map((name) => {
      const p = list.at(-1).parties.find((q) => q.name === name);
      return p ? { name, y: y(p.share) + 4 } : null;
    }).filter(Boolean).sort((a, b) => a.y - b.y);
    for (let i = 1; i < ends.length; i++) if (ends[i].y - ends[i - 1].y < 15) ends[i].y = ends[i - 1].y + 15;
    return Object.fromEntries(ends.map((e) => [e.name, e.y]));
    // y depends only on the chart's fixed size and `top`.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [names, list, top]);
  return (
    <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Vote share of the leading parties at each general election" style={{ width: "100%", height: "auto", display: "block" }}>
      {Array.from({ length: top / 10 + 1 }, (_, i) => i * 10).map((v) => (
        <g key={v}>
          <line x1={L} x2={W - R} y1={y(v)} y2={y(v)} stroke={COLORS.hairline} strokeWidth="1" />
          <text x={L - 6} y={y(v) + 4} textAnchor="end" fontFamily={FONT_BODY} fontSize="11" fill={COLORS.inkSoft}>{v}%</text>
        </g>
      ))}
      {list.map((e, i) => <text key={e.year} x={x(i)} y={H - 8} textAnchor="middle" fontFamily={FONT_BODY} fontSize="12" fontWeight="600" fill={COLORS.inkSoft}>{e.year}</text>)}
      {/* The 2024 boundaries differ from the four elections before it. */}
      {list.length > 1 && !list.at(-1).old && list.at(-2)?.old && (
        <line x1={(x(list.length - 1) + x(list.length - 2)) / 2} x2={(x(list.length - 1) + x(list.length - 2)) / 2} y1={T} y2={H - B} stroke={COLORS.inkSoft} strokeWidth="1" strokeDasharray="3 4" opacity="0.6" />
      )}
      {names.map((name) => {
        const pts = list.map((e, i) => { const p = e.parties.find((q) => q.name === name); return p ? { i, v: p.share } : null; });
        const segs = [];
        let cur = [];
        pts.forEach((p) => { if (p) cur.push(p); else if (cur.length) { segs.push(cur); cur = []; } });
        if (cur.length) segs.push(cur);
        const last = [...pts].reverse().find(Boolean);
        const c = colourOf(name);
        return (
          <g key={name}>
            {segs.map((s, k) => <path key={k} d={s.map((p, j) => `${j ? "L" : "M"}${x(p.i).toFixed(1)} ${y(p.v).toFixed(1)}`).join("")} fill="none" stroke={c} strokeWidth="2.6" strokeLinejoin="round" strokeLinecap="round" />)}
            {pts.map((p, i) => p && <circle key={i} cx={x(i)} cy={y(p.v)} r="4" fill={c} stroke={COLORS.paperCard} strokeWidth="1.6"><title>{`${name}, ${list[i].year}: ${pct1(p.v)}`}</title></circle>)}
            {last && last.i === list.length - 1 && <text x={x(last.i) + 9} y={labelY[name] ?? y(last.v) + 4} fontFamily={FONT_BODY} fontSize="12" fontWeight="700" fill={COLORS.ink}>{shortParty(name)}</text>}
          </g>
        );
      })}
    </svg>
  );
}

export default function SeatElections({ record, history, parties, loading }) {
  const list = useMemo(() => electionList(history, record), [history, record]);
  const colourOf = useMemo(() => {
    const m = new Map();
    for (const e of list) for (const p of e.parties) if (p.colour) m.set(p.name, p.colour);
    return (name) => partyColour(m.get(name) ?? parties?.[name], COLORS.inkSoft);
  }, [list, parties]);
  const changes = useMemo(() => changesOfParty(list), [list]);
  const olds = list.filter((e) => e.old);

  return (
    <div role="tabpanel" id="panel-elections" aria-labelledby="tab-elections" style={{ display: "flex", flexDirection: "column", gap: 16, marginTop: 20 }}>
      <Panel title="Past general elections">
        {loading ? (
          <div style={{ fontFamily: FONT_BODY, fontSize: 13.5, color: COLORS.inkSoft }}>Loading the earlier results…</div>
        ) : list.length < 2 ? (
          <div style={{ fontFamily: FONT_BODY, fontSize: 13.5, color: COLORS.inkSoft, lineHeight: 1.6 }}>
            No earlier result is filed under this seat&apos;s name. It is probably a new seat in 2024, or was renamed, so there is no like-for-like history to show.
          </div>
        ) : (
          <>
            <p style={{ fontFamily: FONT_DISPLAY, fontSize: "clamp(18px, 3vw, 22px)", lineHeight: 1.3, color: COLORS.ink, margin: "0 0 14px", maxWidth: 640 }}>
              {changes.length === 0
                ? `${list[0].parties[0].name} won this seat at every general election from ${list[0].year} to ${list.at(-1).year}.`
                : `The seat changed party ${changes.length === 1 ? "once" : `${changes.length} times`} between ${list[0].year} and ${list.at(-1).year}: ${changes.map((c) => `${c.year} (${c.from} to ${c.to})`).join(", ")}.`}
            </p>
            <Lines list={list} colourOf={colourOf} />
            <p style={{ fontFamily: FONT_BODY, fontSize: 12, color: COLORS.inkSoft, margin: "6px 0 0", lineHeight: 1.55 }}>
              Share of the vote for the three leading parties at each election. {olds.length ? "The dashed line marks the 2024 boundary change: elections before it were for the old seat of this name." : ""}
            </p>
            <details style={{ marginTop: 12 }}>
              <summary className="ons-tap" style={{ fontFamily: FONT_BODY, fontSize: 13.5, fontWeight: 700, color: COLORS.ink, cursor: "pointer", padding: "6px 0" }}>See the figures as a table</summary>
              <div style={{ overflowX: "auto" }}>
                <table style={{ borderCollapse: "collapse", width: "100%", fontFamily: FONT_BODY, fontSize: 13, color: COLORS.ink, minWidth: 420 }}>
                  <thead>
                    <tr>{["Year", "Winner", "Share", "Lead", "Majority"].map((h) => <th key={h} scope="col" style={{ textAlign: h === "Year" || h === "Winner" ? "left" : "right", padding: "6px 8px", borderBottom: `1px solid ${COLORS.hairline}`, fontWeight: 700 }}>{h}</th>)}</tr>
                  </thead>
                  <tbody>
                    {[...list].reverse().map((e) => (
                      <tr key={e.year}>
                        <td style={{ padding: "6px 8px", ...numeric }}>{e.year}{e.old ? "" : " (today's seat)"}</td>
                        <td style={{ padding: "6px 8px" }}><span aria-hidden="true" style={{ display: "inline-block", width: 9, height: 9, borderRadius: "50%", background: colourOf(e.parties[0].name), marginRight: 7 }} />{e.parties[0].name}</td>
                        <td style={{ padding: "6px 8px", textAlign: "right", ...numeric }}>{pct1(e.parties[0].share)}</td>
                        <td style={{ padding: "6px 8px", textAlign: "right", ...numeric }}>{pct1(e.lead ?? 0)}</td>
                        <td style={{ padding: "6px 8px", textAlign: "right", ...numeric }}>{fmt(e.majority ?? 0)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </details>
          </>
        )}
      </Panel>
      <p style={{ fontFamily: FONT_BODY, fontSize: 11.5, color: COLORS.inkSoft, lineHeight: 1.55, margin: 0 }}>
        Earlier results are from Democracy Club and Parliament&apos;s Members API. The 2024 election used new boundaries, so a seat that kept its name may cover different ground; treat the change from 2019 to 2024 with care.
      </p>
    </div>
  );
}

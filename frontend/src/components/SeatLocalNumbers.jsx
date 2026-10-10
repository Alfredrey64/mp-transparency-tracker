import { useEffect, useMemo, useState } from "react";
import { COLORS, FONT_BODY, numeric } from "../theme";
import { REGIONS } from "../data/regionMetrics";
import { loadSector } from "../lib/onsData";
import { formatValue, periodLabel } from "../lib/onsFormat";
import { oneIn, sentenceFor } from "../lib/deprivationPlain";
import { REGION_KEY_BY_CODE, regionSnapshot, yearsOfPay, againstUk, seatDeprivation } from "../lib/seatLocal";
import { ordinal } from "../lib/constituency";
import { Panel } from "./Constituency";

// A seat's local numbers: how deprived the area is (measured for the seat itself) and how its region does on house prices, pay and
// jobs (published for regions only, and labelled that way).

const REGION_NOTE = "These figures are for the whole region. The ONS publishes house prices, pay and jobs for the 12 regions and nations, not for single seats, so your own area can be quite different from its region's average.";

function Tile({ label, value, sub, uk, rank, accent, href, linkLabel }) {
  return (
    <div style={{ background: COLORS.paper, border: `1px solid ${COLORS.hairline}`, borderTop: `3px solid ${accent}`, borderRadius: 14, padding: "14px 16px", minWidth: 0 }}>
      <div style={{ fontFamily: FONT_BODY, fontSize: 12.5, fontWeight: 700, color: COLORS.inkSoft }}>{label}</div>
      <div style={{ ...numeric, fontSize: "clamp(24px, 4vw, 30px)", fontWeight: 700, letterSpacing: "-0.03em", lineHeight: 1.1, color: COLORS.ink, marginTop: 4 }}>{value}</div>
      {sub && <div style={{ fontFamily: FONT_BODY, fontSize: 12.5, color: COLORS.inkSoft, marginTop: 3 }}>{sub}</div>}
      {uk && <div style={{ fontFamily: FONT_BODY, fontSize: 12.5, color: COLORS.ink, marginTop: 8, lineHeight: 1.45 }}>{uk}</div>}
      {rank && <div style={{ fontFamily: FONT_BODY, fontSize: 12, color: COLORS.inkSoft, marginTop: 2 }}>{rank}</div>}
      {href && <a href={href} style={{ display: "inline-block", marginTop: 8, fontFamily: FONT_BODY, fontSize: 12.5, fontWeight: 700, color: COLORS.accent, textDecoration: "none" }}>{linkLabel}</a>}
    </div>
  );
}

export default function SeatLocalNumbers({ record, regionCode }) {
  const [sectors, setSectors] = useState(null);
  const [dep, setDep] = useState(null);
  const regionKey = REGION_KEY_BY_CODE[regionCode] ?? null;
  const region = REGIONS.find((r) => r.key === regionKey);

  useEffect(() => {
    let alive = true;
    Promise.all([loadSector("housing"), loadSector("jobs"), loadSector("regions")])
      .then(([housing, jobs, regions]) => alive && setSectors({ housing, jobs, regions }))
      .catch(() => alive && setSectors({}));
    Promise.all([import("../data/deprivationConstituencies.json"), import("../data/deprivationNations.json")])
      .then(([eng, nat]) => alive && setDep({ england: eng.default.seats, wales: nat.default.wales.seats, scotland: nat.default.scotland.seats, northernireland: nat.default.northernireland.seats }))
      .catch(() => alive && setDep({}));
    return () => { alive = false; };
  }, []);

  const snapshot = useMemo(
    () => (sectors && regionKey ? regionSnapshot(regionKey, (ref) => sectors[ref.sector]?.series?.[ref.id] ?? null) : []),
    [sectors, regionKey],
  );
  const pay = useMemo(() => yearsOfPay(snapshot), [snapshot]);
  const deprivation = useMemo(() => (dep ? seatDeprivation(record.name, dep) : null), [dep, record.name]);
  const loading = !sectors || !dep;

  return (
    <div role="tabpanel" id="panel-local" aria-labelledby="tab-local" style={{ display: "flex", flexDirection: "column", gap: 16, marginTop: 20 }}>
      <Panel title={`How deprived is ${record.name}?`}>
        {loading && <div style={{ fontFamily: FONT_BODY, fontSize: 13.5, color: COLORS.inkSoft }}>Loading…</div>}
        {!loading && !deprivation && (
          <div style={{ fontFamily: FONT_BODY, fontSize: 13.5, color: COLORS.inkSoft, lineHeight: 1.6 }}>There are no deprivation figures for this seat.</div>
        )}
        {deprivation && (
          <>
            <div style={{ display: "flex", flexWrap: "wrap", alignItems: "flex-end", gap: "10px 24px" }}>
              <div>
                <div style={{ ...numeric, fontSize: "clamp(40px, 8vw, 60px)", fontWeight: 700, lineHeight: 0.95, letterSpacing: "-0.035em", color: COLORS.ink }}>{oneIn(deprivation.worst10).replace(/^about /, "")}</div>
                <div style={{ fontFamily: FONT_BODY, fontSize: 13, color: COLORS.inkSoft, marginTop: 4 }}>of its {deprivation.unit} are in the most deprived tenth of {deprivation.nation}</div>
              </div>
              <div style={{ fontFamily: FONT_BODY, fontSize: 14, color: COLORS.ink, lineHeight: 1.6, flex: "1 1 240px", maxWidth: 380 }}>
                {sentenceFor(deprivation.worst10, { who: deprivation.unit, where: "are in the most deprived tenth" }).replace(/^./, (c) => c.toUpperCase())}.
                {" "}That makes it the <strong>{ordinal(deprivation.rank)}</strong> most affected of {deprivation.of} seats in {deprivation.nation}.
              </div>
            </div>
            <p style={{ fontFamily: FONT_BODY, fontSize: 12, color: COLORS.inkSoft, lineHeight: 1.55, margin: "14px 0 0" }}>
              Each nation scores its own neighbourhoods, so a rank in Wales is not directly comparable to one in England.{" "}
              <a href="#/deprivation" style={{ color: COLORS.accent, fontWeight: 700, textDecoration: "none" }}>See the whole UK</a>
            </p>
          </>
        )}
      </Panel>

      {region && (
        <Panel title={`Money and work in ${region.name}`}>
          <p style={{ fontFamily: FONT_BODY, fontSize: 13.5, color: COLORS.inkSoft, lineHeight: 1.6, margin: "0 0 14px", maxWidth: 680 }}>{REGION_NOTE}</p>
          {!sectors && <div style={{ fontFamily: FONT_BODY, fontSize: 13.5, color: COLORS.inkSoft }}>Loading…</div>}
          {sectors && snapshot.length === 0 && <div style={{ fontFamily: FONT_BODY, fontSize: 13.5, color: COLORS.inkSoft }}>The regional figures could not be loaded.</div>}
          {snapshot.length > 0 && (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(230px, 100%), 1fr))", gap: 12 }}>
              {pay && (
                <Tile
                  label="Years of pay to buy a home" accent="#2F9E6E"
                  value={`${pay.years.toFixed(1)} years`}
                  sub="The average home price divided by typical annual pay"
                  uk={pay.ukYears != null ? `The UK figure is ${pay.ukYears.toFixed(1)} years` : null}
                  href="#/housing" linkLabel="Housing in detail"
                />
              )}
              {snapshot.map((s) => (
                <Tile
                  key={s.metric.id}
                  label={s.metric.label} accent={s.metric.accent}
                  value={formatValue(s.metric.format, s.value)}
                  sub={s.period ? `Latest: ${periodLabel(s.period)}` : null}
                  uk={s.uk != null ? `UK: ${formatValue(s.metric.format, s.uk)}. This region is ${againstUk(s.value, s.uk, { rate: s.metric.format === "pct" }).replace(/^about the same as the UK$/, "about the same as the UK")}.` : null}
                  rank={s.rank ? `${ordinal(s.rank)} highest of ${s.of} regions and nations` : null}
                  href={`#/regions/${s.metric.id}`} linkLabel="Compare regions"
                />
              ))}
            </div>
          )}
        </Panel>
      )}

      <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
        {[
          ["#/regions", "All regions and nations"],
          ["#/deprivation", "Deprivation across the UK"],
          ["#/crime", "Crime figures"],
          ["#/councils", "Find your council"],
          ["#/indicators", "Compare numbers over time"],
        ].map(([href, label]) => (
          <a key={href} href={href} style={{ fontFamily: FONT_BODY, fontSize: 13, fontWeight: 700, color: COLORS.accent, background: `${COLORS.accent}12`, border: `1px solid ${COLORS.accent}40`, borderRadius: 999, padding: "7px 14px", textDecoration: "none" }}>{label}</a>
        ))}
      </div>
      <p style={{ fontFamily: FONT_BODY, fontSize: 12, color: COLORS.inkSoft, lineHeight: 1.55, margin: 0 }}>
        {region?.name ? `${region.name}'s` : "Regional"} house prices come from the UK House Price Index, jobs from the ONS Labour Force Survey and pay from the ONS Annual Survey of Hours and Earnings. Deprivation comes from each nation&apos;s own official index.
      </p>
    </div>
  );
}

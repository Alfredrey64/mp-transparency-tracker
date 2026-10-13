import { useEffect, useState } from "react";
import { COLORS, FONT_BODY, FONT_DISPLAY } from "../theme";
import { TAKE, loadTaxTake } from "../lib/taxTake";
import { toLineData, yearTicks } from "../lib/onsChart";
import { periodLabel } from "../lib/onsFormat";
import { formatValue } from "../lib/onsFormat";
import { bandsBetween, PARTY_COLOURS } from "../lib/governments";
import LineChart from "./LineChart";

// Under a tax's rates: how much it actually raised, as a share of the size of the economy, so the rate and the take can be read together.

export default function TaxTake({ taxId, nowT, fromYear, accent }) {
  const spec = TAKE.find((t) => t.taxId === taxId);
  const [loaded, setLoaded] = useState(null);
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    if (!spec) return undefined;
    let alive = true;
    loadTaxTake().then((r) => { if (alive) setLoaded(r); }).catch(() => { if (alive) setFailed(true); });
    return () => { alive = false; };
  }, [spec]);
  if (!spec || failed) return null;
  const series = loaded?.[spec.id];
  if (!series) return null;
  const all = toLineData(series.points);
  const from = Math.max(fromYear, Math.floor(all[0].x));
  const pts = all.filter((p) => p.x >= from - 0.01);
  const last = series.points[series.points.length - 1];
  const to = nowT;
  const bands = bandsBetween(from, to, to).map((b) => ({ ...b, color: PARTY_COLOURS[b.party] }));
  return (
    <div style={{ marginTop: 18, padding: "16px clamp(12px, 3vw, 18px) 12px", borderRadius: 18, background: COLORS.paper, border: `1px solid ${COLORS.hairline}` }}>
      <h3 style={{ fontFamily: FONT_DISPLAY, fontSize: 17, fontWeight: 700, color: COLORS.ink, margin: 0 }}>What it raises: {spec.short.charAt(0).toLowerCase() === spec.short.charAt(0) ? spec.short : spec.short.replace(/^(?=[A-Z][a-z])/, "")} as a share of GDP</h3>
      <div style={{ marginTop: 10 }}>
        <LineChart
          lines={[{ name: spec.short, points: pts, color: accent }]} xTicks={yearTicks(from, to)} yFormat={(v) => `${Number(v.toFixed(spec.format === "pct2" ? 2 : 1))}%`} accent={accent} height={200} bands={bands} domainX={[from, to]}
          ariaLabel={`${spec.short} receipts as a share of GDP, ${Math.floor(from)} to now. Latest ${formatValue(spec.format, last[1])} in the 12 months to ${periodLabel(last[0])}.`}
        />
      </div>
      <p style={{ fontFamily: FONT_BODY, fontSize: 12.5, color: COLORS.inkSoft, margin: "6px 0 0" }}>
        The total collected over the previous 12 months (four quarters for VAT and corporation tax) as a share of GDP over the same time. Latest: {formatValue(spec.format, last[1])}, to {periodLabel(last[0])}. Source: Office for National Statistics. A rate and a total can move apart, because what is collected also depends on pay, profits, spending and how many people work.
      </p>
    </div>
  );
}

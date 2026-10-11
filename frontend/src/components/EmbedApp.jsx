/** @jsxImportSource react */
import { useEffect, useRef, useState } from "react";
import { COLORS, FONT_BODY, FONT_BRAND, FONT_DISPLAY, numeric, readable } from "../theme";
import { ANSWERS } from "../data/answers";
import { sectorByKey } from "../data/onsSectors";
import { loadSector } from "../lib/onsData";
import { fillKeyPoint } from "../lib/onsKeyPoints";
import { sentenceFor, sliceRange, formatAxis, formatValue, latestInfo } from "../lib/onsFormat";
import { toLineData, yearTicks } from "../lib/onsChart";
import { parseEmbedHash, SITE_ORIGIN } from "../lib/embed";
import LineChart from "./LineChart";
import LogoMark from "./LogoMark";

// The embeddable cards (see lib/embed.js): one answer, or one chart. Rendered inside an iframe on someone else's page, so it
// links back to Simple Politics with target="_top" and tells the page how tall it is.

const link = (hash) => `${SITE_ORIGIN}/${hash}`;

function Frame({ children, href, label }) {
  const ref = useRef(null);
  useEffect(() => {
    const el = ref.current;
    if (!el || window.parent === window) return undefined;
    const send = () => window.parent.postMessage({ source: "simple-politics", type: "height", height: Math.ceil(el.getBoundingClientRect().height) + 2 }, "*");
    const ro = new ResizeObserver(send);
    ro.observe(el);
    send();
    return () => ro.disconnect();
  }, []);
  return (
    <article ref={ref} style={{ boxSizing: "border-box", margin: 0, padding: "20px 22px 16px", borderRadius: 18, border: `1px solid ${COLORS.hairline}`, background: COLORS.paperCard, color: COLORS.ink, fontFamily: FONT_BODY }}>
      {children}
      <footer style={{ display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: "8px 14px", marginTop: 16, paddingTop: 12, borderTop: `1px solid ${COLORS.hairline}` }}>
        <a href={SITE_ORIGIN} target="_top" rel="noopener" style={{ display: "inline-flex", alignItems: "center", gap: 8, textDecoration: "none", color: COLORS.ink }}>
          <LogoMark width={34} hole="var(--c-paper-card)" color={readable("#4F46E5")} />
          <span style={{ fontFamily: FONT_BRAND, fontSize: 16, fontWeight: 400, letterSpacing: "-0.02em" }}>Simple Politics</span>
        </a>
        <a href={href} target="_top" rel="noopener" style={{ fontSize: 13, fontWeight: 700, color: readable("#4F46E5") }}>{label}</a>
      </footer>
    </article>
  );
}

function useSectors(keys) {
  const [loaded, setLoaded] = useState({});
  const need = [...new Set(keys)].join("|");
  useEffect(() => {
    let alive = true;
    for (const k of need.split("|").filter(Boolean)) loadSector(k).then((r) => alive && setLoaded((l) => ({ ...l, [k]: r }))).catch(() => alive && setLoaded((l) => ({ ...l, [k]: false })));
    return () => { alive = false; };
  }, [need]);
  return loaded;
}

function Answer({ id }) {
  const answer = ANSWERS.find((a) => a.id === id);
  const facts = (answer?.facts ?? []).slice(0, 3);
  const sectors = useSectors(facts.map((f) => f.sector));
  if (!answer) return <Missing />;
  return (
    <Frame href={link(`#/answers/${answer.id}`)} label="Read the full answer">
      <div style={{ fontSize: 12.5, fontWeight: 700, color: readable("#4F46E5") }}>{answer.topic}</div>
      <h1 style={{ fontFamily: FONT_DISPLAY, fontSize: 24, lineHeight: 1.2, fontWeight: 700, margin: "4px 0 12px" }}>{answer.question}</h1>
      <p style={{ fontSize: 15.5, lineHeight: 1.6, margin: 0 }}>{answer.short}</p>
      {facts.length > 0 && (
        <ul style={{ listStyle: "none", margin: "14px 0 0", padding: 0 }}>
          {facts.map((f) => {
            const item = sectors[f.sector]?.series?.[f.series];
            const parts = item ? fillKeyPoint(f.text, item.def, item.points) : null;
            if (!parts) return null;
            return (
              <li key={f.series} style={{ padding: "9px 0", borderTop: `1px solid ${COLORS.hairline}`, fontSize: 14.5, lineHeight: 1.5 }}>
                {parts.map((p, i) => (p.strong ? <strong key={i} style={{ fontWeight: 800 }}>{p.text}</strong> : <span key={i}>{p.text}</span>))}
              </li>
            );
          })}
        </ul>
      )}
      <p style={{ fontSize: 12, color: COLORS.inkSoft, margin: "10px 0 0" }}>Figures from the Office for National Statistics and other official sources.</p>
    </Frame>
  );
}

function Chart({ sector, id }) {
  const sectors = useSectors([sector]);
  const item = sectors[sector]?.series?.[id];
  const def = sectorByKey(sector);
  if (sectors[sector] === false || (sectors[sector] && !item)) return <Missing />;
  if (!item) return <Frame href={SITE_ORIGIN} label="Open Simple Politics"><p style={{ fontSize: 14, color: COLORS.inkSoft }}>Loading the figures…</p></Frame>;
  const accent = def?.accent ?? "#4F46E5";
  const points = sliceRange(item.points, 10);
  const data = toLineData(points);
  const info = latestInfo(item.def, item.points);
  const sentence = sentenceFor(item.def, item.points);
  return (
    <Frame href={link(`#/${sector}`)} label="See more on Simple Politics">
      <div style={{ fontSize: 12.5, fontWeight: 700, color: readable(accent) }}>{def?.label ?? "Britain in numbers"}</div>
      <h1 style={{ fontFamily: FONT_DISPLAY, fontSize: 22, lineHeight: 1.2, fontWeight: 700, margin: "4px 0 6px" }}>{item.def.label}</h1>
      {info && <div style={{ ...numeric, fontSize: 38, fontWeight: 700, letterSpacing: "-0.03em", lineHeight: 1.05 }}>{formatValue(item.def.format, info.value)}</div>}
      <p style={{ fontSize: 14, lineHeight: 1.5, color: COLORS.inkSoft, margin: "4px 0 10px" }}>{sentence}</p>
      {data.length > 1 && (
        <LineChart
          lines={[{ name: item.def.label, points: data }]}
          xTicks={yearTicks(data[0].x, data.at(-1).x)} yFormat={(v) => formatAxis(item.def.format, v)}
          ariaLabel={`${item.def.label}, the last ten years. ${sentence}`} accent={accent} height={190} compact
        />
      )}
      <p style={{ fontSize: 12, color: COLORS.inkSoft, margin: "8px 0 0" }}>The last ten years. Source: Office for National Statistics and other official sources, under the Open Government Licence.</p>
    </Frame>
  );
}

function Missing() {
  return (
    <Frame href={SITE_ORIGIN} label="Open Simple Politics">
      <p style={{ fontSize: 15, margin: 0 }}>This card could not be found. It may have been renamed.</p>
    </Frame>
  );
}

export default function EmbedApp() {
  const [spec, setSpec] = useState(() => parseEmbedHash(window.location.hash));
  useEffect(() => {
    const on = () => setSpec(parseEmbedHash(window.location.hash));
    window.addEventListener("hashchange", on);
    return () => window.removeEventListener("hashchange", on);
  }, []);
  if (!spec) return <Missing />;
  return spec.kind === "answer" ? <Answer id={spec.id} /> : <Chart sector={spec.sector} id={spec.id} />;
}

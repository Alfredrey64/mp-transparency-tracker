import { useMemo } from "react";
import { COLORS, FONT_BODY, numeric } from "../theme";
import { sectorColor } from "../lib/donorSectors";
import { moneyProfile, concentrationPhrase } from "../lib/mpMoney";
import { CardShell } from "./shared";

// The money side of an MP at a glance: the total declared, who it came from and how concentrated it is, with each source linking
// to Trace a donor so you can see everyone else they have given to.

const money = (n) => `£${Math.round(n).toLocaleString("en-GB")}`;
const traceHref = (name) => `#/followTheMoney/${encodeURIComponent(name)}`;

export default function MpMoneyProfile({ interests, loading }) {
  const profile = useMemo(() => moneyProfile(interests), [interests]);
  if (loading || !profile) return null;
  const top = profile.top;

  return (
    <CardShell title="Where the money came from">
      <div style={{ display: "flex", flexWrap: "wrap", alignItems: "baseline", gap: "4px 12px" }}>
        <span style={{ ...numeric, fontSize: 30, fontWeight: 700, letterSpacing: "-0.03em", color: COLORS.ink, lineHeight: 1.1 }}>{money(profile.total)}</span>
        <span style={{ fontFamily: FONT_BODY, fontSize: 13, color: COLORS.inkSoft }}>
          declared, from {profile.sources} {profile.sources === 1 ? "source" : "sources"}
        </span>
      </div>
      <p style={{ fontFamily: FONT_BODY, fontSize: 13, color: COLORS.ink, lineHeight: 1.55, margin: "8px 0 0" }}>
        {concentrationPhrase(profile)}
        {profile.topSector && <> The biggest industry is <strong>{profile.topSector.sector}</strong>, at {Math.round(profile.topSector.share * 100)}% of the total.</>}
      </p>

      <ul style={{ listStyle: "none", margin: "14px 0 0", padding: 0, display: "grid", gap: 10 }}>
        {top.map((s) => {
          const colour = s.sector ? sectorColor(s.sector) : COLORS.inkSoft;
          return (
            <li key={s.key}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 10 }}>
                <a href={traceHref(s.name)} title={`Trace ${s.name}: see everyone it has given money to`} style={{ minWidth: 0, fontFamily: FONT_BODY, fontSize: 13.5, fontWeight: 600, color: COLORS.ink, textDecoration: "underline", textDecorationColor: `${COLORS.inkSoft}66`, textUnderlineOffset: 3, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{s.name}</a>
                <span style={{ ...numeric, flexShrink: 0, fontSize: 13.5, fontWeight: 600, color: COLORS.ink }}>{money(s.total)}</span>
              </div>
              <div aria-hidden="true" style={{ height: 7, borderRadius: 4, background: COLORS.paper, overflow: "hidden", marginTop: 5 }}>
                <div style={{ height: "100%", width: `${Math.max(3, s.share * 100)}%`, borderRadius: 4, background: colour }} />
              </div>
              <div style={{ fontFamily: FONT_BODY, fontSize: 11.5, color: COLORS.inkSoft, marginTop: 3 }}>
                {Math.round(s.share * 100)}% of the total{s.sector ? ` · ${s.sector}` : ""}{s.count > 1 ? ` · ${s.count} entries` : ""}
              </div>
            </li>
          );
        })}
      </ul>
      {profile.sources > top.length && (
        <div style={{ fontFamily: FONT_BODY, fontSize: 12, color: COLORS.inkSoft, marginTop: 10 }}>And {profile.sources - top.length} smaller {profile.sources - top.length === 1 ? "source" : "sources"}. Everything is listed under the Donations tab.</div>
      )}
      <div style={{ fontFamily: FONT_BODY, fontSize: 11.5, color: COLORS.inkSoft, lineHeight: 1.5, marginTop: 10 }}>
        Only entries with a named source and a value are counted. Tap a name to trace it. A declared interest is not evidence of influence.
      </div>
    </CardShell>
  );
}

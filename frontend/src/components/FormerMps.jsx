import { useState, useEffect, useMemo } from "react";
import { supabase } from "../supabaseClient";
import { COLORS, FONT_DISPLAY, FONT_BODY, PAGE_PADDING } from "../theme";
import { partyColour, formatDate } from "../lib/format";
import { PageHeader } from "./shared";
import { IconFormerMP } from "./icons";

const REASON_COLOR = {
  "Resigned": "#B08A2E",
  "Did not return at the next election": COLORS.inkSoft,
  "Death": "#6B5B95",
};

function Avatar({ url, name, color }) {
  const [loaded, setLoaded] = useState(false);
  const [errored, setErrored] = useState(false);
  if (!url || errored) {
    return (
      <div style={{ width: 44, height: 44, borderRadius: "50%", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", background: color, color: "#fff", fontFamily: FONT_DISPLAY, fontSize: 15, fontWeight: 600 }}>
        {name?.split(/\s+/).map((w) => w[0]).slice(-2).join("").toUpperCase()}
      </div>
    );
  }
  return (
    <div style={{ width: 44, height: 44, borderRadius: "50%", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", background: COLORS.paperCard, border: `1px solid ${COLORS.hairline}` }}>
      <img
        src={url}
        alt=""
        onLoad={() => setLoaded(true)}
        onError={() => setErrored(true)}
        style={{ width: 39, height: 39, borderRadius: "50%", objectFit: "cover", objectPosition: "center top", opacity: loaded ? 1 : 0, transition: "opacity 0.25s ease" }}
      />
    </div>
  );
}

export default function FormerMps() {
  const [mps, setMps] = useState(null);
  const [query, setQuery] = useState("");

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from("former_mps")
        .select("*")
        .order("membership_end_date", { ascending: false });
      setMps(data ?? []);
    }
    load();
  }, []);

  const filtered = useMemo(() => {
    if (!mps) return [];
    const q = query.trim().toLowerCase();
    if (!q) return mps;
    return mps.filter((m) => m.name?.toLowerCase().includes(q) || m.constituency?.toLowerCase().includes(q) || m.party?.toLowerCase().includes(q));
  }, [mps, query]);

  return (
    <div style={{ maxWidth: 820, margin: "0 auto", padding: PAGE_PADDING }}>
      <PageHeader
        icon={IconFormerMP}
        kicker="Public Record · Former MPs"
        title="Who's recently left Parliament"
        subtitle="The most recent MPs to leave the Commons — by resignation, at a general election, or death — pulled daily from the official record."
      />

      <div
        style={{
          background: COLORS.paperCard, border: `1px solid ${COLORS.hairline}`, borderRadius: 12, padding: "14px 18px",
          marginTop: 24, marginBottom: 24, fontFamily: FONT_BODY, fontSize: 13, lineHeight: 1.6, color: COLORS.inkSoft,
        }}
      >
        This shows <em>that</em> someone left and Parliament's own recorded reason for it — it can't tell you what
        they went on to do afterwards. There's no reliable, automatically-updating source for that, so rather than
        guess, we've simply left it out.
      </div>

      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search by name, constituency, or party"
        style={{
          width: "100%", maxWidth: 420, boxSizing: "border-box", marginBottom: 20, padding: "12px 16px",
          fontFamily: FONT_BODY, fontSize: 15, border: `1px solid ${COLORS.hairline}`, borderRadius: 10,
          background: COLORS.paperCard, color: COLORS.ink,
        }}
      />

      {mps === null && <div style={{ fontFamily: FONT_BODY, color: COLORS.inkSoft }}>Loading…</div>}
      {mps !== null && filtered.length === 0 && (
        <div style={{ fontFamily: FONT_BODY, fontSize: 13.5, color: COLORS.inkSoft }}>
          {mps.length === 0 ? "No data yet — check back after the next daily update." : "No one matches that search."}
        </div>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
        {filtered.map((m) => {
          const color = partyColour(m.party_colour, COLORS.inkSoft);
          const reasonColor = REASON_COLOR[m.membership_end_reason] ?? COLORS.inkSoft;
          return (
            <div key={m.parliament_member_id} style={{ display: "flex", alignItems: "center", gap: 14, padding: "12px 0", borderBottom: `1px solid ${COLORS.hairline}` }}>
              <Avatar url={m.thumbnail_url} name={m.name} color={color} />
              <div style={{ minWidth: 0, flex: 1 }}>
                <div style={{ fontFamily: FONT_BODY, fontWeight: 600, fontSize: 14.5, color: COLORS.ink }}>{m.name}</div>
                <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 2 }}>
                  <span style={{ width: 6, height: 6, borderRadius: "50%", background: color, flexShrink: 0 }} />
                  <span style={{ fontFamily: FONT_BODY, fontSize: 12.5, color: COLORS.inkSoft, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {m.party} · {m.constituency}
                  </span>
                </div>
              </div>
              <div style={{ textAlign: "right", flexShrink: 0 }}>
                <div style={{ fontFamily: FONT_BODY, fontSize: 12.5, color: COLORS.ink }}>{formatDate(m.membership_end_date)}</div>
                <div style={{ fontFamily: FONT_BODY, fontSize: 11, fontWeight: 700, color: reasonColor, marginTop: 2 }}>{m.membership_end_reason}</div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

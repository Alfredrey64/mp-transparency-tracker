import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "../supabaseClient";
import { COLORS, FONT_DISPLAY, FONT_BODY, FONT_MONO, PAGE_PADDING } from "../theme";
import { partyColour } from "../lib/format";
import { isTrackedParty, findManifesto } from "../data/partyManifestos";
import { PageHeader } from "./shared";
import { IconManifesto } from "./icons";

// The SNP's official registered colour is a very bright, saturated yellow
// that's hard to read as text/borders and clashes with the rest of the
// palette — swap it for the app's existing muted gold token, which still
// reads unmistakably as "SNP yellow" without the glare.
const PARTY_COLOR_OVERRIDES = {
  "Scottish National Party": COLORS.gold,
};

// The party-colour dot is the only element that shares a layoutId between
// the grid card and the modal — like the CommonsBadge morph elsewhere in
// this app, it's a small, fixed-proportion shape with no text in it, so the
// FLIP animation is just a clean move/scale. The modal itself doesn't try to
// morph from the card's shape (a full-size shared layout across two very
// different aspect ratios is what caused the "stretched text" look before);
// it just pops in with a scale/fade spring, which reads as smooth without
// the fragility of animating a huge shape change.
function PartyDot({ layoutId, color, size = 10 }) {
  return (
    <motion.span
      layout
      layoutId={layoutId}
      transition={{ type: "spring", stiffness: 350, damping: 30 }}
      style={{ width: size, height: size, borderRadius: "50%", background: color, flexShrink: 0 }}
    />
  );
}

function useParties() {
  const [parties, setParties] = useState(null);

  useEffect(() => {
    async function load() {
      const { data } = await supabase.from("politicians").select("party, party_colour");
      const map = new Map();
      for (const p of data ?? []) {
        if (!p.party || !isTrackedParty(p.party)) continue;
        // Group parties that share a manifesto (e.g. "Labour" and "Labour
        // (Co-op)" both stand on Labour's manifesto) into one card, keyed
        // by whichever party name in the group we see first.
        const manifesto = findManifesto(p.party);
        const groupKey = manifesto?.key ?? p.party;
        if (!map.has(groupKey)) {
          const rawColor = partyColour(p.party_colour, COLORS.inkSoft);
          map.set(groupKey, { name: p.party, color: PARTY_COLOR_OVERRIDES[p.party] ?? rawColor, seats: 0 });
        }
        map.get(groupKey).seats += 1;
      }
      setParties([...map.values()].sort((a, b) => b.seats - a.seats));
    }
    load();
  }, []);

  return parties;
}

export default function PartyPolicies() {
  const parties = useParties();
  const [expandedName, setExpandedName] = useState(null);

  useEffect(() => {
    if (!expandedName) return;
    function onKey(e) {
      if (e.key === "Escape") setExpandedName(null);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [expandedName]);

  const expanded = parties?.find((p) => p.name === expandedName) ?? null;
  const expandedManifesto = expanded ? findManifesto(expanded.name) : null;

  return (
    <div style={{ maxWidth: 1080, margin: "0 auto", padding: PAGE_PADDING }}>
      <PageHeader
        icon={IconManifesto}
        kicker="Public Record · Party Policies"
        title="Where each party stands"
        subtitle="A plain-language summary of each party's most recent UK general election manifesto (2024). These are our own summaries, not the original documents — click into a party for more detail, or follow the link to read their manifesto in full."
      />

      {parties === null ? (
        <div style={{ fontFamily: FONT_BODY, fontSize: 14, color: COLORS.inkSoft, marginTop: 24 }}>Loading…</div>
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
            gap: 18,
            marginTop: 28,
          }}
        >
          {parties.map((party) => {
            const manifesto = findManifesto(party.name);
            return (
              <motion.div
                key={party.name}
                onClick={() => setExpandedName(party.name)}
                whileHover={{ y: -3 }}
                transition={{ duration: 0.15 }}
                style={{
                  cursor: "pointer",
                  borderRadius: 18,
                  background: COLORS.paperCard,
                  border: `1px solid ${party.color}45`,
                  borderTop: `4px solid ${party.color}`,
                  boxShadow: "0 1px 4px rgba(20,30,32,0.06)",
                  padding: "20px 20px 18px",
                }}
              >
                <PartyCardHeader party={party} manifesto={manifesto} dotLayoutId={`party-dot-${party.name}`} />
                {manifesto ? (
                  <ul style={{ margin: "16px 0 0", padding: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: 10 }}>
                    {manifesto.highlights.slice(0, 4).map((h, i) => (
                      <BulletLine key={i} color={party.color}>{h}</BulletLine>
                    ))}
                  </ul>
                ) : (
                  <div style={{ fontFamily: FONT_BODY, fontSize: 13.5, color: COLORS.inkSoft, marginTop: 16, lineHeight: 1.6 }}>
                    No manifesto summary published for this party yet.
                  </div>
                )}
                <div
                  style={{
                    display: "inline-flex", alignItems: "center", gap: 5, fontFamily: FONT_BODY, fontSize: 12.5, fontWeight: 700,
                    color: party.color, marginTop: 18, padding: "6px 12px", borderRadius: 999, background: `${party.color}14`,
                  }}
                >
                  {manifesto ? "View full details" : "Search official sources"} <span aria-hidden>→</span>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      <AnimatePresence>
        {expanded && (
          <>
            <motion.div
              key="backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={() => setExpandedName(null)}
              style={{ position: "fixed", inset: 0, background: "rgba(10,16,18,0.55)", zIndex: 80 }}
            />
            <div
              style={{
                position: "fixed", inset: 0, zIndex: 81, display: "flex",
                alignItems: "center", justifyContent: "center", padding: 20, pointerEvents: "none",
              }}
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.94, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.96, y: 6, transition: { duration: 0.15 } }}
                transition={{ type: "spring", stiffness: 340, damping: 32 }}
                style={{
                  position: "relative",
                  width: "min(720px, 100%)",
                  maxHeight: "86vh",
                  overflowY: "auto",
                  pointerEvents: "auto",
                  borderRadius: 18,
                  background: COLORS.paperCard,
                  border: `1px solid ${expanded.color}45`,
                  borderTop: `4px solid ${expanded.color}`,
                  boxShadow: "0 20px 60px rgba(10,16,18,0.35)",
                  padding: "28px 30px 32px",
                }}
              >
                <button
                  onClick={() => setExpandedName(null)}
                  aria-label="Close"
                  style={{
                    position: "absolute", top: 18, right: 18, width: 30, height: 30, borderRadius: "50%",
                    border: `1px solid ${COLORS.hairline}`, background: COLORS.paperCard, color: COLORS.inkSoft,
                    cursor: "pointer", fontSize: 15, lineHeight: "28px", textAlign: "center", padding: 0,
                  }}
                >
                  ✕
                </button>
                <PartyCardHeader party={expanded} manifesto={expandedManifesto} dotLayoutId={`party-dot-${expanded.name}`} large />
                {expandedManifesto ? (
                  <>
                    <ul style={{ margin: "22px 0 0", padding: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: 11 }}>
                      {expandedManifesto.highlights.map((h, i) => (
                        <BulletLine key={i} color={expanded.color}>{h}</BulletLine>
                      ))}
                    </ul>
                    {expandedManifesto.sections?.length > 0 && (
                      <div style={{ marginTop: 24, display: "flex", flexDirection: "column", gap: 18 }}>
                        {expandedManifesto.sections.map((section) => (
                          <div key={section.heading}>
                            <div
                              style={{
                                fontFamily: FONT_MONO, fontSize: 11, fontWeight: 700, textTransform: "uppercase",
                                letterSpacing: "0.07em", color: expanded.color, marginBottom: 8,
                              }}
                            >
                              {section.heading}
                            </div>
                            <ul style={{ margin: 0, padding: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: 8 }}>
                              {section.points.map((pt, i) => (
                                <BulletLine key={i} small color={expanded.color}>{pt}</BulletLine>
                              ))}
                            </ul>
                          </div>
                        ))}
                      </div>
                    )}
                    <div style={{ marginTop: 26, paddingTop: 18, borderTop: `1px solid ${COLORS.hairline}` }}>
                      <a
                        href={expandedManifesto.manifestoUrl}
                        target="_blank"
                        rel="noreferrer"
                        style={{ fontFamily: FONT_BODY, fontWeight: 600, fontSize: 13.5, color: expanded.color }}
                      >
                        Read the full "{expandedManifesto.manifestoTitle}" manifesto ↗
                      </a>
                      <div style={{ fontFamily: FONT_BODY, fontSize: 11.5, color: COLORS.inkSoft, marginTop: 8, lineHeight: 1.5 }}>
                        This is our own plain-language summary of {expandedManifesto.shortName}'s {expandedManifesto.manifestoYear} general
                        election manifesto, not the original text. Policy positions can change once a party is in government or as events
                        unfold — check the link above for the party's current official position.
                      </div>
                    </div>
                  </>
                ) : (
                  <div style={{ fontFamily: FONT_BODY, fontSize: 13.5, color: COLORS.inkSoft, marginTop: 16, lineHeight: 1.6 }}>
                    We haven't published a manifesto summary for this party yet. Check{" "}
                    <a
                      href={`https://www.google.com/search?q=${encodeURIComponent(expanded.name + " UK general election manifesto")}`}
                      target="_blank"
                      rel="noreferrer"
                      style={{ color: expanded.color, fontWeight: 600 }}
                    >
                      their official manifesto ↗
                    </a>{" "}
                    directly.
                  </div>
                )}
              </motion.div>
            </div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

function PartyCardHeader({ party, manifesto, dotLayoutId, large }) {
  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <PartyDot layoutId={dotLayoutId} color={party.color} size={large ? 14 : 10} />
        <div style={{ fontFamily: FONT_DISPLAY, fontSize: large ? 27 : 19, fontWeight: 500, color: COLORS.ink, lineHeight: 1.2 }}>
          {manifesto?.shortName ?? party.name}
        </div>
      </div>
      <div
        style={{
          display: "inline-block", fontFamily: FONT_BODY, fontSize: 11.5, fontWeight: 600, color: COLORS.inkSoft,
          marginTop: 8, padding: "3px 10px", borderRadius: 999, background: COLORS.paper,
        }}
      >
        {party.seats} {party.seats === 1 ? "seat" : "seats"} in the Commons
      </div>
    </div>
  );
}

function BulletLine({ children, small, color = COLORS.brass }) {
  return (
    <li style={{ display: "flex", gap: 9, alignItems: "flex-start" }}>
      <svg width={small ? 14 : 15} height={small ? 14 : 15} viewBox="0 0 20 20" fill="none" style={{ flexShrink: 0, marginTop: small ? 1.5 : 2 }}>
        <circle cx="10" cy="10" r="10" fill={`${color}1c`} />
        <path d="M6 10.2 8.7 13 14 7.5" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      <span style={{ fontFamily: FONT_BODY, fontSize: small ? 13.5 : 14.5, color: COLORS.ink, lineHeight: 1.6 }}>{children}</span>
    </li>
  );
}

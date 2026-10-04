import { useState, useEffect, useMemo } from "react";
import ShareButton from "./ShareButton";
import { rebelsShareSpec } from "../lib/shareSpecs";
import { supabase } from "../supabaseClient";
import { fetchAllRows } from "../lib/supabasePagination";
import { COLORS, FONT_BODY, PAGE_PADDING, numeric } from "../theme";
import { partyColour, formatDate } from "../lib/format";
import { computeRebels, MIN_VOTES } from "../lib/rebels";
import { explainDivision } from "../lib/divisionExplainer";
import { fmt, pct1, byName, goMp } from "../lib/numbersFormat";
import { PageHeader, LoadFailedNote } from "./shared";
import { IconSplit } from "./icons";
import { Tile, Figure } from "./NumbersKit";
import BarRow from "./BarRow";
import MembersModal from "./MembersModal";

// Who votes against their own party, and on what. It reuses the layout and the
// tap-to-see-who pop-up from Parliament in Numbers. The numbers come from the
// same voting records as the Rankings page; "against" means against the
// majority of the MP's own party, which is the closest thing to a rebellion
// the public record allows, since whip instructions are never published.

const SHOWN_DIVISIONS = 8;

const toMember = (p, extra = {}) => ({
  id: p.id,
  mid: p.id,
  name: p.name,
  party: p.party ?? "Unknown",
  colour: p.party_colour,
  constituency: p.constituency,
  thumbnail: p.thumbnail_url,
  ...extra,
});

export default function Rebels({ onNavigate }) {
  const [politicians, setPoliticians] = useState(null);
  const [votes, setVotes] = useState(null);
  const [failed, setFailed] = useState(false);
  const [showAll, setShowAll] = useState(false);
  const [panel, setPanel] = useState(null);

  useEffect(() => {
    Promise.all([
      fetchAllRows(() => supabase.from("politicians").select("id, name, party, party_colour, constituency, thumbnail_url")),
      fetchAllRows(() => supabase.from("voting_records").select("politician_id, division_id, title, date, voted_aye, aye_count, no_count, voted_with_party_majority")),
    ])
      .then(([p, v]) => {
        setPoliticians(p);
        setVotes(v);
      })
      .catch(() => setFailed(true));
  }, []);

  const r = useMemo(() => (politicians && votes ? computeRebels(votes, politicians) : null), [politicians, votes]);

  function show(e, title, note, list, badge) {
    setPanel({ title, note, list, badge, opener: e?.currentTarget ?? null });
  }

  const topMps = r?.byMp.slice(0, 10) ?? [];
  const maxPct = Math.max(1, ...topMps.map((m) => m.pct));
  const maxPartyPct = Math.max(1, ...(r?.byParty ?? []).map((p) => p.pct));
  const divisions = r ? (showAll ? r.rebelDivisions : r.rebelDivisions.slice(0, SHOWN_DIVISIONS)) : [];

  return (
    <div style={{ maxWidth: 1040, margin: "0 auto", padding: PAGE_PADDING }}>
      <PageHeader
        icon={IconSplit}
        kicker="MP Accountability · Rebels"
        title="Who votes against their own party"
        subtitle="Most MPs vote with the majority of their party almost every time. This page shows the exceptions: who breaks ranks, which parties split most, and which votes caused the biggest rebellions."
      />

      {!r && !failed && <div style={{ fontFamily: FONT_BODY, fontSize: 13.5, color: COLORS.inkSoft, marginTop: 24 }}>Loading votes…</div>}
      {failed && <div style={{ marginTop: 24 }}><LoadFailedNote item="the voting records" /></div>}

      {r && r.countedVotes === 0 && <div style={{ fontFamily: FONT_BODY, fontSize: 13.5, color: COLORS.inkSoft, marginTop: 24 }}>No recorded votes to work from yet.</div>}

      {r && r.countedVotes > 0 && (
        <div style={{ marginTop: 18 }}>
          <ShareButton filename="who-votes-against-their-party" label="Share this as an image" getSpec={() => rebelsShareSpec({ r, link: window.location.href })} />
        </div>
      )}

      {r && r.countedVotes > 0 && (
        <div className="bento" style={{ marginTop: 26 }}>
          <div className="bento-grid">
            <Tile span="s4" edge="change" title="At a glance" note="Votes by MPs in a party, since records began on this site.">
              <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
                <Figure value={r.rebelVotes} format={(n) => fmt(Math.round(n))} label="votes against the party" note={`${pct1(r.rebelPct)} of ${fmt(r.countedVotes)} votes`} />
                <Figure
                  value={r.mpsWhoRebelled}
                  format={(n) => fmt(Math.round(n))}
                  label="MPs have rebelled at least once"
                  note={`of ${fmt(r.mpsCounted)} MPs in a party`}
                  onOpen={(e) => {
                    const tally = new Map();
                    for (const d of r.rebelDivisions) for (const x of d.rebels) tally.set(x.politician.id, { p: x.politician, n: (tally.get(x.politician.id)?.n ?? 0) + 1 });
                    const list = [...tally.values()].sort((a, b) => b.n - a.n || byName(a.p, b.p)).map((t) => toMember(t.p, { n: t.n }));
                    show(e, "MPs who have rebelled", "Voted against the majority of their own party at least once.", list, (m) => `${m.n} time${m.n === 1 ? "" : "s"}`);
                  }}
                />
                <Figure value={r.divisionsWithRebels} format={(n) => fmt(Math.round(n))} label="votes had a rebel" note={`of ${fmt(r.divisionsCounted)} votes counted`} />
              </div>
            </Tile>

            <Tile span="s8" edge="change" title="Who rebels most" delay={0.05} note={`Share of an MP's votes cast against their own party. Only MPs with ${MIN_VOTES} or more recorded votes are ranked, so one odd vote can't make a rebel. Tap a name for their profile.`}>
              {topMps.length === 0 && <div style={{ fontFamily: FONT_BODY, fontSize: 13.5, color: COLORS.inkSoft }}>Nobody with enough votes has voted against their party yet.</div>}
              {topMps.map((m, i) => (
                <BarRow
                  key={m.politician.id}
                  label={m.politician.name}
                  color={partyColour(m.politician.party_colour, COLORS.inkSoft)}
                  fraction={m.pct / maxPct}
                  valueText={pct1(m.pct)}
                  detail={`${m.against}/${m.total}`}
                  labelWidth={190}
                  valueWidth={110}
                  delay={i * 0.04}
                  onClick={() => goMp(m.politician.id)}
                />
              ))}
              <div style={{ fontFamily: FONT_BODY, fontSize: 11.5, color: COLORS.inkSoft, marginTop: 6 }}>
                The full list of every MP's rebellion rate is on the{" "}
                <button type="button" onClick={() => onNavigate?.("rankings")} style={{ background: "none", border: "none", padding: 0, cursor: "pointer", font: "inherit", fontWeight: 700, color: COLORS.accent }}>Rankings page</button>.
              </div>
            </Tile>

            <Tile span="s5" edge="seats" title="Which parties split most" note="Share of each party's votes cast against its own majority (parties with five or more MPs). Tap a party to see its rebels.">
              {r.byParty.map((p, i) => (
                <BarRow
                  key={p.party}
                  label={p.party}
                  color={partyColour(p.colour, COLORS.inkSoft)}
                  fraction={p.pct / maxPartyPct}
                  valueText={pct1(p.pct)}
                  detail={`${p.rebels} MP${p.rebels === 1 ? "" : "s"}`}
                  labelWidth={150}
                  valueWidth={118}
                  delay={i * 0.04}
                  onClick={(e) => {
                    const tally = new Map();
                    for (const d of r.rebelDivisions) for (const x of d.rebels) if ((String(x.politician.party ?? "Unknown").replace(/\s*\(Co-op\)\s*$/i, "")) === p.party) tally.set(x.politician.id, { p: x.politician, n: (tally.get(x.politician.id)?.n ?? 0) + 1 });
                    const list = [...tally.values()].sort((a, b) => b.n - a.n || byName(a.p, b.p)).map((t) => toMember(t.p, { n: t.n }));
                    show(e, `${p.party} rebels`, "Have voted against the majority of their own party.", list, (m) => `${m.n} time${m.n === 1 ? "" : "s"}`);
                  }}
                />
              ))}
              {r.byParty.length === 0 && <div style={{ fontFamily: FONT_BODY, fontSize: 13.5, color: COLORS.inkSoft }}>Not enough votes yet.</div>}
            </Tile>

            <Tile span="s7" edge="people" title="The biggest rebellions" delay={0.05} note="The votes where the most MPs went against their own party. A split across several parties is usually a free vote, where MPs choose for themselves. Tap one to see who.">
              {divisions.map((d, i) => {
                const ex = explainDivision(d.title);
                const name = ex?.headline ?? d.title;
                return (
                  <button
                    key={d.id}
                    type="button"
                    className="nclick"
                    onClick={(e) =>
                      show(
                        e,
                        name,
                        `${formatDate(d.date)} · ${d.ayes} Aye, ${d.noes} No`,
                        d.rebels.map((x) => toMember(x.politician, { aye: x.votedAye })).sort(byName),
                        (m) => `Voted ${m.aye ? "Aye" : "No"}`
                      )
                    }
                    style={{ display: "grid", gridTemplateColumns: "28px minmax(0, 1fr) auto", gap: 10, alignItems: "center", width: "100%", textAlign: "left", background: "none", border: "none", borderTop: i === 0 ? "none" : `1px solid ${COLORS.hairline}`, borderRadius: 0, padding: "10px 4px", color: "inherit" }}
                  >
                    <span style={{ ...numeric, fontSize: 12, color: COLORS.inkSoft }}>{i + 1}</span>
                    <span style={{ minWidth: 0 }}>
                      <span style={{ display: "block", fontFamily: FONT_BODY, fontSize: 13.5, fontWeight: 600, color: COLORS.ink, lineHeight: 1.35 }}>{name}</span>
                      {ex?.headline && ex.headline !== d.title && (
                        <span style={{ display: "block", fontFamily: FONT_BODY, fontSize: 11.5, color: COLORS.inkSoft, marginTop: 2, lineHeight: 1.4 }}>{d.title}</span>
                      )}
                      <span style={{ display: "block", fontFamily: FONT_BODY, fontSize: 12, color: COLORS.inkSoft, marginTop: 2 }}>
                        {formatDate(d.date)} · {d.parties.map((p) => `${p.count} ${p.party}`).join(", ")}
                      </span>
                    </span>
                    <span style={{ textAlign: "right" }}>
                      <span style={{ display: "block", ...numeric, fontSize: 20, fontWeight: 700, color: "#C2415D", lineHeight: 1 }}>{d.rebels.length}</span>
                      <span style={{ display: "block", fontFamily: FONT_BODY, fontSize: 11, color: COLORS.inkSoft }}>rebel{d.rebels.length === 1 ? "" : "s"}</span>
                    </span>
                  </button>
                );
              })}
              {r.rebelDivisions.length > SHOWN_DIVISIONS && (
                <button type="button" onClick={() => setShowAll((v) => !v)} style={{ marginTop: 10, background: "none", border: "none", padding: 0, cursor: "pointer", fontFamily: FONT_BODY, fontSize: 12.5, fontWeight: 700, color: COLORS.accent }}>
                  {showAll ? "Show fewer" : `Show all ${r.rebelDivisions.length} votes with a rebel`}
                </button>
              )}
            </Tile>

            <Tile span="s12" edge="people" title="How to read this" delay={0.05}>
              <p style={{ fontFamily: FONT_BODY, fontSize: 13.5, lineHeight: 1.7, color: COLORS.inkSoft, margin: 0, maxWidth: 760 }}>
                A rebel here is an MP who voted against the majority of their own party in a recorded vote. A party's whip tells its MPs how to vote, but those instructions are never
                published, so this is our best available proxy and not a claim about what any MP was told. Some of these are free votes, where MPs are allowed to vote as they choose,
                and an MP who abstains is not counted as a rebel. Independents and the Speaker sit under no party whip, so they are left out. Voting records come from Parliament's
                Commons Votes service. To see every vote one MP has cast, open their profile or the{" "}
                <button type="button" onClick={() => onNavigate?.("voting")} style={{ background: "none", border: "none", padding: 0, cursor: "pointer", font: "inherit", fontWeight: 700, color: COLORS.accent }}>Voting Records page</button>.
              </p>
            </Tile>
          </div>
        </div>
      )}

      {panel && <MembersModal title={panel.title} note={panel.note} members={panel.list} badge={panel.badge} returnFocusTo={panel.opener} onClose={() => setPanel(null)} />}
    </div>
  );
}

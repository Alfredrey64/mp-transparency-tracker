import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "../supabaseClient";
import { COLORS, FONT_DISPLAY, FONT_BODY, FONT_MONO, PAGE_PADDING } from "../theme";
import { PageHeader } from "./shared";
import { GlossaryTerm } from "./GlossaryTerm";
import { partyColour, formatDate } from "../lib/format";
import { getDonorSector, sectorColor } from "../lib/donorSectors";
import { IconCompare, IconSearch, IconCoin, IconVote, IconBriefcase } from "./icons";

const MAX_COMPARE = 3;
const NO_PARTY_MAJORITY_CONCEPT = ["independent", "speaker"];
const PALETTE = ["#5A7FA6", "#B5533C", "#3F7D5C"];

function colorFor(politician, index) {
  return partyColour(politician.party_colour, PALETTE[index % PALETTE.length]);
}

function Avatar({ url, name, color, size = 56 }) {
  const [loaded, setLoaded] = useState(false);
  const [errored, setErrored] = useState(false);
  if (!url || errored) {
    return (
      <div
        style={{
          width: size, height: size, borderRadius: "50%", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center",
          background: color, color: "#fff", fontFamily: FONT_DISPLAY, fontSize: size * 0.34, fontWeight: 600,
        }}
      >
        {name?.split(/\s+/).map((w) => w[0]).slice(-2).join("").toUpperCase()}
      </div>
    );
  }
  return (
    <div style={{ width: size, height: size, borderRadius: "50%", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", background: COLORS.paperCard, border: `1px solid ${COLORS.hairline}`, overflow: "hidden" }}>
      <img
        src={url}
        alt=""
        onLoad={() => setLoaded(true)}
        onError={() => setErrored(true)}
        style={{ width: Math.round(size * 0.72), height: Math.round(size * 0.72), borderRadius: "50%", objectFit: "cover", objectPosition: "center", opacity: loaded ? 1 : 0, transition: "opacity 0.25s ease" }}
      />
    </div>
  );
}

// Money and voting data for each selected MP, fetched fresh whenever the
// selection changes. Kept separate from the `politicians` row itself (which
// already carries ipsa_expenses) because financial_interests and
// voting_records both need their own per-MP query.
function useComparisonData(politicianIds) {
  const [data, setData] = useState({});
  const key = politicianIds.join(",");

  useEffect(() => {
    let cancelled = false;
    async function load() {
      if (politicianIds.length === 0) {
        if (!cancelled) setData({});
        return;
      }
      const entries = await Promise.all(
        politicianIds.map(async (id) => {
          const [interestsRes, votesRes] = await Promise.all([
            supabase.from("financial_interests").select("donor_name, value_amount").eq("politician_id", id).not("value_amount", "is", null),
            supabase
              .from("voting_records")
              .select("division_id, title, date, voted_aye, voted_with_party_majority, source_url, aye_count, no_count")
              .eq("politician_id", id)
              .order("date", { ascending: false })
              .limit(80),
          ]);
          const interests = interestsRes.data ?? [];
          const totalDonations = interests.reduce((sum, r) => sum + (r.value_amount ?? 0), 0);

          const bySector = new Map();
          for (const r of interests) {
            const tag = getDonorSector(r.donor_name);
            if (!tag) continue;
            bySector.set(tag.sector, (bySector.get(tag.sector) ?? 0) + r.value_amount);
          }
          const sectors = [...bySector.entries()]
            .map(([sector, total]) => ({ sector, total }))
            .sort((a, b) => b.total - a.total);

          return [id, { donationCount: interests.length, totalDonations, sectors, votes: votesRes.data ?? [] }];
        })
      );
      if (!cancelled) setData(Object.fromEntries(entries));
    }
    load();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  return data;
}

// With one MP selected, just their own recent votes. With two or more,
// narrowed down to Commons divisions where every selected MP actually has a
// recorded vote — so "agreed" or "split" is a real comparison, not two
// unrelated votes shown side by side.
function useVoteComparisons(selected, data) {
  return useMemo(() => {
    if (selected.length === 0) return [];
    if (selected.length === 1) {
      const votes = data[selected[0].id]?.votes ?? [];
      return votes.slice(0, 8).map((v) => ({
        divisionId: v.division_id, title: v.title, date: v.date, source_url: v.source_url,
        aye_count: v.aye_count, no_count: v.no_count, perMp: [v],
      }));
    }
    const maps = selected.map((p) => new Map((data[p.id]?.votes ?? []).map((v) => [v.division_id, v])));
    if (maps.some((m) => m.size === 0)) return [];
    const [base] = maps;
    const shared = [];
    for (const [divisionId, baseVote] of base) {
      const perMp = maps.map((m) => m.get(divisionId));
      if (perMp.every(Boolean)) {
        shared.push({
          divisionId, title: baseVote.title, date: baseVote.date, source_url: baseVote.source_url,
          aye_count: baseVote.aye_count, no_count: baseVote.no_count, perMp,
        });
      }
    }
    return shared.sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 8);
  }, [selected, data]);
}

function SearchPicker({ politicians, selectedIds, onAdd, disabled }) {
  const [query, setQuery] = useState("");
  const matches = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (q.length < 2) return [];
    return politicians
      .filter((p) => !selectedIds.includes(p.id))
      .filter((p) => p.name?.toLowerCase().includes(q) || p.constituency?.toLowerCase().includes(q) || p.party?.toLowerCase().includes(q))
      .slice(0, 6);
  }, [politicians, query, selectedIds]);

  return (
    <div style={{ position: "relative", maxWidth: 420 }}>
      <div style={{ position: "relative" }}>
        <span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: COLORS.inkSoft, display: "flex" }}>
          <IconSearch size={15} />
        </span>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          disabled={disabled}
          placeholder={disabled ? `Up to ${MAX_COMPARE} MPs at once` : "Search by name or constituency to add an MP…"}
          style={{
            width: "100%", boxSizing: "border-box", padding: "11px 14px 11px 36px", fontFamily: FONT_BODY, fontSize: 13.5,
            border: `1px solid ${COLORS.hairline}`, borderRadius: 10, background: disabled ? COLORS.paper : COLORS.paperCard,
            color: COLORS.ink, opacity: disabled ? 0.6 : 1,
          }}
        />
      </div>
      {matches.length > 0 && (
        <div style={{ position: "absolute", top: "calc(100% + 6px)", left: 0, right: 0, zIndex: 10, background: COLORS.paperCard, border: `1px solid ${COLORS.hairline}`, borderRadius: 10, boxShadow: "0 10px 24px rgba(30,42,68,0.12)", padding: 6, maxHeight: 320, overflowY: "auto" }}>
          {matches.map((p) => {
            const color = partyColour(p.party_colour, COLORS.inkSoft);
            return (
              <button
                key={p.id}
                onClick={() => { onAdd(p); setQuery(""); }}
                style={{ display: "flex", alignItems: "center", gap: 8, width: "100%", background: "none", border: "none", padding: "8px", borderRadius: 7, cursor: "pointer", textAlign: "left" }}
                onMouseEnter={(e) => { e.currentTarget.style.background = COLORS.paper; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
              >
                <span style={{ width: 6, height: 6, borderRadius: "50%", background: color, flexShrink: 0 }} />
                <span style={{ minWidth: 0 }}>
                  <div style={{ fontFamily: FONT_BODY, fontSize: 13, color: COLORS.ink, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.name}</div>
                  <div style={{ fontFamily: FONT_BODY, fontSize: 11.5, color: COLORS.inkSoft }}>{p.party} · {p.constituency}</div>
                </span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

function MiniField({ label, value }) {
  return (
    <div>
      <div style={{ fontFamily: FONT_BODY, fontSize: 11, fontWeight: 700, color: COLORS.inkSoft, textTransform: "uppercase", letterSpacing: "0.05em" }}>
        {label}
      </div>
      <div style={{ fontFamily: FONT_BODY, fontSize: 13, color: COLORS.ink }}>{value}</div>
    </div>
  );
}

function MpHeaderCard({ politician, color, onRemove }) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.96 }}
      transition={{ duration: 0.25 }}
      style={{ background: COLORS.paperCard, border: `1px solid ${COLORS.hairline}`, borderTop: `4px solid ${color}`, borderRadius: 14, padding: 16, minWidth: 0 }}
    >
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 8 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
          <Avatar url={politician.thumbnail_url} name={politician.name} color={color} />
          <div style={{ minWidth: 0 }}>
            <div style={{ fontFamily: FONT_DISPLAY, fontSize: 16.5, color: COLORS.ink, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {politician.name}
            </div>
            <div style={{ fontFamily: FONT_BODY, fontSize: 12, color: COLORS.inkSoft }}>{politician.party}</div>
          </div>
        </div>
        <button
          onClick={onRemove}
          aria-label={`Remove ${politician.name}`}
          style={{
            flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center",
            width: 32, height: 32, margin: -4, background: "none", border: "none",
            color: COLORS.inkSoft, cursor: "pointer", fontSize: 15, opacity: 0.6,
          }}
        >
          ×
        </button>
      </div>
      <div style={{ marginTop: 10, paddingTop: 10, borderTop: `1px solid ${COLORS.hairline}`, display: "flex", flexDirection: "column", gap: 8 }}>
        <MiniField label="Constituency" value={politician.constituency ?? "n/a"} />
        <MiniField label="Government role" value={politician.cabinet_role ?? "Backbencher"} />
      </div>
    </motion.div>
  );
}

function SectionTitle({ icon: Icon, color, children }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
      <div style={{ flexShrink: 0, width: 32, height: 32, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", background: `${color}1c`, color }}>
        <Icon size={15} />
      </div>
      <h2 style={{ fontFamily: FONT_DISPLAY, fontSize: 19, color: COLORS.ink, margin: 0 }}>{children}</h2>
    </div>
  );
}

// One labelled row per MP within a metric block — bar width is relative to
// the largest value among the MPs being compared, so the visual comparison
// is honest (a bar twice as long really does mean roughly twice the money).
function MoneyBar({ label, value, max, color, formatted }) {
  const pct = max > 0 ? Math.max((value / max) * 100, value > 0 ? 3 : 0) : 0;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 7 }}>
      <span style={{ width: 130, flexShrink: 0, fontFamily: FONT_BODY, fontSize: 12.5, color: COLORS.ink, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
        {label}
      </span>
      <div style={{ flex: 1, height: 12, borderRadius: 999, background: COLORS.paper, overflow: "hidden" }}>
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.7, ease: "easeOut" }}
          style={{ height: "100%", borderRadius: 999, background: color }}
        />
      </div>
      <span style={{ width: 96, flexShrink: 0, textAlign: "right", fontFamily: FONT_MONO, fontSize: 12.5, fontWeight: 700, color }}>
        {formatted}
      </span>
    </div>
  );
}

function MoneyMetricGroup({ title, description, rows }) {
  const max = Math.max(1, ...rows.map((r) => r.value));
  return (
    <div style={{ marginBottom: 20 }}>
      <div style={{ fontFamily: FONT_BODY, fontWeight: 700, fontSize: 13, color: COLORS.ink, marginBottom: description ? 2 : 8 }}>{title}</div>
      {description && <div style={{ fontFamily: FONT_BODY, fontSize: 11.5, color: COLORS.inkSoft, marginBottom: 8, lineHeight: 1.5 }}>{description}</div>}
      {rows.map((r) => (
        <MoneyBar key={r.name} label={r.name} value={r.value} max={max} color={r.color} formatted={r.formatted} />
      ))}
    </div>
  );
}

function SectorBreakdown({ politician, color, sectors }) {
  const [open, setOpen] = useState(false);
  const shown = open ? sectors : sectors.slice(0, 3);

  return (
    <div style={{ border: `1px solid ${COLORS.hairline}`, borderRadius: 12, padding: 14, background: COLORS.paper, minWidth: 0 }}>
      <div style={{ fontFamily: FONT_BODY, fontWeight: 700, fontSize: 12, color, marginBottom: 8, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
        {politician.name}, funding by sector
      </div>
      {sectors.length === 0 ? (
        <div style={{ fontFamily: FONT_BODY, fontSize: 12, color: COLORS.inkSoft }}>No sector-matched donations found.</div>
      ) : (
        <>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {shown.map((s) => (
              <div key={s.sector} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
                <span style={{ display: "flex", alignItems: "center", gap: 6, minWidth: 0, fontFamily: FONT_BODY, fontSize: 12, color: COLORS.ink }}>
                  <span style={{ width: 7, height: 7, borderRadius: "50%", background: sectorColor(s.sector), flexShrink: 0 }} />
                  <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{s.sector}</span>
                </span>
                <span style={{ flexShrink: 0, fontFamily: FONT_MONO, fontSize: 11.5, color: COLORS.inkSoft }}>£{Math.round(s.total).toLocaleString()}</span>
              </div>
            ))}
          </div>
          {sectors.length > 3 && (
            <button
              onClick={() => setOpen((v) => !v)}
              style={{ marginTop: 8, background: "none", border: "none", padding: 0, cursor: "pointer", fontFamily: FONT_BODY, fontSize: 11, fontWeight: 600, color }}
            >
              {open ? "Show fewer" : `Show all ${sectors.length} sectors`}
            </button>
          )}
        </>
      )}
    </div>
  );
}

function VoteCompareRow({ vote, selected }) {
  const [open, setOpen] = useState(false);
  const ayeStates = vote.perMp.map((v) => v.voted_aye);
  const agreed = selected.length > 1 && ayeStates.every((a) => a === ayeStates[0]);
  const showVerdict = selected.length > 1;

  return (
    <motion.div layout="position" style={{ border: `1px solid ${COLORS.hairline}`, borderRadius: 12, overflow: "hidden", background: COLORS.paperCard, marginBottom: 10 }}>
      <button
        onClick={() => setOpen((v) => !v)}
        style={{ display: "flex", alignItems: "center", gap: 12, width: "100%", padding: "12px 16px", background: "none", border: "none", cursor: "pointer", textAlign: "left" }}
      >
        <span style={{ flexShrink: 0, fontFamily: FONT_BODY, fontSize: 11, color: COLORS.inkSoft, width: 76 }}>{formatDate(vote.date)}</span>
        <span style={{ flex: 1, minWidth: 0, fontFamily: FONT_BODY, fontSize: 13.5, color: COLORS.ink, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {vote.title}
        </span>
        <span style={{ display: "flex", gap: 6, flexShrink: 0 }}>
          {vote.perMp.map((v, i) => (
            <span
              key={i}
              title={selected[i].name}
              style={{
                fontFamily: FONT_MONO, fontSize: 11, fontWeight: 700, textTransform: "uppercase", padding: "3px 8px", borderRadius: 999,
                background: v.voted_aye ? "#E4EEE7" : "#F3E4E2", color: v.voted_aye ? "#2F6F4E" : "#9C3B3B",
                boxShadow: `inset 0 0 0 1.5px ${colorFor(selected[i], i)}`,
              }}
            >
              {v.voted_aye ? "Aye" : "No"}
            </span>
          ))}
        </span>
        {showVerdict && (
          <span
            style={{
              flexShrink: 0, fontFamily: FONT_BODY, fontWeight: 700, fontSize: 11, textTransform: "uppercase", letterSpacing: "0.04em",
              padding: "3px 9px", borderRadius: 999, background: agreed ? `${COLORS.accent}18` : "#F3E4E2", color: agreed ? COLORS.accent : "#9C3B3B",
            }}
          >
            {agreed ? "Agreed" : "Split"}
          </span>
        )}
        <span style={{ flexShrink: 0, fontFamily: FONT_MONO, fontSize: 12, color: COLORS.inkSoft }}>{open ? "▾" : "▸"}</span>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }} style={{ overflow: "hidden" }}>
            <div style={{ padding: "0 16px 16px", borderTop: `1px solid ${COLORS.hairline}`, marginTop: -1 }}>
              <div style={{ paddingTop: 12, display: "flex", flexDirection: "column", gap: 8 }}>
                {selected.map((p, i) => {
                  const v = vote.perMp[i];
                  const hasPartyConcept = !NO_PARTY_MAJORITY_CONCEPT.includes((p.party ?? "").toLowerCase());
                  return (
                    <div key={p.id} style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", fontFamily: FONT_BODY, fontSize: 12.5 }}>
                      <span style={{ width: 8, height: 8, borderRadius: "50%", background: colorFor(p, i), flexShrink: 0 }} />
                      <span style={{ color: COLORS.ink, fontWeight: 600 }}>{p.name}</span>
                      <span style={{ color: v.voted_aye ? "#2F6F4E" : "#9C3B3B", fontWeight: 700 }}>{v.voted_aye ? "Voted Aye" : "Voted No"}</span>
                      {hasPartyConcept && v.voted_with_party_majority === false && (
                        <span style={{ color: "#9C3B3B", fontSize: 11 }}>(against their own party)</span>
                      )}
                    </div>
                  );
                })}
                <div style={{ fontFamily: FONT_BODY, fontSize: 11.5, color: COLORS.inkSoft, marginTop: 4, lineHeight: 1.5 }}>
                  Full Commons result: {vote.aye_count} Aye · {vote.no_count} No
                  {vote.source_url && (
                    <>
                      {" · "}
                      <a href={vote.source_url} target="_blank" rel="noreferrer" style={{ color: COLORS.ink, fontWeight: 600 }}>
                        source ↗
                      </a>
                    </>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// How each selected MP's career compares, from the same career file the MP
// list filters and the Parliament in Numbers page use.
function CareerCompare({ selected, careers }) {
  const year = new Date().getFullYear();
  const c = (p) => careers[p.parliament_member_id];
  const rows = (pick, format) => selected.map((p, i) => ({ name: p.name, color: colorFor(p, i), value: c(p) ? pick(c(p)) ?? 0 : 0, formatted: c(p) ? format(c(p)) : "no career record" }));
  const plural = (n, one, many) => `${n} ${n === 1 ? one : many}`;
  return (
    <div style={{ background: COLORS.paperCard, border: `1px solid ${COLORS.hairline}`, borderRadius: 16, padding: "22px clamp(16px, 4vw, 26px)", marginBottom: 20 }}>
      <SectionTitle icon={IconBriefcase} color="#1FA97C">Career</SectionTitle>
      <MoneyMetricGroup title="Time as an MP" description="Years since each MP first entered the Commons. Some have had breaks in service." rows={rows((x) => (x[0] ? year - x[0] : 0), (x) => (x[0] ? `since ${x[0]}` : "unknown"))} />
      <MoneyMetricGroup title="Elections won" description="Every general election and by-election each MP has won." rows={rows((x) => x[1], (x) => `${x[1]}`)} />
      <MoneyMetricGroup title="Government posts held" description="Ministerial jobs, now or in any past Parliament." rows={rows((x) => x[2], (x) => (x[3] ? `${x[2]} · in post now` : `${x[2]}`))} />
      <MoneyMetricGroup title="Shadow front-bench posts held" rows={rows((x) => x[4], (x) => `${x[4]}`)} />
      <MoneyMetricGroup title="Committees" description="Committees each MP has served on." rows={rows((x) => x[6], (x) => `${x[5]} now · ${x[6]} ever`)} />
      <MoneyMetricGroup title="Elections lost before winning" rows={rows((x) => x[7], (x) => plural(x[7], "loss", "losses"))} />
      <div style={{ display: "flex", flexWrap: "wrap", gap: "6px 22px", fontFamily: FONT_BODY, fontSize: 12.5, color: COLORS.inkSoft }}>
        {selected.map((p, i) => (
          <span key={p.id} style={{ color: COLORS.ink }}>
            <span style={{ display: "inline-block", width: 8, height: 8, borderRadius: "50%", background: colorFor(p, i), marginRight: 6 }} />
            {p.name}: {!c(p) ? "no career record (not a current MP)" : c(p)[8] ? `has left ${c(p)[8]}` : "no change of party recorded"}
          </span>
        ))}
      </div>
      <div style={{ fontFamily: FONT_BODY, fontSize: 12, marginTop: 10 }}>
        <span style={{ color: COLORS.inkSoft }}>Each MP's full timeline is on the Career tab of their profile.</span>
      </div>
    </div>
  );
}

export default function ComparePoliticians() {
  const [politicians, setPoliticians] = useState([]);
  const [selected, setSelected] = useState([]);
  const [careers, setCareers] = useState(null);

  useEffect(() => {
    supabase
      .from("politicians")
      .select("id, name, party, party_colour, constituency, thumbnail_url, cabinet_role, parliament_member_id, ipsa_expenses")
      .then(({ data }) => setPoliticians(data ?? []));
    import("../data/mpCareers.json").then((m) => setCareers(m.default.mps)).catch(() => setCareers(null));
  }, []);

  const selectedIds = useMemo(() => selected.map((p) => p.id), [selected]);
  const data = useComparisonData(selectedIds);
  const voteComparisons = useVoteComparisons(selected, data);

  function addPolitician(p) {
    if (selected.length >= MAX_COMPARE) return;
    setSelected((prev) => [...prev, p]);
  }

  function removePolitician(id) {
    setSelected((prev) => prev.filter((p) => p.id !== id));
  }

  return (
    <div style={{ maxWidth: 1080, margin: "0 auto", padding: PAGE_PADDING }}>
      <PageHeader
        icon={IconCompare}
        kicker="Compare MPs"
        title="Compare MPs side by side"
        subtitle={`Pick up to ${MAX_COMPARE} MPs to compare their careers, what they have declared in money (donations and IPSA business costs) and how they voted on the same issues in the Commons.`}
      />

      <div style={{ marginTop: 24, marginBottom: 24 }}>
        <SearchPicker politicians={politicians} selectedIds={selectedIds} onAdd={addPolitician} disabled={selected.length >= MAX_COMPARE} />
      </div>

      {selected.length === 0 ? (
        <div style={{ fontFamily: FONT_BODY, fontSize: 13.5, color: COLORS.inkSoft, padding: "20px 0" }}>
          Search for an MP above to start comparing.
        </div>
      ) : (
        <>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(240px, 100%), 1fr))", gap: 16, marginBottom: 24 }}>
            <AnimatePresence mode="popLayout">
              {selected.map((p, i) => (
                <MpHeaderCard key={p.id} politician={p} color={colorFor(p, i)} onRemove={() => removePolitician(p.id)} />
              ))}
            </AnimatePresence>
          </div>

          {careers && <CareerCompare selected={selected} careers={careers} />}

          <div style={{ background: COLORS.paperCard, border: `1px solid ${COLORS.hairline}`, borderRadius: 16, padding: "22px clamp(16px, 4vw, 26px)", marginBottom: 20 }}>
            <SectionTitle icon={IconCoin} color={COLORS.accent}>Money</SectionTitle>

            <MoneyMetricGroup
              title="Total declared donations"
              description="Every financial interest with a declared monetary value, from the Register of Members' Financial Interests."
              rows={selected.map((p, i) => ({
                name: p.name, color: colorFor(p, i), value: data[p.id]?.totalDonations ?? 0,
                formatted: `£${Math.round(data[p.id]?.totalDonations ?? 0).toLocaleString()}`,
              }))}
            />
            <MoneyMetricGroup
              title="Number of declared donations"
              rows={selected.map((p, i) => ({
                name: p.name, color: colorFor(p, i), value: data[p.id]?.donationCount ?? 0,
                formatted: `${data[p.id]?.donationCount ?? 0}`,
              }))}
            />
            <MoneyMetricGroup
              title={<><GlossaryTerm term="IPSA">IPSA</GlossaryTerm> business costs claimed</>}
              description="Staffing, travel, accommodation and office running costs claimed through IPSA, separate from personal donations, in the most recent reported year for each MP."
              rows={selected.map((p, i) => ({
                name: p.name, color: colorFor(p, i), value: p.ipsa_expenses?.total ?? 0,
                formatted: `£${Math.round(p.ipsa_expenses?.total ?? 0).toLocaleString()}`,
              }))}
            />

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(220px, 100%), 1fr))", gap: 14, marginTop: 4 }}>
              {selected.map((p, i) => (
                <SectorBreakdown key={p.id} politician={p} color={colorFor(p, i)} sectors={data[p.id]?.sectors ?? []} />
              ))}
            </div>
          </div>

          <div style={{ background: COLORS.paperCard, border: `1px solid ${COLORS.hairline}`, borderRadius: 16, padding: "22px clamp(16px, 4vw, 26px)" }}>
            <SectionTitle icon={IconVote} color="#5A7FA6">Recent votes</SectionTitle>
            <div style={{ fontFamily: FONT_BODY, fontSize: 12.5, color: COLORS.inkSoft, marginBottom: 14, lineHeight: 1.5 }}>
              {selected.length >= 2
                ? "The most recent Commons divisions where every selected MP has a recorded vote, so you can see whether they actually agreed. Tap any row for the full detail."
                : "Their most recent recorded Commons votes. Add a second MP above to see whether they'd have agreed."}
            </div>
            {voteComparisons.length === 0 ? (
              <div style={{ fontFamily: FONT_BODY, fontSize: 13, color: COLORS.inkSoft, padding: "12px 0" }}>
                {selected.length >= 2 ? "No overlapping recorded votes found for these MPs yet." : "No recorded votes found for this MP yet."}
              </div>
            ) : (
              voteComparisons.map((v) => <VoteCompareRow key={v.divisionId} vote={v} selected={selected} />)
            )}
          </div>
        </>
      )}
    </div>
  );
}

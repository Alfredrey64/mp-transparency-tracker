import { useState, useEffect, useMemo, lazy, Suspense } from "react";
import ShareButton from "./ShareButton";
import { seatShareSpec } from "../lib/shareSpecs";
import { motion, useReducedMotion } from "framer-motion";
import { supabase } from "../supabaseClient";
import { COLORS, FONT_BODY, FONT_DISPLAY, numeric } from "../theme";
import { formatDate, partyColour } from "../lib/format";
import {
  seatSafety, leadOverSecond, searchSeats, seatKey, ordinal, SAFETY_BANDS,
  buildSeatTimeline, spanLabel, majorityStanding, majorityBins,
} from "../lib/constituency";
import { IconSearch } from "./icons";
import CountUp from "./CountUp";
import Reveal from "./Reveal";

const SeatElections = lazy(() => import("./SeatElections"));
const SeatLocalNumbers = lazy(() => import("./SeatLocalNumbers"));

const fmt = (n) => n.toLocaleString("en-GB");
const pct1 = (n) => `${(Math.round(n * 10) / 10).toFixed(1)}%`;
const thumb = (memberId) => `https://members-api.parliament.uk/api/Members/${memberId}/Thumbnail`;

const goSeat = (name) => {
  window.location.hash = `#/constituency/${encodeURIComponent(name)}`;
};

export function Panel({ title, children, style }) {
  return (
    <section style={{ background: COLORS.paperCard, border: `1px solid ${COLORS.hairline}`, borderRadius: 18, padding: "20px 22px", ...style }}>
      {title && <h2 style={{ fontFamily: FONT_DISPLAY, fontSize: 20, color: COLORS.ink, margin: "0 0 14px", letterSpacing: "-0.01em" }}>{title}</h2>}
      {children}
    </section>
  );
}

export function SeatSearch({ seats, autoFocus }) {
  const [query, setQuery] = useState("");
  const matches = useMemo(() => searchSeats(seats, query), [seats, query]);
  return (
    <div style={{ maxWidth: 560 }}>
      <div style={{ position: "relative" }}>
        <span style={{ position: "absolute", left: 18, top: "50%", transform: "translateY(-50%)", color: COLORS.accent, display: "flex" }}>
          <IconSearch size={19} />
        </span>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          autoFocus={autoFocus}
          placeholder="A constituency or MP, e.g. Gainsborough"
          aria-label="Search for a constituency or an MP"
          style={{ width: "100%", boxSizing: "border-box", padding: "16px 20px 16px 50px", fontFamily: FONT_DISPLAY, fontSize: 17, border: `1.5px solid ${COLORS.hairline}`, borderRadius: 999, background: COLORS.paperCard, color: COLORS.ink, outline: "none" }}
          onFocus={(e) => (e.target.style.borderColor = COLORS.accent)}
          onBlur={(e) => (e.target.style.borderColor = COLORS.hairline)}
        />
      </div>
      {query.trim().length >= 2 && (
        <div style={{ marginTop: 10, background: COLORS.paperCard, border: `1px solid ${COLORS.hairline}`, borderRadius: 16, overflow: "hidden" }}>
          {matches.length === 0 && <div style={{ padding: "14px 18px", fontFamily: FONT_BODY, fontSize: 13, color: COLORS.inkSoft }}>No constituency or MP matches that.</div>}
          {matches.map((m) => (
            <button
              key={m.key}
              type="button"
              onClick={() => goSeat(m.name)}
              style={{ display: "flex", alignItems: "center", gap: 12, width: "100%", textAlign: "left", background: "none", border: "none", borderBottom: `1px solid ${COLORS.hairline}`, padding: "11px 18px", cursor: "pointer" }}
            >
              <img src={thumb(m.mp.memberId)} alt="" width={34} height={34} loading="lazy" style={{ width: 34, height: 34, borderRadius: "50%", objectFit: "cover", border: `2px solid ${partyColour(m.mp?.colour, COLORS.inkSoft)}`, background: COLORS.paper }} />
              <span style={{ fontFamily: FONT_BODY, fontSize: 14.5, fontWeight: 600, color: COLORS.ink }}>{m.name}</span>
              <span style={{ fontFamily: FONT_BODY, fontSize: 12.5, color: COLORS.inkSoft }}>{m.mp?.name}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// The seat's name, who holds it, and how safe it is, over a wash of the
// winning party's colour.
function SeatHero({ record, mpInfo, safety, onOpenProfile, opening }) {
  const { mp } = record;
  const colour = partyColour(mp.colour, COLORS.accent);
  const since = mpInfo?.membership_start_date;
  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: "easeOut" }}
      style={{ position: "relative", overflow: "hidden", borderRadius: 24, border: `1px solid ${COLORS.hairline}`, padding: "clamp(22px, 4.5vw, 38px)", background: `linear-gradient(125deg, ${colour}38, transparent 62%), ${COLORS.paperCard}` }}
    >
      <div aria-hidden="true" style={{ position: "absolute", right: -60, top: -60, width: 240, height: 240, borderRadius: "50%", background: `radial-gradient(circle, ${colour}40, transparent 68%)` }} />
      <div style={{ position: "relative" }}>
        <div style={{ fontFamily: FONT_BODY, fontSize: 12, fontWeight: 700, color: COLORS.inkSoft, letterSpacing: "0.02em", marginBottom: 6 }}>Constituency</div>
        <h1 style={{ fontFamily: FONT_DISPLAY, fontSize: "clamp(34px, 7vw, 58px)", lineHeight: 1.04, letterSpacing: "-0.025em", color: COLORS.ink, margin: 0 }}>{record.name}</h1>

        <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 16, marginTop: 22 }}>
          <img src={thumb(mp.memberId)} alt="" width={64} height={64} style={{ width: 64, height: 64, borderRadius: "50%", objectFit: "cover", border: `3px solid ${colour}`, background: COLORS.paper, flexShrink: 0 }} />
          <div style={{ minWidth: 0 }}>
            <div style={{ fontFamily: FONT_BODY, fontSize: 12, color: COLORS.inkSoft }}>Represented by</div>
            <div style={{ fontFamily: FONT_DISPLAY, fontSize: 21, color: COLORS.ink, lineHeight: 1.2 }}>{mp.name}</div>
            <div style={{ fontFamily: FONT_BODY, fontSize: 13, color: COLORS.inkSoft, marginTop: 2 }}>
              {mp.party}
              {since ? ` · MP since ${new Date(since).toLocaleDateString("en-GB", { month: "long", year: "numeric" })}` : ""}
            </div>
          </div>
          <button
            type="button"
            onClick={onOpenProfile}
            disabled={opening}
            style={{ fontFamily: FONT_BODY, fontSize: 13.5, fontWeight: 700, color: "#fff", background: COLORS.accent, border: "none", borderRadius: 999, padding: "10px 18px", cursor: "pointer" }}
          >
            {opening ? "Opening…" : "See their full record"}
          </button>
        </div>

        {safety && (
          <div style={{ display: "inline-flex", alignItems: "center", gap: 8, marginTop: 20, padding: "7px 14px", borderRadius: 999, background: `${COLORS.accent}1c`, fontFamily: FONT_BODY, fontSize: 13, fontWeight: 700, color: COLORS.ink }}>
            <span style={{ width: 8, height: 8, borderRadius: "50%", background: COLORS.accent, opacity: safety.key === "marginal" ? 0.45 : safety.key === "fairly-safe" ? 0.75 : 1 }} />
            {safety.label}
          </div>
        )}
      </div>
    </motion.div>
  );
}

function Tabs({ tab, setTab, tabs }) {
  return (
    <div role="tablist" aria-label="Constituency sections" style={{ display: "flex", gap: 2, margin: "26px 0 4px", borderBottom: `1px solid ${COLORS.hairline}`, overflowX: "auto" }}>
      {tabs.map((t) => {
        const active = tab === t.key;
        return (
          <button
            key={t.key}
            role="tab"
            id={`tab-${t.key}`}
            aria-selected={active}
            aria-controls={`panel-${t.key}`}
            type="button"
            className="seat-tab"
            onClick={() => setTab(t.key)}
            style={{ position: "relative", background: "none", border: "none", padding: "11px 14px", flexShrink: 0, cursor: "pointer", fontFamily: FONT_DISPLAY, fontSize: 16, fontWeight: 600, color: active ? COLORS.ink : COLORS.inkSoft }}
          >
            {t.label}
            {active && <motion.span layoutId="constituency-tab" style={{ position: "absolute", left: 10, right: 10, bottom: -1, height: 3, borderRadius: 3, background: COLORS.accent }} />}
          </button>
        );
      })}
      <style>{`@media (max-width: 520px) { .seat-tab { padding: 11px 6px !important; font-size: 14px !important; } }`}</style>
    </div>
  );
}

// The winner's lead as a single bar split by each candidate's share.
function VoteShare({ candidates }) {
  const reduce = useReducedMotion();
  const sum = candidates.reduce((n, c) => n + (c.share ?? 0), 0);
  const other = Math.max(0, 1 - sum);
  const segs = [...candidates.map((c) => ({ ...c, w: c.share ?? 0, colour: partyColour(c.colour, COLORS.inkSoft) })), ...(other > 0.004 ? [{ name: "Everyone else", party: "Other candidates", w: other, share: other, votes: null, colour: COLORS.hairline }] : [])];
  return (
    <div>
      <div role="img" aria-label={`Vote share: ${segs.map((s) => `${s.party} ${pct1(s.w * 100)}`).join(", ")}`} style={{ display: "flex", gap: 2, height: 26, borderRadius: 13, overflow: "hidden", background: COLORS.paper }}>
        {segs.map((s, i) => (
          <motion.div
            key={`${s.name}-${i}`}
            title={`${s.name} (${s.party}): ${pct1(s.w * 100)}`}
            initial={reduce ? false : { flexGrow: 0 }}
            animate={{ flexGrow: s.w }}
            transition={{ duration: 0.9, delay: 0.15 + i * 0.08, ease: [0.22, 1, 0.36, 1] }}
            style={{ flexBasis: 0, background: s.colour, minWidth: 2 }}
          />
        ))}
      </div>
      <div style={{ marginTop: 16 }}>
        {segs.map((s, i) => (
          <div key={`${s.name}-${i}`} style={{ display: "grid", gridTemplateColumns: "12px minmax(0, 1fr) auto auto", gap: 12, alignItems: "baseline", padding: "6px 0", borderTop: i === 0 ? "none" : `1px solid ${COLORS.hairline}` }}>
            <span style={{ width: 10, height: 10, borderRadius: 3, background: s.colour, alignSelf: "center" }} />
            <span style={{ minWidth: 0 }}>
              <span style={{ fontFamily: FONT_BODY, fontSize: 14, fontWeight: i === 0 ? 700 : 500, color: COLORS.ink }}>{s.name}</span>
              <span style={{ fontFamily: FONT_BODY, fontSize: 12, color: COLORS.inkSoft }}> · {s.party}</span>
            </span>
            <span style={{ ...numeric, fontSize: 13, color: COLORS.inkSoft }}>{s.votes != null ? fmt(s.votes) : ""}</span>
            <span style={{ ...numeric, fontSize: 16, fontWeight: 700, color: COLORS.ink, minWidth: 54, textAlign: "right" }}>{pct1(s.w * 100)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function TurnoutRing({ pct, turnout, electorate, colour }) {
  const reduce = useReducedMotion();
  const R = 54;
  return (
    <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: "10px 22px" }}>
      <div style={{ position: "relative", width: 140, height: 140, flexShrink: 0 }}>
        <svg viewBox="0 0 140 140" width="140" height="140" style={{ transform: "rotate(-90deg)" }} role="img" aria-label={`Turnout ${pct1(pct)}`}>
          <circle cx="70" cy="70" r={R} fill="none" stroke={COLORS.hairline} strokeWidth="13" />
          <motion.circle
            cx="70" cy="70" r={R} fill="none" stroke={colour} strokeWidth="13" strokeLinecap="round"
            initial={reduce ? false : { pathLength: 0 }}
            whileInView={{ pathLength: Math.max(0.005, pct / 100) }}
            viewport={{ once: true }}
            transition={{ duration: 1.1, ease: [0.22, 1, 0.36, 1] }}
          />
        </svg>
        <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
          <div style={{ ...numeric, fontSize: 30, fontWeight: 700, color: COLORS.ink, lineHeight: 1 }}>
            <CountUp value={pct} format={(n) => `${Math.round(n)}%`} />
          </div>
          <div style={{ fontFamily: FONT_BODY, fontSize: 11, color: COLORS.inkSoft, marginTop: 3 }}>turnout</div>
        </div>
      </div>
      <div style={{ fontFamily: FONT_BODY, fontSize: 13.5, color: COLORS.inkSoft, lineHeight: 1.55, minWidth: 150, flex: 1 }}>
        <strong style={{ ...numeric, fontSize: 17, color: COLORS.ink }}>{fmt(turnout)}</strong> of <strong style={{ ...numeric, color: COLORS.ink }}>{fmt(electorate)}</strong> registered voters cast a ballot.
      </div>
    </div>
  );
}

// Every seat's majority in five-point bins, this seat's own bin picked out.
function WhereItSits({ seats, mine, colour, standing }) {
  const reduce = useReducedMotion();
  const { counts, mineBin } = useMemo(() => majorityBins(seats, mine), [seats, mine]);
  const max = Math.max(1, ...counts);
  return (
    <div>
      <div style={{ display: "flex", alignItems: "flex-end", gap: 5, height: 92 }}>
        {counts.map((c, i) => (
          <div key={i} style={{ flex: 1, height: "100%", display: "flex", alignItems: "flex-end" }} title={`${i * 5}${i === counts.length - 1 ? "%+" : `–${i * 5 + 5}%`}: ${c} seats`}>
            <motion.div
              initial={reduce ? false : { height: 0 }}
              whileInView={{ height: `${(c / max) * 100}%` }}
              viewport={{ once: true }}
              transition={{ duration: 0.7, delay: i * 0.04, ease: [0.22, 1, 0.36, 1] }}
              style={{ width: "100%", minHeight: 2, background: i === mineBin ? colour : COLORS.hairline, borderRadius: "4px 4px 0 0", outline: i === mineBin ? `2px solid ${colour}` : "none", outlineOffset: 2 }}
            />
          </div>
        ))}
      </div>
      <div style={{ display: "flex", gap: 5, marginTop: 5 }}>
        {counts.map((_, i) => (
          <div key={i} style={{ flex: 1, textAlign: "center", fontFamily: FONT_BODY, fontSize: 11, color: i === mineBin ? COLORS.ink : COLORS.inkSoft, fontWeight: i === mineBin ? 700 : 400 }}>{i * 5}{i === counts.length - 1 ? "+" : ""}</div>
        ))}
      </div>
      <div style={{ fontFamily: FONT_BODY, fontSize: 12, color: COLORS.inkSoft, textAlign: "center", marginTop: 1 }}>Winner's majority, % of votes cast. Every seat in the country; this one is highlighted.</div>
      {standing && (
        <div style={{ fontFamily: FONT_BODY, fontSize: 13.5, color: COLORS.ink, lineHeight: 1.55, marginTop: 12 }}>
          This is the <strong style={{ ...numeric }}>{ordinal(standing.rankNarrowest)}</strong> closest result of {fmt(standing.of)} seats, so it's more marginal than {standing.moreMarginalThanPct}% of them.
        </div>
      )}
    </div>
  );
}

function Petitions({ record }) {
  const { petitions, result } = record;
  const top = Math.max(1, ...(petitions ?? []).map((p) => p.count));
  return (
    <Panel title="What people here are petitioning for">
      {petitions?.length > 0 ? (
        <>
          <div style={{ fontFamily: FONT_BODY, fontSize: 12.5, color: COLORS.inkSoft, lineHeight: 1.55, marginBottom: 6 }}>
            Among the most-signed open petitions in the country, the ones that have drawn the most signatures from this constituency.
          </div>
          {petitions.map((p, i) => (
            <div key={p.id} style={{ padding: "13px 0", borderTop: `1px solid ${COLORS.hairline}` }}>
              <a href={`https://petition.parliament.uk/petitions/${p.id}`} target="_blank" rel="noreferrer" style={{ fontFamily: FONT_BODY, fontSize: 14.5, fontWeight: 600, color: COLORS.ink, lineHeight: 1.4 }}>
                {p.action} ↗
              </a>
              <div style={{ display: "flex", alignItems: "center", gap: 14, marginTop: 8 }}>
                <div style={{ flex: 1, height: 8, background: COLORS.paper, borderRadius: 4, overflow: "hidden" }}>
                  <motion.div initial={{ width: 0 }} whileInView={{ width: `${(p.count / top) * 100}%` }} viewport={{ once: true }} transition={{ duration: 0.8, delay: i * 0.1, ease: [0.22, 1, 0.36, 1] }} style={{ height: "100%", background: COLORS.accent, borderRadius: "0 4px 4px 0" }} />
                </div>
                <span style={{ ...numeric, fontSize: 18, fontWeight: 700, color: COLORS.ink }}>{fmt(p.count)}</span>
              </div>
              <div style={{ fontFamily: FONT_BODY, fontSize: 12, color: COLORS.inkSoft, marginTop: 5 }}>
                signatures from here
                {result?.electorate ? ` · ${((p.count / result.electorate) * 1000).toFixed(1)} per 1,000 voters` : ""} · {p.rank === 1 ? "more than any other constituency" : `${ordinal(p.rank)} highest of ${fmt(p.of)} constituencies`}
              </div>
            </div>
          ))}
        </>
      ) : (
        <div style={{ fontFamily: FONT_BODY, fontSize: 13.5, color: COLORS.inkSoft }}>No local signatures found on the most-signed open petitions.</div>
      )}
    </Panel>
  );
}

function Overview({ record, seats, safety }) {
  const { result, mp } = record;
  const lead = result ? leadOverSecond(result.candidates) : null;
  const colour = partyColour(mp.colour, COLORS.accent);
  const standing = useMemo(() => majorityStanding(seats, seatKey(record.name)), [seats, record.name]);
  return (
    <div role="tabpanel" id="panel-overview" aria-labelledby="tab-overview" style={{ display: "flex", flexDirection: "column", gap: 16, marginTop: 20 }}>
      {result ? (
        <>
          <Reveal>
            <Panel>
              <div style={{ fontFamily: FONT_BODY, fontSize: 12.5, fontWeight: 700, color: COLORS.inkSoft }}>{(result.title ?? "The latest election result").replace(/^\d{4}-\d{2}-\d{2}\s+/, "")}{result.date ? ` · ${formatDate(result.date)}` : ""}</div>
              <div style={{ display: "flex", flexWrap: "wrap", alignItems: "flex-end", gap: "12px 30px", margin: "8px 0 18px" }}>
                <div>
                  <div style={{ ...numeric, fontSize: "clamp(52px, 10vw, 84px)", fontWeight: 700, lineHeight: 0.92, letterSpacing: "-0.035em", color: COLORS.ink }}>
                    {result.majority != null ? <CountUp value={result.majority} /> : "n/a"}
                  </div>
                  <div style={{ fontFamily: FONT_DISPLAY, fontSize: 18, color: COLORS.ink, marginTop: 6 }}>vote majority</div>
                </div>
                <div style={{ fontFamily: FONT_BODY, fontSize: 14, color: COLORS.inkSoft, lineHeight: 1.6, flex: "1 1 220px", maxWidth: 360 }}>
                  {result.majorityPct != null && <>That's <strong style={{ ...numeric, color: COLORS.ink }}>{pct1(result.majorityPct)}</strong> of the votes cast{lead ? `, with ${lead.runnerUp.party} second` : ""}. </>}
                  {result.outcome && <>Result: <strong style={{ color: COLORS.ink }}>{result.outcome}</strong>{/gain/i.test(result.outcome) ? " (the seat changed party)" : ""}.</>}
                </div>
              </div>
              {result.candidates.length > 0 && <VoteShare candidates={result.candidates} />}
              {safety && (
                <div style={{ marginTop: 18, padding: "12px 14px", background: COLORS.paper, borderRadius: 12, fontFamily: FONT_BODY, fontSize: 13.5, lineHeight: 1.6, color: COLORS.ink }}>
                  <strong>{safety.label}.</strong> {safety.blurb} There's no official definition of a marginal or safe seat; this site calls a seat marginal when the winner's majority is under{" "}
                  {SAFETY_BANDS[0].max}% of the votes cast, and safe at {SAFETY_BANDS[1].max}% or more.
                </div>
              )}
            </Panel>
          </Reveal>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(300px, 100%), 1fr))", gap: 16 }}>
            {result.turnoutPct != null && result.turnout != null && result.electorate != null && (
              <Reveal>
                <Panel title="Who turned out" style={{ height: "100%", boxSizing: "border-box" }}>
                  <TurnoutRing pct={result.turnoutPct} turnout={result.turnout} electorate={result.electorate} colour={colour} />
                </Panel>
              </Reveal>
            )}
            {result.majorityPct != null && (
              <Reveal delay={0.08}>
                <Panel title="How it compares" style={{ height: "100%", boxSizing: "border-box" }}>
                  <WhereItSits seats={seats} mine={result.majorityPct} colour={colour} standing={standing} />
                </Panel>
              </Reveal>
            )}
          </div>
        </>
      ) : (
        <Panel title="The latest election result">
          <div style={{ fontFamily: FONT_BODY, fontSize: 13.5, color: COLORS.inkSoft }}>No result is available for this seat.</div>
        </Panel>
      )}

      <Reveal>
        <Petitions record={record} />
      </Reveal>
    </div>
  );
}

// One stripe per MP, as wide as their time in office, in their party's
// colour: the seat's whole political history in a single line.
function PartyStripe({ timeline }) {
  const reduce = useReducedMotion();
  const ordered = [...timeline].reverse();
  const first = ordered[0];
  return (
    <div>
      <div style={{ display: "flex", gap: 2, height: 34, borderRadius: 10, overflow: "hidden" }}>
        {ordered.map((e, i) => (
          <motion.div
            key={e.key}
            title={`${e.name}${e.party ? ` (${e.party})` : ""}, ${spanLabel(e)}`}
            initial={reduce ? false : { flexGrow: 0 }}
            whileInView={{ flexGrow: e.years }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: i * 0.06, ease: [0.22, 1, 0.36, 1] }}
            style={{ flexBasis: 0, minWidth: 5, background: partyColour(e.colour, COLORS.inkSoft) }}
          />
        ))}
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", fontFamily: FONT_BODY, fontSize: 11.5, color: COLORS.inkSoft, marginTop: 5 }}>
        <span>{first?.start ? new Date(first.start).getFullYear() : ""}</span>
        <span>Now</span>
      </div>
    </div>
  );
}

function Fact({ label, value, note }) {
  return (
    <div style={{ background: COLORS.paper, borderRadius: 14, padding: "14px 16px" }}>
      <div style={{ fontFamily: FONT_BODY, fontSize: 11.5, fontWeight: 700, color: COLORS.inkSoft }}>{label}</div>
      <div style={{ ...numeric, fontSize: 24, fontWeight: 700, color: COLORS.ink, lineHeight: 1.15, marginTop: 4 }}>{value}</div>
      {note && <div style={{ fontFamily: FONT_BODY, fontSize: 12, color: COLORS.inkSoft, lineHeight: 1.45, marginTop: 3 }}>{note}</div>}
    </div>
  );
}

function History({ record, seats, mpInfo, history }) {
  const { result, mp } = record;
  const key = seatKey(record.name);
  const former = useMemo(() => history?.bySeat?.[key] ?? [], [history, key]);
  const timeline = useMemo(
    () => buildSeatTimeline({ name: mp.name, party: mp.party, colour: mp.colour, start: mpInfo?.membership_start_date ?? null }, former),
    [mp, mpInfo, former]
  );
  const standing = useMemo(() => majorityStanding(seats, key), [seats, key]);
  const turnoutRank = useMemo(() => {
    const mine = result?.turnoutPct;
    if (typeof mine !== "number") return null;
    const all = Object.values(seats).map((s) => s.result?.turnoutPct).filter((v) => typeof v === "number");
    return { rank: all.filter((v) => v > mine).length + 1, of: all.length };
  }, [seats, result]);
  const parties = [...new Set(timeline.map((e) => e.party).filter(Boolean))];
  const longest = former.length ? [...timeline].filter((e) => !e.current).sort((a, b) => b.years - a.years)[0] : null;
  const wiki = `https://en.wikipedia.org/wiki/Special:Search?search=${encodeURIComponent(`${record.name} UK Parliament constituency`)}`;

  return (
    <div role="tabpanel" id="panel-history" aria-labelledby="tab-history" style={{ display: "flex", flexDirection: "column", gap: 16, marginTop: 20 }}>
      <Reveal>
        <Panel title="Who has held this seat">
          {!history ? (
            <div style={{ fontFamily: FONT_BODY, fontSize: 13.5, color: COLORS.inkSoft }}>Loading the seat's history…</div>
          ) : (
            <>
              {timeline.length > 1 && (
                <div style={{ marginBottom: 22 }}>
                  <PartyStripe timeline={timeline} />
                  <div style={{ fontFamily: FONT_BODY, fontSize: 12, color: COLORS.inkSoft, marginTop: 6 }}>Each stripe is one MP, as wide as their time in office, in their party's colour.</div>
                </div>
              )}
              <ol style={{ listStyle: "none", margin: 0, padding: 0, position: "relative" }}>
                {timeline.map((e, i) => (
                  <li key={e.key} style={{ display: "grid", gridTemplateColumns: "24px minmax(0, 1fr)", gap: 14, position: "relative", paddingBottom: i === timeline.length - 1 ? 0 : 18 }}>
                    {i < timeline.length - 1 && <span aria-hidden="true" style={{ position: "absolute", left: 11, top: 22, bottom: 0, width: 2, background: COLORS.hairline }} />}
                    <span style={{ position: "relative", zIndex: 1, width: 24, height: 24, borderRadius: "50%", background: partyColour(e.colour, COLORS.inkSoft), border: `3px solid ${COLORS.paperCard}`, boxShadow: e.current ? `0 0 0 2px ${partyColour(e.colour, COLORS.inkSoft)}` : "none", marginTop: 1 }} />
                    <div style={{ minWidth: 0 }}>
                      <div style={{ display: "flex", flexWrap: "wrap", alignItems: "baseline", gap: "2px 10px" }}>
                        <span style={{ fontFamily: FONT_BODY, fontSize: 15, fontWeight: 700, color: COLORS.ink }}>{e.name}</span>
                        {e.current && <span style={{ fontFamily: FONT_BODY, fontSize: 11, fontWeight: 700, color: COLORS.accent, background: `${COLORS.accent}1c`, padding: "2px 8px", borderRadius: 999 }}>Current MP</span>}
                      </div>
                      <div style={{ fontFamily: FONT_BODY, fontSize: 12.5, color: COLORS.inkSoft, marginTop: 2 }}>
                        {[e.party, e.current ? (e.start ? `MP since ${new Date(e.start).getFullYear()}` : null) : spanLabel(e), e.current ? null : e.years >= 1 ? `${Math.round(e.years)} ${Math.round(e.years) === 1 ? "year" : "years"}` : null].filter(Boolean).join(" · ")}
                      </div>
                      {e.reason && <div style={{ fontFamily: FONT_BODY, fontSize: 12.5, color: COLORS.inkSoft, marginTop: 1 }}>{e.reason}</div>}
                    </div>
                  </li>
                ))}
              </ol>
              {former.length === 0 && (
                <div style={{ fontFamily: FONT_BODY, fontSize: 13.5, color: COLORS.inkSoft, lineHeight: 1.6, marginTop: 14 }}>
                  Parliament's records name no earlier MP whose last seat was this one. That's usual where the current MP has held the area for a long time, or where the seat's name or boundaries changed.
                </div>
              )}
              <div style={{ fontFamily: FONT_BODY, fontSize: 11.5, color: COLORS.inkSoft, lineHeight: 1.55, marginTop: 16 }}>
                Parliament records each former MP against the last seat they held, so someone who moved to another seat appears under that one. Seats redrawn in 2024 can share a name with an older seat covering different ground, and the records start in the 1950s.
              </div>
            </>
          )}
        </Panel>
      </Reveal>

      <Reveal>
        <Panel title="Notable about this seat">
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(210px, 100%), 1fr))", gap: 12 }}>
            {result?.outcome && <Fact label="At the last election" value={/gain/i.test(result.outcome) ? "Changed party" : /hold/i.test(result.outcome) ? "Held" : result.outcome} note={`${result.outcome}${result.date ? `, ${formatDate(result.date)}` : ""}`} />}
            {result?.isGeneralElection === false && <Fact label="How the MP won it" value="By-election" note={(result.title ?? "").replace(/^\d{4}-\d{2}-\d{2}\s+/, "")} />}
            {standing && <Fact label="Closeness of the result" value={`${ordinal(standing.rankNarrowest)} closest`} note={`Of ${fmt(standing.of)} seats`} />}
            {turnoutRank && <Fact label="Turnout" value={`${ordinal(turnoutRank.rank)} highest`} note={`Of ${fmt(turnoutRank.of)} seats`} />}
            {history && parties.length > 0 && <Fact label="Parties that have held it" value={parties.length} note={parties.join(", ")} />}
            {longest && <Fact label="Longest-serving former MP" value={`${Math.round(longest.years)} yrs`} note={`${longest.name} (${longest.party ?? "no party recorded"}), ${spanLabel(longest)}`} />}
          </div>
        </Panel>
      </Reveal>

      <Reveal>
        <div style={{ fontFamily: FONT_BODY, fontSize: 13, color: COLORS.inkSoft, lineHeight: 1.7 }}>
          Want the longer story? Try{" "}
          <a href={wiki} target="_blank" rel="noreferrer" style={{ color: COLORS.accent, fontWeight: 600 }}>Wikipedia's page for this seat ↗</a>
          {" "}or{" "}
          <a href="https://electionresults.parliament.uk/" target="_blank" rel="noreferrer" style={{ color: COLORS.accent, fontWeight: 600 }}>Parliament's election results site ↗</a>.
        </div>
      </Reveal>
    </div>
  );
}

export function SeatDetail({ record, seats, generatedAt, onSelectPolitician, extras = null, regionCode = null }) {
  const { result, mp } = record;
  const safety = result ? seatSafety(result.majorityPct) : null;
  const [tab, setTab] = useState("overview");
  const [mpInfo, setMpInfo] = useState(null);
  const [history, setHistory] = useState(null);
  const [elections, setElections] = useState(null);
  const [opening, setOpening] = useState(false);

  // The sitting MP's own record: when they became an MP, and the full row
  // for opening their profile.
  useEffect(() => {
    let cancelled = false;
    supabase
      .from("politicians")
      .select("*")
      .eq("parliament_member_id", mp.memberId)
      .single()
      .then(({ data }) => {
        if (!cancelled) setMpInfo(data ?? null);
      });
    return () => {
      cancelled = true;
    };
  }, [mp.memberId]);

  // Loaded only once the History tab is opened: a file of ~1,000 former MPs.
  useEffect(() => {
    if (tab !== "history" || history) return;
    import("../data/constituencyHistory.json").then((m) => setHistory(m.default)).catch(() => setHistory({ bySeat: {} }));
  }, [tab, history]);

  // Loaded only once the Elections tab is opened: the 2010 to 2019 results for every seat.
  useEffect(() => {
    if (tab !== "elections" || elections) return;
    import("../data/electionHistory.json").then((m) => setElections(m.default)).catch(() => setElections({ bySeat: {}, parties: {} }));
  }, [tab, elections]);

  function openProfile() {
    if (!mpInfo) return;
    setOpening(true);
    onSelectPolitician?.(mpInfo);
  }

  return (
    <>
      <SeatHero record={record} mpInfo={mpInfo} safety={safety} onOpenProfile={openProfile} opening={opening} />
      <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "flex-end", gap: 10, marginTop: 14 }}>
        <a
          href={`#/compareSeats/${encodeURIComponent(`${record.name}~`)}`}
          style={{ display: "inline-flex", alignItems: "center", fontFamily: FONT_BODY, fontSize: 13, fontWeight: 700, color: COLORS.accent, background: `${COLORS.accent}12`, border: `1px solid ${COLORS.accent}40`, borderRadius: 999, padding: "7px 14px", textDecoration: "none" }}
        >
          Compare with another seat
        </a>
        <ShareButton
          filename={`${record.name}-2024-result`}
          getSpec={() => seatShareSpec({ name: record.name, mp: { name: mp.name, party: mp.party, colour: mp.colour }, result, link: window.location.href })}
        />
      </div>
      {extras}
      <Tabs tab={tab} setTab={setTab} tabs={[{ key: "overview", label: "Overview" }, { key: "local", label: "Local numbers" }, { key: "elections", label: "Elections" }, { key: "history", label: "MPs" }]} />
      {tab === "overview" && <Overview record={record} seats={seats} safety={safety} />}
      {tab === "local" && (
        <Suspense fallback={null}>
          <SeatLocalNumbers record={record} regionCode={regionCode} />
        </Suspense>
      )}
      {tab === "elections" && (
        <Suspense fallback={null}>
          <SeatElections record={record} history={elections?.bySeat?.[seatKey(record.name)]} parties={elections?.parties} loading={!elections} />
        </Suspense>
      )}
      {tab === "history" && <History record={record} seats={seats} mpInfo={mpInfo} history={history} />}
      <p style={{ fontFamily: FONT_BODY, fontSize: 11.5, color: COLORS.inkSoft, lineHeight: 1.55, marginTop: 26 }}>
        Election results come from Parliament's Members API; petition signatures from petition.parliament.uk. Updated {generatedAt ? formatDate(generatedAt) : "daily"}.
        Boundaries changed in 2024, so a seat's name can be shared with an older seat that covered different ground.
      </p>
    </>
  );
}

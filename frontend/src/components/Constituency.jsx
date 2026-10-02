import { useState, useEffect, useMemo } from "react";
import { supabase } from "../supabaseClient";
import { COLORS, FONT_BODY, FONT_DISPLAY, PAGE_PADDING } from "../theme";
import { formatDate, partyColour } from "../lib/format";
import { seatSafety, leadOverSecond, searchSeats, seatKey, ordinal, SAFETY_BANDS } from "../lib/constituency";
import { PageHeader, LoadFailedNote } from "./shared";
import { IconMap, IconSearch } from "./icons";
import BarRow from "./BarRow";

const fmt = (n) => n.toLocaleString("en-GB");
const pct1 = (n) => `${(Math.round(n * 10) / 10).toFixed(1)}%`;

const goToSeat = (name) => {
  window.location.hash = `#/constituency/${encodeURIComponent(name)}`;
};

function Card({ title, children }) {
  return (
    <section style={{ background: COLORS.paperCard, border: `1px solid ${COLORS.hairline}`, borderRadius: 14, padding: "18px 20px", marginTop: 16 }}>
      <h2 style={{ fontFamily: FONT_DISPLAY, fontSize: 19, color: COLORS.ink, margin: "0 0 12px" }}>{title}</h2>
      {children}
    </section>
  );
}

function Fact({ label, value, note }) {
  return (
    <div style={{ flex: "1 1 180px", minWidth: 0 }}>
      <div style={{ fontFamily: FONT_BODY, fontSize: 11.5, fontWeight: 700, color: COLORS.inkSoft }}>{label}</div>
      <div style={{ fontFamily: FONT_DISPLAY, fontSize: 22, color: COLORS.ink, lineHeight: 1.25, marginTop: 2 }}>{value}</div>
      {note && <div style={{ fontFamily: FONT_BODY, fontSize: 12, color: COLORS.inkSoft, lineHeight: 1.45, marginTop: 2 }}>{note}</div>}
    </div>
  );
}

function SeatSearch({ seats, autoFocus }) {
  const [query, setQuery] = useState("");
  const matches = useMemo(() => searchSeats(seats, query), [seats, query]);
  return (
    <div style={{ maxWidth: 520 }}>
      <div style={{ position: "relative" }}>
        <span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: COLORS.inkSoft, display: "flex" }}>
          <IconSearch size={15} />
        </span>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          autoFocus={autoFocus}
          placeholder="A constituency or MP, e.g. Gainsborough"
          aria-label="Search for a constituency or an MP"
          style={{
            width: "100%", boxSizing: "border-box", padding: "12px 14px 12px 36px", fontFamily: FONT_BODY, fontSize: 14,
            border: `1px solid ${COLORS.hairline}`, borderRadius: 10, background: COLORS.paperCard, color: COLORS.ink,
          }}
        />
      </div>
      {query.trim().length >= 2 && (
        <div style={{ marginTop: 8, background: COLORS.paperCard, border: `1px solid ${COLORS.hairline}`, borderRadius: 10, overflow: "hidden" }}>
          {matches.length === 0 && <div style={{ padding: "12px 14px", fontFamily: FONT_BODY, fontSize: 13, color: COLORS.inkSoft }}>No constituency or MP matches that.</div>}
          {matches.map((m) => (
            <button
              key={m.key}
              type="button"
              onClick={() => goToSeat(m.name)}
              style={{ display: "flex", alignItems: "center", gap: 10, width: "100%", textAlign: "left", background: "none", border: "none", borderBottom: `1px solid ${COLORS.hairline}`, padding: "10px 14px", cursor: "pointer" }}
            >
              <span style={{ width: 8, height: 8, borderRadius: "50%", background: partyColour(m.mp?.colour, COLORS.inkSoft), flexShrink: 0 }} />
              <span style={{ fontFamily: FONT_BODY, fontSize: 14, fontWeight: 600, color: COLORS.ink }}>{m.name}</span>
              <span style={{ fontFamily: FONT_BODY, fontSize: 12.5, color: COLORS.inkSoft }}>{m.mp?.name}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// Winning candidates and sitting MPs aren't always the same person or
// party (a by-election, a defection), so the two are shown separately; this
// only adds a note where the winner demonstrably is the sitting MP and the
// party label has changed since.
function partyChangeNote(record, winner) {
  if (!winner || !record.mp?.party || winner.party === record.mp.party) return null;
  const last = (n) => String(n ?? "").trim().split(/\s+/).pop().toLowerCase();
  if (last(winner.name) !== last(record.mp.name)) return null;
  return `${record.mp.name} was elected for ${winner.party} and now sits as ${record.mp.party}.`;
}

function SeatDetail({ record, generatedAt, onSelectPolitician }) {
  const { result, mp, petitions } = record;
  const safety = result ? seatSafety(result.majorityPct) : null;
  const lead = result ? leadOverSecond(result.candidates) : null;
  const winner = result?.candidates?.[0];
  const topShare = Math.max(0.0001, ...(result?.candidates ?? []).map((c) => c.share ?? 0));
  const change = result ? partyChangeNote(record, winner) : null;
  const [opening, setOpening] = useState(false);

  async function openProfile() {
    setOpening(true);
    const { data } = await supabase.from("politicians").select("*").eq("parliament_member_id", mp.memberId).single();
    setOpening(false);
    if (data) onSelectPolitician?.(data);
  }

  return (
    <>
      <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 12, marginTop: 20 }}>
        <span style={{ width: 12, height: 12, borderRadius: "50%", background: partyColour(mp.colour, COLORS.inkSoft), flexShrink: 0 }} />
        <span style={{ fontFamily: FONT_BODY, fontSize: 15, color: COLORS.ink }}>
          Represented by <strong>{mp.name}</strong>{mp.party ? ` (${mp.party})` : ""}
        </span>
        <button
          type="button"
          onClick={openProfile}
          disabled={opening}
          style={{ background: "none", border: "none", padding: 0, cursor: "pointer", fontFamily: FONT_BODY, fontSize: 13, fontWeight: 700, color: COLORS.accent }}
        >
          {opening ? "Opening…" : "See their full record →"}
        </button>
      </div>

      {result ? (
        <Card title={result.title ? `The result: ${result.title}` : "The latest election result"}>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "16px 24px" }}>
            <Fact
              label="Majority"
              value={result.majority != null ? `${fmt(result.majority)} votes` : "Not available"}
              note={result.majorityPct != null ? `${pct1(result.majorityPct)} of the votes cast${lead ? `; ${lead.runnerUp.party} came second` : ""}` : null}
            />
            <Fact
              label="Turnout"
              value={result.turnoutPct != null ? pct1(result.turnoutPct) : "Not available"}
              note={result.turnout != null && result.electorate != null ? `${fmt(result.turnout)} of ${fmt(result.electorate)} registered voters` : null}
            />
            {result.outcome && <Fact label="Outcome" value={result.outcome} note={result.date ? formatDate(result.date) : null} />}
          </div>

          {safety && (
            <div style={{ marginTop: 16, padding: "12px 14px", background: COLORS.paper, borderRadius: 10, fontFamily: FONT_BODY, fontSize: 13.5, lineHeight: 1.6, color: COLORS.ink }}>
              <strong>{safety.label}.</strong> {safety.blurb} There's no official definition of a marginal or safe seat; this site calls a seat marginal when the winner's
              majority is under {SAFETY_BANDS[0].max}% of the votes cast, and safe at {SAFETY_BANDS[1].max}% or more.
            </div>
          )}
          {change && <div style={{ marginTop: 10, fontFamily: FONT_BODY, fontSize: 13, color: COLORS.inkSoft }}>{change}</div>}

          {result.candidates.length > 0 && (
            <div style={{ marginTop: 18 }}>
              <div style={{ fontFamily: FONT_BODY, fontSize: 12.5, fontWeight: 700, color: COLORS.ink, marginBottom: 4 }}>Top {result.candidates.length} candidates</div>
              {result.candidates.map((c) => (
                <BarRow
                  key={`${c.name}-${c.party}`}
                  label={`${c.name} (${c.party})`}
                  color={partyColour(c.colour, COLORS.inkSoft)}
                  fraction={(c.share ?? 0) / topShare}
                  valueText={fmt(c.votes)}
                  detail={c.share != null ? pct1(c.share * 100) : null}
                  labelWidth={250}
                />
              ))}
            </div>
          )}
        </Card>
      ) : (
        <Card title="The latest election result">
          <div style={{ fontFamily: FONT_BODY, fontSize: 13.5, color: COLORS.inkSoft }}>No result is available for this seat.</div>
        </Card>
      )}

      <Card title="What people here are petitioning for">
        {petitions?.length > 0 ? (
          <>
            <div style={{ fontFamily: FONT_BODY, fontSize: 12.5, color: COLORS.inkSoft, lineHeight: 1.55, marginBottom: 10 }}>
              The open petitions, among the most-signed in the country, that have drawn the most signatures from this constituency.
            </div>
            {petitions.map((p) => (
              <div key={p.id} style={{ padding: "10px 0", borderTop: `1px solid ${COLORS.hairline}` }}>
                <a href={`https://petition.parliament.uk/petitions/${p.id}`} target="_blank" rel="noreferrer" style={{ fontFamily: FONT_BODY, fontSize: 14, fontWeight: 600, color: COLORS.ink }}>
                  {p.action} ↗
                </a>
                <div style={{ fontFamily: FONT_BODY, fontSize: 12.5, color: COLORS.inkSoft, marginTop: 3 }}>
                  {fmt(p.count)} {p.count === 1 ? "signature" : "signatures"} from here
                  {result?.electorate ? ` (${((p.count / result.electorate) * 1000).toFixed(1)} per 1,000 voters)` : ""} · {p.rank === 1 ? "most of any constituency" : `${ordinal(p.rank)} highest of ${fmt(p.of)} constituencies`}
                </div>
              </div>
            ))}
          </>
        ) : (
          <div style={{ fontFamily: FONT_BODY, fontSize: 13.5, color: COLORS.inkSoft }}>No local signatures found on the most-signed open petitions.</div>
        )}
      </Card>

      <p style={{ fontFamily: FONT_BODY, fontSize: 11.5, color: COLORS.inkSoft, lineHeight: 1.55, marginTop: 22 }}>
        Election results come from Parliament's Members API; petition signatures from petition.parliament.uk. Updated {generatedAt ? formatDate(generatedAt) : "daily"}.
        Boundaries changed in 2024, so a seat's name can be shared with an older seat that covered different ground.
      </p>
    </>
  );
}

export default function Constituency({ seat, onSelectPolitician }) {
  const [data, setData] = useState(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    // The whole file (650 seats) loads on demand rather than with the app.
    import("../data/constituencies.json").then((m) => setData(m.default)).catch(() => setFailed(true));
  }, []);

  const record = data && seat ? data.constituencies[seatKey(seat)] : null;

  return (
    <div style={{ maxWidth: 820, margin: "0 auto", padding: PAGE_PADDING }}>
      <PageHeader
        icon={IconMap}
        kicker="Your Constituency"
        title={record ? record.name : "Your constituency"}
        subtitle={
          record
            ? "How the seat voted at the last election, how close it was, and what people here are petitioning for."
            : "Look up any constituency or MP to see how the seat voted at the last election, how safe or marginal it is, and what people there are petitioning for."
        }
      />

      {failed && <LoadFailedNote item="the constituency data" />}
      {!failed && !data && <div style={{ fontFamily: FONT_BODY, fontSize: 13.5, color: COLORS.inkSoft }}>Loading…</div>}

      {data && !record && (
        <>
          {seat && (
            <div style={{ fontFamily: FONT_BODY, fontSize: 13.5, color: "#9C3B3B", marginBottom: 14 }}>
              We couldn't find a constituency called “{seat}”. It may be vacant, or spelled differently — try searching.
            </div>
          )}
          <SeatSearch seats={data.constituencies} autoFocus={!seat} />
        </>
      )}

      {data && record && (
        <>
          <button
            type="button"
            onClick={() => { window.location.hash = "#/constituency"; }}
            style={{ background: "none", border: "none", padding: 0, cursor: "pointer", fontFamily: FONT_BODY, fontSize: 13, color: COLORS.inkSoft, marginBottom: 4 }}
          >
            ← Look up another constituency
          </button>
          <SeatDetail record={record} generatedAt={data.generatedAt} onSelectPolitician={onSelectPolitician} />
        </>
      )}
    </div>
  );
}

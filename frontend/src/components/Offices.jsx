import { useState, useEffect, useMemo } from "react";
import { supabase } from "../supabaseClient";
import { fetchAllRows } from "../lib/supabasePagination";
import { loadAllCareerDetail } from "../lib/careerDetail";
import { buildOffices, searchOffices, OFFICE_KINDS } from "../lib/offices";
import { duration, monthYear } from "../lib/careerTimeline";
import { COLORS, FONT_BODY, FONT_DISPLAY, PAGE_PADDING, numeric } from "../theme";
import { partyColour } from "../lib/format";
import { PageHeader, LoadFailedNote } from "./shared";
import { IconCabinet } from "./icons";

// Who has held a government or shadow post, for anyone sitting in Parliament
// today, from their biography records. It can't see people who have left, so
// the page says it is a partial history and not the full list of office holders.

const KIND_COLOUR = { gov: "#1FA97C", opp: "#E8A33D" };
const goHolder = (h) => {
  window.location.hash = h.house === "lords" ? `#/lords/${h.profileId}` : `#/mp/${h.profileId}`;
};

function Holder({ h, now }) {
  const colour = partyColour(h.colour, COLORS.inkSoft);
  return (
    <button
      type="button"
      className="nclick"
      onClick={() => goHolder(h)}
      style={{ display: "grid", gridTemplateColumns: "minmax(0, 1fr) auto", gap: 12, alignItems: "center", width: "100%", textAlign: "left", background: "none", border: "none", borderTop: `1px solid ${COLORS.hairline}`, borderRadius: 0, padding: "9px 6px", color: "inherit" }}
    >
      <span style={{ minWidth: 0 }}>
        <span style={{ display: "flex", alignItems: "center", gap: 7, fontFamily: FONT_BODY, fontSize: 14, fontWeight: 600, color: COLORS.ink }}>
          <span style={{ width: 8, height: 8, borderRadius: "50%", background: colour, flexShrink: 0 }} />
          <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{h.name}</span>
          <span style={{ fontWeight: 400, fontSize: 12, color: COLORS.inkSoft }}>{h.house === "lords" ? "Lords" : "MP"}</span>
        </span>
        <span style={{ display: "block", fontFamily: FONT_BODY, fontSize: 12, color: COLORS.inkSoft, marginTop: 1 }}>
          {h.party ?? "No party"}
        </span>
      </span>
      <span style={{ textAlign: "right", fontFamily: FONT_BODY, fontSize: 12, color: COLORS.inkSoft }}>
        <span style={{ display: "block", color: COLORS.ink, fontWeight: 600 }}>
          {monthYear(h.start)} to {h.end ? monthYear(h.end) : "now"}
        </span>
        <span style={{ display: "block" }}>
          {duration(h.start, h.end, now)}
          {!h.end && <strong style={{ color: COLORS.accent }}> · in post</strong>}
        </span>
      </span>
    </button>
  );
}

function OfficeRow({ office, open, onToggle, now }) {
  const colour = KIND_COLOUR[office.kind];
  return (
    <div style={{ background: COLORS.paperCard, border: `1px solid ${COLORS.hairline}`, borderLeft: `3px solid ${colour}`, borderRadius: 12, overflow: "hidden" }}>
      <button
        type="button"
        aria-expanded={open}
        onClick={onToggle}
        style={{ display: "grid", gridTemplateColumns: "minmax(0, 1fr) auto auto", gap: 12, alignItems: "center", width: "100%", textAlign: "left", background: "none", border: "none", padding: "12px 14px", cursor: "pointer", color: "inherit" }}
      >
        <span style={{ minWidth: 0 }}>
          <span style={{ display: "block", fontFamily: FONT_BODY, fontSize: 14.5, fontWeight: 600, color: COLORS.ink, lineHeight: 1.35 }}>{office.post}</span>
          <span style={{ display: "block", fontFamily: FONT_BODY, fontSize: 12, color: COLORS.inkSoft, marginTop: 2 }}>
            <span style={{ color: colour, fontWeight: 700 }}>{OFFICE_KINDS[office.kind]}</span>
            {office.departments.length > 0 && ` · ${office.departments.slice(0, 2).join(", ")}${office.departments.length > 2 ? ` and ${office.departments.length - 2} more` : ""}`}
          </span>
        </span>
        <span style={{ textAlign: "right" }}>
          <span style={{ display: "block", ...numeric, fontSize: 18, fontWeight: 700, color: COLORS.ink, lineHeight: 1 }}>{office.holders.length}</span>
          <span style={{ display: "block", fontFamily: FONT_BODY, fontSize: 11, color: COLORS.inkSoft }}>holder{office.holders.length === 1 ? "" : "s"}</span>
        </span>
        <span aria-hidden="true" style={{ color: COLORS.inkSoft, fontSize: 12, transform: open ? "rotate(90deg)" : "none", transition: "transform 0.15s" }}>▸</span>
      </button>
      {open && (
        <div style={{ padding: "0 14px 10px" }}>
          {office.holders.map((h) => (
            <Holder key={`${h.house}-${h.memberId}-${h.start}`} h={h} now={now} />
          ))}
        </div>
      )}
    </div>
  );
}

export default function Offices({ initialQuery = "" }) {
  const [data, setData] = useState(null);
  const [failed, setFailed] = useState(false);
  const [query, setQuery] = useState(initialQuery ?? "");
  const [seenQuery, setSeenQuery] = useState(initialQuery);
  if (seenQuery !== initialQuery) {
    setSeenQuery(initialQuery);
    setQuery(initialQuery ?? "");
  }
  const [kind, setKind] = useState("all");
  const [open, setOpen] = useState(null);
  const [now] = useState(() => Date.now());

  useEffect(() => {
    Promise.all([
      loadAllCareerDetail("commons"),
      loadAllCareerDetail("lords"),
      fetchAllRows(() => supabase.from("politicians").select("id, parliament_member_id, name, party, party_colour")),
      fetchAllRows(() => supabase.from("peers").select("id, name, party, party_colour")),
    ])
      .then(([mpCareers, peerCareers, mps, peers]) => {
        const people = {};
        const careers = {};
        for (const p of mps) {
          const d = mpCareers[p.parliament_member_id];
          if (!d) continue;
          people[`m${p.parliament_member_id}`] = { name: p.name, party: p.party, colour: p.party_colour, house: "commons", profileId: p.id };
          careers[`m${p.parliament_member_id}`] = d;
        }
        for (const p of peers) {
          const d = peerCareers[p.id];
          if (!d) continue;
          people[`l${p.id}`] = { name: p.name, party: p.party, colour: p.party_colour, house: "lords", profileId: p.id };
          careers[`l${p.id}`] = d;
        }
        setData(buildOffices(careers, people));
      })
      .catch(() => setFailed(true));
  }, []);

  const results = useMemo(() => {
    if (!data) return [];
    const byKind = kind === "all" ? data : data.filter((o) => o.kind === kind);
    return searchOffices(byKind, query, 40);
  }, [data, query, kind]);

  const people = useMemo(() => (data ? new Set(data.flatMap((o) => o.holders.map((h) => `${h.house}${h.memberId}`))).size : 0), [data]);

  return (
    <div style={{ maxWidth: 860, margin: "0 auto", padding: PAGE_PADDING }}>
      <PageHeader
        icon={IconCabinet}
        kicker="Who held office"
        title="Who has held this office?"
        subtitle="Search any government or shadow post, such as Secretary of State for Health or Shadow Chancellor, and see everyone in Parliament today who has held it, with dates."
      />

      {failed && <div style={{ marginTop: 24 }}><LoadFailedNote item="the office records" /></div>}
      {!data && !failed && <div style={{ fontFamily: FONT_BODY, fontSize: 13.5, color: COLORS.inkSoft, marginTop: 24 }}>Loading every career record…</div>}

      {data && (
        <>
          <div style={{ marginTop: 22, display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
            <input
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setOpen(null);
              }}
              placeholder="Try “health”, “chancellor” or “home office”"
              aria-label="Search offices"
              style={{ flex: "1 1 300px", maxWidth: 460, boxSizing: "border-box", padding: "13px 16px", fontFamily: FONT_BODY, fontSize: 16, border: `1px solid ${COLORS.hairline}`, borderRadius: 10, background: COLORS.paperCard, color: COLORS.ink }}
            />
            <div role="group" aria-label="Kind of post" style={{ display: "flex", gap: 6 }}>
              {[["all", "All"], ["gov", "Government"], ["opp", "Shadow"]].map(([key, label]) => (
                <button
                  key={key}
                  type="button"
                  aria-pressed={kind === key}
                  onClick={() => {
                    setKind(key);
                    setOpen(null);
                  }}
                  style={{ fontFamily: FONT_BODY, fontSize: 13, fontWeight: 600, padding: "8px 14px", borderRadius: 999, cursor: "pointer", border: `1px solid ${kind === key ? COLORS.accent : COLORS.hairline}`, background: kind === key ? `${COLORS.accent}1f` : "transparent", color: kind === key ? COLORS.accent : COLORS.inkSoft }}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          <p style={{ fontFamily: FONT_BODY, fontSize: 12.5, color: COLORS.inkSoft, lineHeight: 1.6, margin: "14px 0 18px", maxWidth: 680 }}>
            {query.trim() ? `${results.length} matching post${results.length === 1 ? "" : "s"}.` : "The posts held most often, to start with."} This covers the {people.toLocaleString("en-GB")} MPs and peers
            in Parliament today who have held a post. People who have since left Parliament aren't in it, so older holders of an office are missing: it shows who in Parliament today has
            held it, not everyone who ever has. The party shown is the one they sit for today. Tap a post to see its holders.
          </p>

          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {results.map((o) => (
              <OfficeRow key={`${o.kind}-${o.post}`} office={o} open={open === o.post} onToggle={() => setOpen(open === o.post ? null : o.post)} now={now} />
            ))}
            {results.length === 0 && <div style={{ fontFamily: FONT_DISPLAY, fontSize: 15, color: COLORS.inkSoft }}>No post matches that. Try fewer words, such as just the department.</div>}
          </div>
        </>
      )}
    </div>
  );
}

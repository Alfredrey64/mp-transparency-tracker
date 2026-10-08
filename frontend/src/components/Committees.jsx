import { useState, useEffect, useMemo } from "react";
import { supabase } from "../supabaseClient";
import { COLORS, FONT_DISPLAY, FONT_BODY, PAGE_PADDING } from "../theme";
import { PageHeader, LoadFailedNote } from "./shared";
import { GlossaryTerm } from "./GlossaryTerm";
import { partyColour, stripHtml, formatDate } from "../lib/format";
import { isScrolling } from "../lib/scrollState";
import { IconCommittee } from "./icons";
import CountUp from "./CountUp";

const HOUSE_FILTERS = ["All", "Commons", "Lords", "Joint"];

// The same green/red the bill-stage diagram already uses for the two
// Houses — real chamber colours (Commons benches are green, Lords' are
// red), not an arbitrary pair, so it means the same thing wherever it
// shows up on the site. Joint committees get the sitewide accent instead
// of a blend of the two, since "joint" isn't a colour between green and
// red, it's a genuinely different category.
const HOUSE_COLOR = { Commons: COLORS.commonsGreen, Lords: COLORS.garnet, Joint: COLORS.accent };

function MemberChip({ member, showHouse }) {
  const color = partyColour(member.party_colour, COLORS.inkSoft);
  const houseColor = HOUSE_COLOR[member.house];
  return (
    <span
      style={{
        display: "inline-flex", alignItems: "center", gap: 6, fontFamily: FONT_BODY, fontSize: 12.5,
        padding: "5px 10px 5px 8px", borderRadius: 999, background: COLORS.paper,
        border: `1px solid ${showHouse && houseColor ? `${houseColor}55` : COLORS.hairline}`,
      }}
    >
      <span style={{ width: 6, height: 6, borderRadius: "50%", background: color, flexShrink: 0 }} />
      <span style={{ color: COLORS.ink, fontWeight: member.is_chair ? 700 : 400 }}>
        {member.name}{member.is_chair ? " (Chair)" : ""}
      </span>
      {showHouse && houseColor && (
        <span style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.03em", color: houseColor }}>
          {member.house}
        </span>
      )}
    </span>
  );
}

function InquiryRow({ inquiry }) {
  return (
    <a
      href={inquiry.url}
      target="_blank"
      rel="noreferrer"
      style={{ display: "block", padding: "10px 0", borderTop: `1px solid ${COLORS.hairline}`, textDecoration: "none" }}
    >
      <div style={{ fontFamily: FONT_BODY, fontSize: 13.5, fontWeight: 600, color: COLORS.ink, marginBottom: 2 }}>
        {inquiry.title} ↗
      </div>
      <div style={{ fontFamily: FONT_BODY, fontSize: 11.5, color: COLORS.inkSoft }}>
        Opened {formatDate(inquiry.open_date)}
        {inquiry.close_date ? ` · Closes ${formatDate(inquiry.close_date)}` : ""}
      </div>
    </a>
  );
}

// One dot for every member, in their party's colour (the chair ringed): the committee's make-up at a glance, and
// the same colours used everywhere else on the site, so it needs no legend.
function MemberDots({ members, color }) {
  const dots = useMemo(() => {
    const counts = new Map();
    for (const m of members ?? []) {
      const key = m.party || "Other";
      counts.set(key, (counts.get(key) ?? 0) + 1);
    }
    return [...(members ?? [])]
      .sort((a, b) => (counts.get(b.party || "Other") ?? 0) - (counts.get(a.party || "Other") ?? 0) || String(a.party).localeCompare(String(b.party)))
      .map((m) => ({ color: partyColour(m.party_colour, COLORS.inkSoft), chair: m.is_chair, label: `${m.name}${m.party ? `, ${m.party}` : ""}` }));
  }, [members]);
  if (!dots.length) return null;
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginTop: 14 }} aria-label={`${dots.length} members by party`}>
      {dots.map((d, i) => (
        <span key={i} className="cm-dot" title={d.label} style={{ "--d": i, width: 13, height: 13, borderRadius: "50%", background: d.color, boxShadow: d.chair ? `0 0 0 2px ${COLORS.paperCard}, 0 0 0 3.5px ${color}` : "none", margin: d.chair ? 2 : 0 }} />
      ))}
    </div>
  );
}

const initials = (name) => String(name ?? "").replace(/^(The |Rt Hon |Dame |Sir |Lord |Baroness |Lady |Dr |Mr |Mrs |Ms )+/i, "").split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]).join("").toUpperCase();

function Stat({ value, label, color }) {
  return (
    <div style={{ position: "relative", overflow: "hidden", background: `linear-gradient(160deg, ${color}1f, ${COLORS.paperCard} 70%)`, border: `1px solid ${color}44`, borderRadius: 14, padding: "14px 16px" }}>
      <span aria-hidden="true" style={{ position: "absolute", right: -18, top: -18, width: 70, height: 70, borderRadius: "50%", background: `${color}22` }} />
      <div style={{ position: "relative", fontFamily: FONT_DISPLAY, fontSize: 30, fontWeight: 700, color: COLORS.ink, lineHeight: 1.1 }}>
        {typeof value === "number" ? <CountUp value={value} format={(n) => Math.round(n).toLocaleString("en-GB")} duration={1.1} /> : value}
      </div>
      <div style={{ fontFamily: FONT_BODY, fontSize: 12.5, color: COLORS.inkSoft, marginTop: 2 }}>{label}</div>
    </div>
  );
}

// A ring of every committee place, in party colours: who actually holds the scrutiny seats.
function PartyRing({ parties, total }) {
  const R = 62;
  const C = 2 * Math.PI * R;
  const [hover, setHover] = useState(null);
  const top = parties.slice(0, 7);
  const rest = parties.slice(7).reduce((n, p) => n + p.count, 0);
  const list = rest ? [...top, { name: "Other parties", count: rest, color: COLORS.inkSoft }] : top;
  // Where each segment starts around the ring.
  const starts = list.map((_, i) => list.slice(0, i).reduce((n, p) => n + (p.count / total) * C, 0));
  return (
    <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 150px) minmax(0, 1fr)", gap: 16, alignItems: "center" }}>
      <svg viewBox="0 0 160 160" width="100%" role="img" aria-label="Share of committee places by party" style={{ maxWidth: 170, justifySelf: "center" }}>
        <circle cx="80" cy="80" r={R} fill="none" stroke={COLORS.hairline} strokeWidth="24" opacity="0.5" />
        <g transform="rotate(-90 80 80)">
          {list.map((p, i) => {
            const len = (p.count / total) * C;
            return (
              <circle
                key={p.name} className="cm-seg" cx="80" cy="80" r={R} fill="none" stroke={p.color} strokeWidth="24"
                style={{ "--C": C, "--len": Math.max(0, len - 1.5), "--rest": C - Math.max(0, len - 1.5), "--i": i, strokeDashoffset: -starts[i], opacity: hover && hover !== p.name ? 0.25 : 1, transition: "opacity 0.15s" }}
              />
            );
          })}
        </g>
        <text x="80" y="78" textAnchor="middle" fontFamily={FONT_DISPLAY} fontSize="26" fontWeight="700" fill={COLORS.ink}>{total}</text>
        <text x="80" y="96" textAnchor="middle" fontFamily={FONT_BODY} fontSize="10.5" fill={COLORS.inkSoft}>places</text>
      </svg>
      <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "grid", gap: 2 }}>
        {list.map((p) => (
          <li key={p.name}
            onPointerEnter={(e) => { if (e.pointerType !== "touch" && !isScrolling()) setHover(p.name); }} onPointerLeave={() => setHover(null)}
            style={{ display: "flex", alignItems: "center", gap: 8, fontFamily: FONT_BODY, fontSize: 12.5, color: COLORS.ink, padding: "3px 0", opacity: hover && hover !== p.name ? 0.45 : 1 }}>
            <span style={{ width: 10, height: 10, borderRadius: "50%", background: p.color, flexShrink: 0 }} />
            <span style={{ flex: 1, minWidth: 0 }}>{p.name}</span>
            <strong style={{ fontVariantNumeric: "tabular-nums" }}>{p.count}</strong>
            <span style={{ color: COLORS.inkSoft, width: 34, textAlign: "right", fontVariantNumeric: "tabular-nums" }}>{Math.round((p.count / total) * 100)}%</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

// Horizontal bars that grow in when the page loads. Pressing one searches for that committee.
function BarList({ items, color, unit, onPick }) {
  const max = Math.max(1, ...items.map((i) => i.value));
  return (
    <ol style={{ listStyle: "none", margin: 0, padding: 0, display: "grid", gap: 7 }}>
      {items.map((it, i) => (
        <li key={it.id}>
          <button type="button" onClick={() => onPick(it.name)} style={{ display: "block", width: "100%", textAlign: "left", background: "none", border: "none", padding: 0, cursor: "pointer", font: "inherit" }}>
            <span style={{ display: "flex", justifyContent: "space-between", gap: 8, fontFamily: FONT_BODY, fontSize: 12.5, color: COLORS.ink, marginBottom: 3 }}>
              <span style={{ minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{it.name}</span>
              <strong style={{ flexShrink: 0, fontVariantNumeric: "tabular-nums" }}>{it.value} <span style={{ fontWeight: 400, color: COLORS.inkSoft }}>{unit}</span></strong>
            </span>
            <span aria-hidden="true" style={{ display: "block", height: 9, borderRadius: 5, background: `${color}1c`, overflow: "hidden" }}>
              <span className="cm-bar" style={{ "--i": i, display: "block", height: "100%", width: `${(it.value / max) * 100}%`, borderRadius: 5, background: `linear-gradient(90deg, ${color}aa, ${color})` }} />
            </span>
          </button>
        </li>
      ))}
    </ol>
  );
}

function Panel({ title, note, children }) {
  return (
    <section style={{ background: COLORS.paperCard, border: `1px solid ${COLORS.hairline}`, borderRadius: 16, padding: "16px 18px", minWidth: 0 }}>
      <h2 style={{ fontFamily: FONT_DISPLAY, fontSize: 17, color: COLORS.ink, margin: 0 }}>{title}</h2>
      {note && <p style={{ fontFamily: FONT_BODY, fontSize: 12, color: COLORS.inkSoft, margin: "3px 0 12px" }}>{note}</p>}
      {!note && <div style={{ height: 12 }} />}
      {children}
    </section>
  );
}

function CommitteeCard({ committee, open, onToggle, index = 0 }) {
  const color = partyColour(committee.chair_party_colour, COLORS.accent);
  const houseColor = HOUSE_COLOR[committee.house] ?? COLORS.inkSoft;
  const purpose = stripHtml(committee.purpose);
  const n = committee.members?.length ?? 0;
  const q = committee.inquiries?.length ?? 0;

  return (
    <div
      className="cm-card"
      style={{
        "--i": index, gridColumn: open ? "1 / -1" : undefined, background: `linear-gradient(160deg, ${houseColor}14, ${COLORS.paperCard} 55%)`,
        border: `1px solid ${open ? houseColor : COLORS.hairline}`, borderTop: `4px solid ${houseColor}`, borderRadius: 16, padding: 18, minWidth: 0,
        transition: "border-color 0.15s",
      }}
    >
      <button onClick={onToggle} aria-expanded={open} style={{ display: "block", width: "100%", background: "none", border: "none", padding: 0, cursor: "pointer", textAlign: "left", font: "inherit" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, marginBottom: 10 }}>
          <span style={{ fontFamily: FONT_BODY, fontSize: 11, fontWeight: 700, color: houseColor, background: `${houseColor}18`, border: `1px solid ${houseColor}44`, borderRadius: 999, padding: "3px 10px", textTransform: "uppercase", letterSpacing: "0.04em" }}>
            {committee.house}
          </span>
          {q > 0 && (
            <span style={{ fontFamily: FONT_BODY, fontSize: 11.5, fontWeight: 700, color: COLORS.ink, background: COLORS.paper, border: `1px solid ${COLORS.hairline}`, borderRadius: 999, padding: "3px 10px" }}>
              {q} open {q === 1 ? "inquiry" : "inquiries"}
            </span>
          )}
        </div>
        <div style={{ fontFamily: FONT_DISPLAY, fontSize: 19, color: COLORS.ink, lineHeight: 1.25, marginBottom: 12 }}>{committee.name}</div>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span aria-hidden="true" style={{ flexShrink: 0, width: 34, height: 34, borderRadius: "50%", background: committee.chair_name ? color : COLORS.hairline, color: "#fff", display: "grid", placeItems: "center", fontFamily: FONT_BODY, fontSize: 12.5, fontWeight: 800, textShadow: "0 1px 2px rgba(0,0,0,0.35)" }}>
            {committee.chair_name ? initials(committee.chair_name) : "?"}
          </span>
          <span style={{ fontFamily: FONT_BODY, fontSize: 13, color: COLORS.inkSoft, lineHeight: 1.35, minWidth: 0 }}>
            {committee.chair_name ? <>Chair<br /><strong style={{ color: COLORS.ink, fontSize: 13.5 }}>{committee.chair_name}</strong></> : "Chair not currently listed"}
          </span>
          <span style={{ marginLeft: "auto", textAlign: "right", fontFamily: FONT_BODY, fontSize: 12, color: COLORS.inkSoft, lineHeight: 1.2, flexShrink: 0 }}>
            <strong style={{ display: "block", fontFamily: FONT_DISPLAY, fontSize: 22, color: COLORS.ink }}>{n}</strong>members
          </span>
        </div>
        <MemberDots members={committee.members} color={houseColor} />
        <div style={{ fontFamily: FONT_BODY, fontSize: 12, fontWeight: 600, color: houseColor, marginTop: 12 }}>{open ? "Hide details ▴" : "Show members and inquiries ▾"}</div>
      </button>

      {open && (
        <div style={{ marginTop: 14, paddingTop: 14, borderTop: `1px solid ${COLORS.hairline}`, display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 340px), 1fr))", gap: "16px 28px" }}>
          <div style={{ minWidth: 0 }}>
            {purpose && <div style={{ fontFamily: FONT_BODY, fontSize: 13.5, color: COLORS.ink, lineHeight: 1.6, marginBottom: 14 }}>{purpose}</div>}
            <div style={{ fontFamily: FONT_BODY, fontWeight: 700, fontSize: 11, color: COLORS.inkSoft, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 8 }}>Members ({n})</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {(committee.members ?? []).map((m, i) => <MemberChip key={i} member={m} showHouse={committee.house === "Joint"} />)}
            </div>
          </div>
          {q > 0 && (
            <div style={{ minWidth: 0 }}>
              <div style={{ fontFamily: FONT_BODY, fontWeight: 700, fontSize: 11, color: COLORS.inkSoft, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 4 }}>Open inquiries</div>
              {committee.inquiries.map((inq, i) => <InquiryRow key={i} inquiry={inq} />)}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

const SORTS = [
  { id: "name", label: "A to Z", fn: (a, b) => a.name.localeCompare(b.name) },
  { id: "members", label: "Most members", fn: (a, b) => (b.members?.length ?? 0) - (a.members?.length ?? 0) || a.name.localeCompare(b.name) },
  { id: "inquiries", label: "Most open inquiries", fn: (a, b) => (b.inquiries?.length ?? 0) - (a.inquiries?.length ?? 0) || a.name.localeCompare(b.name) },
];

export default function Committees() {
  const [committees, setCommittees] = useState(null);
  const [failed, setFailed] = useState(false);
  const [houseFilter, setHouseFilter] = useState("All");
  const [sortId, setSortId] = useState("name");
  const [query, setQuery] = useState("");
  const [openId, setOpenId] = useState(null);

  useEffect(() => {
    supabase.from("committees").select("*").order("name", { ascending: true }).then(({ data, error }) => {
      setFailed(Boolean(error));
      setCommittees(data ?? []);
    });
  }, []);

  const counts = useMemo(() => {
    const out = { All: committees?.length ?? 0, members: 0, inquiries: 0 };
    for (const c of committees ?? []) {
      out[c.house] = (out[c.house] ?? 0) + 1;
      out.members += c.members?.length ?? 0;
      out.inquiries += c.inquiries?.length ?? 0;
    }
    return out;
  }, [committees]);

  // Whole-page figures for the diagrams: every committee place by party, and the busiest committees.
  const overall = useMemo(() => {
    const byParty = new Map();
    let total = 0;
    for (const c of committees ?? []) {
      for (const m of c.members ?? []) {
        const name = m.party || "Other";
        if (!byParty.has(name)) byParty.set(name, { name, count: 0, color: partyColour(m.party_colour, COLORS.inkSoft) });
        byParty.get(name).count += 1;
        total += 1;
      }
    }
    const top = (key) => [...(committees ?? [])].map((c) => ({ id: c.id, name: c.name, value: key(c) })).filter((x) => x.value > 0).sort((a, b) => b.value - a.value).slice(0, 7);
    return { parties: [...byParty.values()].sort((a, b) => b.count - a.count), total, inquiries: top((c) => c.inquiries?.length ?? 0), biggest: top((c) => c.members?.length ?? 0) };
  }, [committees]);

  const q = query.trim().toLowerCase();
  const filtered = useMemo(() => {
    if (!committees) return [];
    return committees
      .filter((c) => houseFilter === "All" || c.house === houseFilter)
      .filter((c) => !q || c.name.toLowerCase().includes(q) || String(c.chair_name ?? "").toLowerCase().includes(q))
      .sort(SORTS.find((x) => x.id === sortId).fn);
  }, [committees, houseFilter, q, sortId]);

  return (
    <div style={{ maxWidth: 1240, margin: "0 auto", padding: PAGE_PADDING }}>
      <PageHeader
        icon={IconCommittee}
        kicker="Select Committees"
        title="Who's scrutinising the government"
        maxWidth={900}
        subtitle={
          <>
            <GlossaryTerm term="Select Committee">Select committees</GlossaryTerm> are cross-party groups of MPs and
            peers who question ministers, gather evidence and publish reports on how well government departments are
            doing. Their work is separate from, and often more detailed than, what is debated on the floor of the
            Commons or Lords.
          </>
        }
      />

      {committees === null && (
        <div style={{ fontFamily: FONT_BODY, fontSize: 13.5, color: COLORS.inkSoft, marginTop: 24 }}>Loading…</div>
      )}

      {committees !== null && failed && (
        <div style={{ marginTop: 24 }}>
          <LoadFailedNote item="the committee list" />
        </div>
      )}

      {committees !== null && !failed && committees.length === 0 && (
        <div style={{ fontFamily: FONT_BODY, fontSize: 13.5, color: COLORS.inkSoft, marginTop: 24 }}>
          No committee data available yet.
        </div>
      )}

      {committees !== null && committees.length > 0 && (
        <>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(150px, 100%), 1fr))", gap: 12, marginTop: 24 }}>
            <Stat value={counts.All} label="committees" color={COLORS.accent} />
            <Stat value={counts.members} label="places held by MPs and peers" color={HOUSE_COLOR.Commons} />
            <Stat value={counts.inquiries} label="open inquiries" color="#E07A1F" />
            <Stat value={`${counts.Commons ?? 0} / ${counts.Lords ?? 0}`} label="Commons / Lords (plus joint)" color={HOUSE_COLOR.Lords} />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 340px), 1fr))", gap: 14, marginTop: 14 }}>
            <Panel title="Who holds the seats" note="Every committee place, by party">
              <PartyRing parties={overall.parties} total={overall.total} />
            </Panel>
            <Panel title="Busiest committees" note="Most open inquiries. Press one to find it.">
              <BarList items={overall.inquiries} color="#E07A1F" unit="inquiries" onPick={(name) => { setQuery(name); setOpenId(null); }} />
            </Panel>
            <Panel title="Biggest committees" note="Most members. Press one to find it.">
              <BarList items={overall.biggest} color={HOUSE_COLOR.Commons} unit="members" onPick={(name) => { setQuery(name); setOpenId(null); }} />
            </Panel>
          </div>

          <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: "10px 16px", marginTop: 22, marginBottom: 18 }}>
            <div role="radiogroup" aria-label="House" style={{ display: "inline-flex", flexWrap: "wrap", gap: 8 }}>
              {HOUSE_FILTERS.map((h) => {
                const c = HOUSE_COLOR[h] ?? COLORS.accent;
                const active = houseFilter === h;
                return (
                  <button
                    key={h} role="radio" aria-checked={active} onClick={() => setHouseFilter(h)}
                    style={{ fontFamily: FONT_BODY, fontSize: 12.5, fontWeight: 600, padding: "7px 14px", borderRadius: 999, minHeight: 36, border: `1px solid ${active ? c : COLORS.hairline}`, background: active ? c : "transparent", color: active ? "#fff" : COLORS.inkSoft, cursor: "pointer" }}
                  >
                    {h} <span style={{ opacity: 0.75 }}>{counts[h] ?? 0}</span>
                  </button>
                );
              })}
            </div>
            <input
              type="search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search by committee or chair" aria-label="Search committees"
              style={{ flex: "1 1 220px", maxWidth: 360, boxSizing: "border-box", padding: "9px 14px", fontFamily: FONT_BODY, fontSize: 14, border: `1px solid ${COLORS.hairline}`, borderRadius: 10, background: COLORS.paperCard, color: COLORS.ink }}
            />
            <label style={{ display: "inline-flex", alignItems: "center", gap: 8, fontFamily: FONT_BODY, fontSize: 12.5, color: COLORS.inkSoft }}>
              Sort
              <select value={sortId} onChange={(e) => setSortId(e.target.value)} style={{ fontFamily: FONT_BODY, fontSize: 14, padding: "8px 10px", borderRadius: 10, border: `1px solid ${COLORS.hairline}`, background: COLORS.paperCard, color: COLORS.ink }}>
                {SORTS.map((x) => <option key={x.id} value={x.id}>{x.label}</option>)}
              </select>
            </label>
          </div>

          {filtered.length === 0 && <div style={{ fontFamily: FONT_BODY, fontSize: 13.5, color: COLORS.inkSoft }}>No committee matches that.</div>}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(min(100%, 340px), 1fr))", gap: 14, alignItems: "start" }}>
            {filtered.map((c, i) => (
              <CommitteeCard key={c.id} index={i} committee={c} open={openId === c.id} onToggle={() => setOpenId(openId === c.id ? null : c.id)} />
            ))}
          </div>
          <p style={{ fontFamily: FONT_BODY, fontSize: 12, color: COLORS.inkSoft, marginTop: 18, lineHeight: 1.55 }}>
            Each dot is one member, in their party's colour; a ringed dot is the chair. Hover a dot for the name.
          </p>
        </>
      )}
    </div>
  );
}

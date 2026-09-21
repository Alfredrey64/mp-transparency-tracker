import { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import { supabase } from "../supabaseClient";
import { COLORS, FONT_DISPLAY, FONT_BODY, PAGE_PADDING } from "../theme";
import { partyColour, initials, formatDate, timeInOffice } from "../lib/format";
import { PageHeader } from "./shared";
import { IconLords } from "./icons";
import { withScrollPreserved } from "../lib/preserveScroll";

const PEERAGE_TYPES = ["Life peer", "Life Peer (judicial)", "Bishop"];

// How each type of peer actually gets a seat — a factual, structural
// explanation that applies to everyone of that type, so it's safe to show
// for all 815 peers without needing to research each one individually.
const PEERAGE_EXPLANATIONS = {
  "Life peer": "Appointed for life by the Monarch, on the Prime Minister's advice. Most are nominated by a party leader as a \"working peer\"; crossbenchers (no party) are instead recommended by the independent House of Lords Appointments Commission. The title and the seat both end when they die — it isn't inherited.",
  "Life Peer (judicial)": "A senior judge given a life peerage, continuing a centuries-old tradition of the UK's most senior judiciary sitting in the Lords — historically the Law Lords, who served as the country's final court of appeal before the Supreme Court took over that role in 2009.",
  "Bishop": "One of the 26 most senior Church of England bishops, who sit in the Lords by right as the \"Lords Spiritual\" — not appointed or elected, but seated by seniority once a diocesan vacancy comes up. They leave when they retire as a bishop, not for life.",
};

function DataScopeNote() {
  return (
    <div
      style={{
        background: COLORS.paperCard, border: `1px solid ${COLORS.hairline}`, borderRadius: 12, padding: "14px 18px",
        marginBottom: 24, fontFamily: FONT_BODY, fontSize: 13, lineHeight: 1.6, color: COLORS.inkSoft,
      }}
    >
This covers <em>who</em> sits in the House of Lords, and their recent debates and written questions — but not what
      they've declared or how they've voted. The official sources the rest of this site draws on for that (financial
      interests and division votes) turn out to only cover the Commons; there's no equivalent structured source for
      the Lords, including no attendance percentage, so rather than guess, it's simply left out. The{" "}
      <a href="https://www.parliament.uk/mps-lords-and-offices/standards-and-financial-interests/parliamentary-commissioner-for-standards/registers-of-interests/register-of-lords-interests/" target="_blank" rel="noreferrer" style={{ color: COLORS.ink, fontWeight: 600 }}>
        official Register of Lords' Interests
      </a>{" "}
      is public, if you want to look up a specific peer by hand.
    </div>
  );
}

function Avatar({ peer, color, size = 40 }) {
  const [errored, setErrored] = useState(false);
  const [loaded, setLoaded] = useState(false);
  if (peer.thumbnail_url && !errored) {
    return (
      <div style={{ width: size, height: size, borderRadius: "50%", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", background: COLORS.paperCard, border: `2px solid ${COLORS.paperCard}`, boxShadow: `0 0 0 2px ${color}55` }}>
        <img
          src={peer.thumbnail_url}
          alt=""
          onError={() => setErrored(true)}
          onLoad={() => setLoaded(true)}
          style={{ width: Math.round(size * 0.72), height: Math.round(size * 0.72), borderRadius: "50%", objectFit: "cover", objectPosition: "center", opacity: loaded ? 1 : 0, transition: "opacity 0.25s ease" }}
        />
      </div>
    );
  }
  return (
    <div style={{ width: size, height: size, borderRadius: "50%", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: FONT_DISPLAY, fontSize: size * 0.35, fontWeight: 600, color: "#fff", background: color }}>
      {initials(peer.name)}
    </div>
  );
}

function PeerDetail({ peer, onBack, formerMp }) {
  const color = partyColour(peer.party_colour, COLORS.inkSoft);
  const office = timeInOffice(peer.membership_start_date);

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, ease: "easeOut" }} style={{ padding: PAGE_PADDING }}>
      <button
        onClick={onBack}
        style={{ background: "none", border: "none", cursor: "pointer", fontFamily: FONT_BODY, fontSize: 13.5, color: COLORS.inkSoft, padding: 0, marginBottom: 20, display: "inline-block" }}
      >
        ← All Peers
      </button>

      <div style={{ maxWidth: 760, margin: "0 auto" }}>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", gap: 10, paddingBottom: 24, borderBottom: `1px solid ${COLORS.hairline}` }}>
          <Avatar peer={peer} color={color} size={92} />
          <h1 style={{ fontFamily: FONT_DISPLAY, fontSize: 28, color: COLORS.ink, margin: 0 }}>{peer.name}</h1>
          <div style={{ display: "flex", alignItems: "center", gap: 6, fontFamily: FONT_BODY, fontSize: 14.5, color: COLORS.inkSoft }}>
            <span style={{ width: 8, height: 8, borderRadius: "50%", background: color, flexShrink: 0 }} />
            {peer.party ?? "Crossbench / no party"} · {peer.peerage_type}
            {office && ` · in the Lords for ${office}`}
          </div>
          {peer.government_role && (
            <div style={{ display: "inline-flex", alignItems: "center", gap: 6, marginTop: 4, padding: "6px 14px", borderRadius: 999, background: `${COLORS.brass}14`, fontFamily: FONT_BODY, fontSize: 13, fontWeight: 700, color: COLORS.brass }}>
              {peer.government_role}
            </div>
          )}
        </div>

        <div style={{ paddingTop: 24 }}>
          <div style={{ background: COLORS.paperCard, border: `1px solid ${COLORS.hairline}`, borderTop: `3px solid ${COLORS.brass}`, borderRadius: 12, padding: 20, marginBottom: 16 }}>
            <div style={{ fontFamily: FONT_BODY, fontWeight: 600, fontSize: 15, color: COLORS.ink, marginBottom: 8 }}>Biography</div>
            {peer.wikipedia_bio ? (
              <>
                <div style={{ fontFamily: FONT_DISPLAY, fontSize: 15, color: COLORS.ink, lineHeight: 1.65, marginBottom: 8 }}>{peer.wikipedia_bio}</div>
                <div style={{ fontFamily: FONT_BODY, fontSize: 11.5, color: COLORS.inkSoft, opacity: 0.75 }}>
                  Via{" "}
                  {peer.wikipedia_url ? (
                    <a href={peer.wikipedia_url} target="_blank" rel="noreferrer" style={{ color: "inherit" }}>Wikipedia ↗</a>
                  ) : (
                    "Wikipedia"
                  )}
                  , not the official Parliament record — not independently verified.
                </div>
              </>
            ) : peer.biography ? (
              <div style={{ fontFamily: FONT_DISPLAY, fontSize: 15, color: COLORS.ink, lineHeight: 1.65 }}>{peer.biography}</div>
            ) : (
              <div style={{ fontFamily: FONT_BODY, fontSize: 13.5, color: COLORS.inkSoft }}>No biography available for this peer yet.</div>
            )}
          </div>

          {formerMp && (
            <div style={{ background: `${COLORS.brass}0c`, border: `1px solid ${COLORS.brass}33`, borderRadius: 12, padding: "14px 18px", marginBottom: 16 }}>
              <div style={{ fontFamily: FONT_BODY, fontWeight: 700, fontSize: 10.5, color: COLORS.brass, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 4 }}>
                Previously an MP
              </div>
              <div style={{ fontFamily: FONT_BODY, fontSize: 13.5, color: COLORS.ink, lineHeight: 1.55 }}>
                Served as MP for {formerMp.constituency} ({formerMp.party}) until {formatDate(formerMp.membership_end_date)}
                {formerMp.membership_end_reason ? ` (${formerMp.membership_end_reason.toLowerCase()})` : ""}.
              </div>
            </div>
          )}

          <div style={{ display: "flex", gap: 24, flexWrap: "wrap", background: COLORS.paperCard, border: `1px solid ${COLORS.hairline}`, borderRadius: 12, padding: 20, marginBottom: 16 }}>
            <div>
              <div style={{ fontFamily: FONT_BODY, fontSize: 10.5, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: COLORS.inkSoft, marginBottom: 3 }}>Peerage</div>
              <div style={{ fontFamily: FONT_BODY, fontSize: 14, color: COLORS.ink }}>{peer.peerage_type}</div>
            </div>
            <div>
              <div style={{ fontFamily: FONT_BODY, fontSize: 10.5, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: COLORS.inkSoft, marginBottom: 3 }}>Joined the Lords</div>
              <div style={{ fontFamily: FONT_BODY, fontSize: 14, color: COLORS.ink }}>{formatDate(peer.membership_start_date) ?? "Unknown"}</div>
            </div>
            {peer.government_role_start_date && (
              <div>
                <div style={{ fontFamily: FONT_BODY, fontSize: 10.5, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: COLORS.inkSoft, marginBottom: 3 }}>In role since</div>
                <div style={{ fontFamily: FONT_BODY, fontSize: 14, color: COLORS.ink }}>{formatDate(peer.government_role_start_date)}</div>
              </div>
            )}
          </div>

          {PEERAGE_EXPLANATIONS[peer.peerage_type] && (
            <div style={{ background: COLORS.paperCard, border: `1px solid ${COLORS.hairline}`, borderRadius: 12, padding: 20, marginBottom: 16 }}>
              <div style={{ fontFamily: FONT_BODY, fontWeight: 600, fontSize: 15, color: COLORS.ink, marginBottom: 8 }}>How They Got Here</div>
              <div style={{ fontFamily: FONT_BODY, fontSize: 13.5, color: COLORS.inkSoft, lineHeight: 1.65 }}>{PEERAGE_EXPLANATIONS[peer.peerage_type]}</div>
            </div>
          )}

          {peer.ministerial_history?.length > 0 && (
            <div style={{ background: COLORS.paperCard, border: `1px solid ${COLORS.hairline}`, borderRadius: 12, padding: 20, marginBottom: 16 }}>
              <div style={{ fontFamily: FONT_BODY, fontWeight: 600, fontSize: 15, color: COLORS.ink, marginBottom: 4 }}>Ministerial History</div>
              <div style={{ fontFamily: FONT_BODY, fontSize: 12, color: COLORS.inkSoft, marginBottom: 14, lineHeight: 1.5 }}>
                Every government post they've held, most recent first.
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {peer.ministerial_history.map((m, i) => (
                  <div key={i} style={{ display: "flex", gap: 10, alignItems: "flex-start", paddingBottom: 10, borderBottom: i < peer.ministerial_history.length - 1 ? `1px solid ${COLORS.hairline}` : "none" }}>
                    <span style={{ flexShrink: 0, width: 6, height: 6, borderRadius: "50%", background: m.endDate ? COLORS.inkSoft : COLORS.brass, marginTop: 6, opacity: m.endDate ? 0.5 : 1 }} />
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontFamily: FONT_BODY, fontWeight: 600, fontSize: 13.5, color: COLORS.ink, lineHeight: 1.4 }}>
                        {m.role}
                        {!m.endDate && (
                          <span style={{ marginLeft: 8, fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", color: COLORS.brass, background: `${COLORS.brass}18`, padding: "2px 8px", borderRadius: 999 }}>
                            Current
                          </span>
                        )}
                      </div>
                      <div style={{ fontFamily: FONT_BODY, fontSize: 11.5, color: COLORS.inkSoft, marginTop: 3 }}>
                        {m.department ? `${m.department} · ` : ""}
                        {formatDate(m.startDate)} – {m.endDate ? formatDate(m.endDate) : "present"}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {peer.committees?.length > 0 && (
            <div style={{ background: COLORS.paperCard, border: `1px solid ${COLORS.hairline}`, borderRadius: 12, padding: 20, marginBottom: 16 }}>
              <div style={{ fontFamily: FONT_BODY, fontWeight: 600, fontSize: 15, color: COLORS.ink, marginBottom: 4 }}>Committee Service</div>
              <div style={{ fontFamily: FONT_BODY, fontSize: 12, color: COLORS.inkSoft, marginBottom: 14, lineHeight: 1.5 }}>
                Lords select committees they've sat on, most recent first.
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {peer.committees.map((c, i) => (
                  <div key={i} style={{ display: "flex", gap: 10, alignItems: "flex-start", paddingBottom: 10, borderBottom: i < peer.committees.length - 1 ? `1px solid ${COLORS.hairline}` : "none" }}>
                    <span style={{ flexShrink: 0, width: 6, height: 6, borderRadius: "50%", background: c.endDate ? COLORS.inkSoft : COLORS.brass, marginTop: 6, opacity: c.endDate ? 0.5 : 1 }} />
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontFamily: FONT_BODY, fontWeight: 600, fontSize: 13.5, color: COLORS.ink, lineHeight: 1.4 }}>
                        {c.name}
                        {c.role && (
                          <span style={{ marginLeft: 8, fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", color: COLORS.brass, background: `${COLORS.brass}18`, padding: "2px 8px", borderRadius: 999 }}>
                            {c.role}
                          </span>
                        )}
                      </div>
                      <div style={{ fontFamily: FONT_BODY, fontSize: 11.5, color: COLORS.inkSoft, marginTop: 3 }}>
                        {formatDate(c.startDate)} – {c.endDate ? formatDate(c.endDate) : "present"}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {(peer.recent_activity?.contributions?.length > 0 || peer.recent_activity?.writtenQuestions?.length > 0) && (
            <div style={{ background: COLORS.paperCard, border: `1px solid ${COLORS.hairline}`, borderRadius: 12, padding: 20, marginBottom: 16 }}>
              <div style={{ fontFamily: FONT_BODY, fontWeight: 600, fontSize: 15, color: COLORS.ink, marginBottom: 4 }}>Recent Parliamentary Activity</div>
              <div style={{ fontFamily: FONT_BODY, fontSize: 12, color: COLORS.inkSoft, marginBottom: 14, lineHeight: 1.5 }}>
                Their most recent debate contributions and written questions, from Hansard and the official record. Not a
                voting record or attendance figure — neither is published for the Lords.
              </div>

              {peer.recent_activity.contributions?.length > 0 && (
                <div style={{ marginBottom: peer.recent_activity.writtenQuestions?.length > 0 ? 18 : 0 }}>
                  <div style={{ fontFamily: FONT_BODY, fontWeight: 700, fontSize: 10.5, color: COLORS.brass, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 8 }}>
                    Debate Contributions
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                    {peer.recent_activity.contributions.map((c, i) => (
                      <div key={i} style={{ paddingBottom: 10, borderBottom: i < peer.recent_activity.contributions.length - 1 ? `1px solid ${COLORS.hairline}` : "none" }}>
                        <div style={{ fontFamily: FONT_BODY, fontSize: 13.5, color: COLORS.ink, lineHeight: 1.4 }}>{c.title}</div>
                        <div style={{ fontFamily: FONT_BODY, fontSize: 11.5, color: COLORS.inkSoft, marginTop: 3 }}>
                          {formatDate(c.date)} · {c.section}
                          {c.speechCount > 0 ? ` · ${c.speechCount} speech${c.speechCount === 1 ? "" : "es"}` : ""}
                          {c.questionCount > 0 ? ` · ${c.questionCount} question${c.questionCount === 1 ? "" : "s"}` : ""}
                          {c.interventionCount > 0 ? ` · ${c.interventionCount} intervention${c.interventionCount === 1 ? "" : "s"}` : ""}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {peer.recent_activity.writtenQuestions?.length > 0 && (
                <div>
                  <div style={{ fontFamily: FONT_BODY, fontWeight: 700, fontSize: 10.5, color: COLORS.brass, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 8 }}>
                    Written Questions
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                    {peer.recent_activity.writtenQuestions.map((q, i) => (
                      <div key={i} style={{ paddingBottom: 10, borderBottom: i < peer.recent_activity.writtenQuestions.length - 1 ? `1px solid ${COLORS.hairline}` : "none" }}>
                        <div style={{ fontFamily: FONT_BODY, fontWeight: 600, fontSize: 12.5, color: COLORS.ink }}>{q.heading}</div>
                        <div style={{ fontFamily: FONT_BODY, fontSize: 13, color: COLORS.ink, lineHeight: 1.5, marginTop: 3 }}>{q.questionText}</div>
                        <div style={{ fontFamily: FONT_BODY, fontSize: 11.5, color: COLORS.inkSoft, marginTop: 4 }}>
                          To {q.department} · tabled {formatDate(q.dateTabled)}
                          {q.dateAnswered ? ` · answered ${formatDate(q.dateAnswered)}` : " · awaiting answer"}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          <DataScopeNote />
        </div>
      </div>
    </motion.div>
  );
}

export default function HouseOfLords() {
  const [peers, setPeers] = useState([]);
  const [formerMps, setFormerMps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [activeParty, setActiveParty] = useState("All");
  const [activeType, setActiveType] = useState("All");
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    async function load() {
      const [{ data: peerData }, { data: formerData }] = await Promise.all([
        supabase.from("peers").select("*").order("name"),
        supabase.from("former_mps").select("parliament_member_id, name, constituency, party, membership_end_date, membership_end_reason"),
      ]);
      setPeers(peerData ?? []);
      setFormerMps(formerData ?? []);
      setLoading(false);
    }
    load();
  }, []);

  // A peer who was previously an MP keeps the same Parliament member id
  // across both memberships — an exact match, not a name guess.
  const formerMpById = useMemo(() => {
    const map = new Map();
    for (const m of formerMps) map.set(m.parliament_member_id, m);
    return map;
  }, [formerMps]);

  const parties = useMemo(() => {
    const map = new Map();
    for (const p of peers) {
      if (!p.party) continue;
      if (!map.has(p.party)) map.set(p.party, { name: p.party, color: partyColour(p.party_colour, COLORS.inkSoft), count: 0 });
      map.get(p.party).count += 1;
    }
    return [...map.values()].sort((a, b) => b.count - a.count).slice(0, 10);
  }, [peers]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    let list = peers;
    if (activeParty !== "All") list = list.filter((p) => p.party === activeParty);
    if (activeType !== "All") list = list.filter((p) => p.peerage_type === activeType);
    if (q) list = list.filter((p) => p.name?.toLowerCase().includes(q) || p.party?.toLowerCase().includes(q));
    return list;
  }, [peers, query, activeParty, activeType]);

  if (selected) {
    return (
      <PeerDetail
        peer={selected}
        formerMp={formerMpById.get(selected.id)}
        onBack={() => { setSelected(null); window.scrollTo(0, 0); }}
      />
    );
  }

  return (
    <div style={{ padding: PAGE_PADDING }}>
      <PageHeader
        icon={IconLords}
        kicker="Public Record · House of Lords"
        title="Who's in the House of Lords"
        subtitle={loading ? "Loading current peers…" : `Every current member of the House of Lords — ${peers.length} peers in total.`}
      />

      <DataScopeNote />

      <div style={{ display: "flex", gap: 12, alignItems: "center", marginBottom: 16, flexWrap: "wrap" }}>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by name or party"
          style={{
            flex: "1 1 320px", maxWidth: 480, boxSizing: "border-box", padding: "13px 16px", fontFamily: FONT_BODY,
            fontSize: 15, border: `1px solid ${COLORS.hairline}`, borderRadius: 10, background: COLORS.paperCard, color: COLORS.ink,
          }}
        />
      </div>

      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 10 }}>
        <button
          onClick={() => withScrollPreserved(() => setActiveParty("All"))}
          style={{
            fontFamily: FONT_BODY, fontSize: 13, fontWeight: 600, padding: "7px 14px", borderRadius: 999,
            border: `1px solid ${activeParty === "All" ? COLORS.ink : COLORS.hairline}`,
            background: activeParty === "All" ? COLORS.ink : "transparent", color: activeParty === "All" ? "#fff" : COLORS.inkSoft, cursor: "pointer",
          }}
        >
          All parties
        </button>
        {parties.map((party) => {
          const active = activeParty === party.name;
          return (
            <button
              key={party.name}
              onClick={() => withScrollPreserved(() => setActiveParty(active ? "All" : party.name))}
              style={{
                fontFamily: FONT_BODY, fontSize: 13, fontWeight: 600, display: "flex", alignItems: "center", gap: 6,
                padding: "7px 14px", borderRadius: 999, border: `1px solid ${active ? party.color : COLORS.hairline}`,
                background: active ? `${party.color}1a` : "transparent", color: active ? party.color : COLORS.inkSoft, cursor: "pointer",
              }}
            >
              <span style={{ width: 8, height: 8, borderRadius: "50%", background: party.color }} />
              {party.name}
              <span style={{ opacity: 0.6, fontWeight: 400 }}>{party.count}</span>
            </button>
          );
        })}
      </div>

      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 24 }}>
        {["All", ...PEERAGE_TYPES].map((t) => (
          <button
            key={t}
            onClick={() => withScrollPreserved(() => setActiveType(t))}
            style={{
              fontFamily: FONT_BODY, fontSize: 12, fontWeight: 600, padding: "5px 12px", borderRadius: 999,
              border: `1px solid ${activeType === t ? COLORS.brass : COLORS.hairline}`,
              background: activeType === t ? `${COLORS.brass}14` : "transparent", color: activeType === t ? COLORS.brass : COLORS.inkSoft, cursor: "pointer",
            }}
          >
            {t}
          </button>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 12 }}>
        {!loading &&
          filtered.map((p, i) => {
            const color = partyColour(p.party_colour, COLORS.inkSoft);
            return (
              <motion.button
                key={p.id}
                onClick={() => { setSelected(p); window.scrollTo(0, 0); }}
                initial={{ opacity: 0, y: 8 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "80px" }}
                transition={{ duration: 0.25, delay: (i % 16) * 0.02, ease: "easeOut" }}
                whileHover={{ y: -3, boxShadow: "0 8px 20px rgba(30,42,68,0.14)" }}
                style={{
                  textAlign: "left", display: "flex", alignItems: "center", gap: 12, padding: "12px 14px",
                  background: `linear-gradient(135deg, ${color}1c, ${color}08 55%, ${COLORS.paperCard} 100%)`,
                  border: `1px solid ${COLORS.hairline}`, borderRadius: 12, cursor: "pointer", boxShadow: "0 1px 3px rgba(30,42,68,0.06)",
                }}
              >
                <Avatar peer={p} color={color} />
                <span style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontFamily: FONT_DISPLAY, fontSize: 17, color: COLORS.ink, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                    {p.name}
                  </div>
                  <div style={{ fontFamily: FONT_BODY, fontSize: 12.5, color: COLORS.inkSoft, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                    {p.party ?? "Crossbench"} · {p.peerage_type}
                  </div>
                </span>
              </motion.button>
            );
          })}

        {!loading && filtered.length === 0 && (
          <div style={{ gridColumn: "1 / -1", fontFamily: FONT_BODY, fontSize: 13.5, color: COLORS.inkSoft, textAlign: "center", padding: "20px 0" }}>
            No peers match your filters.
          </div>
        )}
      </div>
    </div>
  );
}

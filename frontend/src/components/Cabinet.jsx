import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { supabase } from "../supabaseClient";
import { COLORS, FONT_DISPLAY, FONT_BODY, PAGE_PADDING, readable, chip } from "../theme";
import { partyColour, formatDate, stripHtml } from "../lib/format";
import { PageHeader } from "./shared";
import { LoadFailedNote } from "./MpCards";
import {
  IconCabinet, IconEconomy, IconGlobe, IconGavel, IconHealth, IconBook, IconFactory, IconHome,
  IconTransport, IconLeaf, IconBroadcast, IconHardHat, IconThinkTank, IconDevolved, IconBills,
  IconGroup, IconQuestion,
} from "./icons";
import { withScrollPreserved } from "../lib/preserveScroll";
import Loading from "./Loading";
import "../cabinet.css";

// Cabinet roles don't carry a clean "department" field of their own — we
// infer one from the role title itself (most already name their department
// in parentheses, e.g. "Minister of State (Department of Health and Social
// Care)"). Checked in order, most specific/unusual titles first, so an
// oddity like "Parliamentary Secretary to the Treasury" (the formal name
// for the Government Chief Whip) lands in Whips Office, not Treasury.
const AREA_RULES = [
  { area: "Whips Office", test: /whip|treasurer of hm household|vice-chamberlain|lord[s]? in waiting|parliamentary secretary to the treasury/i },
  { area: "Prime Minister & Cabinet Office", test: /prime minister|cabinet office|duchy of lancaster/i },
  { area: "Treasury & Economy", test: /treasury|exchequer/i },
  { area: "Foreign, Commonwealth & Defence", test: /foreign|defence|commonwealth|development office|fcdo/i },
  { area: "Home Office & Justice", test: /home office|home secretary|justice|attorney general|solicitor general|lord chancellor/i },
  { area: "Leader of the House", test: /leader of the house/i },
  { area: "Health & Social Care", test: /health|social care/i },
  { area: "Education", test: /education|skills/i },
  { area: "Business, Trade & Energy", test: /business|trade|energy|net zero|industrial strategy/i },
  { area: "Housing & Local Government", test: /housing|communities|local government|levelling up/i },
  { area: "Transport", test: /transport/i },
  { area: "Environment, Food & Rural Affairs", test: /environment|rural affairs|\bfood\b|defra/i },
  { area: "Culture, Media, Digital & Sport", test: /culture|media|digital|sport|dcms/i },
  { area: "Work & Pensions", test: /work and pensions|\bpensions\b/i },
  { area: "Science, Innovation & Technology", test: /science|technology|innovation/i },
  { area: "Scotland, Wales & Northern Ireland", test: /scotland|wales|northern ireland/i },
];

const AREA_DISPLAY_ORDER = [
  "Prime Minister & Cabinet Office",
  "Treasury & Economy",
  "Foreign, Commonwealth & Defence",
  "Home Office & Justice",
  "Health & Social Care",
  "Education",
  "Business, Trade & Energy",
  "Housing & Local Government",
  "Transport",
  "Environment, Food & Rural Affairs",
  "Culture, Media, Digital & Sport",
  "Work & Pensions",
  "Science, Innovation & Technology",
  "Scotland, Wales & Northern Ireland",
  "Leader of the House",
  "Whips Office",
  "Other Cabinet Roles",
];

// What each part of government is actually responsible for — shown once
// per section, and used as a fallback "about this role" description for
// junior ministers whose exact title isn't specific enough to describe on
// its own (see ROLE_DESCRIPTIONS below for named roles).
const AREA_DESCRIPTIONS = {
  "Prime Minister & Cabinet Office": "The Prime Minister leads the government, chairs Cabinet, and appoints ministers. The Cabinet Office sits at the centre of government, coordinating policy and supporting Cabinet's work across every department.",
  "Treasury & Economy": "HM Treasury sets tax policy, controls how much every other department gets to spend, and manages the overall health of the UK economy.",
  "Foreign, Commonwealth & Defence": "The Foreign, Commonwealth & Development Office runs UK diplomacy, international relations and overseas aid. The Ministry of Defence runs the armed forces and national security.",
  "Home Office & Justice": "The Home Office is responsible for policing, immigration, counter-terrorism and borders. The Ministry of Justice runs prisons, courts, and the wider justice system.",
  "Health & Social Care": "Runs the NHS and the social care system, and sets public health policy for England.",
  "Education": "Sets policy for schools, colleges, universities, and apprenticeships in England.",
  "Business, Trade & Energy": "Covers business regulation, international trade deals, and the UK's energy supply and climate targets.",
  "Housing & Local Government": "Sets housing policy, funds local councils, and oversees local government in England.",
  "Transport": "Runs national transport policy, roads, rail, aviation, and maritime.",
  "Environment, Food & Rural Affairs": "Covers farming, fishing, the natural environment, and food policy.",
  "Culture, Media, Digital & Sport": "Covers the arts, media, sport, tourism, and digital and technology policy.",
  "Work & Pensions": "Runs the benefits system, the state pension, and employment support.",
  "Science, Innovation & Technology": "Sets policy for scientific research, innovation funding, and technology regulation.",
  "Scotland, Wales & Northern Ireland": "Represents the UK government in the devolved nations, and manages the relationship between Westminster and the devolved administrations.",
  "Leader of the House": "Organises government business in the Commons and represents the government's interests to MPs.",
  "Whips Office": "Enforces party discipline, manages the parliamentary timetable, and counts votes: the internal machinery that keeps a government's working majority together.",
  "Other Cabinet Roles": "Cabinet-level responsibilities that don't map neatly onto a single government department.",
};

// A small pictogram per department area, so the org chart's badges read as
// "which department is this" at a glance rather than just a bare member
// count — the count moved to its own caption underneath instead.
const AREA_ICONS = {
  "Prime Minister & Cabinet Office": IconCabinet,
  "Treasury & Economy": IconEconomy,
  "Foreign, Commonwealth & Defence": IconGlobe,
  "Home Office & Justice": IconGavel,
  "Health & Social Care": IconHealth,
  Education: IconBook,
  "Business, Trade & Energy": IconFactory,
  "Housing & Local Government": IconHome,
  Transport: IconTransport,
  "Environment, Food & Rural Affairs": IconLeaf,
  "Culture, Media, Digital & Sport": IconBroadcast,
  "Work & Pensions": IconHardHat,
  "Science, Innovation & Technology": IconThinkTank,
  "Scotland, Wales & Northern Ireland": IconDevolved,
  "Leader of the House": IconBills,
  "Whips Office": IconGroup,
  "Other Cabinet Roles": IconQuestion,
};

// Specific descriptions for the most senior, best-known titles — checked in
// order, so a more specific match (e.g. a named department) wins over a
// broader one. Anything that doesn't match falls back to its department's
// AREA_DESCRIPTIONS entry above, which is always accurate even if less
// specific to that particular minister's exact brief.
const ROLE_DESCRIPTIONS = [
  { test: /^prime minister/i, text: "Leads the government, chairs Cabinet, appoints and dismisses ministers, and answers to the Commons every week at Prime Minister's Questions." },
  { test: /chancellor of the exchequer/i, text: "The government's chief finance minister, sets tax policy, controls public spending, and delivers the annual Budget." },
  { test: /chief secretary to the treasury/i, text: "The Treasury's second-in-command on spending, negotiates every other department's budget and polices public spending discipline." },
  { test: /home secretary/i, text: "Runs the Home Office, responsible for policing, immigration, counter-terrorism, and public safety." },
  { test: /foreign secretary/i, text: "Leads UK diplomacy and foreign policy, and represents the UK abroad." },
  { test: /secretary of state for defence/i, text: "Oversees the armed forces and the UK's defence and national security policy." },
  { test: /lord chancellor/i, text: "The government's most senior legal officer, traditionally combined with the role of Justice Secretary, responsible for the courts system and judicial independence." },
  { test: /attorney general/i, text: "The government's chief legal adviser on matters of law and international law." },
  { test: /solicitor general/i, text: "Deputises for the Attorney General as a government legal adviser." },
  { test: /chancellor of the duchy of lancaster/i, text: "A senior Cabinet Office role, traditionally used flexibly for cross-government coordination and special projects." },
  { test: /leader of the house/i, text: "Organises government business in the Commons and represents the government's interests to MPs." },
  { test: /chief whip|treasurer of hm household|parliamentary secretary to the treasury/i, text: "Enforces party discipline and manages the parliamentary timetable: the government's most senior whip." },
  { test: /secretary of state for health/i, text: "Runs the Department of Health and Social Care, responsible for the NHS and social care policy in England." },
  { test: /secretary of state for education/i, text: "Runs the Department for Education, responsible for schools, colleges, universities and apprenticeships." },
  { test: /secretary of state for.*business/i, text: "Runs the government's business, trade and industrial strategy department." },
  { test: /secretary of state for energy/i, text: "Responsible for the UK's energy supply and its net zero climate targets." },
  { test: /deputy prime minister/i, text: "Deputises for the Prime Minister, and, combined with a departmental role, usually leads on housing and local government too." },
  { test: /secretary of state for housing/i, text: "Runs housing policy, funds local councils, and oversees local government in England." },
  { test: /secretary of state for transport/i, text: "Runs national transport policy, roads, rail, aviation and maritime." },
  { test: /secretary of state for environment/i, text: "Runs farming, fishing, environment and food policy." },
  { test: /secretary of state for culture/i, text: "Runs arts, media, sport, tourism and digital policy." },
  { test: /secretary of state for work and pensions/i, text: "Runs the benefits system, the state pension, and employment support." },
  { test: /secretary of state for science/i, text: "Runs science, research and technology policy." },
  { test: /secretary of state for scotland/i, text: "Represents Scotland's interests in the UK government, and the UK government's interests in Scotland." },
  { test: /secretary of state for wales/i, text: "Represents Wales's interests in the UK government, and the UK government's interests in Wales." },
  { test: /secretary of state for northern ireland/i, text: "Represents Northern Ireland's interests in the UK government, and oversees the UK government's role in the devolved settlement there." },
];

function inferArea(role) {
  if (!role) return "Other Cabinet Roles";
  const hit = AREA_RULES.find((rule) => rule.test.test(role));
  return hit ? hit.area : "Other Cabinet Roles";
}

function roleDescriptionFor(role, area) {
  const specific = ROLE_DESCRIPTIONS.find((r) => r.test.test(role ?? ""));
  if (specific) return specific.text;
  return AREA_DESCRIPTIONS[area] ?? null;
}

function groupByArea(members) {
  const map = new Map();
  for (const m of members) {
    const area = inferArea(m.cabinet_role);
    if (!map.has(area)) map.set(area, []);
    map.get(area).push(m);
  }
  return AREA_DISPLAY_ORDER
    .map((area) => ({ area, members: map.get(area) ?? [] }))
    .filter((g) => g.members.length > 0);
}

function useCabinet() {
  const [members, setMembers] = useState(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    async function load() {
      const { data, error } = await supabase
        .from("politicians")
        .select("id, name, party, party_colour, constituency, thumbnail_url, cabinet_role, cabinet_role_start_date, biography")
        .not("cabinet_role", "is", null)
        .order("cabinet_role_start_date", { ascending: true });
      setFailed(Boolean(error));
      setMembers(data ?? []);
    }
    load();
  }, []);

  return { members, failed };
}

function Avatar({ url, name, color, size = 64 }) {
  const [loaded, setLoaded] = useState(false);
  const [errored, setErrored] = useState(false);
  if (!url || errored) {
    return (
      <div
        style={{
          width: size, height: size, borderRadius: "50%", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center",
          ...chip(color), fontFamily: FONT_DISPLAY, fontSize: size * 0.32, fontWeight: 600,
        }}
      >
        {name?.split(/\s+/).map((w) => w[0]).slice(-2).join("").toUpperCase()}
      </div>
    );
  }
  return (
    <div style={{ width: size, height: size, borderRadius: "50%", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", background: COLORS.paperCard, border: `1px solid ${COLORS.hairline}`, overflow: "hidden" }}>
      <img loading="lazy" decoding="async"
        src={url}
        alt=""
        onLoad={() => setLoaded(true)}
        onError={() => setErrored(true)}
        style={{ width: Math.round(size * 0.72), height: Math.round(size * 0.72), borderRadius: "50%", objectFit: "cover", objectPosition: "center", opacity: loaded ? 1 : 0, transition: "opacity 0.25s ease" }}
      />
    </div>
  );
}

function CabinetCard({ member, area, index, onViewProfile, boss }) {
  const [open, setOpen] = useState(false);
  const color = partyColour(member.party_colour, COLORS.inkSoft);
  const bio = stripHtml(member.biography);
  const roleText = roleDescriptionFor(member.cabinet_role, area);

  return (
    <motion.div
      layout="position"
      initial={{ opacity: 0, y: 14 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      whileHover={{ borderColor: color, transition: { duration: 0.15, delay: 0 } }}
      transition={{ duration: 0.32, delay: Math.min(index ?? 0, 8) * 0.03, ease: "easeOut" }}
      style={{
        background: COLORS.paperCard, border: `1px solid ${COLORS.hairline}`, boxShadow: `var(--shadow-1), inset 0 3px 0 ${color}`, borderRadius: 14, padding: 20,
      }}
    >
      <button onClick={() => withScrollPreserved(() => setOpen((v) => !v))} style={{ display: "block", width: "100%", background: "none", border: "none", padding: 0, cursor: "pointer", textAlign: "left" }}>
        <div style={{ display: "flex", gap: 14, alignItems: "flex-start" }}>
          <Avatar url={member.thumbnail_url} name={member.name} color={color} />
          <div style={{ minWidth: 0, flex: 1 }}>
            <div style={{ fontFamily: FONT_DISPLAY, fontSize: 17.5, color: COLORS.ink, lineHeight: 1.3 }}>{member.name}</div>
            <div style={{ fontFamily: FONT_BODY, fontWeight: 700, fontSize: 13, color: readable(color), marginTop: 3, lineHeight: 1.35 }}>{member.cabinet_role}</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 7 }}>
              <span className="cab-rank" data-rank={rankOf(member.cabinet_role)}>{RANK_LABEL[rankOf(member.cabinet_role)]}</span>
              {boss && <span className="cab-boss">Works for {boss.name}</span>}
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 6, flexWrap: "wrap" }}>
              <span style={{ width: 6, height: 6, borderRadius: "50%", background: color, flexShrink: 0 }} />
              <span style={{ fontFamily: FONT_BODY, fontSize: 12, color: COLORS.inkSoft }}>
                {member.party} · {member.constituency}
              </span>
            </div>
            {member.cabinet_role_start_date && (
              <div style={{ fontFamily: FONT_BODY, fontSize: 11.5, color: COLORS.inkSoft, marginTop: 3 }}>
                In role since {formatDate(member.cabinet_role_start_date)}
              </div>
            )}
          </div>
          <motion.span animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.2 }} style={{ flexShrink: 0, color: COLORS.inkSoft, fontSize: 13, marginTop: 4 }}>▾</motion.span>
        </div>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.22 }} style={{ overflow: "hidden" }}>
            <div style={{ marginTop: 16, paddingTop: 16, borderTop: `1px solid ${COLORS.hairline}` }}>
              {roleText && (
                <div style={{ background: `${color}0d`, border: `1px solid ${color}33`, borderRadius: 10, padding: "10px 13px", marginBottom: 14 }}>
                  <div style={{ fontFamily: FONT_BODY, fontWeight: 700, fontSize: 11, color: readable(color), textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 4 }}>
                    What this role does
                  </div>
                  <div style={{ fontFamily: FONT_BODY, fontSize: 13, color: COLORS.ink, lineHeight: 1.55 }}>{roleText}</div>
                </div>
              )}
              <div style={{ fontFamily: FONT_BODY, fontWeight: 700, fontSize: 11, color: COLORS.inkSoft, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 8 }}>
                Biography
              </div>
              {bio ? (
                <div style={{ fontFamily: FONT_DISPLAY, fontSize: 14, color: COLORS.ink, lineHeight: 1.6, marginBottom: 14 }}>{bio}</div>
              ) : (
                <div style={{ fontFamily: FONT_BODY, fontSize: 13, color: COLORS.inkSoft, marginBottom: 14 }}>No official biography published for this MP yet.</div>
              )}
              {onViewProfile && (
                <button
                  onClick={() => onViewProfile(member)}
                  style={{ fontFamily: FONT_BODY, fontWeight: 700, fontSize: 12.5, color: readable(color), background: "none", border: "none", padding: 0, cursor: "pointer" }}
                >
                  View full MP profile, donations, votes & more
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

const SECTION_ACCENTS = [
  "#1E4FB8", "#0E9AA7", "#7A5AF0", "#E0367A", "#E8741A", "#1FA97C", "#C7871A", "#D6455D", "#2E86C1", "#8E5BB5", "#3F9B3F", "#C0561F", "#2A9D8F", "#B5651D", "#5B6B84", "#6E4B6E", "#4C6FA6",
];

// How senior a role is, so each department can show who leads it and who works for them. 0 is the Prime Minister, 1 a head of a department (a
// Secretary of State or an equivalent), 2 a Minister of State, 3 a junior minister, 4 anything else.
function rankOf(role) {
  const r = String(role ?? "");
  if (/^prime minister/i.test(r)) return 0;
  if (/deputy prime minister|^secretary of state|chancellor of the exchequer|^home secretary|^foreign secretary|lord chancellor|chancellor of the duchy|leader of the house|chief whip|attorney general|chief secretary to the treasury/i.test(r)) return 1;
  if (/minister of state/i.test(r)) return 2;
  if (/parliamentary under|parliamentary secretary|assistant whip|lord[s]? in waiting|lord commissioner|vice-chamberlain|solicitor general|treasurer of hm household|comptroller/i.test(r)) return 3;
  return 4;
}
const RANK_LABEL = ["Prime Minister", "Heads a department", "Minister of State", "Junior minister", "Other role"];
const shortRole = (role) => String(role ?? "").replace(/\s*\(.*$/, "").replace(/^Secretary of State for /i, "Secretary of State, ");

function jumpToArea(area) {
  document.getElementById(`cabinet-${area}`)?.scrollIntoView({ behavior: "smooth", block: "start" });
}

// Tracks how many department nodes fit per row, so the chart can chunk
// departments into explicit rows itself rather than leaving it to CSS
// flex-wrap to decide. That distinction matters: with flex-wrap, only the
// row lucky enough to sit directly under the single drawn spine line
// actually connects to it — every row after the first got a stub line
// floating above it, connected to nothing. Owning the row boundaries
// means every row can get its own spine, so the chart is structurally
// correct (every branch really does trace back to the PM) at any width.
//
// Measures the chart's own rendered width rather than window.innerWidth —
// this page's sidebar alone eats over 200px, so at a "medium" browser
// width, going off the window's width picked a column count that didn't
// actually fit the much narrower content column next to the sidebar,
// clipping the row's rightmost node instead of wrapping it.
const NODE_WIDTH = 190;
const NODE_GAP = 18;

function useResponsiveColumns(containerRef) {
  const [columns, setColumns] = useState(3);
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    function update(width) {
      const fit = Math.floor((width + NODE_GAP) / (NODE_WIDTH + NODE_GAP));
      setColumns(Math.max(1, fit));
    }
    update(el.getBoundingClientRect().width);
    const observer = new ResizeObserver(([entry]) => update(entry.contentRect.width));
    observer.observe(el);
    return () => observer.disconnect();
  }, [containerRef]);
  return columns;
}

// One department in the chart: its name and colour, the person who leads it, and the small team that works for them.
function DeptNode({ group, delay }) {
  const Icon = AREA_ICONS[group.area] ?? IconQuestion;
  const accent = group.accent;
  const head = group.head;
  const team = group.members.filter((m) => m !== head);
  const shown = team.slice(0, 5);
  return (
    <motion.button
      type="button"
      onClick={() => jumpToArea(group.area)}
      initial={{ opacity: 0, y: -10 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.35, delay: delay + 0.1, ease: "easeOut" }}
      whileHover={{ y: -4 }}
      className="cab-node" style={{ "--ca": accent, width: NODE_WIDTH }}
      aria-label={`${group.area}: led by ${head?.name ?? "no one listed"}, with ${team.length} ${team.length === 1 ? "minister" : "ministers"} working for them. Jump to the list.`}
    >
      <motion.span aria-hidden="true" className="cab-stem" initial={{ height: 0 }} whileInView={{ height: 20 }} viewport={{ once: true, margin: "-40px" }} transition={{ duration: 0.2, delay }} />
      <span className="cab-node-head"><span className="cab-node-icon"><Icon size={17} /></span><b>{group.area}</b></span>
      {head && (
        <span className="cab-node-lead">
          <Avatar url={head.thumbnail_url} name={head.name} color={partyColour(head.party_colour, COLORS.inkSoft)} size={44} />
          <span>
            <strong>{head.name}</strong>
            <em className="cab-clamp">{shortRole(head.cabinet_role)}</em>
          </span>
        </span>
      )}
      <span className="cab-node-team">
        {team.length > 0 ? (
          <>
            <span className="cab-faces" aria-hidden="true">
              {shown.map((m) => <Avatar key={m.id} url={m.thumbnail_url} name={m.name} color={partyColour(m.party_colour, COLORS.inkSoft)} size={26} />)}
              {team.length > shown.length && <i>+{team.length - shown.length}</i>}
            </span>
            <span className="cab-node-count">{team.length} {team.length === 1 ? "minister works" : "ministers work"} for them</span>
          </>
        ) : <span className="cab-node-count">Works on their own</span>}
      </span>
    </motion.button>
  );
}

// One tier of the chart: a line along the top of just this row's nodes, with a short stem down to each.
function OrgChartRow({ row, baseDelay }) {
  return (
    <div style={{ display: "inline-flex", flexDirection: "column", alignItems: "center", position: "relative" }}>
      {row.length > 1 && (
        <motion.div
          initial={{ scaleX: 0 }} whileInView={{ scaleX: 1 }} viewport={{ once: true, margin: "-40px" }} transition={{ duration: 0.35, delay: baseDelay, ease: "easeOut" }}
          style={{ position: "absolute", top: 0, left: NODE_WIDTH / 2, right: NODE_WIDTH / 2, height: 3, borderRadius: 2, background: "color-mix(in srgb, var(--c-ink-soft) 40%, var(--c-hairline))", transformOrigin: "center" }}
        />
      )}
      <div style={{ display: "flex", justifyContent: "center", gap: `22px ${NODE_GAP}px`, paddingTop: 20 }}>
        {row.map((group, i) => <DeptNode key={group.area} group={group} delay={baseDelay + i * 0.04} />)}
      </div>
    </div>
  );
}

// An org chart you can read from the top: the Prime Minister, who appoints the head of every department; under each head, the ministers who work
// for them. A line joins every box to the one above it. Tap a department to jump to its full list.
function CabinetOrgChart({ groups, pm }) {
  const containerRef = useRef(null);
  const columns = useResponsiveColumns(containerRef);
  if (groups.length === 0) return null;
  const rows = [];
  for (let i = 0; i < groups.length; i += columns) rows.push(groups.slice(i, i + columns));
  const pmColor = pm ? partyColour(pm.party_colour, COLORS.accent) : COLORS.accent;
  return (
    <section aria-labelledby="h-cab-chart" className="cab-chart">
      <h2 id="h-cab-chart" className="cab-chart-title">Who works for whom</h2>
      <p className="cab-chart-lead">The Prime Minister picks the head of each department. Each head leads a team of ministers who answer to them. Tap a box to see the whole team.</p>
      <div ref={containerRef} style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
        <motion.div
          initial={{ opacity: 0, y: -8, scale: 0.92 }} whileInView={{ opacity: 1, y: 0, scale: 1 }} viewport={{ once: true, margin: "-40px" }} transition={{ duration: 0.4, ease: "backOut" }}
          className="cab-pm" style={{ "--pc": pmColor }}
        >
          {pm && <Avatar url={pm.thumbnail_url} name={pm.name} color={pmColor} size={64} />}
          <span>
            <em>Prime Minister</em>
            <strong>{pm?.name ?? "The Prime Minister"}</strong>
            <small>Leads the government and appoints every minister</small>
          </span>
        </motion.div>
        <motion.div initial={{ height: 0 }} whileInView={{ height: 26 }} viewport={{ once: true, margin: "-40px" }} transition={{ duration: 0.25, delay: 0.3, ease: "easeOut" }} style={{ width: 3, borderRadius: 2, background: "color-mix(in srgb, var(--c-ink-soft) 40%, var(--c-hairline))" }} />
        {rows.map((row, ri) => {
          const rowDelay = 0.55 + ri * 0.35;
          return (
            <div key={ri} style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
              {ri > 0 && <motion.div initial={{ height: 0 }} whileInView={{ height: 20 }} viewport={{ once: true, margin: "-40px" }} transition={{ duration: 0.2, delay: rowDelay - 0.12, ease: "easeOut" }} style={{ width: 3, borderRadius: 2, background: "color-mix(in srgb, var(--c-ink-soft) 40%, var(--c-hairline))" }} />}
              <OrgChartRow row={row} baseDelay={rowDelay} />
            </div>
          );
        })}
      </div>
      <ul className="cab-ranks" aria-label="What the ranks mean">
        <li><b>Head of department</b><span>Usually a Secretary of State. Sits in Cabinet.</span></li>
        <li><b>Minister of State</b><span>Works for the head, and leads on a part of the department's job.</span></li>
        <li><b>Junior minister</b><span>Works for the head and the ministers above, on a narrower area.</span></li>
      </ul>
    </section>
  );
}

export default function Cabinet({ onViewProfile }) {
  const { members, failed } = useCabinet();
  const groups = members ? groupByArea(members) : [];
  const pm = members?.find((m) => rankOf(m.cabinet_role) === 0) ?? null;
  // For the chart: each department's head and team, with the Prime Minister taken out of the Cabinet Office's team.
  const chartGroups = groups
    .map((g, gi) => {
      const people = g.members.filter((m) => m !== pm);
      const head = [...people].sort((x, y) => rankOf(x.cabinet_role) - rankOf(y.cabinet_role))[0] ?? null;
      return { ...g, members: people, head, accent: SECTION_ACCENTS[gi % SECTION_ACCENTS.length] };
    })
    .filter((g) => g.members.length > 0);

  return (
    <div style={{ maxWidth: 1100, margin: "0 auto", padding: PAGE_PADDING }}>
      <PageHeader
        icon={IconCabinet}
        kicker="Cabinet"
        title="Who's in Cabinet"
        subtitle="Every current Cabinet minister, grouped by area of work, with what their job involves and their background. It comes from the same official register as the rest of this site and is kept up to date."
      />

      {members === null && (
        <Loading />
      )}
      {members !== null && failed && (
        <div style={{ marginTop: 24 }}>
          <LoadFailedNote item="the Cabinet list" />
        </div>
      )}
      {members !== null && !failed && members.length === 0 && (
        <div style={{ fontFamily: FONT_BODY, fontSize: 13.5, color: COLORS.inkSoft, marginTop: 24 }}>
          No Cabinet roles are currently recorded. Check back after the next daily update.
        </div>
      )}

      {chartGroups.length > 1 && <CabinetOrgChart groups={chartGroups} pm={pm} />}

      {groups.map((g, gi) => {
        const accent = SECTION_ACCENTS[gi % SECTION_ACCENTS.length];
        return (
          <div key={g.area} id={`cabinet-${g.area}`} style={{ marginTop: gi === 0 ? 32 : 40, scrollMarginTop: 20 }}>
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.3 }}
              style={{ display: "flex", alignItems: "baseline", gap: 10, marginBottom: 6 }}
            >
              <span style={{ width: 8, height: 8, borderRadius: "50%", background: accent, flexShrink: 0 }} />
              <div style={{ fontFamily: FONT_DISPLAY, fontSize: 19, color: COLORS.ink }}>{g.area}</div>
              <span style={{ flex: 1, height: 1, background: COLORS.hairline }} />
              <span style={{ fontFamily: FONT_BODY, fontSize: 11.5, color: COLORS.inkSoft, flexShrink: 0 }}>
                {g.members.length} {g.members.length === 1 ? "minister" : "ministers"}
              </span>
            </motion.div>
            {AREA_DESCRIPTIONS[g.area] && (
              <div style={{ fontFamily: FONT_BODY, fontSize: 12.5, color: COLORS.inkSoft, lineHeight: 1.55, marginBottom: 16, maxWidth: 720, paddingLeft: 18 }}>
                {AREA_DESCRIPTIONS[g.area]}
              </div>
            )}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(min(320px, 100%), 1fr))", gap: 14 }}>
              {[...g.members].sort((x, y) => rankOf(x.cabinet_role) - rankOf(y.cabinet_role)).map((m, mi) => {
                const head = chartGroups.find((c) => c.area === g.area)?.head;
                return <CabinetCard key={m.id} member={m} area={g.area} index={mi} onViewProfile={onViewProfile} boss={head && head !== m && rankOf(m.cabinet_role) > 1 ? head : null} />;
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}

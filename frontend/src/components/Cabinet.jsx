import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "../supabaseClient";
import { COLORS, FONT_DISPLAY, FONT_BODY, FONT_MONO, PAGE_PADDING } from "../theme";
import { partyColour, formatDate, stripHtml } from "../lib/format";
import { PageHeader, LoadFailedNote } from "./shared";
import {
  IconCabinet, IconEconomy, IconGlobe, IconGavel, IconHealth, IconBook, IconFactory, IconHome,
  IconTransport, IconLeaf, IconBroadcast, IconHardHat, IconThinkTank, IconDevolved, IconBills,
  IconGroup, IconQuestion,
} from "./icons";
import { withScrollPreserved } from "../lib/preserveScroll";

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
          background: color, color: "#fff", fontFamily: FONT_DISPLAY, fontSize: size * 0.32, fontWeight: 600,
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

function CabinetCard({ member, area, index, onViewProfile }) {
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
        background: COLORS.paperCard, border: `1px solid ${COLORS.hairline}`, borderTop: `3px solid ${color}`, borderRadius: 14, padding: 20,
      }}
    >
      <button onClick={() => withScrollPreserved(() => setOpen((v) => !v))} style={{ display: "block", width: "100%", background: "none", border: "none", padding: 0, cursor: "pointer", textAlign: "left" }}>
        <div style={{ display: "flex", gap: 14, alignItems: "flex-start" }}>
          <Avatar url={member.thumbnail_url} name={member.name} color={color} />
          <div style={{ minWidth: 0, flex: 1 }}>
            <div style={{ fontFamily: FONT_DISPLAY, fontSize: 17.5, color: COLORS.ink, lineHeight: 1.3 }}>{member.name}</div>
            <div style={{ fontFamily: FONT_BODY, fontWeight: 700, fontSize: 13, color, marginTop: 3, lineHeight: 1.35 }}>{member.cabinet_role}</div>
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 6, flexWrap: "wrap" }}>
              <span style={{ width: 6, height: 6, borderRadius: "50%", background: color, flexShrink: 0 }} />
              <span style={{ fontFamily: FONT_BODY, fontSize: 12, color: COLORS.inkSoft }}>
                {member.party} · {member.constituency}
              </span>
            </div>
            {member.cabinet_role_start_date && (
              <div style={{ fontFamily: FONT_BODY, fontSize: 11.5, color: COLORS.inkSoft, opacity: 0.75, marginTop: 3 }}>
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
                  <div style={{ fontFamily: FONT_BODY, fontWeight: 700, fontSize: 11, color, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 4 }}>
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
                  style={{ fontFamily: FONT_BODY, fontWeight: 700, fontSize: 12.5, color, background: "none", border: "none", padding: 0, cursor: "pointer" }}
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
  "#9C6B30", "#5A7FA6", "#6E4B6E", "#3F7D5C", "#B0473E", "#4A5A6A", "#8A6D3B", "#3C6E8F",
];

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
const NODE_WIDTH = 108;
const NODE_GAP = 22;

function useResponsiveColumns(containerRef) {
  const [columns, setColumns] = useState(3);
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    function update(width) {
      const fit = Math.floor((width + NODE_GAP) / (NODE_WIDTH + NODE_GAP));
      setColumns(Math.max(2, fit));
    }
    update(el.getBoundingClientRect().width);
    const observer = new ResizeObserver(([entry]) => update(entry.contentRect.width));
    observer.observe(el);
    return () => observer.disconnect();
  }, [containerRef]);
  return columns;
}

function OrgChartNode({ group, accent, delay }) {
  const Icon = AREA_ICONS[group.area] ?? IconQuestion;
  const size = group.size;
  return (
    <motion.button
      onClick={() => jumpToArea(group.area)}
      initial={{ opacity: 0, y: -8 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.3, delay: delay + 0.1, ease: "easeOut" }}
      whileHover={{ y: -3 }}
      style={{
        position: "relative", display: "flex", flexDirection: "column", alignItems: "center", gap: 8,
        width: 108, background: "none", border: "none", cursor: "pointer", padding: 0,
      }}
    >
      <motion.div
        initial={{ height: 0 }}
        whileInView={{ height: 20 }}
        viewport={{ once: true, margin: "-40px" }}
        transition={{ duration: 0.2, delay, ease: "easeOut" }}
        style={{ position: "absolute", top: -20, width: 1, background: COLORS.hairline }}
      />
      <div
        style={{
          width: size, height: size, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center",
          background: `${accent}20`, border: `2px solid ${accent}`, color: accent, flexShrink: 0,
        }}
      >
        <Icon size={Math.round(size * 0.42)} />
      </div>
      <span style={{ fontFamily: FONT_BODY, fontSize: 11, fontWeight: 600, color: COLORS.ink, textAlign: "center", lineHeight: 1.3 }}>
        {group.area}
      </span>
      <span style={{ fontFamily: FONT_MONO, fontSize: 11, color: COLORS.inkSoft }}>
        {group.members.length} {group.members.length === 1 ? "minister" : "ministers"}
      </span>
    </motion.button>
  );
}

// One tier of the chart: a spine sized to exactly this row's own nodes
// (an absolutely-positioned line pinned edge-to-edge inside a wrapper
// that's only as wide as the row's flex content, not the full column) —
// so it's never wider or narrower than the branches actually hanging off
// it, whether the row holds two departments or six. A row of exactly one
// node skips the spine entirely; there's nothing for a horizontal line to
// span.
function OrgChartRow({ row, baseDelay }) {
  return (
    <div style={{ display: "inline-flex", flexDirection: "column", alignItems: "center", position: "relative" }}>
      {row.length > 1 && (
        <motion.div
          initial={{ scaleX: 0 }}
          whileInView={{ scaleX: 1 }}
          viewport={{ once: true, margin: "-40px" }}
          transition={{ duration: 0.35, delay: baseDelay, ease: "easeOut" }}
          style={{ position: "absolute", top: 0, left: 0, right: 0, height: 1, background: COLORS.hairline }}
        />
      )}
      <div style={{ display: "flex", justifyContent: "center", gap: "18px 22px", paddingTop: 20, flexWrap: "nowrap" }}>
        {row.map((group, i) => (
          <OrgChartNode
            key={group.area}
            group={group}
            accent={group.accent}
            delay={baseDelay + i * 0.04}
          />
        ))}
      </div>
    </div>
  );
}

// A real org chart, not a card grid standing in for one: the Prime
// Minister at the top with a single trunk line down to a tiered spine —
// every department branching off the row it actually sits in, sized by
// how many ministers sit there. Tapping a department jumps straight to
// its full list below (the same jumpToArea the pill row already used),
// so the diagram is a real way to navigate, not just decoration in front
// of the list. Reveals itself the way an actual org chart gets drawn —
// trunk down from the PM, then row by row, each branch line landing
// right as its own node pops in — rather than everything fading in
// together. Each row's delay picks up where the previous one's animation
// finished, so however many rows there are, the sequence still reads as
// one continuous draw from the top down, not several unrelated
// animations that happen to overlap.
function CabinetOrgChart({ groups }) {
  const containerRef = useRef(null);
  const columns = useResponsiveColumns(containerRef);
  if (groups.length === 0) return null;
  const maxCount = Math.max(...groups.map((g) => g.members.length));
  const sized = groups.map((g, gi) => ({
    ...g,
    accent: SECTION_ACCENTS[gi % SECTION_ACCENTS.length],
    size: Math.round(36 + (g.members.length / maxCount) * 26),
  }));
  const rows = [];
  for (let i = 0; i < sized.length; i += columns) rows.push(sized.slice(i, i + columns));

  return (
    <div ref={containerRef} style={{ marginTop: 32, marginBottom: 8, display: "flex", flexDirection: "column", alignItems: "center" }}>
      <motion.div
        initial={{ opacity: 0, y: -8, scale: 0.9 }}
        whileInView={{ opacity: 1, y: 0, scale: 1 }}
        viewport={{ once: true, margin: "-40px" }}
        transition={{ duration: 0.35, ease: "backOut" }}
        style={{
          display: "flex", flexDirection: "column", alignItems: "center", gap: 6, padding: "10px 20px",
          borderRadius: 12, background: `${COLORS.accent}12`, border: `1px solid ${COLORS.accent}40`,
        }}
      >
        <span style={{ fontFamily: FONT_DISPLAY, fontWeight: 600, fontSize: 15, color: COLORS.accent }}>Prime Minister</span>
      </motion.div>
      <motion.div
        initial={{ height: 0 }}
        whileInView={{ height: 22 }}
        viewport={{ once: true, margin: "-40px" }}
        transition={{ duration: 0.25, delay: 0.3, ease: "easeOut" }}
        style={{ width: 2, background: COLORS.hairline }}
      />
      {rows.map((row, ri) => {
        const rowDelay = 0.55 + ri * 0.35;
        return (
          <div key={ri} style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
            {ri > 0 && (
              <motion.div
                initial={{ height: 0 }}
                whileInView={{ height: 20 }}
                viewport={{ once: true, margin: "-40px" }}
                transition={{ duration: 0.2, delay: rowDelay - 0.12, ease: "easeOut" }}
                style={{ width: 1, background: COLORS.hairline }}
              />
            )}
            <OrgChartRow row={row} baseDelay={rowDelay} />
          </div>
        );
      })}
    </div>
  );
}

export default function Cabinet({ onViewProfile }) {
  const { members, failed } = useCabinet();
  const groups = members ? groupByArea(members) : [];

  return (
    <div style={{ maxWidth: 1100, margin: "0 auto", padding: PAGE_PADDING }}>
      <PageHeader
        icon={IconCabinet}
        kicker="Cabinet"
        title="Who's in Cabinet"
        subtitle="Every current Cabinet minister, grouped by area of work, with what their job involves and their background. It comes from the same official register as the rest of this site and is kept up to date."
      />

      {members === null && (
        <div style={{ fontFamily: FONT_BODY, fontSize: 13.5, color: COLORS.inkSoft, marginTop: 24 }}>Loading…</div>
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

      {groups.length > 1 && <CabinetOrgChart groups={groups} />}

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
              {g.members.map((m, mi) => (
                <CabinetCard key={m.id} member={m} area={g.area} index={mi} onViewProfile={onViewProfile} />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

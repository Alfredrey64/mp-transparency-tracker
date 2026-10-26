import { useState } from "react";
import { motion, AnimatePresence, useReducedMotion } from "motion/react";
import { supabase } from "../supabaseClient";
import { COLORS, FONT_DISPLAY, FONT_BODY, FONT_MONO, PAGE_PADDING, readable, solid } from "../theme";
import { PageHeader, CommonsBadge } from "./shared";
import { GlossaryTerm } from "./GlossaryTerm";
import CommonsChamber from "./CommonsChamber";
import { withScrollPreserved } from "../lib/preserveScroll";
import BillRoute from "./BillRoute";
import GovernmentTiers from "./GovernmentTiers";

function CrownGraphic() {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.85, y: 6 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "backOut" }}
      style={{ display: "flex", justifyContent: "center", marginTop: 14 }}
    >
      <svg width="72" height="60" viewBox="0 0 72 60" fill="none">
        <path
          d="M8 46 L4 20 L18 32 L28 12 L36 24 L44 12 L54 32 L68 20 L64 46 Z"
          fill={COLORS.gold}
          stroke={COLORS.ink}
          strokeWidth="1.5"
          strokeLinejoin="round"
        />
        <rect x="6" y="46" width="60" height="8" rx="1.5" fill={COLORS.gold} stroke={COLORS.ink} strokeWidth="1.5" />
        <circle cx="18" cy="30" r="2.4" fill="#fff" />
        <circle cx="36" cy="22" r="2.4" fill="#fff" />
        <circle cx="54" cy="30" r="2.4" fill="#fff" />
      </svg>
    </motion.div>
  );
}

function CommonsLordsDiagram() {
  const chamber = (label, count, note, dotCount, color, showBadge) => (
    <div style={{ flex: "1 1 220px", background: COLORS.paper, border: `1px solid ${COLORS.hairline}`, borderRadius: 12, padding: 14 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 2 }}>
        {showBadge && <CommonsBadge size={30} />}
        <div style={{ fontFamily: FONT_BODY, fontWeight: 700, fontSize: 13, color: COLORS.ink }}>{label}</div>
      </div>
      <div style={{ fontFamily: FONT_BODY, fontSize: 11.5, color: COLORS.inkSoft, marginBottom: 8 }}>{note}</div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 3, maxWidth: 200 }}>
        {Array.from({ length: dotCount }).map((_, i) => (
          <span key={i} style={{ width: 6, height: 6, borderRadius: "50%", background: color }} />
        ))}
      </div>
      <div style={{ fontFamily: FONT_MONO, fontSize: 11, color: COLORS.inkSoft, marginTop: 6 }}>{count}</div>
    </div>
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      style={{ display: "flex", flexWrap: "wrap", gap: 14, marginTop: 14 }}
    >
      {chamber("House of Commons", "650 elected MPs", "Directly elected by voters in each constituency", 65, COLORS.accent, true)}
      {chamber("House of Lords", "~800 members", "Appointed peers and bishops", 65, "#7A4B63", false)}
    </motion.div>
  );
}

function DeliveryDiagram() {
  const steps = [
    { label: "Parliament", note: "Passes the law" },
    { label: "Whitehall Departments", note: "Civil servants write the detailed rules" },
    { label: "Local Councils", note: "Deliver services on the ground" },
    { label: "You", note: "NHS, schools, roads, benefits" },
  ];
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 8, marginTop: 14 }}
    >
      {steps.map((step, i) => (
        <div key={step.label} style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ background: COLORS.paper, border: `1px solid ${COLORS.hairline}`, borderRadius: 10, padding: "10px 14px", minWidth: 130 }}>
            <div style={{ fontFamily: FONT_BODY, fontWeight: 700, fontSize: 12.5, color: COLORS.ink }}>{step.label}</div>
            <div style={{ fontFamily: FONT_BODY, fontSize: 11, color: COLORS.inkSoft, marginTop: 2 }}>{step.note}</div>
          </div>
          {i < steps.length - 1 && <span style={{ color: COLORS.inkSoft, opacity: 0.5, fontSize: 16 }}>→</span>}
        </div>
      ))}
    </motion.div>
  );
}

// A bill bouncing between the two Houses is exactly the "thing travelling
// between two nodes" pattern FlowNode/FlowArrow already draw for the
// donor-to-recipient pages — oscillate makes the same coin-style dot
// travel back and forth instead of one-way, which is the whole point of
// "ping pong".
function PingPongDiagram() {
  // A paper travels between the two Houses and back again, for as long as they disagree. Drawn to fit whatever width it is given.
  const calm = useReducedMotion();
  const G = COLORS.commonsGreen;
  const P = "#7A4B63";
  return (
    <div style={{ marginTop: 14, padding: "14px 12px 10px", background: COLORS.paper, border: `1px solid ${COLORS.hairline}`, borderRadius: 14 }}>
      <svg viewBox="0 0 320 128" role="img" aria-label="A bill going back and forth between the Commons and the Lords" style={{ display: "block", width: "100%", height: "auto", maxWidth: 380, margin: "0 auto" }}>
        <circle cx="52" cy="52" r="30" fill={`color-mix(in srgb, ${G} 16%, transparent)`} stroke={G} strokeWidth="3" />
        <circle cx="268" cy="52" r="30" fill={`color-mix(in srgb, ${P} 16%, transparent)`} stroke={P} strokeWidth="3" />
        <text x="52" y="60" textAnchor="middle" fontSize="22" fontWeight="800" fill={G} fontFamily={FONT_BODY}>MPs</text>
        <text x="268" y="60" textAnchor="middle" fontSize="20" fontWeight="800" fill={P} fontFamily={FONT_BODY}>Peers</text>
        <text x="52" y="108" textAnchor="middle" fontSize="15" fontWeight="700" fill={COLORS.ink} fontFamily={FONT_BODY}>Commons</text>
        <text x="268" y="108" textAnchor="middle" fontSize="15" fontWeight="700" fill={COLORS.ink} fontFamily={FONT_BODY}>Lords</text>
        <path d="M94 52 H226" stroke={COLORS.hairline} strokeWidth="3" strokeDasharray="2 8" strokeLinecap="round" />
        <path d="M100 44 l-8 8 l8 8 M220 44 l8 8 l-8 8" fill="none" stroke={P} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
        <g transform="translate(112 38)">
          <g>
            <rect width="22" height="28" rx="3" fill="#fff" stroke={P} strokeWidth="2.5" />
            <path d="M5 8 h12 M5 14 h12 M5 20 h7" stroke={P} strokeWidth="2" strokeLinecap="round" />
            {!calm && <animateTransform attributeName="transform" type="translate" values="0 0;74 0;0 0" dur="3.2s" repeatCount="indefinite" calcMode="spline" keyTimes="0;0.5;1" keySplines="0.45 0 0.55 1;0.45 0 0.55 1" />}
          </g>
        </g>
      </svg>
    </div>
  );
}

function MajorityBarDiagram() {
  const total = 650;
  const majority = 326;
  const pct = (majority / total) * 100;
  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }} style={{ marginTop: 14, maxWidth: 420 }}>
      <div style={{ position: "relative", height: 16, borderRadius: 999, background: `${COLORS.accent}14`, overflow: "visible" }}>
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.7, ease: "easeOut" }}
          style={{ position: "absolute", left: 0, top: 0, bottom: 0, background: COLORS.accent, borderRadius: 999 }}
        />
        <div style={{ position: "absolute", left: `${pct}%`, top: -4, bottom: -4, width: 2, background: COLORS.ink }} />
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", marginTop: 8, fontFamily: FONT_MONO, fontSize: 11, color: COLORS.inkSoft }}>
        <span>0 seats</span>
        <span style={{ color: COLORS.ink, fontWeight: 700 }}>326 needed for a majority</span>
        <span>650 seats</span>
      </div>
    </motion.div>
  );
}

function FPTPDiagram() {
  const candidates = [
    { name: "Candidate A", pct: 34, color: COLORS.accentText, winner: true },
    { name: "Candidate B", pct: 29, color: readable("#9C3B3B") },
    { name: "Candidate C", pct: 24, color: readable("#2F6F4E") },
    { name: "Candidate D", pct: 13, color: COLORS.inkSoft },
  ];
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      style={{ marginTop: 14, maxWidth: 420, display: "flex", flexDirection: "column", gap: 9 }}
    >
      {candidates.map((c) => (
        <div key={c.name}>
          <div style={{ display: "flex", justifyContent: "space-between", fontFamily: FONT_BODY, fontSize: 12, marginBottom: 3 }}>
            <span style={{ color: COLORS.ink, fontWeight: c.winner ? 700 : 400 }}>
              {c.name}
              {c.winner ? ", wins the seat" : ""}
            </span>
            <span style={{ fontFamily: FONT_MONO, color: COLORS.inkSoft }}>{c.pct}%</span>
          </div>
          <div style={{ height: 8, borderRadius: 999, background: `${c.color}14`, overflow: "hidden" }}>
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${c.pct}%` }}
              transition={{ duration: 0.6, ease: "easeOut" }}
              style={{ height: "100%", borderRadius: 999, background: c.color }}
            />
          </div>
        </div>
      ))}
      <div style={{ fontFamily: FONT_BODY, fontSize: 11, color: COLORS.inkSoft, marginTop: 2 }}>
        An illustrative example: Candidate A wins with only 34% of the vote, because First Past The Post only needs
        the most votes, not a majority of them.
      </div>
    </motion.div>
  );
}

const STRUCTURE_ROWS = [
  {
    key: "monarch",
    label: "The Monarch",
    tagline: "Ceremonial Head of State",
    desc: "The Monarch is the formal Head of State but has no political power in practice. Every Act of Parliament requires Royal Assent, and the Monarch formally invites the leader of the winning party to become Prime Minister, but by long-standing convention, never refuses or interferes.",
    visual: <CrownGraphic />,
  },
  {
    key: "parliament",
    label: "Parliament",
    tagline: "The legislature, makes the laws",
    desc: "Parliament is made up of two chambers: the elected House of Commons (650 MPs) and the House of Lords (appointed members, plus bishops). Together they debate, amend, and vote on new laws.",
    visual: <CommonsLordsDiagram />,
  },
  {
    key: "government",
    label: "The Government",
    tagline: "The executive, runs the country day to day",
    desc: "The Government is formed by whichever party (or coalition) holds a majority of seats in the Commons. It's led by the Prime Minister and the Cabinet (senior ministers, each responsible for a department like Health, Defence, or Treasury). The Government proposes most new laws and sets policy. Below is the current Commons, seat by seat.",
    visual: <CommonsChamber />,
  },
  {
    key: "delivery",
    label: "Civil Service & Local Councils",
    tagline: "Implementation, where policy meets daily life",
    desc: "Once a law passes, it's the Civil Service (permanent, non-political staff in government departments) and local councils who actually deliver it, running the NHS, schools, roads, benefits, and local services according to the rules Parliament has set.",
    visual: <DeliveryDiagram />,
  },
];

const BILL_PROCESS_STAGES = [
  { key: "idea", label: "Idea", desc: "Most bills come from the Government, usually built from manifesto promises and drafted by civil servants in the relevant department. MPs can also propose their own Private Members' Bills (chosen by ballot or a 10-minute slot), and the House of Lords can introduce bills too." },
  { key: "first", label: "1st Reading", desc: "A purely formal step: the bill's title is read out and it's printed. There's no debate or vote at this stage." },
  { key: "second", label: "2nd Reading", desc: "The first real debate. MPs discuss the bill's main principles and purpose, then vote on whether it should proceed. This is usually the first meaningful vote a bill faces." },
  { key: "committee", label: "Committee Stage", desc: "A smaller group of MPs (or occasionally the whole House) examines the bill line by line, proposing and voting on detailed amendments." },
  { key: "report", label: "Report Stage", desc: "The whole House considers the amendments made in Committee, and can propose further changes." },
  { key: "third", label: "3rd Reading", desc: "A final debate and vote on the bill as it now stands, in the House where it started." },
  { key: "otherhouse", label: "Other House", desc: "The bill then goes through the same stages (1st reading through 3rd reading) in the other House (Lords if it started in the Commons, or vice versa)." },
  { key: "pingpong", label: "\"Ping Pong\"", desc: "If the two Houses disagree on amendments, the bill bounces back and forth between them until they reach agreement, nicknamed \"ping pong\".", visual: <PingPongDiagram /> },
  { key: "assent", label: "Royal Assent", desc: "The Monarch formally approves the bill: a ceremonial step that hasn't been refused since 1708. The bill is now an Act of Parliament: it's law.", visual: <CrownGraphic /> },
  { key: "implementation", label: "Implementation", desc: "Laws often don't take effect immediately. Ministers issue \"commencement orders\" to bring parts of an Act into force, and further detailed rules (secondary legislation) are often needed before departments and councils can actually enforce it." },
];

function SalaryBar({ label, amount, max, color, note }) {
  const pct = Math.max(4, Math.round((amount / max) * 100));
  return (
    <div style={{ marginBottom: 14 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 4, gap: 10 }}>
        <span style={{ fontFamily: FONT_BODY, fontWeight: 600, fontSize: 12.5, color: COLORS.ink }}>{label}</span>
        <span style={{ fontFamily: FONT_MONO, fontSize: 13, color: readable(color), flexShrink: 0 }}>£{amount.toLocaleString()}</span>
      </div>
      <div style={{ height: 10, borderRadius: 999, background: `${color}14`, overflow: "hidden" }}>
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          style={{ height: "100%", borderRadius: 999, background: color }}
        />
      </div>
      {note && <div style={{ fontFamily: FONT_BODY, fontSize: 11, color: COLORS.inkSoft, marginTop: 3 }}>{note}</div>}
    </div>
  );
}

function SalaryDiagram() {
  return (
    <div style={{ marginTop: 14, maxWidth: 420 }}>
      <SalaryBar label="MP's basic salary" amount={98599} max={190000} color="#4C6FA6" note="From April 2026. Set independently by IPSA, not by MPs themselves, reviewed each year." />
      <SalaryBar label="Cabinet minister (total)" amount={173769} max={190000} color="#4C6FA6" note="Basic salary plus £75,170 for the ministerial role. In practice most take about £8,000 less, because the ministerial pay has been voluntarily waived in part since 2008." />
      <SalaryBar label="Prime Minister (total)" amount={182436} max={190000} color="#4C6FA6" note="Basic salary plus £83,837 for the role, before the same voluntary reduction." />
      <SalaryBar label="UK median full-time salary" amount={39039} max={190000} color={COLORS.inkSoft} note="ONS figure for April 2025, for comparison: all amounts rounded and reviewed annually, so treat as approximate." />
    </div>
  );
}

function WeekSplitDiagram() {
  const segments = [
    { label: "Westminster (Mon–Thu, sitting weeks)", pct: 57, color: readable("#4C6FA6") },
    { label: "Constituency (Fri–Sun)", pct: 43, color: COLORS.accentText },
  ];
  return (
    <div style={{ marginTop: 14, maxWidth: 420 }}>
      <div style={{ display: "flex", height: 14, borderRadius: 999, overflow: "hidden" }}>
        {segments.map((s) => (
          <motion.div
            key={s.label}
            initial={{ width: 0 }}
            animate={{ width: `${s.pct}%` }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            style={{ background: s.color }}
          />
        ))}
      </div>
      <div style={{ display: "flex", gap: 14, flexWrap: "wrap", marginTop: 8 }}>
        {segments.map((s) => (
          <span key={s.label} style={{ display: "flex", alignItems: "center", gap: 6, fontFamily: FONT_BODY, fontSize: 11.5, color: COLORS.inkSoft }}>
            <span style={{ width: 8, height: 8, borderRadius: 2, background: s.color, flexShrink: 0 }} />
            {s.label}
          </span>
        ))}
      </div>
      <div style={{ fontFamily: FONT_BODY, fontSize: 11, color: COLORS.inkSoft, marginTop: 6 }}>
        A rough, illustrative split for a sitting week. <GlossaryTerm term="Recess">recess</GlossaryTerm>, committee travel, and individual MPs' patterns all vary a lot.
      </div>
    </div>
  );
}

const MP_JOB_STAGES = [
  {
    key: "week", label: "A Typical Week",
    desc: "There's no single \"normal\" week, but when the Commons is sitting, most MPs split their time between Westminster (debates, votes, committee meetings, and party business, roughly Monday to Thursday) and their constituency, typically Friday to Sunday, for surgeries, local events, and casework. Many travel weekly between London and constituencies as far away as Scotland or Cornwall.",
    visual: <WeekSplitDiagram />,
  },
  {
    key: "casework", label: "Constituency Casework",
    desc: "A large share of an MP's time goes on non-legislative work: holding regular \"surgeries\" where constituents bring individual problems (a stuck visa application, a housing dispute, an NHS delay) and writing on their behalf to ministers, councils, or other agencies. A typical MP's office handles hundreds of individual cases a year, on top of general correspondence and emails.",
  },
  {
    key: "chamber", label: "Debates, Votes & Committees",
    desc: "In the chamber, MPs speak in debates, table written and oral questions to ministers, and vote in divisions, sometimes several times in an evening, summoned from wherever they are on the parliamentary estate by a division bell. Many also sit on select committees, questioning ministers and officials and helping produce reports that scrutinise government policy in detail.",
  },
  {
    key: "party-life", label: "Party & Public Life",
    desc: "Beyond Parliament itself, most MPs are expected to support their party (attending party meetings and conferences, and campaigning in other seats during elections and by-elections) and to keep up a public and media presence, from local press coverage to their own constituents' social media.",
  },
  {
    key: "salary", label: "Salary",
    desc: "MPs are paid a basic annual salary set by IPSA (the Independent Parliamentary Standards Authority): an independent body created after the 2009 expenses scandal, precisely so that MPs no longer set their own pay. Extra parliamentary roles (a Cabinet post, a select committee chair, the Speakership) come with additional \"Special Responsibility\" pay on top.",
    visual: <SalaryDiagram />,
  },
  {
    key: "outside-jobs", label: "Second Jobs & Outside Earnings",
    desc: "MPs are allowed to hold paid work outside Parliament (a doctor keeping up shifts, a barrister still taking cases) provided being an MP stays their main job. Outside earnings above a set threshold must be declared on the Register of Members' Financial Interests within 28 days (see the Financial Interests tab), and MPs can't be paid to advocate for a cause or lobby ministers on someone else's behalf.",
  },
  {
    key: "staff", label: "Staff & Office Budget",
    desc: "MPs don't personally fund their own staff. IPSA provides a separate staffing budget, worth well over £200,000 a year, to employ caseworkers and researchers who run the constituency and Westminster offices, answer correspondence, and handle casework for constituents.",
  },
  {
    key: "expenses", label: "Expenses (IPSA)",
    desc: "Since the 2009 scandal, MPs' business costs (travel between Westminster and their constituency, accommodation for MPs who don't represent a London seat, and office running costs) are claimed through IPSA under published rules, rather than self-administered as they were before.",
  },
  {
    key: "pension", label: "Pension",
    desc: "MPs contribute to the Parliamentary Contributory Pension Fund, a defined-benefit scheme broadly similar to those found across much of the public sector, alongside an employer (Exchequer) contribution.",
  },
  {
    key: "resigning", label: "\"Resigning\"",
    desc: "An MP can't actually resign: a rule dating to 1624 bars a sitting MP from simply quitting their seat. To leave early, they instead apply for a nominal paid \"office of profit under the Crown\" (traditionally Crown Steward and Bailiff of the Chiltern Hundreds, or of the Manor of Northstead), which automatically disqualifies them from sitting as an MP, triggering a by-election.",
  },
];

const ELECTION_STAGES = [
  { key: "called", label: "Election Called", desc: "General elections happen at least every 5 years, but the Prime Minister can request one sooner. All 650 Commons seats are contested at once." },
  { key: "candidates", label: "Candidates Stand", desc: "In each of the UK's 650 constituencies, candidates put themselves forward, representing a party, or standing as independents." },
  { key: "vote", label: "Voters Vote (FPTP)", desc: "The UK uses First Past The Post: each voter gets one vote in their own constituency, and whoever gets the most votes there wins, even without an outright majority of votes cast.", visual: <FPTPDiagram /> },
  { key: "mp", label: "An MP Is Elected", desc: "The winning candidate in each constituency becomes that area's Member of Parliament, taking a seat in the House of Commons." },
  { key: "government-formed", label: "Government Forms", desc: "Whichever party wins more than half of the 650 seats (326+) can form a Government alone. If no party reaches that, parties may form a coalition, or one may govern as a minority.", visual: <MajorityBarDiagram /> },
  { key: "pm-appointed", label: "PM Appointed", desc: "The Monarch formally invites the leader of the party that can command a Commons majority to become Prime Minister and form a Government." },
];

// A quiet "you are here" marker for the stages that don't have a bespoke
// diagram of their own — every expand panel gets at least this much visual
// structure, rather than reading as a wall of plain paragraph text.
function StageProgressDots({ index, total, color }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 5, marginTop: 14 }}>
      {Array.from({ length: total }).map((_, i) => (
        <span
          key={i}
          style={{
            width: i === index ? 20 : 7, height: 7, borderRadius: 999, flexShrink: 0,
            background: i === index ? color : `${color}30`, transition: "width 0.2s",
          }}
        />
      ))}
      <span style={{ fontFamily: FONT_MONO, fontSize: 11, color: COLORS.inkSoft, marginLeft: 6, whiteSpace: "nowrap" }}>
        Stage {index + 1} of {total}
      </span>
    </div>
  );
}

// Used to be a row of pills where only one stage's explanation could be
// open at a time — reading through a ten-stage process meant clicking,
// reading, clicking again, and losing the previous stage's text every
// time. A vertical timeline with independent expand/collapse per stage
// lets several stay open at once (or all of them), so working through
// the whole sequence doesn't mean re-clicking your way through it one
// panel at a time. The connecting spine also just reads as more of an
// actual diagram than a pill row sitting above an unrelated box did.
function StepTimeline({ stages, color, showProgress = false }) {
  const [openKeys, setOpenKeys] = useState(() => new Set([stages[0].key]));

  function toggle(key) {
    setOpenKeys((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  return (
    <div style={{ position: "relative" }}>
      <div style={{ position: "absolute", left: 14, top: 16, bottom: 16, width: 3, borderRadius: 2, background: `linear-gradient(180deg, ${color}, ${color}33)` }} />
      {stages.map((stage, i) => {
        const isOpen = openKeys.has(stage.key);
        return (
          <div key={stage.key} style={{ marginBottom: i < stages.length - 1 ? 4 : 0 }}>
            <motion.button
              onClick={() => withScrollPreserved(() => toggle(stage.key))}
              whileHover={{ x: 2 }}
              style={{
                display: "flex", alignItems: "center", gap: 12, width: "100%",
                background: "none", border: "none", padding: "8px 0", cursor: "pointer", textAlign: "left",
              }}
            >
              <span
                style={{
                  position: "relative", zIndex: 1,
                  flexShrink: 0, width: 30, height: 30, borderRadius: "50%",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  background: isOpen ? solid(color) : COLORS.paperCard, border: `2px solid ${color}`,
                  color: isOpen ? "#fff" : readable(color), fontFamily: FONT_MONO, fontSize: 12, fontWeight: 700,
                  boxShadow: isOpen ? `0 0 0 5px ${color}26` : `0 0 0 0 ${color}00`,
                  transition: "background 0.25s, color 0.25s, box-shadow 0.35s",
                }}
              >
                {i + 1}
              </span>
              <span style={{ flex: 1, fontFamily: FONT_DISPLAY, fontWeight: 600, fontSize: 16, color: COLORS.ink }}>{stage.label}</span>
              <motion.span animate={{ rotate: isOpen ? 180 : 0 }} transition={{ duration: 0.2 }} style={{ flexShrink: 0, color: readable(color), fontSize: 13 }}>▾</motion.span>
            </motion.button>
            <AnimatePresence initial={false}>
              {isOpen && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.25, ease: "easeInOut" }}
                  style={{ overflow: "hidden" }}
                >
                  <div style={{ margin: "2px 0 14px 42px", padding: "12px 16px 14px", borderRadius: 12, borderLeft: `3px solid ${color}`, background: `color-mix(in srgb, ${color} 7%, ${COLORS.paperCard})` }}>
                    <div style={{ fontFamily: FONT_BODY, fontSize: 14, color: COLORS.inkSoft, lineHeight: 1.6, maxWidth: 720 }}>
                      {stage.desc}
                    </div>
                    {showProgress && !stage.visual && <StageProgressDots index={i} total={stages.length} color={color} />}
                    {stage.visual}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );
      })}
    </div>
  );
}

function DiagramSection({ title, intro, stages, color, index = 0, showProgress = false, route = false }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.4, delay: index * 0.08, ease: "easeOut" }}
      style={{
        marginBottom: 32,
        background: COLORS.paperCard,
        borderLeft: `1px solid ${COLORS.hairline}`,
        borderRight: `1px solid ${COLORS.hairline}`,
        borderBottom: `1px solid ${COLORS.hairline}`,
        borderTop: `4px solid ${color}`,
        borderRadius: 16,
        padding: "24px clamp(16px, 4vw, 28px)",
        backgroundImage: `linear-gradient(180deg, color-mix(in srgb, ${color} 9%, ${COLORS.paperCard}), ${COLORS.paperCard} 190px)`,
      }}
    >
      <h2 style={{ fontFamily: FONT_DISPLAY, fontSize: 24, color: COLORS.ink, marginTop: 0, marginBottom: 6 }}>{title}</h2>
      {intro && (
        <p style={{ fontFamily: FONT_BODY, fontSize: 14, color: COLORS.inkSoft, marginTop: 0, marginBottom: 20, maxWidth: 780 }}>
          {intro}
        </p>
      )}
      {route && <BillRoute stages={stages} color={color} />}
      <StepTimeline stages={stages} color={color} showProgress={showProgress} />
    </motion.div>
  );
}

function ConstituencyLookup() {
  const [postcode, setPostcode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);

  async function handleSearch(e) {
    e.preventDefault();
    if (!postcode.trim()) return;
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetch(`https://api.postcodes.io/postcodes/${encodeURIComponent(postcode.trim())}`);
      const data = await res.json();
      if (!res.ok || data.status !== 200) {
        setError("Couldn't find that postcode, double check it's a valid UK postcode.");
        setLoading(false);
        return;
      }
      const constituency = data.result.parliamentary_constituency;
      const { data: matches } = await supabase.from("politicians").select("*").eq("constituency", constituency).limit(1);
      setResult({ constituency, mp: matches?.[0] ?? null });
    } catch {
      setError("Something went wrong looking that up, please try again.");
    }
    setLoading(false);
  }

  return (
    <div
      style={{
        background: COLORS.paperCard,
        borderLeft: `1px solid ${COLORS.hairline}`,
        borderRight: `1px solid ${COLORS.hairline}`,
        borderBottom: `1px solid ${COLORS.hairline}`,
        borderTop: `4px solid ${COLORS.accent}`,
        borderRadius: 16,
        padding: "24px clamp(16px, 4vw, 28px)",
        
      }}
    >
      <h2 style={{ fontFamily: FONT_DISPLAY, fontSize: 24, color: COLORS.ink, marginTop: 0, marginBottom: 6 }}>
        Find your MP
      </h2>
      <p style={{ fontFamily: FONT_BODY, fontSize: 14, color: COLORS.inkSoft, marginTop: 0, marginBottom: 16, maxWidth: 620 }}>
        Enter your postcode to see which constituency you're in, and who currently represents it in Parliament.
      </p>
      <form onSubmit={handleSearch} style={{ display: "flex", flexWrap: "wrap", gap: 10, maxWidth: 420, marginBottom: 16 }}>
        <input
          value={postcode}
          onChange={(e) => setPostcode(e.target.value)}
          placeholder="e.g. SW1A 1AA"
          style={{
            flex: "1 1 200px",
            boxSizing: "border-box",
            padding: "12px 14px",
            fontFamily: FONT_BODY,
            fontSize: 15,
            border: `1px solid ${COLORS.hairline}`,
            borderRadius: 10,
            background: COLORS.paper,
            color: COLORS.ink,
          }}
        />
        <button
          type="submit"
          style={{
            fontFamily: FONT_BODY,
            fontWeight: 600,
            fontSize: 14,
            padding: "0 20px",
            borderRadius: 10,
            border: "none",
            background: COLORS.accent,
            color: "#fff",
            cursor: "pointer",
          }}
        >
          Search
        </button>
      </form>

      {loading && <div style={{ fontFamily: FONT_BODY, fontSize: 13.5, color: COLORS.inkSoft }}>Looking up…</div>}
      {error && <div style={{ fontFamily: FONT_BODY, fontSize: 13.5, color: readable("#9C3B3B") }}>{error}</div>}

      {result && (
        <div style={{ borderTop: `1px solid ${COLORS.hairline}`, paddingTop: 16 }}>
          <div style={{ fontFamily: FONT_BODY, fontSize: 12.5, color: COLORS.inkSoft, marginBottom: 10 }}>
            Constituency: <strong style={{ color: COLORS.ink }}>{result.constituency}</strong>
          </div>
          {result.mp ? (
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              {result.mp.thumbnail_url && (
                <div style={{ width: 56, height: 56, borderRadius: "50%", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", background: COLORS.paperCard, border: `1px solid ${COLORS.hairline}` }}>
                  <img loading="lazy" decoding="async"
                    src={result.mp.thumbnail_url}
                    alt=""
                    style={{ width: 40, height: 40, borderRadius: "50%", objectFit: "cover", objectPosition: "center" }}
                  />
                </div>
              )}
              <div>
                <div style={{ fontFamily: FONT_DISPLAY, fontSize: 18, color: COLORS.ink }}>{result.mp.name}</div>
                <div style={{ fontFamily: FONT_BODY, fontSize: 13, color: COLORS.inkSoft }}>{result.mp.party}</div>
              </div>
            </div>
          ) : (
            <div style={{ fontFamily: FONT_BODY, fontSize: 13.5, color: COLORS.inkSoft }}>
              We don't currently have a matching record for this constituency. It may use a slightly
              different name in our data.
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function HowParliamentWorks() {
  return (
    <div style={{ padding: PAGE_PADDING, maxWidth: 1180, margin: "0 auto" }}>
      <PageHeader
        title="How Parliament works"
        subtitle={
          <>
            From who is in charge, to who does what where you live, to how a{" "}
            <GlossaryTerm term="Bill">bill</GlossaryTerm> becomes law and how your own MP gets elected. Open any
            stage for a plain explanation.
          </>
        }
        maxWidth={900}
      />

      <div>
        <DiagramSection
          id="charge"
          index={0}
          title="Who's in charge?"
          intro="The UK's system separates ceremonial authority, law-making, and day-to-day running of the country into distinct roles."
          stages={STRUCTURE_ROWS}
          color={COLORS.accent}
          showProgress
        />

        <GovernmentTiers />

        <DiagramSection
          id="billprocess"
          index={1}
          title="How a bill becomes law"
          intro="Every law goes through the same basic journey, though it can take anywhere from weeks to years."
          stages={BILL_PROCESS_STAGES}
          color="#7A4B63"
          showProgress
          route
        />

        <DiagramSection
          id="elections"
          index={2}
          title="How MPs are elected"
          intro="Every MP in this app got their seat through the same process."
          stages={ELECTION_STAGES}
          color="#2F6F4E"
          showProgress
        />

        <DiagramSection
          id="mpjob"
          index={3}
          title="The job of an MP"
          intro="Once elected, what does the role actually involve day to day, and what does it pay?"
          stages={MP_JOB_STAGES}
          color="#4C6FA6"
          showProgress
        />

        <ConstituencyLookup />
      </div>
    </div>
  );
}

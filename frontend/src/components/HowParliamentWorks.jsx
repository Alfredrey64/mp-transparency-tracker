import { useState } from "react";
import { motion } from "framer-motion";
import { supabase } from "../supabaseClient";
import { COLORS, FONT_DISPLAY, FONT_BODY, FONT_MONO, PAGE_PADDING } from "../theme";
import { PageHeader, CommonsBadge } from "./shared";
import CommonsChamber from "./CommonsChamber";

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
      {chamber("House of Commons", "650 elected MPs", "Directly elected by voters in each constituency", 65, COLORS.brass, true)}
      {chamber("House of Lords", "~800 members", "Appointed peers, some hereditary members, and bishops", 65, "#7A4B63", false)}
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

const STRUCTURE_ROWS = [
  {
    key: "monarch",
    label: "The Monarch",
    tagline: "Ceremonial Head of State",
    desc: "The Monarch is the formal Head of State but has no political power in practice. Every Act of Parliament requires Royal Assent, and the Monarch formally invites the leader of the winning party to become Prime Minister — but by long-standing convention, never refuses or interferes.",
    visual: <CrownGraphic />,
  },
  {
    key: "parliament",
    label: "Parliament",
    tagline: "The legislature — makes the laws",
    desc: "Parliament is made up of two chambers: the elected House of Commons (650 MPs) and the House of Lords (appointed and hereditary members, plus bishops). Together they debate, amend, and vote on new laws.",
    visual: <CommonsLordsDiagram />,
  },
  {
    key: "government",
    label: "The Government",
    tagline: "The executive — runs the country day to day",
    desc: "The Government is formed by whichever party (or coalition) holds a majority of seats in the Commons. It's led by the Prime Minister and the Cabinet (senior ministers, each responsible for a department like Health, Defence, or Treasury). The Government proposes most new laws and sets policy. Below is the current Commons, seat by seat.",
    visual: <CommonsChamber />,
  },
  {
    key: "delivery",
    label: "Civil Service & Local Councils",
    tagline: "Implementation — where policy meets daily life",
    desc: "Once a law passes, it's the Civil Service (permanent, non-political staff in government departments) and local councils who actually deliver it — running the NHS, schools, roads, benefits, and local services according to the rules Parliament has set.",
    visual: <DeliveryDiagram />,
  },
];

const BILL_PROCESS_STAGES = [
  { key: "idea", label: "Idea", desc: "Most bills come from the Government — usually built from manifesto promises and drafted by civil servants in the relevant department. MPs can also propose their own Private Members' Bills (chosen by ballot or a 10-minute slot), and the House of Lords can introduce bills too." },
  { key: "first", label: "1st Reading", desc: "A purely formal step — the bill's title is read out and it's printed. There's no debate or vote at this stage." },
  { key: "second", label: "2nd Reading", desc: "The first real debate. MPs discuss the bill's main principles and purpose, then vote on whether it should proceed. This is usually the first meaningful vote a bill faces." },
  { key: "committee", label: "Committee Stage", desc: "A smaller group of MPs (or occasionally the whole House) examines the bill line by line, proposing and voting on detailed amendments." },
  { key: "report", label: "Report Stage", desc: "The whole House considers the amendments made in Committee, and can propose further changes." },
  { key: "third", label: "3rd Reading", desc: "A final debate and vote on the bill as it now stands, in the House where it started." },
  { key: "otherhouse", label: "Other House", desc: "The bill then goes through the same stages (1st reading through 3rd reading) in the other House — Lords if it started in the Commons, or vice versa." },
  { key: "pingpong", label: "\"Ping Pong\"", desc: "If the two Houses disagree on amendments, the bill bounces back and forth between them until they reach agreement — nicknamed \"ping pong\"." },
  { key: "assent", label: "Royal Assent", desc: "The Monarch formally approves the bill — a ceremonial step that hasn't been refused since 1708. The bill is now an Act of Parliament: it's law." },
  { key: "implementation", label: "Implementation", desc: "Laws often don't take effect immediately. Ministers issue \"commencement orders\" to bring parts of an Act into force, and further detailed rules (secondary legislation) are often needed before departments and councils can actually enforce it." },
];

const ELECTION_STAGES = [
  { key: "called", label: "Election Called", desc: "General elections happen at least every 5 years, but the Prime Minister can request one sooner. All 650 Commons seats are contested at once." },
  { key: "candidates", label: "Candidates Stand", desc: "In each of the UK's 650 constituencies, candidates put themselves forward — representing a party, or standing as independents." },
  { key: "vote", label: "Voters Vote (FPTP)", desc: "The UK uses First Past The Post: each voter gets one vote in their own constituency, and whoever gets the most votes there wins — even without an outright majority of votes cast." },
  { key: "mp", label: "An MP Is Elected", desc: "The winning candidate in each constituency becomes that area's Member of Parliament, taking a seat in the House of Commons." },
  { key: "government-formed", label: "Government Forms", desc: "Whichever party wins more than half of the 650 seats (326+) can form a Government alone. If no party reaches that, parties may form a coalition, or one may govern as a minority." },
  { key: "pm-appointed", label: "PM Appointed", desc: "The Monarch formally invites the leader of the party that can command a Commons majority to become Prime Minister and form a Government." },
];

function FlowDiagram({ stages, activeKey, onSelect, color }) {
  return (
    <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 8 }}>
      {stages.map((stage, i) => {
        const active = activeKey === stage.key;
        return (
          <div key={stage.key} style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <motion.button
              onClick={() => onSelect(stage.key)}
              whileHover={{ scale: active ? 1 : 1.04 }}
              whileTap={{ scale: 0.94 }}
              animate={{
                backgroundColor: active ? color : COLORS.paperCard,
                borderColor: active ? color : COLORS.hairline,
                color: active ? "#ffffff" : COLORS.ink,
                boxShadow: active ? "0 3px 10px rgba(0,0,0,0.18)" : "0 0px 0px rgba(0,0,0,0)",
              }}
              transition={{ duration: 0.22, ease: "easeOut" }}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                fontFamily: FONT_BODY,
                fontSize: 13,
                fontWeight: 600,
                padding: "9px 16px 9px 9px",
                borderRadius: 999,
                borderWidth: 1.5,
                borderStyle: "solid",
                cursor: "pointer",
                whiteSpace: "nowrap",
              }}
            >
              <motion.span
                key={active ? "on" : "off"}
                initial={{ scale: 0.55 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 500, damping: 22 }}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  width: 22,
                  height: 22,
                  borderRadius: "50%",
                  fontSize: 11,
                  fontFamily: FONT_MONO,
                  background: active ? "rgba(255,255,255,0.25)" : `${color}1A`,
                  color: active ? "#fff" : color,
                  flexShrink: 0,
                }}
              >
                {i + 1}
              </motion.span>
              <span>{stage.label}</span>
            </motion.button>
            {i < stages.length - 1 && (
              <span style={{ color: color, opacity: 0.4, fontSize: 18, fontWeight: 700 }}>→</span>
            )}
          </div>
        );
      })}
    </div>
  );
}

function DiagramSection({ title, intro, stages, color, index = 0 }) {
  const [activeKey, setActiveKey] = useState(stages[0].key);
  const active = stages.find((s) => s.key === activeKey);
  const activeIndex = stages.findIndex((s) => s.key === activeKey);

  const [prevIndex, setPrevIndex] = useState(activeIndex);
  const [direction, setDirection] = useState(0);
  if (activeIndex !== prevIndex) {
    setDirection(activeIndex > prevIndex ? 1 : -1);
    setPrevIndex(activeIndex);
  }

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
        boxShadow: "0 2px 10px rgba(30,42,68,0.05)",
      }}
    >
      <h2 style={{ fontFamily: FONT_DISPLAY, fontSize: 24, color: COLORS.ink, marginTop: 0, marginBottom: 6 }}>{title}</h2>
      {intro && (
        <p style={{ fontFamily: FONT_BODY, fontSize: 14, color: COLORS.inkSoft, marginTop: 0, marginBottom: 18, maxWidth: 780 }}>
          {intro}
        </p>
      )}
      <div style={{ overflowX: "auto", paddingBottom: 8 }}>
        <FlowDiagram stages={stages} activeKey={activeKey} onSelect={setActiveKey} color={color} />
      </div>
      {active && (
        <motion.div
          key={active.key}
          initial={{ opacity: 0, x: direction * 28 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
          style={{
            marginTop: 18,
            background: COLORS.paper,
            borderTop: `1px solid ${COLORS.hairline}`,
            borderRight: `1px solid ${COLORS.hairline}`,
            borderBottom: `1px solid ${COLORS.hairline}`,
            borderLeft: `4px solid ${color}`,
            borderRadius: 10,
            padding: "16px 18px",
            maxWidth: active.visual ? undefined : 780,
          }}
        >
          <div style={{ fontFamily: FONT_DISPLAY, fontSize: 17, color: COLORS.ink, marginBottom: 6 }}>{active.label}</div>
          <div style={{ fontFamily: FONT_BODY, fontSize: 14, color: COLORS.inkSoft, lineHeight: 1.6, maxWidth: 780 }}>{active.desc}</div>
          {active.visual}
        </motion.div>
      )}
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
        setError("Couldn't find that postcode — double check it's a valid UK postcode.");
        setLoading(false);
        return;
      }
      const constituency = data.result.parliamentary_constituency;
      const { data: matches } = await supabase.from("politicians").select("*").eq("constituency", constituency).limit(1);
      setResult({ constituency, mp: matches?.[0] ?? null });
    } catch {
      setError("Something went wrong looking that up — please try again.");
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
        borderTop: `4px solid ${COLORS.brass}`,
        borderRadius: 16,
        padding: "24px clamp(16px, 4vw, 28px)",
        boxShadow: "0 2px 10px rgba(30,42,68,0.05)",
      }}
    >
      <h2 style={{ fontFamily: FONT_DISPLAY, fontSize: 24, color: COLORS.ink, marginTop: 0, marginBottom: 6 }}>
        Find Your MP
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
            background: COLORS.ink,
            color: "#fff",
            cursor: "pointer",
          }}
        >
          Search
        </button>
      </form>

      {loading && <div style={{ fontFamily: FONT_BODY, fontSize: 13.5, color: COLORS.inkSoft }}>Looking up…</div>}
      {error && <div style={{ fontFamily: FONT_BODY, fontSize: 13.5, color: "#9C3B3B" }}>{error}</div>}

      {result && (
        <div style={{ borderTop: `1px solid ${COLORS.hairline}`, paddingTop: 16 }}>
          <div style={{ fontFamily: FONT_BODY, fontSize: 12.5, color: COLORS.inkSoft, marginBottom: 10 }}>
            Constituency: <strong style={{ color: COLORS.ink }}>{result.constituency}</strong>
          </div>
          {result.mp ? (
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              {result.mp.thumbnail_url && (
                <div style={{ width: 56, height: 56, borderRadius: "50%", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", background: COLORS.paperCard, border: `1px solid ${COLORS.hairline}` }}>
                  <img
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
              We don't currently have a matching record for this constituency — it may use a slightly
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
    <div style={{ padding: PAGE_PADDING }}>
      <PageHeader
        title="How Parliament Works"
        subtitle="Click through each stage below to see a plain-English explanation — from who's actually in charge, to how a bill becomes law, to how your own MP ends up in Parliament in the first place."
        maxWidth={900}
      />

      <div>
        <DiagramSection
          id="charge"
          index={0}
          title="Who's In Charge?"
          intro="The UK's system separates ceremonial authority, law-making, and day-to-day running of the country into distinct roles."
          stages={STRUCTURE_ROWS}
          color={COLORS.brass}
        />

        <DiagramSection
          id="billprocess"
          index={1}
          title="How a Bill Becomes Law"
          intro="Every law goes through the same basic journey — though it can take anywhere from weeks to years."
          stages={BILL_PROCESS_STAGES}
          color="#7A4B63"
        />

        <DiagramSection
          id="elections"
          index={2}
          title="How MPs Are Elected"
          intro="Every MP in this app got their seat through the same process."
          stages={ELECTION_STAGES}
          color="#2F6F4E"
        />

        <ConstituencyLookup />
      </div>
    </div>
  );
}

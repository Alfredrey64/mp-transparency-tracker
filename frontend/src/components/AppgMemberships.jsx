import { motion } from "framer-motion";
import { COLORS, FONT_DISPLAY, FONT_BODY, PAGE_PADDING } from "../theme";
import { PageHeader } from "./shared";

function InfoCard({ title, color, children, index = 0 }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.35, delay: index * 0.05, ease: "easeOut" }}
      style={{
        background: COLORS.paperCard,
        borderLeft: `1px solid ${COLORS.hairline}`,
        borderRight: `1px solid ${COLORS.hairline}`,
        borderBottom: `1px solid ${COLORS.hairline}`,
        borderTop: `4px solid ${color}`,
        borderRadius: 16,
        padding: "22px clamp(16px, 4vw, 26px)",
        boxShadow: "0 2px 10px rgba(30,42,68,0.05)",
        marginBottom: 20,
      }}
    >
      <h2 style={{ fontFamily: FONT_DISPLAY, fontSize: 21, color: COLORS.ink, marginTop: 0, marginBottom: 10 }}>
        {title}
      </h2>
      <div style={{ fontFamily: FONT_BODY, fontSize: 14.5, color: COLORS.inkSoft, lineHeight: 1.7, maxWidth: 760 }}>
        {children}
      </div>
    </motion.div>
  );
}

const QUICK_FACTS = [
  { label: "500+", note: "active groups registered" },
  { label: "No", note: "power to pass laws" },
  { label: "Cross-Party", note: "by constitution" },
  { label: "6 Weeks", note: "re-registration cycle" },
];

// Standard UK party colours, used only for the small notable-member dots
// below — not the app-wide partyColour() helper, which expects a hex value
// already looked up from a politician record rather than a party name.
const PARTY_DOT = {
  Labour: "#DC2626",
  "Labour (Co-op)": "#DC2626",
  Conservative: "#0087DC",
  "Liberal Democrat": "#FAA61A",
  "Scottish National Party": "#C9A227",
  Green: "#6AB023",
  "Plaid Cymru": "#005B54",
  "Non-affiliated": COLORS.inkSoft,
};

function MemberList({ members }) {
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: "5px 12px", marginTop: 8 }}>
      {members.map((m) => (
        <span key={m.name} style={{ display: "inline-flex", alignItems: "center", gap: 6, fontFamily: FONT_BODY, fontSize: 12, color: COLORS.ink }}>
          <span style={{ width: 7, height: 7, borderRadius: "50%", background: PARTY_DOT[m.party] ?? COLORS.inkSoft, flexShrink: 0 }} />
          {m.name} <span style={{ color: COLORS.inkSoft }}>· {m.role}</span>
        </span>
      ))}
    </div>
  );
}

// A hand-picked sample of real, publicly reported financial benefits
// registered by APPGs — not an automated feed. The Register of APPGs is
// published as a PDF every ~6 weeks with no API to pull it from
// automatically, so — like the Ministerial Meetings page — this is a
// periodically refreshed sample rather than a complete or daily-updating
// record. See Data & Methodology. Officers are as listed on the official
// register as at 1 December 2025.
const REGISTERED_BENEFITS = [
  {
    group: "APPG on Defence Technology",
    color: "#B5533C",
    detail:
      "Its secretariat took funding from RUK Advanced Systems Limited — a UK subsidiary of the Israeli arms manufacturer Rafael — without properly registering the arrangement. The Parliamentary Commissioner for Standards opened an investigation into the funding, and the group shut itself down in September 2025 rather than continue.",
    sourceUrl: "https://www.thebureauinvestigates.com/stories/2025-09-05/appg-shuts-down-while-under-investigation-over-israeli-arms-funding",
    members: null,
    note: "Wound up in September 2025 — no longer on the current register.",
  },
  {
    group: "Scotch Whisky APPG",
    color: "#9C6B30",
    detail:
      "Its secretariat is run directly by the Scotch Whisky Association — the industry's own trade body — rather than an independent third party, a common pattern for single-industry APPGs.",
    sourceUrl: "https://publications.parliament.uk/pa/cm/cmallparty/251201/scotch-whisky.htm",
    members: [
      { name: "Wendy Chamberlain MP", party: "Liberal Democrat", role: "chair" },
      { name: "Andrew Bowie MP", party: "Conservative", role: "officer" },
      { name: "Graham Leadbitter MP", party: "Scottish National Party", role: "officer" },
      { name: "Douglas McAllister MP", party: "Labour", role: "officer" },
    ],
  },
  {
    group: "All-Party Parliamentary Beer Group",
    color: "#8A7A3D",
    detail:
      "Its administration is provided by Ocklynge Consulting, a public affairs firm whose client work includes the brewing and pub sector the group exists to promote.",
    sourceUrl: "https://publications.parliament.uk/pa/cm/cmallparty/251201/beer.htm",
    members: [
      { name: "Tonia Antoniazzi MP", party: "Labour", role: "chair" },
      { name: "Greg Smith MP", party: "Conservative", role: "vice chair" },
      { name: "Andrew Snowden MP", party: "Conservative", role: "vice chair" },
      { name: "Pete Wishart MP", party: "Scottish National Party", role: "vice chair" },
    ],
  },
];

const APPG_EXAMPLES = [
  {
    name: "APPG on the Less Survivable Cancers",
    tag: "Health",
    color: "#B5533C",
    desc: "Campaigns for the cancers with the lowest survival rates — brain, liver, lung, pancreatic, oesophageal, and stomach — which between them get a fraction of the research funding and public attention that more survivable cancers receive.",
    secretariat: "Run day-to-day by Pancreatic Cancer UK, via the Less Survivable Cancers Taskforce.",
    members: [
      { name: "Paulette Hamilton MP", party: "Labour", role: "chair" },
      { name: "Charlie Maynard MP", party: "Liberal Democrat", role: "vice chair" },
      { name: "Dr Allison Gardner MP", party: "Labour", role: "officer" },
    ],
  },
  {
    name: "All-Party Parliamentary Group for Video Games and Esports",
    tag: "Industry",
    color: "#8A7A3D",
    desc: "Works with the games and interactive entertainment industry to raise its profile in Parliament — one of the UK's biggest creative exports, but one MPs rarely discuss compared with film or music.",
    secretariat: "Its administration is provided by UK Interactive Entertainment (Ukie), the industry's trade body.",
    members: [
      { name: "Charlotte Nichols MP", party: "Labour", role: "chair" },
      { name: "Matt Western MP", party: "Labour", role: "vice chair" },
      { name: "Lord Vaizey of Didcot", party: "Conservative", role: "vice chair" },
    ],
  },
  {
    name: "All-Party Parliamentary Group on Portugal",
    tag: "International",
    color: "#2E6F6F",
    desc: "Builds relationships between UK and Portuguese parliamentarians, and supports trade and cultural ties between the two countries.",
    secretariat: "Administered by the Portuguese Chamber of Commerce in the UK.",
    members: [
      { name: "Valerie Vaz MP", party: "Labour", role: "chair" },
      { name: "Baroness Hooper", party: "Conservative", role: "vice chair" },
      { name: "Christine Jardine MP", party: "Liberal Democrat", role: "vice chair" },
    ],
  },
  {
    name: "All-Party Parliamentary Group on Europe",
    tag: "International",
    color: "#5B4E8A",
    desc: "A newer group (founded October 2024) focused on the UK's evolving relationship with Europe and the EU, aiming to encourage informed, cross-party discussion rather than push a single position.",
    secretariat: "Its secretariat is provided by European Movement UK, a campaign group.",
    members: [
      { name: "Rosena Allin-Khan MP", party: "Labour", role: "co-chair" },
      { name: "Lord Kirkhope", party: "Conservative", role: "co-chair" },
      { name: "Ellie Chowns MP", party: "Green", role: "vice chair" },
    ],
  },
  {
    name: "All-Party Parliamentary Group on Artificial Intelligence",
    tag: "Technology",
    color: "#4C7A6B",
    desc: "Examines how AI is developed and regulated in the UK — bringing together parliamentarians, academics, and industry to look at both the opportunities and the risks as the technology moves fast and policy tries to keep up.",
    secretariat: "Run by the Big Innovation Centre, whose funders for this group include Deloitte, EY, BT Group, and Santander among others.",
    members: [
      { name: "Dr Allison Gardner MP", party: "Labour", role: "chair" },
      { name: "Lord Clement-Jones", party: "Liberal Democrat", role: "co-chair" },
      { name: "Dawn Butler MP", party: "Labour", role: "vice chair" },
    ],
  },
  {
    name: "All-Party Parliamentary Group for Chess",
    tag: "Culture",
    color: "#B0508A",
    desc: "One of the more light-hearted examples — promotes chess in education and community life, and celebrates the game's role in the UK. A reminder that not every APPG is about heavyweight policy.",
    secretariat: "Supported by Chess in Schools and Communities, an education charity.",
    members: [
      { name: "Neil Duncan-Jordan MP", party: "Labour", role: "chair" },
      { name: "Peter Fortune MP", party: "Conservative", role: "co-chair" },
      { name: "Lord Wigley", party: "Plaid Cymru", role: "vice chair" },
    ],
  },
];

export default function AppgMemberships() {
  return (
    <div style={{ padding: PAGE_PADDING }}>
      <PageHeader
        title="APPG Memberships"
        subtitle="All-Party Parliamentary Groups are informal, cross-party groups that MPs and peers join to focus on a particular topic — and one of the earliest, least visible ways outside organisations get access to Parliament."
        maxWidth={900}
      />

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.35 }}
        style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 14, marginBottom: 28, maxWidth: 900 }}
      >
        {QUICK_FACTS.map((fact) => (
          <div
            key={fact.label}
            style={{
              background: COLORS.paperCard,
              border: `1px solid ${COLORS.hairline}`,
              borderRadius: 12,
              padding: "14px 16px",
              textAlign: "center",
            }}
          >
            <div style={{ fontFamily: FONT_DISPLAY, fontSize: 24, color: COLORS.brass }}>{fact.label}</div>
            <div style={{ fontFamily: FONT_BODY, fontSize: 12, color: COLORS.inkSoft, marginTop: 2 }}>{fact.note}</div>
          </div>
        ))}
      </motion.div>

      <InfoCard title="What is an APPG?" color={COLORS.brass} index={0}>
        An All-Party Parliamentary Group brings together MPs and members of the House of Lords who share
        an interest in a topic — a country, a health condition, an industry, a social issue. They have{" "}
        <strong style={{ color: COLORS.ink }}>no official power in Parliament</strong> — they can't pass
        laws — but they regularly host outside speakers, run inquiries, and publish reports that can
        genuinely shape how MPs and ministers think about an issue.
      </InfoCard>

      <div style={{ marginBottom: 32, maxWidth: 900 }}>
        <h2 style={{ fontFamily: FONT_DISPLAY, fontSize: 22, color: COLORS.ink, marginBottom: 4 }}>
          Registered Financial Benefits
        </h2>
        <p style={{ fontFamily: FONT_BODY, fontSize: 13.5, color: COLORS.inkSoft, marginTop: 0, marginBottom: 16 }}>
          A hand-picked sample of real, publicly reported cases — not a complete or automatically updating record.
          The full Register of APPGs is published as a PDF roughly every 6 weeks with no API to draw from
          automatically, so this is refreshed periodically by hand instead, the same approach used for the
          Ministerial Meetings page.
        </p>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {REGISTERED_BENEFITS.map((b, i) => (
            <motion.div
              key={b.group}
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ duration: 0.3, delay: i * 0.05 }}
              style={{ background: COLORS.paperCard, border: `1px solid ${COLORS.hairline}`, borderLeft: `3px solid ${b.color}`, borderRadius: 12, padding: "16px 20px" }}
            >
              <div style={{ fontFamily: FONT_DISPLAY, fontSize: 16.5, color: COLORS.ink, marginBottom: 6 }}>{b.group}</div>
              <div style={{ fontFamily: FONT_BODY, fontSize: 13.5, color: COLORS.inkSoft, lineHeight: 1.6, marginBottom: 8 }}>{b.detail}</div>
              {b.members ? <MemberList members={b.members} /> : (
                <div style={{ fontFamily: FONT_BODY, fontSize: 12, color: COLORS.inkSoft, fontStyle: "italic", marginBottom: 8 }}>{b.note}</div>
              )}
              <a href={b.sourceUrl} target="_blank" rel="noreferrer" style={{ display: "inline-block", marginTop: 10, fontFamily: FONT_BODY, fontSize: 11.5, fontWeight: 700, color: b.color }}>
                Source ↗
              </a>
            </motion.div>
          ))}
        </div>
      </div>

      <div style={{ marginBottom: 20 }}>
        <h2 style={{ fontFamily: FONT_DISPLAY, fontSize: 22, color: COLORS.ink, marginBottom: 4 }}>
          A Few Real Examples
        </h2>
        <p style={{ fontFamily: FONT_BODY, fontSize: 13.5, color: COLORS.inkSoft, marginTop: 0, marginBottom: 16 }}>
          APPGs cover almost every topic imaginable — here's a small, varied sample.
        </p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 14 }}>
          {APPG_EXAMPLES.map((group, i) => (
            <motion.div
              key={group.name}
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ duration: 0.3, delay: (i % 6) * 0.05, ease: "easeOut" }}
              whileHover={{ y: -3, boxShadow: "0 8px 20px rgba(30,42,68,0.12)" }}
              style={{
                background: COLORS.paperCard,
                borderTop: `1px solid ${COLORS.hairline}`,
                borderRight: `1px solid ${COLORS.hairline}`,
                borderBottom: `1px solid ${COLORS.hairline}`,
                borderLeft: `5px solid ${group.color}`,
                borderRadius: 12,
                padding: 16,
                boxShadow: "0 1px 4px rgba(30,42,68,0.05)",
              }}
            >
              <div
                style={{
                  display: "inline-block",
                  fontFamily: FONT_BODY,
                  fontWeight: 700,
                  fontSize: 10,
                  letterSpacing: "0.06em",
                  textTransform: "uppercase",
                  color: group.color,
                  background: `${group.color}1A`,
                  padding: "3px 9px",
                  borderRadius: 999,
                  marginBottom: 8,
                }}
              >
                {group.tag}
              </div>
              <div style={{ fontFamily: FONT_DISPLAY, fontSize: 17, color: COLORS.ink, marginBottom: 6 }}>
                {group.name}
              </div>
              <div style={{ fontFamily: FONT_BODY, fontSize: 13.5, color: COLORS.inkSoft, lineHeight: 1.55, marginBottom: 8 }}>
                {group.desc}
              </div>
              <div style={{ fontFamily: FONT_BODY, fontSize: 12.5, color: COLORS.inkSoft, fontStyle: "italic" }}>
                {group.secretariat}
              </div>
              <div style={{ borderTop: `1px solid ${COLORS.hairline}`, marginTop: 12, paddingTop: 10 }}>
                <div style={{ fontFamily: FONT_BODY, fontWeight: 700, fontSize: 10, color: group.color, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 2 }}>
                  Notable members
                </div>
                <MemberList members={group.members} />
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      <InfoCard title="Why This Matters" color="#8A6D1F" index={1}>
        Running a group takes staff and admin, and that support — called a "secretariat" — is very often
        provided by an outside organisation with a direct stake in the topic: a charity, a trade body, or
        a public affairs firm working for an industry. That's not necessarily improper — it's how these
        groups are usually formed — but it's a genuine, early signal of who an MP is working closely with,
        often well before any formal donation would ever be declared elsewhere.
      </InfoCard>

      <InfoCard title="The Rules APPGs Must Follow" color="#2F6F4E" index={2}>
        <ul style={{ margin: 0, paddingLeft: 20 }}>
          <li style={{ marginBottom: 8 }}>At least 20 members, with officers from more than one political party</li>
          <li style={{ marginBottom: 8 }}>At least two meetings a year, including one Annual General Meeting</li>
          <li style={{ marginBottom: 8 }}>Must publicly declare income or benefits above a set threshold, including secretariat support</li>
          <li>Must re-register roughly every 6 weeks, or the group is automatically dissolved</li>
        </ul>
      </InfoCard>

      <motion.div
        initial={{ opacity: 0, y: 14 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-60px" }}
        transition={{ duration: 0.35, delay: 0.15, ease: "easeOut" }}
        style={{
          background: COLORS.paperCard,
          borderLeft: `1px solid ${COLORS.hairline}`,
          borderRight: `1px solid ${COLORS.hairline}`,
          borderBottom: `1px solid ${COLORS.hairline}`,
          borderTop: `4px solid ${COLORS.ink}`,
          borderRadius: 16,
          padding: "22px clamp(16px, 4vw, 26px)",
          boxShadow: "0 2px 10px rgba(30,42,68,0.05)",
          maxWidth: 900,
        }}
      >
        <h2 style={{ fontFamily: FONT_DISPLAY, fontSize: 21, color: COLORS.ink, marginTop: 0, marginBottom: 10 }}>
          Look Up Any MP's Memberships
        </h2>
        <p style={{ fontFamily: FONT_BODY, fontSize: 14.5, color: COLORS.inkSoft, lineHeight: 1.6, marginTop: 0 }}>
          The full official register is public and searchable — find any MP by name to see every group
          they chair or belong to, and what funding each one has declared. It's updated every few weeks,
          so it's always the most current source.
        </p>
        <motion.a
          href="https://publications.parliament.uk/pa/cm/cmallparty/register/contents.htm"
          target="_blank"
          rel="noreferrer"
          whileHover={{ y: -2, boxShadow: "0 8px 18px rgba(0,0,0,0.18)" }}
          style={{
            display: "inline-block",
            marginTop: 6,
            fontFamily: FONT_BODY,
            fontWeight: 600,
            fontSize: 14,
            color: "#fff",
            background: COLORS.ink,
            padding: "10px 20px",
            borderRadius: 10,
            textDecoration: "none",
          }}
        >
          Open the official APPG Register ↗
        </motion.a>
      </motion.div>
    </div>
  );
}

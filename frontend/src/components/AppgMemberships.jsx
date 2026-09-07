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

const APPG_EXAMPLES = [
  {
    name: "All-Party Parliamentary Group on Cancer",
    tag: "Health",
    color: "#B5533C",
    desc: "Founded in 1998 to keep cancer care and treatment high on the political agenda. It brings MPs, peers, doctors, researchers, and patients together to push for better, more consistent cancer services across the NHS.",
    secretariat: "Run day-to-day by Macmillan Cancer Support, a cancer charity.",
  },
  {
    name: "All-Party Parliamentary Beer Group",
    tag: "Industry",
    color: "#8A7A3D",
    desc: "Promotes the UK brewing and pub industry — its economic contribution, cultural role, and the challenges pubs and breweries face, from tax to planning rules.",
    secretariat: "Its administration is provided by Ocklynge Consulting, a public affairs firm working for the brewing sector.",
  },
  {
    name: "All-Party Parliamentary Group on Portugal",
    tag: "International",
    color: "#2E6F6F",
    desc: "Builds relationships between UK and Portuguese parliamentarians, and supports trade and cultural ties between the two countries.",
    secretariat: "Administered by the Portuguese Chamber of Commerce in the UK.",
  },
  {
    name: "All-Party Parliamentary Group on Europe",
    tag: "International",
    color: "#5B4E8A",
    desc: "A newer group (first met in late 2024) focused on the UK's evolving relationship with Europe and the EU, aiming to encourage informed, cross-party discussion rather than push a single position.",
    secretariat: "Its secretariat is provided by European Movement UK, a campaign group.",
  },
  {
    name: "All-Party Parliamentary Group on Artificial Intelligence",
    tag: "Technology",
    color: "#4C7A6B",
    desc: "Examines how AI is developed and regulated in the UK — bringing together parliamentarians, academics, and industry to look at both the opportunities and the risks as the technology moves fast and policy tries to keep up.",
    secretariat: "Typically supported by organisations with a stake in AI policy and industry standards.",
  },
  {
    name: "All-Party Parliamentary Group for Chess",
    tag: "Culture",
    color: "#B0508A",
    desc: "One of the more light-hearted examples — promotes chess in education and community life, and celebrates the game's role in the UK. A reminder that not every APPG is about heavyweight policy.",
    secretariat: "Supported by chess federations and educational charities.",
  },
];

export default function AppgMemberships() {
  return (
    <div style={{ padding: PAGE_PADDING }}>
      <PageHeader
        title="APPG Memberships"
        subtitle="All-Party Parliamentary Groups are informal, cross-party groups MPs and peers join to focus on a particular topic — and one of the earliest, least visible ways outside organisations connect with Parliament."
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
            </motion.div>
          ))}
        </div>
      </div>

      <InfoCard title="Why It's Worth Knowing About" color="#8A6D1F" index={1}>
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

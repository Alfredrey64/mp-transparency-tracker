import { motion } from "framer-motion";
import { COLORS, FONT_DISPLAY, FONT_BODY, PAGE_PADDING } from "../theme";
import { PageHeader, InfoCard, WhyItMattersBand, FlowNode, FlowArrow } from "./shared";
import { GlossaryTerm } from "./GlossaryTerm";
import { IconDoor, IconCompare, IconGavel, IconShield, IconCabinet, IconBriefcase } from "./icons";

// A literally revolving door between the same two roles the whole page is
// about — the animation itself is the argument: nothing stops the same
// person passing back and forth between these two circles.
function RevolvingDoorDiagram() {
  return (
    <div
      style={{
        padding: "30px 20px 24px", marginBottom: 30, maxWidth: "none", textAlign: "center",
        background: COLORS.paperCard, border: `1px solid ${COLORS.hairline}`, borderRadius: 18,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, flexWrap: "wrap" }}>
        <FlowNode icon={IconCabinet} label="Government minister" color="#6E4B6E" />
        <FlowArrow color="#6E4B6E" showGlyph={false} oscillate trackWidth={64} />
        <motion.div
          animate={{ rotate: [0, 35, 0, -35, 0] }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
          style={{
            flexShrink: 0, width: 64, height: 64, borderRadius: "50%", background: "#6E4B6E",
            display: "flex", alignItems: "center", justifyContent: "center", color: "#fff",
          }}
        >
          <IconDoor size={28} />
        </motion.div>
        <FlowArrow color="#9C6B30" showGlyph={false} oscillate trackWidth={64} />
        <FlowNode icon={IconBriefcase} label="Paid industry role" color="#9C6B30" />
      </div>
      <div style={{ fontFamily: FONT_BODY, fontSize: 12.5, color: COLORS.inkSoft, margin: "16px auto 0", maxWidth: 520 }}>
        The body that reviewed exactly this move for fifty years, ACOBA, handled{" "}
        <strong style={{ color: COLORS.ink }}>817 applications</strong> in its final four alone — and refused not a
        single one.
      </div>
    </div>
  );
}

const CASES = [
  {
    name: "George Osborne",
    role: "Chancellor of the Exchequer, 2010–2016",
    color: "#9C6B30",
    what: "Sought ACOBA's advice before joining BlackRock as an adviser in January 2017, as the rules required. Two months later, he accepted the editorship of the Evening Standard without clearing it with ACOBA first.",
    outcome: "A committee of MPs accused him of showing \"disrespect\" for the rules. He went on to take at least ten private-sector roles within five years of leaving the Treasury — none of which ACOBA had any power to block.",
  },
  {
    name: "David Cameron",
    role: "Prime Minister, 2010–2016",
    color: "#5B4E8A",
    what: "Became an adviser to Greensill Capital and, when the firm ran into trouble, personally lobbied the Chancellor to grant it access to a state-backed Covid loan scheme.",
    outcome: "None of it broke any rule — because it happened more than two years after he'd left office, ACOBA's jurisdiction over him had already expired entirely. The case became the clearest illustration of the old system's built-in expiry date.",
  },
  {
    name: "Boris Johnson",
    role: "Prime Minister, 2019–2022",
    color: "#9C3B3B",
    what: "Broke ACOBA's rules on three separate occasions after leaving government — both during and after his premiership — including taking up paid roles before the committee had signed off on them.",
    outcome: "ACOBA has no statutory power to fine or block a breach, only to publicly say so — which is what it did each time.",
  },
  {
    name: "George Freeman MP",
    role: "Minister for Science, Research and Innovation until November 2023",
    color: "#3F7D5C",
    what: "Became a paid adviser to the satellite-data firm GHGSat in April 2024. ACOBA's advice was explicit: he should not lobby government on the company's behalf. In 2025, leaked emails reported by The Times appeared to show him discussing what to ask ministers with GHGSat's director before tabling written questions on space data and emissions tracking.",
    outcome: "Freeman self-referred and was investigated by the Registrar of Consultant Lobbyists over whether this amounted to unregistered lobbying — see the Consultant Lobbyists page. The Registrar cleared him on that specific question in October 2025; the rules, he noted, don't stop an MP asking questions on a topic where they have a financial interest, as long as it's properly declared.",
  },
];

function CaseCard({ item, index }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.3, delay: (index % 6) * 0.05 }}
      style={{ background: COLORS.paperCard, border: `1px solid ${COLORS.hairline}`, borderLeft: `4px solid ${item.color}`, borderRadius: 14, padding: "18px 20px" }}
    >
      <div style={{ fontFamily: FONT_DISPLAY, fontSize: 18, color: COLORS.ink, marginBottom: 2 }}>{item.name}</div>
      <div style={{ fontFamily: FONT_BODY, fontSize: 11.5, color: item.color, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: 10 }}>
        {item.role}
      </div>
      <div style={{ marginBottom: 10 }}>
        <div style={{ fontFamily: FONT_BODY, fontWeight: 700, fontSize: 11, color: "#9C3B3B", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 3 }}>
          What happened
        </div>
        <div style={{ fontFamily: FONT_BODY, fontSize: 13.5, color: COLORS.ink, lineHeight: 1.6 }}>{item.what}</div>
      </div>
      <div>
        <div style={{ fontFamily: FONT_BODY, fontWeight: 700, fontSize: 11, color: item.color, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 3 }}>
          What followed
        </div>
        <div style={{ fontFamily: FONT_BODY, fontSize: 13.5, color: COLORS.ink, lineHeight: 1.6 }}>{item.outcome}</div>
      </div>
    </motion.div>
  );
}

export default function RevolvingDoor() {
  return (
    <div className="editorial" style={{ padding: PAGE_PADDING }}>
      <PageHeader
        icon={IconDoor}
        kicker="Transparency Gaps"
        title="The revolving door between government and industry"
        subtitle="When a minister or senior official leaves office, their knowledge and contacts go with them. UK rules on where they can go next have long been criticised as advisory only. This page explains how the system worked, why it has recently changed, and four cases that shaped the debate."
        maxWidth={900}
      />

      <div className="editorial-body">

      <WhyItMattersBand icon={IconDoor} color="#6E4B6E">
        a minister who could profit from a private-sector job right after leaving office has a reason to make
        decisions with that job in mind, even without ever consciously meaning to — and for fifty years, the only
        thing standing in the way was a committee that could ask them nicely, not stop them.
      </WhyItMattersBand>

      <RevolvingDoorDiagram />

      <InfoCard title="Why this is called a 'revolving door'" color="#5A7FA6" icon={IconDoor} index={0}>
        <p style={{ marginTop: 0 }}>
          Imagine a defence minister who spends years deciding which companies win government contracts — then,
          within months of leaving office, takes a highly paid advisory role at one of those same companies. Nothing
          about that is automatically illegal. But it raises an obvious question: was that job offered because of
          genuine expertise, or as a reward for decisions made in office — and would a minister make different
          decisions if a future job offer might depend on it? The "revolving door" is the name for this whole
          pattern: people moving freely back and forth between government and the industries government regulates,
          funds, or buys from.
        </p>
        <p style={{ marginBottom: 0 }}>
          Nobody can read a minister's mind, which is exactly why this is hard to regulate — you can't prove a
          decision was influenced by a future job that didn't exist yet. The rules below try to manage the
          appearance and opportunity for this, even though they can't police the intentions behind it.
        </p>
      </InfoCard>

      <InfoCard title="What the business appointment rules are for" color="#6E4B6E" icon={IconShield} index={1}>
        Ministers, senior civil servants and special advisers all have access to confidential information, and make
        decisions that affect specific companies and industries. The business appointment rules exist so that,
        before taking a job connected to their old role, they have to seek advice on whether it risks looking like
        their government position was used to set up a private payday — or that the new employer is buying access
        to people still inside government. Getting advice has always been a requirement; following it has not.
      </InfoCard>

      <InfoCard title="ACOBA has gone. Here is what replaced it" color="#9C6B30" icon={IconCompare} index={2}>
        <p style={{ marginTop: 0 }}>
          The Advisory Committee on Business Appointments (ACOBA) — the body that gave this advice for exactly 50
          years — was abolished on 13 October 2025. Its work has been split in two: applications from{" "}
          <strong style={{ color: COLORS.ink }}>former ministers</strong> now go to the Prime Minister's own
          Independent Adviser on Ministerial Standards, while <strong style={{ color: COLORS.ink }}>former{" "}
          <GlossaryTerm term="Civil Service">civil servants</GlossaryTerm> and special advisers</strong> go through the Civil Service Commission. Former ACOBA staff moved
          across to keep the process running.
        </p>
        <p style={{ marginBottom: 0 }}>
          The new Independent Adviser handled 61 former-ministers' applications in its first reporting year
          (2025–26). The system works, but it is new and has no long track record. Whether folding this into a role
          with a much broader remit strengthens or dilutes scrutiny is something this page will keep watching. It
          is too early to judge.
        </p>
      </InfoCard>

      <InfoCard title="Why the old system struggled" color="#9C3B3B" icon={IconGavel} index={3}>
        <ul style={{ margin: 0, paddingLeft: 20 }}>
          <li style={{ marginBottom: 8 }}>
            <strong style={{ color: COLORS.ink }}>Advisory, not enforceable</strong> — ACOBA could recommend a
            waiting period or a lobbying ban, but had no legal power to block an appointment or penalise someone
            who ignored its advice.
          </li>
          <li style={{ marginBottom: 8 }}>
            <strong style={{ color: COLORS.ink }}>A hard two-year cutoff</strong> — its jurisdiction over anyone
            expired two years after they left office, regardless of how directly relevant their new job was.
          </li>
          <li>
            <strong style={{ color: COLORS.ink }}>Never once said no</strong> — ACOBA has not refused a single
            application since 2010, whatever the appointment.
          </li>
        </ul>
      </InfoCard>

      <div style={{ marginBottom: 20, maxWidth: "none" }}>
        <h2 style={{ fontFamily: FONT_DISPLAY, fontSize: 22, color: COLORS.ink, marginBottom: 4 }}>
          Four real cases
        </h2>
        <p style={{ fontFamily: FONT_BODY, fontSize: 13.5, color: COLORS.inkSoft, marginTop: 0, marginBottom: 16 }}>
          Chosen to show the range — from a technical process failure, to a case that fell entirely outside the
          rules' reach, to one still being tested under the new system.
        </p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(min(320px, 100%), 1fr))", gap: 14 }}>
          {CASES.map((item, i) => (
            <CaseCard key={item.name} item={item} index={i} />
          ))}
        </div>
      </div>
      </div>
    </div>
  );
}

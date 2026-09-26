import { motion } from "framer-motion";
import { COLORS, FONT_DISPLAY, FONT_BODY, PAGE_PADDING } from "../theme";
import { PageHeader, InfoCard, WhyItMattersBand, FlowNode, FlowArrow } from "./shared";
import { IconThinkTank, IconShield, IconSearch, IconBroadcast, IconQuestion } from "./icons";

// The gap the whole page is about, drawn as a broken chain: you see the
// person on screen, you never see who's actually behind them.
function MaskedExpertDiagram() {
  return (
    <div
      style={{
        padding: "30px 20px 24px", marginBottom: 30, maxWidth: 900, textAlign: "center",
        background: COLORS.paperCard, border: `1px solid ${COLORS.hairline}`, borderRadius: 18,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, flexWrap: "wrap" }}>
        <FlowNode icon={IconBroadcast} label={'"Independent expert" on air'} color="#5A7FA6" />
        <FlowArrow />
        <FlowNode icon={IconQuestion} label="Who's actually paying them" color="#9C3B3B" broken />
      </div>
      <div style={{ fontFamily: FONT_BODY, fontSize: 12.5, color: COLORS.inkSoft, margin: "18px auto 0", maxWidth: 480 }}>
        The audience sees the first circle every time. The second is the one no broadcaster is required to fill in
        — the sample below shows what happens on the rare occasions someone actually checked.
      </div>
    </div>
  );
}

const GRADE_COLOR = {
  A: "#3F7D5C",
  B: "#4C7A6B",
  C: "#9C6B30",
  D: "#B5533C",
  E: "#9C3B3B",
};

// A small, hand-picked sample of prominent UK think tanks with a
// publicly available "Who Funds You?" grade — not an exhaustive or
// systematically balanced survey. See whofundsyou.org for their full,
// independently assessed ratings.
const THINK_TANKS = [
  {
    name: "Institute of Economic Affairs",
    lean: "Free-market / right-leaning",
    grade: "E",
    detail: "Registered as an educational charity, which exempts it from declaring donors. Known long-term funders identified by journalists include BP (every year since 1967) and British American Tobacco; its largest known individual donor, Nigel Vinson, gave £3.7 million in 2023 alone.",
  },
  {
    name: "Adam Smith Institute",
    lean: "Free-market / right-leaning",
    grade: "E",
    detail: "One of only four UK think tanks — out of roughly 200 assessed — that refuse to name a single donor. Rated \"highly opaque\" by the transparency watchdog Transparify.",
  },
  {
    name: "TaxPayers' Alliance",
    lean: "Free-market / right-leaning",
    grade: "E",
    detail: "Files only abbreviated accounts at Companies House, so income and expenditure aren't disclosed in detail. Some individual UK donors have been identified (including Lord Bamford and Lord Edmiston), alongside undisclosed US funding channelled through its American fundraising arm.",
  },
  {
    name: "Centre for Policy Studies",
    lean: "Free-market / right-leaning",
    grade: "D",
    detail: "Rated among the least transparent UK think tanks in 2019, improving slightly to a D grade by 2023 — still well below the disclosure standard of the organisations below.",
  },
  {
    name: "Institute for Public Policy Research (IPPR)",
    lean: "Progressive / left-leaning",
    grade: "A",
    detail: "Publishes a breakdown of its funders and states it never accepts money from political parties.",
  },
  {
    name: "Resolution Foundation",
    lean: "Non-partisan (living standards focus)",
    grade: "A",
    detail: "Publishes its funders and describes itself as strictly non-partisan, focused on outcomes for low-to-middle income households regardless of who's in government.",
  },
  {
    name: "Institute for Fiscal Studies (IFS)",
    lean: "Non-partisan (economic analysis)",
    grade: "A",
    detail: "The UK's most-cited independent economic analysts. States it never accepts funding contingent on a research project reaching a particular conclusion.",
  },
];

function ThinkTankRow({ item, index }) {
  const color = GRADE_COLOR[item.grade];
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.3, delay: (index % 8) * 0.05 }}
      style={{ display: "flex", gap: 16, alignItems: "flex-start", background: COLORS.paperCard, border: `1px solid ${COLORS.hairline}`, borderLeft: `4px solid ${color}`, borderRadius: 12, padding: "16px 20px" }}
    >
      <div
        style={{
          flexShrink: 0, width: 44, height: 44, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center",
          background: `${color}1c`, color, fontFamily: FONT_DISPLAY, fontSize: 20, fontWeight: 700,
        }}
      >
        {item.grade}
      </div>
      <div style={{ minWidth: 0, flex: 1 }}>
        <div style={{ display: "flex", alignItems: "baseline", gap: 8, flexWrap: "wrap", marginBottom: 3 }}>
          <span style={{ fontFamily: FONT_DISPLAY, fontSize: 17, color: COLORS.ink }}>{item.name}</span>
        </div>
        <div style={{ fontFamily: FONT_BODY, fontSize: 11.5, fontWeight: 700, color: COLORS.inkSoft, textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: 8 }}>
          {item.lean}
        </div>
        <div style={{ fontFamily: FONT_BODY, fontSize: 13.5, color: COLORS.ink, lineHeight: 1.6 }}>{item.detail}</div>
      </div>
    </motion.div>
  );
}

export default function ThinkTankFunding() {
  return (
    <div style={{ padding: PAGE_PADDING }}>
      <PageHeader
        icon={IconThinkTank}
        kicker="Public Record · Transparency Gaps"
        title="Who funds the think tanks you hear from?"
        subtitle="Think tank staff appear on the news as independent experts every day — but UK law puts no obligation on any of them to say who pays for their research. This page shows what an independent transparency project has actually found when it asked, across the political spectrum."
        maxWidth={900}
      />

      <WhyItMattersBand icon={IconThinkTank} color="#9C6B30">
        the "expert" quoted on the news tonight could be paid, indirectly, by exactly the industry their comments
        defend — and under UK law, neither they nor the broadcaster interviewing them has to tell you that.
      </WhyItMattersBand>

      <MaskedExpertDiagram />

      <InfoCard title="What a think tank actually is" color="#5A7FA6" icon={IconQuestion} index={0}>
        <p style={{ marginTop: 0 }}>
          A think tank is an organisation that researches policy questions — the economy, health, immigration,
          climate — and publishes reports and recommendations aimed at influencing government and public debate.
          Some genuinely are independent researchers with no fixed agenda. Others exist largely to make a particular
          industry's or ideology's case sound like disinterested expert analysis, which is precisely why who funds
          one matters: it's one of the few real clues to which kind you're looking at.
        </p>
        <p style={{ marginBottom: 0 }}>
          They're not fringe voices — think tank staff are quoted in newspapers, interviewed on the radio, and
          invited to brief select committees and ministers on a near-daily basis, almost always introduced by their
          job title alone, with no mention of who pays their salary.
        </p>
      </InfoCard>

      <InfoCard title="Why there's no legal requirement to say" color="#9C3B3B" icon={IconShield} index={1}>
        <p style={{ marginTop: 0 }}>
          A political party has to name a donor who gives more than a few hundred pounds. A think tank — even one
          whose staff regularly brief ministers and appear on broadcast news — has no equivalent duty at all.
        </p>
        <p style={{ marginBottom: 0 }}>
          Most register as <strong style={{ color: COLORS.ink }}>educational charities</strong>. Charity law's rules
          are built around a completely different question — making sure a charity's money is spent on its stated
          charitable purpose — and were simply never designed to answer "who is trying to influence government
          policy through this organisation?" the way election law is. Several UK think tanks have used that mismatch
          to keep every donor's identity confidential, entirely lawfully.
        </p>
      </InfoCard>

      <InfoCard title="Who Funds You? — an independent scorecard, not ours" color="#3F7D5C" icon={IconSearch} index={2}>
        <p style={{ marginTop: 0 }}>
          Rather than judge any organisation's transparency ourselves, every grade below is taken directly from{" "}
          <a href="https://whofundsyou.org/" target="_blank" rel="noreferrer" style={{ color: COLORS.ink, fontWeight: 600 }}>
            Who Funds You? ↗
          </a>
          , an independent project that has assessed UK think tanks and campaign groups on an A (fully transparent)
          to E (undisclosed) scale since 2011. It ran a comprehensive annual review through 2024; funding
          constraints mean it now runs rolling, risk-based updates rather than reassessing everyone every year, so a
          rating here may be a couple of years old for some organisations.
        </p>
        <p style={{ marginBottom: 0 }}>
          A poor grade is not proof that a specific claim from that organisation is wrong — but it does mean their
          independence can't be checked the way a party donation or an MP's outside earnings can be, everywhere
          else on this site.
        </p>
      </InfoCard>

      <div style={{ marginBottom: 24, maxWidth: 900 }}>
        <h2 style={{ fontFamily: FONT_DISPLAY, fontSize: 22, color: COLORS.ink, marginBottom: 4 }}>
          A sample, across the spectrum
        </h2>
        <p style={{ fontFamily: FONT_BODY, fontSize: 13.5, color: COLORS.inkSoft, marginTop: 0, marginBottom: 16 }}>
          Seven prominent UK think tanks with a published Who Funds You? grade — three free-market organisations
          rated poorly, one left-leaning and two non-partisan organisations rated highly. This is a hand-picked
          sample to illustrate the range, not a comprehensive or systematically balanced survey of every think tank
          in Britain; Who Funds You? itself has assessed dozens more, in both directions.
        </p>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {THINK_TANKS.map((item, i) => (
            <ThinkTankRow key={item.name} item={item} index={i} />
          ))}
        </div>
      </div>

      <InfoCard title="Why this matters for what you see on the news" color="#9C6B30" icon={IconBroadcast} index={3}>
        A think tank fellow introduced on air as an "independent" or "leading" analyst is giving their institution's
        view a platform without the audience necessarily knowing who funds that institution — a gap that sits right
        alongside the questions raised on the{" "}
        <strong style={{ color: COLORS.ink }}>Media Literacy</strong> page about who's regulated to be impartial and
        who isn't. Knowing an organisation's transparency grade doesn't tell you whether a specific argument is
        right or wrong — but it's a reasonable prompt to ask who benefits before taking "independent" at face value.
      </InfoCard>
    </div>
  );
}

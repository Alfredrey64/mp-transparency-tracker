import { COLORS, FONT_BODY, FONT_DISPLAY } from "../theme";
import { Caution, Panel } from "./insight";
import { MIGRATION, OPINION, SOURCES } from "../data/brexit";
import { para } from "../lib/insightStyle";

const ACCENT = "#1D4ED8";
const side = { fontFamily: FONT_BODY, fontSize: 14.5, lineHeight: 1.6, color: COLORS.inkSoft, margin: "0 0 6px" };
const head = { fontFamily: FONT_DISPLAY, fontSize: 14.5, fontWeight: 700, color: COLORS.ink, margin: "12px 0 4px" };

const TAGS = {
  estimated: { text: "Estimated", note: "A comparison with a version of the UK that never left, so it comes as a range" },
  measured: { text: "Counted", note: "Official figures that can be checked" },
  contested: { text: "Contested", note: "Experts disagree about what the figures show" },
  values: { text: "A matter of values", note: "Evidence can inform it but cannot settle it" },
};

function Argument({ id, title, tag, shows, supporters, critics, sources }) {
  const t = TAGS[tag];
  return (
    <Panel id={id} title={title} sources={sources}>
      <p style={{ margin: "0 0 10px", fontFamily: FONT_BODY, fontSize: 12.5, color: COLORS.inkSoft }}>
        <span style={{ display: "inline-block", padding: "2px 10px", marginRight: 8, borderRadius: 999, background: COLORS.paper, border: `1px solid ${COLORS.hairline}`, color: COLORS.ink, fontWeight: 700 }}>{t.text}</span>
        {t.note}
      </p>
      <div style={{ padding: "10px 14px", borderRadius: 12, background: COLORS.paper, border: `1px solid ${COLORS.hairline}`, fontFamily: FONT_BODY, fontSize: 14, lineHeight: 1.55, color: COLORS.ink }}>
        <strong>What the evidence shows.</strong> {shows}
      </div>
      <h3 style={head}>Supporters of leaving say</h3>
      {supporters.map((s) => <p key={s} style={side}>{s}</p>)}
      <h3 style={head}>Critics say</h3>
      {critics.map((s) => <p key={s} style={side}>{s}</p>)}
    </Panel>
  );
}

export default function BrexitArguments() {
  return (
    <div>
      <Panel
        id="h-bxa-intro" accent={ACCENT} title="The case for and against"
        lead="Each topic below sets out what the evidence shows, then the main arguments on each side, in the strongest form each would put them. Where the evidence is an estimate or is disputed, it says so. They are the arguments people make, not our view."
      >
        <p style={{ ...para, marginTop: 0 }}>The tags show how firm the evidence is: <strong>counted</strong> figures can be checked, <strong>estimated</strong> ones are ranges, <strong>contested</strong> ones are read differently by experts, and some questions are <strong>a matter of values</strong>.</p>
      </Panel>

      <Argument
        id="h-bxa-economy" title="The economy" tag="estimated"
        shows="Most researchers who have studied it find that the economy is smaller than it would have been, by 2% to 6% according to UK in a Changing Europe's review, with one team finding 6% to 8%. The OBR assumes productivity will be 4% lower in the long run. The Institute of Economic Affairs argues that trade data do not show harm on that scale."
        supporters={[
          "The costs, where they exist, are the cost of adjusting, and they will shrink as firms adapt, while the freedom to set the UK's own trade and regulatory policy will bring gains over time.",
          "Forecasts before the vote and since have often been too gloomy, and some of what is blamed on Brexit was caused by Covid, energy prices and domestic policy.",
        ]}
        critics={[
          "Trade with the EU is harder than before and investment was held back for years by uncertainty, so the economy has grown more slowly than it otherwise would, and the loss builds up over time.",
          "The gains from other trade deals are small by the government's own estimates, and nothing that has been done so far makes up for the cost of less trade with the biggest market next door.",
        ]}
        sources={[SOURCES.ukiceTenYears, SOURCES.nber, SOURCES.obr, SOURCES.iea]}
      />

      <Argument
        id="h-bxa-trade" title="Trade with the EU and the rest of the world" tag="contested"
        shows="Goods exports to the EU were 48% of the UK's goods exports in late 2025, and the UK is a smaller share of the EU's goods trade than in 2015 (13.1% of its exports against 16.9%). UK in a Changing Europe says the figures do not show a simple collapse, but that fewer firms are likely to be exporting to the EU."
        supporters={[
          "Tariffs on goods were avoided, trade with the EU is still large, and the UK is free to make deals with the rest of the world, where most of the world's growth is.",
          "The cost of paperwork is real but has been exaggerated, and firms have found ways to deal with it.",
        ]}
        critics={[
          "Rules of origin, customs checks and different rules have added costs that weigh most on small firms, and some sectors, such as clothing exports and some services, have lost out.",
          "Nearby markets matter more than far-off ones, so deals with distant countries cannot replace easy trade with the EU.",
        ]}
        sources={[SOURCES.onsTrade, SOURCES.eurostat, SOURCES.ukiceEconomy]}
      />

      <Argument
        id="h-bxa-deals" title="New trade deals" tag="estimated"
        shows="The government's own assessments put the long-run gain from the UK-India agreement at about £4.8 billion a year (0.13% of GDP by 2040) and from joining the CPTPP at about £2 billion a year."
        supporters={[
          "Deals with fast-growing economies such as India and the Pacific group give UK firms in services, cars and food and drink better access, and each new deal adds to the last.",
          "The UK can move faster and more flexibly than the EU as a bloc.",
        ]}
        critics={[
          "The gains are a small fraction of the cost estimated for leaving the EU, which UK in a Changing Europe says official estimates show.",
          "Deals can bring new competition and pressure on standards, for example on food and animal welfare, in return for market access.",
        ]}
        sources={[SOURCES.indiaDeal, SOURCES.cptpp, SOURCES.ukiceEconomy]}
      />

      <Argument
        id="h-bxa-rules" title="Sovereignty and regulation" tag="values"
        shows="Parliament now makes UK law without EU institutions, but the Institute for Government finds that the UK has so far changed much less of the rules it inherited than supporters promised, and has less say over rules it still has to meet to sell to the EU."
        supporters={[
          "Laws should be made and changed by people the voters can remove. Being able to set its own rules lets the UK move faster in new fields such as financial technology, life sciences and gene editing.",
          "Even if little has changed yet, the freedom to change is worth having, and it should be used more.",
        ]}
        critics={[
          "In practice the UK often follows EU rules anyway to keep trading, and now has no seat where they are written, so it has lost influence without gaining much freedom.",
          "Having different rules from the EU adds costs for firms that sell to both.",
        ]}
        sources={[SOURCES.ifgRegulation]}
      />

      <Argument
        id="h-bxa-migration" title="Immigration" tag="measured"
        shows={`In the ${MIGRATION.period}, net migration was ${MIGRATION.net.toLocaleString("en-GB")}, down from a peak of ${MIGRATION.netPeak.toLocaleString("en-GB")} in the ${MIGRATION.netPeakPeriod}. Net migration of EU and similar nationals was ${MIGRATION.euNet.toLocaleString("en-GB")} and of non-EU nationals ${MIGRATION.nonEuNet.toLocaleString("en-GB")}.`}
        supporters={[
          "The UK now decides who can come, and can set its own rules on skills, pay and family, which it could not for EU citizens.",
          "Migration from the EU has fallen, and the government can now decide on numbers from every country, which it could not do for the EU.",
        ]}
        critics={[
          "Migration overall rose to record levels after Brexit through other routes, so leaving did not by itself deliver lower numbers, and employers say they have struggled to fill some jobs.",
          "Ending free movement also ended the right of British people to live and work easily in the EU.",
        ]}
        sources={[SOURCES.onsMigration, SOURCES.ukiceEconomy]}
      />

      <Argument
        id="h-bxa-ni" title="Northern Ireland" tag="values"
        shows="The Windsor Framework of 2023 gives Northern Ireland a green lane for goods staying in the UK and a Stormont brake on new EU goods laws. Northern Ireland still follows some EU rules on goods."
        supporters={[
          "The Framework protects the Good Friday Agreement and trade across the border and with Great Britain, and the Stormont brake gives local politicians a say.",
        ]}
        critics={[
          "Northern Ireland is still treated differently from the rest of the UK on goods, and the rules that apply there are made in Brussels.",
        ]}
        sources={[SOURCES.windsor, SOURCES.commonUnderstanding]}
      />

      <Argument
        id="h-bxa-vote" title="The vote itself" tag="values"
        shows={`52% voted Leave in 2016. In a September 2026 poll ${OPINION.wrong}% said it was wrong to leave and ${OPINION.right}% said it was right; ${OPINION.leaveVotersStandBy}% of Leave voters stood by their vote and ${OPINION.leaveVotersNowWrong}% did not, in June 2026.`}
        supporters={[
          "The people were asked and decided, and the result should be respected. Judging it only on the economy ignores why many people voted: control over laws and borders.",
          "Polls in hindsight are affected by the cost of living and by the government of the day, and do not show what people would choose today if asked the original question.",
        ]}
        critics={[
          "The vote was held on promises that have not been kept, such as large savings and easy trade deals, and the public has changed its mind.",
          "A majority now think it was a mistake, and the government should work for the closest possible relationship, including a possible new vote.",
        ]}
        sources={[SOURCES.referendum, SOURCES.yougov]}
      />

      <Panel id="h-bxa-close" title="A short way to see where each side stands">
        <p style={{ ...para, marginTop: 0 }}>Most economists who have studied the question think the economy is smaller as a result of Brexit and differ on by how much. Supporters of leaving reply that the economy was never the main reason for the vote, that the costs are being overstated, and that benefits take time. Whether the economic cost is worth the political aims is something each person weighs for themselves.</p>
        <Caution title="Limits">These summaries are short, and each side would say more. Some of the arguments, such as those on the vote itself, are about values and no figure settles them. See the Sources page for where the figures come from.</Caution>
      </Panel>
    </div>
  );
}

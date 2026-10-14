import { COLORS, FONT_BODY, FONT_DISPLAY } from "../theme";
import { Caution, Panel } from "./insight";
import { incomeFacts, povertyFacts, regionTable, wealthFacts } from "../lib/inequality";
import { SOURCES } from "../data/inequality";
import { para } from "../lib/insightStyle";

const ACCENT = "#C7871A";

const side = { fontFamily: FONT_BODY, fontSize: 14.5, lineHeight: 1.6, color: COLORS.inkSoft, margin: "0 0 6px" };
const head = { fontFamily: FONT_DISPLAY, fontSize: 14.5, fontWeight: 700, color: COLORS.ink, margin: "12px 0 4px" };

function Argument({ id, title, shows, supporters, critics, link }) {
  return (
    <Panel id={id} title={title} sources={link}>
      <div style={{ padding: "10px 14px", borderRadius: 12, background: COLORS.paper, border: `1px solid ${COLORS.hairline}`, fontFamily: FONT_BODY, fontSize: 14, lineHeight: 1.55, color: COLORS.ink }}>
        <strong>What the figures show.</strong> {shows}
      </div>
      <h3 style={head}>People who want more done say</h3>
      {supporters.map((t) => <p key={t} style={side}>{t}</p>)}
      <h3 style={head}>People who are more cautious say</h3>
      {critics.map((t) => <p key={t} style={side}>{t}</p>)}
    </Panel>
  );
}

export default function InequalityDebate() {
  const inc = incomeFacts();
  const pov = povertyFacts();
  const w = wealthFacts();
  const regions = regionTable();
  const top = regions[0];
  const bottom = regions.at(-1);
  return (
    <div>
      <Panel
        id="h-debate-intro" accent={ACCENT} title="The arguments"
        lead="Figures can show how things are spread. They cannot say whether that is fair or what to do about it. People disagree about both, and these are the main arguments, set out as fairly as we can. They are the arguments people make, not our view."
        sources={[SOURCES.deaton]}
      >
        <p style={{ ...para, marginTop: 0 }}>
          Research for the IFS Deaton Review of Inequalities, a major recent study of the subject in the UK, found that the British public falls into three broad groups on these questions: people who put differences in outcomes down mainly to how society is organised, people who put them down mainly to individual effort and choices, and a group in the middle. Which group someone is in shapes which of the arguments below they find convincing.
        </p>
      </Panel>

      <Argument
        id="h-debate-poverty" title="Should the priority be the gap, or poverty?"
        shows={`${Math.round(pov.all.ahc)}% of people are in relative poverty after housing costs, and the richest fifth have ${inc.s80s20.toFixed(1)} times the income after tax of the poorest fifth.`}
        supporters={[
          "A large gap matters in itself. It affects who has power and a voice, whether people from poorer backgrounds can move up, and how far people feel they share a society.",
          "Relative poverty is the right measure because being poor means being unable to take part in the normal life of your country, which depends on what others have.",
        ]}
        critics={[
          "What matters most is that nobody is in hardship and that everyone's living standards rise. A gap does little harm if the poorest are getting better off, and the focus should be on raising the floor.",
          "Relative measures can mislead: relative poverty can fall when the typical income falls, even though no one is better off. Some prefer to track absolute poverty or what people can actually buy.",
        ]}
        link={[SOURCES.hbai]}
      />

      <Argument
        id="h-debate-benefits" title="Benefits, work and child poverty"
        shows={`${Math.round(pov.children.ahc)}% of children are in relative poverty after housing costs. The government says ending the two-child limit will lift around 450,000 children out of poverty by 2029/30.`}
        supporters={[
          "Support aimed at families with children is the quickest and most certain way to reduce child poverty, and the two-child limit hit the children of larger families whatever their parents did.",
          "Many children in poverty live in families where someone works, so work alone does not solve it.",
        ]}
        critics={[
          "The money is better spent on helping parents into better-paid work, childcare and housing, which lift incomes for the long term rather than paying for them through the benefit system.",
          "Benefits cost a great deal and have to be paid for by taxes or borrowing, and a limit on the number of children supported can encourage families to weigh up work and family size.",
        ]}
        link={[SOURCES.hbai, SOURCES.twoChild]}
      />

      <Argument
        id="h-debate-wealth" title="Taxing wealth"
        shows={`The richest tenth of households hold ${Math.round(w.top10)}% of all wealth, and the poorest half hold ${Math.round(w.bottom50)}%. Wealth is shared much less evenly than income.`}
        supporters={[
          "Wealth is far more concentrated than income, and is taxed lightly compared with work. More tax on property, inheritance, gains or large fortunes could raise money and narrow the gap.",
          "Large inherited wealth gives some people a head start that has nothing to do with effort.",
        ]}
        critics={[
          "Wealth taxes are hard to design and collect, and some wealthy people and assets can move abroad. It may be better to reform the existing taxes on property, gains and inheritance than to add a new one.",
          "Much of what households own is their home and their pension, which they have saved for out of taxed income, and taxing it more can penalise saving.",
        ]}
        link={[SOURCES.wealthTables, SOURCES.deaton]}
      />

      <Argument
        id="h-debate-pay" title="Pay, minimum wages and pay gaps"
        shows="The gender pay gap for full-time employees is 6.9% and is much larger for people over 40. The gap between disabled and non-disabled employees is 12.7%."
        supporters={[
          "A higher minimum wage, and stronger rules on pay reporting and flexible work, raise the pay of the lowest paid and narrow gaps between groups.",
          "Pay gaps show that opportunities are still not equal, and publishing them has pushed employers to look at their own pay.",
        ]}
        critics={[
          "A higher minimum wage can reduce jobs or hours, especially in small firms and for young people, and the people who lose out can be the ones it is meant to help.",
          "Raw pay gaps mix many things, including the jobs and hours people choose, so they say little by themselves about discrimination. It matters what lies behind them.",
        ]}
        link={[SOURCES.genderPay, SOURCES.disabilityPay]}
      />

      <Argument
        id="h-debate-places" title="Differences between places"
        shows={`Income per head in ${top.name} is ${(top.value / bottom.value).toFixed(1)} times that in the ${bottom.name}, and the gap between the best-off and worst-off regions has grown since 1997.`}
        supporters={[
          "Public money should be used to spread opportunity: transport, skills, and investment in towns and cities outside London and the South East, so that where you were born matters less.",
          "Strong growth in more places makes the whole country richer and relieves pressure on housing and services in the most crowded ones.",
        ]}
        critics={[
          "Businesses and skilled people cluster in the biggest cities because that is where they are most productive, and attempts to steer growth to other places have a mixed record.",
          "It may be better to help people, with education and with moves to where jobs are, than to try to change where growth happens.",
        ]}
        link={[SOURCES.gdhi]}
      />

      <Panel id="h-debate-more" title="Where to look for more">
        <p style={{ ...para, marginTop: 0 }}>The IFS Deaton Review (ifs.org.uk/inequality), the Resolution Foundation, the Joseph Rowntree Foundation and the House of Commons Library all publish detailed work on this, from different starting points. The Taxes page shows how tax rates have changed over time and who changed them.</p>
        <Caution title="About this section">The summaries above are short, and each side would say more. They are meant to help you recognise the arguments, not to settle them.</Caution>
      </Panel>
    </div>
  );
}

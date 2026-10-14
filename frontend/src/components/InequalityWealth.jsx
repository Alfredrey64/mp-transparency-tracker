import { BarRows, Caution, Legend, Panel, Stats, SubTitle } from "./insight";
import { D, wealthFacts } from "../lib/inequality";
import { SOURCES, WEALTH_HEADLINES } from "../data/inequality";
import { money, para, strong } from "../lib/insightStyle";

const ACCENT = "#C0561F";
const POOR = "#0E9AA7";

const shortPeriod = (p) => p.replace(/July (\d{4}) to June (\d{4})/, "$1 to $2").replace(/April (\d{4}) to March (\d{4})/, "$1 to $2");

export default function InequalityWealth() {
  const w = wealthFacts();
  const wd = D.wealth;
  const i = wd.periods.length - 1;
  const deciles = wd.latestDeciles;
  const names = ["Poorest tenth", "2nd", "3rd", "4th", "5th", "6th", "7th", "8th", "9th", "Richest tenth"];
  const regions = [...wd.regions].filter((r) => r.name !== "All England Regions" && r.name !== "Great Britain").sort((a, b) => b.median - a.median);
  const types = [...wd.householdTypes].filter((t) => t.name !== "All households").sort((a, b) => b.median - a.median);
  const topRegion = regions[0];
  const bottomRegion = regions.at(-1);
  // Shares of total wealth over the periods since 2012, each as a short row, so the two ways of measuring pensions are not drawn as one line.
  const timeRows = wd.periods.map((p, k) => ({ p: shortPeriod(p), top: wd.shares.top10[k], bottom: wd.shares.bottom50[k] }));
  const gini = wd.ginis;
  return (
    <div>
      <Panel
        id="h-wealth-main" accent={ACCENT} title="Who owns what"
        lead="Wealth is everything a household owns, less what it owes: its home, savings, pensions and belongings. It is built up over a lifetime, and it is shared far less evenly than income."
        sources={[SOURCES.wealthBulletin, SOURCES.wealthTables]}
      >
        <Stats
          accent={ACCENT}
          items={[
            { value: money(WEALTH_HEADLINES.median), label: "Wealth of the typical household", note: `Great Britain, ${wd.periods[i]}` },
            { value: `${Math.round(w.top10)}%`, label: "Of all wealth held by the richest tenth of households", note: `They have at least ${money(WEALTH_HEADLINES.topTenthFrom)}` },
            { value: `${Math.round(w.bottom50)}%`, label: "Of all wealth held by the poorest half of households", note: `The poorest tenth have ${money(WEALTH_HEADLINES.bottomTenthUpTo)} or less` },
            { value: `${WEALTH_HEADLINES.topOnePercentShare}%`, label: "Held by the richest 1% of households alone", note: `The same as the poorest half together. They have at least ${money(WEALTH_HEADLINES.topOnePercentFrom)}` },
          ]}
        />
      </Panel>

      <Panel
        id="h-wealth-tenths" title="Share of all wealth, by tenth of households"
        lead="Households lined up from least to most wealthy and cut into ten equal groups. Each bar is the share of all the wealth in Great Britain that group owns."
        sources={[SOURCES.wealthTables]}
      >
        <BarRows
          label="Share of all wealth by tenth of households" accent={ACCENT} max={50}
          rows={names.map((name, k) => ({ label: name, value: deciles[k], text: `${deciles[k]}%`, tone: k === 9 ? ACCENT : undefined }))}
        />
        <p style={para}>If wealth were shared equally, each bar would be 10%. The richest tenth own {Math.round(w.top10)}%, and the poorest half together own {Math.round(w.bottom50)}%.</p>
      </Panel>

      <Panel
        id="h-wealth-time" title="Has it changed?"
        lead="The share held by the richest tenth and by the poorest half, in each period the survey covers."
        sources={[SOURCES.wealthTables]}
      >
        <Legend items={[{ name: "Richest tenth", colour: ACCENT }, { name: "Poorest half", colour: POOR }]} />
        <div role="table" aria-label="Share of all wealth over time" style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", minWidth: 360, borderCollapse: "collapse", fontSize: 13.5 }}>
            <thead><tr style={{ textAlign: "left" }}><th scope="col" style={{ padding: "6px 0" }}>Period</th><th scope="col" style={{ padding: "6px 8px" }}>Richest tenth</th><th scope="col" style={{ padding: "6px 8px" }}>Poorest half</th></tr></thead>
            <tbody>
              {timeRows.map((r) => (
                <tr key={r.p} style={{ borderTop: "1px solid var(--c-hairline)" }}>
                  <th scope="row" style={{ textAlign: "left", fontWeight: 500, padding: "7px 0" }}>{r.p}</th>
                  <td style={{ padding: "7px 8px" }}>{r.top}%</td>
                  <td style={{ padding: "7px 8px" }}>{r.bottom}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p style={para}>The share of the richest tenth was between {Math.min(...wd.shares.top10.slice(0, -1))}% and {Math.max(...wd.shares.top10.slice(0, -1))}% from 2006 to 2020, and is {w.top10}% in the latest period.</p>
        <Caution title="Not a like-for-like fall">The latest period uses a new way of counting private pensions, so it cannot be compared directly with the earlier ones. The fall from {w.previous.top10}% to {w.top10}% for the richest tenth may be partly down to that change.</Caution>
      </Panel>

      <Panel
        id="h-wealth-what" title="What wealth is made of"
        lead="Share of all household wealth in Great Britain, April 2020 to March 2022."
        sources={[SOURCES.wealthTables]}
      >
        <BarRows
          label="What household wealth is made of" accent={ACCENT} max={50}
          rows={[
            { label: "Homes, after mortgages", value: w.components["Property Wealth (net)"], text: `${w.components["Property Wealth (net)"]}%`, note: `Gini ${gini["Property Wealth (net)"][i]}` },
            { label: "Private pensions", value: w.components["Private Pension Wealth"], text: `${w.components["Private Pension Wealth"]}%`, note: `Gini ${gini["Private Pension Wealth"][i]}` },
            { label: "Savings and investments, after debts", value: w.components["Financial Wealth (net)"], text: `${w.components["Financial Wealth (net)"]}%`, note: `Gini ${gini["Financial Wealth (net)"][i]}` },
            { label: "Cars, furniture and other possessions", value: w.components["Physical Wealth"], text: `${w.components["Physical Wealth"]}%`, note: `Gini ${gini["Physical Wealth"][i]}` },
          ]}
        />
        <p style={para}>Savings and investments are the least evenly shared kind of wealth (a Gini of {gini["Financial Wealth (net)"][i]}), and cars and possessions the most evenly shared ({gini["Physical Wealth"][i]}). For most households their home and pension are most of what they own. The Gini is on a 0 to 1 scale here.</p>
      </Panel>

      <Panel
        id="h-wealth-place" title="Typical wealth by region and nation"
        lead={`The typical household in the ${topRegion.name} has ${(topRegion.median / bottomRegion.median).toFixed(1)} times the wealth of the typical household in the ${bottomRegion.name}.`}
        sources={[SOURCES.wealthTables]}
      >
        <BarRows
          label="Typical household wealth by region" accent={ACCENT}
          rows={regions.map((r) => ({ label: r.name, value: r.median, text: money(r.median) }))}
        />
        <Caution>The ONS says its estimates for London are especially uncertain.</Caution>
      </Panel>

      <Panel
        id="h-wealth-who" title="Typical wealth by kind of household"
        lead="The age of a household and whether it has children matter a great deal. Typical wealth rises with age and generally falls after State Pension age."
        sources={[SOURCES.wealthTables, SOURCES.wealthBulletin]}
      >
        <BarRows
          label="Typical wealth by kind of household" accent={ACCENT}
          rows={types.map((t) => ({ label: t.name.replace("SPA", "State Pension age").replace("Couple 1 over/1 under", "Couple, one over and one under"), value: t.median, text: money(t.median) }))}
        />
        <p style={para}>
          By age of the head of the household, the typical wealth is <strong style={strong}>{money(WEALTH_HEADLINES.medianAge[0].value)}</strong> at 16 to 24 and <strong style={strong}>{money(WEALTH_HEADLINES.medianAge[1].value)}</strong> at 65 to 74. Much of the gap between older and younger households is a matter of time: people save, pay off mortgages and build pensions as they age.
        </p>
        <SubTitle>Limits of these figures</SubTitle>
        <Caution title="Quality">The ONS has suspended the accredited status of the Wealth and Assets Survey for this round, because of concerns about the quality of the data. Surveys of this kind can miss the very wealthiest households. The figures cover Great Britain, not Northern Ireland.</Caution>
      </Panel>
    </div>
  );
}

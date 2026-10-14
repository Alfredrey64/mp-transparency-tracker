import { BarRows, Caution, Panel, RangeRows, Stats } from "./insight";
import { FOOD_PRICES, GDP_ESTIMATES, NBER_EFFECTS, OBR, SOURCES } from "../data/brexit";
import { para, strong } from "../lib/insightStyle";

const ACCENT = "#1D4ED8";
const li = { margin: "0 0 8px", paddingLeft: 2 };

const phrase = (e) => (e.high <= 0 ? `${Math.abs(e.high)}% to ${Math.abs(e.low)}% smaller` : `${e.low}% to ${e.high}% bigger`);

export default function BrexitEconomy() {
  const rows = GDP_ESTIMATES.map((e) => ({ label: e.label, low: e.low, high: e.high, text: phrase(e), note: `${e.who}. ${e.kind}. ${e.note}.` }));
  return (
    <div>
      <Panel
        id="h-bxe-gdp" accent={ACCENT} title="How big is the effect on the economy?"
        lead="Estimates of the size of the UK economy compared with how big it would have been if the UK had stayed in the EU. A bar to the left of the line is a loss and a bar to the right is a gain."
        sources={[SOURCES.ukiceTenYears, SOURCES.nber, SOURCES.cepMinford]}
      >
        <RangeRows label="Estimates of the effect of Brexit on the size of the economy" rows={rows} />
        <p style={para}>
          The first two rows are estimates of what has already happened, and they point the same way, with different sizes. The third is a model of what could happen if the UK removed tariffs on food and manufactures by itself, which it has not done, and it is not a measurement. It is the free-trade case for Brexit made by Economists for Free Trade, and other economists have criticised its assumptions.
        </p>
        <Caution title="Why the estimates differ">They compare the UK with a version that never left. Some build that version from similar countries, some use firm surveys, and some use models of trade. Covid and the energy price rise hit all of them, so each has to decide how much of what happened to attribute to Brexit.</Caution>
      </Panel>

      <Panel
        id="h-bxe-obr" title="What the official forecasters assume"
        lead="The Office for Budget Responsibility (OBR) has to decide how to treat Brexit in the forecasts the government uses. These are its assumptions, not measurements."
        sources={[SOURCES.obr]}
      >
        <Stats
          accent={ACCENT}
          items={[
            { value: `${OBR.productivity}% lower`, label: "Long-run productivity", note: "Output per worker in the long run, compared with staying in the EU, mainly from higher barriers to trade" },
            { value: `${OBR.trade}% lower`, label: "Exports and imports in the long run", note: "Compared with staying in the EU. It expects the effect on exports and imports to be similar" },
            { value: OBR.alreadyHappened, label: "Of the productivity effect had already happened", note: "By the time the trade deal began, through uncertainty holding back investment" },
          ]}
        />
        <p style={para}>The most recent check on its trade assumption that the OBR's page cites is from {OBR.lastTradeCheck}, when it said the assumption "{OBR.lastTradeVerdict}". The page says the assumptions will be updated as arrangements change and new data comes in.</p>
      </Panel>

      <Panel
        id="h-bxe-inv" title="Investment, jobs and productivity"
        lead="A 2025 study that combined official figures with surveys of firms for the Bank of England found these effects by the end of 2025, compared with the UK staying in the EU."
        sources={[SOURCES.nber]}
      >
        <BarRows
          label="Estimated effect of Brexit by the end of 2025, percent lower" accent="#D6455D" max={16}
          rows={NBER_EFFECTS.map((e) => ({ label: e.label, value: e.high, text: `${e.low}% to ${e.high}% lower` }))}
        />
        <p style={para}>The authors say the weaker figures come from uncertainty, weaker demand, management time spent on Brexit, and firms and workers being in the wrong places after a long exit. They found that forecasts made at the time were fairly accurate in the short and medium term but underestimated the total over ten years.</p>
        <Caution title="Disputed">The Institute of Economic Affairs has criticised this kind of study, arguing that Brexit uncertainty cut investment for a time but that it has since recovered. The figures here are one team's estimates, and others differ.</Caution>
      </Panel>

      <Panel
        id="h-bxe-other" title="The other side on the economy"
        lead="The case that Brexit has not harmed trade, and the case for its economic benefits, come mainly from the Institute of Economic Affairs and Economists for Free Trade. These are their arguments, not settled facts."
        sources={[SOURCES.iea, SOURCES.cepMinford]}
      >
        <ul style={{ ...para, margin: 0, paddingLeft: 20 }}>
          <li style={li}>An Institute of Economic Affairs paper from 2023 argued that trade data from 2019 to 2022 do not show the harm the OBR assumes: UK goods exports to the EU rose 13.5% in cash terms over that period, and the UK's trade as a share of the economy (69%) is not unusual among the G7. It also argued that a 15% fall in total trade would need a fall of almost 36% in trade with the EU, because the EU is 42% of UK trade.</li>
          <li style={li}>The same paper accepted that costs are real, especially for small firms, from rules of origin and customs paperwork, and that clothing exports to the EU halved. It said the UK's wider trade problems come from domestic policy more than from Brexit.</li>
          <li style={li}>Supporters point to freedom to set tariffs, to sign trade deals and to set rules. In their model, free-trade policies could lift the economy by 4% to 8%. The Centre for Economic Performance argued that the gain from lower tariffs would be about 0.3 percentage points, far less than the cost of new trade barriers.</li>
        </ul>
        <p style={para}>That 2023 paper looks at data up to 2022, before several later studies.</p>
      </Panel>

      <Panel
        id="h-bxe-food" title="Prices in the shops"
        lead={`One study of food prices, from ${FOOD_PRICES.period}, estimated how much of the rise was down to Brexit.`}
        sources={[SOURCES.foodPrices]}
      >
        <p style={{ ...para, marginTop: 0 }}>
          It found that UK food prices rose by almost <strong style={strong}>{FOOD_PRICES.riseWithBrexit} percentage points</strong> over the period, and estimated they would have risen by about eight points less without Brexit, which it put at roughly <strong style={strong}>£{FOOD_PRICES.perHousehold} for each household</strong>. It also found that foods more exposed to new trade barriers rose in price by more than others. It is one study of one part of the economy, from 2023.
        </p>
      </Panel>
    </div>
  );
}

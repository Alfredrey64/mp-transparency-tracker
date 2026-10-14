import { useRef, useState } from "react";
import { PAGE_PADDING } from "../theme";
import { PageHeader } from "./shared";
import { IconEuStars } from "./icons";
import { PageToggles } from "./insight";
import BrexitOverview from "./BrexitOverview";
import BrexitEconomy from "./BrexitEconomy";
import BrexitTrade from "./BrexitTrade";
import BrexitSociety from "./BrexitSociety";
import BrexitPolitics from "./BrexitPolitics";
import BrexitArguments from "./BrexitArguments";
import BrexitAbout from "./BrexitAbout";

// Brexit ten years on: the economy, trade, people and politics, what experts say and where they disagree, and the case for and against.
// One page with a row of toggles; the address carries the toggle (/brexit/economy).

const TABS = [
  { key: "overview", label: "Overview", blurb: "The main figures and dates, how to read them, and where experts agree and disagree.", colour: "#1D4ED8" },
  { key: "economy", label: "The economy", blurb: "How much smaller experts think the economy is, what the official forecasters assume, and the other side of the argument.", colour: "#0E9AA7" },
  { key: "trade", label: "Trade", blurb: "Who the UK trades with, what the trade deal changed, and what the new trade deals add.", colour: "#C0561F" },
  { key: "society", label: "People and society", blurb: "The vote, how people feel now, migration, study and research, and travel.", colour: "#7A5AF0" },
  { key: "politics", label: "Politics and law", blurb: "Whose rules, fishing, Northern Ireland, and where the relationship could go next.", colour: "#C7871A" },
  { key: "arguments", label: "The arguments", blurb: "The case for and against, topic by topic, with how firm the evidence is.", colour: "#D6455D" },
  { key: "about", label: "Sources", blurb: "Where every figure comes from and the limits of the figures.", colour: "#6B7280" },
];

const KEYS = new Set(TABS.map((t) => t.key));
const parse = (param) => { const first = String(param ?? "").split("/")[0]; return KEYS.has(first) ? first : "overview"; };

export default function Brexit({ param }) {
  const [tab, setTab] = useState(() => parse(param));
  const [seen, setSeen] = useState(param);
  const ref = useRef(null);
  if (param !== seen) { setSeen(param); setTab(parse(param)); }
  function go(next) {
    const moved = next !== tab;
    setTab(next);
    window.history.replaceState(null, "", next === "overview" ? "#/brexit" : `#/brexit/${next}`);
    if (moved && ref.current && ref.current.getBoundingClientRect().top < 0) ref.current.scrollIntoView({ block: "start" });
  }
  return (
    <div style={{ maxWidth: 1100, margin: "0 auto", padding: PAGE_PADDING }}>
      <PageHeader
        icon={IconEuStars}
        kicker="Britain in numbers"
        title="Brexit"
        subtitle="Ten years after the vote: what experts say it has done to the economy, trade, people and politics, where they disagree, and the case for and against."
      />
      <div ref={ref} style={{ scrollMarginTop: 12 }}>
        <PageToggles tabs={TABS} current={tab} onPick={go} label="What to look at" idPrefix="bx" />
      </div>
      <div key={tab} className="ge-fade" role="tabpanel" id="bx-panel" aria-labelledby={`bx-tab-${tab}`}>
        {tab === "overview" && <BrexitOverview onPick={go} />}
        {tab === "economy" && <BrexitEconomy />}
        {tab === "trade" && <BrexitTrade />}
        {tab === "society" && <BrexitSociety />}
        {tab === "politics" && <BrexitPolitics />}
        {tab === "arguments" && <BrexitArguments />}
        {tab === "about" && <BrexitAbout />}
      </div>
    </div>
  );
}

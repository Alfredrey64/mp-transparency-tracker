import { useRef, useState } from "react";
import { PAGE_PADDING } from "../theme";
import { PageHeader } from "./shared";
import { IconScales } from "./icons";
import { PageToggles } from "./insight";
import InequalityOverview from "./InequalityOverview";
import InequalityIncome from "./InequalityIncome";
import InequalityWealth from "./InequalityWealth";
import InequalityPoverty from "./InequalityPoverty";
import InequalityPlace from "./InequalityPlace";
import InequalityAbroad from "./InequalityAbroad";
import InequalityGroups from "./InequalityGroups";
import InequalityDebate from "./InequalityDebate";
import InequalityAbout from "./InequalityAbout";

// Economic inequality in the UK: how unevenly income and wealth are shared, who is in poverty, and how it differs by place and by group, with the
// main arguments about what to do. One page with a row of toggles; the address carries the toggle (/inequality/wealth).

const TABS = [
  { key: "overview", label: "Overview", blurb: "The main figures in one place, and how to read them.", colour: "#7A5AF0" },
  { key: "income", label: "Income", blurb: "How unequal incomes are, what tax and benefits do, and who gains and loses by age and housing.", colour: "#0E9AA7" },
  { key: "wealth", label: "Wealth", blurb: "What households own, how unevenly, and how it differs by age, region and kind of household.", colour: "#C0561F" },
  { key: "poverty", label: "Poverty", blurb: "How many people, children and pensioners are in poverty, and how that has changed since 1994.", colour: "#D6455D" },
  { key: "place", label: "Place", blurb: "Where in the country poverty, income and wealth fall: a map of the regions, local areas, and every English seat.", colour: "#0E7490" },
  { key: "abroad", label: "Other countries", blurb: "How the UK's inequality compares with other rich countries, before and after tax and benefits.", colour: "#4F46E5" },
  { key: "groups", label: "Groups", blurb: "Pay gaps for women and disabled people, and lasting low income by ethnic group.", colour: "#1FA97C" },
  { key: "debate", label: "The debate", blurb: "The main arguments about what, if anything, should be done, set out fairly.", colour: "#C7871A" },
  { key: "about", label: "Sources", blurb: "Where every figure comes from, and the limits of the figures.", colour: "#6B7280" },
];

const KEYS = new Set(TABS.map((t) => t.key));
const parse = (param) => { const first = String(param ?? "").split("/")[0]; return KEYS.has(first) ? first : "overview"; };

export default function Inequality({ param }) {
  const [tab, setTab] = useState(() => parse(param));
  const [seen, setSeen] = useState(param);
  const ref = useRef(null);
  if (param !== seen) { setSeen(param); setTab(parse(param)); }
  function go(next) {
    const moved = next !== tab;
    setTab(next);
    window.history.replaceState(null, "", next === "overview" ? "#/inequality" : `#/inequality/${next}`);
    if (moved && ref.current && ref.current.getBoundingClientRect().top < 0) ref.current.scrollIntoView({ block: "start" });
  }
  return (
    <div style={{ maxWidth: 1100, margin: "0 auto", padding: PAGE_PADDING }}>
      <PageHeader
        icon={IconScales}
        kicker="Britain in numbers"
        title="Inequality"
        subtitle="How unevenly income and wealth are shared in the UK, who is in poverty, how it differs by place and by group, and what people argue should be done."
      />
      <div ref={ref} style={{ scrollMarginTop: 12 }}>
        <PageToggles tabs={TABS} current={tab} onPick={go} label="What to look at" idPrefix="ineq" />
      </div>
      <div key={tab} className="ge-fade" role="tabpanel" id="ineq-panel" aria-labelledby={`ineq-tab-${tab}`}>
        {tab === "overview" && <InequalityOverview onPick={go} />}
        {tab === "income" && <InequalityIncome />}
        {tab === "wealth" && <InequalityWealth />}
        {tab === "poverty" && <InequalityPoverty />}
        {tab === "place" && <InequalityPlace onPick={go} />}
        {tab === "abroad" && <InequalityAbroad onPick={go} />}
        {tab === "groups" && <InequalityGroups />}
        {tab === "debate" && <InequalityDebate />}
        {tab === "about" && <InequalityAbout />}
      </div>
    </div>
  );
}

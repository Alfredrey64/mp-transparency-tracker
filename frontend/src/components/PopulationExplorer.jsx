import { useEffect, useMemo, useState } from "react";
import RegionalExplorer from "./RegionalExplorer";
import { REGIONS } from "../data/regionMetrics";
import { loadSector } from "../lib/onsData";

// "Who lives where" on the Population page: the census breakdowns (regionalProfile.json, see fetch-regional-profile.js)
// and pay (the Regions page's own series, which cover all four nations).

const PAY_GROUPS = [
  ["pay", "Typical pay (the middle)"],
  ["pay-low", "Lower earners (the 10th percentile)"],
  ["pay-high", "Higher earners (the 90th percentile)"],
];

export default function PopulationExplorer({ accent }) {
  const [profile, setProfile] = useState(null);
  const [pay, setPay] = useState(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let alive = true;
    Promise.all([import("../data/regionalProfile.json"), loadSector("regions")])
      .then(([p, regions]) => { if (alive) { setProfile(p.default); setPay(regions); } })
      .catch(() => alive && setFailed(true));
    return () => { alive = false; };
  }, []);

  const categories = useMemo(() => {
    if (!profile) return null;
    const list = profile.categories.map((c) => ({ ...c, kind: "share", format: "pct", whole: "England and Wales", source: "Census 2021, with Scotland's Census 2022 (ONS and NISRA, via Nomis; Scotland: National Records of Scotland)" }));
    if (pay) {
      const latest = (id) => pay.series[id]?.points.at(-1)?.[1] ?? null;
      const year = pay.series["pay-uk"]?.points.at(-1)?.[0]?.slice(0, 4);
      list.push({
        id: "earnings", title: "Pay", kind: "value", format: "gbp", whole: "the UK", source: "Annual Survey of Hours and Earnings (ONS, via Nomis)", period: `April ${year}`,
        blurb: "What employees living in each place are paid before tax, for a full year. Typical pay is the figure that half of people earn more than. Lower earners are at the 10th percentile: nine in ten earn more. Higher earners are at the 90th: only one in ten earn more.",
        groups: PAY_GROUPS.map(([prefix, label]) => ({ id: prefix, label, values: Object.fromEntries(REGIONS.map((r) => [r.key, latest(`${prefix}-${r.key}`)])), all: latest(`${prefix}-uk`) })),
      });
    }
    return list;
  }, [profile, pay]);

  return (
    <RegionalExplorer
      id="who-lives-where" title="Who lives where" accent={accent} categories={categories} failed={failed}
      intro="Pick a kind of fact about people, then a group, to see how it varies from place to place. Most of this is from the 2021 Census (Scotland held its census in 2022). The four nations ran separate censuses with different questions, so a place is greyed out where its figure is not published on matching terms: for example, Scotland and Northern Ireland have no figure for type of work."
    />
  );
}

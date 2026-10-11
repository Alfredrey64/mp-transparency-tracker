import { useEffect, useState } from "react";
import RegionalExplorer from "./RegionalExplorer";

// The "by place" map on a Britain in numbers page, drawn from regionalBreakdowns.json (see fetch-regional-breakdowns.js).
// Loaded when the page opens, as its own file, so the pages that have no map never download it.

const TEXT = {
  jobs: {
    id: "who-works-where", title: "Who works where",
    intro: "Pick a kind of fact about work, then a group, to see how it varies across the UK: who has a job, who is looking for one, what kinds of job people do, what they are paid, and how far women's pay trails men's. Figures for small groups in some places are too uncertain to publish and are left blank.",
  },
  housing: {
    id: "housing-by-place", title: "Homes by type and place",
    intro: "Pick what to compare: prices by type of home or of buyer, how fast they are changing, and how many years of pay a home costs. The same type of home can cost four or five times as much in one place as in another.",
  },
  crime: {
    id: "crime-by-place", title: "Crime by place",
    intro: "Pick a type of crime to see how often the police recorded it in each region, for every 1,000 people, or how that has changed in a year. Scotland and Northern Ireland have their own police and their own figures, so they are greyed out.",
  },
};


export default function SectorExplorer({ sector, accent }) {
  const [data, setData] = useState(null);
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    let alive = true;
    import("../data/regionalBreakdowns.json").then((m) => alive && setData(m.default)).catch(() => alive && setFailed(true));
    return () => { alive = false; };
  }, []);
  const text = TEXT[sector];
  const categories = data?.sectors?.[sector]?.categories;
  if (!text || failed || (data && !categories?.length)) return null;
  return <RegionalExplorer id={text.id} title={text.title} intro={text.intro} accent={accent} categories={categories ?? null} />;
}

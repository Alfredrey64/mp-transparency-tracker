/** @jsxImportSource react */
import { Card } from "./AreaSections";
import { Dumbbell, PeopleGrid, PeopleKey, StatTile, TrendArea } from "./AreaViz";
import { IconHeartbeat, IconPin, IconHouse, IconCoin } from "./icons";
import { IconBin, IconKeyHome } from "./newIcons";
import { useDataFile } from "../lib/useDataFile";
import { localHealth, asylumSupport, homelessness, housingSupply, childPoverty, privateRents, wasteRecycling } from "../lib/dataFiles";
import { healthView, asylumView, asylumHeld, homelessView, housingView, povertyView, quarterLabel, rentView, wasteView } from "../lib/areaMoreViews";
import { Skyline, Spread } from "./HomesViz";
import "../arealocal.css";

// The newer cards of the In numbers view, each read from a file the weekly data job rebuilds when the publisher issues a new edition (see scripts/refresh-area-data.mjs):
// how healthy people are (OHID Fingertips), asylum support (Home Office), homelessness (Ministry of Housing, Communities and Local Government) and children in low-income families (DWP).
// A council or seat a file has no figure for says so; a figure is never filled in.

const n = (v) => Number(v ?? 0).toLocaleString("en-GB");
const councilName = (name) => { const m = /^(.+), (City|County) of$/.exec(name ?? ""); return m ? `the ${m[2]} of ${m[1]}` : name ?? "your council area"; };
const pct = (v) => `${Number(v).toFixed(1)}%`;
const SAYS_LOADING = (what) => <p className="ma-sub">Loading {what}...</p>;
const SAYS_FAILED = (what) => <p className="ma-sub">The {what} did not load. Try again in a moment.</p>;

// ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
// Life expectancy and three habits that affect health, for the council area, against England.
export function LocalHealthCard({ r, i }) {
  const { data, failed } = useDataFile(localHealth);
  const code = r.codes?.admin_district;
  if (r.latitude == null) return null;
  const council = councilName(r.admin_district);
  const v = data && code ? healthView(data, code, r.codes?.admin_county) : null;
  const e = v?.england ?? {};
  const habit = (key, label, eng) => {
    const h = v?.[key];
    if (!h) return null;
    const [value, lo, hi] = h.value;
    return { key, label, value, lo, hi, eng };
  };
  const habits = v ? [habit("smoke", "Adults who smoke", e.smoke?.[0]), habit("over", "Adults overweight or obese", e.over?.[0]), habit("inactive", "Adults who are physically inactive", e.inactive?.[0])].filter(Boolean) : [];
  return (
    <Card i={i} colour="#2F8F6B" icon={<IconHeartbeat size={20} />} title={`How healthy people are in ${council}`} className="ma-wellbeing">
      {failed ? SAYS_FAILED("health figures") : !data ? SAYS_LOADING("health figures") : !v ? <p className="ma-sub">Health figures are not held for this council area, usually because its boundaries have changed. The full set is at <a href="https://fingertips.phe.org.uk/" target="_blank" rel="noreferrer">fingertips.phe.org.uk</a>.</p> : (
        <>
          {v.life && (
            <>
              <h4>Life expectancy at birth ({v.periods.le})</h4>
              <Dumbbell colour="#2F8F6B" unit="years" aria={`Life expectancy at birth in ${v.life.area} against England`} rows={[
                { label: "Men", value: v.life.value[0], vs: e.le?.[0], refLabel: "England" },
                { label: "Women", value: v.life.value[1], vs: e.le?.[1], refLabel: "England" },
              ]} />
              {v.lifeBefore && v.lifeBefore[0] != null && <p className="ma-sub">Ten years earlier ({v.periods.leBefore}) it was {v.lifeBefore[0].toFixed(1)} years for men and {v.lifeBefore[1].toFixed(1)} for women.</p>}
            </>
          )}
          {v.healthy && (
            <>
              <h4>Years lived in good health ({v.periods.hle})</h4>
              <Dumbbell colour="#2F8F6B" unit="years" aria={`Healthy life expectancy in ${v.healthy.area} against England`} rows={[
                { label: "Men", value: v.healthy.value[0], vs: e.hle?.[0], refLabel: "England" },
                { label: "Women", value: v.healthy.value[1], vs: e.hle?.[1], refLabel: "England" },
              ]} />
              {v.healthy.fromCounty && <p className="ma-sub">This is the figure for {v.healthy.area}, because it is published for counties and unitary authorities, not districts.</p>}
            </>
          )}
          {habits.length > 0 && (
            <>
              <h4>Habits that affect health: out of every 100 adults</h4>
              <div className="av-peoplerow" role="group" aria-label={`Share of adults in ${council} by habit`}>
                {habits.map((h) => <PeopleGrid key={h.key} colour="#2F8F6B" value={h.value} compare={h.eng} label={h.label} caption={`England ${pct(h.eng)}. 95% range ${pct(h.lo)} to ${pct(h.hi)}`} />)}
              </div>
              <PeopleKey above="More than England" below="Fewer than England" same="Up to the England figure" />
              <p className="ma-sub">These three come from surveys, so a small area's figure carries a wide margin of error and small differences between places are not meaningful. Smoking is for {v.periods.smoke} and adults aged 18 and over; overweight and inactivity are for {v.periods.over} (overweight is adults aged 18 and over, with height and weight self-reported and adjusted; inactive is adults aged 19 and over). The people are rounded to whole numbers; the exact share is under each.</p>
            </>
          )}
          <p className="ma-sub">Life expectancy is how long a baby born now would live if today's death rates stayed the same all their life, so it describes the area, not any one person. Source: Office for Health Improvement and Disparities (Fingertips), from Office for National Statistics, Sport England and survey data.</p>
          <a className="ma-link" href="https://fingertips.phe.org.uk/" target="_blank" rel="noreferrer">Every health measure for your area on Fingertips</a>
        </>
      )}
    </Card>
  );
}

// ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
// People supported by the Home Office while their asylum claim is decided, in the council area, quarter by quarter.
export function AsylumCard({ r, i }) {
  const { data, failed } = useDataFile(asylumSupport);
  const code = r.codes?.admin_district;
  if (r.latitude == null) return null;
  const council = councilName(r.admin_district);
  const v = data && code ? asylumView(data, code) : null;
  const top = v ? Math.max(...v.kinds.map((k) => k.count), 1) : 1;
  return (
    <Card i={i} colour="#C0478A" icon={<IconPin size={20} />} title={`Asylum support in ${council}`} className="ma-asylum">
      {failed ? SAYS_FAILED("Home Office figures") : !data ? SAYS_LOADING("Home Office figures") : !asylumHeld(data) ? SAYS_FAILED("Home Office figures") : !v ? (
        <p className="ma-sub">The Home Office's table lists no one in {council} receiving asylum support in any of the last {data.quarters.length} quarters (to {data.asAt}). The table lists only councils where someone was supported.</p>
      ) : (
        <>
          <p>On {v.asAt}, <strong>{n(v.housed)}</strong> {v.housed === 1 ? "person was" : "people were"} living in Home Office asylum accommodation in {council}{v.hotels > 0 && <>, <strong>{n(v.hotels)}</strong> of them in hotels</>}. {v.subsistence > 0 && <>A further {n(v.subsistence)} received cash support only. </>}Across the whole UK, {n(v.ukHoused)} people were in this accommodation.</p>
          {v.kinds.length > 0 && (
            <ul className="ma-domains ma-asylum-rows" aria-label={`People in asylum accommodation in ${council} by kind, ${v.asAt}`}>
              {v.kinds.map((k) => <li key={k.key}><span>{k.label}</span><i aria-hidden="true"><b style={{ "--w": Math.max(0.02, k.count / top) }} /></i><em>{n(k.count)}</em></li>)}
            </ul>
          )}
          <h4>People in accommodation, quarter by quarter</h4>
          <TrendArea colour="#C0478A" points={v.t.map((c, k) => ({ label: quarterLabel(v.quarters[k]), value: c }))} format={n} aria={`People in asylum accommodation in ${council}, by quarter: ${v.t.map((c, k) => `${quarterLabel(v.quarters[k])} ${n(c)}`).join(", ")}`} />
          <p className="ma-sub">These are people (applicants and their dependants) in receipt of support on the last day of each quarter, not everyone supported during it. Unaccompanied asylum-seeking children, who are looked after by councils, are not included. The chart counts people in Home Office accommodation only, because the Home Office has no council-level figures for cash-only support from December 2023 to December 2024. Before March 2023, everyone on one kind of support (section 4) is counted under dispersal housing, even where some were in hotels. Councils differ greatly in size, so compare with care. Source: Home Office, Immigration System Statistics (table Asy_D11), quarterly.</p>
          <a className="ma-link" href="https://www.gov.uk/government/statistical-data-sets/immigration-system-statistics-data-tables" target="_blank" rel="noreferrer">Immigration statistics on GOV.UK</a>
        </>
      )}
    </Card>
  );
}

// ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
// Households owed help because they are homeless or about to be, and households in temporary accommodation (England only).
export function HomelessnessCard({ r, i }) {
  const { data, failed } = useDataFile(homelessness);
  const code = r.codes?.admin_district;
  if (r.latitude == null) return null;
  const council = councilName(r.admin_district);
  if (r.country && r.country !== "England") {
    return (
      <Card i={i} colour="#E8741A" icon={<IconHouse size={20} />} title="Homelessness in your area" className="ma-homeless">
        <p className="ma-sub">These statistics cover England. Scotland, Wales and Northern Ireland publish their own homelessness figures, counted in different ways, so they are not shown here.</p>
      </Card>
    );
  }
  const v = data && code ? homelessView(data, code) : null;
  const eng = v?.england;
  return (
    <Card i={i} colour="#E8741A" icon={<IconHouse size={20} />} title={`Homelessness in ${council}`} className="ma-homeless">
      {failed ? SAYS_FAILED("homelessness figures") : !data ? SAYS_LOADING("homelessness figures") : !v ? <p className="ma-sub">Homelessness figures are not held for this council area. In two-tier areas the housing authority is the district council, so a county's figures are not in this table.</p> : !v.reported ? (
        <p className="ma-sub">{council} did not send the Government its homelessness return for {v.quarter}, so there are no figures to show for it. In England as a whole, {n(eng.owed)} households were owed help in that quarter and {n(eng.ta)} were in temporary accommodation on {v.asAt}.</p>
      ) : (
        <>
          <div className="av-stats" role="group" aria-label={`Homelessness in ${council}, ${v.quarter}`}>
            {v.owed != null && <StatTile colour="#E8741A" value={v.owed} label="households owed help" hint={`In ${v.quarter}: homeless or about to be, so the council had to act.`} {...(v.owedK != null ? { chip: `${v.owedK.toFixed(1)} per 1,000 (England ${eng.owedK.toFixed(1)})`, tone: v.owedK > eng.owedK ? "warn" : "good" } : {})} />}
            {v.ta != null && <StatTile colour="#E8741A" value={v.ta} label="in temporary accommodation" hint={`On ${v.asAt}, arranged by the council.`} {...(v.perK != null ? { chip: `${v.perK.toFixed(1)} per 1,000 (England ${eng.perK.toFixed(1)})`, tone: v.perK > eng.perK ? "warn" : "good" } : {})} />}
            {v.kids != null && v.ta != null && <StatTile colour="#E8741A" value={v.children} label="children in them" hint={`${n(v.kids)} households with children${v.bnb > 0 ? `; ${n(v.bnb)} in bed and breakfast hotels` : ""}.`} />}
          </div>
          <p className="ma-sub">"Owed help" means the council accepted a duty to try to prevent or relieve a household's homelessness during the quarter; it counts households, not people, and a household that comes back later is counted again. Temporary accommodation is a snapshot on the last day of the quarter. Councils that place households in other areas are counted for the households they are responsible for, wherever those are housed. {v.reported && (v.owed == null || v.ta == null) && "Part of this council's return is missing, so only some figures are shown. "}Source: Ministry of Housing, Communities and Local Government, Statutory homelessness detailed local authority tables, quarterly.</p>
          <a className="ma-link" href="https://www.gov.uk/government/statistical-data-sets/live-tables-on-homelessness" target="_blank" rel="noreferrer">Homelessness tables on GOV.UK</a>
        </>
      )}
    </Card>
  );
}

// ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
// Net new homes by year for the council area, and where it stands among England's councils (England only).
export function NewHomesCard({ r, i }) {
  const { data, failed } = useDataFile(housingSupply);
  const code = r.codes?.admin_district;
  if (r.latitude == null) return null;
  const council = councilName(r.admin_district);
  if (r.country && r.country !== "England") {
    return (
      <Card i={i} colour="#B4532A" icon={<IconHouse size={20} />} title="New homes in your area" className="ma-newhomes">
        <p className="ma-sub">These statistics cover England. Scotland, Wales and Northern Ireland count new homes in their own ways, so they are not shown here.</p>
      </Card>
    );
  }
  const v = data && code ? housingView(data, code) : null;
  const eng = data?.england;
  return (
    <Card i={i} colour="#B4532A" icon={<IconHouse size={20} />} title={`New homes in ${council}`} className="ma-newhomes">
      {failed ? SAYS_FAILED("housing figures") : !data ? SAYS_LOADING("housing figures") : !v ? <p className="ma-sub">No housing supply figures are held for this council area. They are published for each district, county councils are not counted, and a few councils have merged or changed their boundaries recently.</p> : v.latest == null ? (
        <p className="ma-sub">{council} did not send the Government its figure for {v.latestYear}, so there is nothing to show for the latest year. Across England, {n(eng.y.at(-1))} net new homes were added that year.</p>
      ) : (
        <>
          <div className="av-stats" role="group" aria-label={`New homes in ${council}, ${v.latestYear}`}>
            <StatTile colour="#B4532A" value={Math.abs(v.latest)} prefix={v.latest < 0 ? "\u2212" : ""} label={`net new homes in ${v.latestYear}`} hint={`Homes built or created, minus homes lost. Provisional. England: ${v.englandRate.toFixed(1)} per 1,000 homes.`} chip={v.rate != null ? `${v.rate.toFixed(1)} per 1,000 homes` : undefined} />
            {v.five != null && <StatTile colour="#B4532A" value={Math.abs(v.five)} prefix={v.five < 0 ? "\u2212" : ""} label={`in the five years ${v.fiveYears}`} hint={`${v.fiveRate.toFixed(1)} for every 1,000 homes, against ${v.englandFiveRate.toFixed(1)} across England.`} />}
            {v.rank != null && <StatTile colour="#B4532A" value={v.rank} prefix="#" label={`of ${v.of} councils for homes added per 1,000`} hint={v.rank <= v.of / 4 ? "In the top quarter of councils." : v.rank > (v.of * 3) / 4 ? "In the bottom quarter of councils." : "In the middle half of councils."} />}
          </div>
          <h4 className="hv-sub">Net new homes each year</h4>
          <Skyline years={v.years} values={v.y} colour="#B4532A" aria={`Net new homes in ${council} by year: ${v.years.map((y, k) => `${y} ${v.y[k] == null ? "no figure" : v.y[k]}`).join(", ")}`} />
          {v.rate != null && (
            <>
              <h4 className="hv-sub">Where {council} sits among England's councils, {v.latestYear}</h4>
              <p className="hv-explain">Councils are very different sizes, so they are compared on homes added for every 1,000 homes they already had. Each bar below is a group of councils with a similar figure: the further right, the more new homes a council added compared with the number of homes already there.</p>
              <Spread rates={v.rates} rate={v.rate} england={v.englandRate} name={council.replace(/^the /, "")} colour="#B4532A" />
            </>
          )}
          <p className="ma-sub">"Net additional dwellings" is homes built, converted or created by a change of use, minus homes demolished or merged: a council can have a negative year. The figure counts homes of any kind, houses and flats alike, and says nothing about how affordable they are or who they are for. "Per 1,000 homes" divides by the {n(v.dwellings)} homes there were on 31 March {v.stockYear}, so councils of different sizes can be compared. Years run April to March, so "{v.latestYear}" is the twelve months to March 20{v.latestYear.slice(5)}; the latest year is provisional and can be revised in later editions. A blank year means the tables have no figure for that council area that year, for example because it did not yet exist in its present form. Sources: Ministry of Housing, Communities and Local Government, Live Table 122 (net additional dwellings) and Live Table 100 (dwelling stock).</p>
          <a className="ma-link" href="https://www.gov.uk/government/statistical-data-sets/live-tables-on-net-supply-of-housing" target="_blank" rel="noreferrer">Housing supply tables on GOV.UK</a>
        </>
      )}
    </Card>
  );
}

// ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
// Children living in families on a low income after housing costs, for the council area and the constituency, against the UK.
export function ChildPovertyCard({ r, i }) {
  const { data, failed } = useDataFile(childPoverty);
  const code = r.codes?.admin_district;
  const seat = r.codes?.parliamentary_constituency_2024 ?? r.codes?.parliamentary_constituency;
  if (r.latitude == null) return null;
  const council = councilName(r.admin_district);
  const la = data && code ? povertyView(data, code, "la") : null;
  const con = data && seat ? povertyView(data, seat, "con") : null;
  const rows = [la && { key: "la", label: la.name.replace(/ \[note \d+\]/g, ""), v: la }, con && { key: "con", label: con.name, v: con }].filter(Boolean);
  const year = (rows[0]?.v ?? la ?? con)?.year;
  const words = (x) => (x.difference === 0 ? "the same as" : x.difference > 0 ? `${Math.abs(x.difference).toFixed(1)} points above` : `${Math.abs(x.difference).toFixed(1)} points below`);
  return (
    <Card i={i} colour="#7A5AF0" icon={<IconCoin size={20} />} title={`Children in low-income families near ${council}`} className="ma-poverty">
      {failed ? SAYS_FAILED("child poverty figures") : !data ? SAYS_LOADING("child poverty figures") : rows.length === 0 ? <p className="ma-sub">Child poverty figures are not held for this area.</p> : (
        <>
          {la && <p>In {council}, <strong>{pct(la.percent)}</strong> of children under 16 ({n(la.children)} children) were living in families on a low income after housing costs in the year ending March {la.year}, {words(la)} the UK figure of {pct(la.uk)}. A year earlier it was {pct(la.before)}.</p>}
          {con && <p>In {con.name}, your parliamentary constituency, it was <strong>{pct(con.percent)}</strong> ({n(con.children)} children), {words(con)} the UK figure.{con.before != null && <> A year earlier it was {pct(con.before)}.</>}</p>}
          <h4>Out of every 100 children under 16</h4>
          <div className="av-peoplerow" role="group" aria-label={`Share of children in low-income families, year ending March ${year}`}>
            {rows.map((x) => <PeopleGrid key={x.key} colour="#7A5AF0" value={x.v.percent} compare={x.v.uk} label={x.label} caption={`${n(x.v.children)} children. UK ${pct(x.v.uk)}`} />)}
            <PeopleGrid colour="#7A5AF0" value={rows[0].v.uk} label="United Kingdom" caption="The comparison" />
          </div>
          <PeopleKey above="More than the UK" below="Fewer than the UK" same="Up to the UK figure" />
          <p className="ma-sub">A family is counted as low income if its income is below 60% of the middle household income of that year, after rent or mortgage and similar housing costs. The year ending March {year} means April {year - 1} to March {year}. The Department for Work and Pensions marks these figures as provisional, so they may be revised, and shares are worked out from the latest population estimates, which may not reflect recent changes in a small area. Source: DWP, Children in low income families: local area statistics, published each March.</p>
          <a className="ma-link" href="https://www.gov.uk/government/collections/children-in-low-income-families-local-area-statistics" target="_blank" rel="noreferrer">Child poverty statistics on GOV.UK</a>
        </>
      )}
    </Card>
  );
}

// ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
// What a month of private rent costs in the council area, the same month of each earlier year, and how it compares with the region and the nation. Office for National Statistics.
const MONTH_NAMES = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const monthYear = (iso) => { const [y, m] = String(iso).split("-"); return `${MONTH_NAMES[Number(m) - 1]} ${y}`; };
const monthOnly = (iso) => MONTH_NAMES[Number(String(iso).split("-")[1]) - 1];
const gbp = (v) => `\u00A3${Number(v).toLocaleString("en-GB")}`;
const moved = (c) => (c == null ? null : c === 0 ? "unchanged" : `${c > 0 ? "up" : "down"} ${Math.abs(c).toFixed(1)}%`);

export function PrivateRentsCard({ r, i }) {
  const { data, failed } = useDataFile(privateRents);
  const code = r.codes?.admin_district;
  if (r.latitude == null) return null;
  const council = councilName(r.admin_district);
  const scotNI = r.country === "Scotland" || r.country === "Northern Ireland";
  const v = data && code ? rentView(data, code) : null;
  const topBeds = v ? Math.max(...v.beds.flatMap((b) => [b.rent, b.nation ?? 0]), 1) : 1;
  return (
    <Card i={i} colour="#2D7DD2" icon={<IconKeyHome size={20} />} title={`Private rents in ${council}`} className="ma-rents">
      {scotNI ? <p className="ma-sub">The Office for National Statistics publishes private rents for councils in England and Wales. {r.country} is covered only by wider rental market areas, which do not line up with councils, so they are not shown here.</p>
        : failed ? SAYS_FAILED("rent figures") : !data ? SAYS_LOADING("rent figures") : !v ? <p className="ma-sub">Rent figures are not held for this council area, usually because its boundaries have changed. The full set is on the <a href="https://www.ons.gov.uk/economy/inflationandpriceindices/datasets/priceindexofprivaterentsukmonthlypricestatistics" target="_blank" rel="noreferrer">ONS website</a>.</p> : (
        <>
          <div className="av-stats" role="group" aria-label={`Private rents in ${council}, ${monthYear(v.month)}`}>
            <StatTile colour="#2D7DD2" value={v.rent} prefix={"\u00A3"} label={`average rent a month, ${monthYear(v.month)}`} hint={v.nation ? `${v.nation.name}: ${gbp(v.nation.rent)} a month.` : undefined}
              chip={v.annual != null ? `${moved(v.annual)} on the year` : undefined} tone={v.annual == null ? undefined : v.annual > 0 ? "up" : v.annual < 0 ? "down" : "same"} />
            {v.region && <StatTile colour="#2D7DD2" value={v.region.rent} prefix={"\u00A3"} label={`average in the ${v.region.name} region`} hint={v.rent === v.region.rent ? "The same as this council." : `${gbp(Math.abs(v.rent - v.region.rent))} ${v.rent > v.region.rent ? "more" : "less"} a month here.`} />}
            <StatTile colour="#2D7DD2" value={v.rank} prefix="#" label={`of ${v.of} councils for rent (1 is the highest)`} hint={v.rank <= v.of / 4 ? "Among the dearest quarter of councils." : v.rank > (v.of * 3) / 4 ? "Among the cheapest quarter of councils." : "In the middle half of councils."} />
          </div>
          {v.series.length > 1 && (
            <>
              <h4>Average rent each {monthOnly(v.month)}</h4>
              <TrendArea colour="#2D7DD2" labelEvery={1} points={v.series.filter((p) => (v.series.at(-1).year - p.year) % 2 === 0).map((p) => ({ label: String(p.year), value: p.rent }))} format={(x) => gbp(Math.round(x))} aria={`Average monthly private rent in ${council} every other ${monthOnly(v.month)}: ${v.series.filter((p) => (v.series.at(-1).year - p.year) % 2 === 0).map((p) => `${p.year} ${gbp(p.rent)}`).join(", ")}`} />
              {v.since && v.since.change != null && <p className="ma-sub">That is {moved(v.since.change)} since {monthOnly(v.month)} {v.since.year}{v.since.nation != null && v.nation ? `; across ${v.nation.name} rents are ${moved(v.since.nation)} over the same period` : ""}. These are cash amounts, with no allowance for inflation.</p>}
            </>
          )}
          {v.beds.length > 0 && (
            <>
              <h4>By size of home</h4>
              <ul className="ma-domains ma-price-kinds ma-rent-beds" aria-label={`Average monthly rent by number of bedrooms in ${council}`}>
                {v.beds.map((b) => <li key={b.label}><span>{b.label}{b.nation != null && <small className="ma-rent-vs">{v.nation.name} {gbp(b.nation)}</small>}</span><i aria-hidden="true"><b style={{ "--w": Math.max(0.02, b.rent / topBeds) }} /></i><em>{gbp(b.rent)}</em></li>)}
              </ul>
            </>
          )}
          {v.annual != null && v.riseRank != null && <p className="ma-sub">Over the last year rents here rose {v.annual.toFixed(1)}%, the {v.riseRank <= v.riseOf / 4 ? "steepest quarter of" : v.riseRank > (v.riseOf * 3) / 4 ? "gentlest quarter of" : "middle half of"} councils (#{v.riseRank} of {v.riseOf}, where 1 is the biggest rise).</p>}
          <p className="ma-sub">This is the average monthly rent actually being paid on privately rented homes in the council area, existing tenancies as well as new lets, as measured by the Office for National Statistics' Price Index of Private Rents. It is not what a home is advertised at today, which is usually higher, and an average cannot tell you what one street or one home costs. The latest month is a first estimate and can be revised. Rents are rounded to the nearest pound. Figures cover councils in England and Wales; rents in social housing are not included. Source: Office for National Statistics, open government licence.</p>
          <a className="ma-link" href="https://www.ons.gov.uk/economy/inflationandpriceindices/datasets/priceindexofprivaterentsukmonthlypricestatistics" target="_blank" rel="noreferrer">Private rents data on the ONS website</a>
        </>
      )}
    </Card>
  );
}

// ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
// How much of the household waste the council collects is reused, recycled or composted, and how much is left over per household, against England. Defra.
export function WasteCard({ r, i }) {
  const { data, failed } = useDataFile(wasteRecycling);
  const code = r.codes?.admin_district;
  if (r.latitude == null) return null;
  const council = councilName(r.admin_district);
  if (r.country && r.country !== "England") {
    return (
      <Card i={i} colour="#2F8F6B" icon={<IconBin size={20} />} title="Waste and recycling" className="ma-waste">
        <p className="ma-sub">These statistics come from Defra and cover councils in England. {r.country} measures recycling in its own way, so it is not shown here.</p>
      </Card>
    );
  }
  const v = data && code ? wasteView(data, code) : null;
  const eng = v?.england;
  const diff = v && eng?.rate != null ? Math.round((v.rate - eng.rate) * 10) / 10 : null;
  const change = v && v.before != null ? Math.round((v.rate - v.before) * 10) / 10 : null;
  const waste = v ? v.series.filter((_, k) => (v.series.length - 1 - k) % 2 === 0) : [];
  return (
    <Card i={i} colour="#2F8F6B" icon={<IconBin size={20} />} title={`Waste and recycling in ${council}`} className="ma-waste">
      {failed ? SAYS_FAILED("waste figures") : !data ? SAYS_LOADING("waste figures") : !v ? <p className="ma-sub">Waste figures are not held for this council area, usually because its boundaries have changed or it reports jointly with neighbours. The full tables are on <a href="https://www.gov.uk/government/statistics/local-authority-collected-waste-management-annual-results" target="_blank" rel="noreferrer">GOV.UK</a>.</p> : (
        <>
          <div className="av-stats" role="group" aria-label={`Household waste in ${council}, ${v.year}`}>
            <StatTile colour="#2F8F6B" value={v.rate} decimals={1} suffix="%" label={`of household waste recycled, composted or reused, ${v.year}`} hint={eng?.rate != null ? `England: ${eng.rate}%.` : undefined}
              chip={diff == null ? undefined : diff === 0 ? "same as England" : `${Math.abs(diff).toFixed(1)} points ${diff > 0 ? "above" : "below"} England`} tone={diff == null ? undefined : diff > 0 ? "up" : diff < 0 ? "down" : "same"} />
            {v.residual != null && <StatTile colour="#2F8F6B" value={v.residual} suffix=" kg" label="of household waste not recycled, per household" hint={eng?.residual != null ? `England: ${eng.residual} kg. Less is better.` : "Less is better."} />}
            <StatTile colour="#2F8F6B" value={v.rank} prefix="#" label={`of ${v.of} councils for recycling rate`} hint={v.rank <= v.of / 4 ? "In the top quarter of councils." : v.rank > (v.of * 3) / 4 ? "In the bottom quarter of councils." : "In the middle half of councils."} />
          </div>
          <p>{council} {v.type === "Unitary" ? "collects and arranges the disposal of" : "collects"} household waste. In {v.year} <strong>{v.rate}%</strong> of it was sent for reuse, recycling or composting{change != null ? `, ${change === 0 ? "the same as" : `${Math.abs(change)} points ${change > 0 ? "up on" : "down on"}`} ${v.beforeYear}` : ""}.{v.perPerson != null && eng?.perPerson != null ? ` Each person's household waste came to ${v.perPerson} kg, against ${eng.perPerson} kg across England.` : ""}</p>
          {v.series.length > 1 && (
            <>
              <h4>Share of household waste recycled, every other year</h4>
              <TrendArea colour="#2F8F6B" labelEvery={1} points={waste.map((p) => ({ label: `${p.year.slice(2, 4)}/${p.year.slice(5)}`, value: p.rate }))} format={(x) => `${Math.round(x)}%`} aria={`Share of household waste recycled in ${council}, every other year to ${v.year}: ${waste.map((p) => `${p.year} ${p.rate}%`).join(", ")}`} />
            </>
          )}
          <p className="ma-sub">The recycling rate is the share, by weight, of household waste that was reused, recycled or composted. It depends on what a council collects (garden waste is heavy and lifts the rate), on how many homes have gardens, and on how much waste households produce, so it is not a mark for how well a council is run. "Not recycled" waste is what goes in the general waste bin plus what is left at recycling centres and cannot be recycled. Years run April to March; the latest year can be revised. Councils that report jointly with neighbours show the same figures as them. District councils collect the waste, and the county council usually disposes of it. Source: Defra, Local authority collected waste management, open government licence. For fly-tipping see the roads and fly-tipping card in Your council.</p>
          <a className="ma-link" href="https://www.gov.uk/government/statistics/local-authority-collected-waste-management-annual-results" target="_blank" rel="noreferrer">Waste statistics on GOV.UK</a>
        </>
      )}
    </Card>
  );
}

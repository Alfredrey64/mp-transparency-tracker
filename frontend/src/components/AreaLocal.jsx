/** @jsxImportSource react */
import { useEffect, useMemo, useState } from "react";
import { Card } from "./AreaSections";
import { TrendArea, StackBar, RatingColumns, Ring } from "./AreaViz";
import { IconShield } from "./icons";
import { IconFlood } from "./newIcons";
import { PlaceCard, Pill, TrustCard, School, GradeKey } from "./story/NearYouParts";
import { Batches } from "./Unfold";
import PlaceTools, { NoMatch } from "./story/PlaceTools";
import { browse, byMiles, byName, countLine } from "../lib/placeBrowser";
import { useDataFile } from "../lib/useDataFile";
import { bathingWater, rttWaits, aeNearYou, healthMeta, councilServices, localEconomy, roadCasualties, housePrices } from "../lib/dataFiles";
import { seatRecord, claimantRow, payRow, monthShort } from "../lib/localEconomyView";
import { IconEconomy, IconBasket, IconTransport, IconHouse } from "./icons";
import { roadRows, flyTippingRow, roadYear } from "../lib/councilServices";
import { IconCouncil } from "./icons";
import { loadTiles } from "../lib/localTiles";
import { nearestTrusts, schoolsWithin } from "../lib/nearYou";
import { GROUPS, placesWithin, placeView, waitView } from "../lib/healthNear";
import { IconHeartbeat, IconPin } from "./icons";
import { loadOverflows, nearestBathing, RATING_TEXT, RATING_TONE } from "../lib/waterNear";
import { loadStreetCrime, loadCrimeTrend, monthName } from "../lib/streetCrime";
import { loadFoodHygiene, FHRS_WORDS } from "../lib/foodHygiene";
import { loadFloods, SEVERITY } from "../lib/floodLive";
import { roadView } from "../lib/roadSafety";
import { priceView, monthLabel, monthOnly, pounds } from "../lib/housePriceView";
import "../arealocal.css";

// The cards of the In numbers view that look themselves up from the postcode's position: street-level crime (police.uk, live). Each takes the postcode result `r` and
// leaves itself out, or says why, where its figures do not cover the place. Nothing here sends the postcode anywhere: police.uk is asked only for a latitude and longitude.

const pointOf = (r) => (r.latitude != null && r.longitude != null ? { lat: r.latitude, lon: r.longitude } : null);
const n = (v) => Number(v ?? 0).toLocaleString("en-GB");
// postcodes.io writes "Bristol, City of" and "Herefordshire, County of"; people say "the City of Bristol".
const councilName = (name) => { const m = /^(.+), (City|County) of$/.exec(name ?? ""); return m ? `the ${m[2]} of ${m[1]}` : name ?? "your council area"; };

// Runs a lookup for a point and keeps its answer: undefined while it loads, null if it failed.
function useLookup(point, run, again = 0) {
  const [value, setValue] = useState(undefined);
  const lat = point?.lat;
  const lon = point?.lon;
  useEffect(() => {
    if (lat == null) return undefined;
    let alive = true;
    setValue(undefined); // eslint-disable-line react-hooks/set-state-in-effect -- a new postcode starts a new lookup
    run({ lat, lon }).then((v) => alive && setValue(v)).catch(() => alive && setValue(null));
    return () => { alive = false; };
  }, [lat, lon, again]); // eslint-disable-line react-hooks/exhaustive-deps -- `run` is a fixed function of the point
  return value;
}

const CRIME_COLOURS = ["#D9453B", "#E8741A", "#C9A227", "#2F8F6B", "#2C7DA0", "#7A5AF0", "#C0478A", "#5B6784"];
export function StreetCrimeCard({ r, i }) {
  const point = pointOf(r);
  const scotland = r.country === "Scotland";
  const [attempt, setAttempt] = useState(0);
  const crime = useLookup(scotland ? null : point, (p) => loadStreetCrime(p), attempt);
  const [trend, setTrend] = useState(null);
  const lat = point?.lat;
  const lon = point?.lon;
  const month = crime?.latest;
  const total = crime?.total;
  // The earlier months are a nice extra: they are asked for after the main figures are showing, and quietly left out if they do not come.
  useEffect(() => {
    if (!month || lat == null) return undefined;
    let alive = true;
    setTrend(null); // eslint-disable-line react-hooks/set-state-in-effect -- a new month starts a new trend
    loadCrimeTrend({ lat, lon }, month, 6, fetch, { ym: month, total }).then((t) => alive && setTrend(t)).catch(() => {});
    return () => { alive = false; };
  }, [month, total, lat, lon]);
  if (!point) return null;
  if (scotland) {
    return (
      <Card i={i} colour="#D9453B" icon={<IconShield size={20} />} title="Crime near your postcode" className="ma-streetcrime">
        <p className="ma-sub">The police.uk street-level figures cover England, Wales and Northern Ireland. Police Scotland publishes its own figures, by area, at <a href="https://www.scotland.police.uk/about-us/how-we-do-it/crime-data/" target="_blank" rel="noreferrer">scotland.police.uk</a>.</p>
      </Card>
    );
  }
  const top = crime ? Math.max(...crime.categories.map((c) => c.count), 1) : 1;
  const peak = trend ? Math.max(...trend.map((m) => m.total), 1) : 1;
  return (
    <Card i={i} colour="#D9453B" icon={<IconShield size={20} />} title="Crime near your postcode" className="ma-streetcrime">
      {crime === undefined ? <p className="ma-sub">Loading recorded crime near you...</p> : crime === null ? <p className="ma-sub">The police.uk figures did not load. Their service is sometimes slow. <button type="button" className="ma-retry" onClick={() => setAttempt((a) => a + 1)}>Try again</button> or see <a href="https://www.police.uk/" target="_blank" rel="noreferrer">police.uk</a>.</p> : (
        <>
          <p><strong>{n(crime.total)}</strong> crimes were recorded within about a mile of your postcode in {monthName(crime.latest)}.{crime.behind && " The newest month police.uk has published was slow to arrive, so this is the latest one that did."}</p>
          <StackBar aria={`Share of crimes recorded near you in ${monthName(crime.latest)}, by kind`} parts={(() => { const head = crime.categories.slice(0, 7); const rest = crime.categories.slice(7).reduce((t, c) => t + c.count, 0); return [...head.map((c, k) => ({ label: c.name, value: c.count, colour: CRIME_COLOURS[k] })), ...(rest ? [{ label: "All other kinds", value: rest, colour: CRIME_COLOURS[7] }] : [])]; })()} />
          <ul className="ma-domains" aria-label={`Kinds of crime recorded near you in ${monthName(crime.latest)}`}>
            {crime.categories.map((c) => (
              <li key={c.slug}><span>{c.name}</span><i aria-hidden="true"><b style={{ "--w": Math.max(0.02, c.count / top) }} /></i><em>{n(c.count)}</em></li>
            ))}
          </ul>
          {trend && trend.length > 1 && (
            <>
              <h4>Month by month</h4>
              <ol className="ma-months" aria-label="Crimes recorded near you, month by month">
                {trend.map((m) => <li key={m.ym}><i aria-hidden="true" style={{ "--h": m.total / peak }} /><b>{n(m.total)}</b><small>{monthName(m.ym).slice(0, 3)}</small></li>)}
              </ol>
            </>
          )}
          {crime.streets.length > 0 && <p className="ma-sub">Most recorded in {monthName(crime.latest)}: {crime.streets.map((s) => `${s.name} (${s.count})`).join(", ")}.</p>}
          <p className="ma-sub">Police record each crime against the nearest street or public place, so a busy shopping street or station often tops the list. More recorded crime can mean more reporting as well as more crime, and anti-social behaviour is included. This is not a measure of how safe a street is. Source: police.uk, published about two months behind.</p>
          <a className="ma-link" href="https://www.police.uk/pu/your-area/" target="_blank" rel="noreferrer">See your local force and neighbourhood team on police.uk</a>
        </>
      )}
    </Card>
  );
}

const OVERFLOW_PAGE = 5;
const OVERFLOW_SORTS = {
  near: { label: "Nearest first", words: "nearest first", compare: byMiles },
  spills: { label: "Most discharges first", words: "most discharges first", compare: (a, b) => b.spills - a.spills || byMiles(a, b) },
  hours: { label: "Longest discharging first", words: "longest discharging first", compare: (a, b) => (b.hours ?? 0) - (a.hours ?? 0) || byMiles(a, b) },
  name: { label: "Name, A to Z", words: "by name", compare: byName },
};

// The overflows that discharged in the year, nearest first, which can be searched by name, river or water company and sorted by discharges or hours.
function OverflowList({ water }) {
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState("near");
  const [shown, setShown] = useState(OVERFLOW_PAGE);
  const spilled = useMemo(() => water.list.filter((o) => o.spills > 0), [water.list]);
  const list = useMemo(() => browse(spilled, { query, textOf: (o) => [o.name, o.water, o.company], compare: OVERFLOW_SORTS[sort].compare }), [spilled, query, sort]);
  const sorts = Object.entries(OVERFLOW_SORTS).map(([key, v]) => ({ key, label: v.label }));
  return (
    <>
      <h4>Overflows that discharged in {water.year}</h4>
      <PlaceTools label="Search and sort the sewage overflows" query={query} sort={sort} sorts={sorts} onQuery={(v) => { setQuery(v); setShown(OVERFLOW_PAGE); }} onSort={(v) => { setSort(v); setShown(OVERFLOW_PAGE); }}
        line={countLine({ shown: Math.min(shown, list.length), total: list.length, noun: { one: "overflow", many: "overflows" }, query, order: OVERFLOW_SORTS[sort].words })} />
      {list.length === 0 ? <NoMatch what="overflows" onClear={() => { setQuery(""); setShown(OVERFLOW_PAGE); }} /> : (
        <Batches items={list} shown={shown} page={OVERFLOW_PAGE} className="sc-list-flat" render={(o) => (
          <PlaceCard key={o.id} name={o.name} miles={o.miles} tone="#2C7DA0" tags={[o.company, o.water, o.bathing && `Affects ${o.bathing}`].filter(Boolean)}
            rows={[{ label: `Spills in ${water.year}`, big: n(o.spills), text: `discharges, lasting ${n(o.hours ?? 0)} hours in all.` }]} />
        )} />
      )}
      {list.length > shown && <button type="button" className="plt-more" onClick={() => setShown(shown + OVERFLOW_PAGE)}>Show {Math.min(OVERFLOW_PAGE, list.length - shown)} more ({list.length - shown} left)</button>}
    </>
  );
}

// Sewage overflows within three miles: how many there are, how many spilled in the year, and the busiest. Asked live from the Environment Agency's public map service.
export function SewageCard({ r, i }) {
  const point = pointOf(r);
  const england = !r.country || r.country === "England";
  const water = useLookup(england ? point : null, (p) => loadOverflows(p, 3));
  if (!point) return null;
  if (!england) {
    return (
      <Card i={i} colour="#2C7DA0" icon={<IconFlood size={20} />} title="Sewage overflows near your postcode" className="ma-water">
        <p className="ma-sub">These are the Environment Agency's figures for England. Sewage overflows in {r.country ?? "your nation"} are reported by {r.country === "Wales" ? "Natural Resources Wales" : r.country === "Scotland" ? "Scottish Water and SEPA" : "the Northern Ireland Environment Agency"}.</p>
      </Card>
    );
  }
  const s = water?.summary;
  return (
    <Card i={i} colour="#2C7DA0" icon={<IconFlood size={20} />} title="Sewage overflows near your postcode" className="ma-water">
      {water === undefined ? <p className="ma-sub">Finding sewage overflows near you...</p> : water === null ? <p className="ma-sub">The Environment Agency's figures did not load. Try again in a moment.</p> : s.count === 0 ? <p className="ma-sub">No storm overflows are recorded within {water.radius} miles of your postcode.</p> : (
        <>
          <p>Within {water.radius} miles there {s.count === 1 ? "is" : "are"} <strong>{n(s.count)}</strong> storm overflow{s.count === 1 ? "" : "s"}. In {water.year}, <strong>{n(s.spilled)}</strong> of the {n(s.withData)} with usable monitoring discharged at least once, <strong>{n(s.spills)}</strong> times in all, for <strong>{n(s.hours)}</strong> hours.</p>
          {water.list.some((o) => o.spills > 0) && <OverflowList key={`${point.lat},${point.lon}`} water={water} />}
          <p className="ma-sub">Shown: the overflows within {water.radius} miles that discharged at least once in {water.year}, nearest first unless you sort them another way. A storm overflow is meant to release diluted sewage in heavy rain to stop it backing up into homes; the number of times it does so is the figure the Environment Agency collects.{s.poorlyMonitored > 0 ? ` ${s.poorlyMonitored} of these monitors worked for less than 90% of the year, so their counts may be too low.` : ""}{water.truncated ? " Only the first 1,000 overflows were returned." : ""} Source: Environment Agency, event duration monitoring annual returns for {water.year}, as reported by the water companies.</p>
          <a className="ma-link" href="https://www.gov.uk/government/publications/storm-overflows-policy-and-guidance" target="_blank" rel="noreferrer">What storm overflows are, and the rules on them</a>
        </>
      )}
    </Card>
  );
}

// The three nearest bathing waters with the classification the Environment Agency gave them at the end of the last season.
export function BathingCard({ r, i }) {
  const point = pointOf(r);
  const england = !r.country || r.country === "England";
  const { data, failed } = useDataFile(bathingWater);
  if (!point || !england) return null;
  const near = data ? nearestBathing(data.sites, point, 3, 30) : [];
  return (
    <Card i={i} colour="#1B7FA8" icon={<IconFlood size={20} />} title="Bathing water near your postcode" className="ma-water">
      {failed ? <p className="ma-sub">The bathing water figures did not load. Try again in a moment.</p> : !data ? <p className="ma-sub">Finding bathing waters near you...</p> : near.length === 0 ? <p className="ma-sub">No designated beach or inland bathing water is listed within 30 miles of your postcode.</p> : (
        <>
          <ul className="sc-list-flat">
            {near.map((s) => (
              <PlaceCard key={s.id} name={s.name} miles={s.miles} tone={RATING_TONE[s.rating] ?? "#8DA2C0"}
                tags={[s.district, s.company && `Sewage company: ${s.company}`].filter(Boolean)}
                rows={[{ label: `Rating${s.year ? `, ${s.year}` : ""}`, small: "Environment Agency", pill: s.rating ? { tone: RATING_TONE[s.rating], label: s.rating } : null, text: s.rating ? RATING_TEXT[s.rating] : "Not yet classified, usually because it was designated recently." }]} />
            ))}
          </ul>
          <p className="ma-sub">Each designated bathing water is sampled through the season, May to September, and rated Excellent, Good, Sufficient or Poor from four seasons of results. Distances are in a straight line. Source: Environment Agency bathing water data, classifications for {data.year}.</p>
          <a className="ma-link" href="https://environment.data.gov.uk/bwq/profiles/" target="_blank" rel="noreferrer">Daily pollution risk forecasts for every beach</a>
        </>
      )}
    </Card>
  );
}

// How far to look for each kind of service.
const HEALTH_RADIUS = { GP: 3, HO: 10, CH: 3, other: 6 };
const HEALTH_PAGE = 3;
const CQC_RANK = { O: 4, G: 3, R: 2, I: 1 };
const HEALTH_SORTS = {
  near: { label: "Nearest first", words: "nearest first", compare: byMiles },
  best: { label: "Best rated first", words: "best rated first", compare: (a, b) => (CQC_RANK[b.o] ?? 0) - (CQC_RANK[a.o] ?? 0) || byMiles(a, b) },
  worst: { label: "Lowest rated first", words: "lowest rated first", compare: (a, b) => (CQC_RANK[a.o] ?? 9) - (CQC_RANK[b.o] ?? 9) || byMiles(a, b) },
  name: { label: "Name, A to Z", words: "by name", compare: byName },
};

// The Care Quality Commission's rating for the GP surgeries, hospitals, care homes and other services near the postcode, with the five key questions in a drop-down.
export function HealthServicesCard({ r, i }) {
  const point = pointOf(r);
  const england = !r.country || r.country === "England";
  const records = useLookup(england ? point : null, (p) => loadTiles("health", p, 10));
  const { data: meta } = useDataFile(healthMeta);
  const [kind, setKind] = useState("GP");
  const [shown, setShown] = useState(HEALTH_PAGE);
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState("near");
  if (!point) return null;
  if (!england) {
    return (
      <Card i={i} colour="#2F8F6B" icon={<IconHeartbeat size={20} />} title="Health services near your postcode" className="ma-health">
        <p className="ma-sub">The Care Quality Commission rates services in England only. Health services in {r.country ?? "your nation"} are inspected by {r.country === "Wales" ? "Healthcare Inspectorate Wales and Care Inspectorate Wales" : r.country === "Scotland" ? "Healthcare Improvement Scotland and the Care Inspectorate" : "the Regulation and Quality Improvement Authority"}.</p>
      </Card>
    );
  }
  const group = GROUPS.find((g) => g.key === kind);
  const lists = records ? GROUPS.map((g) => ({ ...g, list: placesWithin(records, point, HEALTH_RADIUS[g.key], g.types) })) : [];
  const current = lists.find((g) => g.key === kind);
  const view = current ? browse(current.list.map((p) => ({ ...p, name: p.n })), { query, textOf: (p) => [p.n, placeView(p).type], compare: HEALTH_SORTS[sort].compare }) : [];
  return (
    <Card i={i} colour="#2F8F6B" icon={<IconHeartbeat size={20} />} title="Health services near your postcode" className="ma-health">
      {records === undefined ? <p className="ma-sub">Finding health services near you...</p> : records === null ? <p className="ma-sub">The Care Quality Commission's ratings did not load. Try again in a moment.</p> : (
        <>
          <div className="ac-tools" role="group" aria-label="Kind of health service">
            {lists.map((g) => <button key={g.key} type="button" aria-pressed={kind === g.key} onClick={() => { setKind(g.key); setShown(HEALTH_PAGE); setQuery(""); }}>{g.label} ({g.list.length})</button>)}
          </div>
          {current.list.length > 0 && (
            <PlaceTools label={`Search and sort the ${group.label.toLowerCase()}`} query={query} sort={sort} sorts={Object.entries(HEALTH_SORTS).map(([key, v]) => ({ key, label: v.label }))}
              onQuery={(v) => { setQuery(v); setShown(HEALTH_PAGE); }} onSort={(v) => { setSort(v); setShown(HEALTH_PAGE); }}
              line={countLine({ shown: Math.min(shown, view.length), total: view.length, noun: { one: "place", many: "places" }, query, order: HEALTH_SORTS[sort].words })} />
          )}
          {current.list.length === 0 ? <p className="ma-sub">No rated {group.label.toLowerCase()} are listed within {HEALTH_RADIUS[kind]} miles of your postcode.</p> : view.length === 0 ? <NoMatch what={group.label.toLowerCase()} onClear={() => { setQuery(""); setShown(HEALTH_PAGE); }} /> : (
            <ul className="sc-list-flat">
              {view.slice(0, shown).map((place) => {
                const v = placeView(place);
                return (
                  <PlaceCard key={place.i} name={place.n} href={v.url} miles={place.miles} tone={v.overall.tone}
                    tags={[v.type, v.age && { text: `Report ${v.age}`, alert: v.old }].filter(Boolean)}
                    rows={[{ label: "Overall rating", small: "Care Quality Commission", pill: { tone: v.overall.tone, label: v.overall.name }, text: v.old ? "This rating is three years old or more, so the service may have changed since." : undefined }]}>
                    <details className="sc-areas">
                      <summary>See the five questions the CQC asks</summary>
                      <ol>
                        {v.questions.map((q) => <li key={q.question}><div className="sc-area-head"><b>{q.question}</b><Pill tone={q.tone}>{q.rating}</Pill></div><p>{q.text}</p></li>)}
                      </ol>
                    </details>
                  </PlaceCard>
                );
              })}
            </ul>
          )}
          {view.length > shown && <button type="button" className="plt-more" onClick={() => setShown(shown + HEALTH_PAGE)}>Show {Math.min(HEALTH_PAGE, view.length - shown)} more ({view.length - shown} left)</button>}
          <p className="ma-sub">Ratings are the CQC's latest published for each place{meta ? `, from its list of ${meta.asAt}` : ""}. A rating describes the day the CQC inspected, which can be years ago. Not every service is rated: dentists, for example, are not. Distances are in a straight line. Contains CQC information under the Open Government Licence.</p>
          <a className="ma-link" href="https://www.cqc.org.uk/" target="_blank" rel="noreferrer">Search every service on the CQC's own site</a>
        </>
      )}
    </Card>
  );
}

// The nearest hospital trust: its A&E four-hour figures and how long people are waiting for planned treatment.
export function HospitalCard({ r, i }) {
  const point = pointOf(r);
  const england = !r.country || r.country === "England";
  const { data: ae, failed: aeFailed } = useDataFile(aeNearYou);
  const { data: rtt } = useDataFile(rttWaits);
  if (!point || !england) return null;
  const trust = ae ? nearestTrusts(ae.trusts, point, 1)[0] : null;
  const wait = trust && rtt ? waitView(rtt.trusts[trust.code], rtt.national) : null;
  return (
    <Card i={i} colour="#2C7DA0" icon={<IconHeartbeat size={20} />} title="Your nearest hospital trust: A&E and waiting lists" className="ma-nearyou">
      {aeFailed ? <p className="ma-sub">The A&amp;E figures did not load.</p> : !trust ? <p className="ma-sub">Finding the nearest hospital trust...</p> : (
        <>
          <ul className="sc-list-flat"><TrustCard t={trust} nat={ae.national} month={ae.month} wait={wait} waitMonth={rtt?.month ?? ""} waitNat={rtt?.national.pct18 ?? null} /></ul>
          {rtt && !wait && <p className="ma-sub">NHS England has no waiting list figures for this trust in {rtt.month}.</p>}
          <p className="ma-sub">A trust can run more than one hospital, and the distance is measured to its main address. A&amp;E figures are NHS England's for {ae.month}; waiting list figures are its referral to treatment data for {rtt?.month ?? "the latest month"}, which count everyone still waiting rather than those treated.</p>
          <a className="ma-link" href="#/nearYou">The three nearest A&amp;E trusts</a>
        </>
      )}
    </Card>
  );
}

// The schools within three miles, with Ofsted's latest result and the school's GCSE or Year 6 results. The filter is by kind of school.
const SCHOOL_RADIUS = 3;
const SCHOOL_PAGE = 3;
const SCHOOL_SORTS = {
  near: { label: "Nearest first", words: "nearest first", compare: byMiles },
  pupils: { label: "Most pupils first", words: "most pupils first", compare: (a, b) => (b.k ?? 0) - (a.k ?? 0) || byMiles(a, b) },
  name: { label: "Name, A to Z", words: "by name", compare: byName },
};
const PHASES = [["all", "All"], ["P", "Primary"], ["S", "Secondary"], ["X", "Special"]];

export function SchoolsCard({ r, i }) {
  const point = pointOf(r);
  const england = !r.country || r.country === "England";
  const records = useLookup(england ? point : null, (p) => loadTiles("schools", p, SCHOOL_RADIUS));
  const [phase, setPhase] = useState("all");
  const [shown, setShown] = useState(SCHOOL_PAGE);
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState("near");
  if (!point) return null;
  if (!england) {
    return (
      <Card i={i} colour="#7B5BD6" icon={<IconPin size={20} />} title="Schools near your postcode" className="ma-schools">
        <p className="ma-sub">These figures cover state-funded schools in England. Schools in {r.country ?? "your nation"} are inspected and reported separately.</p>
      </Card>
    );
  }
  const all = records ? schoolsWithin(records, point, SCHOOL_RADIUS) : [];
  const byPhase = phase === "all" ? all : all.filter((s) => s.p === phase);
  const list = browse(byPhase.map((s) => ({ ...s, name: s.n })), { query, textOf: (s) => [s.n], compare: SCHOOL_SORTS[sort].compare });
  return (
    <Card i={i} colour="#7B5BD6" icon={<IconPin size={20} />} title="Schools near your postcode" className="ma-schools">
      {records === undefined ? <p className="ma-sub">Finding schools near you...</p> : records === null ? <p className="ma-sub">The school figures did not load. Try again in a moment.</p> : (
        <>
          <div className="ac-tools" role="group" aria-label="Kind of school">
            {PHASES.map(([k, label]) => <button key={k} type="button" aria-pressed={phase === k} onClick={() => { setPhase(k); setShown(SCHOOL_PAGE); }}>{label} ({k === "all" ? all.length : all.filter((s) => s.p === k).length})</button>)}
          </div>
          {byPhase.length > 0 && (
            <PlaceTools label="Search and sort the schools" query={query} sort={sort} sorts={Object.entries(SCHOOL_SORTS).map(([key, v]) => ({ key, label: v.label }))}
              onQuery={(v) => { setQuery(v); setShown(SCHOOL_PAGE); }} onSort={(v) => { setSort(v); setShown(SCHOOL_PAGE); }}
              line={countLine({ shown: Math.min(shown, list.length), total: list.length, noun: { one: "school", many: "schools" }, query, order: SCHOOL_SORTS[sort].words })} />
          )}
          {byPhase.length === 0 ? <p className="ma-sub">No schools of that kind are listed within {SCHOOL_RADIUS} miles.</p> : list.length === 0 ? <NoMatch what="schools" onClear={() => { setQuery(""); setShown(SCHOOL_PAGE); }} /> : <><GradeKey /><ul className="sc-list-flat">{list.slice(0, shown).map((s) => <School key={s.u} s={s} />)}</ul></>}
          {list.length > shown && <button type="button" className="plt-more" onClick={() => setShown(shown + SCHOOL_PAGE)}>Show {Math.min(SCHOOL_PAGE, list.length - shown)} more ({list.length - shown} left)</button>}
          <a className="ma-link" href="#/nearYou">The full list, with the three nearest A&amp;E trusts</a>
        </>
      )}
    </Card>
  );
}

// Roads and fly-tipping for the postcode's council. Roads are looked after by the county council where there is one, otherwise by the council itself; fly-tipping is
// reported by the council that collects the waste, which is the district or unitary council.
export function CouncilServicesCard({ council, county, i }) {
  const { data, failed } = useDataFile(councilServices);
  if (failed || !council) return null;
  const roadAuthority = county ?? council;
  const roads = data ? roadRows(data, roadAuthority.id) : [];
  const fly = data ? flyTippingRow(data, council.id) : null;
  if (data && roads.length === 0 && !fly) return null; // outside England, or no figures for this council
  return (
    <Card i={i} colour="#E8741A" icon={<IconCouncil size={20} />} title="Roads and fly-tipping" className="ma-services">
      {!data ? <p className="ma-sub">Loading council figures...</p> : (
        <ul className="sc-list-flat">
          {roads.length > 0 && (
            <PlaceCard name={`Roads: ${roadAuthority.name}`} tone="#E8741A" tags={[`Financial year ${roadYear(roads[0].year)}`, "Department for Transport surveys"]}
              rows={roads.map((r) => ({
                label: r.label, small: r.text,
                big: `${r.value}%`,
                text: `of the road length was in poor condition, where maintenance should have been considered. England: ${r.nat}%.${r.since ? ` It was ${r.since.value}% in ${roadYear(r.since.year)}.` : ""}`,
              }))} />
          )}
          {fly && (
            <PlaceCard name={`Fly-tipping: ${council.name}`} tone="#B3262E" tags={[`${fly.year}`, "Defra, from councils' returns"]}
              rows={[{ label: "Incidents", small: "dumped waste cleared or reported", big: fly.total.toLocaleString("en-GB"), text: fly.change == null ? "incidents were reported by the council to Defra." : `incidents were reported to Defra, ${fly.change === 0 ? "the same as" : `${Math.abs(fly.change)}% ${fly.change > 0 ? "more than" : "fewer than"}`} the year before (${fly.previous.toLocaleString("en-GB")}).` }]} />
          )}
        </ul>
      )}
      {data && <p className="ma-sub">Poor-condition roads are those where surveys found the surface in the worst category, the share of the council's road length. Surveying methods differ, especially for unclassified roads, and fly-tipping counts depend on how a council records and clears waste, so a bigger council will report more. Neither is a ranking of councils.</p>}
      <a className="ma-link" href="#/compareCouncils">Compare councils</a>
    </Card>
  );
}

// Jobs and pay for the constituency, from the Office for National Statistics through Nomis, on the 2024 boundaries.
const money = (v) => `£${Math.round(v).toLocaleString("en-GB")}`;

export function LocalEconomyCard({ r, i }) {
  const { data, failed } = useDataFile(localEconomy);
  if (failed) return null;
  const seat = data ? seatRecord(data, r.codes, r.parliamentary_constituency) : null;
  if (data && !seat) return null;
  const claim = seat ? claimantRow(seat, data) : null;
  const pay = seat ? payRow(seat, data) : null;
  if (data && !claim && !pay) return null;
  return (
    <Card i={i} colour="#7A5AF0" icon={<IconEconomy size={20} />} title={`Jobs and pay in ${r.parliamentary_constituency ?? "your constituency"}`} className="ma-economy">
      {!data ? <p className="ma-sub">Loading jobs and pay figures...</p> : (
        <>
          <ul className="sc-list-flat">
            <PlaceCard name={seat.n} tone="#7A5AF0" tags={["Westminster constituency, 2024 boundaries", "Office for National Statistics"]}
              rows={[
                claim && {
                  label: "Claimant count", small: monthShort(claim.month), big: `${claim.rate}%`,
                  text: `of residents aged 16 to 64 were claiming benefits mainly for being out of work (${claim.count.toLocaleString("en-GB")} people). That is ${claim.vs} England's ${claim.nat}%${claim.move && claim.move !== "unchanged" ? `, and ${claim.move} from ${(claim.rate - claim.change).toFixed(1)}% a year earlier` : claim.move ? ", unchanged on a year earlier" : ""}.`,
                },
                pay && {
                  label: "Typical full-time pay", small: `Median, ${pay.year}`, big: money(pay.pay),
                  text: `a year before tax for full-time jobs located here. That is ${pay.vs} England's ${money(pay.nat)}${pay.change != null ? `, and ${pay.change > 0 ? "up" : pay.change < 0 ? "down" : "unchanged"} ${pay.change === 0 ? "" : `${Math.abs(pay.change)}% `}on the year before` : ""}.`,
                },
              ].filter(Boolean)} />
          </ul>
          <p className="ma-sub">The claimant count is the number of people claiming Universal Credit who are required to look for work, or Jobseeker's Allowance; it is lower than the survey measure of unemployment. Pay is for jobs located in the constituency, not for the people who live there, so a seat with a big employer or a city centre can look high or low for reasons that have little to do with its residents. Pay figures are survey estimates and can move from year to year. Neither measure ranks MPs or constituencies.</p>
          <a className="ma-link" href="#/constituency">More about your constituency</a>
        </>
      )}
    </Card>
  );
}

// ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
// Food hygiene ratings of the places within about a mile that sell or serve food, from the Food Standards Agency's ratings service (live).
const HYGIENE_TONE = { 5: "#2F8F6B", 4: "#6FA84A", 3: "#C9A20B", 2: "#E08A1E", 1: "#D9453B", 0: "#B0201A" };
const shortDate = (d) => (d ? new Date(`${d}T12:00:00`).toLocaleDateString("en-GB", { month: "long", year: "numeric" }) : null);

const FOOD_PAGE = 5;
const RATING_ORDER = (a, b) => (a.rating ?? -1) - (b.rating ?? -1);
const FOOD_SORTS = {
  near: { label: "Nearest first", words: "nearest first", compare: byMiles },
  low: { label: "Lowest rating first", words: "lowest rated first", compare: (a, b) => RATING_ORDER(a, b) || byMiles(a, b) },
  high: { label: "Highest rating first", words: "highest rated first", compare: (a, b) => RATING_ORDER(b, a) || byMiles(a, b) },
  recent: { label: "Most recently inspected", words: "most recently inspected first", compare: (a, b) => String(b.date ?? "").localeCompare(String(a.date ?? "")) || byMiles(a, b) },
  name: { label: "Name, A to Z", words: "by name", compare: byName },
};
const FHRS_FILTERS = [["weak", "Rated 0 to 2", (p) => p.status === "rated" && p.rating <= 2], ["mid", "Rated 3", (p) => p.status === "rated" && p.rating === 3], ["good", "Rated 4 or 5", (p) => p.status === "rated" && p.rating >= 4], ["all", "All ratings", () => true]];
const FHIS_FILTERS = [["improve", "Improvement required", (p) => p.status === "improve"], ["pass", "Pass", (p) => p.status === "pass"], ["all", "All results", () => true]];

// Every business near the postcode with a published result, nearest first. The visitor can search by name (street or postcode too), sort by rating, date or name, and narrow by rating or
// kind of business. It opens on the lowest-rated places, which is what the card is for; typing in the search looks through every rating.
function FoodList({ food, fhis }) {
  const filters = fhis ? FHIS_FILTERS : FHRS_FILTERS;
  const sorts = (fhis ? ["near", "recent", "name"] : ["near", "low", "high", "recent", "name"]).map((key) => ({ key, label: FOOD_SORTS[key].label }));
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState("near");
  const [rating, setRating] = useState(filters[0][0]);
  const [type, setType] = useState("all");
  const [shown, setShown] = useState(FOOD_PAGE);
  const types = useMemo(() => {
    const m = new Map();
    for (const p of food.places) if (p.type) m.set(p.type, (m.get(p.type) ?? 0) + 1);
    return [...m].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], "en-GB"));
  }, [food.places]);
  const counts = useMemo(() => Object.fromEntries(filters.map(([k, , test]) => [k, food.places.filter((p) => (type === "all" || p.type === type) && test(p)).length])), [food.places, filters, type]);
  const test = filters.find(([k]) => k === rating)?.[2] ?? (() => true);
  const list = useMemo(
    () => browse(food.places.filter((p) => (type === "all" || p.type === type) && test(p)), { query, textOf: (p) => [p.name, p.type, p.postcode], compare: FOOD_SORTS[sort].compare }),
    [food.places, type, rating, query, sort], // eslint-disable-line react-hooks/exhaustive-deps -- `test` follows `rating`
  );
  const clear = () => { setQuery(""); setRating("all"); setType("all"); setShown(FOOD_PAGE); };
  return (
    <>
      <h4>{fhis ? "Businesses near you" : "Food businesses near you"}</h4>
      <PlaceTools label="Search and sort the food businesses" query={query} sort={sort} sorts={sorts}
        onQuery={(v) => { setQuery(v); setShown(FOOD_PAGE); if (v.trim() && rating !== "all") setRating("all"); }} onSort={(v) => { setSort(v); setShown(FOOD_PAGE); }}
        line={countLine({ shown: Math.min(shown, list.length), total: list.length, noun: { one: "business", many: "businesses" }, query, order: FOOD_SORTS[sort].words })}>
        <div className="plt-chips" role="group" aria-label="Rating">
          <span>Show</span>
          {filters.map(([k, label]) => <button key={k} type="button" aria-pressed={rating === k} onClick={() => { setRating(k); setShown(FOOD_PAGE); }}>{label} ({counts[k]})</button>)}
        </div>
        {types.length > 1 && (
          <div className="plt-field plt-type">
            <label htmlFor="food-type">Kind of business</label>
            <select id="food-type" value={type} onChange={(e) => { setType(e.target.value); setShown(FOOD_PAGE); }}>
              <option value="all">All kinds ({food.places.length})</option>
              {types.map(([t, c]) => <option key={t} value={t}>{t} ({c})</option>)}
            </select>
          </div>
        )}
      </PlaceTools>
      {list.length === 0 ? <NoMatch what="food businesses" onClear={clear} /> : (
        <Batches items={list} shown={shown} page={FOOD_PAGE} className="sc-list-flat" render={(w) => {
          const tone = w.status === "pass" ? HYGIENE_TONE[5] : w.rating == null ? HYGIENE_TONE[1] : HYGIENE_TONE[w.rating];
          const label = w.status === "pass" ? "Pass" : w.rating == null ? "Improvement required" : `${w.rating}: ${FHRS_WORDS[w.rating]}`;
          return (
            <PlaceCard key={w.id} name={w.name} href={`https://ratings.food.gov.uk/business/${w.id}`} miles={w.miles} tone={tone} tags={[w.type, w.postcode].filter(Boolean)}
              rows={[{ label: "Rating", small: w.date ? `Inspected ${shortDate(w.date)}` : "Food Standards Agency", pill: { tone, label } }]} />
          );
        }} />
      )}
      {list.length > shown && <button type="button" className="plt-more" onClick={() => setShown(shown + FOOD_PAGE)}>Show {Math.min(FOOD_PAGE, list.length - shown)} more ({list.length - shown} left)</button>}
    </>
  );
}

export function FoodHygieneCard({ r, i }) {
  const point = pointOf(r);
  const [attempt, setAttempt] = useState(0);
  const food = useLookup(point, (p) => loadFoodHygiene(p, 1), attempt);
  if (!point) return null;
  const fhis = food?.scheme === "FHIS";
  const rows = !food ? [] : fhis
    ? [{ key: "pass", label: "Pass", count: food.pass, tone: HYGIENE_TONE[5] }, { key: "improve", label: "Improvement required", count: food.improve, tone: HYGIENE_TONE[1] }]
    : [5, 4, 3, 2, 1, 0].map((v) => ({ key: v, label: `${v}: ${FHRS_WORDS[v]}`, count: food.counts[v], tone: HYGIENE_TONE[v] }));
  return (
    <Card i={i} colour="#2F8F6B" icon={<IconBasket size={20} />} title="Food hygiene near your postcode" className="ma-food">
      {food === undefined ? <p className="ma-sub">Finding food hygiene ratings near you...</p> : food === null ? <p className="ma-sub">The Food Standards Agency's ratings did not load. <button type="button" className="ma-retry" onClick={() => setAttempt((a) => a + 1)}>Try again</button> or search at <a href="https://ratings.food.gov.uk/" target="_blank" rel="noreferrer">ratings.food.gov.uk</a>.</p> : food.judged === 0 ? <p className="ma-sub">No inspected food businesses are listed within {food.radius} mile of your postcode.</p> : (
        <>
          <p>Within about a mile there {food.judged === 1 ? "is" : "are"} <strong>{n(food.judged)}</strong> food business{food.judged === 1 ? "" : "es"} with a published rating{food.authority ? ` from ${food.authority}'s inspectors and others` : ""}. <strong>{Math.round(food.goodShare * 100)}%</strong> {fhis ? "have a Pass" : "are rated Good or Very good (4 or 5)"}.</p>
          <h4>{fhis ? "Results near you" : "How many businesses at each rating (5 is best)"}</h4>
          <div className="av-split">
            <Ring colour="#2F8F6B" value={Math.round(food.goodShare * 100)} label={fhis ? "have a Pass" : "rated Good or Very good"} caption={`of ${n(food.judged)} businesses`} />
            <RatingColumns aria={fhis ? "Food hygiene results near you" : "Food hygiene ratings near you"} cols={[...rows].reverse().map((x) => ({ key: x.key, label: fhis ? x.label : String(x.key), sub: fhis ? undefined : FHRS_WORDS[x.key], value: x.count, colour: x.tone }))} />
          </div>
          {(food.waiting > 0 || food.exempt > 0) && <p className="ma-sub">Not counted above: {[food.waiting > 0 && `${n(food.waiting)} awaiting inspection`, food.exempt > 0 && `${n(food.exempt)} exempt (low-risk businesses such as some childminders and small shops are not rated)`].filter(Boolean).join(", ")}.</p>}
          {food.places.length > 0 && <FoodList key={`${point.lat},${point.lon}`} food={food} fhis={fhis} />}
          <p className="ma-sub">A rating shows what inspectors found on the day of the last visit: how hygienically food is handled, the condition of the building, and how the business manages food safety. It is not about taste, and a place rated below 5 may have improved since; a re-inspection can be requested. Ratings are published by councils and collected by the Food Standards Agency{fhis ? "; Scotland uses a Pass or Improvement Required result instead of numbers" : ""}. Distances are in a straight line.{food.truncated ? " Only the first part of a very long list was returned." : ""}</p>
          <a className="ma-link" href="https://ratings.food.gov.uk/" target="_blank" rel="noreferrer">Search every rating on the Food Standards Agency's site</a>
        </>
      )}
    </Card>
  );
}

// ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
// People killed or injured on the roads of the council area, five years of the Department for Transport's road casualty statistics (Great Britain), rebuilt by the daily data job.
export function RoadCasualtiesCard({ r, i }) {
  const point = pointOf(r);
  const northernIreland = r.country === "Northern Ireland";
  const { data, failed } = useDataFile(roadCasualties);
  const code = r.codes?.admin_district;
  if (!point) return null;
  const council = councilName(r.admin_district);
  if (northernIreland) {
    return (
      <Card i={i} colour="#E8741A" icon={<IconTransport size={20} />} title="Road casualties in your area" className="ma-roads">
        <p className="ma-sub">The Department for Transport's road casualty statistics cover Great Britain. Northern Ireland's are published by the Police Service of Northern Ireland at <a href="https://www.psni.police.uk/about-us/our-publications-and-reports/official-statistics/road-traffic-collision-statistics" target="_blank" rel="noreferrer">psni.police.uk</a>.</p>
      </Card>
    );
  }
  const v = data && code ? roadView(data, code) : null;
  const peak = v ? Math.max(...v.years.map((y) => y.ksi), 1) : 1;
  const topUser = v ? Math.max(...v.users.map((u) => u.count), 1) : 1;
  return (
    <Card i={i} colour="#E8741A" icon={<IconTransport size={20} />} title={`Road casualties in ${council}`} className="ma-roads">
      {failed ? <p className="ma-sub">The road casualty figures did not load. Try again in a moment.</p> : !data ? <p className="ma-sub">Loading road casualty figures...</p> : !v ? <p className="ma-sub">Road casualty figures are not held for this council area, usually because its boundaries have changed. The full statistics are at <a href="https://www.gov.uk/government/collections/road-accidents-and-safety-statistics" target="_blank" rel="noreferrer">gov.uk</a>.</p> : (
        <>
          <p>In {v.latest.year}, <strong>{n(v.latest.ksi)}</strong> {v.latest.ksi === 1 ? "person was" : "people were"} killed or seriously injured on the roads of {council}: <strong>{n(v.latest.killed)}</strong> killed and <strong>{n(v.latest.serious)}</strong> seriously injured. A further <strong>{n(v.latest.slight)}</strong> {v.latest.slight === 1 ? "was" : "were"} slightly injured.</p>
          <h4>Killed or seriously injured, year by year</h4>
          <ol className="ma-months" aria-label={`People killed or seriously injured on the roads of ${council}, by year`}>
            {v.years.map((y) => <li key={y.year}><i aria-hidden="true" style={{ "--h": y.ksi / peak }} /><b>{n(y.ksi)}</b><small>{y.year}</small></li>)}
          </ol>
          <p className="ma-sub">Killed each year: {v.years.map((y) => `${y.year}: ${n(y.killed)}`).join(", ")}.</p>
          {v.usersTotal > 0 && (
            <>
              <h4>Who was killed or seriously injured in {v.latest.year}</h4>
              <ul className="ma-domains" aria-label={`Road users killed or seriously injured in ${v.latest.year}`}>
                {v.users.map((u) => <li key={u.key}><span>{u.label}</span><i aria-hidden="true"><b style={{ "--w": Math.max(0.02, u.count / topUser) }} /></i><em>{n(u.count)}</em></li>)}
              </ul>
            </>
          )}
          <p className="ma-sub">These are people hurt in collisions on public roads that the police recorded, counted in the council area where the collision happened, so busy through-roads and motorways count against the area they pass through. They are not rates: a larger or busier area will have more. Police forces have been changing how they judge whether an injury is serious, which would make the years incomparable, so the Department adjusts the "serious" count to one standard; the adjusted figures are shown here and are estimates, rounded to whole people. The latest year can be revised when the Department publishes its final figures. Across Great Britain {v.gbKsi != null ? `${n(v.gbKsi)} people were killed or seriously injured in ${data.latest}` : "many people were killed or seriously injured"}. Source: Department for Transport road casualty statistics (STATS19), open government licence.</p>
          <a className="ma-link" href="https://www.gov.uk/government/collections/road-accidents-and-safety-statistics" target="_blank" rel="noreferrer">Road casualty statistics on GOV.UK</a>
        </>
      )}
    </Card>
  );
}

// ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
// Flood warnings and alerts in force near the postcode, and the flood warning areas around it: the Environment Agency's real-time service (England only, live).
export function FloodWarningsCard({ r, i }) {
  const point = pointOf(r);
  const england = !r.country || r.country === "England";
  const [attempt, setAttempt] = useState(0);
  const floods = useLookup(england ? point : null, (p) => loadFloods(p), attempt);
  if (!point) return null;
  if (!england) {
    const who = r.country === "Wales" ? ["Natural Resources Wales", "https://naturalresources.wales/flooding/"] : r.country === "Scotland" ? ["SEPA", "https://www.sepa.org.uk/flooding/"] : ["the Department for Infrastructure", "https://www.infrastructure-ni.gov.uk/topics/rivers-and-flooding"];
    return (
      <Card i={i} colour="#2C7DA0" icon={<IconFlood size={20} />} title="Flood warnings near your postcode" className="ma-flood">
        <p className="ma-sub">These are the Environment Agency's warnings for England. In {r.country ?? "your nation"}, flood warnings come from <a href={who[1]} target="_blank" rel="noreferrer">{who[0]}</a>.</p>
      </Card>
    );
  }
  const shown = floods?.warnings?.slice(0, 5) ?? [];
  return (
    <Card i={i} colour="#2C7DA0" icon={<IconFlood size={20} />} title="Flood warnings near your postcode" className="ma-flood">
      {floods === undefined ? <p className="ma-sub">Checking for flood warnings near you...</p> : floods === null ? <p className="ma-sub">The Environment Agency's flood service did not answer. <button type="button" className="ma-retry" onClick={() => setAttempt((a) => a + 1)}>Try again</button> or check <a href="https://check-for-flooding.service.gov.uk/" target="_blank" rel="noreferrer">check-for-flooding.service.gov.uk</a>.</p> : (
        <>
          {floods.warnings.length === 0 ? (
            <p><strong>No flood warnings or alerts</strong> are in force within {floods.warnKm} km of your postcode right now.</p>
          ) : (
            <>
              <p><strong>{n(floods.warnings.length)}</strong> flood warning{floods.warnings.length === 1 ? " or alert is" : "s or alerts are"} in force within {floods.warnKm} km of your postcode right now.</p>
              <ul className="sc-list-flat">
                {shown.map((w) => (
                  <PlaceCard key={w.id} name={w.name} tone={SEVERITY[w.level].tone} tags={[w.river, w.county].filter(Boolean)}
                    rows={[{ label: "Status", small: "Environment Agency", pill: { tone: SEVERITY[w.level].tone, label: SEVERITY[w.level].name }, text: SEVERITY[w.level].meaning }]} />
                ))}
              </ul>
              {floods.warnings.length > shown.length && <p className="ma-sub">And {n(floods.warnings.length - shown.length)} more; the live map below lists them all.</p>}
            </>
          )}
          {floods.areaCount != null && floods.areaCount > 0 && <p className="ma-sub">{n(floods.areaCount)} flood warning area{floods.areaCount === 1 ? "" : "s"} lie within {floods.areaKm} km{floods.rivers.length ? `, along ${floods.rivers.join(", ")}` : ""}. People in these areas can sign up for free warnings by phone, text or email.</p>}
          {floods.areaCount === 0 && <p className="ma-sub">No flood warning areas lie within {floods.areaKm} km, which usually means the nearest rivers and coast are further away.</p>}
          <p className="ma-sub">A flood alert means flooding is possible, a flood warning that it is expected, and a severe flood warning that there is danger to life. This is the position at the moment you opened the page, updated by the Environment Agency every 15 minutes; it says nothing about how likely your home is to flood in future. Source: Environment Agency real-time flood-monitoring API, open government licence.</p>
          <p className="ma-links2">
            <a className="ma-link" href="https://www.gov.uk/sign-up-for-flood-warnings" target="_blank" rel="noreferrer">Sign up for free flood warnings</a>
            <a className="ma-link" href="https://www.gov.uk/check-long-term-flood-risk" target="_blank" rel="noreferrer">Check your long-term flood risk</a>
            <a className="ma-link" href="https://check-for-flooding.service.gov.uk/" target="_blank" rel="noreferrer">Live flood map</a>
          </p>
        </>
      )}
    </Card>
  );
}

// ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
// What homes in the council area sell for: the UK House Price Index, rebuilt monthly by the daily data job.
export function HousePricesCard({ r, i }) {
  const point = pointOf(r);
  const { data, failed } = useDataFile(housePrices);
  const code = r.codes?.admin_district;
  if (!point) return null;
  const council = councilName(r.admin_district);
  const v = data && code ? priceView(data, code, r.country) : null;
  const last = v?.history[v.history.length - 1]?.year;
  const points = v ? v.history.filter((p) => (last - p.year) % 2 === 0) : [];
  const topKind = v ? Math.max(...v.kinds.map((k) => k.price), 1) : 1;
  const move = (c) => (c == null ? null : c === 0 ? "unchanged" : `${c > 0 ? "up" : "down"} ${Math.abs(c).toFixed(1)}%`);
  return (
    <Card i={i} colour="#E8741A" icon={<IconHouse size={20} />} title={`House prices in ${council}`} className="ma-prices">
      {failed ? <p className="ma-sub">The house price figures did not load. Try again in a moment.</p> : !data ? <p className="ma-sub">Loading house price figures...</p> : !v ? <p className="ma-sub">House price figures are not held for this council area, usually because its boundaries have changed. The full index is at <a href="https://landregistry.data.gov.uk/app/ukhpi" target="_blank" rel="noreferrer">landregistry.data.gov.uk</a>.</p> : (
        <>
          <p>The average home in {council} sold for <strong>{pounds(v.price)}</strong> in {monthLabel(v.month)}{v.change != null && <>, <strong>{move(v.change)}</strong> on a year earlier</>}.{v.nation && v.nation.change != null ? ` Across ${v.nation.name} the average was ${pounds(v.nation.price)}, ${move(v.nation.change)} on the year.` : v.uk ? ` Across the UK it was ${pounds(v.uk.price)}.` : ""}</p>
          {points.length > 1 && (
            <>
              <h4>Average price each {monthOnly(v.month)}</h4>
              <TrendArea colour="#E8741A" labelEvery={1} points={points.map((p) => ({ label: String(p.year), value: p.price }))} format={(x) => `£${Math.round(x / 1000)}k`} aria={`Average house price in ${council} each ${monthOnly(v.month)}: ${points.map((p) => `${p.year} ${pounds(p.price)}`).join(", ")}`} />
              {v.sinceFirst != null && <p className="ma-sub">That is {move(v.sinceFirst)} since {monthOnly(v.month)} {v.sinceYear}, before any allowance for inflation.</p>}
            </>
          )}
          {v.kinds.length > 0 && (
            <>
              <h4>By kind of home</h4>
              <ul className="ma-domains ma-price-kinds" aria-label={`Average price by kind of home in ${council}`}>
                {v.kinds.map((k) => <li key={k.key}><span>{k.label}</span><i aria-hidden="true"><b style={{ "--w": Math.max(0.02, k.price / topKind) }} /></i><em>{pounds(k.price)}</em></li>)}
              </ul>
            </>
          )}
          {v.sales != null && <p className="ma-sub">About {n(v.sales)} sales were recorded for {monthLabel(v.salesMonth)}; the count for the latest months rises as late registrations arrive.</p>}
          <p className="ma-sub">This is the average price of every home sold in the council area, so a few very expensive or cheap sales, or a change in which kinds of home sell, can move it. The latest month is a first estimate and is usually revised. It describes the council area, not your street, and it is not a valuation of your home. Source: UK House Price Index, published by HM Land Registry with the Office for National Statistics, Registers of Scotland and Land &amp; Property Services Northern Ireland, open government licence.</p>
          <a className="ma-link" href="#/housing">House prices and rents in detail</a>
        </>
      )}
    </Card>
  );
}

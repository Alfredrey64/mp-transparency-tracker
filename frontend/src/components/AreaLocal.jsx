/** @jsxImportSource react */
import { useEffect, useState } from "react";
import { Card } from "./AreaSections";
import { IconShield } from "./icons";
import { IconFlood } from "./newIcons";
import { PlaceCard, Pill, TrustCard, School, GradeKey } from "./story/NearYouParts";
import { useDataFile } from "../lib/useDataFile";
import { bathingWater, rttWaits, aeNearYou, healthMeta, councilServices, localEconomy } from "../lib/dataFiles";
import { seatRecord, claimantRow, payRow, monthShort } from "../lib/localEconomyView";
import { IconEconomy } from "./icons";
import { roadRows, flyTippingRow, roadYear } from "../lib/councilServices";
import { IconCouncil } from "./icons";
import { loadTiles } from "../lib/localTiles";
import { nearestTrusts, schoolsWithin } from "../lib/nearYou";
import { GROUPS, placesWithin, placeView, waitView } from "../lib/healthNear";
import { IconHeartbeat, IconPin } from "./icons";
import { loadOverflows, nearestBathing, RATING_TEXT, RATING_TONE } from "../lib/waterNear";
import { loadStreetCrime, monthName } from "../lib/streetCrime";
import "../arealocal.css";

// The cards of the In numbers view that look themselves up from the postcode's position: street-level crime (police.uk, live). Each takes the postcode result `r` and
// leaves itself out, or says why, where its figures do not cover the place. Nothing here sends the postcode anywhere: police.uk is asked only for a latitude and longitude.

const pointOf = (r) => (r.latitude != null && r.longitude != null ? { lat: r.latitude, lon: r.longitude } : null);
const n = (v) => Number(v ?? 0).toLocaleString("en-GB");

// Runs a lookup for a point and keeps its answer: undefined while it loads, null if it failed.
function useLookup(point, run) {
  const [value, setValue] = useState(undefined);
  const lat = point?.lat;
  const lon = point?.lon;
  useEffect(() => {
    if (lat == null) return undefined;
    let alive = true;
    setValue(undefined); // eslint-disable-line react-hooks/set-state-in-effect -- a new postcode starts a new lookup
    run({ lat, lon }).then((v) => alive && setValue(v)).catch(() => alive && setValue(null));
    return () => { alive = false; };
  }, [lat, lon]); // eslint-disable-line react-hooks/exhaustive-deps -- `run` is a fixed function of the point
  return value;
}

export function StreetCrimeCard({ r, i }) {
  const point = pointOf(r);
  const scotland = r.country === "Scotland";
  const crime = useLookup(scotland ? null : point, (p) => loadStreetCrime(p, 6));
  if (!point) return null;
  if (scotland) {
    return (
      <Card i={i} colour="#D9453B" icon={<IconShield size={20} />} title="Crime near your postcode" className="ma-streetcrime">
        <p className="ma-sub">The police.uk street-level figures cover England, Wales and Northern Ireland. Police Scotland publishes its own figures, by area, at <a href="https://www.scotland.police.uk/about-us/how-we-do-it/performance-and-accountability/" target="_blank" rel="noreferrer">scotland.police.uk</a>.</p>
      </Card>
    );
  }
  const top = crime ? Math.max(...crime.categories.map((c) => c.count), 1) : 1;
  const peak = crime ? Math.max(...crime.months.map((m) => m.total), 1) : 1;
  return (
    <Card i={i} colour="#D9453B" icon={<IconShield size={20} />} title="Crime near your postcode" className="ma-streetcrime">
      {crime === undefined ? <p className="ma-sub">Loading recorded crime near you...</p> : crime === null ? <p className="ma-sub">The police.uk figures did not load. Try again in a moment, or see <a href="https://www.police.uk/" target="_blank" rel="noreferrer">police.uk</a>.</p> : (
        <>
          <p><strong>{n(crime.total)}</strong> crimes were recorded within about a mile of your postcode in {monthName(crime.latest)}.</p>
          <ul className="ma-domains" aria-label={`Kinds of crime recorded near you in ${monthName(crime.latest)}`}>
            {crime.categories.map((c) => (
              <li key={c.slug}><span>{c.name}</span><i aria-hidden="true"><b style={{ "--w": Math.max(0.02, c.count / top) }} /></i><em>{n(c.count)}</em></li>
            ))}
          </ul>
          {crime.months.length > 1 && (
            <>
              <h4>Month by month</h4>
              <ol className="ma-months" aria-label="Crimes recorded near you, month by month">
                {crime.months.map((m) => <li key={m.ym}><i aria-hidden="true" style={{ "--h": m.total / peak }} /><b>{n(m.total)}</b><small>{monthName(m.ym).slice(0, 3)}</small></li>)}
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
          {s.busiest.length > 0 && (
            <ul className="sc-list-flat">
              {s.busiest.filter((o) => o.spills > 0).map((o) => (
                <PlaceCard key={o.id} name={o.name} miles={o.miles} tone="#2C7DA0"
                  tags={[o.company, o.water, o.bathing && `Affects ${o.bathing}`].filter(Boolean)}
                  rows={[{ label: `Spills in ${water.year}`, big: n(o.spills), text: `discharges, lasting ${n(o.hours ?? 0)} hours in all.` }]} />
              ))}
            </ul>
          )}
          <p className="ma-sub">Shown: the busiest overflows within {water.radius} miles. A storm overflow is meant to release diluted sewage in heavy rain to stop it backing up into homes; the number of times it does so is the figure the Environment Agency collects.{s.poorlyMonitored > 0 ? ` ${s.poorlyMonitored} of these monitors worked for less than 90% of the year, so their counts may be too low.` : ""}{water.truncated ? " Only the first 1,000 overflows were returned." : ""} Source: Environment Agency, event duration monitoring annual returns for {water.year}, as reported by the water companies.</p>
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
          <a className="ma-link" href="https://environment.data.gov.uk/bathing-waters" target="_blank" rel="noreferrer">Daily pollution risk forecasts for every beach</a>
        </>
      )}
    </Card>
  );
}

// How far to look for each kind of service.
const HEALTH_RADIUS = { GP: 3, HO: 10, CH: 3, other: 6 };
const HEALTH_PAGE = 3;

// The Care Quality Commission's rating for the GP surgeries, hospitals, care homes and other services near the postcode, with the five key questions in a drop-down.
export function HealthServicesCard({ r, i }) {
  const point = pointOf(r);
  const england = !r.country || r.country === "England";
  const records = useLookup(england ? point : null, (p) => loadTiles("health", p, 10));
  const { data: meta } = useDataFile(healthMeta);
  const [kind, setKind] = useState("GP");
  const [shown, setShown] = useState(HEALTH_PAGE);
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
  return (
    <Card i={i} colour="#2F8F6B" icon={<IconHeartbeat size={20} />} title="Health services near your postcode" className="ma-health">
      {records === undefined ? <p className="ma-sub">Finding health services near you...</p> : records === null ? <p className="ma-sub">The Care Quality Commission's ratings did not load. Try again in a moment.</p> : (
        <>
          <div className="ac-tools" role="group" aria-label="Kind of health service">
            {lists.map((g) => <button key={g.key} type="button" aria-pressed={kind === g.key} onClick={() => { setKind(g.key); setShown(HEALTH_PAGE); }}>{g.label} ({g.list.length})</button>)}
          </div>
          {current.list.length === 0 ? <p className="ma-sub">No rated {group.label.toLowerCase()} are listed within {HEALTH_RADIUS[kind]} miles of your postcode.</p> : (
            <ul className="sc-list-flat">
              {current.list.slice(0, shown).map((place) => {
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
          {current.list.length > shown && <button type="button" className="ac-more" onClick={() => setShown(shown + HEALTH_PAGE)}>Show {Math.min(HEALTH_PAGE, current.list.length - shown)} more ({current.list.length - shown} left)</button>}
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
const PHASES = [["all", "All"], ["P", "Primary"], ["S", "Secondary"], ["X", "Special"]];

export function SchoolsCard({ r, i }) {
  const point = pointOf(r);
  const england = !r.country || r.country === "England";
  const records = useLookup(england ? point : null, (p) => loadTiles("schools", p, SCHOOL_RADIUS));
  const [phase, setPhase] = useState("all");
  const [shown, setShown] = useState(SCHOOL_PAGE);
  if (!point) return null;
  if (!england) {
    return (
      <Card i={i} colour="#7B5BD6" icon={<IconPin size={20} />} title="Schools near your postcode" className="ma-schools">
        <p className="ma-sub">These figures cover state-funded schools in England. Schools in {r.country ?? "your nation"} are inspected and reported separately.</p>
      </Card>
    );
  }
  const all = records ? schoolsWithin(records, point, SCHOOL_RADIUS) : [];
  const list = phase === "all" ? all : all.filter((s) => s.p === phase);
  return (
    <Card i={i} colour="#7B5BD6" icon={<IconPin size={20} />} title="Schools near your postcode" className="ma-schools">
      {records === undefined ? <p className="ma-sub">Finding schools near you...</p> : records === null ? <p className="ma-sub">The school figures did not load. Try again in a moment.</p> : (
        <>
          <div className="ac-tools" role="group" aria-label="Kind of school">
            {PHASES.map(([k, label]) => <button key={k} type="button" aria-pressed={phase === k} onClick={() => { setPhase(k); setShown(SCHOOL_PAGE); }}>{label} ({k === "all" ? all.length : all.filter((s) => s.p === k).length})</button>)}
          </div>
          {list.length === 0 ? <p className="ma-sub">No schools of that kind are listed within {SCHOOL_RADIUS} miles.</p> : <><GradeKey /><ul className="sc-list-flat">{list.slice(0, shown).map((s) => <School key={s.u} s={s} />)}</ul></>}
          {list.length > shown && <button type="button" className="ac-more" onClick={() => setShown(shown + SCHOOL_PAGE)}>Show {Math.min(SCHOOL_PAGE, list.length - shown)} more ({list.length - shown} left)</button>}
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

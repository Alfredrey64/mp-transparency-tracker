/** @jsxImportSource react */
import { useEffect, useMemo, useState } from "react";
import { COLORS, FONT_BODY, PAGE_PADDING } from "../theme";
import { PageHeader } from "./shared";
import { LoadFailedNote } from "./MpCards";
import { IconCompareAreas, IconSearch } from "./icons";
import { card, cardTitle, pillStyle } from "../lib/onsStyles";
import { searchCouncils, seatsByParty, majorityOf, controlColourOf } from "../lib/councils";
import { nextVote } from "../lib/localElections";
import { loadAreaFigures } from "../lib/areaFigures";
import { REGIONS } from "../data/regionMetrics";
import { navigate } from "../lib/route";
import { pairFromParam, pairPath, nationOf, regionKeyFor, taxFor, deprivationFor, ordinal, pounds, differenceText, controlText, partyName } from "../lib/compareCouncils";
import { fullDate } from "../lib/ballots";
import { dateLocale, isWelsh } from "../lib/i18n";
import { useT } from "../lib/useLang";
import "../comparecouncils.css";

// Compare councils: any two side by side, from the files the site already holds (who runs each, its seats and next election, the Band D council tax bill, and
// where it sits in England's deprivation ranking), with the region's typical pay and house prices beneath. It states the figures and never which is better.
// The pair is in the address (#/compareCouncils/E08000003~E08000035) so a comparison can be linked to.

const SIDE = { a: "#1E4FB8", b: "#E0367A" };
const SUGGESTED = [["Blackpool", "Westminster"], ["Manchester", "Leeds"], ["Cardiff", "Glasgow City"]];
const fmt = (n) => Math.round(n).toLocaleString("en-GB");

function Picker({ side, index, current, exclude, onPick }) {
  const t = useT();
  const [query, setQuery] = useState("");
  const matches = useMemo(() => searchCouncils(index, query, 6).filter((c) => c.id !== exclude), [index, query, exclude]);
  const id = `cc-pick-${side}`;
  return (
    <div style={{ minWidth: 0 }}>
      <label htmlFor={id} className="cc-label">
        <span aria-hidden="true" className="cc-badge" style={{ background: SIDE[side] }}>{side === "a" ? "A" : "B"}</span>
        {side === "a" ? t("First council") : t("Second council")}
      </label>
      <div style={{ position: "relative" }}>
        <span style={{ position: "absolute", left: 16, top: "50%", transform: "translateY(-50%)", color: SIDE[side], display: "flex" }}><IconSearch size={18} /></span>
        <input id={id} type="search" className="ons-chip cc-input" value={query} autoComplete="off" onChange={(e) => setQuery(e.target.value)} placeholder={current ? t("{name} (change)", { name: current }) : t("A council name")} style={{ borderColor: `color-mix(in srgb, ${SIDE[side]} 45%, ${COLORS.hairline})` }} />
      </div>
      {query.trim().length >= 2 && (
        <ul className="cc-results">
          {matches.length === 0 && <li className="cc-none">{t("No council matches that.")}</li>}
          {matches.map((c) => (
            <li key={c.id}>
              <button type="button" onClick={() => { onPick(c.id); setQuery(""); }}>
                <strong>{c.name}</strong><span>{t(nationOf(c))}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function Pair({ title, left, right, tall, note }) {
  return (
    <div className="cc-row" role="group" aria-label={title}>
      <div className="cc-row-title">{title}</div>
      <div className="cc-pair" data-tall={tall ? "1" : "0"}>
        <div>{left}</div>
        <div>{right}</div>
      </div>
      {note && <p className="cc-note">{note}</p>}
    </div>
  );
}

const Big = ({ name, children, sub, tint }) => (
  <>
    <div className="cc-big" style={tint ? { color: tint } : undefined}><span className="sr-only">{name}: </span>{children}</div>
    {sub && <div className="cc-sub">{sub}</div>}
  </>
);

function Head({ c, side, t }) {
  return (
    <div className="cc-head" style={{ borderTopColor: SIDE[side] }}>
      <a href={`#/councils/${c.id}`}>{c.name}</a>
      <div className="cc-sub"><i aria-hidden="true" style={{ background: controlColourOf(c.control_by_seats) }} />{controlText(c.control, t)}</div>
      <div className="cc-sub">{t(nationOf(c))}</div>
    </div>
  );
}

// Seats as one bar split by party, with the biggest few in words underneath so the colours are never the only information.
function Seats({ c, parties, t }) {
  const rows = seatsByParty(c, parties);
  const shown = rows.slice(0, 4);
  const rest = rows.slice(4).reduce((n, r) => n + r.count, 0);
  const label = rows.map((r) => `${partyName(r.short, t)} ${r.count}`).join(", ");
  return (
    <>
      <div className="cc-seatbar" role="img" aria-label={`${c.name}: ${label}`}>
        {rows.map((r) => <i key={r.idx} style={{ flexGrow: r.count, background: r.colour ?? "#909090" }} />)}
      </div>
      <ul className="cc-legend">
        {shown.map((r) => <li key={r.idx}><i aria-hidden="true" style={{ background: r.colour ?? "#909090" }} />{partyName(r.short, t)} <strong>{r.count}</strong></li>)}
        {rest > 0 && <li>{t("Others")} <strong>{rest}</strong></li>}
      </ul>
    </>
  );
}

// A sentence for each nation, written out whole: Welsh changes the start of a place name after "in", so the name cannot just be dropped into one sentence.
const OTHER_TAX = {
  Scotland: (t) => t("Council tax is set differently in Scotland, so it is not shown here."),
  Wales: (t) => t("Council tax is set differently in Wales, so it is not shown here."),
  "Northern Ireland": (t) => t("Council tax is set differently in Northern Ireland, so it is not shown here."),
};

function Tax({ c, tax, other, t }) {
  if (tax) {
    const widest = Math.max(tax.latest, other?.latest ?? 0);
    return (
      <>
        <Big name={c.name} sub={t("up {n}% since {from} to {to}", { n: Math.round(tax.rise), from: tax.fromYear, to: String(tax.fromYear + 1).slice(2) })}>{pounds(tax.latest)}</Big>
        <div className="cc-bar" aria-hidden="true"><i style={{ width: `${Math.max(4, (tax.latest / widest) * 100)}%` }} /></div>
      </>
    );
  }
  const nation = nationOf(c);
  return <div className="cc-sub">{nation !== "England" ? OTHER_TAX[nation]?.(t) ?? t("No figure for this council.") : c.id.startsWith("E10") ? t("A county council has no bill of its own: its charge is part of the bill from the district council.") : t("No figure for this council.")}</div>;
}

function Deprivation({ c, info, t }) {
  if (!info) return <div className="cc-sub">{nationOf(c) === "England" ? t("This council is not in the ranking.") : t("Not comparable: each nation ranks only its own areas, on a differently built index.")}</div>;
  // Welsh ordinals do not follow one simple rule, so in Welsh the rank is a plain number with its meaning spelled out.
  if (isWelsh()) return <Big name={c.name} sub={t("Rank out of {of} English councils (1 is the most deprived)", { of: info.of })}>{info.rank}</Big>;
  return <Big name={c.name} sub={t("most deprived of {of} English councils (1st is the most)", { of: info.of })}>{ordinal(info.rank)}</Big>;
}

export default function CompareCouncils({ param }) {
  const t = useT();
  const loc = dateLocale();
  const [data, setData] = useState(null);
  const [failed, setFailed] = useState(false);
  const [extra, setExtra] = useState(null);
  const [idA, idB] = useMemo(() => pairFromParam(param), [param]);

  useEffect(() => {
    let alive = true;
    import("../data/councilsIndex.json").then((m) => alive && setData(m.default)).catch(() => alive && setFailed(true));
    return () => { alive = false; };
  }, []);
  const a = data && idA ? data.index.find((c) => c.id === idA) : null;
  const b = data && idB ? data.index.find((c) => c.id === idB) : null;
  const both = a && b;

  // The tax and deprivation files and the regional figures are only fetched once two councils are chosen, and only once.
  useEffect(() => {
    if (!both || extra) return undefined;
    let alive = true;
    Promise.all([import("../data/councilTaxByCouncil.json"), import("../data/deprivation.json")])
      .then(([tax, dep]) => alive && setExtra({ tax: tax.default, dep: dep.default, figures: {} }))
      .catch(() => alive && setExtra({ tax: null, dep: null, figures: {} }));
    return () => { alive = false; };
  }, [both, extra]);
  const keyA = extra && a ? regionKeyFor(a, extra.dep) : null;
  const keyB = extra && b ? regionKeyFor(b, extra.dep) : null;
  useEffect(() => {
    if (!extra) return undefined;
    let alive = true;
    const want = [...new Set([keyA, keyB].filter(Boolean))].filter((k) => !(k in extra.figures));
    if (!want.length) return undefined;
    Promise.all(want.map((k) => loadAreaFigures(k).catch(() => []).then((f) => [k, f]))).then((pairs) => alive && setExtra((x) => ({ ...x, figures: { ...x.figures, ...Object.fromEntries(pairs) } })));
    return () => { alive = false; };
  }, [extra, keyA, keyB]);

  const go = (x, y) => navigate(pairPath(x, y));
  const regionName = (k) => { const n = k ? REGIONS.find((r) => r.key === k)?.name : null; return n ? t(n) : null; };
  const taxA = both && extra ? taxFor(a, extra.tax) : null;
  const taxB = both && extra ? taxFor(b, extra.tax) : null;
  const depA = both && extra ? deprivationFor(a, extra.dep) : null;
  const depB = both && extra ? deprivationFor(b, extra.dep) : null;
  const diff = taxA && taxB ? differenceText(taxA.latest, taxB.latest) : null;
  const figA = (keyA && extra?.figures[keyA]) || [];
  const figB = (keyB && extra?.figures[keyB]) || [];
  const ids = new Set([...figA, ...figB].map((f) => f.id));
  const suggested = data ? SUGGESTED.map(([x, y]) => [data.index.find((c) => c.name === x), data.index.find((c) => c.name === y)]).filter(([x, y]) => x && y) : [];
  const vsA = a ? nextVote(a) : null;
  const vsB = b ? nextVote(b) : null;
  const when = (c, v) => (v ? <Big name={c.name} sub={v.all ? t("All {n} seats are up", { n: v.total }) : t("{up} of {n} seats are up", { up: v.seatsUp, n: v.total })}>{fullDate(v.date, loc)}</Big> : <div className="cc-sub">{t("No election date is recorded.")}</div>);

  return (
    <div className="regions-wrap" style={{ maxWidth: 1100, margin: "0 auto", padding: PAGE_PADDING }}>
      <PageHeader icon={IconCompareAreas} kicker="Your say" title={t("Compare councils")} subtitle={t("Pick any two councils to see who runs them, when they next vote, what council tax costs and how deprived each area is, side by side.")} />
      {failed && <LoadFailedNote item="the council data" />}
      {!failed && !data && <p style={{ fontFamily: FONT_BODY, fontSize: 14, color: COLORS.inkSoft }}>{t("Loading the councils…")}</p>}
      {data && (
        <>
          <div className="cc-pickers">
            <Picker side="a" index={data.index} current={a?.name} exclude={b?.id} onPick={(id) => go(id, idB)} />
            <Picker side="b" index={data.index} current={b?.name} exclude={a?.id} onPick={(id) => go(idA, id)} />
          </div>
          {((idA && !a) || (idB && !b)) && <p className="cc-note" role="status">{t("We could not find one of those councils. Search for it above.")}</p>}

          {!both && (
            <section className="cc-empty" style={card}>
              <h2 style={cardTitle}>{t("Pick two councils to begin")}</h2>
              <p className="cc-note" style={{ margin: "8px 0 14px" }}>{t("Search for a council in each box. Or start from a pair that is worth a look:")}</p>
              <div className="cc-pairs">
                {suggested.map(([x, y]) => (
                  <button key={x.id} type="button" onClick={() => go(x.id, y.id)}>
                    <span><i style={{ background: SIDE.a }} />{x.name}</span><b aria-hidden="true">{t("vs")}</b><span><i style={{ background: SIDE.b }} />{y.name}</span>
                  </button>
                ))}
              </div>
            </section>
          )}

          {both && (
            <section aria-label={t("{a} compared with {b}", { a: a.name, b: b.name })} style={{ ...card, marginTop: 24 }}>
              <div className="cc-pair cc-heads"><Head c={a} side="a" t={t} /><Head c={b} side="b" t={t} /></div>
              <Pair title={t("Who runs it")} tall left={<><Big name={a.name}>{controlText(a.control, t)}</Big><Seats c={a} parties={data.parties} t={t} /></>} right={<><Big name={b.name}>{controlText(b.control, t)}</Big><Seats c={b} parties={data.parties} t={t} /></>} />
              <Pair title={t("Seats")} left={<Big name={a.name} sub={t("{n} needed for a majority", { n: majorityOf(a.total) })}>{a.total}</Big>} right={<Big name={b.name} sub={t("{n} needed for a majority", { n: majorityOf(b.total) })}>{b.total}</Big>} />
              <Pair title={t("Next election")} left={when(a, vsA)} right={when(b, vsB)} />
              {!extra ? <p className="cc-note">{t("Loading the figures…")}</p> : (
                <>
                  <Pair title={t("Council tax, Band D, this year (the whole bill)")} tall left={<Tax c={a} tax={taxA} other={taxB} t={t} />} right={<Tax c={b} tax={taxB} other={taxA} t={t} />}
                    note={diff ? t("The bill in {a} is £{n} {dir} than in {b}.", { a: a.name, b: b.name, n: fmt(diff.amount), dir: diff.more ? t("higher") : t("lower") }) : null} />
                  <Pair title={t("Deprivation")} tall left={<Deprivation c={a} info={depA} t={t} />} right={<Deprivation c={b} info={depB} t={t} />}
                    note={depA && depB ? null : nationOf(a) !== nationOf(b) ? t("These councils are in different nations, whose deprivation indices are built differently, so they cannot be ranked against each other.") : null} />
                  {(figA.length > 0 || figB.length > 0) && (
                    <div className="cc-region">
                      <div className="cc-row-title">{t("Typical figures for the region")}</div>
                      <p className="cc-note" style={{ marginTop: 0 }}>{keyA === keyB ? t("Both councils are in the same region: {region}. So the regional figures are the same, and they describe the region, not the council.", { region: regionName(keyA) }) : t("These are for the region each council is in ({a} and {b}), not for the councils themselves.", { a: regionName(keyA) ?? "–", b: regionName(keyB) ?? "–" })}</p>
                      {[...ids].map((id) => {
                        const fa = figA.find((f) => f.id === id);
                        const fb = figB.find((f) => f.id === id);
                        const label = (fa ?? fb).label;
                        return <Pair key={id} title={t(label)} left={fa ? <Big name={a.name} sub={t("UK: {v}", { v: fa.uk })}>{fa.value}</Big> : <div className="cc-sub">–</div>} right={fb ? <Big name={b.name} sub={t("UK: {v}", { v: fb.uk })}>{fb.value}</Big> : <div className="cc-sub">–</div>} />;
                      })}
                    </div>
                  )}
                </>
              )}
              <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginTop: 16 }}>
                <button type="button" className="ons-chip" onClick={() => go(idB, idA)} style={pillStyle(false)}>{t("Swap the two")}</button>
                <a className="ons-chip" href={`#/councils/${a.id}`} style={{ ...pillStyle(false), textDecoration: "none", display: "inline-flex", alignItems: "center" }}>{t("About {name}", { name: a.name })}</a>
                <a className="ons-chip" href={`#/councils/${b.id}`} style={{ ...pillStyle(false), textDecoration: "none", display: "inline-flex", alignItems: "center" }}>{t("About {name}", { name: b.name })}</a>
              </div>
            </section>
          )}

          <p className="cc-note" style={{ marginTop: 22, maxWidth: 760 }}>
            {t("Who runs each council and its seats come from Open Council Data UK. Council tax is the Band D bill from the Ministry of Housing, Communities and Local Government, and includes the county, police, fire and any parish charge. Deprivation is from the English Indices of Deprivation 2025. Regional pay and house prices come from the Office for National Statistics. See the data page for the sources in full.")}
          </p>
        </>
      )}
    </div>
  );
}

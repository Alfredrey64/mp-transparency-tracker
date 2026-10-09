import { useEffect, useMemo, useState } from "react";
import { COLORS, FONT_BODY, FONT_DISPLAY, numeric } from "../theme";
import { card, cardTitle } from "../lib/onsStyles";
import { Segmented } from "./DeprivationControls";
import { GROUPS, timesPhrase, prisonFigures, offenceMatrix, unknownShare } from "../lib/crimePeople";

// "Who is involved in crime": official figures on who is arrested, what for, who is a victim, who is in prison and who reoffends,
// from crimePeople.json (see fetch-crime-people.js). The figures are about police and court contact and about victims; they do
// not say who "commits" crime, and the card says so before showing any of them.

const fmt = (n) => Math.round(n).toLocaleString("en-GB");
const f1 = (n) => `${(Math.round(n * 10) / 10).toFixed(1)}`;
const para = { fontFamily: FONT_BODY, fontSize: 14.5, lineHeight: 1.6, color: COLORS.ink, margin: "10px 0 0", maxWidth: 780 };
const small = { fontFamily: FONT_BODY, fontSize: 12.5, lineHeight: 1.55, color: COLORS.inkSoft, margin: "8px 0 0", maxWidth: 780 };
const h3 = { fontFamily: FONT_DISPLAY, fontSize: 16, fontWeight: 700, color: COLORS.ink, margin: "20px 0 8px" };

// Horizontal bars: label, bar, figure. `mark` draws a dashed line, for the average of everyone.
function Bars({ rows, accent, mark = null, unit = "", digits = 1, note = null }) {
  const max = Math.max(...rows.map((r) => r.value), mark ?? 0, 0.0001);
  return (
    <div>
      <ol style={{ listStyle: "none", margin: 0, padding: 0, display: "grid", gap: 8 }}>
        {rows.map((r) => (
          <li key={r.label} style={{ display: "grid", gridTemplateColumns: "minmax(86px, 190px) minmax(0, 1fr) minmax(70px, auto)", gap: 10, alignItems: "center", fontFamily: FONT_BODY, fontSize: 13.5, color: COLORS.ink }}>
            <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: r.wrap ? "normal" : "nowrap", fontWeight: r.strong ? 700 : 500, paddingLeft: r.indent ? 14 : 0 }}>{r.label}</span>
            <span aria-hidden="true" style={{ position: "relative", height: 14, borderRadius: 7, background: `${accent}18` }}>
              <span style={{ display: "block", height: "100%", width: `${(r.value / max) * 100}%`, minWidth: r.value > 0 ? 3 : 0, borderRadius: 7, background: r.muted ? `${accent}88` : accent }} />
              {mark !== null && <span style={{ position: "absolute", top: -4, bottom: -4, left: `${(mark / max) * 100}%`, borderLeft: `2px dashed ${COLORS.inkSoft}`, opacity: 0.8 }} />}
            </span>
            <span style={{ ...numeric, fontSize: 14, fontWeight: 600, textAlign: "right" }}>{r.value === null ? "n/a" : r.value.toFixed(digits)}{unit}{r.sub && <span style={{ display: "block", fontFamily: FONT_BODY, fontWeight: 400, fontSize: 11.5, color: COLORS.inkSoft }}>{r.sub}</span>}</span>
          </li>
        ))}
      </ol>
      {note && <p style={small}>{note}</p>}
    </div>
  );
}

function Callout({ children, tone = "note" }) {
  return (
    <div role="note" style={{ margin: "14px 0 0", padding: "12px 14px", borderRadius: 12, border: `1px solid ${COLORS.hairline}`, borderLeft: `4px solid ${tone === "income" ? "#B8862E" : COLORS.inkSoft}`, background: COLORS.paper, fontFamily: FONT_BODY, fontSize: 13.5, lineHeight: 1.6, color: COLORS.ink, maxWidth: 780 }}>
      {children}
    </div>
  );
}

function Arrests({ data, accent }) {
  const [sex, setSex] = useState("all");
  const a = data.arrests;
  const top = a.groups.filter((g) => !g.parent);
  const rateOf = (id) => (sex === "all" ? top.find((g) => g.broad === id)?.rate : a.bySex[sex]?.[id]) ?? null;
  const overall = sex === "all" ? a.all.rate : a.bySex[sex]?.all ?? null;
  const rows = GROUPS.map((g) => ({ label: g.label, value: rateOf(g.id) })).filter((r) => r.value !== null).sort((x, y) => y.value - x.value);
  const white = rateOf("white");
  const highest = rows[0];
  const stop = data.stopSearch;
  const stopRows = GROUPS.map((g) => ({ label: g.label, value: stop.groups.find((x) => x.broad === g.id && !x.parent)?.rate ?? null })).filter((r) => r.value !== null).sort((x, y) => y.value - x.value);
  const detail = a.groups.filter((g) => g.parent && g.rate !== null);
  const years = a.overTime;
  return (
    <div>
      <p style={para}>
        Between {a.period.replace("April ", "April ").replace(" to ", " and ")} the police in England and Wales made <strong>{fmt(a.all.number)} arrests</strong>, about <strong>{f1(a.all.rate)} for every 1,000 people</strong>. {fmt(a.unknown.number)} of them ({Math.round((a.unknown.number / a.all.number) * 100)}%) had no ethnic group recorded, so they are left out of the group figures below.
      </p>
      <div style={{ margin: "14px 0 12px" }}>
        <Segmented label="Whose arrests" value={sex} onChange={setSex} small options={[{ id: "all", label: "Everyone" }, { id: "male", label: "Men" }, { id: "female", label: "Women" }]} />
      </div>
      <Bars rows={rows} accent={accent} mark={overall} unit="" note={`Arrests for every 1,000 people of that group. The dashed line is the figure for everyone${sex === "all" ? "" : sex === "male" ? " (men)" : " (women)"}: ${f1(overall)}.`} />
      {sex === "all" && highest && white && highest.label !== "White" && (
        <p style={para}>{highest.label} people were arrested at {timesPhrase(highest.value, white)} of White people ({f1(highest.value)} against {f1(white)} per 1,000). {a.bySex.male.all && a.bySex.female.all ? `Men were arrested at about ${f1(a.bySex.male.all / a.bySex.female.all)} times the rate of women (${f1(a.bySex.male.all)} against ${f1(a.bySex.female.all)}), a bigger gap than between any two ethnic groups.` : ""}</p>
      )}
      {sex !== "all" && <p style={para}>{sex === "male" ? "Men" : "Women"} are shown separately because sex makes the biggest difference of all: across everyone, men are arrested at about {f1(a.bySex.male.all / a.bySex.female.all)} times the rate of women.</p>}

      <h4 style={h3}>How the rate has moved</h4>
      <div style={{ overflowX: "auto" }}>
        <table style={{ borderCollapse: "collapse", fontFamily: FONT_BODY, fontSize: 13, color: COLORS.ink, minWidth: 360 }}>
          <caption style={{ captionSide: "bottom", textAlign: "left", fontSize: 12, color: COLORS.inkSoft, paddingTop: 6 }}>Arrests for every 1,000 people</caption>
          <thead><tr><th scope="col" style={{ textAlign: "left", padding: "6px 14px 6px 0" }}>Year</th>{GROUPS.map((g) => <th key={g.id} scope="col" style={{ textAlign: "right", padding: "6px 10px", fontWeight: 700 }}>{g.label}</th>)}</tr></thead>
          <tbody>{years.map((y) => <tr key={y.year}><th scope="row" style={{ textAlign: "left", padding: "5px 14px 5px 0", fontWeight: 600 }}>{y.year}</th>{GROUPS.map((g) => <td key={g.id} style={{ ...numeric, textAlign: "right", padding: "5px 10px" }}>{y.rates[g.id] != null ? f1(y.rates[g.id]) : "n/a"}</td>)}</tr>)}</tbody>
        </table>
      </div>

      <h4 style={h3}>Stopped and searched</h4>
      <Bars rows={stopRows} accent={accent} mark={stop.all.rate} note={`Stop and searches for every 1,000 people of that group, ${stop.period.replace(" to ", " to ")}. The dashed line is everyone: ${f1(stop.all.rate)}. A stop and search is a police decision made on the street, so it says more about how police use the power than about who offends.`} />

      <details style={{ marginTop: 14 }}>
        <summary className="ons-tap" style={{ fontFamily: FONT_BODY, fontSize: 14, fontWeight: 700, color: COLORS.ink, cursor: "pointer", padding: "6px 0" }}>See the more detailed ethnic groups</summary>
        <div style={{ marginTop: 8 }}>
          <Bars rows={detail.map((g) => ({ label: g.label, value: g.rate, sub: `${fmt(g.number)} arrests`, muted: true })).sort((x, y) => y.value - x.value)} accent={accent} mark={a.all.rate} />
          <p style={small}>Arrests for every 1,000 people. Small groups give less reliable rates, and some of the official categories are catch-alls (&ldquo;Black other&rdquo; has the highest figure but is a small, mixed group).</p>
        </div>
      </details>
    </div>
  );
}

function WhatFor({ data, accent }) {
  const m = useMemo(() => offenceMatrix(data.offences), [data]);
  const unknown = unknownShare(data.offences);
  const groups = GROUPS.filter((g) => data.offences.groups[g.id]);
  const biggest = m.filter((r) => r.name !== "Other")[0];
  const spread = m.filter((r) => r.name !== "Other").map((r) => ({ name: r.name.toLowerCase(), gap: Math.max(...groups.map((g) => r.cells[g.id])) - Math.min(...groups.map((g) => r.cells[g.id])) })).sort((a, b) => b.gap - a.gap).slice(0, 3).map((r) => r.name);
  const cellMax = Math.max(...m.flatMap((r) => groups.map((g) => r.cells[g.id])));
  return (
    <div>
      <p style={para}>
        When someone is held at a police station they are usually offered free legal advice. The Ministry of Justice counts those cases by the offence the person was suspected of, which gives a view of <strong>what each group is held for</strong>. Each column below is one group&apos;s cases in {data.offences.year}, adding up to 100%.
      </p>
      <div style={{ overflowX: "auto", marginTop: 12 }}>
        <table style={{ borderCollapse: "separate", borderSpacing: 3, width: "100%", minWidth: 460, fontFamily: FONT_BODY, fontSize: 13, color: COLORS.ink }}>
          <caption style={{ captionSide: "bottom", textAlign: "left", fontSize: 12, color: COLORS.inkSoft, paddingTop: 8 }}>Share of each group&apos;s police-station legal aid cases, by offence suspected, {data.offences.year}</caption>
          <thead><tr><th scope="col" style={{ textAlign: "left", padding: "4px 8px", fontWeight: 700 }}>Offence suspected</th>{groups.map((g) => <th key={g.id} scope="col" style={{ textAlign: "right", padding: "4px 8px", fontWeight: 700 }}>{g.label}</th>)}</tr></thead>
          <tbody>
            {m.map((r) => (
              <tr key={r.name}>
                <th scope="row" style={{ textAlign: "left", padding: "6px 8px", fontWeight: 600 }}>{r.name}</th>
                {groups.map((g) => {
                  const v = r.cells[g.id];
                  return <td key={g.id} style={{ ...numeric, textAlign: "right", padding: "6px 8px", borderRadius: 6, background: `color-mix(in oklab, ${accent} ${Math.round((v / cellMax) * 60)}%, transparent)` }}>{f1(v)}%</td>;
                })}
              </tr>
            ))}
            <tr>
              <th scope="row" style={{ textAlign: "left", padding: "6px 8px", fontWeight: 700 }}>Cases in the table</th>
              {groups.map((g) => <td key={g.id} style={{ ...numeric, textAlign: "right", padding: "6px 8px", color: COLORS.inkSoft }}>{fmt(data.offences.groups[g.id].total)}</td>)}
            </tr>
          </tbody>
        </table>
      </div>
      {biggest && <p style={para}>For every group the biggest single category is <strong>{biggest.name.toLowerCase()}</strong>, from {f1(Math.min(...groups.map((g) => biggest.cells[g.id])))}% to {f1(Math.max(...groups.map((g) => biggest.cells[g.id])))}% of cases. The mix differs most for {spread.join(", ")}.</p>}
      <Callout>
        <strong>Read with care.</strong> About {unknown}% of cases have no ethnic group recorded and are not in the table, so the shares are for the cases where it is known. It counts cases, not people, and being held on suspicion is not being guilty. {data.offences.note}
      </Callout>
    </div>
  );
}

const VICTIM_SETS = {
  ethnic: { label: "Ethnic group", rows: (v) => v.ethnic },
  age: { label: "Age", rows: (v) => v.age },
  sex: { label: "Sex", rows: (v) => v.sex },
  disability: { label: "Disability", rows: (v) => v.disability },
};
const INCOME_SETS = {
  income: { label: "Household income", rows: (v) => v.income },
  deprivation: { label: "Area deprivation", rows: (v) => v.deprivation },
  tenure: { label: "Housing", rows: (v) => v.tenure },
  area: { label: "Town or country", rows: (v) => v.area },
};

function VictimBars({ rows, measure, accent }) {
  const values = rows.map((r) => ({ label: r.label.replace("Black/African/Caribbean/Black British", "Black").replace("Asian/Asian British", "Asian").replace("Mixed/Multiple", "Mixed").replace(" ethnic group", "").replace(/ Output Areas/, " areas"), value: r[measure], sub: r.base ? `${fmt(r.base)} people` : null, wrap: true })).filter((r) => r.value != null);
  return <Bars rows={values} accent={accent} unit="%" />;
}

function Victims({ data, accent }) {
  const [by, setBy] = useState("ethnic");
  const [measure, setMeasure] = useState("any");
  const v = data.victims;
  const set = VICTIM_SETS[by];
  return (
    <div>
      <p style={para}>
        The Crime Survey asks about {fmt(v.sex.reduce((n, r) => n + (r.base ?? 0), 0))} people a year whether they were a victim of crime in the last 12 months, whether or not they told the police. In the {v.year}, <strong>{f1(v.all.any)}%</strong> of adults were victims of a headline crime (including fraud and computer misuse), and <strong>{f1(v.all.personal)}%</strong> of a crime against them personally (such as violence, theft from the person or fraud).
      </p>
      <div style={{ display: "flex", flexWrap: "wrap", gap: "10px 16px", margin: "14px 0 12px" }}>
        <Segmented label="Break down by" value={by} onChange={setBy} small options={Object.entries(VICTIM_SETS).map(([id, s]) => ({ id, label: s.label }))} />
        <Segmented label="Which crimes" value={measure} onChange={setMeasure} small options={[{ id: "any", label: "All headline crime", short: "All crime" }, { id: "personal", label: "Crime against the person", short: "Personal" }]} />
      </div>
      <VictimBars rows={set.rows(v)} measure={measure} accent={accent} />
      <p style={small}>Percentage of people aged 16 and over who were victims once or more in the {v.year}. It is a survey, so figures for small groups (such as the Mixed and Other ethnic groups, with a few hundred people each) are less certain, and small differences may be chance. The figure for everyone is {f1(v.all[measure])}%.</p>
    </div>
  );
}

function Prison({ data, accent }) {
  const f = useMemo(() => prisonFigures(data.prison, data.arrests.population), [data]);
  const re = data.reoffending;
  const all = data.prison.known;
  const rows = [...f].sort((a, b) => b.rate - a.rate).map((g) => ({ label: g.label, value: g.rate, sub: `${fmt(g.number)} prisoners` }));
  const overall = (all / data.arrests.population.all) * 1000;
  return (
    <div>
      <p style={para}>
        On {data.prison.date} there were <strong>{fmt(all)} people in prison</strong> in England and Wales whose ethnic group is recorded, about <strong>{f1(overall)} for every 1,000 people</strong> in the population. Prison reflects years of arrests, charges, convictions and sentences, so differences here add up everything that happens before.
      </p>
      <h4 style={h3}>In prison for every 1,000 people of the group</h4>
      <Bars rows={rows} accent={accent} digits={2} mark={overall} note={`Prisoners of known ethnic group divided by the population of that group (2021 Census). The dashed line is everyone: ${f1(overall)}. About ${f1((data.prison.unrecorded / (all + data.prison.unrecorded)) * 100)}% of prisoners have no ethnic group recorded.`} />
      <h4 style={h3}>Who reoffends</h4>
      <p style={para}>Of adults and young people convicted or released from custody in {re.period.replace("April ", "April ").replace(" to ", " to ")}, <strong>{f1(re.all.pct)}%</strong> committed another offence within a year that was later proven in court, on average {f1(re.all.average)} further offences each.</p>
      <Bars rows={re.groups.filter((g) => g.label !== "Unknown").sort((a, b) => b.pct - a.pct).map((g) => ({ label: g.label, value: g.pct, sub: `${g.average} offences each` }))} accent={accent} unit="%" mark={re.all.pct} note="Share who reoffended within a year. The dashed line is everyone. The official table groups Mixed with Other." />
    </div>
  );
}

function Income({ data, accent }) {
  const [by, setBy] = useState("income");
  const [measure, setMeasure] = useState("any");
  const v = data.victims;
  const set = INCOME_SETS[by];
  return (
    <div>
      <Callout tone="income">
        <strong>What the official statistics do not include.</strong> No government source publishes the income of people who are arrested, charged or convicted, so this page cannot show who commits what by income. The closest official figures are about <em>victims</em>: whether people at each income level, and in each kind of area, were victims of crime. They are below.
      </Callout>
      <div style={{ display: "flex", flexWrap: "wrap", gap: "10px 16px", margin: "16px 0 12px" }}>
        <Segmented label="Break down by" value={by} onChange={setBy} small options={Object.entries(INCOME_SETS).map(([id, s]) => ({ id, label: s.label }))} />
        <Segmented label="Which crimes" value={measure} onChange={setMeasure} small options={[{ id: "any", label: "All headline crime", short: "All crime" }, { id: "personal", label: "Crime against the person", short: "Personal" }]} />
      </div>
      <VictimBars rows={set.rows(v)} measure={measure} accent={accent} />
      <p style={small}>Percentage of people aged 16 and over who were victims once or more, {v.year}. Household income is a year&apos;s total before tax, for the whole household. Area deprivation is for England only (the employment domain of the Indices of Deprivation). These are figures for being a victim, not for committing crime, and a single percentage can hide very different kinds of crime.</p>
    </div>
  );
}

const TABS = [
  { id: "arrests", label: "Arrests", short: "Arrests" },
  { id: "what", label: "Arrested for what", short: "For what" },
  { id: "victims", label: "Victims", short: "Victims" },
  { id: "prison", label: "Prison and reoffending", short: "Prison" },
  { id: "income", label: "Income and area", short: "Income" },
];

export default function CrimePeople({ accent }) {
  const [data, setData] = useState(null);
  const [failed, setFailed] = useState(false);
  const [tab, setTab] = useState("arrests");
  useEffect(() => {
    let alive = true;
    import("../data/crimePeople.json").then((m) => alive && setData(m.default)).catch(() => alive && setFailed(true));
    return () => { alive = false; };
  }, []);
  if (failed) return null;

  return (
    <section id="crime-who" aria-labelledby="h-crime-who" className="ons-anchor regions-wrap" style={{ ...card, position: "relative", overflow: "hidden", gridColumn: "1 / -1" }}>
      <span aria-hidden="true" style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: 5, background: `linear-gradient(180deg, ${accent}, ${accent}22)` }} />
      <h2 id="h-crime-who" style={cardTitle}>Who is involved in crime?</h2>
      <p style={para}>
        Official figures on who the police arrest, what for, who is a victim, and who ends up in prison. Look at the &ldquo;read this first&rdquo; note before the numbers.
      </p>
      <details className="dep-more" open style={{ maxWidth: 780, marginTop: 12 }}>
        <summary className="ons-tap" style={{ fontFamily: FONT_BODY, fontSize: 14, fontWeight: 700, color: COLORS.ink, cursor: "pointer", padding: "6px 0" }}>Read this first: what these figures can and cannot tell you</summary>
        <ul style={{ fontFamily: FONT_BODY, fontSize: 13.5, lineHeight: 1.65, color: COLORS.ink, margin: "6px 0 0", paddingLeft: 20 }}>
          <li><strong>They count contact with the police and courts, not crime itself.</strong> An arrest is not a conviction, and much crime is never reported or solved. Who gets arrested depends partly on where police patrol and how they use their powers.</li>
          <li><strong>Age and sex matter more than anything else.</strong> Most arrests are of young men, and ethnic groups have different age profiles, so differences between groups partly reflect that. The Ministry of Justice says it cannot tell how much of any gap is down to ethnicity itself rather than age, place, the type of offence or other factors.</li>
          <li><strong>Place and circumstances matter too.</strong> Arrest rates are higher in city centres and in poorer areas, and ethnic groups are not spread evenly across the country.</li>
          <li><strong>Some records are missing.</strong> A share of arrests and cases has no ethnic group recorded. The cards say how many.</li>
          <li><strong>Income is not recorded</strong> for anyone arrested or convicted, so it cannot be shown. See the &ldquo;Income and area&rdquo; tab for what is known.</li>
          <li><strong>Nothing here shows that anyone&apos;s ethnic group causes crime.</strong> Ethnic groups are broad, and the people inside each one are very different.</li>
        </ul>
      </details>

      {!data ? (
        <p style={{ ...para, color: COLORS.inkSoft }}>Loading the figures…</p>
      ) : (
        <>
          <div style={{ margin: "18px 0 6px" }}>
            <Segmented label="What to look at" value={tab} onChange={setTab} options={TABS} />
          </div>
          <div style={{ marginTop: 10 }}>
            {tab === "arrests" && <Arrests data={data} accent={accent} />}
            {tab === "what" && <WhatFor data={data} accent={accent} />}
            {tab === "victims" && <Victims data={data} accent={accent} />}
            {tab === "prison" && <Prison data={data} accent={accent} />}
            {tab === "income" && <Income data={data} accent={accent} />}
          </div>
          <p style={{ ...small, marginTop: 20 }}>
            Sources: <a href={data.sources.arrests.url} style={{ color: "inherit" }}>Home Office arrests</a> and <a href={data.sources.stopSearch.url} style={{ color: "inherit" }}>stop and search</a> and <a href={data.sources.reoffending.url} style={{ color: "inherit" }}>reoffending</a> (via GOV.UK Ethnicity facts and figures); <a href={data.sources.ethnicityCjs.url} style={{ color: "inherit" }}>Statistics on Ethnicity and the Criminal Justice System 2024</a> (Ministry of Justice: legal aid cases and the prison population); and the <a href={data.sources.csew.url} style={{ color: "inherit" }}>Crime Survey for England and Wales</a> (ONS). England and Wales only. Contains public sector information licensed under the Open Government Licence v3.0.
          </p>
        </>
      )}
    </section>
  );
}

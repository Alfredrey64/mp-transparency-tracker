// The Your Council overview: the finder, the whole-country summary and who changed hands.
import { useState, useMemo } from "react";
import { COLORS, FONT_BODY, FONT_DISPLAY, numeric } from "../theme";
import { longDate, searchCouncils, councilsForCodes, nationalSummary, normCouncil, CONTROL_ORDER, controlLabelOf, controlColourOf, controlTrend, changesSummary, defectionSummary, seatChanges } from "../lib/councils";
import { changesMeaning, defectionMeaning, controlTrendMeaning } from "../lib/councilMeaning";
import { IconGroup, IconSplit, IconCompare, IconChartBars, IconVote } from "./icons";
import { PartyHemicycle } from "./PartyHemicycle";
import Reveal from "./Reveal";
import WhatThisMeans from "./WhatThisMeans";
import { goCouncil, fmt, signed, scrollToId, input, linkButton } from "./councilsUi";
import { Card, SectionHead, StatCard, Chip, Arrow, Bar, MoveRow } from "./CouncilsParts";

// ---- Finding a council ------------------------------------------------------
function Finder({ index }) {
  const [postcode, setPostcode] = useState("");
  const [query, setQuery] = useState("");
  const [state, setState] = useState({ busy: false, error: null });
  const matches = useMemo(() => searchCouncils(index, query), [index, query]);

  async function lookup(e) {
    e.preventDefault();
    if (!postcode.trim()) return;
    setState({ busy: true, error: null });
    try {
      const res = await fetch(`https://api.postcodes.io/postcodes/${encodeURIComponent(postcode.trim())}`);
      const data = await res.json();
      if (!res.ok || data.status !== 200) {
        setState({ busy: false, error: "Couldn't find that postcode. Check it's a full, valid UK postcode." });
        return;
      }
      const { district, county } = councilsForCodes(index, data.result.codes);
      const main = district ?? county;
      if (!main) {
        setState({ busy: false, error: `Found the area (${data.result.admin_district ?? "unknown"}) but couldn't match it to a council in our data. Try searching by name instead.` });
        return;
      }
      setState({ busy: false, error: null });
      goCouncil(main.id, data.result.admin_ward, district && county ? county.id : null);
    } catch {
      setState({ busy: false, error: "Something went wrong looking that up. Please try again." });
    }
  }

  return (
    <div style={{ background: COLORS.paper, border: `1px solid ${COLORS.hairline}`, borderRadius: 18, padding: "18px clamp(14px, 2.4vw, 22px) 20px", boxShadow: "0 18px 40px -22px rgba(0,0,0,0.6)" }}>
      <div style={{ display: "grid", gap: 18, gridTemplateColumns: "repeat(auto-fit, minmax(min(270px, 100%), 1fr))" }}>
        <form onSubmit={lookup}>
          <label style={{ display: "block", fontFamily: FONT_BODY, fontSize: 13, fontWeight: 700, color: COLORS.ink, marginBottom: 7 }}>Find your council by postcode</label>
          <div style={{ display: "flex", gap: 8 }}>
            <input value={postcode} autoComplete="postal-code" onChange={(e) => setPostcode(e.target.value)} placeholder="e.g. E8 1DY" aria-label="Your postcode" style={input} autoComplete="postal-code" />
            <button type="submit" disabled={state.busy} style={{ fontFamily: FONT_BODY, fontSize: 14.5, fontWeight: 700, color: "#fff", background: COLORS.accent, border: "none", borderRadius: 12, padding: "0 22px", cursor: "pointer", opacity: state.busy ? 0.7 : 1 }}>
              {state.busy ? "…" : "Find"}
            </button>
          </div>
          {state.error && <div style={{ fontFamily: FONT_BODY, fontSize: 13, color: "#C0504D", marginTop: 8 }}>{state.error}</div>}
          <div style={{ fontFamily: FONT_BODY, fontSize: 11.5, color: COLORS.inkSoft, marginTop: 7 }}>Looked up once with postcodes.io. Your postcode isn't stored.</div>
        </form>
        <div>
          <label style={{ display: "block", fontFamily: FONT_BODY, fontSize: 13, fontWeight: 700, color: COLORS.ink, marginBottom: 7 }}>Or search by council name</label>
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="e.g. Hackney, Kent, Edinburgh" aria-label="Search for a council" style={input} />
          {matches.length > 0 && (
            <div style={{ marginTop: 6, border: `1px solid ${COLORS.hairline}`, borderRadius: 12, overflow: "hidden", background: COLORS.paperCard }}>
              {matches.map((c) => (
                <button key={c.id} type="button" className="nclick" onClick={() => goCouncil(c.id)} style={{ display: "flex", justifyContent: "space-between", gap: 10, width: "100%", textAlign: "left", background: "none", border: "none", borderBottom: `1px solid ${COLORS.hairline}`, borderRadius: 0, padding: "9px 12px", cursor: "pointer", color: "inherit" }}>
                  <span style={{ fontFamily: FONT_BODY, fontSize: 14, fontWeight: 600, color: COLORS.ink }}>{c.name}</span>
                  <span style={{ fontFamily: FONT_BODY, fontSize: 12, color: COLORS.inkSoft }}>{controlLabelOf(c.control_by_seats)}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export function Hero({ index, subtitle, title, kicker }) {
  return (
    <div style={{ position: "relative", overflow: "hidden", borderRadius: 26, border: `1px solid ${COLORS.hairline}`, padding: "clamp(22px, 4vw, 40px)", background: `radial-gradient(900px 340px at 92% -10%, ${COLORS.accent}33, transparent 60%), radial-gradient(520px 260px at 0% 110%, #1FA97C22, transparent 65%), ${COLORS.paperCard}` }}>
      <div aria-hidden="true" style={{ position: "absolute", inset: 0, backgroundImage: `radial-gradient(${COLORS.hairline} 1px, transparent 1px)`, backgroundSize: "22px 22px", opacity: 0.55, maskImage: "linear-gradient(180deg, #000, transparent 75%)", WebkitMaskImage: "linear-gradient(180deg, #000, transparent 75%)" }} />
      <div style={{ position: "relative" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 9, fontFamily: FONT_DISPLAY, fontSize: 14.5, fontWeight: 500, color: COLORS.accent }}>
          <span style={{ width: 16, height: 2, background: COLORS.accent }} />
          {kicker}
        </div>
        <h1 style={{ fontFamily: FONT_DISPLAY, fontSize: "clamp(30px, 5.6vw, 52px)", lineHeight: 1.05, letterSpacing: "-0.025em", color: COLORS.ink, margin: "12px 0 0", textAlign: "center", textWrap: "balance" }}>
          {title}
        </h1>
        <p style={{ fontFamily: FONT_BODY, fontSize: "clamp(15px, 1.8vw, 17px)", color: COLORS.inkSoft, lineHeight: 1.6, margin: "14px auto 24px", maxWidth: 680, textAlign: "center", textWrap: "pretty" }}>{subtitle}</p>
        <Finder index={index} />
      </div>
    </div>
  );
}

// ---- The whole country -------------------------------------------------------
export function Overview({ data }) {
  const { index, parties, trend: rawTrend, changes: rawChanges, changesByYear, defections: rawDef, latestYear } = data;
  const s = useMemo(() => nationalSummary(index, parties), [index, parties]);
  const trend = useMemo(() => controlTrend(rawTrend), [rawTrend]);
  const changes = useMemo(() => changesSummary(rawChanges), [rawChanges]);
  const def = useMemo(() => defectionSummary(rawDef, parties), [rawDef, parties]);
  const seatDelta = useMemo(() => seatChanges(s.byParty, rawDef?.previousSeats), [s.byParty, rawDef]);
  const nowCounts = trend[trend.length - 1]?.counts ?? {};
  const prevCounts = trend[trend.length - 2]?.counts ?? {};
  const nextDate = s.nextDates[0];
  const changedIds = useMemo(() => new Set(rawChanges.map((c) => c.id)), [rawChanges]);

  const [controlFilter, setControlFilter] = useState(null);
  const [search, setSearch] = useState("");
  const [showAllCouncils, setShowAllCouncils] = useState(false);
  const [showAllChanges, setShowAllChanges] = useState(false);

  const hemicycleItems = useMemo(
    () => [...index].sort((a, b) => CONTROL_ORDER.indexOf(a.control_by_seats) - CONTROL_ORDER.indexOf(b.control_by_seats)).map((c) => ({ party: controlLabelOf(c.control_by_seats), party_colour: controlColourOf(c.control_by_seats) })),
    [index]
  );
  const listed = useMemo(() => {
    const q = normCouncil(search);
    const rows = index.filter((c) => (!controlFilter || c.control_by_seats === controlFilter) && (!q || normCouncil(c.name).includes(q)));
    return showAllCouncils || q || controlFilter ? rows : rows.slice(0, 24);
  }, [index, controlFilter, search, showAllCouncils]);

  const maxFlow = Math.max(1, ...(def?.flows.slice(0, 8).map((f) => f.count) ?? [1]));
  const maxNet = Math.max(1, ...changes.net.map((r) => Math.max(r.gained, r.lost)));
  const topParty = s.byParty[0];
  const maxSeats = Math.max(1, ...seatDelta.slice(0, 8).map((p) => p.count));
  const topFlow = def?.flows[0];
  const lead = changes.net.find((r) => r.key !== "noc" && r.net > 0) ?? null;
  const defNetTop = def ? def.net.slice(0, 5) : [];
  const defNetBottom = def ? def.net.slice(-3).filter((p) => !defNetTop.includes(p)) : [];
  const defNetMax = def ? Math.max(1, ...def.net.map((p) => Math.abs(p.net))) : 1;

  const pickFromLegend = (label) => {
    const key = CONTROL_ORDER.find((k) => controlLabelOf(k) === label);
    setControlFilter((cur) => (cur === key ? null : key ?? null));
    scrollToId("all-councils");
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 26, marginTop: 26 }}>
      {/* Key numbers */}
      <div>
        <SectionHead kicker={`${latestYear} at a glance`} title="The key numbers" />
        <div className="box-row" style={{ "--n": nextDate ? 5 : 4, "--min": "170px" }}>
          <StatCard icon={IconGroup} colour="#4F46E5" value={s.councillors} label="councillors" caption={`on ${s.councils} councils across the UK. ${topParty ? `${topParty.short} is the largest party with ${fmt(topParty.count)}.` : ""}`} />
          <StatCard
            icon={IconCompare}
            colour="#E0367A"
            value={changes.total}
            label="councils changed hands"
            chip={`since ${latestYear - 1}`}
            caption={lead ? `${controlLabelOf(lead.key)} made the biggest net gain (${signed(lead.net)}).` : "Control moved from one party, or to no one."}
            target="changes"
          />
          <StatCard
            icon={IconSplit}
            colour="#E8A33D"
            value={def?.total ?? 0}
            label="councillors changed party"
            chip={def ? `since ${def.since}` : undefined}
            caption={topFlow ? `Most common: ${topFlow.fromParty.short} to ${topFlow.toParty.short} (${fmt(topFlow.count)}).` : "Compared with last year's list."}
            target="defections"
          />
          <StatCard
            icon={IconChartBars}
            colour="#2F8FBF"
            value={nowCounts.noc ?? 0}
            label="councils with no overall control"
            chip={prevCounts.noc != null ? `${signed((nowCounts.noc ?? 0) - prevCounts.noc)} on ${latestYear - 1}` : undefined}
            caption={`${Math.round(((nowCounts.noc ?? 0) / s.councils) * 100)}% of councils: no party holds more than half the seats.`}
            target="control"
          />
          {nextDate && (
            <StatCard icon={IconVote} colour="#1FA97C" value={nextDate.seats} label={`seats up on ${longDate(nextDate.date)}`} caption={`${nextDate.councils} councils vote next, the first chance to change who runs them.`} target="elections" />
          )}
        </div>
      </div>

      {/* Who controls the councils */}
      <Reveal>
        <Card id="control">
          <SectionHead kicker="Control" title="Who runs Britain's councils" blurb="Every dot is one council, coloured by the party that holds more than half its seats. Grey dots are councils where no party does. Tap a party to list its councils." />
          <div className="council-split">
            <div>
              <PartyHemicycle
                politicians={hemicycleItems}
                legendCount={10}
                onSelectParty={(name) => pickFromLegend(name)}
                rows={7}
                inner={110}
                step={17}
                seatRadius={4.4}
                centre={
                  <div>
                    <div style={{ ...numeric, fontSize: "clamp(20px, 8cqw, 40px)", fontWeight: 700, lineHeight: 1, color: COLORS.ink, letterSpacing: "-0.03em" }}>{s.councils}</div>
                    <div style={{ fontFamily: FONT_BODY, fontSize: 11.5, color: COLORS.inkSoft, marginTop: 2 }}>councils</div>
                  </div>
                }
              />
            </div>
            <div>
              <div style={{ fontFamily: FONT_BODY, fontSize: 12.5, fontWeight: 700, color: COLORS.inkSoft, marginBottom: 8 }}>Councils controlled, and the change on {latestYear - 1}</div>
              {CONTROL_ORDER.filter((k) => (nowCounts[k] ?? 0) > 0 || (prevCounts[k] ?? 0) > 0).map((k) => (
                <Bar key={k} label={controlLabelOf(k)} colour={controlColourOf(k)} fraction={(nowCounts[k] ?? 0) / Math.max(1, ...Object.values(nowCounts))} value={fmt(nowCounts[k] ?? 0)} delta={(nowCounts[k] ?? 0) - (prevCounts[k] ?? 0)} compact />
              ))}
            </div>
          </div>
        </Card>
      </Reveal>

      {/* Changed hands */}
      <Reveal>
        <Card id="changes">
          <SectionHead kicker="Changes of control" accent="#E0367A" title={`${changes.total} councils changed hands since ${latestYear - 1}`} blurb="A council changes hands when the party that holds a majority of its seats changes, or when a party loses its majority and no one replaces it." />
          <div className="council-split">
            <div>
              <div style={{ fontFamily: FONT_BODY, fontSize: 12.5, fontWeight: 700, color: COLORS.inkSoft, marginBottom: 8 }}>Gains and losses, in councils</div>
              {changes.net.map((r) => (
                <Bar key={r.key} label={controlLabelOf(r.key)} colour={controlColourOf(r.key)} fraction={Math.max(r.gained, r.lost) / maxNet} value={`${r.gained} gained · ${r.lost} lost`} compact />
              ))}
            </div>
            <div>
              <div style={{ fontFamily: FONT_BODY, fontSize: 12.5, fontWeight: 700, color: COLORS.inkSoft, marginBottom: 8 }}>The most common moves</div>
              {changes.flows.slice(0, 7).map((f) => (
                <MoveRow key={`${f.from}-${f.to}`} count={f.count} from={controlLabelOf(f.from)} to={controlLabelOf(f.to)} fromColour={controlColourOf(f.from)} toColour={controlColourOf(f.to)} />
              ))}
            </div>
          </div>
          <WhatThisMeans result={changesMeaning({ changesByYear, summary: changes })} style={{ marginTop: 18 }} />
          <div style={{ marginTop: 16 }}>
            <button type="button" onClick={() => setShowAllChanges((v) => !v)} style={linkButton}>{showAllChanges ? "Hide the list" : `See all ${changes.total} councils that changed hands`}</button>
            {showAllChanges && (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(min(280px, 100%), 1fr))", gap: 8, marginTop: 12 }}>
                {rawChanges.map((c) => (
                  <button key={c.id} type="button" className="nclick" onClick={() => goCouncil(c.id)} style={{ textAlign: "left", background: COLORS.paper, border: `1px solid ${COLORS.hairline}`, borderRadius: 12, padding: "10px 12px", cursor: "pointer", color: "inherit" }}>
                    <span style={{ display: "block", fontFamily: FONT_BODY, fontSize: 14, fontWeight: 600, color: COLORS.ink, marginBottom: 6 }}>{c.name}</span>
                    <span style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                      <Chip colour={controlColourOf(c.from)} style={{ fontSize: 11.5 }}>{controlLabelOf(c.from)}</Chip>
                      <Arrow />
                      <Chip colour={controlColourOf(c.to)} style={{ fontSize: 11.5 }}>{controlLabelOf(c.to)}</Chip>
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </Card>
      </Reveal>

      {/* Defections */}
      {def && (
        <Reveal>
          <Card id="defections">
            <SectionHead kicker="Defections" accent="#E8A33D" title={`${fmt(def.total)} councillors changed party since ${def.since}`} blurb={`Found by comparing the ${def.since} and ${latestYear} lists of councillors: the same person, in the same ward, under a different party. Many councillors who leave a party become independents.`} />
            <div className="council-split">
              <div>
                <div style={{ fontFamily: FONT_BODY, fontSize: 12.5, fontWeight: 700, color: COLORS.inkSoft, marginBottom: 8 }}>The biggest switches</div>
                {def.flows.slice(0, 8).map((f) => (
                  <MoveRow key={`${f.from}-${f.to}`} count={f.count} from={f.fromParty.short} to={f.toParty.short} fromColour={f.fromParty.colour} toColour={f.toParty.colour} bar={f.count / maxFlow} />
                ))}
              </div>
              <div>
                <div style={{ fontFamily: FONT_BODY, fontSize: 12.5, fontWeight: 700, color: COLORS.inkSoft, marginBottom: 8 }}>Net gain or loss, in councillors</div>
                {[...defNetTop, ...defNetBottom].map((p) => (
                  <Bar key={p.idx} label={p.short} colour={p.colour} fraction={Math.abs(p.net) / defNetMax} value={signed(p.net)} compact />
                ))}
                <div style={{ fontFamily: FONT_BODY, fontSize: 12.5, fontWeight: 700, color: COLORS.inkSoft, margin: "16px 0 6px" }}>Councils with the most switches</div>
                {def.byCouncil.slice(0, 5).map((c) => {
                  const council = index.find((x) => x.name === c.name);
                  return (
                    <button key={c.name} type="button" className="nclick" disabled={!council} onClick={() => council && goCouncil(council.id)} style={{ display: "flex", justifyContent: "space-between", width: "100%", textAlign: "left", background: "none", border: "none", borderTop: `1px solid ${COLORS.hairline}`, borderRadius: 0, padding: "7px 2px", cursor: "pointer", color: "inherit" }}>
                      <span style={{ fontFamily: FONT_BODY, fontSize: 14, color: COLORS.ink }}>{c.name}</span>
                      <span style={{ ...numeric, fontSize: 14.5, fontWeight: 700, color: COLORS.ink }}>{c.count}</span>
                    </button>
                  );
                })}
              </div>
            </div>
            <WhatThisMeans result={defectionMeaning({ summary: def, councillors: s.councillors })} style={{ marginTop: 18 }} caveat="The lists are snapshots, so someone who switched and switched back isn't counted." />
          </Card>
        </Reveal>
      )}

      {/* Trend */}
      <Reveal>
        <Card>
          <SectionHead kicker="Since 2016" accent="#2F8FBF" title="How control has shifted" blurb="For each year, how many of today's councils were controlled by each party, or by no one. A council is controlled when one party holds more than half its seats." />
          <ControlTrend trend={trend} />
          <WhatThisMeans result={controlTrendMeaning({ trend })} style={{ marginTop: 16 }} />
          <div style={{ display: "flex", flexWrap: "wrap", gap: "6px 16px", marginTop: 14, fontFamily: FONT_BODY, fontSize: 12.5, color: COLORS.inkSoft }}>
            <strong style={{ color: COLORS.ink }}>Councils changing hands each year:</strong>
            {changesByYear.map((c) => (
              <span key={c.year}>{c.year} <strong style={{ ...numeric, color: COLORS.ink }}>{c.count}</strong></span>
            ))}
          </div>
        </Card>
      </Reveal>

      {/* Councillors by party */}
      <Reveal>
        <Card>
          <SectionHead kicker="Councillors" accent="#4F46E5" title="Councillors by party" blurb={`Every elected councillor, and how each party's number has changed since the ${rawDef?.since ?? latestYear - 1} list. Independents and small local parties are grouped as “Independent or other”.`} />
          {seatDelta.slice(0, 9).map((p) => (
            <Bar key={p.idx} label={p.short} colour={p.colour} fraction={p.count / maxSeats} value={fmt(p.count)} delta={rawDef ? p.change : null} labelWidth={190} />
          ))}
        </Card>
      </Reveal>

      {/* Elections */}
      <Reveal>
        <Card id="elections">
          <SectionHead kicker="Elections" accent="#1FA97C" title="When councils next vote" blurb="The date each council's next election falls on. Some councils elect everyone at once; others elect a third or a half at a time." />
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(min(230px, 100%), 1fr))", gap: 12 }}>
            {s.nextDates.map((d, i) => (
              <div key={d.date} style={{ background: COLORS.paper, border: `1px solid ${i === 0 ? "#1FA97C" : COLORS.hairline}`, borderRadius: 16, padding: "14px 16px" }}>
                <div style={{ fontFamily: FONT_BODY, fontSize: 12, fontWeight: 700, color: i === 0 ? "#1FA97C" : COLORS.inkSoft }}>{i === 0 ? "Next up" : "Later"}</div>
                <div style={{ fontFamily: FONT_DISPLAY, fontSize: 19, color: COLORS.ink, margin: "3px 0 8px" }}>{longDate(d.date)}</div>
                <div style={{ fontFamily: FONT_BODY, fontSize: 13, color: COLORS.inkSoft }}>
                  <strong style={{ ...numeric, fontSize: 18, color: COLORS.ink }}>{fmt(d.seats)}</strong> seats · {d.councils} {d.councils === 1 ? "council" : "councils"}
                </div>
              </div>
            ))}
          </div>
        </Card>
      </Reveal>

      {/* Every council */}
      <Card id="all-councils">
        <SectionHead kicker="Browse" accent="#4F46E5" title="Every council" blurb="Tap one to see its councillors, ward by ward, and its recent changes." />
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 14, alignItems: "center" }}>
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Filter by name" aria-label="Filter the list of councils" style={{ ...input, maxWidth: 260, padding: "9px 14px", fontSize: 14 }} />
          {CONTROL_ORDER.filter((k) => (nowCounts[k] ?? 0) > 0).map((k) => (
            <button key={k} type="button" aria-pressed={controlFilter === k} onClick={() => setControlFilter(controlFilter === k ? null : k)} style={{ display: "flex", alignItems: "center", gap: 6, fontFamily: FONT_BODY, fontSize: 12.5, fontWeight: 600, padding: "6px 12px", borderRadius: 999, cursor: "pointer", border: `1px solid ${controlFilter === k ? controlColourOf(k) : COLORS.hairline}`, background: controlFilter === k ? `${controlColourOf(k)}26` : "transparent", color: COLORS.ink }}>
              <span style={{ width: 8, height: 8, borderRadius: "50%", background: controlColourOf(k) }} />
              {controlLabelOf(k)} <span style={{ ...numeric, color: COLORS.inkSoft }}>{nowCounts[k]}</span>
            </button>
          ))}
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(min(270px, 100%), 1fr))", gap: 10 }}>
          {listed.map((c) => {
            const colour = controlColourOf(c.control_by_seats);
            return (
              <button key={c.id} type="button" className="nclick" onClick={() => goCouncil(c.id)} style={{ textAlign: "left", background: COLORS.paper, border: `1px solid ${COLORS.hairline}`, borderLeft: `4px solid ${colour}`, borderRadius: 12, padding: "10px 13px", cursor: "pointer", color: "inherit" }}>
                <span style={{ display: "flex", justifyContent: "space-between", gap: 8, alignItems: "baseline" }}>
                  <span style={{ fontFamily: FONT_BODY, fontSize: 14.5, fontWeight: 600, color: COLORS.ink }}>{c.name}</span>
                  {changedIds.has(c.id) && <span style={{ fontFamily: FONT_BODY, fontSize: 11, fontWeight: 700, color: "#E0367A", background: "#E0367A1a", borderRadius: 999, padding: "1px 8px", whiteSpace: "nowrap" }}>Changed hands</span>}
                </span>
                <span style={{ display: "block", fontFamily: FONT_BODY, fontSize: 12.5, color: COLORS.inkSoft, marginTop: 2 }}>{c.control} · {c.total} seats</span>
              </button>
            );
          })}
        </div>
        {listed.length === 0 && <div style={{ fontFamily: FONT_BODY, fontSize: 13.5, color: COLORS.inkSoft }}>No council matches that.</div>}
        {!showAllCouncils && !search && !controlFilter && index.length > 24 && <button type="button" onClick={() => setShowAllCouncils(true)} style={{ ...linkButton, marginTop: 14 }}>Show all {index.length} councils</button>}
      </Card>
    </div>
  );
}

function ControlTrend({ trend }) {
  const keys = CONTROL_ORDER.filter((k) => trend.some((r) => r.counts[k] > 0));
  return (
    <div>
      <div style={{ display: "grid", gridTemplateColumns: `repeat(${trend.length}, minmax(0, 1fr))`, gap: 8, alignItems: "end" }}>
        {trend.map((r) => (
          <div key={r.year} style={{ display: "flex", flexDirection: "column", alignItems: "center", minWidth: 0 }}>
            <div title={keys.filter((k) => r.counts[k]).map((k) => `${controlLabelOf(k)} ${r.counts[k]}`).join(", ")} style={{ display: "flex", flexDirection: "column-reverse", width: "100%", height: 190, borderRadius: 8, overflow: "hidden", background: COLORS.paper }}>
              {keys.filter((k) => r.counts[k] > 0).map((k) => (
                <div key={k} style={{ height: `${(r.counts[k] / (r.total || 1)) * 100}%`, background: controlColourOf(k), borderTop: `1px solid ${COLORS.paperCard}` }} />
              ))}
            </div>
            <span style={{ ...numeric, fontSize: 11.5, color: COLORS.inkSoft, marginTop: 6 }}>{String(r.year).slice(2)}</span>
          </div>
        ))}
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: "6px 16px", marginTop: 14 }}>
        {keys.map((k) => (
          <span key={k} style={{ display: "flex", alignItems: "center", gap: 6, fontFamily: FONT_BODY, fontSize: 12.5, color: COLORS.inkSoft }}>
            <span style={{ width: 10, height: 10, borderRadius: 3, background: controlColourOf(k) }} />
            {controlLabelOf(k)}
          </span>
        ))}
      </div>
    </div>
  );
}

/** @jsxImportSource react */
import { useId, useState } from "react";
import { useGo } from "./useGo";
import "../../spend.css";

// Two small calculators that let a visitor set the numbers behind the campaign spending limits and see what the law allows. The amounts are in data/spendLimits.js, from the Acts.
import { LIMITS, candidateLimit, partyLimit, minimumReach } from "../../data/spendLimits";

const gbp = (n) => `£${Math.round(n).toLocaleString("en-GB")}`;

function CandidateCard({ colour }) {
  const id = useId();
  const [kind, setKind] = useState("county");
  const [voters, setVoters] = useState(72000);
  const rate = LIMITS.perVoter[kind];
  const variable = rate * voters;
  const total = candidateLimit(kind, voters);
  const top = LIMITS.candidateFixed + 0.12 * 110000;
  return (
    <section className="sp-card" style={{ "--tc": colour }} aria-labelledby={`${id}-h`}>
      <h3 id={`${id}-h`}>A candidate's limit</h3>
      <fieldset className="sp-kind">
        <legend>Type of seat</legend>
        {[["county", "County seat", "12p a voter"], ["borough", "Borough seat", "8p a voter"]].map(([k, label, sub]) => (
          <label key={k} className={kind === k ? "on" : ""}><input type="radio" name={`${id}-kind`} checked={kind === k} onChange={() => setKind(k)} /><b>{label}</b><span>{sub}</span></label>
        ))}
      </fieldset>
      <label className="sp-range" htmlFor={`${id}-v`}>
        <span>Voters on the register <b>{voters.toLocaleString("en-GB")}</b></span>
        <input id={`${id}-v`} type="range" min="30000" max="110000" step="1000" value={voters} onChange={(e) => setVoters(Number(e.target.value))} />
      </label>
      <output className="sp-out" aria-live="polite">
        <span className="sp-out-big">{gbp(total)}</span>
        <span className="sp-out-sub">the most this candidate may spend</span>
      </output>
      <div className="sp-stack" role="img" aria-label={`${gbp(LIMITS.candidateFixed)} fixed, plus ${gbp(variable)} for the voters`}>
        <i style={{ width: `${(LIMITS.candidateFixed / top) * 100}%`, background: colour }} />
        <i style={{ width: `${(variable / top) * 100}%`, background: `color-mix(in srgb, ${colour} 45%, transparent)` }} />
      </div>
      <p className="sp-sum"><b>{gbp(LIMITS.candidateFixed)}</b> for every candidate, plus <b>{rate * 100}p × {voters.toLocaleString("en-GB")} = {gbp(variable)}</b></p>
      <p className="sp-fine">At a by-election the limit is a flat {gbp(LIMITS.byElection)}. A candidate's own personal expenses do not count towards it.</p>
    </section>
  );
}

function PartyCard({ colour }) {
  const id = useId();
  const [seats, setSeats] = useState(LIMITS.gbSeats);
  const total = partyLimit(seats);
  const all = partyLimit(LIMITS.gbSeats);
  return (
    <section className="sp-card" style={{ "--tc": colour }} aria-labelledby={`${id}-h`}>
      <h3 id={`${id}-h`}>A party's limit</h3>
      <p className="sp-lead">For every constituency a party stands in, it may spend {gbp(LIMITS.party.perSeat)} on its national campaign.</p>
      <label className="sp-range" htmlFor={`${id}-s`}>
        <span>Constituencies contested in Great Britain <b>{seats}</b></span>
        <input id={`${id}-s`} type="range" min="1" max={LIMITS.gbSeats} step="1" value={seats} onChange={(e) => setSeats(Number(e.target.value))} />
      </label>
      <output className="sp-out" aria-live="polite">
        <span className="sp-out-big">{total >= 1e6 ? `£${(total / 1e6).toFixed(1)}m` : gbp(total)}</span>
        <span className="sp-out-sub">{seats === LIMITS.gbSeats ? "a party standing in every seat in Great Britain" : `${gbp(total)} in all`}</span>
      </output>
      <div className="sp-stack" role="img" aria-label={`${Math.round((total / all) * 100)} per cent of the most a party could spend`}>
        <i style={{ width: `${(total / all) * 100}%`, background: colour }} />
      </div>
      <p className="sp-sum"><b>{gbp(LIMITS.party.perSeat)} × {seats} = {gbp(total)}</b></p>
      <p className="sp-fine">A party standing in only a few seats gets a minimum for each part of Great Britain: {gbp(LIMITS.party.minimum.England)} in England (it matters up to {minimumReach("England")} seats), {gbp(LIMITS.party.minimum.Scotland)} in Scotland ({minimumReach("Scotland")} seats) and {gbp(LIMITS.party.minimum.Wales)} in Wales ({minimumReach("Wales")} seats).</p>
    </section>
  );
}

export default function SpendCalc({ colour = "#3E6E9E", partyColour = "#9C3B3B" }) {
  const [ref, go] = useGo(0.15);
  return (
    <figure ref={ref} className="sp-calc" data-go={go}>
      <div className="sp-grid">
        <PartyCard colour={partyColour} />
        <CandidateCard colour={colour} />
      </div>
      <figcaption>Move the sliders to see what the law allows. These are the limits written into the Acts, after the increase of November 2023.</figcaption>
    </figure>
  );
}

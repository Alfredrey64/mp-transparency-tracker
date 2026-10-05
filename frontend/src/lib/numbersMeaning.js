// The "what this means" sentences for the charts on Parliament in Numbers
// and the Rebels page, each worked out from the figures on the chart. Neutral
// markers throughout. Pure and tested.
import { WOMEN_POPULATION_SHARE } from "../data/referenceFigures";

const pct0 = (n) => `${Math.round(n)}%`;
const pct1 = (n) => `${(Math.round(n * 10) / 10).toFixed(1)}%`;
const fmt = (n) => Math.round(n).toLocaleString("en-GB");

// The largest party against the seats needed to win a vote.
export function seatsMeaning({ top, total, majorityLine }) {
  if (!top || !total) return null;
  const workingMajority = 2 * top.count - total;
  if (top.count >= majorityLine) {
    const big = top.count >= majorityLine * 1.15;
    return {
      marker: big ? "A large majority" : "A narrow majority",
      tone: "mid",
      text: `${top.party} holds ${fmt(top.count)} of ${fmt(total)} seats (${pct0(top.pct)}). That's ${fmt(workingMajority)} more than every other party combined, so it can pass almost anything it chooses to.`,
    };
  }
  return {
    marker: "No majority",
    tone: "mid",
    text: `${top.party} is the largest group with ${fmt(top.count)} of ${fmt(total)} seats (${pct0(top.pct)}), but ${fmt(majorityLine)} are needed for a majority, so it can't pass things on its own.`,
  };
}

// Women's share of a chamber against their share of the population.
export function womenMeaning({ womenPct, noun = "MPs" }) {
  if (!Number.isFinite(womenPct)) return null;
  const pop = WOMEN_POPULATION_SHARE.value;
  const gap = womenPct - pop;
  const marker = Math.abs(gap) <= 3 ? "Close to the population share" : gap < 0 ? "Below the population share" : "Above the population share";
  return {
    marker,
    tone: Math.abs(gap) <= 3 ? "mid" : gap < 0 ? "low" : "high",
    text: `${pct1(womenPct)} of ${noun} are women, against about ${pct0(pop)} of the UK population.${noun === "MPs" ? ` Matching the population would mean roughly ${fmt((pop / 100) * 650)} women among 650 MPs.` : " Matching the population would mean about half the seats."}`,
  };
}

// How new the House is.
export function tenureMeaning({ newMps, total, medianYears }) {
  if (!total) return null;
  const share = (newMps / total) * 100;
  const marker = share >= 40 ? "Many newcomers" : share <= 15 ? "Mostly experienced" : "A mix of new and experienced";
  return {
    marker,
    tone: "mid",
    text: `${pct0(share)} of MPs (${fmt(newMps)}) arrived in or after July 2024, so the typical MP has served only ${(Math.round(medianYears * 10) / 10).toFixed(1)} years, however long some veterans have been there.`,
  };
}

// How many seats are close contests.
export function safetyMeaning({ marginal, safe, total }) {
  if (!total) return null;
  const share = (marginal / total) * 100;
  const marker = share >= 25 ? "Many marginal seats" : share <= 10 ? "Few marginal seats" : "Some marginal seats";
  return {
    marker,
    tone: "mid",
    text: `${fmt(marginal)} seats (${pct0(share)}) were won by a lead of under 5%, so they could change hands at the next election. At the other end, ${fmt(safe)} seats were won by more than 20%, which almost never change.`,
  };
}

// The Lords has no party in control.
export function lordsMeaning({ top, total, majorityLine, crossbench }) {
  if (!top || !total) return null;
  const control = top.count >= majorityLine;
  return {
    marker: control ? "One group has a majority" : "No group has a majority",
    tone: "mid",
    text: control
      ? `${top.party} holds ${fmt(top.count)} of ${fmt(total)} seats, enough to outvote everyone else.`
      : `The largest group, ${top.party}, holds ${pct0(top.pct)} of the seats.${crossbench ? ` ${fmt(crossbench)} crossbench peers belong to no party, so a vote can swing on who they back.` : ""}`,
  };
}

// How rare rebelling is.
export function rebelsMeaning({ mpsWhoRebelled, mpsCounted, rebelPct }) {
  if (!mpsCounted) return null;
  const never = ((mpsCounted - mpsWhoRebelled) / mpsCounted) * 100;
  return {
    marker: never >= 50 ? "Rebelling is unusual" : "Rebelling is fairly common",
    tone: "mid",
    text: `Only ${pct1(rebelPct)} of votes went against the party, and ${pct0(never)} of MPs (${fmt(mpsCounted - mpsWhoRebelled)}) have never done it. Most votes are won by parties voting together.`,
  };
}

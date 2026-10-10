import { useBenchmarks } from "../lib/useBenchmarks";
import { describeAmongMps } from "../lib/interpret";
import WhatThisMeans, { Everyday } from "./WhatThisMeans";

// The "what this means" lines for the figures on an MP's profile, each
// comparing the MP with every other current MP using the daily benchmarks.

const gbp = (n) => `£${Math.round(n).toLocaleString("en-GB")}`;
const pct = (n) => `${(Math.round(n * 10) / 10).toFixed(1).replace(/\.0$/, "")}%`;
const yrs = (n) => `${Math.round(n)} year${Math.round(n) === 1 ? "" : "s"}`;

function useMine(politician, key) {
  const bench = useBenchmarks();
  const value = bench?.byMp?.[politician.id]?.[key];
  const sorted = bench?.distributions?.[key];
  return { bench, value, sorted };
}

// Total declared value: set against a day-to-day sum and against other MPs.
export function DeclaredMeaning({ politician, total }) {
  const { value, sorted } = useMine(politician, "declared");
  const result = sorted && value != null ? describeAmongMps({
    value, sorted, format: gbp, zero: "have declared nothing with a value",
    lead: (v) => `This MP has declared ${v} in total`, typical: (v) => `The typical MP has declared ${v}`, zeroSelf: "This MP has declared nothing with a value",
  }) : null;
  return (
    <div style={{ marginTop: 8, textAlign: "left", maxWidth: 560, marginLeft: "auto", marginRight: "auto" }}>
      <div style={{ textAlign: "center" }}><Everyday amount={total} style={{ display: "inline" }} /></div>
      <WhatThisMeans result={result} caveat="Declaring something is simply what the rules require. It does not mean anything is wrong." />
    </div>
  );
}

export function ExpensesMeaning({ politician }) {
  const { value, sorted } = useMine(politician, "expenses");
  const result = sorted && value != null ? describeAmongMps({
    value, sorted, format: gbp, lead: (v) => `This MP has claimed ${v} in expenses so far this financial year`, typical: (v) => `The typical MP has claimed ${v} so far`, zero: "have claimed nothing so far", zeroSelf: "This MP has claimed nothing so far this financial year",
  }) : null;
  if (!result) return null;
  return (
    <>
      <div style={{ marginTop: 10 }}><Everyday amount={value} /></div>
      <WhatThisMeans result={result} caveat="These are business costs such as staffing and travel, not pay, and each MP is compared with every other MP's total so far this year." />
    </>
  );
}

export function RebelMeaning({ politician }) {
  const { value, sorted } = useMine(politician, "rebelPct");
  const result = sorted && value != null ? describeAmongMps({
    value, sorted, format: pct, zero: "have never voted against their party",
    lead: (v) => `This MP has voted against their party in ${v} of votes`, typical: (v) => `The typical MP has done so in ${v} of votes`, zeroSelf: "This MP has never voted against their party",
  }) : null;
  return <WhatThisMeans result={result} caveat="A free vote isn't a rebellion, and the whip's instructions aren't published, so this is a proxy." style={{ marginTop: 14 }} />;
}

export function YearsMeaning({ politician }) {
  const { value, sorted } = useMine(politician, "years");
  const result = sorted && value != null ? describeAmongMps({
    value, sorted, format: yrs, zero: "have served under a year",
    lead: (v) => `This MP has served for ${v}`, typical: (v) => `The typical MP has served for ${v}`, zeroSelf: "This MP has served for under a year",
  }) : null;
  return <WhatThisMeans result={result} caveat="Some MPs have had breaks in service." />;
}


import { COLORS, FONT_BODY } from "../theme";
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
  const result = sorted && value != null ? describeAmongMps({ value, sorted, format: gbp, zero: "have declared nothing with a value" }) : null;
  return (
    <div style={{ marginTop: 8, textAlign: "left", maxWidth: 560, marginLeft: "auto", marginRight: "auto" }}>
      <div style={{ textAlign: "center" }}><Everyday amount={total} style={{ display: "inline" }} /></div>
      <WhatThisMeans result={result} caveat="A declaration is what the rules require, not a sign anything is wrong." />
    </div>
  );
}

export function ExpensesMeaning({ politician }) {
  const { value, sorted } = useMine(politician, "expenses");
  const result = sorted && value != null ? describeAmongMps({ value, sorted, format: gbp }) : null;
  if (!result) return null;
  return (
    <>
      <div style={{ marginTop: 10 }}><Everyday amount={value} /></div>
      <WhatThisMeans result={result} caveat="These are business costs so far this financial year, compared with every MP's total so far." />
    </>
  );
}

export function RebelMeaning({ politician }) {
  const { value, sorted } = useMine(politician, "rebelPct");
  const result = sorted && value != null ? describeAmongMps({ value, sorted, format: pct, zero: "have never voted against their party" }) : null;
  return <WhatThisMeans result={result} caveat="A free vote isn't a rebellion, and the whip's instructions aren't published, so this is a proxy." style={{ marginTop: 14 }} />;
}

export function YearsMeaning({ politician }) {
  const { value, sorted } = useMine(politician, "years");
  const result = sorted && value != null ? describeAmongMps({ value, sorted, format: yrs, zero: "have served under a year" }) : null;
  return <WhatThisMeans result={result} caveat="Some MPs have had breaks in service." />;
}

export function MeaningNote({ children }) {
  return <p style={{ fontFamily: FONT_BODY, fontSize: 11.5, color: COLORS.inkSoft, lineHeight: 1.55, margin: "8px 0 0" }}>{children}</p>;
}

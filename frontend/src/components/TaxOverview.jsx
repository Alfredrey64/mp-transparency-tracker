import { Suspense, lazy, useState } from "react";
import { COLORS, FONT_BODY, FONT_DISPLAY } from "../theme";
import { LOADERS } from "../pageLoaders";
import TaxToday from "./TaxToday";
import TaxComingUp from "./TaxComingUp";
import Loading from "./Loading";

// The first view on the Taxes page: the main rates today, what has already been decided, then how much the government collects and spends.
// The last part is the same set of Office for National Statistics figures that used to be its own page.

const SectorPage = lazy(LOADERS.tax);

export default function TaxOverview({ param, onPick }) {
  const [now] = useState(() => Date.now());
  return (
    <div>
      <TaxToday now={now} onPick={onPick} />
      <TaxComingUp now={now} />
      <section aria-labelledby="h-tax-money" style={{ marginTop: 34 }}>
        <h2 id="h-tax-money" style={{ fontFamily: FONT_DISPLAY, fontSize: 19, fontWeight: 700, color: COLORS.ink, margin: 0 }}>How much is collected and spent</h2>
        <p style={{ fontFamily: FONT_BODY, fontSize: 14.5, lineHeight: 1.55, color: COLORS.inkSoft, margin: "4px 0 0", maxWidth: 780 }}>
          Official figures for the whole UK from the Office for National Statistics: what each tax brings in, what the government spends it on, and how each £1 is split.
        </p>
        <Suspense fallback={<Loading />}>
          <SectorPage sector="tax" param={param} embedded />
        </Suspense>
      </section>
    </div>
  );
}

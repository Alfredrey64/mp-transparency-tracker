import { Suspense, lazy, useEffect, useRef, useState } from "react";
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
  // The long statistics section is only started when it is about to scroll into view (or at once when a shared link points into it), so loading it
  // does not hold up the first screen.
  const [showMoney, setShowMoney] = useState(Boolean(param));
  const anchor = useRef(null);
  useEffect(() => {
    const el = anchor.current;
    if (showMoney || !el || typeof IntersectionObserver === "undefined") return undefined;
    const io = new IntersectionObserver((entries) => { if (entries.some((e) => e.isIntersecting)) { setShowMoney(true); io.disconnect(); } }, { rootMargin: "900px 0px" });
    io.observe(el);
    return () => io.disconnect();
  }, [showMoney]);
  return (
    <div>
      <TaxToday now={now} onPick={onPick} />
      <TaxComingUp now={now} />
      <section aria-labelledby="h-tax-money" style={{ marginTop: 34 }}>
        <h2 id="h-tax-money" style={{ fontFamily: FONT_DISPLAY, fontSize: 19, fontWeight: 700, color: COLORS.ink, margin: 0 }}>How much is collected and spent</h2>
        <p style={{ fontFamily: FONT_BODY, fontSize: 14.5, lineHeight: 1.55, color: COLORS.inkSoft, margin: "8px 0 0", maxWidth: 780 }}>
          Official figures for the whole UK from the Office for National Statistics: what each tax brings in, what the government spends it on, and how each £1 is split.
        </p>
        <div ref={anchor} style={{ minHeight: showMoney ? undefined : 600 }}>
          {(showMoney || typeof IntersectionObserver === "undefined") && (
            <Suspense fallback={<Loading />}>
              <SectorPage sector="tax" param={param} embedded />
            </Suspense>
          )}
        </div>
      </section>
    </div>
  );
}

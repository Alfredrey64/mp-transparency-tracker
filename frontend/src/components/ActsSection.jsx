/** @jsxImportSource react */
import ACTS from "../data/acts.json";
import ActsPassed from "./story/ActsPassed";
import { COLORS, FONT_DISPLAY, FONT_BODY } from "../theme";
import { IconGavel } from "./icons";

// The year's Acts of Parliament, shown on the Bills page under the bill journey (it used to sit at the end of the "How a law is made" page). It is its own file so the page can load it
// after the list of bills, and the figures come from data/acts.json, rebuilt every day from legislation.gov.uk.
export default function ActsSection() {
  return (
    <section className="acs" aria-labelledby="acs-title">
      <div className="acs-head">
        <span className="acs-ico" aria-hidden="true"><IconGavel size={20} /></span>
        <div>
          <h2 id="acs-title" style={{ margin: 0, fontFamily: FONT_DISPLAY, fontSize: 20, fontWeight: 600, color: COLORS.ink }}>The Acts that have become law in {ACTS.year}</h2>
          <p style={{ margin: "6px 0 0", fontFamily: FONT_BODY, fontSize: 13.5, lineHeight: 1.5, color: COLORS.inkSoft }}>
            A bill becomes an Act when it has passed both Houses and received Royal Assent. This is how many have made it through this year, and when. Source: <a href="https://www.legislation.gov.uk/ukpga" target="_blank" rel="noreferrer">legislation.gov.uk<span className="sr-only"> (opens in a new tab)</span></a>, last read {ACTS.fetchedAt}.
          </p>
        </div>
      </div>
      <ActsPassed data={ACTS} />
    </section>
  );
}

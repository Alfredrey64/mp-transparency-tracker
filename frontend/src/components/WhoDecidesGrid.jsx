import "../whodecides.css";

// A grid of policy areas against the four places that can decide them. It restates only what the "Who decides what" lists beside it already say (from the Scotland Act 1998,
// the Wales Act 2017 and the Northern Ireland Act 1998), so a reader can see the pattern at a glance. Every cell has its word as well as its colour.
const W = "Westminster", D = "Devolved", P = "Partly";
const ROWS = [
  { area: "Health and social care", cells: [[D], [D], [D]] },
  { area: "Education and schools", cells: [[D], [D], [D]] },
  { area: "Housing, planning and the environment", cells: [[D], [D], [D]] },
  { area: "Most transport", cells: [[D], [D], [D]] },
  { area: "Justice and policing", cells: [[D], [W, "stays with Westminster"], [D]] },
  { area: "Income tax", cells: [[D, "rates and bands, on earnings"], [P, "rates within the UK bands"], [W]] },
  { area: "Welfare benefits", cells: [[P, "some paid by Scotland"], [W, "mostly"], [W, "mostly"]] },
  { area: "Defence, foreign policy and national security", cells: [[W], [W], [W]] },
  { area: "Immigration, trade, the currency and interest rates", cells: [[W], [W], [W]] },
];
const PLACES = ["Scotland", "Wales", "Northern Ireland"];
const CLASS = { [W]: "w", [D]: "d", [P]: "p" };

export default function WhoDecidesGrid() {
  return (
    <figure className="wd" aria-label="Who decides what, by policy area and by place">
      <p className="wd-key" aria-hidden="true"><span><i className="d" />Decided by the devolved government</span><span><i className="p" />Partly devolved</span><span><i className="w" />Decided at Westminster</span></p>
      <ul className="wd-rows">
        {ROWS.map((r) => (
          <li key={r.area} className="wd-row">
            <h4>{r.area}</h4>
            <ul className="wd-cells">
              {r.cells.map(([word, note], i) => (
                <li key={PLACES[i]} className={`wd-cell ${CLASS[word]}`}>
                  <span className="wd-place">{PLACES[i]}</span>
                  <b>{word}</b>
                  {note && <small>{note}</small>}
                </li>
              ))}
            </ul>
          </li>
        ))}
      </ul>
      <figcaption>A summary of the lists below, not the law. Some powers are shared, and Westminster can still legislate on devolved matters.</figcaption>
    </figure>
  );
}

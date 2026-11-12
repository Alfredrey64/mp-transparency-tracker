/** @jsxImportSource react */
import { useGo } from "./useGo";
import "../../spend.css";

// When spending counts. A party's limit covers the 365 days up to polling day; a candidate's covers only the time after they became a candidate. The bars are an illustration of
// the two windows, not to scale (the candidate bar's length differs for every candidate). The 2024 dates are the Electoral Commission's.
const MONTHS = ["Jul 2023", "Oct 2023", "Jan 2024", "Apr 2024", "4 Jul 2024"];

export default function SpendWindow({ colour = "#9C3B3B", candidateColour = "#3E6E9E" }) {
  const [ref, go] = useGo(0.25);
  return (
    <figure ref={ref} className="sp-win" data-go={go}>
      <div className="sp-win-row" style={{ "--tc": colour }}>
        <p className="sp-win-name"><b>A party</b><span>365 days ending on polling day</span></p>
        <div className="sp-win-track"><i className="sp-win-bar" style={{ left: 0, right: 0 }} /><em>6 July 2023 to 4 July 2024</em></div>
      </div>
      <div className="sp-win-row" style={{ "--tc": candidateColour }}>
        <p className="sp-win-name"><b>A candidate</b><span>from the day after becoming a candidate</span></p>
        <div className="sp-win-track"><i className="sp-win-bar fade" style={{ left: "62%", right: 0 }} /><em>Until 4 July 2024</em></div>
      </div>
      <div className="sp-win-axis" aria-hidden="true">{MONTHS.map((m) => <span key={m}>{m}</span>)}</div>
      <div className="sp-win-pole" aria-hidden="true"><i /><span>Polling day</span></div>
      <figcaption>The party window is set by law. A candidate's depends on when they were chosen, so the bar is only an illustration. If a general election follows another within 365 days, a party's window starts the day after the earlier poll.</figcaption>
    </figure>
  );
}

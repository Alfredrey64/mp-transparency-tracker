import { useRef, useState } from "react";
import { COLORS, FONT_BODY } from "../theme";
import { pillStyle } from "../lib/onsStyles";
import { downloadCsv } from "../lib/csv";
import { saveChartImage } from "../lib/chartImage";

// Copy a link to this chart, save it as a picture, or download the figures behind it.
// `getInfo` is called when a button is pressed, so it always reflects what is on screen.
//   getInfo() -> { url, title, sentence, source, accent, legend, filename, csv: { filename, text } }
export default function ChartActions({ cardId, getInfo }) {
  const [note, setNote] = useState("");
  const timer = useRef(null);

  const say = (text) => {
    setNote(text);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setNote(""), 3200);
  };

  async function copyLink() {
    const { url, title } = getInfo();
    try {
      if (navigator.share && window.matchMedia("(pointer: coarse)").matches) {
        await navigator.share({ title, url });
        return;
      }
      await navigator.clipboard.writeText(url);
      say("Link copied. It opens this chart with the same settings.");
    } catch (e) {
      if (e?.name === "AbortError") return;
      window.prompt("Copy this link", url);
    }
  }

  async function saveImage() {
    const info = getInfo();
    const svg = document.querySelector(`#${cardId} svg[role="img"]`);
    if (!svg) { say("The chart is not ready yet."); return; }
    try {
      say("Making the picture…");
      await saveChartImage({
        svg, title: info.title, sentence: info.sentence, source: info.source, accent: info.accent, legend: info.legend, filename: info.filename,
        colours: { paper: COLORS.paperCard, ink: COLORS.ink, inkSoft: COLORS.inkSoft, hairline: COLORS.hairline },
      });
      say("Picture saved.");
    } catch {
      say("Sorry, the picture could not be made in this browser.");
    }
  }

  function downloadData() {
    const { csv } = getInfo();
    downloadCsv(csv.filename, csv.text);
    say("Figures downloaded as a spreadsheet file.");
  }

  const style = { ...pillStyle(false), textDecoration: "none" };
  return (
    <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: "8px 10px" }}>
      <button type="button" className="ons-tap" style={style} onClick={copyLink}>Copy link</button>
      <button type="button" className="ons-tap" style={style} onClick={saveImage}>Save as picture</button>
      <button type="button" className="ons-tap" style={style} onClick={downloadData}>Download data</button>
      <span role="status" aria-live="polite" style={{ fontFamily: FONT_BODY, fontSize: 12.5, color: COLORS.inkSoft }}>{note}</span>
    </div>
  );
}

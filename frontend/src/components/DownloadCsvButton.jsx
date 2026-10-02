import { useState } from "react";
import { COLORS, FONT_BODY } from "../theme";
import { toCsv, csvFilename, downloadCsv } from "../lib/csv";

// A quiet text button that downloads a table as a CSV file. Pass `rows`
// when they're already on the page, or `loadRows` (async) when they have to
// be fetched first — the label changes while that's happening, and a
// failure says so rather than doing nothing.
export default function DownloadCsvButton({ label, slug, columns, rows, loadRows, style }) {
  const [status, setStatus] = useState("idle");

  async function handleClick() {
    setStatus("busy");
    try {
      const data = loadRows ? await loadRows() : rows;
      downloadCsv(csvFilename(slug), toCsv(data ?? [], columns));
      setStatus("idle");
    } catch {
      setStatus("error");
    }
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={status === "busy"}
      style={{
        background: "none", border: "none", padding: 0, cursor: status === "busy" ? "progress" : "pointer",
        fontFamily: FONT_BODY, fontSize: 12.5, fontWeight: 700, color: status === "error" ? "#9C3B3B" : COLORS.accent, ...style,
      }}
    >
      {status === "busy" ? "Preparing the file…" : status === "error" ? "Couldn't prepare that — try again" : `${label} ↓`}
    </button>
  );
}

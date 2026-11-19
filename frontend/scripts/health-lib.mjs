// Turns the rows of the Care Quality Commission's "Latest ratings" workbook (one row for each location, service and question) into one short record for each GP surgery, care
// home, hospital and other health service, ready to be placed on the map by its postcode. Pure functions, no network, so they can be tested. Written for
// scripts/build-health-services.mjs.

// The workbook's own category names, and the short code the page uses. Homecare agencies and dentists are left out: the first have no place a visitor would go to, and the
// CQC does not give dentists ratings.
export const CATEGORY = {
  "Residential social care": "CH",
  "GP Practices": "GP",
  "Acute hospital - NHS non-specialist": "HO",
  "Acute hospital - NHS specialist": "HO",
  "Acute hospital - Independent non-specialist": "HO",
  "Acute hospital - Independent specialist": "HO",
  "Mental health - community & hospital - independent": "MH",
  "Mental health - community & residential - NHS": "MH",
  "Hospice services": "HS",
  "Community health - NHS & Independent": "CO",
  "Urgent care services & mobile doctors": "UC",
  "Out of hours": "UC",
};

// The CQC's four ratings, as one letter each. Anything else ("Not rated", "No approved rating") means no rating.
export const RATING = { Outstanding: "O", Good: "G", "Requires improvement": "R", Inadequate: "I" };

// The five key questions in the order a record stores them, after the overall rating.
export const QUESTIONS = ["Safe", "Effective", "Caring", "Responsive", "Well-led"];

// "20/04/2022" -> "2022-04"
export const monthOf = (dmy) => {
  const m = /^(\d\d)\/(\d\d)\/(\d{4})$/.exec(String(dmy ?? "").trim());
  return m ? `${m[3]}-${m[2]}` : "";
};

// Reads the workbook's header row into a function that finds a column by name, so a reordered workbook still reads correctly.
export function columns(headerRow) {
  const at = (name) => headerRow.findIndex((h) => String(h ?? "").trim() === name);
  const col = {
    id: at("Location ID"), name: at("Location Name"), category: at("Location Primary Inspection Category"), postcode: at("Location Post Code"), group: at("Service / Population Group"),
    domain: at("Domain"), rating: at("Latest Rating"), date: at("Publication Date"), type: at("Location Type"),
  };
  return Object.values(col).some((c) => c < 0) ? null : col;
}

// Collects the "Overall" rows of every location into one record each. Feed it rows in file order with add(); read the result with records().
export function collector(col) {
  const byId = new Map();
  return {
    add(row) {
      if (!row || String(row[col.group] ?? "").trim() !== "Overall") return;
      const category = CATEGORY[String(row[col.category] ?? "").trim()];
      if (!category) return;
      const id = String(row[col.id] ?? "").trim();
      const domain = String(row[col.domain] ?? "").trim();
      if (!id || ![...QUESTIONS, "Overall"].includes(domain)) return;
      let rec = byId.get(id);
      if (!rec) { rec = { id, n: String(row[col.name] ?? "").trim(), t: category, pc: String(row[col.postcode] ?? "").trim().toUpperCase(), ratings: {}, date: "" }; byId.set(id, rec); }
      rec.ratings[domain] = RATING[String(row[col.rating] ?? "").trim()] ?? "-";
      if (domain === "Overall") rec.date = monthOf(row[col.date]);
    },
    // A record needs an overall rating to be shown. `q` is the five questions in order, with "-" where there is none.
    records() {
      return [...byId.values()].filter((r) => r.pc && r.ratings.Overall && r.ratings.Overall !== "-").map((r) => ({
        i: r.id, n: r.n, t: r.t, pc: r.pc, o: r.ratings.Overall, q: QUESTIONS.map((k) => r.ratings[k] ?? "-").join(""), d: r.date,
      }));
    },
  };
}

// Who else holds elected office where a postcode is, besides the MP and the council: the police commissioner (or the mayor who does that job), the
// regional mayor, and the members of the Senedd, Scottish Parliament or Northern Ireland Assembly. The names come from data/representatives.json, which
// the data script rebuilds from public lists and stamps with the date it was checked. Pure and tested.

// postcodes.io writes some forces' names differently from the lists.
const FORCE_ALIASES = { "Cambridgeshire": "Cambridgeshire and Peterborough", "Devon & Cornwall": "Devon, Cornwall and The Isles of Scilly" };

// Forces whose commissioner's job is done by a mayor: the force name, and the start of the mayor's authority as the list writes it.
const MAYOR_POLICED = { "Metropolitan Police": "Greater London Authority", "Greater Manchester": "Greater Manchester", "South Yorkshire": "South Yorkshire", "West Yorkshire": "West Yorkshire", "North Yorkshire": "York and North Yorkshire" };

// Northern Ireland's Assembly still uses the constituencies as they were before the 2024 boundary review, with these names.
const ASSEMBLY_NAME = {
  "Belfast East": "East Belfast", "Belfast North": "North Belfast", "Belfast South and Mid Down": "South Belfast", "Belfast West": "West Belfast",
};

const partyColours = [
  [/co-op|labour/i, "#d50000"], [/conservative/i, "#0063ba"], [/reform/i, "#12b6cf"], [/liberal democrat/i, "#fc7d0b"], [/green/i, "#4ea72e"],
  [/plaid/i, "#348837"], [/national party|snp/i, "#d9b900"], [/sinn/i, "#326760"], [/democratic unionist|dup/i, "#c4543a"], [/alliance/i, "#d9a400"],
  [/ulster unionist|uup/i, "#3b8fd9"], [/sdlp|social democratic/i, "#2aa82c"], [/traditional unionist|tuv/i, "#0a4c8b"],
];
export const partyHue = (name) => partyColours.find(([re]) => re.test(name ?? ""))?.[1] ?? "#8a94a6";

// Shorter names for the long ones the Scottish Parliament uses.
export const partyShort = (name) => String(name ?? "").replace(/^Scottish (Conservative and Unionist Party)$/i, "Scottish Conservative").replace(/ Party$/i, "").replace(/^Scottish Green$/i, "Scottish Green");

const findMayor = (mayors, start) => mayors.find((m) => m.authority.toLowerCase().startsWith(start.toLowerCase())) ?? null;

// The police: who answers for the force. `kind` says what sort of body it is so the page can say it in the right words.
export function policeFor({ pfa, country }, reps) {
  if (country === "Scotland") return { force: "Police Scotland", kind: "scotland" };
  if (country === "Northern Ireland") return { force: "Police Service of Northern Ireland", kind: "ni" };
  if (!pfa) return null;
  if (pfa === "City of London") return { force: "City of London Police", kind: "city" };
  const lead = MAYOR_POLICED[pfa];
  if (lead) {
    const mayor = findMayor(reps.mayors, lead);
    return { force: pfa === "Metropolitan Police" ? "Metropolitan Police" : `${pfa} Police`, kind: "mayor", person: mayor ? { name: mayor.name, party: mayor.party } : null, post: mayor?.post ?? null };
  }
  const key = FORCE_ALIASES[pfa] ?? pfa;
  const pcc = reps.pcc[key];
  return { force: `${key} Police`.replace(/^Dyfed-Powys Police$/, "Dyfed-Powys Police"), kind: "commissioner", person: pcc ?? null };
}

// The regional mayor, for a postcode in England, from the council's code. A council inside an authority with no mayor yet gets the authority's name only.
export function mayorFor({ country, districtCode }, reps) {
  if (country !== "England" || !districtCode) return null;
  if (/^E09/.test(districtCode)) {
    const m = findMayor(reps.mayors, "Greater London Authority");
    return m ? { authority: "Greater London Authority", post: m.post, person: { name: m.name, party: m.party } } : null;
  }
  const name = reps.councilAuthority[districtCode];
  if (!name) return null;
  const m = findMayor(reps.mayors, name);
  return m ? { authority: m.authority, post: m.post, person: { name: m.name, party: m.party } } : { authority: name, post: null, person: null };
}

// Members of the Senedd, Scottish Parliament or Assembly. `holyroodSeat` is the constituency found from the postcode's position, which only Scotland needs.
export function devolvedFor({ country, senedd, westminster, holyroodSeat }, reps) {
  if (country === "Wales") {
    const list = reps.senedd[senedd];
    return list ? { body: "Senedd", seat: senedd, members: list, note: "Each Senedd constituency elects six members." } : null;
  }
  if (country === "Scotland") {
    const c = reps.scotland.constituencies[holyroodSeat];
    if (!c) return null;
    const regional = reps.scotland.regions[c.region] ?? [];
    return { body: "Scottish Parliament", seat: holyroodSeat, region: c.region, constituencyMember: c.msp, regional, members: [c.msp, ...regional], note: "You have one constituency MSP and seven regional MSPs." };
  }
  if (country === "Northern Ireland") {
    const name = ASSEMBLY_NAME[westminster] ?? westminster;
    const list = reps.ni[name];
    return list ? { body: "Northern Ireland Assembly", seat: name, members: list, note: "Each Assembly constituency elects five members. The Assembly still uses the boundaries from before 2024, so a postcode close to an edge may sit in the next constituency." } : null;
  }
  return null;
}

export const NI_CONSTITUENCY_NAMES = Object.values(ASSEMBLY_NAME);

// The Scottish Parliament's constituency for a point, from the ONS map service. Null if the service does not answer.
const SPC_URL = "https://services1.arcgis.com/ESMARspQHYMw9BZ9/arcgis/rest/services/SPC_MAY_2026_SC_BGC/FeatureServer/0/query";
export async function holyroodSeatAt(longitude, latitude, fetcher = fetch) {
  try {
    const url = `${SPC_URL}?geometry=${longitude},${latitude}&geometryType=esriGeometryPoint&inSR=4326&spatialRel=esriSpatialRelIntersects&outFields=SPC26NM&returnGeometry=false&f=json`;
    const res = await fetcher(url);
    if (!res.ok) return null;
    const json = await res.json();
    return json.features?.[0]?.attributes?.SPC26NM ?? null;
  } catch { return null; }
}

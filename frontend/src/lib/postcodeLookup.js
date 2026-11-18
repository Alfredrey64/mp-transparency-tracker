// The postcode lookup shared by the pages that answer "what is near me?". A postcode is sent to postcodes.io once, and is kept only in this browser (the same place, and the same
// key, as the Your area and My MP pages), so a visitor who has entered it there is not asked again. It is never sent to this site.

export const POSTCODE_KEY = "mp-transparency-my-postcode";

export function savedPostcode() {
  try { return localStorage.getItem(POSTCODE_KEY) ?? ""; } catch { return ""; }
}

export function savePostcode(value) {
  try { if (value) localStorage.setItem(POSTCODE_KEY, value); else localStorage.removeItem(POSTCODE_KEY); } catch { /* storage is blocked: the page still works */ }
}

export const cleanPostcode = (s) => String(s ?? "").toUpperCase().replace(/[^A-Z0-9]/g, "").replace(/^(.+)(\d[A-Z]{2})$/, "$1 $2");

// The postcode's position and the codes of the council areas it is in. Rejects with Error("postcode") for one that does not exist.
export async function lookUpPostcode(postcode) {
  const res = await fetch(`https://api.postcodes.io/postcodes/${encodeURIComponent(postcode.trim())}`);
  const json = await res.json().catch(() => ({}));
  if (!res.ok || json.status !== 200) throw new Error(res.status === 404 ? "postcode" : "network");
  const r = json.result;
  return { postcode: r.postcode, lat: r.latitude, lon: r.longitude, country: r.country, codes: r.codes, ward: r.admin_ward, district: r.admin_district };
}

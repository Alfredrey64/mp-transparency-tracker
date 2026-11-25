import { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";

// Several pages name an MP the way a Parliament list does ("Rosena Allin-Khan MP", "Neil Shastri-Hurst") while the MPs table keeps the title with the name ("Dr Rosena Allin-Khan"). Looking a
// name up exactly misses those, so the two are compared with titles and a trailing "MP" taken off. A name that matches nobody, or more than one person, is left unmatched: a wrong
// guess would send a reader to the wrong profile, and an unmatched name simply keeps its initials and no link.
const TITLE = /^((rt\.? hon\.?|right hon\.?|dr\.?|sir|dame|mr\.?|mrs\.?|ms\.?|miss|prof\.?|professor|rev\.?|reverend)\s+)+/i;
export const plainName = (n) => String(n ?? "").replace(/\s+MP$/i, "").replace(TITLE, "").replace(/\s+/g, " ").trim().toLowerCase();
const orSafe = (t) => String(t).replace(/[,()"\\*%_]/g, " ").replace(/\s+/g, " ").trim();

const seen = new Map(); // plain name -> { id, name, colour, photo } or null once looked up

// names: strings as written on the page. Returns { [name as written]: { id, name, colour, photo } } for the ones that matched exactly one MP.
export async function findMps(names) {
  const wanted = [...new Set(names.map(plainName).filter(Boolean))];
  const todo = wanted.filter((n) => !seen.has(n));
  if (todo.length) {
    const asWritten = new Map(names.map((n) => [plainName(n), orSafe(String(n).replace(/\s+MP$/i, "").replace(TITLE, ""))]));
    const { data } = await supabase.from("politicians").select("id, name, party_colour, thumbnail_url").or(todo.map((n) => `name.ilike.*${asWritten.get(n)}`).join(","));
    const byPlain = new Map();
    for (const r of data ?? []) {
      const k = plainName(r.name);
      byPlain.set(k, [...(byPlain.get(k) ?? []), r]);
    }
    for (const n of todo) {
      const rows = byPlain.get(n) ?? [];
      seen.set(n, rows.length === 1 ? { id: rows[0].id, name: rows[0].name, colour: rows[0].party_colour, photo: rows[0].thumbnail_url } : null);
    }
  }
  const out = {};
  for (const n of names) {
    const hit = seen.get(plainName(n));
    if (hit) out[n] = hit;
  }
  return out;
}

export function useMpFaces(names) {
  const key = names.join("|");
  const [found, setFound] = useState({});
  useEffect(() => {
    let off = false;
    if (!key) return undefined;
    findMps(key.split("|")).then((r) => { if (!off) setFound(r); }).catch(() => { /* the page works without the lookup */ });
    return () => { off = true; };
  }, [key]);
  return found;
}

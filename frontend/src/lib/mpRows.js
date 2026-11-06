import { supabase } from "../supabaseClient";

// A list of MPs needs a name, party and seat, not the whole profile. Biography, contact details, recent activity and expenses are nearly all of the table's weight
// (about 6.3 MB of it for the 650 MPs), so lists ask for these columns only and a profile fetches the full row when it is opened.
export const MP_LIST_COLUMNS = "id, parliament_member_id, name, party, party_abbreviation, party_colour, constituency, gender, thumbnail_url, membership_start_date, cabinet_role, cabinet_role_start_date";

// A row from `select("*")` always carries both profile columns, even when they are empty, so their presence says the row is the whole one.
export const hasFullRow = (mp) => mp != null && "recent_activity" in mp && "ipsa_expenses" in mp;

// The whole row for an MP who has been picked from a list. If it cannot be fetched, the row already in hand is used, so opening a profile never fails outright.
export async function fullRow(mp) {
  if (!mp || hasFullRow(mp) || mp.id == null) return mp;
  const { data } = await supabase.from("politicians").select("*").eq("id", mp.id).single();
  return data?.id ? data : mp;
}

// The same for the House of Lords: a list of peers leaves out the biography, ministerial and committee history, recent activity and the Wikipedia text (over 5.5 MB of the table's 5.7 MB for 818 peers).
export const PEER_LIST_COLUMNS = "id, name, party, party_colour, peerage_type, membership_start_date, thumbnail_url, gender, government_role, government_role_start_date";

export const hasFullPeer = (peer) => peer != null && "recent_activity" in peer && "committees" in peer && "wikipedia_bio" in peer && "ministerial_history" in peer && "biography" in peer;

export async function fullPeer(peer) {
  if (!peer || hasFullPeer(peer) || peer.id == null) return peer;
  const { data } = await supabase.from("peers").select("*").eq("id", peer.id).single();
  return data?.id ? data : peer;
}

// Start Here asks "who's your MP?" once; this keeps the answer so coming
// back from a bill, a vote or a profile doesn't make a visitor pick again.
// Stored in the browser only (localStorage) and holds just the public
// details needed to rebuild the page — never anything about the visitor.

const KEY = "mpTracker.rememberedSeat.v1";

function defaultStorage() {
  try {
    return globalThis.localStorage ?? null;
  } catch {
    return null; // blocked (private mode, strict settings)
  }
}

const valid = (v) => v && typeof v.name === "string" && v.mp && typeof v.mp.memberId === "number" && typeof v.mp.name === "string";

export function readRememberedSeat(storage = defaultStorage()) {
  try {
    const parsed = JSON.parse(storage?.getItem(KEY) ?? "null");
    return valid(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

// seat: { name, mp: { memberId, name, party, colour } }
export function rememberSeat(seat, storage = defaultStorage()) {
  if (!valid(seat)) return;
  try {
    storage?.setItem(KEY, JSON.stringify({ name: seat.name, mp: { memberId: seat.mp.memberId, name: seat.mp.name, party: seat.mp.party ?? null, colour: seat.mp.colour ?? null } }));
  } catch {
    /* storage full or blocked: the page still works, it just forgets */
  }
}

export function forgetSeat(storage = defaultStorage()) {
  try {
    storage?.removeItem(KEY);
  } catch {
    /* nothing to do */
  }
}

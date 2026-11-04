import { WATCHLIST_EVENT } from "./watchlist";

// A per-visitor "bills I'm following" list, kept in localStorage only, like the list of MPs: no account and nothing sent anywhere. Each entry remembers where the bill
// stood when it was last looked at, so the Watchlist can say what has moved since.
const KEY = "mp-tracker-bill-watch";

function readAll() {
  try {
    const raw = localStorage.getItem(KEY);
    const list = raw ? JSON.parse(raw) : [];
    return Array.isArray(list) ? list : [];
  } catch {
    return [];
  }
}

function writeAll(list) {
  try {
    localStorage.setItem(KEY, JSON.stringify(list));
  } catch {
    // Private browsing / storage disabled: the toggle just won't persist.
  }
  try {
    window.dispatchEvent(new Event(WATCHLIST_EVENT));
  } catch {
    // No window (tests): nothing is listening.
  }
}

export const getWatchedBills = () => readAll();

export const isBillWatched = (billId) => readAll().some((b) => b.bill_id === billId);

// The bill as it stands now becomes the baseline. Returns true when the bill is now followed.
export function toggleWatchBill(bill, now = Date.now()) {
  const list = readAll();
  if (list.some((b) => b.bill_id === bill.bill_id)) {
    writeAll(list.filter((b) => b.bill_id !== bill.bill_id));
    return false;
  }
  writeAll([...list, { bill_id: bill.bill_id, title: bill.short_title, stage: bill.current_stage ?? null, is_act: !!bill.is_act, is_defeated: !!bill.is_defeated, since: now }]);
  return true;
}

export const removeWatchedBill = (billId) => writeAll(readAll().filter((b) => b.bill_id !== billId));

// What has moved on a followed bill since it was last looked at, or null when nothing has. `current` is the bill's row now.
export function billChange(entry, current) {
  if (!entry || !current) return null;
  const becameLaw = !entry.is_act && !!current.is_act;
  const defeated = !entry.is_defeated && !!current.is_defeated;
  const moved = (entry.stage ?? null) !== (current.current_stage ?? null);
  if (!becameLaw && !defeated && !moved) return null;
  return { from: entry.stage ?? null, to: current.current_stage ?? null, becameLaw, defeated, updated: current.last_updated ?? null };
}

// After the Watchlist has shown what moved, today's position becomes the new baseline for each bill it found.
export function markBillsSeen(currents) {
  const byId = new Map(currents.map((c) => [c.bill_id, c]));
  writeAll(readAll().map((b) => {
    const c = byId.get(b.bill_id);
    return c ? { ...b, stage: c.current_stage ?? null, is_act: !!c.is_act, is_defeated: !!c.is_defeated } : b;
  }));
}

// What to say about a constituency's jobs and pay from src/data/localEconomy.json, set against England. Pure and tested.

const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

// The record for a constituency: by the ONS code postcodes.io gives for the 2024 boundaries, or failing that by name.
export function seatRecord(data, codes, name) {
  const code = codes?.parliamentary_constituency_2024 ?? codes?.parliamentary_constituency;
  if (code && data?.seats?.[code]) return data.seats[code];
  const want = String(name ?? "").trim().toLowerCase();
  return want ? Object.values(data?.seats ?? {}).find((s) => s.n.toLowerCase() === want) ?? null : null;
}

const direction = (change, margin) => (change > margin ? "up" : change < -margin ? "down" : "unchanged");

// The claimant row: the share of residents aged 16 to 64 claiming, and how it has moved in a year. null when there is no figure.
export function claimantRow(seat, data) {
  if (!seat || seat.r == null) return null;
  const nat = data.england?.r ?? null;
  const change = seat.rb != null ? Math.round((seat.r - seat.rb) * 10) / 10 : null;
  return {
    rate: seat.r, count: seat.c, nat, change, move: change == null ? null : direction(change, 0.05),
    vs: nat == null ? null : seat.r - nat > 0.3 ? "above" : nat - seat.r > 0.3 ? "below" : "close to",
    month: data.claimantMonth, before: data.claimantBefore,
  };
}

// The pay row: median full-time annual pay for jobs located in the constituency, against England's, and the change over the year. null when the survey gave none.
export function payRow(seat, data) {
  if (!seat || seat.p == null) return null;
  const nat = data.england?.p ?? null;
  const change = seat.pb ? Math.round(((seat.p - seat.pb) / seat.pb) * 1000) / 10 : null;
  return {
    pay: seat.p, nat, change,
    vs: nat == null ? null : seat.p / nat > 1.03 ? "above" : seat.p / nat < 0.97 ? "below" : "close to",
    year: data.payYear,
  };
}

export const monthShort = (label) => {
  const [m, y] = String(label ?? "").split(" ");
  return MONTHS.includes(m) ? `${m.slice(0, 3)} ${y}` : String(label ?? "");
};

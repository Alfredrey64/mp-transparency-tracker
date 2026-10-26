// £1,234,567 as "£1.2m", £45,300 as "£45k", £620 as "£620". CountValue can count these up, as they are a plain figure with a prefix and a suffix.
export function shortMoney(n) {
  const v = Math.abs(Number(n) || 0);
  if (v >= 1e9) return `£${(v / 1e9).toFixed(1)}bn`;
  if (v >= 1e6) return `£${(v / 1e6).toFixed(v >= 1e7 ? 0 : 1)}m`;
  if (v >= 1e4) return `£${Math.round(v / 1e3)}k`;
  return `£${Math.round(v).toLocaleString("en-GB")}`;
}

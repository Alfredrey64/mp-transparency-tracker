// Reading a written figure ("£241.30", "40 of 43", "up to 1,100") so its first number can count up while the words, sign, decimals and commas stay as written.
const PATTERN = /^(\D*?)(\d[\d,]*(?:\.\d+)?)(.*)$/s;

export function parseFigure(text) {
  const m = PATTERN.exec(String(text));
  if (!m) return null;
  const [, prefix, digits, suffix] = m;
  const value = Number(digits.replace(/,/g, ""));
  if (!Number.isFinite(value)) return null;
  const isYear = /^\d{4}$/.test(digits) && value >= 1900 && value <= 2100;
  if (isYear) return null;
  const decimals = digits.includes(".") ? digits.split(".")[1].length : 0;
  return { prefix, suffix, value, decimals, grouped: digits.includes(",") };
}


export function formatDate(dateStr) {
  if (!dateStr) return null;
  const d = new Date(dateStr);
  if (isNaN(d)) return dateStr;
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
}

const CATEGORY_SHORT_NAMES = {
  "Donations and other support (including loans) for activities as an MP": "Donations & Support",
  "Gifts, benefits and hospitality from UK sources": "Gifts & Hospitality",
  "Gifts, benefits and hospitality from sources outside the UK": "Overseas Gifts & Hospitality",
  "Visits outside the UK": "Overseas Visits",
  "Land and property (within or outside the UK)": "Land & Property",
  "Shareholdings": "Shareholdings",
  "Employment and earnings": "Outside Employment",
};

export function shortCategory(category) {
  return CATEGORY_SHORT_NAMES[category] ?? category;
}

export function partyColour(hex, fallback) {
  if (!hex) return fallback;
  return hex.startsWith("#") ? hex : `#${hex}`;
}

export function timeInOffice(startDate) {
  if (!startDate) return null;
  const start = new Date(startDate);
  const now = new Date();
  const years = now.getFullYear() - start.getFullYear() -
    (now < new Date(now.getFullYear(), start.getMonth(), start.getDate()) ? 1 : 0);
  return years <= 0 ? "less than a year" : `${years} year${years === 1 ? "" : "s"}`;
}

export function stripHtml(text) {
  if (!text) return text;
  return text
    .replace(/<[^>]+>/g, "")
    .replace(/&amp;/g, "&")
    .replace(/&nbsp;/g, " ")
    .replace(/&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .trim();
}

export function initials(name) {
  if (!name) return "?";
  const parts = name.trim().split(/\s+/);
  const first = parts[0]?.[0] ?? "";
  const last = parts.length > 1 ? parts[parts.length - 1][0] : "";
  return (first + last).toUpperCase();
}

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
  "Gifts and benefits from sources outside the UK": "Overseas Gifts & Hospitality",
  "Visits outside the UK": "Overseas Visits",
  "Land and property (within or outside the UK)": "Land & Property",
  "Shareholdings": "Shareholdings",
  "Employment and earnings": "Outside Employment",
  "Employment and earnings - Ongoing paid employment": "Outside Employment",
  "Employment and earnings - Ad hoc payments": "One-off Payment",
  "Miscellaneous": "Miscellaneous",
  "Family members employed": "Family Member Employed",
  "Family members engaged in third-party lobbying": "Family Member Lobbying",
};

// Categories that represent an ongoing outside job or role, as distinct from
// a one-off payment (e.g. a single speech fee) or a family member's own
// interest. This is what the Register of Members' Financial Interests uses
// to distinguish "still doing this" from "was paid once for this".
export const ONGOING_ROLE_CATEGORIES = ["Employment and earnings", "Employment and earnings - Ongoing paid employment"];

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

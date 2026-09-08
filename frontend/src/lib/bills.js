// A real hex value, deliberately not COLORS.inkSoft — that token resolves to
// a CSS var() for dark-mode theming, and several places (like the filter
// pills) build alpha-suffixed colors ("${color}40") which only works on an
// actual hex string. A var() with a suffix glued on is invalid CSS and gets
// silently dropped, which is why "General" used to render with no border or
// tint at all.
const GENERAL_COLOR = "#6B7280";

export const BILL_CATEGORIES = [
  { match: ["health and social care"], label: "Health", color: "#B5533C" },
  { match: ["defence"], label: "Defence", color: "#3A6EA5" },
  { match: ["treasury"], label: "Economy & Finance", color: "#8A7A3D" },
  { match: ["transport"], label: "Transport", color: "#4C7A6B" },
  { match: ["science, innovation", "digital, culture", "technology"], label: "Science & Tech", color: "#5B4E8A" },
  { match: ["justice", "home office", "home department"], label: "Justice & Home Affairs", color: "#7A4B4B" },
  { match: ["energy security", "net zero", "environment, food"], label: "Environment & Energy", color: "#2F6F4E" },
  { match: ["education"], label: "Education", color: "#C08A2E" },
  { match: ["work and pensions"], label: "Work & Pensions", color: "#6B5B95" },
  { match: ["housing, communities", "levelling up"], label: "Housing & Communities", color: "#A0522D" },
  { match: ["foreign, commonwealth"], label: "Foreign Affairs", color: "#2E6F6F" },
  { match: ["culture, media"], label: "Culture & Media", color: "#B0508A" },
];

export function categoriseBill(bill) {
  const dept = (bill.sponsoring_department ?? "").toLowerCase();
  for (const cat of BILL_CATEGORIES) {
    if (cat.match.some((m) => dept.includes(m))) return cat;
  }
  return { label: "General", color: GENERAL_COLOR };
}

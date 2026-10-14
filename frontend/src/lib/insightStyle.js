import { COLORS, FONT_BODY } from "../theme";

// Styles and helpers shared by the issue pages (see components/insight.jsx).

export const para = { fontFamily: FONT_BODY, fontSize: 15, lineHeight: 1.65, color: COLORS.inkSoft, margin: "6px 0 0", maxWidth: 780 };
export const strong = { color: COLORS.ink };

// Points for LineChart from a list of years and values. `offset` puts a financial year (April to March) a quarter of the way into its first calendar year.
export const toPoints = (years, values, label, offset = 0) => years.map((y, i) => ({ x: y + offset, y: values[i], label: label(y) })).filter((p) => p.y !== null && p.y !== undefined);
export const yearLabel = (y) => String(y);
export const financialYear = (y) => `${y} to ${String(y + 1).slice(2)}`;
export const money = (v) => `£${Math.round(v).toLocaleString("en-GB")}`;
export const pct = (v, d = 1) => `${(Math.round(v * 10 ** d) / 10 ** d).toFixed(d)}%`;

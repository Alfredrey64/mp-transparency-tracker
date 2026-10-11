// Small helpers and shared styles for the Your Council page (links, number formatting, party colours for the history chart).
import { COLORS, FONT_BODY } from "../theme";

export const goHash = (hash) => {
  window.location.hash = hash;
};

export const goCouncil = (id, ward, county) => {
  const parts = [encodeURIComponent(id)];
  if (ward || county) parts.push(encodeURIComponent(ward ?? ""));
  if (county) parts.push(encodeURIComponent(county));
  goHash(`#/councils/${parts.join("/")}`);
};

export const fmt = (n) => Math.round(n).toLocaleString("en-GB");

export const signed = (n) => `${n > 0 ? "+" : n < 0 ? "−" : ""}${fmt(Math.abs(n))}`;

export const scrollToId = (id) => document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });

export const HISTORY_COLOURS = { con: "#0063ba", lab: "#d50000", ld: "#fc7d0b", green: "#78b82a", ukip: "#70147a", ref: "#12b6cf", pc: "#348837", snp: "#d9b900", other: "#909090" };

export const HISTORY_LABELS = { con: "Conservative", lab: "Labour", ld: "Liberal Democrat", green: "Green", ukip: "UKIP", ref: "Reform UK", pc: "Plaid Cymru", snp: "SNP", other: "Others" };

export const HKEYS = Object.keys(HISTORY_COLOURS);

export const input = { width: "100%", boxSizing: "border-box", padding: "13px 16px", fontFamily: FONT_BODY, fontSize: 16, border: `1px solid ${COLORS.hairline}`, borderRadius: 12, background: COLORS.paper, color: COLORS.ink };

export const linkButton = { background: "none", border: "none", padding: 0, cursor: "pointer", fontFamily: FONT_BODY, fontSize: 13, fontWeight: 700, color: COLORS.accent };

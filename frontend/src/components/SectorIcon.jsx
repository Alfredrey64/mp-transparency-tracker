// A small picture for each industry the donor pages group money by, drawn in the site's line style so a sector can be recognised before it is read.
const P = {
  "Energy & Oil/Gas": <path d="M13 3 5.5 13.5H11L10 21l7.5-10.5H12z" />,
  "Mining & Extractives": <><path d="m12 3 8 6-8 12L4 9z" /><path d="M4 9h16M9 9l3 12 3-12M9.5 9 12 3l2.5 6" /></>,
  "Agriculture & Food": <><path d="M12 21V8" /><path d="M12 8c-3 0-4.5-2-4.5-4.5C10 3.5 12 5 12 8Zm0 0c3 0 4.5-2 4.5-4.5C14 3.5 12 5 12 8Z" /><path d="M12 14c-3 0-4.5-2-4.5-4.5C10 9.5 12 11 12 14Zm0 0c3 0 4.5-2 4.5-4.5C14 9.5 12 11 12 14Z" /></>,
  Tobacco: <><rect x="3" y="14" width="14" height="4" rx="1" /><path d="M17 14v4M20 14v4" /><path d="M14 10c0-2 2-2 2-4M18 10c0-2 2-2 2-4" /></>,
  "Alcohol & Gambling": <><rect x="4" y="4" width="16" height="16" rx="3" /><path d="M8.5 8.5h.01M15.5 8.5h.01M12 12h.01M8.5 15.5h.01M15.5 15.5h.01" strokeWidth="2.6" /></>,
  "Pharma & Healthcare": <><rect x="3.5" y="9" width="17" height="6" rx="3" transform="rotate(-35 12 12)" /><path d="m9.2 9.2 5.6 5.6" /></>,
  "Construction & Property": <><path d="M4 20V10l8-6 8 6v10z" /><path d="M9 20v-6h6v6M3 20h18" /></>,
  "Retail & Consumer": <><path d="M5 8h14l-1 12H6z" /><path d="M9 8V6a3 3 0 0 1 6 0v2" /></>,
  "Transport & Logistics": <><path d="M3 7h11v9H3zM14 10h4l3 3v3h-7" /><circle cx="7" cy="17.5" r="1.8" /><circle cx="17" cy="17.5" r="1.8" /></>,
  "Media & Publishing": <><path d="M5 4.5h11.5a1.5 1.5 0 0 1 1.5 1.5v13H6.5A1.5 1.5 0 0 1 5 17.5z" /><path d="M8.5 8.5h6M8.5 12h6M8.5 15.5h3.5M18 8.5h1.5A1.5 1.5 0 0 1 21 10v7.5a2 2 0 0 1-3 1.7" /></>,
  "Tech & Telecoms": <><rect x="6" y="6" width="12" height="12" rx="2" /><path d="M9 3v3M12 3v3M15 3v3M9 18v3M12 18v3M15 18v3M3 9h3M3 12h3M3 15h3M18 9h3M18 12h3M18 15h3" /><rect x="9.5" y="9.5" width="5" height="5" rx="1" /></>,
  "Finance & Banking": <><path d="M3 9 12 4l9 5H3zM5 9v8M9.5 9v8M14.5 9v8M19 9v8M3 20h18" /></>,
  "Legal & Professional Services": <><path d="M12 4v16M6 20h12M5 7h14" /><path d="m5 7-3 7a3.2 3.2 0 0 0 6 0zM19 7l-3 7a3.2 3.2 0 0 0 6 0z" /></>,
  "Chemicals & Manufacturing": <><path d="M9 3h6M10 3v6l-5 9a2 2 0 0 0 1.8 3h10.4A2 2 0 0 0 19 18l-5-9V3" /><path d="M7.5 15h9" /></>,
  "Defence & Arms": <path d="M12 3 5 6v6c0 4.2 3 7.3 7 9 4-1.700 7-4.800 7-9V6z" />,
  "Trade Unions": <><circle cx="8" cy="8" r="3" /><circle cx="16.5" cy="9.5" r="2.4" /><path d="M2.5 19c.4-3.500 2.700-5.500 5.500-5.500s5.100 2 5.500 5.500M14 18.500c.3-2.300 1.700-3.700 3.500-3.700s3.200 1.400 3.500 3.700" /></>,
  "Other / Uncategorised": <path d="M6 12h.01M12 12h.01M18 12h.01" strokeWidth="3" />,
  Individuals: <><circle cx="12" cy="8" r="3.800" /><path d="M5 20c.6-4 3.400-6.200 7-6.200s6.400 2.200 7 6.200" /></>,
};

export default function SectorIcon({ sector, size = 20 }) {
  const path = P[sector] ?? P.Individuals;
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{path}</svg>;
}

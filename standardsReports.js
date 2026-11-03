// standardsReports.js
//
// Which Committee on Standards publications are reports on one named MP's conduct. Shared by fetch-standards-reports.js and fetch-standards-details.js.

export const REPORT_PREFIX = /^(?:\d+\w{0,3}|first|second|third|fourth|fifth|sixth|seventh|eighth|ninth|tenth|eleventh|twelfth|thirteenth|fourteenth|fifteenth|sixteenth)\s+(?:special\s+)?report\s*[-–—]\s*/i;

export const POLICY_KEYWORDS = /\b(code of conduct|register of interests|sanctions|all-party|standards landscape|business costs|influencing|confidentiality|precautionary|natural justice|guide to the rules|procedural protocol|stationery|values,?\s*attitudes|government response|final proposals|transitional provisions|ipsa|scheme of business|respect policy|dignity policy|complaints procedure|risk assurance)\b/i;

// A candidate name is short, has no colon (a subtitle marker for policy
// reports), and no digits — i.e. it reads like "Andrew Gwynne", not
// "Review of the Code of Conduct: proposals for consultation".
export function extractPersonName(title) {
  if (!REPORT_PREFIX.test(title)) return null;
  const rest = title.replace(REPORT_PREFIX, "").trim();
  if (!rest || rest.includes(":") || /\d/.test(rest) || POLICY_KEYWORDS.test(rest)) return null;
  const words = rest.split(/\s+/);
  if (words.length < 2 || words.length > 5) return null;
  return rest;
}


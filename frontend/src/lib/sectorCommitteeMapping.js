// Maps a donor's industry (from lib/donorSectors.js, tagged via Companies
// House) onto the Commons select committee that actually scrutinises that
// industry — the bridge that lets the app show "this MP sits on the
// committee overseeing the same industry as one of their declared donors",
// without pretending to know whether the two are connected.
//
// One sector maps to at most one committee — a best-fit match against the
// committee's real remit (e.g. gambling is regulated through DCMS, not
// Health, so Alcohol & Gambling points at the DCMS committee). Sectors with
// no committee whose remit plausibly covers them are left out on purpose
// rather than forced into a poor match.
const SECTOR_TO_COMMITTEE = {
  "Energy & Oil/Gas": "Energy Security and Net Zero Committee",
  "Mining & Extractives": "Business, Innovation, Science and Trade Committee",
  "Agriculture & Food": "Environment, Food and Rural Affairs Committee",
  "Tobacco": "Health and Social Care Committee",
  "Alcohol & Gambling": "Digital, Culture, Media and Sport Committee",
  "Pharma & Healthcare": "Health and Social Care Committee",
  "Construction & Property": "Housing, Communities and Local Government Committee",
  "Retail & Consumer": "Business, Innovation, Science and Trade Committee",
  "Transport & Logistics": "Transport Committee",
  "Media & Publishing": "Digital, Culture, Media and Sport Committee",
  "Tech & Telecoms": "Science and Technology Committee",
  "Finance & Banking": "Treasury Committee",
  "Legal & Professional Services": "Justice Committee",
  "Chemicals & Manufacturing": "Business, Innovation, Science and Trade Committee",
  "Defence & Arms": "Defence Committee",
  "Trade Unions": "Work and Pensions Committee",
};

export function sectorToCommittee(sector) {
  return SECTOR_TO_COMMITTEE[sector] ?? null;
}

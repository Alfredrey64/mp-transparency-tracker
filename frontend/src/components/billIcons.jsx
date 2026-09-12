// Small decorative glyphs for landmark bills, matched by keyword against the
// bill's title (falling back to its theme, then a generic document). These
// are illustrative flourishes, not literal depictions — nothing here is
// drawn from or intended to resemble any official emblem or trademark.
const GLYPHS = {
  stamp: (
    <>
      <rect x="4" y="5" width="16" height="14" rx="1" />
      {[6.5, 9, 11.5, 14, 16.5].map((x) => <line key={`t${x}`} x1={x} y1="5" x2={x} y2="4" />)}
      {[6.5, 9, 11.5, 14, 16.5].map((x) => <line key={`b${x}`} x1={x} y1="19" x2={x} y2="20" />)}
      <circle cx="12" cy="12" r="3.2" />
    </>
  ),
  wheat: (
    <>
      <line x1="12" y1="20" x2="12" y2="5" />
      <path d="M12 8 8.5 6M12 8l3.5-2M12 11 8.5 9M12 11l3.5-2M12 14 8.5 12M12 14l3.5-2" />
    </>
  ),
  bank: (
    <>
      <path d="M4 10 12 4l8 6" />
      <line x1="4" y1="10" x2="20" y2="10" />
      <line x1="5.5" y1="10" x2="5.5" y2="18" />
      <line x1="9.5" y1="10" x2="9.5" y2="18" />
      <line x1="14.5" y1="10" x2="14.5" y2="18" />
      <line x1="18.5" y1="10" x2="18.5" y2="18" />
      <line x1="4" y1="20" x2="20" y2="20" />
    </>
  ),
  chain: (
    <>
      <ellipse cx="8" cy="9" rx="3.2" ry="2.4" transform="rotate(-35 8 9)" />
      <ellipse cx="15.5" cy="15" rx="3.2" ry="2.4" transform="rotate(-35 15.5 15)" strokeDasharray="1 2.2" />
    </>
  ),
  health: (
    <>
      <circle cx="12" cy="12" r="9" />
      <line x1="12" y1="8" x2="12" y2="16" />
      <line x1="8" y1="12" x2="16" y2="12" />
    </>
  ),
  coin: (
    <>
      <circle cx="10" cy="10" r="6.5" />
      <circle cx="15" cy="15" r="6.5" />
    </>
  ),
  graduation: (
    <>
      <path d="M2 9 12 4l10 5-10 5-10-5Z" />
      <path d="M7 11.5V16c0 1.4 2.2 2.5 5 2.5s5-1.1 5-2.5v-4.5" />
      <line x1="20.5" y1="9" x2="20.5" y2="15" />
    </>
  ),
  scales: (
    <>
      <line x1="12" y1="4" x2="12" y2="19" />
      <line x1="6" y1="7" x2="18" y2="7" />
      <line x1="20" y1="19" x2="4" y2="19" />
      <path d="M6 7 3 13a3.2 3.2 0 0 0 6 0Z" />
      <path d="M18 7 15 13a3.2 3.2 0 0 0 6 0Z" />
    </>
  ),
  ballot: (
    <>
      <rect x="4" y="9" width="16" height="11" rx="1.2" />
      <path d="M8.5 9V7a3.5 3.5 0 0 1 7 0v2" />
      <path d="M9.5 14.2 11.3 16l3.2-3.6" />
    </>
  ),
  shield: (
    <path d="M12 3.5 19 6.5v5c0 5-3 8.2-7 9-4-.8-7-4-7-9v-5Z" />
  ),
  europe: (
    <>
      <circle cx="12" cy="12" r="8" />
      {[0, 45, 90, 135, 180, 225, 270, 315].map((deg) => {
        const r1 = 5, r2 = 6.6;
        const rad = (deg * Math.PI) / 180;
        return (
          <line
            key={deg}
            x1={12 + r1 * Math.cos(rad)} y1={12 + r1 * Math.sin(rad)}
            x2={12 + r2 * Math.cos(rad)} y2={12 + r2 * Math.sin(rad)}
          />
        );
      })}
    </>
  ),
  gate: (
    <>
      <path d="M4 20V7l8-4 8 4v13" />
      <line x1="8" y1="8" x2="8" y2="20" />
      <line x1="12" y1="6" x2="12" y2="20" />
      <line x1="16" y1="8" x2="16" y2="20" />
      <line x1="4" y1="12" x2="20" y2="12" />
    </>
  ),
  rings: (
    <>
      <circle cx="9" cy="13" r="5" />
      <circle cx="15" cy="13" r="5" />
    </>
  ),
  equals: (
    <>
      <line x1="5" y1="9.5" x2="19" y2="9.5" />
      <line x1="5" y1="14.5" x2="19" y2="14.5" />
    </>
  ),
  hourglass: (
    <>
      <path d="M6 4h12M6 20h12M7 4c0 5 10 5 10 10-0-5-10-5-10-10Z" />
      <path d="M7 20c0-5 10-5 10-10" />
    </>
  ),
  house: (
    <>
      <path d="M4 11 12 4l8 7" />
      <path d="M6 10v9h12v-9" />
      <line x1="10" y1="19" x2="10" y2="14" />
      <line x1="14" y1="19" x2="14" y2="14" />
    </>
  ),
  gear: (
    <>
      <circle cx="12" cy="12" r="3.3" />
      {[0, 60, 120, 180, 240, 300].map((deg) => {
        const rad = (deg * Math.PI) / 180;
        const x1 = 12 + 6 * Math.cos(rad), y1 = 12 + 6 * Math.sin(rad);
        const x2 = 12 + 8.5 * Math.cos(rad), y2 = 12 + 8.5 * Math.sin(rad);
        return <line key={deg} x1={x1} y1={y1} x2={x2} y2={y2} />;
      })}
    </>
  ),
  pin: (
    <>
      <path d="M12 20s7-6.5 7-11.5A7 7 0 0 0 5 8.5C5 13.5 12 20 12 20Z" />
      <circle cx="12" cy="8.5" r="2.3" />
    </>
  ),
  gavel: (
    <>
      <rect x="12.5" y="3.5" width="4" height="7" rx="0.8" transform="rotate(45 14.5 7)" />
      <line x1="11" y1="9.5" x2="15.5" y2="14" />
      <line x1="4" y1="20" x2="12" y2="20" />
      <line x1="6" y1="17" x2="10.5" y2="21.5" />
    </>
  ),
  crown: (
    <path d="M4 18h16l-1.5-8-4 3.5L12 8l-2.5 5.5-4-3.5L4 18Z" />
  ),
  document: (
    <>
      <path d="M7 3h7l4 4v14H7Z" />
      <path d="M14 3v4h4" />
      <line x1="9.5" y1="12" x2="15" y2="12" />
      <line x1="9.5" y1="15.5" x2="15" y2="15.5" />
    </>
  ),
};

const RULES = [
  { test: /stamp act/i, glyph: "stamp" },
  { test: /corn law/i, glyph: "wheat" },
  { test: /bank of england|banking|financial services|financial markets/i, glyph: "bank" },
  { test: /slavery|slave trade/i, glyph: "chain" },
  { test: /health|nhs|social care/i, glyph: "health" },
  { test: /vat|tax|minimum wage|levy|national insurance/i, glyph: "coin" },
  { test: /education/i, glyph: "graduation" },
  { test: /human rights|discrimination|equality act/i, glyph: "scales" },
  { test: /reform act|ballot|representation of the people|voting|franchise|recall of mps|electoral registration/i, glyph: "ballot" },
  { test: /war|military|iraq|syria|libya|gulf|isil|armed/i, glyph: "shield" },
  { test: /european|eu |eec|brexit|lisbon|maastricht|withdrawal/i, glyph: "europe" },
  { test: /parliament act|house of lords|constitutional reform|act of settlement|bill of rights|union/i, glyph: "gate" },
  { test: /marriage|civil partnership/i, glyph: "rings" },
  { test: /gender recognition|race relations|married women/i, glyph: "equals" },
  { test: /pension|old-age/i, glyph: "hourglass" },
  { test: /housing|right to buy|rent/i, glyph: "house" },
  { test: /trade union|employment|industrial/i, glyph: "gear" },
  { test: /local government|greater london|devolution|scotland act|wales act|northern ireland act/i, glyph: "pin" },
  { test: /no confidence|confidence|budget|norway debate|campbell case/i, glyph: "gavel" },
  { test: /succession to the crown|abdication/i, glyph: "crown" },
];

function glyphFor(title) {
  const hit = RULES.find((r) => r.test.test(title));
  return hit ? hit.glyph : "document";
}

export function BillIcon({ title, size = 20, color = "currentColor" }) {
  const key = glyphFor(title);
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      {GLYPHS[key]}
    </svg>
  );
}

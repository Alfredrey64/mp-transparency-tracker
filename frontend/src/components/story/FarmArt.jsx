/** @jsxImportSource react */
import { useGo } from "./useGo";
import AnimatedValue from "./AnimatedValue";
import { crateFills, landPlots, rippleOrder, arcLength, IHT, rulerPos } from "../../lib/farmArt";
import "../../heroscene.css";
import "../../farmart.css";

// Pictures for the Farming and food page. Each plays once, when it scrolls into view (and is already finished for anyone who has asked for calmer motion), and every figure in
// them is one the page already states. A picture that carries figures is a role="img" with the figures in its label; the drawings that only decorate are hidden from screen readers.

// ----- small farm glyphs, 24 by 24, drawn in the colour they are given; the parts that are cut out of the shape take --ko (the colour behind it) -----
const KO = { fill: "var(--ko, #fff)" };
const KOS = { stroke: "var(--ko, #fff)" };
const G = {
  cow: (c) => (<><rect x="2.5" y="8.5" width="14.5" height="8" rx="3.4" fill={c} /><path d="M15.2 8.4h3.6l2.7 2.8v3.4c0 .9-.7 1.6-1.6 1.6h-3.2c-.9 0-1.5-.7-1.5-1.5z" fill={c} /><path d="M16.6 8 16 5.6M19.6 8.2l1.2-2.2" stroke={c} strokeWidth="1.7" strokeLinecap="round" /><ellipse cx="20" cy="14.6" rx="1.5" ry="1.1" style={KO} opacity=".85" /><circle cx="18" cy="11.4" r=".9" style={KO} /><ellipse cx="7" cy="12" rx="2" ry="1.6" style={KO} opacity=".85" /><ellipse cx="12.4" cy="13.6" rx="1.6" ry="1.4" style={KO} opacity=".85" /><path d="M5 16.8v3.8M8.6 16.8v3.8M12.8 16.8v3.8M15.6 16.8v3.8" stroke={c} strokeWidth="1.9" strokeLinecap="round" /><path d="M2.7 10c-1 .4-1.4 1.6-1.2 3" stroke={c} strokeWidth="1.5" strokeLinecap="round" fill="none" /></>),
  milk: (c) => (<><path d="M9.4 3h5.2v3l2 3.2V19a2 2 0 0 1-2 2H9.4a2 2 0 0 1-2-2V9.2l2-3.2z" fill={c} /><rect x="9.4" y="11" width="5.2" height="5" rx="1" style={KO} opacity=".9" /></>),
  carrot: (c) => (<><g transform="rotate(38 12 13)"><path d="M12 22.4 8.4 10.2a3.8 3.8 0 0 1 7.2 0z" fill={c} /><path d="M9.6 13h2.6M11.4 16.6h2.4M10.2 10.8h1.8" style={KOS} strokeWidth="1.1" strokeLinecap="round" /><path d="M12 7 9.2 2.4M12 7V1.8M12 7l2.8-4.6" stroke="#4C9A55" strokeWidth="1.9" strokeLinecap="round" /></g></>),
  wheat: (c) => (<><path d="M12 21V9" stroke={c} strokeWidth="1.8" strokeLinecap="round" /><g fill={c}><ellipse cx="9.2" cy="12" rx="2.2" ry="1.2" transform="rotate(-50 9.2 12)" /><ellipse cx="14.8" cy="12" rx="2.2" ry="1.2" transform="rotate(50 14.8 12)" /><ellipse cx="9.2" cy="8.2" rx="2.2" ry="1.2" transform="rotate(-50 9.2 8.2)" /><ellipse cx="14.8" cy="8.2" rx="2.2" ry="1.2" transform="rotate(50 14.8 8.2)" /><ellipse cx="12" cy="5" rx="1.2" ry="2.4" /></g></>),
  apple: (c) => (<><path d="M12 7.5c-2-1.6-6-1.2-6 3.6 0 4 2.6 8.4 6 8.4s6-4.4 6-8.4c0-4.8-4-5.2-6-3.6z" fill={c} /><path d="M12 7.5c0-2 .8-3.4 2.4-4" stroke="#6B4A2A" strokeWidth="1.6" strokeLinecap="round" /><path d="M13 5.4c1.6-1.4 3.4-1 4-.4-.6 1.4-2.6 1.8-4 .4z" fill="#4C9A55" /></>),
  hen: (c) => (<><path d="M6 12c0-3 2.4-5 5.4-5 1.4 0 2.4.4 3 1l3-1-.8 2.4c.9.9 1.4 2.1 1.4 3.4 0 3.6-3 6.2-7 6.2-3.2 0-5-2.1-5-5z" fill={c} /><path d="M14.4 8c.2-1.6 1-2.8 2.2-3.2" stroke={c} strokeWidth="2" strokeLinecap="round" /><path d="M17.2 9.6 20 10.6l-2.6.8z" fill="#E8A33C" /><circle cx="15.6" cy="9.4" r=".8" style={KO} /><path d="M10 18.4v2.4M13 18.4v2.4" stroke="#E8A33C" strokeWidth="1.6" strokeLinecap="round" /></>),
  sheep: (c) => (<><g fill={c}><circle cx="8" cy="10" r="3" /><circle cx="12" cy="8.6" r="3.2" /><circle cx="16" cy="10" r="3" /><circle cx="8.6" cy="13.4" r="2.8" /><circle cx="15.4" cy="13.4" r="2.8" /><circle cx="12" cy="13" r="3.4" /></g><ellipse cx="19" cy="11" rx="2" ry="2.5" fill="#3A3A42" /><path d="M8.6 15.6v4.4M15.4 15.6v4.4" stroke="#3A3A42" strokeWidth="1.8" strokeLinecap="round" /></>),
  hill: (c) => (<><path d="M2 20 9 7l4 6 2.4-3.6L22 20z" fill={c} /><path d="M9 7l1.8 3.2-1.8-.8-1.6.8z" style={KO} opacity=".85" /></>),
  tractor: (c) => (<><path d="M4 8h7l2 4h5v4H4z" fill={c} /><rect x="6" y="5" width="5" height="4" rx=".8" fill={c} opacity=".8" /><circle cx="7" cy="17.5" r="3.4" fill="#3A3A42" /><circle cx="7" cy="17.5" r="1.3" style={KO} /><circle cx="18" cy="18.4" r="2.2" fill="#3A3A42" /></>),
  sprout: (c) => (<><path d="M12 21v-9" stroke={c} strokeWidth="1.8" strokeLinecap="round" /><path d="M12 12C12 8 9 6 5 6c0 4 2.4 6 7 6zM12 14c0-3 2.4-5 6-5 0 3.2-2 5-6 5z" fill={c} /></>),
  barn: (c) => (<><path d="M3 11 12 4l9 7v9H3z" fill={c} /><path d="M9 20v-6h6v6M9 14l6 6M15 14l-6 6" style={KOS} strokeWidth="1.3" fill="none" /></>),
};
// Where the middle of each drawing sits inside its 24 by 24 box, so an icon can be centred on what it shows rather than on its box.
const GLYPH_CENTRE = { tractor: [11.9, 12.95], hill: [12, 13.5], cow: [12, 12.5], milk: [12, 12], wheat: [12, 13], carrot: [12, 12], hen: [12, 12.6], sheep: [12, 13], barn: [12, 12], sprout: [12, 13], apple: [12, 12.5] };
export function Glyph({ name, colour = "currentColor", size = 22 }) {
  return <svg viewBox="0 0 24 24" width={size} height={size} aria-hidden="true" focusable="false">{G[name](colour)}</svg>;
}

// ----- the header scene: a farm landscape along the foot of the page's heading band -----
const STALKS = Array.from({ length: 46 }, (_, i) => ({ x: 14 + i * 31 + ((i * 53) % 17), h: 20 + ((i * 37) % 17), d: (i * 0.17) % 1.8 }));
const ROWS = Array.from({ length: 19 }, (_, i) => i - 9);
export function FarmScene() {
  return (
    <div className="fm-scene" aria-hidden="true">
      <svg viewBox="0 0 1440 200" preserveAspectRatio="xMidYMax slice" focusable="false">
        <defs>
          <radialGradient id="fm-sun" cx="50%" cy="50%" r="50%"><stop offset="0" stopColor="#FFE9A8" stopOpacity="0.95" /><stop offset="1" stopColor="#FFE9A8" stopOpacity="0" /></radialGradient>
          <linearGradient id="fm-near" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#6E9A3F" /><stop offset="1" stopColor="#47702F" /></linearGradient>
        </defs>
        <circle className="fm-sun" cx="1130" cy="82" r="92" fill="url(#fm-sun)" />
        <circle cx="1130" cy="82" r="24" fill="#FFE29A" />
        <path d="M0 118C190 74 380 100 600 84S1000 58 1440 104V200H0z" fill="#1F4B47" />
        <path d="M0 144C240 104 520 140 760 114S1190 100 1440 132V200H0z" fill="#2E6B47" />
        <path d="M520 124c120-22 240-6 330-10l-20 34c-110-2-230 8-340 6z" fill="#C79A3B" opacity=".9" />
        {Array.from({ length: 9 }, (_, i) => <path key={i} d={`M${540 + i * 36} ${126 - (i % 2) * 2}l${-26 + i * 2} 28`} stroke="#8F6A22" strokeWidth="1.4" opacity=".55" />)}
        <g transform="translate(236 104)"><path d="M0 22V6l14-9 14 9v16z" fill="#8E3B30" /><path d="M-3 7 14-5l17 12" stroke="#5E2A22" strokeWidth="3" fill="none" strokeLinejoin="round" /><path d="M9 22v-9h10v9" fill="#5E2A22" /><rect x="34" y="0" width="9" height="22" rx="3" fill="#C9C2B0" /><path d="M34 0a4.5 4.5 0 0 1 9 0z" fill="#9F9886" /></g>
        <g fill="#1B4636"><circle cx="352" cy="120" r="11" /><circle cx="364" cy="124" r="9" /><rect x="357" y="124" width="3" height="14" fill="#4A3425" /></g>
        <g fill="#1B4636"><circle cx="1230" cy="116" r="10" /><circle cx="1220" cy="121" r="8" /><rect x="1226" y="121" width="3" height="13" fill="#4A3425" /></g>
        <path d="M0 168C300 142 640 170 940 152S1310 142 1440 160V200H0z" fill="url(#fm-near)" />
        {ROWS.map((r) => <path key={r} d={`M${720 + r * 150} 200L${720 + r * 38} 152`} stroke="#fff" strokeWidth="1.5" opacity=".16" />)}
        <g className="fm-tractor">
          <g className="fm-tractor-body" transform="translate(0 124)">
            <path d="M0 14h40l8 18h26v14H0z" fill="#D2452E" />
            <rect x="8" y="-2" width="24" height="20" rx="3" fill="#E9695A" /><rect x="12" y="2" width="16" height="11" rx="2" fill="#BFE2F0" opacity=".85" />
            <rect x="52" y="8" width="4" height="26" rx="2" fill="#3A3A42" />
            <g className="fm-wheel" style={{ transformOrigin: "20px 40px" }}><circle cx="20" cy="40" r="17" fill="#2E2E36" /><circle cx="20" cy="40" r="7" fill="#E8A33C" /><path d="M20 23v34M3 40h34" stroke="#555560" strokeWidth="2.4" /></g>
            <g className="fm-wheel" style={{ transformOrigin: "68px 46px" }}><circle cx="68" cy="46" r="10" fill="#2E2E36" /><circle cx="68" cy="46" r="4" fill="#E8A33C" /></g>
          </g>
        </g>
        <g className="fm-stalks">
          {STALKS.map((s, i) => (
            <g key={i} className="fm-stalk" style={{ "--d": `${s.d}s`, transformOrigin: `${s.x}px 200px` }}>
              <path d={`M${s.x} 200V${200 - s.h}`} stroke="#B98B34" strokeWidth="2" strokeLinecap="round" />
              <path d={`M${s.x} ${200 - s.h}l-4 -9M${s.x} ${200 - s.h}l4 -9M${s.x} ${200 - s.h}v-11M${s.x} ${191 - s.h}l-3 -7M${s.x} ${191 - s.h}l3 -7`} stroke="#E0B351" strokeWidth="2.2" strokeLinecap="round" />
            </g>
          ))}
        </g>
      </svg>
    </div>
  );
}

// ----- the UK's land as a hundred plots, the farmed ones turning green in a ripple -----
export function LandPatchwork({ farmed = 69, holdings, hectares, source }) {
  const [ref, go] = useGo(0.3);
  const plots = landPlots(farmed);
  return (
    <figure ref={ref} className="fm-land" data-go={go}>
      <svg viewBox="0 0 220 220" role="img" aria-label={`The UK's land as a hundred squares: ${farmed} are farmed and ${100 - farmed} are not.`}>
        {plots.map((p) => (
          <g key={p.i} className={p.farmed ? "fm-plot fm-on" : "fm-plot"} style={{ "--k": rippleOrder(p.x, p.y) }} transform={`translate(${p.x * 22} ${p.y * 22})`}>
            <rect x="1.5" y="1.5" width="19" height="19" rx="2.5" />
            {p.farmed && <path d={(p.x + p.y) % 2 ? "M4 7h14M4 11h14M4 15h14" : "M7 4v14M11 4v14M15 4v14"} stroke="#fff" strokeOpacity=".32" strokeWidth="1.3" />}
          </g>
        ))}
      </svg>
      <figcaption>
        <div className="fm-land-head">
          <b><AnimatedValue text={`${farmed}%`} /></b>
          <span>of the UK's land is used for farming</span>
        </div>
        <ul className="fm-land-legend">
          <li><i className="fm-key fm-key-on" aria-hidden="true" /><b>{farmed}</b><span>of every 100 squares are farmed</span></li>
          <li><i className="fm-key" aria-hidden="true" /><b>{100 - farmed}</b><span>are not</span></li>
        </ul>
        {(holdings || hectares) && (
          <dl className="fm-land-facts">
            {holdings && <div><dt>farm holdings</dt><dd>{holdings}</dd></div>}
            {hectares && <div><dt>hectares used</dt><dd>{hectares}</dd></div>}
          </dl>
        )}
        {source && <p className="fm-land-source">{source}</p>}
      </figcaption>
    </figure>
  );
}

// ----- rows of ten crates that fill to a share -----
export function FoodCrates({ items, note }) {
  const [ref, go] = useGo(0.25);
  return (
    <div ref={ref} className="fm-crates" data-go={go} role="img" aria-label={`Share of food produced against supplied: ${items.map((i) => `${i.label} ${i.text}`).join(", ")}.`}>
      <ul>
        {items.map((it, r) => (
          <li key={it.label} style={{ "--tc": it.colour, "--r": r }}>
            <span className="fm-crate-ico"><Glyph name={it.icon} colour="#fff" size={20} /></span>
            <span className="fm-crate-label">{it.label}</span>
            <b className="fm-crate-val">{it.text}</b>
            <span className="fm-crate-row">
              {crateFills(it.value).map((f, c) => <i key={c} className={c === 10 ? "fm-over" : undefined} style={{ "--f": f, "--c": c }}><u /></i>)}
            </span>
          </li>
        ))}
      </ul>
      <p className="fm-cap"><i className="fm-over-key" aria-hidden="true" />The dashed crate stands for more than 100%: more is made than we eat, and the rest is sold abroad.</p>
      {note && <p className="fm-note">{note}</p>}
    </div>
  );
}

// ----- bars with a farm picture at the head -----
export function FarmBars({ items, max, note, label }) {
  const [ref, go] = useGo(0.25);
  const top = max ?? Math.max(...items.map((i) => i.value));
  return (
    <div ref={ref} className="fm-bars" data-go={go} role="img" aria-label={`${label}: ${items.map((i) => `${i.label} ${i.text}`).join(", ")}.`}>
      <ul>
        {items.map((it, i) => (
          <li key={it.label} style={{ "--tc": it.colour, "--w": it.value / top, "--i": i }}>
            <span className="fm-bar-label">{it.label}</span>
            <span className="fm-bar-track"><span className="fm-bar-fill"><span className="fm-bar-cap"><Glyph name={it.icon} colour="#fff" size={22} /></span></span></span>
            <b>{it.text}</b>
          </li>
        ))}
      </ul>
      {note && <p className="fm-cap">{note}</p>}
    </div>
  );
}

// ----- upright columns that grow like a crop, with the farm type on top -----
export function FarmColumns({ items, max, note, label }) {
  const [ref, go] = useGo(0.25);
  const top = max ?? Math.max(...items.map((i) => i.value));
  return (
    <div ref={ref} className="fm-cols" data-go={go} role="img" aria-label={`${label}: ${items.map((i) => `${i.label} ${i.text}`).join(", ")}.`}>
      <ul style={{ "--n": items.length }}>
        {items.map((it, i) => (
          <li key={it.label} style={{ "--tc": it.colour, "--h": it.value / top, "--i": i }}>
            <b>{it.text}</b>
            <span className="fm-col"><span className="fm-col-fill" /><span className="fm-col-ico"><Glyph name={it.icon} colour="#fff" size={30} /></span></span>
            <em>{it.label}</em>
          </li>
        ))}
      </ul>
      {note && <p className="fm-cap">{note}</p>}
    </div>
  );
}

// ----- how much of a farm's income comes from direct payments: two rings -----
export function PaymentRings({ rings, note }) {
  const [ref, go] = useGo(0.3);
  const R = 46;
  return (
    <div ref={ref} className="fm-rings" data-go={go} role="img" aria-label={`Share of farm income from direct payments: ${rings.map((r) => `${r.label} ${r.share}%`).join(", ")}.`}>
      <div>
        {rings.map((r, i) => {
          const a = arcLength(r.share, R);
          return (
            <figure key={r.label} style={{ "--tc": r.colour, "--i": i }}>
              <svg viewBox="0 0 120 120" aria-hidden="true" focusable="false">
                <circle cx="60" cy="60" r={R} className="fm-ring-bg" />
                <circle cx="60" cy="60" r={R} className="fm-ring-fg" strokeDasharray={`${a.on} ${a.all}`} style={{ "--len": a.on }} transform="rotate(-90 60 60)" />
                {/* Everything inside stays within the inner edge of the ring (radius 40): the figure, then the words on two short lines. */}
                <text x="60" y="63" textAnchor="middle" className="fm-ring-num">{r.share}%</text>
                <text x="60" y="76" textAnchor="middle" className="fm-ring-sub">direct</text>
                <text x="60" y="87" textAnchor="middle" className="fm-ring-sub">payments</text>
                <g className="fm-ring-chip"><circle cx="60" cy="14" r="14.5" fill="var(--tc)" /><g transform={`translate(${51 - ((GLYPH_CENTRE[r.icon]?.[0] ?? 12) - 12) * 0.75} ${5 - ((GLYPH_CENTRE[r.icon]?.[1] ?? 12) - 12) * 0.75})`}><Glyph name={r.icon} colour="#fff" size={18} /></g></g>
              </svg>
              <figcaption>{r.label}</figcaption>
            </figure>
          );
        })}
      </div>
      {note && <p className="fm-note">{note}</p>}
    </div>
  );
}

// ----- one round of a fund as a share of its whole -----
export function FundBar({ whole, part, wholeText, partText, partLabel, wholeLabel, colour = "#5A7FA6" }) {
  const [ref, go] = useGo(0.3);
  return (
    <div ref={ref} className="fm-fund" data-go={go} style={{ "--tc": colour, "--p": part / whole }} role="img" aria-label={`${partLabel}: ${partText} of ${wholeText} in all.`}>
      <div className="fm-fund-bar"><span><Glyph name="sprout" colour="#fff" size={20} /><b>{partText}</b></span></div>
      <div className="fm-fund-keys"><span><i style={{ background: colour }} aria-hidden="true" />{partLabel}</span><span><i aria-hidden="true" />{wholeLabel} <b>{wholeText}</b></span></div>
    </div>
  );
}

// ----- the inheritance tax limit: the same bar of estate value, before and after, with a fence where the limit is, and the sum behind the 20% -----
export function ReliefGate({ colour = "#6A4AC4" }) {
  const [ref, go] = useGo(0.3);
  const SPAN = 7; // the bars run from £0 to "£7m and beyond"
  const pct = (v) => `${(v / SPAN) * 100}%`;
  return (
    <figure ref={ref} className="fm-gate" data-go={go} style={{ "--tc": colour, "--lim": IHT.limit / SPAN }}>
      <div className="fm-lanes" role="img" aria-label={`Inheritance tax on farm assets by the value of the estate. Before 6 April 2026: no tax at any value. From 6 April 2026: no tax up to ${IHT.limit} million pounds per estate, and ${IHT.rateAbove}% on the value above it, against the normal ${IHT.full}%. A couple can pass on up to ${IHT.couple} million pounds tax-free. The ${IHT.rateAbove}% is ${IHT.full}% on half the value.`}>
        <div className="fm-lane-area">
          <span className="fm-limit-flag">£{IHT.limit}m limit per estate</span>
          <i className="fm-limit-line" aria-hidden="true" />
          <div className="fm-lane" style={{ "--i": 0 }}>
            <p className="fm-lane-head"><b>Before 6 April 2026</b><span>Full relief at any value</span></p>
            <div className="fm-lane-bar"><span className="fm-seg fm-seg-free" style={{ flexBasis: "100%" }}><em>0% tax at any value</em></span></div>
          </div>
          <div className="fm-lane fm-lane-after" style={{ "--i": 1 }}>
            <svg className="fm-fence" viewBox="0 0 40 30" aria-hidden="true" focusable="false"><path d="M3 27V9l3-5 3 5v18M16 27V9l3-5 3 5v18M29 27V9l3-5 3 5v18" /><path d="M1 13h38M1 21h38" /></svg>
            <p className="fm-lane-head"><b>From 6 April 2026</b><span>Full relief up to the limit, half above it</span></p>
            <div className="fm-lane-bar">
              <span className="fm-seg fm-seg-free" style={{ flexBasis: pct(IHT.limit) }}><em>0% tax</em></span>
              <span className="fm-seg fm-seg-tax" style={{ flexBasis: `calc(100% - ${pct(IHT.limit)})` }}><em>{IHT.rateAbove}% tax on the value above it</em></span>
            </div>
          </div>
          <div className="fm-axis" aria-hidden="true">
            {[0, IHT.limit, IHT.couple].map((v, i) => <span key={v} data-end={i === 0 ? "l" : undefined} style={{ left: pct(v) }}>{v === 0 ? "£0" : `£${v}m`}</span>)}
            <b>value of the estate</b>
          </div>
          <div className="fm-couple-bracket" aria-hidden="true" style={{ width: pct(IHT.couple) }}><span>A couple: up to £{IHT.couple}m tax-free</span></div>
        </div>
        <div className="fm-sum" aria-hidden="true">
          <span><b>{IHT.full}%</b>normal rate</span><i>×</i><span><b>½</b>of the value taxed, because relief is 50%</span><i>=</i><span className="fm-sum-res"><b>{IHT.rateAbove}%</b>above the limit</span>
        </div>
      </div>
      <figcaption><small>Effective rates are our arithmetic from the figures above: 40% on half the value is 20%.</small></figcaption>
    </figure>
  );
}

// ----- stakes in a field marking where each price rise sits on a ruler -----
export function PriceRuler({ marks, max = 20, note }) {
  const [ref, go] = useGo(0.3);
  // Tags are wider than the gap between neighbouring rises, so a mark that sits close to the one on its right is lifted a step above it (its stake then runs down clear of the lower tag).
  const sorted = [...marks].sort((a, b) => a.rate - b.rate);
  const lanes = new Map();
  for (let i = sorted.length - 1; i >= 0; i -= 1) {
    const next = sorted[i + 1];
    lanes.set(sorted[i].label, next && rulerPos(next.rate, max) - rulerPos(sorted[i].rate, max) < 0.3 && lanes.get(next.label) === 0 ? 1 : 0);
  }
  return (
    <div ref={ref} className="fm-ruler" data-go={go} role="img" aria-label={`Annual price rises on a scale from 0 to ${max}%: ${marks.map((m) => `${m.label} ${m.text}`).join(", ")}.`}>
      <div className="fm-ruler-field">
        <div className="fm-ruler-line">
          {Array.from({ length: max / 5 + 1 }, (_, i) => <span key={i} style={{ left: `${(i * 5 / max) * 100}%` }}>{i * 5}%</span>)}
        </div>
        {marks.map((m, i) => (
          <div key={m.label} className="fm-stake" data-edge={rulerPos(m.rate, max) < 0.14 ? "l" : rulerPos(m.rate, max) > 0.86 ? "r" : undefined} style={{ "--pos": rulerPos(m.rate, max), "--tc": m.colour, "--i": i, "--lane": lanes.get(m.label) }}>
            <span className="fm-stake-tag"><b>{m.text}</b><em>{m.label}</em></span>
            <i aria-hidden="true" />
          </div>
        ))}
      </div>
      {note && <p className="fm-cap">{note}</p>}
    </div>
  );
}

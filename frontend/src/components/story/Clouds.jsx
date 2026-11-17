/** @jsxImportSource react */
// Clouds for the daytime scenes: a list of [x, y, scale]. They drift once (sv-drift in dayscene.css) and then rest.
const DEFAULT = [[470, 46, 1], [1010, 30, 1.2], [700, 22, 0.7]];
export default function Clouds({ list = DEFAULT }) {
  return (
    <g className="sv-clouds" fill="#fff" opacity=".92">{list.map(([x, y, k]) => <g key={x} transform={`translate(${x} ${y}) scale(${k})`}><ellipse rx="34" ry="10" /><ellipse cx="20" cy="-8" rx="21" ry="12" /><ellipse cx="-19" cy="-5" rx="17" ry="9" /></g>)}</g>
  );
}

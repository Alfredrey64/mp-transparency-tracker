/** @jsxImportSource react */
import "../../digitalart.css";
import { useGo } from "./useGo";
import { useCount } from "./useCount";

// The picture at the top of the Digital and online safety page: one signal path with three stops, drawn on a night-blue stage. A pulse runs along the line and each stop lights up as it
// arrives: (1) the line reaches the home (a hundred houses, lit by how many can get gigabit broadband and full fibre, Ofcom, January 2026); (2) the rules say what services must do (an age
// gate that lets an adult through and turns a child back, the Online Safety Act); (3) who may be on at all (the planned under-16 social media ban). Every figure is one the page gives below.

const HOMES = Array.from({ length: 100 }, (_, i) => (i < 82 ? "fibre" : i < 89 ? "gig" : "none"));

function Count({ n, go }) {
  return Math.round(useCount(n, go));
}

function AgeGate() {
  return (
    <svg className="dp-gate" viewBox="0 0 200 110" aria-hidden="true" focusable="false">
      <path d="M0 98H200" stroke="#7FA2E0" strokeWidth="2" opacity=".5" />
      {/* the adult walks into the doorway: drawn behind the posts and the light, he fades out as he goes in, as if he had entered the room */}
      <g transform="translate(0 98)"><g className="dp-adult"><rect x="-3" y="-12" width="6" height="12" rx="2" fill="#2A3350" /><rect x="-6" y="-30" width="12" height="20" rx="4" fill="#5DD28E" /><circle cy="-36" r="6" fill="#EBB98F" /></g></g>
      <rect x="86" y="30" width="6" height="68" rx="2" fill="#8FB0EA" /><rect x="128" y="30" width="6" height="68" rx="2" fill="#8FB0EA" />
      <rect x="80" y="24" width="60" height="9" rx="3" fill="#B7CCF3" />
      <rect className="dp-beam" x="92" y="34" width="36" height="64" fill="#9BDCFF" />
      <circle cx="110" cy="10" r="12" fill="#FFD98A" /><circle cx="110" cy="10" r="12" fill="none" stroke="#B3402E" strokeWidth="2.4" />
      <text x="110" y="13.4" textAnchor="middle" fontSize="9.4" fontWeight="800" fill="#3A1D12" fontFamily="Figures, 'Public Sans', system-ui, sans-serif">16+</text>
      {/* an adult walks through; a child comes up to the gate and is turned back with a cross */}
      <g transform="translate(0 98)"><g className="dp-child"><rect x="-2.6" y="-8" width="5.2" height="8" rx="2" fill="#2A3350" /><rect x="-5" y="-21" width="10" height="14" rx="3.6" fill="#FF8A5C" /><circle cy="-25.5" r="5" fill="#EBB98F" /></g></g>
      <g transform="translate(110 70)"><g className="dp-cross"><circle r="10" fill="#B3402E" /><path d="M-4 -4 4 4M4 -4-4 4" stroke="#fff" strokeWidth="2.4" strokeLinecap="round" /></g></g>
    </svg>
  );
}

function Calendar() {
  return (
    <div className="dp-cal" aria-hidden="true">
      <div className="dp-cal-top"><i /><i /><span>2027</span></div>
      <div className="dp-cal-body">Spring</div>
      <div className="dp-badge">16</div>
    </div>
  );
}

export default function OnlinePath() {
  const [ref, go] = useGo(0.2);
  return (
    <figure ref={ref} className="dp" data-go={go}>
      <figcaption>
        <b>From the cable to the child's screen</b>
        <span>Three things decide what people get online: whether the line reaches the home, what the rules say services must do, and who is allowed on at all.</span>
      </figcaption>
      <div className="dp-path">
        <div className="dp-pulse" aria-hidden="true" />
        <section className="dp-stop" style={{ "--k": 0 }}>
          <span className="dp-node" aria-hidden="true">1</span>
          <h3>Reaching the home</h3>
          <div className="dp-homes" role="img" aria-label="Of every 100 UK homes, 82 can get full fibre, 7 more can get gigabit broadband by another route, and 11 cannot get gigabit.">
            {HOMES.map((t, i) => <i key={i} data-t={t} style={{ "--i": i }} />)}
          </div>
          <p className="dp-fig"><b><Count n={89} go={go} />%</b> of UK homes can get gigabit broadband</p>
          <p className="dp-txt">January 2026, up from 87% six months earlier. <strong><Count n={82} go={go} />%</strong> can get full fibre: 24.9 million of the UK's 30.5 million homes.</p>
        </section>
        <section className="dp-stop" style={{ "--k": 1 }}>
          <span className="dp-node" aria-hidden="true">2</span>
          <h3>What services must do</h3>
          <AgeGate />
          <p className="dp-fig"><b>Age checks</b> for porn sites</p>
          <p className="dp-txt">The Online Safety Act 2023 makes Ofcom the regulator. It has fined providers with no age checks and opened investigations into others, including TikTok, Aylo and Meta.</p>
        </section>
        <section className="dp-stop" style={{ "--k": 2 }}>
          <span className="dp-node" aria-hidden="true">3</span>
          <h3>Who is allowed on</h3>
          <Calendar />
          <p className="dp-fig"><b>Spring 2027</b> planned under-16 social media ban</p>
          <p className="dp-txt">When the government expects it to take effect, if Parliament agrees. It was announced on 15 June 2026.</p>
        </section>
      </div>
    </figure>
  );
}

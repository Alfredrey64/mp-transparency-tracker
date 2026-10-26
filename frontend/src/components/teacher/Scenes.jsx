/** @jsxImportSource react */
import { SKIN } from "./palette";
import { Sky, Ground, Cloud, Person, Coin, Bubble, Shop, Basket, Parliament, BallotBox, Paper, Hospital, Calendar, Clock, School, Drip, Books, Letter, BusStop, Bus, TownHall, Bulb, QuestionMark, Arrow, Tree, Caption, MoneyFlow } from "./art";

// The four story pictures. Each piece is wrapped in <B n={beat}>: it is hidden until that step of the story and then arrives with the effect
// named by `fx`. `until` hides it again at a later step (so a worried face can replace a smiling one). `exit` slides it away when it goes.
export function B({ n = 0, until, fx = "pop", exit, stagger, children }) {
  return (
    <g data-beat={n} data-fx={fx} data-until={until} data-exit={exit ? "1" : undefined} data-stagger={stagger ? "1" : undefined} style={n > 0 ? { visibility: "hidden" } : undefined}>
      {children}
    </g>
  );
}

const Backdrop = ({ tone, tone2, ground, path, trees = [] }) => (
  <>
    <Sky tone={tone} tone2={tone2} />
    <Cloud x={120} y={70} s={1} />
    <Cloud x={430} y={46} s={0.7} delay={-6} />
    <Cloud x={690} y={96} s={0.9} delay={-12} />
    <Ground colour={ground} path={path} />
    {trees.map((x) => <Tree key={x} x={x} s={0.8} />)}
  </>
);

// ---- 1. The weekly shop ------------------------------------------------------------------------------------------------------------------------
function ShopScene() {
  return (
    <>
      <Backdrop tone="#DCEBFF" tone2="#F6F9FF" ground="#CFE6CF" path="#E9E1D0" trees={[750]} />
      <Shop x={470} y={362} />
      <B n={2}><g transform="translate(660 126)"><Parliament x={0} y={0} s={0.38} /></g><Caption x={662} y={150} size={16}>Parliament</Caption></B>
      <B n={2} until={3} fx="rise"><Bubble x={218} y={132} w={80} h={66} tail="center"><QuestionMark /></Bubble></B>
      <B n={0} until={1}><Person s={1.2} x={250} y={392} tag="Dad" shirt="#1E4FB8" mood="happy" skin={SKIN[2]} hair="#2B1D14" /></B>
      <B n={1} until={4} fx="fade"><Person s={1.2} x={250} y={392} tag="Dad" shirt="#1E4FB8" mood="worried" skin={SKIN[2]} hair="#2B1D14" /></B>
      <B n={4} fx="fade"><Person s={1.2} x={250} y={392} tag="Dad" shirt="#1E4FB8" mood="happy" skin={SKIN[2]} hair="#2B1D14" /></B>
      <Person s={1.2} x={335} y={392} who="sam" kid long shirt="#E0365B" skin={SKIN[2]} hair="#2B1D14" mood="happy" />
      <B n={1}><Basket x={195} y={392} /></B>
      <B n={1}>
        <g transform="translate(120 240)">
          <rect x="-34" y="-26" width="68" height="46" rx="12" fill="#fff" stroke="#CBD3E2" strokeWidth="2.5" />
          <text y="9" textAnchor="middle" fontSize="28" fontWeight="800" fontFamily="Figures, Public Sans, system-ui, sans-serif" fill="#0B1B33">£</text>
          <g className="t-bob"><Arrow x={46} y={-4} /></g>
        </g>
      </B>
      <B n={3} fx="rise"><Bubble x={90} y={38} w={86} h={70} tail="center"><Coin x={0} y={0} r={17} /><rect x="-12" y="-2.5" width="24" height="5" rx="2.5" fill="#fff" opacity="0.9" /></Bubble></B>
      <B n={3} fx="rise"><Bubble x={206} y={26} w={86} h={70} tail="center"><g transform="translate(0 -2)"><Paper x={0} y={0} /><path d="M-4 4 l6 6 l12 -14" stroke="#16A34A" strokeWidth="5" fill="none" strokeLinecap="round" strokeLinejoin="round" /></g></Bubble></B>
      <B n={3} fx="rise"><Bubble x={322} y={38} w={86} h={70} tail="center"><g><Arrow x={0} y={0} /><text y="28" textAnchor="middle" fontSize="14" fontWeight="800" fontFamily="Figures, Public Sans, system-ui, sans-serif" fill="#0B1B33">PAY</text></g></Bubble></B>
      <B n={4} fx="rise"><BallotBox x={425} y={392} /></B>
      <B n={4} fx="drop"><Paper x={425} y={290} rot={-8} /></B>
      <B n={5}><Bulb x={335} y={206} /></B>
    </>
  );
}

// ---- 2. Waiting for the hospital ---------------------------------------------------------------------------------------------------------------
function HospitalScene() {
  return (
    <>
      <Backdrop tone="#E4F1FF" tone2="#F8FBFF" ground="#D2E8D2" path="#E9E1D0" trees={[58]} />
      <Hospital x={500} y={362} />
      <Person s={1.2} x={170} y={392} who="maya" kid long shirt="#7A5AF0" skin={SKIN[3]} hair="#1E1410" mood="happy" />
      <B n={0} until={1}><Person s={1.2} x={290} y={392} tag="Grandad" shirt="#8FA6C0" trousers="#4A5568" skin={SKIN[0]} hair="#D6D6D6" mood="ok" /></B>
      <B n={1} fx="fade"><Person s={1.2} x={290} y={392} tag="Grandad" shirt="#8FA6C0" trousers="#4A5568" skin={SKIN[0]} hair="#D6D6D6" mood="worried" /></B>
      <B n={1} until={2}><Calendar x={130} y={166} /></B>
      <B n={1} until={2}><Clock x={250} y={166} /></B>
      <B n={2} until={3} fx="rise"><g transform="translate(405 208)"><Parliament x={0} y={0} s={0.4} /></g><Caption x={405} y={236} size={16}>Parliament</Caption></B>
      <B n={2} until={3} fx="fade"><MoneyFlow from={[456, 128]} to={[598, 158]} lift={78} coins={3} /></B>
      <B n={3} fx="rise"><Bubble x={70} y={110} w={86} h={70} tail="center"><Coin x={0} y={0} r={17} /></Bubble></B>
      <B n={3} fx="rise"><Bubble x={195} y={110} w={86} h={70} tail="center"><g><rect x="-6" y="-24" width="12" height="48" rx="3" fill="#16A34A" /><rect x="-24" y="-6" width="48" height="12" rx="3" fill="#16A34A" /></g></Bubble></B>
      <B n={3} fx="rise"><Bubble x={320} y={110} w={86} h={70} tail="center"><g><circle r="14" fill="none" stroke="#7A5AF0" strokeWidth="5" /><path d="M0 -24 v8 M0 16 v8 M-24 0 h8 M16 0 h8" stroke="#7A5AF0" strokeWidth="5" strokeLinecap="round" /></g></Bubble></B>
      <B n={4} fx="rise"><BallotBox x={400} y={392} /></B>
      <B n={4} fx="drop"><Paper x={400} y={290} rot={6} /></B>
    </>
  );
}

// ---- 3. A new roof for the school --------------------------------------------------------------------------------------------------------------
function SchoolScene() {
  return (
    <>
      <Backdrop tone="#E3EEFF" tone2="#F7FAFF" ground="#D2E8D2" path="#EADFC9" />
      <School x={470} y={362} />
      <g className="t-drips"><Drip x={540} y={236} /><Drip x={585} y={236} /></g>
      <path d="M560 232 h22" stroke="#4DA3E6" strokeWidth="3" strokeLinecap="round" opacity="0.7" />
      <B n={0} until={4}><Books x={395} y={362} few /></B>
      <Person s={1.2} x={230} y={392} who="leo" kid shirt="#0E9AA7" skin={SKIN[1]} hair="#2B1D14" mood="worried" />
      <Person s={1.2} x={335} y={392} tag="Mum" long shirt="#E0365B" skin={SKIN[1]} hair="#5C3A21" mood="ok" />
      <B n={4} fx="fade"><Books x={395} y={362} /></B>
      <B n={1} until={2} fx="rise"><g transform="translate(140 176)"><Parliament x={0} y={0} s={0.42} /></g><Caption x={140} y={204} size={16}>Parliament</Caption></B>
      <B n={1} until={2} fx="fade"><MoneyFlow from={[205, 126]} to={[585, 178]} lift={96} coins={3} dur={4.4} /></B>
      <B n={2} until={3} fx="rise"><Bubble x={70} y={110} w={86} h={70} tail="center"><g><Person x={0} y={22} s={0.42} kid shirt="#0E9AA7" skin={SKIN[1]} /></g></Bubble></B>
      <B n={2} until={3} fx="rise"><Bubble x={195} y={110} w={86} h={70} tail="center"><g><circle r="19" fill="#fff" stroke="#E0775A" strokeWidth="5" /><circle r="8" fill="#E0775A" /></g></Bubble></B>
      <B n={2} until={3} fx="rise"><Bubble x={320} y={110} w={86} h={70} tail="center"><g><path d="M-22 6 l22 -22 l22 22z" fill="#B5533C" /><rect x="-15" y="6" width="30" height="16" fill="#E9B88A" /></g></Bubble></B>
      <B n={3} until={4}><Person x={95} y={392} tag="MP" shirt="#16398A" trousers="#16213A" skin={SKIN[3]} hair="#1E1410" mood="happy" s={1.2} /></B>
      <B n={3} until={4} fx="rise"><Letter x={215} y={196} /></B>
      <B n={3} until={4} fx="fade"><path d="M325 236 q-20 -62 -100 -40 M205 205 q-70 6 -100 56" stroke="#1E4FB8" strokeWidth="3" strokeDasharray="3 9" strokeLinecap="round" fill="none" /></B>
      <B n={4}><Bulb x={230} y={214} /></B>
    </>
  );
}

// ---- 4. The bus that stopped -------------------------------------------------------------------------------------------------------------------
function BusScene() {
  return (
    <>
      <Backdrop tone="#E3EEFF" tone2="#F7FAFF" ground="#D2E8D2" path="#E3E0D8" />
      <rect x="0" y="372" width="800" height="48" fill="#6B7A90" />
      <path d="M0 396 h800" stroke="#fff" strokeWidth="3" strokeDasharray="30 24" opacity="0.7" />
      <BusStop x={190} y={366} />
      <B n={0} until={1} exit><Bus x={440} y={382} /></B>
      <Person s={1.2} x={275} y={366} who="amira" kid long shirt="#F2622A" skin={SKIN[2]} hair="#1E1410" mood="happy" />
      <B n={0} until={1}><Person s={1.2} x={385} y={366} tag="Nan" shirt="#9B6BB8" trousers="#4A5568" skin={SKIN[1]} hair="#E5E5E5" long mood="ok" /></B>
      <B n={1} fx="fade"><Person s={1.2} x={385} y={366} tag="Nan" shirt="#9B6BB8" trousers="#4A5568" skin={SKIN[1]} hair="#E5E5E5" long mood="worried" /></B>
      <B n={1}>
        <g transform="translate(385 166)"><rect x="-34" y="-20" width="68" height="40" rx="10" fill="#fff" stroke="#E0365B" strokeWidth="3" /><path d="M-14 -8 l28 16 M14 -8 l-28 16" stroke="#E0365B" strokeWidth="5" strokeLinecap="round" /></g>
      </B>
      <B n={2} fx="rise"><TownHall x={470} y={366} /></B>
      <B n={3}><Person x={500} y={394} s={0.8} shirt="#16398A" trousers="#16213A" skin={SKIN[0]} hair="#8A5A3C" mood="thinking" /></B>
      <B n={3}><Person x={575} y={394} s={0.8} long shirt="#B52746" trousers="#16213A" skin={SKIN[3]} hair="#1E1410" mood="thinking" /></B>
      <B n={3}><Person x={650} y={394} s={0.8} shirt="#1B7F52" trousers="#16213A" skin={SKIN[1]} hair="#3B2A20" mood="thinking" /></B>
      <B n={3} fx="rise"><Bubble x={480} y={60} w={84} h={66} tail="left"><g transform="scale(0.2) translate(-125 40)"><Bus x={0} y={0} /></g></Bubble></B>
      <B n={3} fx="rise"><Bubble x={585} y={50} w={84} h={66} tail="center"><g><rect x="-22" y="-6" width="44" height="12" rx="2" fill="#6B7A90" /><path d="M-22 0 h44" stroke="#fff" strokeWidth="2" strokeDasharray="6 5" /></g></Bubble></B>
      <B n={3} fx="rise"><Bubble x={690} y={60} w={72} h={66} tail="right"><Coin x={0} y={0} r={16} /></Bubble></B>
      <B n={4} fx="rise"><BallotBox x={95} y={392} /></B>
      <B n={4} fx="drop"><Paper x={95} y={296} rot={-6} /></B>
    </>
  );
}


export { ShopScene, HospitalScene, SchoolScene, BusScene };

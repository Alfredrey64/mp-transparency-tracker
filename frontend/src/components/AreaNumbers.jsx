/** @jsxImportSource react */
import { Card, Section, RegionOutline, CouncilTax, PlanningCard, Neighbourhood, PlaceFacts, HomesCrime, RegionRanks, Census } from "./AreaSections";
import { ComplaintsCard } from "./AreaAccountability";
import { LocalHealthCard, AsylumCard, HomelessnessCard, NewHomesCard, ChildPovertyCard, PrivateRentsCard, WasteCard } from "./AreaMore";
import { StreetCrimeCard, SewageCard, BathingCard, FloodWarningsCard, FoodHygieneCard, RoadCasualtiesCard, HousePricesCard, HealthServicesCard, HospitalCard, SchoolsCard, CouncilServicesCard, LocalEconomyCard } from "./AreaLocal";
import { IconTrend, IconPinHome, IconCoin, IconHeart, IconShield } from "./icons";
import { NUMBER_GROUPS } from "../lib/areaViews";
import { useSeen } from "../lib/useSeen";
import { scrollToId } from "../lib/scrollToId";
import "../areanumbers.css";

// The "In numbers" view of Your area, read top to bottom in four parts (see NUMBER_GROUPS): the place, the money in it, the services around it, then safety and the environment.
// Each part has a numbered banner, a line down its side that draws as it scrolls into view, and its sections along that line. Cards that depend on a postcode's position
// (schools, health, crime, water) look themselves up from the point in `data.result`.

const GROUP_ICONS = { place: IconPinHome, money: IconCoin, services: IconHeart, safety: IconShield };

function Part({ group, children }) {
  const [ref, seen] = useSeen("0px 0px -12% 0px");
  const Icon = GROUP_ICONS[group.icon];
  return (
    <section ref={ref} id={group.id} className="mg" data-in={seen} aria-labelledby={`${group.id}-h`} style={{ "--gc": group.colour }}>
      <header className="mg-head">
        <span className="mg-badge" aria-hidden="true">{group.n}</span>
        <div className="mg-title">
          <p className="mg-step">Part {group.n} of {NUMBER_GROUPS.length}</p>
          <h2 id={`${group.id}-h`}>{group.title}</h2>
          <p className="mg-lede">{group.lede}</p>
          <div className="mg-links" role="group" aria-label={`Sections in ${group.title}`}>
            {group.sections.map(([id, label]) => <button key={id} type="button" onClick={() => scrollToId(id)}>{label}</button>)}
          </div>
        </div>
        <span className="mg-art" aria-hidden="true"><Icon size={72} /></span>
      </header>
      <div className="mg-body">{children}</div>
    </section>
  );
}

function Bars({ figures }) {
  return (
    <div className="ma-bars">
      {figures.map((f, n) => {
        const max = Math.max(f.raw, f.ukRaw) || 1;
        return (
          <a key={f.id} className="ma-bar" href={f.link.href} style={{ "--fc": f.accent, "--n": n }}>
            <span className="ma-bar-label">{f.label}<small>{f.same ? "same as the UK" : f.higher ? "above the UK" : "below the UK"}</small></span>
            <span className="ma-bar-rows">
              <span className="ma-bar-row"><i style={{ "--w": f.raw / max }} /><b>{f.value}</b></span>
              <span className="ma-bar-row ma-bar-uk"><i style={{ "--w": f.ukRaw / max }} /><b>{f.uk}</b></span>
            </span>
          </a>
        );
      })}
      <p className="ma-legend"><span><i style={{ background: "#2F9E6E" }} />Your region</span><span><i style={{ background: "#9AA6B8" }} />The UK</span></p>
    </div>
  );
}

export default function AreaNumbers({ data, x }) {
  const { council, county, regionName, figures } = data;
  const [place, money, services, safety] = NUMBER_GROUPS;
  return (
    <>
      <Part group={place}>
        <Section as="h3" id="ma-n-hood" title="Your neighbourhood" lede="How the small area you live in compares with the rest of the country." colour={place.colour}>
          <Neighbourhood x={x} i={0} />
          <PlaceFacts x={x} i={1} />
        </Section>
        <Section as="h3" id="ma-n-region" title={`Your region: ${regionName ?? "the UK"}`} lede="Figures published for the whole region, set against the rest of the UK. They describe the region, not your street." colour={place.colour}>
          <Card i={0} colour="#2F9E6E" icon={<IconTrend size={20} />} title={`How ${regionName ?? "your region"} compares`} className="ma-region">
            {figures.length > 0 ? <div className="ma-region-grid"><RegionOutline regionKey={x?.regionKey} regionName={regionName} /><Bars figures={figures} /></div> : <p>Regional figures aren't available for this area.</p>}
            <a className="ma-link" href="#/regions">Compare every region</a>
          </Card>
          <RegionRanks x={x} regionName={regionName} i={1} />
          <Census x={x} regionName={regionName} i={2} />
        </Section>
        <Section as="h3" id="ma-n-asylum" title="Asylum support" lede="How many people the Home Office is housing and supporting in your council area while their asylum claims are decided." colour={place.colour}>
          <AsylumCard r={data.result} i={0} />
        </Section>
      </Part>

      <Part group={money}>
        <Section as="h3" id="ma-n-money" title="Jobs, pay and council tax" lede="What people earn and claim in your constituency, and what a home here pays in council tax." colour={money.colour}>
          <LocalEconomyCard r={data.result} i={0} />
          <CouncilTax x={x} i={1} />
        </Section>
        <Section as="h3" id="ma-n-homes" title="House prices" lede="What homes in your council area sell for, how that has changed, and how it compares with the rest of the nation." colour={money.colour}>
          <HousePricesCard r={data.result} i={0} />
        </Section>
        <Section as="h3" id="ma-n-rents" title="Private rents" lede="What renters in your council area pay each month, how that has changed, and how it compares with the region and the nation." colour={money.colour}>
          <PrivateRentsCard r={data.result} i={0} />
        </Section>
        <Section as="h3" id="ma-n-newhomes" title="New homes" lede="How many homes were added in your council area each year, after any were lost, and how that compares with the rest of England." colour={money.colour}>
          <NewHomesCard r={data.result} i={0} />
        </Section>
        <Section as="h3" id="ma-n-housing" title="Homelessness" lede="How many households in your council area were owed help because they were homeless or about to be, and how many are in temporary accommodation." colour={money.colour}>
          <HomelessnessCard r={data.result} i={0} />
        </Section>
        <Section as="h3" id="ma-n-lowincome" title="Children and low incomes" lede="How many children in your council area and constituency live in families on a low income, after housing costs." colour={money.colour}>
          <ChildPovertyCard r={data.result} i={0} />
        </Section>
      </Part>

      <Part group={services}>
        <Section as="h3" id="ma-n-health" title="Health" lede="How the nearest doctors, hospitals and care homes are rated, and how long people wait." colour={services.colour}>
          <HealthServicesCard r={data.result} i={0} />
          <HospitalCard r={data.result} i={1} />
        </Section>
        <Section as="h3" id="ma-n-wellbeing" title="How healthy people are" lede="How long people live in your council area, how many years in good health, and some habits that affect health, against England." colour={services.colour}>
          <LocalHealthCard r={data.result} i={0} />
        </Section>
        <Section as="h3" id="ma-n-school" title="Schools" lede="Ofsted's latest result for each school nearby, and how its pupils did in their exams." colour={services.colour}>
          <SchoolsCard r={data.result} i={0} />
        </Section>
        <Section as="h3" id="ma-n-council" title="Your council" lede="How your council handles planning, complaints, roads, road repairs and fly-tipping." colour={services.colour}>
          <PlanningCard x={x} i={0} />
          <ComplaintsCard council={council} county={county} i={1} />
          <CouncilServicesCard council={council} county={county} i={2} />
        </Section>
        <Section as="h3" id="ma-n-waste" title="Waste and recycling" lede="How much of the household waste your council collects is recycled, and how much is left over." colour={services.colour}>
          <WasteCard r={data.result} i={0} />
        </Section>
      </Part>

      <Part group={safety}>
        <Section as="h3" id="ma-n-crime" title="Crime" lede="Crimes recorded close to your postcode, and recorded crime and homes for your region." colour={safety.colour}>
          <StreetCrimeCard r={data.result} i={0} />
          <HomesCrime x={x} regionName={regionName} i={1} />
        </Section>
        <Section as="h3" id="ma-n-roads" title="Roads" lede="How many people were killed or seriously injured on the roads of your council area, and who they were." colour={safety.colour}>
          <RoadCasualtiesCard r={data.result} i={0} />
        </Section>
        <Section as="h3" id="ma-n-food" title="Food hygiene" lede="The inspection ratings of the cafes, takeaways, shops and pubs within a mile of your postcode." colour={safety.colour}>
          <FoodHygieneCard r={data.result} i={0} />
        </Section>
        <Section as="h3" id="ma-n-water" title="Water and flooding" lede="Flood warnings, sewage overflows and bathing water quality near you." colour={safety.colour}>
          <FloodWarningsCard r={data.result} i={0} />
          <SewageCard r={data.result} i={1} />
          <BathingCard r={data.result} i={2} />
        </Section>
      </Part>
    </>
  );
}

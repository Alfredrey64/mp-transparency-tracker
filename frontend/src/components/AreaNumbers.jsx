/** @jsxImportSource react */
import { Card, Section, RegionOutline, CouncilTax, PlanningCard, Neighbourhood, PlaceFacts, HomesCrime, RegionRanks, Census } from "./AreaSections";
import { ComplaintsCard } from "./AreaAccountability";
import { StreetCrimeCard, SewageCard, BathingCard, HealthServicesCard, HospitalCard, SchoolsCard, CouncilServicesCard, LocalEconomyCard } from "./AreaLocal";
import { IconTrend } from "./icons";

// The "In numbers" view of Your area: every statistic about the place, grouped by what it is about. Each group is a Section so the jump bar and the one-time draw-in
// work as they do on the Politics view. Cards that depend on a postcode's position (schools, health, crime, water) look themselves up from the point in `data.result`.

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
  return (
    <>
      <Section id="ma-n-hood" title="Your neighbourhood" lede="How the place you live compares with the rest of the country." colour="#C0478A">
        <Neighbourhood x={x} i={0} />
        <PlaceFacts x={x} i={1} />
      </Section>

      <Section id="ma-n-money" title="Money and jobs" lede="What living here costs, and what people earn." colour="#E8741A">
        <LocalEconomyCard r={data.result} i={0} />
        <CouncilTax x={x} i={1} />
      </Section>

      <Section id="ma-n-council" title="Your council in numbers" lede="How your council handles planning and complaints." colour="#2C7DA0">
        <PlanningCard x={x} i={0} />
        <ComplaintsCard council={council} county={county} i={1} />
        <CouncilServicesCard council={council} county={county} i={2} />
      </Section>

      <Section id="ma-n-health" title="Health" lede="How the nearest doctors, hospitals and care homes are rated, and how long people wait." colour="#2F8F6B">
        <HealthServicesCard r={data.result} i={0} />
        <HospitalCard r={data.result} i={1} />
      </Section>

      <Section id="ma-n-school" title="Schools" lede="Ofsted's latest result for each school nearby, and how its pupils did in their exams." colour="#7B5BD6">
        <SchoolsCard r={data.result} i={0} />
      </Section>

      <Section id="ma-n-crime" title="Crime and safety" lede="Recorded crime and homes for your region." colour="#D9453B">
        <StreetCrimeCard r={data.result} i={0} />
        <HomesCrime x={x} regionName={regionName} i={1} />
      </Section>

      <Section id="ma-n-water" title="Water" lede="Sewage overflows and bathing water quality near you." colour="#2C7DA0">
        <SewageCard r={data.result} i={0} />
        <BathingCard r={data.result} i={1} />
      </Section>

      <Section id="ma-n-region" title={`Your region: ${regionName ?? "the UK"}`} lede="Figures published for the whole region, set against the rest of the UK. They describe the region, not your street." colour="#2F9E6E">
        <Card i={0} colour="#2F9E6E" icon={<IconTrend size={20} />} title={`How ${regionName ?? "your region"} compares`} className="ma-region">
          {figures.length > 0 ? <div className="ma-region-grid"><RegionOutline regionKey={x?.regionKey} regionName={regionName} /><Bars figures={figures} /></div> : <p>Regional figures aren't available for this area.</p>}
          <a className="ma-link" href="#/regions">Compare every region</a>
        </Card>
        <RegionRanks x={x} regionName={regionName} i={1} />
        <Census x={x} regionName={regionName} i={2} />
      </Section>
    </>
  );
}

// What the main rates mean in pounds: the figures behind the cards on the Taxes page (components/TaxInAction.jsx). Everything is worked out from the rates the page already holds
// (lib/taxRates), so when a Budget changes a rate the cards change with it.
import { fmt, headlineLine, valueOn } from "./taxRates";

const LITRES = 50; // a fill-up of a family car
const WEEKS = 52;

const num = (taxId, key, iso) => valueOn(headlineLine(taxId, key), iso);
const pounds = (v) => `£${Math.round(v).toLocaleString("en-GB")}`;
const pence = (p) => `${Number(p.toFixed(2))}p`;

// One entry per card. `cells` squares in `cols` columns, of which the first `tax` are shaded and drawn as the tax. Text is plain English and always uses the live figures.
export function buildCards(iso) {
  const basic = num("income-tax", "incomeTax.basic", iso);
  const allowance = num("income-tax", "incomeTax.allowance", iso);
  const higher = num("income-tax", "incomeTax.higherStarts", iso);
  const top = num("income-tax", "incomeTax.top", iso);
  const topStarts = num("income-tax", "incomeTax.topStarts", iso);
  const ni = num("national-insurance", "ni.employee", iso);
  const niAbove = num("national-insurance", "ni.employeeAbove", iso);
  const vat = num("vat", "vat.standard", iso);
  const corp = num("corporation-tax", "corp.main", iso);
  const corpSmall = num("corporation-tax", "corp.small", iso);
  const petrol = num("fuel", "fuel.petrol", iso);
  const bandD = num("council-tax", "councilTax.bandD", iso);
  const vatTotal = 100 + vat;
  const duty = (LITRES * petrol) / 100;
  return [
    {
      id: "income-tax", key: "incomeTax.basic", title: "Income tax", rate: fmt("pct", basic), cells: 100, cols: 10, tax: Math.round(basic),
      alt: `${Math.round(basic)} of 100 squares are income tax`,
      keep: `You keep ${pounds(100 - basic)}`, take: `${pounds(basic)} income tax`,
      line: `Of each extra £100 you earn above your ${pounds(allowance)} tax-free allowance, up to ${pounds(higher)}, ${pounds(basic)} goes in income tax. Above that it is charged at higher rates, up to ${fmt("pct", top)} on pay over ${pounds(topStarts)}.`,
    },
    {
      id: "national-insurance", key: "ni.employee", title: "Employee National Insurance", rate: fmt("pct", ni), cells: 100, cols: 10, tax: Math.round(ni),
      alt: `${Math.round(ni)} of 100 squares are National Insurance`,
      keep: `You keep ${pounds(100 - ni)}`, take: `${pounds(ni)} National Insurance`,
      line: `It comes out of your pay on top of income tax. On pay between ${pounds(allowance)} and ${pounds(higher)} it takes ${pounds(ni)} of each £100, and ${pounds(niAbove)} of each £100 above that.`,
    },
    {
      id: "vat", key: "vat.standard", title: "VAT", rate: fmt("pct", vat), cells: vatTotal, cols: 10, tax: Math.round(vat),
      alt: `${Math.round(vat)} of ${vatTotal} squares are VAT`,
      keep: "The shop keeps £100", take: `${pounds(vat)} VAT`,
      line: `VAT is added on top of the price. Something that costs £100 before VAT costs you ${pounds(vatTotal)}, so VAT is ${pounds(vat)} of the ${pounds(vatTotal)} you hand over: about ${Math.round((vat / vatTotal) * 100)}p of every £1 you spend. Most food, children's clothes and books have none.`,
    },
    {
      id: "corporation-tax", key: "corp.main", title: "Corporation tax", rate: fmt("pct", corp), cells: 100, cols: 10, tax: Math.round(corp),
      alt: `${Math.round(corp)} of 100 squares are corporation tax`,
      keep: `The company keeps ${pounds(100 - corp)}`, take: `${pounds(corp)} corporation tax`,
      line: `Out of each £100 of profit a company with profits over £250,000 pays ${pounds(corp)}. Companies with profits under £50,000 pay ${fmt("pct", corpSmall)}, and between the two the rate slides.`,
    },
    {
      id: "fuel", key: "fuel.petrol", title: "Fuel duty on petrol", rate: pence(petrol), cells: LITRES, cols: 10, tax: LITRES, unit: "litre",
      alt: `${LITRES} litres, each carrying ${pence(petrol)} of duty`,
      keep: `${LITRES} litres`, take: `£${duty.toFixed(2)} duty`,
      line: `Every litre carries ${pence(petrol)} of duty before the pump price is worked out. A ${LITRES}-litre fill-up has £${duty.toFixed(2)} of duty in it, and VAT is charged on top of that.`,
    },
    {
      id: "council-tax", key: "councilTax.bandD", title: "Average Band D council tax", rate: pounds(bandD), cells: WEEKS, cols: 13, tax: WEEKS, unit: "week",
      alt: `${WEEKS} weeks, each costing about £${(bandD / WEEKS).toFixed(0)}`,
      keep: `${WEEKS} weeks`, take: `£${(bandD / WEEKS).toFixed(2)} a week`,
      line: `Spread over the year, the average Band D bill in England is £${(bandD / WEEKS).toFixed(2)} a week, or about £${(bandD / 365).toFixed(2)} a day. Your own bill depends on your council and your band.`,
    },
  ];
}


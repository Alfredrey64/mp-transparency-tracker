/** @jsxImportSource react */
import DonutShare from "./DonutShare";

// Where English councils' money goes, as a ring. Each slice is also a row in the list beside it: hover or focus a row and its slice lifts out and the middle reads out its figures;
// press a row and a few words about that service open under it. The ring draws itself round when it scrolls into view. Every figure is the page's own (explainers/councilSpending.jsx).
const TOTAL = 148.8;
const SLICES = [
  { key: "edu", label: "Education", value: 49.1, colour: "#5A7FA6", about: "Much of this is money passed on to schools and to early years and special needs places. The department says education spending is £2.4 billion higher in real terms than the year before, mostly early years and special schools." },
  { key: "adult", label: "Adult social care", value: 28.7, colour: "#9C3B3B", about: "Social care is different from education: councils themselves are responsible for arranging it. With children's social care it comes to £45.7 billion, about 31% of all the spending on services." },
  { key: "child", label: "Children's social care", value: 17.0, colour: "#E8741A", about: "Children's social care is £1.2 billion higher (7.4%) than the year before. Councils themselves are responsible for arranging it." },
  { key: "housing", label: "Housing services", value: 3.7, colour: "#3F7D5C", about: "Spending on homelessness rose by £302 million." },
  { key: "culture", label: "Cultural services", value: 2.6, colour: "#6E4B6E", about: "The only service the department reports as budgeted to fall: £61 million less, or 2.3%." },
];
const REST = { key: "rest", label: "Everything else", value: +(TOTAL - SLICES.reduce((n, s) => n + s.value, 0)).toFixed(1), colour: "#7B8798", about: "Roads, planning, waste and other services make up the rest of the £148.8 billion." };
const ALL = [...SLICES, REST];
const bn = (n) => `£${n.toFixed(1)}bn`;

export default function SpendPie() {
  return (
    <DonutShare
      items={ALL}
      total={TOTAL}
      format={bn}
      centre="Planned spending on services, 2026 to 2027"
      aria={`Council spending on services in England, 2026 to 2027, ${bn(TOTAL)} in all: ${ALL.map((s) => `${s.label} ${bn(s.value)}`).join(", ")}`}
    />
  );
}

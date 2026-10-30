/** @jsxImportSource react */
import CountUp from "../CountUp";
import { parseFigure } from "../../lib/figureText";

// A figure written as text whose first number counts up when it scrolls into view. Text with no number, or a year such as "Spring 2027", is shown as it is.
export default function AnimatedValue({ text }) {
  const f = typeof text === "string" ? parseFigure(text) : null;
  if (!f) return text;
  const format = (n) => `${f.prefix}${n.toLocaleString("en-GB", { minimumFractionDigits: f.decimals, maximumFractionDigits: f.decimals, useGrouping: f.grouped })}${f.suffix}`;
  return <CountUp value={f.value} format={format} />;
}

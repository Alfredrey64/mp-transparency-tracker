import { useSyncExternalStore } from "react";

// How much of an explainer page to show: the full page, or a short version with the longer paragraphs, small-print notes and fold-outs left out. The choice is
// remembered in this browser, and every explainer page follows it.
const KEY = "domesday-detail";
let level = "full";
try { if (localStorage.getItem(KEY) === "short") level = "short"; } catch { /* storage can be blocked */ }
const listeners = new Set();

export const getDetail = () => level;
export function setDetail(next) {
  const value = next === "short" ? "short" : "full";
  if (value === level) return;
  level = value;
  try { localStorage.setItem(KEY, value); } catch { /* the choice still applies until the page closes */ }
  listeners.forEach((fn) => fn());
}
const subscribe = (fn) => { listeners.add(fn); return () => listeners.delete(fn); };
export const useDetail = () => useSyncExternalStore(subscribe, getDetail, () => "full");

// What a short version leaves out: running text, notes in small print and fold-outs altogether, the explanation under each step, and all but the first few entries of a
// timeline. If that would leave a chapter with nothing, its first piece of running text stays.
const LONG = ["text", "note", "more"];
const TIMELINE = 5;
const trim = (b) => {
  if (b.steps) return { ...b, steps: b.steps.map((step) => ({ ...step, text: undefined })) };
  if (b.timeline && b.timeline.length > TIMELINE) return { ...b, timeline: b.timeline.slice(0, TIMELINE) };
  return b;
};
export function shortBlocks(blocks) {
  const kept = blocks.filter((b) => !LONG.some((k) => k in b)).map(trim);
  if (kept.length) return kept;
  const first = blocks.find((b) => "text" in b);
  return first ? [first] : blocks.slice(0, 1);
}

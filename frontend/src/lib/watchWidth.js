// Calls `onChange` once now and again whenever the element's size changes. A change is handled on the next frame rather than inside the observer,
// so drawing at the new size cannot itself change the size and set the observer off again (the browser reports that as "ResizeObserver loop").
// Returns the function that stops watching.
export function watchSize(el, onChange) {
  if (!el) return () => {};
  let frame = 0;
  const run = () => { frame = 0; onChange(el); };
  const schedule = () => { if (!frame) frame = requestAnimationFrame(run); };
  const ro = typeof ResizeObserver === "function" ? new ResizeObserver(schedule) : null;
  ro?.observe(el);
  schedule();
  return () => { if (frame) cancelAnimationFrame(frame); ro?.disconnect(); };
}

// The same, passing the element's width, and ignoring a width of nothing (an element that is not on screen yet).
export function watchWidth(el, onWidth) {
  return watchSize(el, (node) => { const w = node.getBoundingClientRect().width; if (w > 0) onWidth(w); });
}

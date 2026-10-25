// Cards marked .glow light up under the pointer: this one listener keeps the pointer's place inside the card in two CSS variables.
export function installGlow() {
  if (typeof document === "undefined") return () => {};
  let frame = 0;
  const onMove = (e) => {
    if (e.pointerType && e.pointerType !== "mouse") return;
    const el = e.target instanceof Element ? e.target.closest(".glow") : null;
    if (!el) return;
    cancelAnimationFrame(frame);
    frame = requestAnimationFrame(() => {
      const r = el.getBoundingClientRect();
      el.style.setProperty("--mx", `${e.clientX - r.left}px`);
      el.style.setProperty("--my", `${e.clientY - r.top}px`);
    });
  };
  document.addEventListener("pointermove", onMove, { passive: true });
  return () => { cancelAnimationFrame(frame); document.removeEventListener("pointermove", onMove); };
}

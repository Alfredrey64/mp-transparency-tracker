import { useEffect, useLayoutEffect, useRef } from "react";
import { loadGsapCore } from "../../lib/gsapLoader";

// Shows the pieces of a picture that belong to the current step of a story, and brings in the newly arrived ones with an effect. Pieces are
// marked in the markup with data-beat (the step they arrive on), data-fx (how) and optionally data-until (the step they leave on). The first
// time, and for anyone who has asked for less motion, they simply appear. A piece that changed state is stopped and set cleanly first, so
// stepping quickly back and forth never leaves anything half way.
const FROM = {
  pop: { autoAlpha: 0, scale: 0.55, y: 14 },
  rise: { autoAlpha: 0, y: 30 },
  fade: { autoAlpha: 0 },
  drop: { autoAlpha: 0, y: -150 },
};
const TO = {
  pop: { autoAlpha: 1, scale: 1, y: 0, duration: 0.6, ease: "back.out(2.2)" },
  rise: { autoAlpha: 1, y: 0, duration: 0.7, ease: "power3.out" },
  fade: { autoAlpha: 1, duration: 0.45, ease: "power1.out" },
  drop: { autoAlpha: 1, y: 0, duration: 0.9, ease: "bounce.out" },
};

export function useBeats(ref, beat, calm) {
  const prev = useRef(null);
  const gsapRef = useRef(null);

  useEffect(() => {
    if (calm) return undefined;
    let alive = true;
    loadGsapCore().then(({ gsap }) => { if (alive) gsapRef.current = gsap; }).catch(() => {});
    return () => { alive = false; };
  }, [calm]);

  useLayoutEffect(() => {
    const root = ref.current;
    if (!root) return undefined;
    const gsap = gsapRef.current;
    const first = prev.current === null;
    let order = 0;
    root.querySelectorAll("[data-beat]").forEach((node) => {
      const n = Number(node.dataset.beat);
      const until = node.dataset.until === undefined ? Infinity : Number(node.dataset.until);
      const show = n <= beat && beat < until;
      const was = !first && n <= prev.current && prev.current < until;
      if (!first && show === was) return;
      const bits = node.dataset.stagger ? node.querySelectorAll("[data-s]") : [];
      if (gsap) { gsap.killTweensOf(node); if (bits.length) gsap.killTweensOf(bits); }
      if (first || calm || !gsap) {
        if (gsap) gsap.set(bits.length ? [node, ...bits] : node, { clearProps: "transform,opacity,visibility" });
        node.style.visibility = show ? "visible" : "hidden";
        return;
      }
      const fx = node.dataset.fx in FROM ? node.dataset.fx : "pop";
      if (show) {
        const delay = order++ * 0.12;
        gsap.fromTo(node, FROM[fx], { ...TO[fx], delay, clearProps: "transform" });
        // Seats, and anything else marked data-s, then pop in one after another from the middle outwards.
        if (bits.length) gsap.fromTo(bits, { scale: 0, autoAlpha: 0 }, { scale: 1, autoAlpha: 1, duration: 0.35, ease: "back.out(3)", delay: delay + 0.3, stagger: { amount: 0.8, from: "center" }, clearProps: "transform,opacity,visibility" });
      } else if (node.dataset.exit) {
        gsap.to(node, { x: 420, autoAlpha: 0, duration: 0.9, ease: "power2.in" });
      } else {
        if (bits.length) gsap.set(bits, { clearProps: "transform,opacity,visibility" });
        gsap.to(node, { autoAlpha: 0, duration: 0.3 });
      }
    });
    prev.current = beat;
    return undefined;
  }, [beat, calm, ref]);

  useEffect(() => () => {
    const root = ref.current;
    if (root && gsapRef.current) gsapRef.current.killTweensOf(root.querySelectorAll("[data-beat], [data-s]"));
  }, [ref]);
}

// GSAP is only fetched by the few pages that use it, and only the parts they use, so nothing else on the site carries its weight. Each plugin is
// imported by name rather than as a bundle. If this file and the pages that import it were deleted, nothing else would notice.
let ready = null;

export function loadGsap() {
  ready ??= Promise.all([import("gsap"), import("gsap/ScrollTrigger"), import("gsap/DrawSVGPlugin"), import("gsap/MotionPathPlugin")]).then(([core, scroll, draw, motion]) => {
    core.gsap.registerPlugin(scroll.ScrollTrigger, draw.DrawSVGPlugin, motion.MotionPathPlugin);
    return { gsap: core.gsap, ScrollTrigger: scroll.ScrollTrigger };
  });
  return ready;
}

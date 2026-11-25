import { useEffect, useState } from "react";

// One step number that advances every `ms` while a picture is on screen (go === "1"), is not calmed (still) and has not been paused. The pictures that use it light the stage and move
// their token from the same number, so the two cannot disagree. `wrap` is true when the last move went from the final step back to the first. `pick(i)` jumps to a step and pauses;
// `toggle()` pauses or resumes.
export function useStepper(n, go, still, ms) {
  const [at, setAt] = useState({ step: 0, wrap: false });
  const [playing, setPlaying] = useState(true);
  const running = go === "1" && !still && playing;
  useEffect(() => {
    if (!running) return undefined;
    const t = setInterval(() => setAt((a) => { const next = (a.step + 1) % n; return { step: next, wrap: next < a.step }; }), ms);
    return () => clearInterval(t);
  }, [running, n, ms]);
  return { step: at.step, wrap: at.wrap, running, pick: (i) => { setAt({ step: i, wrap: false }); setPlaying(false); }, toggle: () => setPlaying((p) => !p) };
}

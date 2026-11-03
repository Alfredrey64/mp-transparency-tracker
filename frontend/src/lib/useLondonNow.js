import { useEffect, useState } from "react";
import { clockMinutes, londonClock } from "./upcoming";

// London's time of day, kept up to date every half minute, for the "now" marker and for telling earlier entries from later ones. { clock: "14:05", minutes: 845 }.
export function useLondonNow() {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 30000);
    return () => clearInterval(id);
  }, []);
  const clock = londonClock(now);
  return { clock, minutes: clockMinutes(clock) };
}

/** @jsxImportSource react */
import { useState } from "react";
import { faceSources } from "../lib/portrait";
import "../faces.css";

// A round face: the sharpest copy saved (512 pixels when it is drawn at 56 pixels or more, otherwise 240), then the ordinary small copy, and only then the person's initials on a coloured disc.
const initialsOf = (name) => String(name).replace(/ MP$/, "").replace(/^(Dr|Lord|Baroness|Lady|Rt Hon|Sir|Dame|The) /g, "").split(/\s+/).map((w) => w[0]).slice(0, 2).join("").toUpperCase();

export default function Portrait({ name, photo, colour, size = 48, className = "" }) {
  const sources = faceSources(photo, size);
  const [tried, setTried] = useState(0);
  const src = sources[tried];
  return (
    <span className={`portrait ${className}`} aria-hidden="true" style={{ "--pc": colour, width: size, height: size, fontSize: Math.round(size * 0.34) }}>
      {src ? <img key={src} src={src} alt="" width={size} height={size} loading="lazy" decoding="async" onError={() => setTried((n) => n + 1)} /> : initialsOf(name)}
    </span>
  );
}

/** @jsxImportSource react */
import { useState } from "react";
import { faceSources } from "../lib/portrait";

// A picture of a member that is drawn large enough to show the difference between a 128-pixel copy and a sharp one. It tries the sharpest copy kept on this site (up to 512 pixels,
// for current MPs), then the 240-pixel one, then the ordinary small one, and moves down the list whenever one is missing, so it only ever adds detail. Only when every copy has
// failed does it call onError, which is when the page shows the person's initials instead. `size` is how many CSS pixels the face is drawn at. Everything else goes to the <img>.
export default function FaceImg({ src, size, onError, ...rest }) {
  const chain = faceSources(src, size);
  const [state, setState] = useState({ src, n: 0 });
  const n = state.src === src ? state.n : 0;
  const current = chain[n] ?? src;
  return (
    <img
      key={current}
      src={current}
      alt=""
      decoding="async"
      {...rest}
      onError={() => { if (n + 1 < chain.length) setState({ src, n: n + 1 }); else onError?.(); }}
    />
  );
}

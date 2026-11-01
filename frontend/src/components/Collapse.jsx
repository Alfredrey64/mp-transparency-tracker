import { useState } from "react";

// A fold-out that eases open and shut: the rows grow from nothing to the content's own height (see .collapse in chrome.css), so nothing is measured in script and the
// content below glides down instead of jumping. Pass the content as a function to have it built only when it is first needed. Closed content is hidden from sight, from tabbing and from screen readers. It is drawn the first time it opens, and
// kept after that so closing can ease too.
export default function Collapse({ open, children, className = "", ...rest }) {
  const [drawn, setDrawn] = useState(open);
  if (open && !drawn) setDrawn(true);
  return (
    <div className={`collapse ${className}`.trim()} data-open={open ? "true" : "false"} inert={!open} {...rest}>
      <div className="collapse-in">{drawn ? (typeof children === "function" ? children() : children) : null}</div>
    </div>
  );
}

/** @jsxImportSource react */
import { useRef, useState } from "react";
import { createPortal } from "react-dom";
import EntryDialog from "./EntryDialog";

// useEntryDialog() -> [open, dialog]: call open(entry, button) from a row, and render `dialog` once in the same component. A day entry (kind "day") lists its items, each of
// which opens in turn with a way back.
export function useEntryDialog() {
  const [stack, setStack] = useState([]);
  const openerRef = useRef(null);
  const open = (entry, el) => { if (el) openerRef.current = el; setStack([entry]); };
  const top = stack[stack.length - 1];
  // Drawn on the page body: a pop-up inside a page that is animating or clipped would be positioned against that, not the window.
  const dialog = top ? createPortal(
    <EntryDialog
      entry={top}
      depth={stack.length}
      returnFocusRef={openerRef}
      onOpen={(e) => setStack((s) => [...s, e])}
      onBack={() => setStack((s) => s.slice(0, -1))}
      onClose={() => setStack([])}
    />,
    document.body,
  ) : null;
  return [open, dialog];
}


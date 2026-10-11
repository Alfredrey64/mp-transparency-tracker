// @vitest-environment jsdom
import { describe, expect, it, vi, afterEach } from "vitest";
import { createRoot } from "react-dom/client";
import { act, useRef } from "react";
import { useDialog } from "./useDialog";

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

function Demo({ open, onClose }) {
  const panel = useRef(null);
  const opener = useRef(null);
  useDialog({ open, onClose, panelRef: panel, returnFocusRef: opener });
  return (
    <div>
      <button ref={opener} id="opener">open</button>
      {open && (
        <div ref={panel} tabIndex={-1} id="panel">
          <button id="a">a</button>
          <button id="b">b</button>
        </div>
      )}
      <button id="outside">outside</button>
    </div>
  );
}

let root;
let host;
afterEach(() => { act(() => root?.unmount()); host?.remove(); document.body.style.overflow = ""; });

function mount(props) {
  host = document.createElement("div");
  document.body.appendChild(host);
  root = createRoot(host);
  act(() => root.render(<Demo {...props} />));
}
const press = (key, extra = {}) => act(() => { document.dispatchEvent(new KeyboardEvent("keydown", { key, bubbles: true, cancelable: true, ...extra })); });

describe("useDialog", () => {
  it("moves focus into the dialog, keeps Tab inside it and closes on Escape", () => {
    const onClose = vi.fn();
    mount({ open: true, onClose });
    expect(document.activeElement.id).toBe("panel");
    act(() => document.getElementById("b").focus());
    press("Tab");
    expect(document.activeElement.id).toBe("a");
    press("Tab", { shiftKey: true });
    expect(document.activeElement.id).toBe("b");
    press("Escape");
    expect(onClose).toHaveBeenCalledOnce();
  });

  it("stops the page behind from scrolling, and gives focus back when it closes", () => {
    mount({ open: true, onClose: () => {} });
    expect(document.body.style.overflow).toBe("hidden");
    act(() => root.render(<Demo open={false} onClose={() => {}} />));
    expect(document.body.style.overflow).toBe("");
    expect(document.activeElement.id).toBe("opener");
  });
});

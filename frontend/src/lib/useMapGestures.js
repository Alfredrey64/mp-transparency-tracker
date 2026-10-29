import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { watchSize } from "./watchWidth";

// Phone gestures for the hexagon maps: pinch with two fingers to zoom (and a trackpad pinch or Ctrl and the wheel on a laptop), and press and hold a
// seat for about half a second to pin its card without selecting it. Scrolling a zoomed map is the browser's own.
//
// readKey(event) says which seat a pointer event is over (or null). `aspect` is the map's width over its height, which with `vh` fixes how big the
// unzoomed map is: as wide as the box, but no taller than that share of the screen.

const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));
const HOLD_MS = 450;
const MOVE_PX = 9;

export function useMapGestures({ aspect, vh = 0.7, initialScale = 1, maxScale = 5, readKey }) {
  // The scrolling box is kept in state, not a ref object, so the component can read what this returns while it renders.
  const [scroller, setScroller] = useState(null);
  const [scale, setScaleState] = useState(initialScale);
  const [boxW, setBoxW] = useState(0);
  const [held, setHeld] = useState(null);
  const scaleRef = useRef(initialScale);
  const pending = useRef(null);
  const timer = useRef(0);
  const start = useRef(null);
  const suppress = useRef(false);

  // How wide the box holding the map is.
  useEffect(() => {
    const el = scroller;
    if (!el) return undefined;
    return watchSize(el, () => setBoxW(el.clientWidth));
  }, [scroller]);

  const setScale = useCallback((next, focal) => {
    const s = clamp(next, 1, maxScale);
    const el = scroller;
    const prev = scaleRef.current;
    if (el && focal && s !== prev) {
      pending.current = { left: (el.scrollLeft + focal.x) * (s / prev) - focal.x, top: (el.scrollTop + focal.y) * (s / prev) - focal.y };
    }
    scaleRef.current = s;
    setScaleState(s);
  }, [maxScale, scroller]);

  // Keep the point under the fingers where it was once the map has been resized.
  useLayoutEffect(() => {
    const el = scroller;
    if (pending.current && el) {
      el.scrollTo({ left: pending.current.left, top: pending.current.top });
      pending.current = null;
    }
  }, [scale, scroller]);

  // Pinch (touch) and Ctrl-wheel (trackpad). These need listeners that are allowed to cancel the browser's own zoom, which React's are not.
  useEffect(() => {
    const el = scroller;
    if (!el) return undefined;
    let pinch = null;
    const centre = (t) => {
      const r = el.getBoundingClientRect();
      return { x: (t[0].clientX + t[1].clientX) / 2 - r.left, y: (t[0].clientY + t[1].clientY) / 2 - r.top };
    };
    const dist = (t) => Math.hypot(t[0].clientX - t[1].clientX, t[0].clientY - t[1].clientY);
    const onStart = (e) => {
      if (e.touches.length === 2) {
        clearTimeout(timer.current);
        pinch = { d0: dist(e.touches), s0: scaleRef.current };
      }
    };
    const onMove = (e) => {
      if (pinch && e.touches.length === 2) {
        e.preventDefault();
        setScale(pinch.s0 * (dist(e.touches) / pinch.d0), centre(e.touches));
      }
    };
    const onEnd = (e) => { if (e.touches.length < 2) pinch = null; };
    const onWheel = (e) => {
      if (!e.ctrlKey) return;
      e.preventDefault();
      const r = el.getBoundingClientRect();
      setScale(scaleRef.current * Math.exp(-e.deltaY * 0.006), { x: e.clientX - r.left, y: e.clientY - r.top });
    };
    el.addEventListener("touchstart", onStart, { passive: true });
    el.addEventListener("touchmove", onMove, { passive: false });
    el.addEventListener("touchend", onEnd);
    el.addEventListener("touchcancel", onEnd);
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => {
      el.removeEventListener("touchstart", onStart);
      el.removeEventListener("touchmove", onMove);
      el.removeEventListener("touchend", onEnd);
      el.removeEventListener("touchcancel", onEnd);
      el.removeEventListener("wheel", onWheel);
    };
  }, [setScale, scroller]);

  useEffect(() => () => clearTimeout(timer.current), []);

  // Press and hold, on the map's own element.
  const holdProps = {
    onPointerDown: (e) => {
      if (e.pointerType === "mouse") return;
      const key = readKey(e);
      if (key == null) { setHeld(null); return; }
      start.current = { x: e.clientX, y: e.clientY };
      clearTimeout(timer.current);
      timer.current = setTimeout(() => {
        suppress.current = true;
        setHeld(key);
        if (navigator.vibrate) navigator.vibrate(12);
      }, HOLD_MS);
    },
    onPointerMove: (e) => {
      if (start.current && Math.hypot(e.clientX - start.current.x, e.clientY - start.current.y) > MOVE_PX) clearTimeout(timer.current);
    },
    onPointerUp: () => { clearTimeout(timer.current); start.current = null; },
    onPointerCancel: () => { clearTimeout(timer.current); start.current = null; },
    onContextMenu: (e) => { if (suppress.current || e.pointerType === "touch") e.preventDefault(); },
  };

  // Call from the click handler: true when the click is just the end of a press and hold, which should not also select the seat.
  const consumeClick = useCallback(() => {
    if (!suppress.current) return false;
    suppress.current = false;
    return true;
  }, []);

  // Bring a point (as a fraction of the map's width and height) to the middle of the box.
  const centreOn = useCallback((fx, fy) => {
    if (!scroller) return;
    scroller.scrollTo({ left: fx * scroller.scrollWidth - scroller.clientWidth / 2, top: fy * scroller.scrollHeight - scroller.clientHeight / 2, behavior: "smooth" });
  }, [scroller]);

  const baseW = Math.min(boxW || 320, typeof window === "undefined" ? 800 : window.innerHeight * vh * aspect);
  return {
    attachScroller: setScroller,
    scale,
    width: Math.round(baseW * scale),
    zoomIn: () => setScale(scaleRef.current * 1.5, { x: (scroller?.clientWidth ?? 0) / 2, y: (scroller?.clientHeight ?? 0) / 2 }),
    zoomOut: () => setScale(scaleRef.current / 1.5, { x: (scroller?.clientWidth ?? 0) / 2, y: (scroller?.clientHeight ?? 0) / 2 }),
    canZoomIn: scale < maxScale - 0.01,
    canZoomOut: scale > 1.01,
    holdProps,
    held,
    clearHeld: () => setHeld(null),
    consumeClick,
    centreOn,
  };
}

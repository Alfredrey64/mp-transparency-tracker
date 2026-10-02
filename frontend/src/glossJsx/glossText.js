import { memo, useContext, useSyncExternalStore } from "react";
import { GlossBlockedContext } from "./blockContext";

// Not JSX on purpose: files in this folder are what the JSX transform itself
// depends on, so they can't be compiled through it.

// The glossary (term list, matcher, popover component) is a sizeable chunk
// and nothing on screen needs it to paint, so it's fetched shortly after
// first render rather than with the page's own code. Until it lands every
// GlossText just renders its plain string; when it does, they all re-render
// once with their underlined versions.
let engine = null;
let loading = null;
const listeners = new Set();

function loadEngine() {
  loading ??= new Promise((resolve) => setTimeout(resolve, 150))
    .then(() => import("../components/glossEngine"))
    .then((m) => {
      engine = m;
      listeners.forEach((notify) => notify());
    });
}

function subscribe(listener) {
  listeners.add(listener);
  loadEngine();
  return () => listeners.delete(listener);
}

const getEngine = () => engine;
const noEngine = () => null;

export const GlossText = memo(function GlossText({ text }) {
  const blocked = useContext(GlossBlockedContext);
  const loaded = useSyncExternalStore(subscribe, getEngine, noEngine);
  if (blocked || !loaded) return text;
  return loaded.renderGlossed(text);
});

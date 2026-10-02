import { createElement, Fragment } from "react";
import { GlossBlockedContext } from "./blockContext";
import { GlossText } from "./glossText";

// Decides, for every element the app creates, whether its text should be
// offered to the glossary. Only plain text containers qualify, and only for
// strings long enough to be prose rather than a label or a name.
const TEXT_TAGS = new Set(["p", "li", "span", "div", "td", "th", "dd", "dt", "em", "strong", "i", "b", "small", "blockquote", "figcaption"]);
const BLOCK_TAGS = new Set(["a", "button", "summary", "label"]);
const MIN_LENGTH = 20;

export function prepareProps(type, props) {
  const isFragment = type === Fragment;
  const isHost = typeof type === "string";
  // framer-motion's motion.div / motion.p etc. are objects, not strings.
  const isMotionLike = !isHost && typeof type === "object" && type !== null;
  if (!isHost && !isMotionLike && !isFragment) return props;

  const children = props.children;
  if (children == null || typeof children === "function") return props;

  const interactive =
    (isHost && BLOCK_TAGS.has(type)) || props.role === "button" || (isMotionLike && (props.onClick || props.href));
  if (interactive) {
    const wasArray = Array.isArray(children);
    const provider = createElement(GlossBlockedContext.Provider, { value: true }, ...(wasArray ? children : [children]));
    // Keep the original shape: React is told whether children were a static
    // array, and complains if the two disagree.
    return { ...props, children: wasArray ? [provider] : provider };
  }

  if (isHost && !TEXT_TAGS.has(type)) return props;

  if (typeof children === "string") {
    return children.length >= MIN_LENGTH ? { ...props, children: createElement(GlossText, { text: children }) } : props;
  }
  if (Array.isArray(children)) {
    let changed = false;
    const next = children.map((child, i) => {
      if (typeof child === "string" && child.length >= MIN_LENGTH) {
        changed = true;
        return createElement(GlossText, { text: child, key: `gloss-${i}` });
      }
      return child;
    });
    return changed ? { ...props, children: next } : props;
  }
  return props;
}

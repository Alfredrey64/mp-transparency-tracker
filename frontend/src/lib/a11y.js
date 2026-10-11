// A box that scrolls (a wide table, a long list) has to be reachable from the keyboard, or someone not using a mouse cannot scroll it to
// read what is hidden. This gives such a box a tab stop and a name that a screen reader announces. Spread it onto the scrolling element:
//   <div {...scrollRegion("How the rate has moved")} style={{ overflowX: "auto" }}>
export const scrollRegion = (label) => ({ tabIndex: 0, role: "region", "aria-label": label });

// Makes a clickable box that is not a real button usable from the keyboard: it gets a tab stop, the button role and Enter or Space to
// activate. It only reacts when the key is pressed on the box itself, so a link or button inside it keeps working. Pass the same handler
// the box uses for clicks. `label` is the short name a screen reader says, and `expanded` is for boxes that open and close.
export function keyboardActivate(handler, { label, expanded } = {}) {
  return {
    role: "button",
    tabIndex: 0,
    ...(label ? { "aria-label": label } : {}),
    ...(expanded === undefined ? {} : { "aria-expanded": expanded }),
    onKeyDown: (event) => {
      if (event.target !== event.currentTarget) return;
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        handler(event);
      }
    },
  };
}

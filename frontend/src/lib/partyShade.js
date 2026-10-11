// The soft wash of a party's colour used behind its cards, and the matching outline. Built with color-mix so it works for any colour
// (including one that is not a plain hex code) and in both light and dark mode.
const mix = (colour, percent) => `color-mix(in srgb, ${colour} ${percent}%, transparent)`;

export const partyWash = (colour, strength = 1) =>
  `linear-gradient(165deg, ${mix(colour, 18 * strength)} 0%, ${mix(colour, 7 * strength)} 55%, ${mix(colour, 3 * strength)} 100%)`;

export const partyOutline = (colour) => `1px solid ${mix(colour, 33)}`;

import { SKIN } from "./palette";

// How each party leader is drawn on their slide, chosen to match the real person (skin tone, hair colour and whether the hair is long enough to show at
// the sides). It is looked up by the leader's NAME, so when a party changes its leader the slide switches to that person's entry, and a leader who has
// no entry yet is drawn as a plain, neutral figure rather than as somebody they are not. Add an entry here whenever a new leader is added to
// data/teacherMode.js; a test fails until you do.
export const LEADER_LOOKS = {
  "Andy Burnham": { skin: SKIN[0], hair: "#6B4A32", long: false },
  "Kemi Badenoch": { skin: SKIN[4], hair: "#15100C", long: true },
  "Ed Davey": { skin: SKIN[0], hair: "#B8B8B8", long: false },
  "Nigel Farage": { skin: SKIN[0], hair: "#A89F91", long: false },
  "Zack Polanski": { skin: SKIN[0], hair: "#2B1D14", long: false },
  "John Swinney": { skin: SKIN[0], hair: "#9A9A9A", long: false },
  "Rhun ap Iorwerth": { skin: SKIN[0], hair: "#3B2A20", long: false },
};

export const NEUTRAL_LOOK = { skin: "#CBD5E6", hair: "#5B6B84", long: false };

export const leaderLook = (name) => LEADER_LOOKS[name] ?? NEUTRAL_LOOK;

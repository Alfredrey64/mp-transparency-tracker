// The one timing for everything that folds open and shut, so every expandable on the site moves the same way: it opens on a long, soft ease-out and closes a little quicker on a
// plainer curve (leaving should feel lighter than arriving). Components/Unfold.jsx uses both; other fold-outs use FOLD as their `transition`.
export const FOLD = {
  height: { duration: 0.34, ease: [0.22, 1, 0.36, 1] },
  opacity: { duration: 0.24, ease: "easeOut", delay: 0.04 },
};
export const FOLD_SHUT = {
  height: { duration: 0.24, ease: [0.4, 0, 0.2, 1] },
  opacity: { duration: 0.14, ease: "easeIn" },
};

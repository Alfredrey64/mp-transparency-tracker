import { t } from "./i18n";

// `const t = useT()` then `t("Your postcode")`. The site is English only for now (see lib/i18n.js), so this returns the same words, and the same function each time.
export function useT() {
  return t;
}

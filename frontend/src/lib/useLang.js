import { useCallback, useSyncExternalStore } from "react";
import { subscribe, getVersion, getLang, setLang, t as translateNow } from "./i18n";

// The site's language as React state. Any part of the page that calls this is drawn again when the language changes or the Welsh words arrive.
export function useLang() {
  useSyncExternalStore(subscribe, getVersion, getVersion);
  return [getLang(), setLang];
}

// `const t = useT()` then `t("Your postcode")`. The returned function is new whenever the words change, so it is safe in effect and memo lists.
export function useT() {
  const ver = useSyncExternalStore(subscribe, getVersion, getVersion);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  return useCallback((text, vars) => translateNow(text, vars), [ver]);
}

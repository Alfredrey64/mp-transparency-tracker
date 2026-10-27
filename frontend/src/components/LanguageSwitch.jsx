/** @jsxImportSource react */
import { LANG_NAMES } from "../lib/i18n";
import { useLang } from "../lib/useLang";

// One button that swaps the site between English and Welsh. It always names the language it would switch to, in that language and marked as such, so a Welsh
// reader looking at English finds "Cymraeg" and an English reader looking at Welsh finds "English".
export default function LanguageSwitch({ className = "" }) {
  const [lang, setLang] = useLang();
  const other = lang === "cy" ? "en" : "cy";
  return (
    <button type="button" className={className} lang={other} hrefLang={other} onClick={() => setLang(other)}>{LANG_NAMES[other]}</button>
  );
}

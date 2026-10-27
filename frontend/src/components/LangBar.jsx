/** @jsxImportSource react */
import LanguageSwitch from "./LanguageSwitch";

// A slim strip above the header with the one thing it holds: the language switch. It sits outside the header so the header's menu keeps all its room, and it is
// hidden where the header folds into its menu button, because the menu holds the switch there.
export default function LangBar() {
  return <div className="langbar"><LanguageSwitch className="langbar-btn" /></div>;
}

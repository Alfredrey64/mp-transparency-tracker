// The Welsh words, keyed by the English sentence they replace. Each file covers one part of the site and they are merged here, so a part's words can be
// added without touching the others. This whole folder is downloaded only when a visitor chooses Welsh.
import chrome from "./chrome.js";
import menus from "./menus.js";
import pages from "./pages.js";

export default { ...chrome, ...menus, ...pages };

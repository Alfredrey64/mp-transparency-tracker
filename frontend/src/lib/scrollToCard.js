import { glide } from "./scrollBehavior";
// Scrolls a Britain in numbers card into view and flashes it, so the eye finds it.
// The charts below the first few are drawn a little after the page (see SectorPage), so one that is not there yet is asked for first.
export const SHOW_ALL_CARDS = "ons-show-all-cards";

export function scrollToCard(id) {
  let el = document.getElementById(`s-${id}`);
  if (!el) {
    window.dispatchEvent(new Event(SHOW_ALL_CARDS));
    el = document.getElementById(`s-${id}`);
  }
  if (!el) return;
  el.scrollIntoView({ behavior: glide(), block: "start" });
  el.classList.add("ons-flash");
  setTimeout(() => el.classList.remove("ons-flash"), 2000);
}

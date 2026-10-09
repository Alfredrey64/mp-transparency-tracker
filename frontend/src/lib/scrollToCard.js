// Scrolls a Britain in numbers card into view and flashes it, so the eye finds it.
export function scrollToCard(id) {
  const el = document.getElementById(`s-${id}`);
  if (!el) return;
  el.scrollIntoView({ behavior: "smooth", block: "start" });
  el.classList.add("ons-flash");
  setTimeout(() => el.classList.remove("ons-flash"), 2000);
}

// Switching an in-page tab/filter can change the content's height enough
// that the browser clamps the current scroll position, which reads as an
// unwanted jump back toward the top. This captures the scroll position
// before the state change and restores it once the new content has
// painted (two animation frames deep, since a single frame can land
// before layout has settled).
export function withScrollPreserved(fn) {
  const y = window.scrollY;
  fn();
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      window.scrollTo(0, y);
    });
  });
}

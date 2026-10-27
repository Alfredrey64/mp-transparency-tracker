/** @jsxImportSource react */
// Shown at the top of a page that has no Welsh version yet, while Welsh is switched on. It is written in both languages, so it makes sense to a reader of either,
// and marked with each language so a screen reader says it properly.
export default function EnglishOnlyNotice() {
  return (
    <div className="lang-notice" role="note">
      <p lang="cy">Mae&apos;r dudalen hon ar gael yn Saesneg yn unig am y tro. Mae&apos;r dewislenni, y chwilio a&apos;r troedyn yn Gymraeg.</p>
      <p lang="en">This page is only in English for now. The menus, the search and the footer are in Welsh.</p>
    </div>
  );
}

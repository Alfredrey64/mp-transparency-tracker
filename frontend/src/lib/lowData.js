// True when the visitor has asked their browser to save data, or is on a connection the browser reports as 2G. The extras that only decorate the
// page (the glossary underlining, drifting dots on diagrams) are skipped then, so what arrives is what the page needs.
export function lowData() {
  const link = typeof navigator === "undefined" ? null : navigator.connection;
  return Boolean(link && (link.saveData || /(^|-)2g$/.test(link.effectiveType ?? "")));
}

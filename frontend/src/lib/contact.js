// The one public address for the site: corrections, questions and press. It forwards to the person who runs the site, whose own address is never shown.

export const CONTACT_EMAIL = "hello@domesdaylive.co.uk";
export const REPO_URL = "https://github.com/Alfredrey64/mp-transparency-tracker";

// A link that opens the visitor's mail app with the subject (and, if given, a starting message) filled in.
export function mailLink(subject, body = "") {
  const q = [`subject=${encodeURIComponent(subject)}`, body && `body=${encodeURIComponent(body)}`].filter(Boolean).join("&");
  return `mailto:${CONTACT_EMAIL}?${q}`;
}

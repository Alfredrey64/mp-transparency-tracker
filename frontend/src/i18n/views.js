// The pages that have a Welsh version. On any other page the site's frame (menus, footer, search) is Welsh but the page itself is English, so the page says so in
// both languages and its content is marked as English for screen readers. A page is added here once everything on it is translated.
export const WELSH_VIEWS = new Set(["accessibility", "myBallot", "compareCouncils", "howtovote"]);
export const hasWelsh = (view) => WELSH_VIEWS.has(view);

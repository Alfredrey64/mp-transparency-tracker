import { useState, useEffect, useLayoutEffect, useRef, useTransition, Suspense, lazy } from "react";
import { useDisplay, LISTEN_EVENT } from "./lib/useDisplay";
import { flushSync } from "react-dom";
import { GuideKeyContext, guideKeyFor } from "./lib/viewContext";
import { MotionConfig } from "motion/react";
import { supabase } from "./supabaseClient";
import { COLORS, FONT_BODY } from "./theme";
import SiteHeader from "./components/SiteHeader";
import SiteFooter from "./components/SiteFooter";
import BackToTop from "./components/BackToTop";
import "./chrome.css";
import { HEMICYCLE } from "./lib/seatMark";
import { installScrollReveal } from "./lib/scrollReveal";
import { installGlow } from "./lib/glow";
import Home from "./components/Home";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { SECTIONS } from "./data/sidebarSections";
import HubTabs from "./components/HubTabs";
import { LOADERS } from "./pageLoaders";
import { EXPLAINER_KEYS } from "./data/explainerKeys";
import { startGlossDedupe } from "./glossJsx/dedupe";
import { trackPage } from "./lib/analytics";
import { lowData } from "./lib/lowData";
import { lazyPage, preloadPage } from "./lib/lazyPage";
import Loading from "./components/Loading";
import { currentRoute } from "./lib/route";
import OfflineBanner from "./components/OfflineBanner";
import { InstallBanner } from "./components/InstallApp";
import { useLang, useT } from "./lib/useLang";
import { hasWelsh } from "./i18n/views";
import EnglishOnlyNotice from "./components/EnglishOnlyNotice";
import LangBar from "./components/LangBar";

// Everything below is code-split per page: a visitor to the homepage
// shouldn't have to download the other ~30 pages' code up front. Home and
// SiteHeader stay eager imports above so the very first paint has no loading
// flash.
const PoliticianList = lazyPage(LOADERS.list);
const SectionNav = lazy(() => import("./components/SectionNav"));
const PageTools = lazy(() => import("./components/PageTools"));
const ReadAloud = lazy(() => import("./components/ReadAloud"));
const PageFoot = lazy(() => import("./components/PageFoot"));
const LOAD_DETAIL = () => import("./components/PoliticianDetail");
const PoliticianDetail = lazyPage(LOAD_DETAIL);
const VotingRecords = lazyPage(LOADERS.voting);
const HowParliamentWorks = lazyPage(LOADERS.howitworks);
const AppgMemberships = lazyPage(LOADERS.appg);
const DonorsLobbying = lazyPage(LOADERS.donors);
const PartyFinances = lazyPage(LOADERS.partyFinances);
const PartyPolicies = lazyPage(LOADERS.parties);
const GovernmentTracker = lazyPage(LOADERS.tracker);
const Methodology = lazyPage(LOADERS.methodology);
const Glossary = lazyPage(LOADERS.glossary);
const PoliticalHistory = lazyPage(LOADERS.history);
const Timeline = lazyPage(LOADERS.timeline);
const DevolvedAdministrations = lazyPage(LOADERS.devolved);
const FormerMps = lazyPage(LOADERS.formerMps);
const ByElections = lazyPage(LOADERS.byElections);
const GovernmentBudget = lazyPage(LOADERS.budget);
const Cabinet = lazyPage(LOADERS.cabinet);
const HouseOfLords = lazyPage(LOADERS.lords);
const Petitions = lazyPage(LOADERS.petitions);
const PartyMatch = lazyPage(LOADERS.partymatch);
const Settings = lazyPage(LOADERS.settings);
const PrivacyPolicy = lazyPage(LOADERS.privacy);
const TermsConditions = lazyPage(LOADERS.terms);
const Accessibility = lazyPage(LOADERS.accessibility);
const WhatsNew = lazyPage(LOADERS.whatsnew);
const Committees = lazyPage(LOADERS.committees);
const ComparePoliticians = lazyPage(LOADERS.compare);
const MinisterialMeetings = lazyPage(LOADERS.ministerialMeetings);
const WrittenQuestions = lazyPage(LOADERS.writtenQuestions);
const StandardsReports = lazyPage(LOADERS.standards);
const MyMP = lazyPage(LOADERS.myMP);
const MediaLiteracy = lazyPage(LOADERS.mediaLiteracy);
const Rankings = lazyPage(LOADERS.rankings);
const DarkMoney = lazyPage(LOADERS.darkMoney);
const RevolvingDoor = lazyPage(LOADERS.revolvingDoor);
const ThinkTankFunding = lazyPage(LOADERS.thinkTanks);
const LobbyingRegister = lazyPage(LOADERS.lobbyingRegister);
const EXPLAINERS = Object.fromEntries(EXPLAINER_KEYS.map((k) => [k, lazyPage(LOADERS[k])]));
const FollowTheMoney = lazyPage(LOADERS.followTheMoney);
const WatchlistDigest = lazyPage(LOADERS.watchlist);
const ParliamentNumbers = lazyPage(LOADERS.numbers);
const AskedAbout = lazyPage(LOADERS.topics);
const Constituency = lazyPage(LOADERS.constituency);
const Marginals = lazyPage(LOADERS.marginals);
const CompareSeats = lazyPage(LOADERS.compareSeats);
const CompareCouncils = lazyPage(LOADERS.compareCouncils);
const StartHere = lazyPage(LOADERS.start);
const Rebels = lazyPage(LOADERS.rebels);
const Offices = lazyPage(LOADERS.offices);
const Councils = lazyPage(LOADERS.councils);
const SectorPage = lazyPage(LOADERS.economy);
const RegionsPage = lazyPage(LOADERS.regions);
const AnswersPage = lazyPage(LOADERS.answers);
const DeprivationPage = lazyPage(LOADERS.deprivation);
const IndicatorTimeline = lazyPage(LOADERS.indicators);
const HowToVote = lazyPage(LOADERS.howtovote);
const MyBallot = lazyPage(LOADERS.myBallot);
const TeacherMode = lazyPage(LOADERS.teacher);
const LocalElections = lazyPage(LOADERS.localElections);
const GeneralElection = lazyPage(LOADERS.generalElection);
const TaxRates = lazyPage(LOADERS.taxRates);
const Inequality = lazyPage(LOADERS.inequality);
const Brexit = lazyPage(LOADERS.brexit);
const Defence = lazyPage(LOADERS.defence);
const Education = lazyPage(LOADERS.education);
const Nhs = lazyPage(LOADERS.nhs);
const Energy = lazyPage(LOADERS.energy);
const Trust = lazyPage(LOADERS.trust);
const Care = lazyPage(LOADERS.care);
const Transport = lazyPage(LOADERS.transport);
const Union = lazyPage(LOADERS.union);
const Ageing = lazyPage(LOADERS.ageing);
const Calculators = lazyPage(LOADERS.calculators);
const Funding = lazyPage(LOADERS.funding);
const MyArea = lazyPage(LOADERS.myArea);
const ThisWeek = lazyPage(LOADERS.thisWeek);
const Councillors = lazyPage(LOADERS.councillors);
const LordsVotes = lazyPage(LOADERS.lordsVotes);
const SECTOR_VIEWS = new Set(["economy", "prices", "jobs", "publicFinances", "population", "health", "housing", "crime", "trade", "environment", "tax", "rates", "immigration", "business"]);

// A quiet authorship mark, not a feature — printed once so a copy of this
// site with the byline stripped from the UI still carries proof of where
// it came from.
console.log(
  "%cSimple Politics%c\nDesigned and built by Alfred Reynolds.",
  "font-weight: bold; font-size: 13px; color: #1E4FB8;",
  "color: inherit;"
);

// A page drawn from data, handed in as the component to show.
function ExplainerView({ page: Page }) {
  return <Page />;
}

// While a page's code is on its way the footer must stay below the fold: a short placeholder left it half way up the screen, and it then jumped down
// when the page arrived (the layout shift Lighthouse measured at 0.2 to 0.3).
function PageLoadingFallback() {
  return <div className="page-loading" style={{ minHeight: "100vh" }}><Loading /></div>;
}

// Every key the big view === "x" switch below actually handles. The URL
// hash is user-editable (typed, pasted, bookmarked from an old link) so an
// unrecognised segment falls back to Home rather than rendering nothing.
const VALID_VIEWS = new Set([
  ...EXPLAINER_KEYS,
  "home", "appg", "howitworks", "voting", "donors", "partyFinances", "parties", "history", "timeline",
  "devolved", "tracker", "budget", "cabinet", "lords", "formerMps", "byElections", "petitions", "partymatch",
  "committees", "compare", "ministerialMeetings", "writtenQuestions", "standards", "rankings", "myMP",
  "mediaLiteracy", "methodology", "glossary", "settings", "privacy", "terms", "accessibility", "whatsnew", "list",
  "darkMoney", "revolvingDoor", "thinkTanks", "lobbyingRegister", "followTheMoney", "watchlist", "numbers", "topics", "constituency", "start", "rebels", "offices", "councils",
  "economy", "prices", "jobs", "publicFinances", "population", "health", "housing", "crime", "trade", "environment", "tax", "rates", "immigration", "business", "regions", "answers", "deprivation", "indicators", "marginals", "compareSeats", "compareCouncils", "howtovote", "myBallot", "teacher", "localElections", "generalElection", "taxRates", "inequality", "brexit", "defence", "education", "ageing", "nhs", "energy", "trust", "care", "transport", "union", "calculators", "funding", "myArea", "thisWeek", "councillors", "lordsVotes",
]);

// The tab title, bookmark name and browser-history entry for every view —
// built from the same labels the sidebar already shows, so a page's title
// here can't drift out of sync with what it's actually called in the nav.
// A handful of pages that sit outside any sidebar section (Home, My MP,
// Settings, the legal pages) get their own entry below instead.
const PAGE_TITLES = Object.fromEntries(
  SECTIONS.flatMap((section) => section.items.map((item) => [item.key, item.label]))
);
Object.assign(PAGE_TITLES, {
  home: "A simple breakdown of UK politics",
  myMP: "My MP",
  watchlist: "My Watchlist",
  methodology: "Data & Methodology",
  settings: "Settings",
  privacy: "Privacy Policy",
  terms: "Terms & Conditions",
  accessibility: "Accessibility",
  whatsnew: "What's new",
});

function titleForState(view, selected, param, tr = (x) => x) {
  const base = "Simple Politics";
  if (selected) return `${selected.name} | ${base}`;
  if (view === "numbers" && param === "lords") return `Parliament in Numbers: the Lords | ${base}`;
  if (view === "numbers" && param === "who") return `Parliament in Numbers: who they are | ${base}`;
  // For the Lords the parameter is a peer's id, which makes a poor title.
  if (param && view !== "lords" && view !== "numbers" && view !== "councils" && view !== "indicators" && !SECTOR_VIEWS.has(view) && view !== "regions" && view !== "answers" && view !== "deprivation" && view !== "compareSeats" && view !== "compareCouncils" && view !== "parties" && view !== "generalElection" && view !== "taxRates" && view !== "inequality" && view !== "brexit" && view !== "defence" && view !== "education" && view !== "ageing" && view !== "nhs" && view !== "energy" && view !== "trust" && view !== "care" && view !== "transport" && view !== "union" && view !== "calculators" && view !== "teacher") return `${param} | ${tr(PAGE_TITLES[view] ?? base)} | ${base}`;
  if (view === "home") return base;
  const label = PAGE_TITLES[view];
  return label ? `${tr(label)} | ${base}` : base;
}

// A minimal hash router — no react-router dependency needed for a flat set
// of ~30 pages plus one detail view. "#/mp/123" links straight to an MP;
// any other "#/key" maps to a view; anything unrecognised (or no hash at
// all) is Home. Hash-based so it needs zero server-side rewrite rules on
// Vercel — a path-based scheme would 404 on refresh without one.
function parseHash() {
  const raw = currentRoute();
  const segments = raw.split("/").filter(Boolean);
  // The seat map used to be its own page; its links now open the merged
  // Your Constituency page.
  if (segments[0] === "seatmap") segments[0] = "constituency";
  // Who MPs are was folded into Parliament in numbers as its third tab.
  if (segments[0] === "mpProfile") segments.splice(0, 1, "numbers", "who");
  // Taxes and spending and Tax rates through time became one page, Taxes. Old links to #/tax open its Overview.
  if (segments[0] === "tax") segments.splice(0, 1, "taxRates", "overview");
  // Where taxes go is now the Where it goes toggle on the Taxes page.
  if (segments[0] === "budget") segments.splice(0, 1, "taxRates", "where");
  if (segments[0] === "mp" && /^\d+$/.test(segments[1] ?? "")) {
    return { view: "list", mpId: Number(segments[1]), param: null };
  }
  if (VALID_VIEWS.has(segments[0])) {
    // A second segment is a page-specific parameter (the constituency
    // page's seat name), URL-encoded; a malformed escape just means none.
    let param;
    try {
      param = segments[1] ? decodeURIComponent(segments.slice(1).join("/")) : null;
    } catch {
      param = null;
    }
    return { view: segments[0], mpId: null, param };
  }
  return { view: "home", mpId: null, param: null };
}

function pathForState(view, selected, param) {
  if (selected) return `/mp/${selected.id}`;
  if (param) return `/${view}/${param.split("/").map(encodeURIComponent).join("/")}`;
  return view === "home" ? "/" : `/${view}`;
}

const samePath = (a, b) => {
  try { return decodeURI(a) === decodeURI(b); } catch { return a === b; }
};

export default function App() {
  // Reading a page aloud, and calmer motion, both come from the accessibility panel (components/AccessibilityControls.jsx).
  const [display] = useDisplay();
  const [listening, setListening] = useState(false);
  useEffect(() => {
    const on = () => setListening(true);
    window.addEventListener(LISTEN_EVENT, on);
    return () => window.removeEventListener(LISTEN_EVENT, on);
  }, []);
  const [view, setView] = useState(() => parseHash().view);
  // The page-specific part of the URL after the view name, if any.
  const [viewParam, setViewParam] = useState(() => parseHash().param);
  const [lang] = useLang();
  const t = useT();
  // Whether this page has a Welsh version. If not, and Welsh is on, the page says it is English only (see components/EnglishOnlyNotice.jsx).
  const welsh = hasWelsh(view);
  const [selected, setSelected] = useState(null);
  const [mpCount, setMpCount] = useState(null);
  // Page changes run as transitions: the page you are on stays on screen until the next one (and its code) is ready, instead of
  // blanking to "Loading…" first. `navTarget` is where you are heading, so the sidebar highlights it at once.
  const [navPending, startNav] = useTransition();
  const [navTarget, setNavTarget] = useState(view);
  // True while the next page's code is still on its way, before the cross-fade starts (see swapPage).
  const [fetching, setFetching] = useState(false);
  const navId = useRef(0);

  useEffect(() => startGlossDedupe(document.getElementById("root")), []);
  useEffect(() => installGlow(), []);
  useEffect(() => installScrollReveal(document.getElementById("main-content")?.parentElement), []);
  // One anonymous page view each time the page changes (the page's name only; see lib/analytics.js).
  useEffect(() => { trackPage(selected ? "mp" : view, viewParam); }, [view, selected, viewParam]);
  // Set only when navigating away from an MP's own profile to a page that
  // can be pre-filtered to them (their full voting history, their written
  // questions) — so e.g. clicking a vote on the profile lands you on that
  // MP's history, not a blank picker. Cleared on any ordinary sidebar
  // navigation so it doesn't leak into an unrelated later visit.
  const [pendingMp, setPendingMp] = useState(null);
  // Same idea as pendingMp, for the one bill a visitor just clicked on the
  // homepage — lets Voting Records open straight to that bill instead of
  // just landing at the top of its full list.
  const [pendingBill, setPendingBill] = useState(null);
  const isPopping = useRef(false);
  // The page's main region: the skip link jumps to it, and it takes focus when the page
  // changes so a screen reader announces the new page instead of staying on the old link.
  const mainRef = useRef(null);
  const firstPage = useRef(true);
  // True for the one render where a direct "#/mp/123" link hasn't finished
  // fetching that MP yet — the URL-sync effect below must not overwrite the
  // hash back to "#/list" during that brief window, or a shared/bookmarked
  // link to an MP would silently rewrite itself before it even loads.
  const initialMpPending = useRef(false);

  useEffect(() => {
    if (firstPage.current) { firstPage.current = false; return; }
    mainRef.current?.focus({ preventScroll: true });
  }, [view, selected?.id]);

  // A new page opens at its top, in the same frame it appears, so you never see the new page at the old scroll position or the old
  // page jumping to the top first. (Changes inside a page, such as a chart's range, do not come through here.)
  const shownPage = useRef(`${view}|${selected?.id ?? ""}`);
  useLayoutEffect(() => {
    const now = `${view}|${selected?.id ?? ""}`;
    if (shownPage.current === now) return;
    shownPage.current = now;
    window.scrollTo(0, 0);
  }, [view, selected?.id]);

  useEffect(() => {
    async function loadCount() {
      const { count } = await supabase.from("politicians").select("*", { count: "exact", head: true });
      setMpCount(count);
    }
    loadCount();
  }, []);

  // A direct link to "#/mp/123" only carries an id — fetch that MP's full
  // record once on load. Declared before the URL-sync effect below so it
  // sets initialMpPending before that effect's first run in the same commit.
  useEffect(() => {
    const { mpId } = parseHash();
    if (!mpId) return;
    initialMpPending.current = true;
    async function loadMp() {
      const { data } = await supabase.from("politicians").select("*").eq("id", mpId).single();
      if (data) setSelected(data);
      initialMpPending.current = false;
    }
    loadMp();
  }, []);

  // Keep the URL in sync with navigation, so every page and MP is a
  // bookmarkable, shareable link and the browser back/forward buttons work.
  useEffect(() => {
    if (isPopping.current) {
      isPopping.current = false;
      return;
    }
    if (initialMpPending.current) return;
    const next = pathForState(view, selected, viewParam);
    if (!samePath(window.location.pathname, next)) {
      window.history.pushState(null, "", next);
    }
  }, [view, selected, viewParam]);

  // The tab title, and the name a bookmark or browser-history entry
  // actually gets, used to be the same generic "Simple Politics" on
  // every single page — no help at all with five tabs open, or finding an
  // MP's page again in history. This is the one piece of per-page SEO a
  // client-only SPA can do for real: a crawler that never executes JS
  // still only ever sees index.html's static title, but the document
  // title itself, and what search engines that DO render JS index, follow
  // the actual page.
  // The title is in Welsh only on a page that has a Welsh version, so it always matches the page it names.
  useEffect(() => {
    document.title = titleForState(view, selected, viewParam, welsh ? t : undefined);
  }, [view, selected, viewParam, welsh, t]);

  // Re-sync app state whenever the URL changes from outside our own
  // pushState calls: "popstate" covers the browser's back/forward buttons,
  // "hashchange" covers everything else that changes just the fragment
  // without a full reload — typing a new hash into the address bar,
  // clicking a plain "#/x" link, a bookmark opened in this same tab. Only
  // pushState itself is silent (fires neither event, by spec), which is
  // exactly why the URL-sync effect above needs no guard against this one.
  useEffect(() => {
    function syncFromUrl() {
      isPopping.current = true;
      const parsed = parseHash();
      if (parsed.mpId) {
        swapPage("list", () => {
          setSelected(null);
          setViewParam(null);
          setView("list");
        });
        supabase.from("politicians").select("*").eq("id", parsed.mpId).single().then(({ data }) => {
          if (data) startNav(() => setSelected(data));
        });
      } else {
        swapPage(parsed.view, () => {
          setSelected(null);
          setViewParam(parsed.param);
          setView(parsed.view);
        });
      }
    }
    window.addEventListener("popstate", syncFromUrl);
    return () => window.removeEventListener("popstate", syncFromUrl);
  }, []);

  // Changes the page. Where the browser can cross-fade between two states of a page (View Transitions), the next page's code is
  // fetched first while the current page stays put, then the two dissolve into each other, so there is no blank flash, no jump and
  // no half-built page. Elsewhere (or for people who ask for less motion, or on a slow connection) it falls back to React's own
  // transition, which also keeps the old page up until the new one is ready. Either way the change happens on the click.
  function swapPage(key, apply, preload) {
    setNavTarget(key);
    const root = document.documentElement;
    const loader = preload ?? LOADERS[key];
    const reduce = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    if (typeof document.startViewTransition !== "function" || reduce || lowData() || (!loader && key !== "home")) {
      startNav(apply);
      return;
    }
    const id = ++navId.current;
    setFetching(true);
    // The page you are leaving dims at once, so the click is answered in the same frame even while the next page is still on its way.
    root.dataset.leaving = "1";
    const wait = new Promise((resolve) => setTimeout(resolve, 2500));
    Promise.race([preloadPage(loader), wait]).then(() => {
      // A newer click has taken over: let that one win.
      if (id !== navId.current) return;
      setFetching(false);
      root.dataset.vt = "1";
      const transition = document.startViewTransition(() => { delete root.dataset.leaving; flushSync(apply); });
      const done = () => { if (id === navId.current) { delete root.dataset.vt; delete root.dataset.leaving; } };
      // A click that arrives mid-transition aborts it: that is expected, so the other promises are answered too rather than left to report an error.
      transition.ready.catch(() => {});
      transition.updateCallbackDone.catch(() => {});
      transition.finished.then(done, done);
    });
  }

  // Every page change goes through here: the sidebar highlights the destination straight away, and the page swaps once it is ready.
  function goTo(key, apply, preload) {
    // Choosing the page you are already on just takes you back to its top.
    if (key === view && !selected) window.scrollTo(0, 0);
    swapPage(key, apply, preload);
  }

  function handleNavigate(key) {
    goTo(key, () => {
      setSelected(null);
      setViewParam(null);
      setPendingMp(null);
      setPendingBill(null);
      setView(key);
    });
  }

  function handleViewProfile(politician) {
    goTo("list", () => {
      setSelected(politician);
      setViewParam(null);
      setView("list");
    });
  }

  function handleNavigateForMp(key, politician) {
    goTo(key, () => {
      setSelected(null);
      setViewParam(null);
      setPendingMp(politician);
      setView(key);
    });
  }

  // Mirrors handleNavigateForMp above, for the one other cross-page link
  // that needs to land somewhere more specific than just the top of the
  // target page: a bill clicked on the homepage's own list.
  function handleNavigateForBill(key, bill) {
    goTo(key, () => {
      setSelected(null);
      setViewParam(null);
      setPendingMp(null);
      setPendingBill(bill ?? null);
      setView(key);
    });
  }

  return (
    <MotionConfig reducedMotion={display.calm ? "always" : "user"}>
    <GuideKeyContext.Provider value={guideKeyFor(view, viewParam)}>
    <div className="mp-app-shell" style={{ display: "flex", flexDirection: "column", background: COLORS.paper, fontFamily: FONT_BODY, "--hemicycle": HEMICYCLE }}>
      <button type="button" className="skip-link" onClick={() => { mainRef.current?.focus(); mainRef.current?.scrollIntoView?.(); }}>{t("Skip to main content")}</button>
      <OfflineBanner />
      <InstallBanner />
      <div className="nav-progress" data-on={navPending || fetching ? "true" : "false"} aria-hidden="true" />
      <LangBar />
      <SiteHeader activeView={navTarget} onNavigate={handleNavigate} onSelectPolitician={handleViewProfile} />
      <div style={{ flex: 1, minWidth: 0, width: "100%" }}>
        {/* The new page fades in straight away. It used to wait for the old
            one to fade out first, which added a visible pause to every click. */}
        <main
          id="main-content"
          ref={mainRef}
          tabIndex={-1}
          key={`${view}-${selected?.id ?? ""}`}
          lang={lang === "cy" && !welsh ? "en" : undefined}
        >
            {lang === "cy" && !welsh && <EnglishOnlyNotice />}
            {!selected && view !== "home" && <HubTabs view={view} onNavigate={handleNavigate} />}
            <ErrorBoundary onGoHome={() => handleNavigate("home")}>
            <Suspense fallback={<PageLoadingFallback />}>
            {view === "home" && <Home onBrowse={() => handleNavigate("list")} onNavigate={handleNavigateForBill} onViewProfile={handleViewProfile} mpCount={mpCount} />}
            {view === "appg" && <AppgMemberships />}
            {view === "howitworks" && <HowParliamentWorks />}
            {view === "voting" && <VotingRecords initialMp={pendingMp} initialBill={pendingBill?.bill_id} initialCategory={viewParam} />}
            {view === "donors" && <DonorsLobbying />}
            {view === "partyFinances" && <PartyFinances />}
            {view === "parties" && <PartyPolicies param={viewParam} />}
            {view === "history" && <PoliticalHistory />}
            {view === "timeline" && <Timeline />}
            {view === "devolved" && <DevolvedAdministrations />}
            {view === "tracker" && <GovernmentTracker />}
            {view === "budget" && <GovernmentBudget />}
            {view === "cabinet" && <Cabinet onViewProfile={handleViewProfile} />}
            {view === "lords" && <HouseOfLords peerId={viewParam} />}
            {view === "formerMps" && <FormerMps />}
            {view === "byElections" && <ByElections />}
            {view === "petitions" && <Petitions />}
            {view === "partymatch" && <PartyMatch />}
            {view === "committees" && <Committees />}
            {view === "compare" && <ComparePoliticians />}
            {view === "ministerialMeetings" && <MinisterialMeetings />}
            {view === "writtenQuestions" && <WrittenQuestions onSelectPolitician={handleViewProfile} initialQuery={pendingMp?.name} />}
            {view === "standards" && <StandardsReports onSelectPolitician={handleViewProfile} />}
            {view === "rankings" && <Rankings onSelectPolitician={handleViewProfile} onNavigate={handleNavigate} />}
            {view === "myMP" && <MyMP onViewProfile={handleViewProfile} />}
            {view === "mediaLiteracy" && <MediaLiteracy />}
            {view === "darkMoney" && <DarkMoney />}
            {view === "revolvingDoor" && <RevolvingDoor />}
            {view === "thinkTanks" && <ThinkTankFunding />}
            {EXPLAINERS[view] && <ExplainerView page={EXPLAINERS[view]} />}
            {view === "lobbyingRegister" && <LobbyingRegister />}
            {view === "followTheMoney" && <FollowTheMoney key={viewParam ?? ""} initialQuery={viewParam} onSelectPolitician={handleViewProfile} />}
            {view === "watchlist" && <WatchlistDigest onSelectPolitician={handleViewProfile} />}
            {view === "numbers" && <ParliamentNumbers house={viewParam} onNavigate={handleNavigate} />}
            {view === "topics" && <AskedAbout initialTopic={viewParam} onSelectPolitician={handleViewProfile} onNavigateForMp={handleNavigateForMp} />}
            {view === "rebels" && <Rebels onNavigate={handleNavigate} />}
            {view === "offices" && <Offices initialQuery={viewParam} />}
            {view === "councils" && <Councils param={viewParam} />}
            {view === "regions" && <RegionsPage param={viewParam} />}
            {view === "answers" && <AnswersPage param={viewParam} />}
            {view === "deprivation" && <DeprivationPage />}
            {view === "marginals" && <Marginals />}
            {view === "howtovote" && <HowToVote />}
            {view === "myBallot" && <MyBallot />}
            {view === "teacher" && <TeacherMode param={viewParam} />}
            {view === "localElections" && <LocalElections />}
            {view === "generalElection" && <GeneralElection param={viewParam} />}
            {view === "taxRates" && <TaxRates param={viewParam} />}
            {view === "inequality" && <Inequality param={viewParam} />}
            {view === "brexit" && <Brexit param={viewParam} />}
            {view === "defence" && <Defence param={viewParam} />}
            {view === "education" && <Education param={viewParam} />}
            {view === "ageing" && <Ageing param={viewParam} />}
            {view === "nhs" && <Nhs param={viewParam} />}
            {view === "energy" && <Energy param={viewParam} />}
            {view === "trust" && <Trust param={viewParam} />}
            {view === "care" && <Care param={viewParam} />}
            {view === "transport" && <Transport param={viewParam} />}
            {view === "union" && <Union param={viewParam} />}
            {view === "calculators" && <Calculators param={viewParam} onNavigate={handleNavigate} />}
            {view === "compareSeats" && <CompareSeats param={viewParam} />}
            {view === "compareCouncils" && <CompareCouncils param={viewParam} />}
            {SECTOR_VIEWS.has(view) && <SectorPage key={view} sector={view} param={viewParam} />}
            {view === "indicators" && <IndicatorTimeline param={viewParam} />}
            {view === "start" && <StartHere onNavigate={handleNavigate} onNavigateForMp={handleNavigateForMp} onViewProfile={handleViewProfile} />}
            {view === "constituency" && <Constituency seat={viewParam} onSelectPolitician={handleViewProfile} />}
            {view === "methodology" && <Methodology onNavigate={handleNavigate} />}
            {view === "glossary" && <Glossary />}
            {view === "settings" && <Settings onNavigate={handleNavigate} />}
            {view === "privacy" && <PrivacyPolicy onNavigate={handleNavigate} />}
            {view === "terms" && <TermsConditions />}
            {view === "accessibility" && <Accessibility />}
            {view === "whatsnew" && <WhatsNew onNavigate={handleNavigate} />}
            {view === "funding" && <Funding onNavigate={handleNavigate} />}
            {view === "myArea" && <MyArea />}
            {view === "thisWeek" && <ThisWeek />}
            {view === "councillors" && <Councillors param={viewParam} />}
            {view === "lordsVotes" && <LordsVotes />}
            {view === "list" &&
              (selected ? (
                <PoliticianDetail
                  key={selected.id}
                  politician={selected}
                  onBack={() => swapPage("list", () => setSelected(null))}
                  onNavigate={handleNavigateForMp}
                />
              ) : (
                <PoliticianList initialCareer={viewParam} onSelect={(p) => swapPage("list", () => setSelected(p), LOAD_DETAIL)} />
              ))}
            </Suspense>
            </ErrorBoundary>
            {!selected && view !== "home" && view !== "teacher" && (
              <Suspense fallback={null}><SectionNav view={view} onNavigate={handleNavigate} /></Suspense>
            )}
            {view !== "teacher" && <Suspense fallback={null}><PageFoot key={`${view}-${selected?.id ?? ""}`} view={view} name={selected?.name} /></Suspense>}
        </main>
      </div>
      <SiteFooter onNavigate={handleNavigate} />
      {listening && <Suspense fallback={null}><ReadAloud key={`${view}-${selected?.id ?? ""}`} onClose={() => setListening(false)} /></Suspense>}
      <BackToTop />
      <Suspense fallback={null}><PageTools key={`${view}-${selected?.id ?? ""}`} view={view} selected={Boolean(selected)} /></Suspense>
    </div>
    </GuideKeyContext.Provider>
    </MotionConfig>
  );
}

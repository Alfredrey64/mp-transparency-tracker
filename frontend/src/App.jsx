import { useState, useEffect, useRef, lazy, Suspense } from "react";
import { GuideKeyContext, guideKeyFor } from "./lib/viewContext";
import { motion, MotionConfig } from "framer-motion";
import { supabase } from "./supabaseClient";
import { COLORS, FONT_BODY, FONT_DISPLAY } from "./theme";
import Sidebar from "./components/Sidebar";
import Home from "./components/Home";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { SECTIONS } from "./data/sidebarSections";
import { LOADERS } from "./pageLoaders";
import { startGlossDedupe } from "./glossJsx/dedupe";

// Everything below is code-split per page: a visitor to the homepage
// shouldn't have to download the other ~30 pages' code up front. Home and
// Sidebar stay eager imports above so the very first paint has no loading
// flash.
const PoliticianList = lazy(LOADERS.list);
const PoliticianDetail = lazy(() => import("./components/PoliticianDetail"));
const VotingRecords = lazy(LOADERS.voting);
const HowParliamentWorks = lazy(LOADERS.howitworks);
const AppgMemberships = lazy(LOADERS.appg);
const DonorsLobbying = lazy(LOADERS.donors);
const PartyFinances = lazy(LOADERS.partyFinances);
const PartyPolicies = lazy(LOADERS.parties);
const GovernmentTracker = lazy(LOADERS.tracker);
const Methodology = lazy(LOADERS.methodology);
const Glossary = lazy(LOADERS.glossary);
const PoliticalHistory = lazy(LOADERS.history);
const Timeline = lazy(LOADERS.timeline);
const DevolvedAdministrations = lazy(LOADERS.devolved);
const FormerMps = lazy(LOADERS.formerMps);
const ByElections = lazy(LOADERS.byElections);
const GovernmentBudget = lazy(LOADERS.budget);
const Cabinet = lazy(LOADERS.cabinet);
const HouseOfLords = lazy(LOADERS.lords);
const Petitions = lazy(LOADERS.petitions);
const PartyMatch = lazy(LOADERS.partymatch);
const Settings = lazy(LOADERS.settings);
const PrivacyPolicy = lazy(LOADERS.privacy);
const TermsConditions = lazy(LOADERS.terms);
const Committees = lazy(LOADERS.committees);
const ComparePoliticians = lazy(LOADERS.compare);
const MinisterialMeetings = lazy(LOADERS.ministerialMeetings);
const WrittenQuestions = lazy(LOADERS.writtenQuestions);
const StandardsReports = lazy(LOADERS.standards);
const MyMP = lazy(LOADERS.myMP);
const MediaLiteracy = lazy(LOADERS.mediaLiteracy);
const Rankings = lazy(LOADERS.rankings);
const DarkMoney = lazy(LOADERS.darkMoney);
const RevolvingDoor = lazy(LOADERS.revolvingDoor);
const ThinkTankFunding = lazy(LOADERS.thinkTanks);
const LobbyingRegister = lazy(LOADERS.lobbyingRegister);
const FollowTheMoney = lazy(LOADERS.followTheMoney);
const WatchlistDigest = lazy(LOADERS.watchlist);
const ParliamentNumbers = lazy(LOADERS.numbers);
const AskedAbout = lazy(LOADERS.topics);
const Constituency = lazy(LOADERS.constituency);
const StartHere = lazy(LOADERS.start);
const Rebels = lazy(LOADERS.rebels);
const Offices = lazy(LOADERS.offices);
const Councils = lazy(LOADERS.councils);
const SectorPage = lazy(LOADERS.economy);
const IndicatorTimeline = lazy(LOADERS.indicators);
const SECTOR_VIEWS = new Set(["economy", "prices", "jobs", "publicFinances", "population", "health", "housing", "crime", "trade", "environment"]);

// A quiet authorship mark, not a feature — printed once so a copy of this
// site with the byline stripped from the UI still carries proof of where
// it came from.
console.log(
  "%cUK Parliament Tracker%c\nDesigned and built by Alfred Reynolds.",
  "font-weight: bold; font-size: 13px; color: #4F46E5;",
  "color: inherit;"
);

function PageLoadingFallback() {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "60vh", fontFamily: FONT_DISPLAY, fontSize: 15, color: COLORS.inkSoft }}>
      Loading…
    </div>
  );
}

// Every key the big view === "x" switch below actually handles. The URL
// hash is user-editable (typed, pasted, bookmarked from an old link) so an
// unrecognised segment falls back to Home rather than rendering nothing.
const VALID_VIEWS = new Set([
  "home", "appg", "howitworks", "voting", "donors", "partyFinances", "parties", "history", "timeline",
  "devolved", "tracker", "budget", "cabinet", "lords", "formerMps", "byElections", "petitions", "partymatch",
  "committees", "compare", "ministerialMeetings", "writtenQuestions", "standards", "rankings", "myMP",
  "mediaLiteracy", "methodology", "glossary", "settings", "privacy", "terms", "list",
  "darkMoney", "revolvingDoor", "thinkTanks", "lobbyingRegister", "followTheMoney", "watchlist", "numbers", "topics", "constituency", "start", "rebels", "offices", "councils",
  "economy", "prices", "jobs", "publicFinances", "population", "health", "housing", "crime", "trade", "environment", "indicators",
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
  home: "Follow the money behind every MP",
  myMP: "My MP",
  watchlist: "My Watchlist",
  methodology: "Data & Methodology",
  settings: "Settings",
  privacy: "Privacy Policy",
  terms: "Terms & Conditions",
});

function titleForState(view, selected, param) {
  const base = "UK Parliament Tracker";
  if (selected) return `${selected.name} — ${base}`;
  if (view === "numbers" && param === "lords") return `Parliament in Numbers: the Lords — ${base}`;
  // For the Lords the parameter is a peer's id, which makes a poor title.
  if (param && view !== "lords" && view !== "numbers" && view !== "councils" && view !== "indicators" && !SECTOR_VIEWS.has(view)) return `${param} — ${PAGE_TITLES[view] ?? base} — ${base}`;
  if (view === "home") return base;
  const label = PAGE_TITLES[view];
  return label ? `${label} — ${base}` : base;
}

// A minimal hash router — no react-router dependency needed for a flat set
// of ~30 pages plus one detail view. "#/mp/123" links straight to an MP;
// any other "#/key" maps to a view; anything unrecognised (or no hash at
// all) is Home. Hash-based so it needs zero server-side rewrite rules on
// Vercel — a path-based scheme would 404 on refresh without one.
function parseHash() {
  const raw = window.location.hash.replace(/^#\/?/, "");
  const segments = raw.split("/").filter(Boolean);
  // The seat map used to be its own page; its links now open the merged
  // Your Constituency page.
  if (segments[0] === "seatmap") segments[0] = "constituency";
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

function hashForState(view, selected, param) {
  if (selected) return `#/mp/${selected.id}`;
  if (param) return `#/${view}/${encodeURIComponent(param)}`;
  return view === "home" ? "#/" : `#/${view}`;
}

export default function App() {
  const [view, setView] = useState(() => parseHash().view);
  // The page-specific part of the URL after the view name, if any.
  const [viewParam, setViewParam] = useState(() => parseHash().param);
  const [selected, setSelected] = useState(null);
  const [mpCount, setMpCount] = useState(null);

  useEffect(() => startGlossDedupe(document.getElementById("root")), []);
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
    const nextHash = hashForState(view, selected, viewParam);
    if (window.location.hash !== nextHash) {
      window.history.pushState(null, "", nextHash);
    }
  }, [view, selected, viewParam]);

  // The tab title, and the name a bookmark or browser-history entry
  // actually gets, used to be the same generic "UK Parliament Tracker" on
  // every single page — no help at all with five tabs open, or finding an
  // MP's page again in history. This is the one piece of per-page SEO a
  // client-only SPA can do for real: a crawler that never executes JS
  // still only ever sees index.html's static title, but the document
  // title itself, and what search engines that DO render JS index, follow
  // the actual page.
  useEffect(() => {
    document.title = titleForState(view, selected, viewParam);
  }, [view, selected, viewParam]);

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
        setSelected(null);
        setViewParam(null);
        setView("list");
        supabase.from("politicians").select("*").eq("id", parsed.mpId).single().then(({ data }) => {
          if (data) setSelected(data);
        });
      } else {
        setSelected(null);
        setViewParam(parsed.param);
        setView(parsed.view);
      }
    }
    window.addEventListener("popstate", syncFromUrl);
    window.addEventListener("hashchange", syncFromUrl);
    return () => {
      window.removeEventListener("popstate", syncFromUrl);
      window.removeEventListener("hashchange", syncFromUrl);
    };
  }, []);

  function handleNavigate(key) {
    setSelected(null);
    setViewParam(null);
    setPendingMp(null);
    setPendingBill(null);
    setView(key);
    window.scrollTo(0, 0);
  }

  function handleViewProfile(politician) {
    setSelected(politician);
    setViewParam(null);
    setView("list");
    window.scrollTo(0, 0);
  }

  function handleNavigateForMp(key, politician) {
    setSelected(null);
    setViewParam(null);
    setPendingMp(politician);
    setView(key);
    window.scrollTo(0, 0);
  }

  // Mirrors handleNavigateForMp above, for the one other cross-page link
  // that needs to land somewhere more specific than just the top of the
  // target page: a bill clicked on the homepage's own list.
  function handleNavigateForBill(key, bill) {
    setSelected(null);
    setViewParam(null);
    setPendingMp(null);
    setPendingBill(bill ?? null);
    setView(key);
    window.scrollTo(0, 0);
  }

  return (
    <MotionConfig reducedMotion="user">
    <GuideKeyContext.Provider value={guideKeyFor(view, viewParam)}>
    <div className="mp-app-shell" style={{ display: "flex", background: COLORS.paper, fontFamily: FONT_BODY }}>
      <button type="button" className="skip-link" onClick={() => { mainRef.current?.focus(); mainRef.current?.scrollIntoView?.(); }}>Skip to main content</button>
      <Sidebar activeView={view} onNavigate={handleNavigate} onSelectPolitician={handleViewProfile} />
      <div style={{ flex: 1, minWidth: 0 }}>
        {/* The new page fades in straight away. It used to wait for the old
            one to fade out first, which added a visible pause to every click. */}
        <motion.main
          id="main-content"
          ref={mainRef}
          tabIndex={-1}
          key={`${view}-${selected?.id ?? ""}`}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.18, ease: "easeOut" }}
        >
            <ErrorBoundary onGoHome={() => handleNavigate("home")}>
            <Suspense fallback={<PageLoadingFallback />}>
            {view === "home" && <Home onBrowse={() => handleNavigate("list")} onNavigate={handleNavigateForBill} onViewProfile={handleViewProfile} mpCount={mpCount} />}
            {view === "appg" && <AppgMemberships />}
            {view === "howitworks" && <HowParliamentWorks />}
            {view === "voting" && <VotingRecords initialMp={pendingMp} initialBill={pendingBill?.bill_id} initialCategory={viewParam} />}
            {view === "donors" && <DonorsLobbying />}
            {view === "partyFinances" && <PartyFinances />}
            {view === "parties" && <PartyPolicies />}
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
            {view === "lobbyingRegister" && <LobbyingRegister />}
            {view === "followTheMoney" && <FollowTheMoney onSelectPolitician={handleViewProfile} />}
            {view === "watchlist" && <WatchlistDigest onSelectPolitician={handleViewProfile} />}
            {view === "numbers" && <ParliamentNumbers house={viewParam} onNavigate={handleNavigate} />}
            {view === "topics" && <AskedAbout initialTopic={viewParam} onSelectPolitician={handleViewProfile} onNavigateForMp={handleNavigateForMp} />}
            {view === "rebels" && <Rebels onNavigate={handleNavigate} />}
            {view === "offices" && <Offices initialQuery={viewParam} />}
            {view === "councils" && <Councils param={viewParam} />}
            {SECTOR_VIEWS.has(view) && <SectorPage key={view} sector={view} param={viewParam} />}
            {view === "indicators" && <IndicatorTimeline param={viewParam} />}
            {view === "start" && <StartHere onNavigate={handleNavigate} onNavigateForMp={handleNavigateForMp} onViewProfile={handleViewProfile} />}
            {view === "constituency" && <Constituency seat={viewParam} onSelectPolitician={handleViewProfile} />}
            {view === "methodology" && <Methodology onNavigate={handleNavigate} />}
            {view === "glossary" && <Glossary />}
            {view === "settings" && <Settings onNavigate={handleNavigate} />}
            {view === "privacy" && <PrivacyPolicy onNavigate={handleNavigate} />}
            {view === "terms" && <TermsConditions />}
            {view === "list" &&
              (selected ? (
                <PoliticianDetail
                  key={selected.id}
                  politician={selected}
                  onBack={() => { setSelected(null); window.scrollTo(0, 0); }}
                  onNavigate={handleNavigateForMp}
                />
              ) : (
                <PoliticianList initialCareer={viewParam} onSelect={(p) => { setSelected(p); window.scrollTo(0, 0); }} />
              ))}
            </Suspense>
            </ErrorBoundary>
        </motion.main>
      </div>
    </div>
    </GuideKeyContext.Provider>
    </MotionConfig>
  );
}

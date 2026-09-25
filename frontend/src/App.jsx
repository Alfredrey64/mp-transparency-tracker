import { useState, useEffect, useRef, lazy, Suspense } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "./supabaseClient";
import { COLORS, FONT_BODY, FONT_DISPLAY } from "./theme";
import Sidebar from "./components/Sidebar";
import Home from "./components/Home";

// Everything below is code-split per page: a visitor to the homepage
// shouldn't have to download the other ~30 pages' code up front. Home and
// Sidebar stay eager imports above so the very first paint has no loading
// flash.
const PoliticianList = lazy(() => import("./components/PoliticianList"));
const PoliticianDetail = lazy(() => import("./components/PoliticianDetail"));
const VotingRecords = lazy(() => import("./components/VotingRecords"));
const HowParliamentWorks = lazy(() => import("./components/HowParliamentWorks"));
const AppgMemberships = lazy(() => import("./components/AppgMemberships"));
const DonorsLobbying = lazy(() => import("./components/DonorsLobbying"));
const PartyFinances = lazy(() => import("./components/PartyFinances"));
const PartyPolicies = lazy(() => import("./components/PartyPolicies"));
const GovernmentTracker = lazy(() => import("./components/GovernmentTracker"));
const Methodology = lazy(() => import("./components/Methodology"));
const Glossary = lazy(() => import("./components/Glossary"));
const PoliticalHistory = lazy(() => import("./components/PoliticalHistory"));
const Timeline = lazy(() => import("./components/Timeline"));
const DevolvedAdministrations = lazy(() => import("./components/DevolvedAdministrations"));
const FormerMps = lazy(() => import("./components/FormerMps"));
const ByElections = lazy(() => import("./components/ByElections"));
const GovernmentBudget = lazy(() => import("./components/GovernmentBudget"));
const Cabinet = lazy(() => import("./components/Cabinet"));
const HouseOfLords = lazy(() => import("./components/HouseOfLords"));
const Petitions = lazy(() => import("./components/Petitions"));
const PartyMatch = lazy(() => import("./components/PartyMatch"));
const Settings = lazy(() => import("./components/Settings"));
const PrivacyPolicy = lazy(() => import("./components/PrivacyPolicy"));
const TermsConditions = lazy(() => import("./components/TermsConditions"));
const Committees = lazy(() => import("./components/Committees"));
const ComparePoliticians = lazy(() => import("./components/ComparePoliticians"));
const MinisterialMeetings = lazy(() => import("./components/MinisterialMeetings"));
const WrittenQuestions = lazy(() => import("./components/WrittenQuestions"));
const StandardsReports = lazy(() => import("./components/StandardsReports"));
const MyMP = lazy(() => import("./components/MyMP"));
const MediaLiteracy = lazy(() => import("./components/MediaLiteracy"));
const Rankings = lazy(() => import("./components/Rankings"));

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
]);

// A minimal hash router — no react-router dependency needed for a flat set
// of ~30 pages plus one detail view. "#/mp/123" links straight to an MP;
// any other "#/key" maps to a view; anything unrecognised (or no hash at
// all) is Home. Hash-based so it needs zero server-side rewrite rules on
// Vercel — a path-based scheme would 404 on refresh without one.
function parseHash() {
  const raw = window.location.hash.replace(/^#\/?/, "");
  const segments = raw.split("/").filter(Boolean);
  if (segments[0] === "mp" && /^\d+$/.test(segments[1] ?? "")) {
    return { view: "list", mpId: Number(segments[1]) };
  }
  if (VALID_VIEWS.has(segments[0])) {
    return { view: segments[0], mpId: null };
  }
  return { view: "home", mpId: null };
}

function hashForState(view, selected) {
  if (selected) return `#/mp/${selected.id}`;
  return view === "home" ? "#/" : `#/${view}`;
}

export default function App() {
  const [view, setView] = useState(() => parseHash().view);
  const [selected, setSelected] = useState(null);
  const [mpCount, setMpCount] = useState(null);
  const isPopping = useRef(false);
  // True for the one render where a direct "#/mp/123" link hasn't finished
  // fetching that MP yet — the URL-sync effect below must not overwrite the
  // hash back to "#/list" during that brief window, or a shared/bookmarked
  // link to an MP would silently rewrite itself before it even loads.
  const initialMpPending = useRef(false);

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
    const nextHash = hashForState(view, selected);
    if (window.location.hash !== nextHash) {
      window.history.pushState(null, "", nextHash);
    }
  }, [view, selected]);

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
        setView("list");
        supabase.from("politicians").select("*").eq("id", parsed.mpId).single().then(({ data }) => {
          if (data) setSelected(data);
        });
      } else {
        setSelected(null);
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
    setView(key);
    window.scrollTo(0, 0);
  }

  function handleViewProfile(politician) {
    setSelected(politician);
    setView("list");
    window.scrollTo(0, 0);
  }

  return (
    <div className="mp-app-shell" style={{ display: "flex", minHeight: "100vh", background: COLORS.paper, fontFamily: FONT_BODY }}>
      <Sidebar activeView={view} onNavigate={handleNavigate} onSelectPolitician={handleViewProfile} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <AnimatePresence mode="wait">
          <motion.div
            key={`${view}-${selected?.id ?? ""}`}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.22, ease: "easeInOut" }}
          >
            <Suspense fallback={<PageLoadingFallback />}>
            {view === "home" && <Home onBrowse={() => handleNavigate("list")} onNavigate={handleNavigate} onViewProfile={handleViewProfile} mpCount={mpCount} />}
            {view === "appg" && <AppgMemberships />}
            {view === "howitworks" && <HowParliamentWorks />}
            {view === "voting" && <VotingRecords />}
            {view === "donors" && <DonorsLobbying />}
            {view === "partyFinances" && <PartyFinances />}
            {view === "parties" && <PartyPolicies />}
            {view === "history" && <PoliticalHistory />}
            {view === "timeline" && <Timeline />}
            {view === "devolved" && <DevolvedAdministrations />}
            {view === "tracker" && <GovernmentTracker />}
            {view === "budget" && <GovernmentBudget />}
            {view === "cabinet" && <Cabinet onViewProfile={handleViewProfile} />}
            {view === "lords" && <HouseOfLords />}
            {view === "formerMps" && <FormerMps />}
            {view === "byElections" && <ByElections />}
            {view === "petitions" && <Petitions />}
            {view === "partymatch" && <PartyMatch />}
            {view === "committees" && <Committees />}
            {view === "compare" && <ComparePoliticians />}
            {view === "ministerialMeetings" && <MinisterialMeetings />}
            {view === "writtenQuestions" && <WrittenQuestions onSelectPolitician={handleViewProfile} />}
            {view === "standards" && <StandardsReports onSelectPolitician={handleViewProfile} />}
            {view === "rankings" && <Rankings onSelectPolitician={handleViewProfile} />}
            {view === "myMP" && <MyMP onViewProfile={handleViewProfile} />}
            {view === "mediaLiteracy" && <MediaLiteracy />}
            {view === "methodology" && <Methodology onNavigate={handleNavigate} />}
            {view === "glossary" && <Glossary />}
            {view === "settings" && <Settings onNavigate={handleNavigate} />}
            {view === "privacy" && <PrivacyPolicy onNavigate={handleNavigate} />}
            {view === "terms" && <TermsConditions />}
            {view === "list" &&
              (selected ? (
                <PoliticianDetail key={selected.id} politician={selected} onBack={() => { setSelected(null); window.scrollTo(0, 0); }} />
              ) : (
                <PoliticianList onSelect={(p) => { setSelected(p); window.scrollTo(0, 0); }} />
              ))}
            </Suspense>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "./supabaseClient";
import { COLORS, FONT_BODY } from "./theme";
import Sidebar from "./components/Sidebar";
import Home from "./components/Home";
import PoliticianList from "./components/PoliticianList";
import PoliticianDetail from "./components/PoliticianDetail";
import VotingRecords from "./components/VotingRecords";
import HowParliamentWorks from "./components/HowParliamentWorks";
import AppgMemberships from "./components/AppgMemberships";
import DonorsLobbying from "./components/DonorsLobbying";
import PartyFinances from "./components/PartyFinances";
import PartyPolicies from "./components/PartyPolicies";
import GovernmentTracker from "./components/GovernmentTracker";
import Methodology from "./components/Methodology";
import Glossary from "./components/Glossary";
import PoliticalHistory from "./components/PoliticalHistory";
import Timeline from "./components/Timeline";
import DevolvedAdministrations from "./components/DevolvedAdministrations";
import FormerMps from "./components/FormerMps";
import ByElections from "./components/ByElections";
import GovernmentBudget from "./components/GovernmentBudget";
import Cabinet from "./components/Cabinet";
import Settings from "./components/Settings";
import PrivacyPolicy from "./components/PrivacyPolicy";
import TermsConditions from "./components/TermsConditions";

export default function App() {
  const [view, setView] = useState("home");
  const [selected, setSelected] = useState(null);
  const [mpCount, setMpCount] = useState(null);

  useEffect(() => {
    async function loadCount() {
      const { count } = await supabase.from("politicians").select("*", { count: "exact", head: true });
      setMpCount(count);
    }
    loadCount();
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
            {view === "formerMps" && <FormerMps />}
            {view === "byElections" && <ByElections />}
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
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}

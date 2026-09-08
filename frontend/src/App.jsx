import { useState, useEffect } from "react";
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
import PartyPolicies from "./components/PartyPolicies";
import GovernmentTracker from "./components/GovernmentTracker";
import CompaniesHouse from "./components/CompaniesHouse";
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
  }

  return (
    <div className="mp-app-shell" style={{ display: "flex", minHeight: "100vh", background: COLORS.paper, fontFamily: FONT_BODY }}>
      <Sidebar activeView={view} onNavigate={handleNavigate} />
      <div style={{ flex: 1, minWidth: 0 }}>
        {view === "home" && <Home onBrowse={() => handleNavigate("list")} onNavigate={handleNavigate} mpCount={mpCount} />}
        {view === "appg" && <AppgMemberships />}
        {view === "howitworks" && <HowParliamentWorks />}
        {view === "voting" && <VotingRecords />}
        {view === "donors" && <DonorsLobbying />}
        {view === "parties" && <PartyPolicies />}
        {view === "tracker" && <GovernmentTracker />}
        {view === "companies" && <CompaniesHouse />}
        {view === "settings" && <Settings onNavigate={handleNavigate} />}
        {view === "privacy" && <PrivacyPolicy onNavigate={handleNavigate} />}
        {view === "terms" && <TermsConditions />}
        {view === "list" &&
          (selected ? (
            <PoliticianDetail politician={selected} onBack={() => setSelected(null)} />
          ) : (
            <PoliticianList onSelect={setSelected} />
          ))}
      </div>
    </div>
  );
}

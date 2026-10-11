import { useState, useEffect } from "react";
import { COLORS, FONT_BODY, PAGE_PADDING } from "../theme";
import { loadCouncilDetail } from "../lib/councilDetail";
import { LoadFailedNote } from "./MpCards";
import PageGuide from "./PageGuide";
import { Hero, Overview } from "./CouncilsOverview";
import { CouncilView } from "./CouncilDetail";
import Loading from "./Loading";

// Your Council: the whole country's councils at a glance, then any one
// council in detail. Data is Open Council Data UK's (CC BY-SA 4.0). A postcode
// finds your council and ward; the address (#/councils/<id>/<ward>) can be
// shared. Parish and town councils aren't covered.

export default function Councils({ param }) {
  const [data, setData] = useState(null);
  const [loadedDetail, setLoadedDetail] = useState({ id: null, detail: null });
  const [failed, setFailed] = useState(false);
  const [detailFailed, setDetailFailed] = useState(false);

  // The address is #/councils/<id>/<ward>/<county id>; the last two are optional.
  const [id, wardName, countyId] = String(param ?? "").split("/");
  const council = data && id ? data.index.find((c) => c.id === id) ?? null : null;

  useEffect(() => {
    import("../data/councilsIndex.json").then((m) => setData(m.default)).catch(() => setFailed(true));
  }, []);

  // Wards and councillors are loaded for the one council that is open.
  useEffect(() => {
    if (!id) return undefined;
    let cancelled = false;
    loadCouncilDetail(id)
      .then((detail) => {
        if (!cancelled) {
          setLoadedDetail({ id, detail });
          setDetailFailed(false);
        }
      })
      .catch(() => {
        if (!cancelled) setDetailFailed(true);
      });
    return () => {
      cancelled = true;
    };
  }, [id]);

  return (
    <div style={{ maxWidth: 1120, margin: "0 auto", padding: PAGE_PADDING }}>
      {data ? (
        <Hero
          index={data.index}
          kicker="Your area & your say"
          title="Your council and your councillors"
          subtitle="Councils run bin collections, planning, housing, roads and care. See who runs yours, who your councillors are, who is changing sides, and when you next get a vote."
        />
      ) : (
        <div style={{ height: 60 }} />
      )}
      <PageGuide viewKey="councils" style={{ marginTop: 18 }} />
      {failed && <div style={{ marginTop: 24 }}><LoadFailedNote item="the council data" /></div>}
      {!failed && !data && <Loading />}
      {data && (
        <>
          {id && !council && <div style={{ fontFamily: FONT_BODY, fontSize: 13.5, color: "#C0504D", marginTop: 18 }}>We couldn't find that council. Try searching for it by name.</div>}
          {council ? (
            <CouncilView
              key={council.id}
              council={council}
              data={data}
              wardName={wardName || null}
              countyId={countyId || null}
              detail={loadedDetail.id === council.id ? loadedDetail.detail : null}
              failed={detailFailed}
            />
          ) : (
            <Overview data={data} />
          )}
          <p style={{ fontFamily: FONT_BODY, fontSize: 11.5, color: COLORS.inkSoft, lineHeight: 1.6, marginTop: 28, maxWidth: 800 }}>
            Councillors, parties and election dates come from{" "}
            <a href="https://opencouncildata.co.uk" target="_blank" rel="noreferrer" style={{ color: COLORS.accent, fontWeight: 600 }}>Open Council Data UK</a>{" "}
            (CC BY-SA 4.0), updated after each round of elections. Council control and changes of hands are worked out from each council's seats. Parish and town councils, and ward-by-ward election results, aren't included. By-elections can change a council between updates.
          </p>
        </>
      )}
    </div>
  );
}

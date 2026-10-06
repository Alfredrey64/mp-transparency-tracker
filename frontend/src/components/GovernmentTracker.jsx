import { PAGE_PADDING } from "../theme";
import { PageHeader } from "./shared";
import { GlossaryTerm } from "./GlossaryTerm";
import { IconTracker } from "./icons";
import PromiseTracker from "./PromiseTracker";

export default function GovernmentTracker() {
  return (
    <div style={{ maxWidth: 1080, margin: "0 auto", padding: PAGE_PADDING }}>
      <PageHeader
        icon={IconTracker}
        kicker="Promises Tracker"
        title="Has the government kept its word?"
        subtitle={
          <>
            An independent look at how far Labour has delivered on its 2024{" "}
            <GlossaryTerm term="Manifesto">manifesto</GlossaryTerm> since forming government.
          </>
        }
      />
      <div style={{ marginTop: 28 }}>
        <PromiseTracker />
      </div>
    </div>
  );
}

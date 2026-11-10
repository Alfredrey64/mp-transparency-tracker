/** @jsxImportSource react */
import { useState } from "react";
import { FEED_LIST, countFor, feedUrls } from "../../lib/calendarFeeds";
import "../../calfeeds.css";

// "Put this in your calendar": three files of what the calendar lists, to subscribe to in the calendar app people already use. The app then fetches the file again by itself,
// so each day's refresh reaches it without anyone coming back here. The files are written by calendarFeed.js whenever the calendar data is refreshed.
function CopyLink({ url, name }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2200);
    } catch {
      window.prompt("Copy this address into your calendar app:", url);
    }
  };
  return (
    <button type="button" className="btn btn-secondary cf-btn" onClick={copy}>
      {copied ? "Copied" : "Copy link"}<span className="sr-only"> for {name}</span>
      <span role="status" className="sr-only">{copied ? "Link copied" : ""}</span>
    </button>
  );
}

export default function CalendarFeeds({ data }) {
  return (
    <div className="cf">
      <ul className="cf-list">
        {FEED_LIST.map((f) => {
          const u = feedUrls(f.file);
          return (
            <li key={f.key} className="cf-item">
              <div className="cf-text">
                <h3>{f.name}</h3>
                <p>{f.about}</p>
                <small>{countFor(f, data).toLocaleString("en-GB")} items in the next four weeks</small>
              </div>
              <div className="cf-actions">
                <a className="btn btn-primary cf-btn" href={u.webcal}>Subscribe<span className="sr-only"> to {f.name} in your calendar app</span></a>
                <a className="btn btn-secondary cf-btn" href={u.google} target="_blank" rel="noreferrer">Google Calendar<span className="sr-only"> for {f.name} (opens in a new tab)</span></a>
                <CopyLink url={u.https} name={f.name} />
                <a className="cf-dl" href={u.local} download>Download .ics<span className="sr-only"> for {f.name}</span></a>
              </div>
            </li>
          );
        })}
      </ul>
      <p className="cf-note">Subscribing keeps your calendar up to date by itself: the files are rewritten every day from Parliament's calendar, and cover the next four weeks. Times are UK time. Parliament lists when an item starts but not when it ends, so a timed item shows as one hour, and items with no time are all-day. Dates further ahead can still change.</p>
    </div>
  );
}

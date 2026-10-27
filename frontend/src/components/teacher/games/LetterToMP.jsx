/** @jsxImportSource react */
import { useEffect, useMemo, useRef, useState } from "react";
import { ISSUES, TARGETS, PM_NOTE, letterParts, LETTER_SHUFFLE, NEXT_STEPS } from "../../../lib/teacherGamesMore";
import { Coach, Confetti, Dots } from "./kit";

// Letter to your MP: pick a problem, work out who can fix it, build the letter in the right order, and watch it travel. Then the steps that happen after the
// letter arrives. Anyone can write to their councillor or MP, at any age.
export default function LetterToMP() {
  const [issueKey, setIssueKey] = useState(null);
  const [stage, setStage] = useState("issue");
  const [target, setTarget] = useState(null);
  const [note, setNote] = useState(null);
  const [placed, setPlaced] = useState([]);
  const [wrong, setWrong] = useState(null);
  const [sent, setSent] = useState([]);
  const [burst, setBurst] = useState(0);
  const timer = useRef(null);
  const issue = ISSUES.find((i) => i.key === issueKey);
  const to = TARGETS.find((t) => t.key === (issue?.target));
  const parts = useMemo(() => (issue ? letterParts(issue, to) : []), [issue, to]);

  useEffect(() => () => clearTimeout(timer.current), []);

  const pickIssue = (k) => { setIssueKey(k); setStage("who"); setTarget(null); setNote(null); setPlaced([]); setWrong(null); };
  const pickTarget = (k) => {
    if (k === issue.target) { setTarget(k); setNote({ mood: "happy", text: `Yes. ${issue.right}` }); setTimeout(() => setStage("write"), 900); return; }
    setNote({ mood: "oops", text: k === "pm" ? PM_NOTE : issue.close });
  };
  const place = (i) => {
    if (i === placed.length) { setPlaced((p) => [...p, i]); setWrong(null); } else { setWrong(i); setTimeout(() => setWrong(null), 1300); }
  };
  const send = () => {
    setStage("sending");
    timer.current = setTimeout(() => { setStage("sent"); setSent((s) => (s.includes(issueKey) ? s : [...s, issueKey])); setBurst((b) => b + 1); }, 2600);
  };
  const another = () => { setStage("issue"); setIssueKey(null); };
  const left = LETTER_SHUFFLE.filter((i) => !placed.includes(i));
  const place_ = to?.key === "mp" ? "parliament" : "hall";

  return (
    <div className="gm gm-letter">
      <Confetti burst={burst} />
      <div className="gm-score"><span>Letters sent</span><b>{sent.length} of {ISSUES.length}</b></div>
      <Dots at={sent.length} total={ISSUES.length} label="Letters sent" />
      {stage === "issue" && (
        <>
          <p className="gm-help">Pick a problem to write about. A good letter goes to the person who can <b>do</b> something about it.</p>
          <ul className="gm-issues">
            {ISSUES.map((i) => (
              <li key={i.key}><button type="button" className="gm-issue" data-done={sent.includes(i.key) ? "1" : "0"} onClick={() => pickIssue(i.key)}><b>{i.title}</b><small>{sent.includes(i.key) ? "Letter sent. Write it again if you like." : i.problem}</small></button></li>
            ))}
          </ul>
        </>
      )}
      {stage === "who" && (
        <>
          <div className="gm-prompt"><small>The problem</small><b>{issue.title}</b><span>{issue.problem}</span></div>
          <p className="gm-help">Who should you write to?</p>
          <div className="gm-choices" role="group" aria-label="Who should you write to?">
            {TARGETS.map((t) => (
              <button key={t.key} type="button" className="gm-choice" style={{ "--gc": t.key === "mp" ? "#1E4FB8" : t.key === "pm" ? "#6B7487" : "#C7871A" }} data-state={target === t.key ? "right" : "idle"} disabled={Boolean(target)} onClick={() => pickTarget(t.key)}>
                <b>{t.name}</b><small>{t.blurb}</small>
              </button>
            ))}
          </div>
          <Coach mood={note?.mood ?? "think"} right={note?.mood === "happy"}>{note?.text ?? "Think about who looks after this."}</Coach>
        </>
      )}
      {stage === "write" && (
        <>
          <p className="gm-help">Build your letter to <b>{to.key === "mp" ? "your MP" : "your local councillor"}</b>. Tap the part that comes next: say hello, say who you are, explain the problem, say what you want, and say thank you.</p>
          <div className="gm-write">
            <div className="gm-paper" aria-label="Your letter">
              {parts.map((t, i) => (i < placed.length ? <p key={i} className="gm-line">{t}</p> : <p key={i} className="gm-line gm-line-ghost" aria-hidden="true"><span /><span /></p>))}
            </div>
            <ul className="gm-cards gm-cards-1">
              {left.map((i) => (
                <li key={i}><button type="button" className="gm-card" data-wrong={wrong === i ? "1" : "0"} onClick={() => place(i)}>{parts[i]}{wrong === i && <em>Not yet. What would you read first in a letter?</em>}</button></li>
              ))}
            </ul>
          </div>
          {placed.length === parts.length && <div className="cr-row"><button type="button" className="btn btn-primary btn-lg" onClick={send}>Seal it and send it</button></div>}
        </>
      )}
      {(stage === "sending" || stage === "sent") && (
        <>
          <svg className="gm-pyramid gm-post" viewBox="0 0 800 220" role="img" aria-label="A letter travelling from a house to its reader">
            <rect width="800" height="220" rx="22" fill="#E9F3FF" />
            <path d="M0 180 Q200 130 400 170 T800 160 V220 H0z" fill="#CBEBC0" />
            <g transform="translate(70 116)"><rect x="-30" y="0" width="60" height="50" fill="#E9B88A" /><path d="M-38 2 L0 -28 L38 2z" fill="#B5533C" /><rect x="-8" y="20" width="16" height="30" fill="#8E5E0E" /></g>
            {place_ === "parliament"
              ? <g transform="translate(700 60)"><rect x="-44" y="52" width="90" height="48" fill="#C7A25A" /><rect x="-12" y="-6" width="24" height="60" fill="#D9B86E" /><path d="M-14 -6 L0 -34 L14 -6z" fill="#6B7487" /><circle cx="0" cy="14" r="8" fill="#fff" /><path d="M0 14v-5M0 14l3 2" stroke="#2B3350" strokeWidth="1.6" /></g>
              : <g transform="translate(700 100)"><rect x="-44" y="12" width="90" height="48" fill="#1E4FB8" /><path d="M-52 14 L0 -22 L52 14z" fill="#16398C" /><circle cx="0" cy="2" r="9" fill="#fff" /><path d="M0 2v-5M0 2l3 2" stroke="#16398C" strokeWidth="1.6" /><rect x="-8" y="34" width="16" height="26" fill="#C9D6F2" /></g>}
            <g className="gm-env" data-go={stage === "sending" || stage === "sent" ? "1" : "0"}>
              <rect x="-22" y="-15" width="44" height="30" rx="4" fill="#fff" stroke="#1B2438" strokeWidth="2.5" />
              <path d="M-22 -15 L0 3 L22 -15" fill="none" stroke="#1B2438" strokeWidth="2.5" strokeLinejoin="round" />
              <rect x="8" y="2" width="11" height="9" rx="1.5" fill="#E0367A" />
            </g>
          </svg>
          {stage === "sending" && <Coach mood="think">Off it goes…</Coach>}
          {stage === "sent" && (
            <>
              <Coach mood="cheer" right>Your letter has arrived. Here is what happens next.</Coach>
              <ol className="gm-next">{NEXT_STEPS.map((s, i) => <li key={s} style={{ animationDelay: `${i * 380}ms` }}><span aria-hidden="true">{i + 1}</span>{s}</li>)}</ol>
              <p className="gm-help">Be polite, be clear, and say what you want. Never put anything private in a letter that you would not want a stranger to read, apart from your address, which they need to know you live in their area.</p>
              <div className="cr-row"><button type="button" className="btn btn-primary btn-lg" onClick={another}>Write another letter</button></div>
            </>
          )}
        </>
      )}
    </div>
  );
}

// ci-notes.js
//
// Loaded into every data script on GitHub with `node --import "$GITHUB_WORKSPACE/ci-notes.js" script.js` (see the workflows; GitHub no longer lets NODE_OPTIONS be set from a step, so each command names it). The daily and weekly steps are all set to carry on when one fails, so
// a failure is easy to miss and its reason is only in a log that needs a sign-in to read. When a script ends with an error, this turns the last thing it said on stderr into a
// GitHub annotation ("::error ..."), which shows on the run's page and through the public API, so the reason can be seen without opening the log.
// It changes nothing about how a script runs or what it exits with, and does nothing outside GitHub.

import { basename } from "node:path";

const MAX = 400;

// The annotation line for a script that failed, from what it wrote to stderr: stack frames and blanks are dropped, the last few lines kept, and line breaks escaped the way GitHub wants.
export function annotation(name, stderr) {
  const lines = String(stderr).split(/\r?\n/).map((l) => l.trim()).filter((l) => l && !/^at /.test(l) && !/^Node\.js v/.test(l) && !/^\^+$/.test(l));
  const message = (lines.slice(-3).join(" | ") || "no message").replace(/[%\r\n]/g, (c) => ({ "%": "%25", "\r": "%0D", "\n": "%0A" })[c]).slice(0, MAX);
  return `::error title=${String(name).replace(/[,:]/g, " ")} failed::${message}`;
}

if (process.env.GITHUB_ACTIONS) {
  let tail = "";
  const write = process.stderr.write.bind(process.stderr);
  process.stderr.write = (chunk, ...rest) => {
    tail = (tail + (typeof chunk === "string" ? chunk : Buffer.from(chunk).toString())).slice(-3000);
    return write(chunk, ...rest);
  };
  // An uncaught error is printed by Node itself, not through stderr.write, so it is read here (the monitor does not change what happens next).
  process.on("uncaughtExceptionMonitor", (err) => { tail = `${tail}\n${err?.message ?? err}`; });
  process.on("exit", (code) => {
    if (code) process.stdout.write(`${annotation(basename(process.argv[1] ?? "script"), tail)}\n`);
  });
}

// A stand-in for the data service, for runs that have no real one (the speed check in CI): it answers every read with an empty list and the headers a browser needs,
// so the site loads the way it does with no data and its console stays clean. Usage: node scripts/mock-data-service.mjs [port]
import http from "node:http";

const port = Number(process.argv[2] ?? 54321);
const cors = { "access-control-allow-origin": "*", "access-control-allow-headers": "authorization, apikey, content-type, accept, prefer, range, x-client-info", "access-control-allow-methods": "GET, HEAD, OPTIONS", "access-control-expose-headers": "content-range" };

http.createServer((req, res) => {
  if (req.method === "OPTIONS") { res.writeHead(204, cors); return res.end(); }
  res.writeHead(200, { ...cors, "content-type": "application/json", "content-range": "*/0" });
  res.end(req.method === "HEAD" ? undefined : "[]");
}).listen(port, "127.0.0.1", () => console.log(`Mock data service on ${port}`));

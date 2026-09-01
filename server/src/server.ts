import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import express, { type NextFunction, type Request, type Response } from "express";
import cors from "cors";
import { verifyEmailRouter } from "./routes/verifyEmail.js";

const app = express();
const PORT = Number(process.env.PORT) || 4001;

app.use(cors());
app.use(express.json({ limit: "10kb" }));

app.get("/api/health", (_req: Request, res: Response) => {
  res.status(200).json({ status: "ok" });
});

app.use("/api", verifyEmailRouter);

// Optionally serve the built React app so one Node process can host both
// the API and the frontend — see README "Deployment". This only activates
// when the repo root's `dist/` (built via `npm run build`) exists, so
// local dev — where the frontend runs separately on Vite — is unaffected.
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CLIENT_DIST_DIR = path.join(__dirname, "../../dist");
if (existsSync(path.join(CLIENT_DIST_DIR, "index.html"))) {
  app.use(express.static(CLIENT_DIST_DIR));
}

app.use((_req: Request, res: Response) => {
  res.status(404).json({ error: "Not found." });
});

// Single catch-all: handles malformed JSON from express.json() (thrown
// before any route runs) and any unexpected error from a route handler,
// so the API always returns JSON and never crashes the process.
app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
  if (err instanceof SyntaxError && "body" in err) {
    res.status(400).json({ error: "Invalid JSON body." });
    return;
  }
  console.error("Unexpected server error:", err instanceof Error ? err.message : "unknown error");
  res.status(500).json({ error: "Internal server error." });
});

app.listen(PORT, () => {
  console.log(`InboxValid mock API listening on http://localhost:${PORT}`);
});

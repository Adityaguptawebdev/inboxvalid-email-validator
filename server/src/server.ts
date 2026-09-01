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

// Serve the built frontend if it exists (see README "Deployment").
// No-op in local dev, where dist/ isn't built and Vite serves it instead.
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CLIENT_DIST_DIR = path.join(__dirname, "../../dist");
if (existsSync(path.join(CLIENT_DIST_DIR, "index.html"))) {
  app.use(express.static(CLIENT_DIST_DIR));
}

app.use((_req: Request, res: Response) => {
  res.status(404).json({ error: "Not found." });
});

// Catches malformed JSON from express.json() and any route error, so
// the API always returns JSON and never crashes the process.
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

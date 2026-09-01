import { Router, type Request, type Response } from "express";
import { validateEmailFull } from "../lib/validateEmail.js";
import type { VerifyEmailRequestBody } from "../types.js";

export const verifyEmailRouter = Router();

// Artificial delay so the "checking" UI state is actually visible.
const MOCK_LOOKUP_DELAY_MS = 450;
const MAX_EMAIL_LENGTH = 254; // RFC 5321 max mailbox length

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

verifyEmailRouter.post(
  "/verify-email",
  async (req: Request<Record<string, never>, unknown, VerifyEmailRequestBody>, res: Response) => {
    const { email } = req.body ?? {};

    if (typeof email !== "string" || email.trim().length === 0) {
      res.status(400).json({ error: "A non-empty 'email' string field is required." });
      return;
    }

    if (email.length > MAX_EMAIL_LENGTH) {
      res.status(400).json({ error: "Email address is too long." });
      return;
    }

    await delay(MOCK_LOOKUP_DELAY_MS);

    // Never log the raw address — see README "Security considerations".
    const result = validateEmailFull(email);
    res.status(200).json(result);
  },
);

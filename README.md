# InboxValid.ai — Real-time Email Validation Widget

A signup page built around a lightweight, embeddable email validation
widget that checks an address as the user types — locally where possible,
and against a mock backend where a real check is needed — without ever
blocking signup if that backend is unavailable.

## Live Demo

[View Live Project](https://inboxvalid.onrender.com/)

Built as a technical assignment demo for InboxValid.ai / Tvaram Private
Limited.

---
<img width="1492" height="888" alt="image" src="https://github.com/user-attachments/assets/99b46acc-b581-4b7f-adeb-67c0fc689f3a" />

## Table of contents

- [Project overview](#project-overview)
- [Quick start](#quick-start)
- [Deployment](#deployment)
- [Architecture](#architecture)
- [Validation logic](#validation-logic)
- [Performance](#performance)
- [Fail-open strategy](#fail-open-strategy)
- [API contract](#api-contract)
- [The embeddable widget (stretch goal)](#the-embeddable-widget-stretch-goal)
- [Project structure](#project-structure)
- [Testing](#testing)
- [Trade-offs](#trade-offs)
- [Scalability](#scalability)
- [Security considerations](#security-considerations)
- [What I would improve next](#what-i-would-improve-next)

---

## Project overview

The assignment asked for a real-time email validation widget inside a
signup form, built as three independent layers rather than one component
with inline checks:

1. **Syntax** — regex, checked locally, instantly.
2. **Disposable domain** — local list, checked locally, instantly.
3. **Mock MX plausibility** — a debounced call to a small Express API,
   only made once the first two layers pass.

The React widget (`EmailValidator`) is self-contained — it drops into the
signup form with three props and knows nothing about the form around it.
The same pipeline is also reimplemented as a dependency-free vanilla JS
file (`public/widget.js`) for pages that aren't running React at all.

## Quick start

Requires Node 18+.

```bash
npm install      # installs frontend deps, then server deps via postinstall
npm run dev      # runs the Vite frontend (:5173) and Express API (:4001) together
```

Open **http://localhost:5173**. No API keys, no database, no paid service.

```bash
npm run dev:web       # frontend only
npm run dev:server    # backend only
npm run build          # typecheck + production build of the frontend
npm run build:server   # compile the backend (TypeScript -> server/dist)
npm start               # run the compiled backend — see "Deployment"
npm test               # unit tests (frontend + backend)
npm run lint            # oxlint across the whole project
```

The backend's port is configurable via `server/.env` — see
`server/.env.example`. Vanilla embeddable widget demo, once `npm run dev`
is running: **http://localhost:5173/embed-demo.html**.

## Deployment

In dev, the Vite frontend and Express API run as two processes, with Vite
proxying `/api/*` to the backend. For deployment, `server.ts` also serves
the built React app directly if `dist/` exists — so **one Node process
hosts both the API and the frontend on one port**. One deploy, one URL, no
CORS or cross-origin API base URL to configure.

```bash
# Build
npm install && npm run build && npm run build:server
# Start
npm start
```

The server reads `PORT` from the environment (defaults to `4001`).
Health check: `/api/health`.

### Deploying to Render

The repo includes a `render.yaml` blueprint: **New → Blueprint** in
Render, point it at the repo, and it reads the build/start commands and
health check path automatically. Any other Node host (Railway, Fly.io, a
VPS) works the same way — nothing here is Render-specific.

Free tiers on platforms like Render sleep the service after a period of
inactivity, so the first request after a while can take a few seconds to
wake it back up.

### Splitting frontend and backend later

`EmailValidator` only ever calls a relative `/api/verify-email`, and CORS
is already open, so deploying them separately later just needs a
proxy/rewrite (or a `VITE_API_BASE_URL`-style env var) — the frontend was
written against the response shape, not the API's location.

## Architecture

```
Signup Form (SignupForm.tsx)
     |
     v
EmailValidator.tsx  (owns markup, delegates state to a hook)
     |
     v
useEmailValidation.ts  (debounce + state machine, no UI)
     |
     +--> Layer 1: isValidEmailSyntax()      -- utils/validateSyntax.ts   (local, sync)
     |
     +--> Layer 2: isDisposableDomain()      -- utils/disposableDomains.ts (local, sync)
     |
     +--> Layer 3: verifyEmailRemote()       -- services/emailApi.ts
              |
              v
          POST /api/verify-email             -- server/src/routes/verifyEmail.ts
              |
              v
          validateEmailFull()                -- server/src/lib/validateEmail.ts
              |
              +--> re-checks syntax + disposable (never trusts the client)
              +--> checkMx()  -- mocked domain lookup, server/src/data/mailDomains.ts
              |
              v
          { status, reason, checks }  -->  EmailValidationResult  -->  ValidationState.tsx
```

Each layer only runs if the previous one passed, and only Layer 3 ever
leaves the browser. `useEmailValidation` owns all state-machine and
networking logic; `EmailValidator` only renders whatever result the hook
gives it. That split is what makes the validation logic unit-testable
without rendering anything, and keeps `EmailValidator` reusable without
form-specific logic baked into it.

## Validation logic

### Layer 1 — Syntax (`src/utils/validateSyntax.ts`)

A single regex, not an RFC 5322 parser:

```
^(?!.*\.\.)[a-zA-Z0-9](?:[a-zA-Z0-9._%+-]*[a-zA-Z0-9])?@(?:[a-zA-Z0-9](?:[a-zA-Z0-9-]*[a-zA-Z0-9])?\.)+[a-zA-Z]{2,}$
```

- `(?!.*\.\.)` rejects consecutive dots anywhere (`john..test@gmail.com`).
- Local part and each domain label must start/end alphanumeric (rejects
  `.john@`, `john.@`).
- Requires at least one `label.` group plus a letters-only TLD (2+ chars)
  — rejects `john@gmail` (no TLD) and `john@` (no domain).

Doesn't handle quoted local parts, IP-literal domains, or
internationalized domains — real RFC edge cases a signup form doesn't
need, and supporting them would make the regex much harder to defend.

### Layer 2 — Disposable domain (`src/utils/disposableDomains.ts`)

A `Set` of 12 well-known disposable providers (`mailinator.com`,
`tempmail.com`, `10minutemail.com`, etc.). Case-insensitive `Set.has()` —
O(1), no network call.

### Layer 3 — Mock MX plausibility (`server/src/lib/validateEmail.ts`)

No real DNS/MX lookup — `checkMx()` is a strict allow-list of known
mail-capable providers (`gmail.com`, `yahoo.com`, `outlook.com`,
`hotmail.com`, and others in `server/src/data/mailDomains.ts`). A domain
resolves `mx: true` only if it's explicitly listed; everything else,
including domains with an ordinary-looking TLD, resolves `mx: false`. In
production this would be replaced with a real DNS/MX lookup behind the
same `checkMx()` interface — see [Trade-offs](#trade-offs).

**The server re-runs all three layers itself** (`validateEmailFull`) —
it never trusts that the client already did this. `/api/verify-email` is
safe to call directly, from anywhere, with any input.

## Performance

Pipeline: debounce → local checks → API only if needed.

- **120ms debounce.** Short by typical standards, and deliberate — it
  only has to absorb the gap between keystrokes, not hide network
  latency, since the two checks that run first (syntax, disposable) are
  synchronous.
- **Local checks resolve at the debounce mark.** A syntactically invalid
  or disposable email gets its final answer ~120ms after the user stops
  typing, with no network call at all.
- **The API is only called for emails that pass both local checks**, and
  the UI switches to "Checking email..." immediately at that same
  ~120ms mark — the user always sees a response right away.
- **The final valid/invalid result is not instant.** It depends on the
  mock API's response time: a fixed 450ms artificial delay server-side,
  plus real network latency. The 120ms figure covers when the UI
  acknowledges input, not the full round trip to a definitive answer —
  that's an intentional distinction, not an oversight.
- **One request per settled value.** An `AbortController` per validation
  run cancels a superseded request, so typing past an already-checked
  email doesn't leave a stale request running. Payload is tiny either
  way: `{ "email": "..." }` in, three booleans and a status out.

## Fail-open strategy

If `/api/verify-email` fails for any reason — network error, timeout,
non-2xx status, malformed JSON, unexpected shape — the widget does
**not** mark the email invalid. It shows "Unable to verify right now.
You can continue." and reports `canSubmit: true`, identical to a
successful "valid" result. `SignupForm`'s submit handler checks
`emailValidation.canSubmit`, not `status === "valid"`, so this path needs
no special-casing.

**Why:** the MX check is a plausibility signal, not a source of truth — a
validation-service outage isn't the user's fault, and blocking signup
over it turns an infrastructure problem into lost signups. The two
*local* checks never fail open, since they have no network dependency to
fail.

Implemented in one place — the `catch` block in
`useEmailValidation.ts`'s `runValidation()` — with `EmailApiError` in
`services/emailApi.ts` normalizing every failure mode into one error type
so that block doesn't need to branch on cause.

## API contract

### `POST /api/verify-email`

**Request**

```json
{ "email": "john@gmail.com" }
```

**Response — 200, valid**

```json
{
  "status": "valid",
  "reason": "Email domain appears mail-capable.",
  "checks": { "syntax": true, "disposable": false, "mx": true }
}
```

**Response — 200, invalid (disposable)**

```json
{
  "status": "invalid",
  "reason": "Disposable email addresses are not allowed.",
  "checks": { "syntax": true, "disposable": true, "mx": false }
}
```

**Error responses**

| Status | When |
| --- | --- |
| `400` | Missing/empty/non-string `email`, email over 254 chars, or malformed JSON body |
| `404` | Unknown route |
| `500` | Unexpected server error |

Error bodies are `{ "error": "<message>" }`. The frontend treats every
non-200 response the same way — see [Fail-open strategy](#fail-open-strategy).

### `GET /api/health`

Returns `{ "status": "ok" }`.

## The embeddable widget (stretch goal)

`public/widget.js` is a dependency-free vanilla JS reimplementation of
the same pipeline:

```html
<input type="email" data-inboxvalid />
<script src="/widget.js" data-api="/api/verify-email"></script>
```

It finds every `[data-inboxvalid]` input, inserts a status message after
each one, and runs the same debounce → syntax → disposable → API →
fail-open pipeline as the React widget. `data-api` on the script tag
configures the endpoint.

`public/embed-demo.html` is a working example — a plain HTML page with no
build step. With `npm run dev` running, open
**http://localhost:5173/embed-demo.html**.

This duplicates the syntax regex and disposable list from `src/utils/`
rather than importing them, since it has to run standalone with no
bundler — see [Trade-offs](#trade-offs).

## Project structure

```
inboxValid/
├── src/
│   ├── components/
│   │   ├── EmailValidator.tsx    # reusable widget: markup only, delegates to the hook
│   │   ├── ValidationState.tsx   # presentational: result -> icon/color/text
│   │   ├── SignupForm.tsx        # composes the form, owns submit logic
│   │   └── Toast.tsx             # small success notification
│   ├── hooks/
│   │   └── useEmailValidation.ts # debounce + 3-layer state machine (no UI)
│   ├── utils/
│   │   ├── validateSyntax.ts     # Layer 1 (+ tests)
│   │   └── disposableDomains.ts  # Layer 2 (+ tests)
│   ├── services/
│   │   └── emailApi.ts           # fetch wrapper, normalizes all failures (+ tests)
│   ├── types/
│   │   └── email.ts              # EmailValidationResult, VerifyEmailResponse, etc.
│   └── App.tsx                   # page layout (marketing panel + SignupForm)
├── public/
│   ├── widget.js                 # stretch goal: vanilla JS embeddable widget
│   └── embed-demo.html           # working example of the vanilla widget
├── server/
│   └── src/
│       ├── routes/verifyEmail.ts # POST /api/verify-email
│       ├── lib/validateEmail.ts  # server-side 3-layer validation (+ tests)
│       ├── data/
│       │   ├── mailDomains.ts       # mock MX allow-list of known mail-capable domains
│       │   └── disposableDomains.ts
│       └── server.ts             # Express app, CORS, error handling, optional static serving
├── render.yaml                   # Render blueprint — see "Deployment"
└── README.md
```

## Testing

```bash
npm test                 # frontend + backend unit tests (vitest picks up both)
npm test --prefix server # backend only
```

**37 tests**, covering the assignment's required cases: valid email,
missing `@`, missing domain, missing TLD, consecutive dots, empty input,
disposable domain, non-disposable domain, and API failure — split across
`validateSyntax.test.ts`, `disposableDomains.test.ts`, `emailApi.test.ts`
on the frontend, mirrored in `validateEmail.test.ts` on the server (which
also covers the combined `validateEmailFull` pipeline end to end).

Scoped to pure functions and the API service layer — no
`@testing-library/react` or jsdom, since the logic worth unit-testing
here doesn't need a DOM. The full UI flow (all five states, fail-open,
mobile layout, submit) was verified manually against the running app.

## Trade-offs

- **Mock MX instead of real DNS lookups.** A real check needs an outbound
  resolver, timeout/retry handling, and ideally caching — out of scope
  for a self-contained demo. The mock (a strict allow-list, not a
  "plausible TLD" heuristic) keeps the same fail-open contract without
  becoming more permissive than a real MX check would be.
- **12-entry disposable list instead of a maintained database.** Proves
  the mechanism; `isDisposableDomain()` is a one-line `Set.has()` behind
  a stable interface, so swapping in a real source later doesn't touch
  calling code.
- **Validation logic duplicated across React, the server, and
  `widget.js`.** The server must validate standalone regardless of the
  client, and `widget.js` can't import from `src/` since it has to run
  with no bundler. A shared package would remove the duplication but
  isn't worth the setup cost for ~15 lines of regex/list logic here.
- **120ms debounce, not the typical 300–500ms.** Only Layer 3 is async,
  so a short debounce costs nothing locally, and most keystrokes never
  produce a syntactically-complete, non-disposable email to send anyway.
- **Plain Express instead of Fastify/NestJS.** One route, no auth, no
  database — the route handler is a thin wrapper around
  `validateEmailFull()`, so a framework swap touches one file.

## Scalability

The frontend only ever talks to one contract:
`POST /api/verify-email` returning `{ status, reason, checks }`.
Everything below that contract can change without touching the frontend:

```
Frontend (unchanged)
   |
   v
API Gateway            <- auth, rate limiting, request logging
   |
   v
Email Validation Service   <- validateEmailFull() becomes a real service
   |
   +--> DNS/MX Resolver     <- replaces checkMx()'s mock lookup
   |
   +--> Caching Layer       <- domain-level results cached (MX doesn't
                                 change per-user; Redis keyed by domain
                                 would cut resolver load significantly)
```

The disposable-domain list becomes a periodically-refreshed database or
third-party API behind the same `isDisposableDomain()`-shaped call — the
frontend was written against the response shape, not the mock data.

## Security considerations

- **Raw email addresses are never logged** — the server logs error
  messages, not request bodies; the frontend's fail-open path logs the
  error, not the address.
- **CORS is wide open** (`cors()` with no options) for local dev across
  ports. In production this should be locked to the actual frontend
  origin(s).
- **No rate limiting or API auth** — fine for a demo, but a real
  deployment needs both: rate limiting to stop the endpoint being used
  for email-list scraping, and an API key/signed request if it's meant
  to be called only by this frontend.
- **Input validated at the boundary** — `verifyEmail.ts` checks `email`
  is a non-empty string under 254 characters before any validation
  logic runs; a catch-all error handler in `server.ts` means the process
  never crashes on bad JSON or an unexpected exception.

## What I would improve next

- Real DNS/MX lookups (with a timeout) behind the same `checkMx()`
  interface.
- A maintained disposable-domain database instead of the 12-entry list.
- A Redis cache keyed by domain for the MX check — the highest-value
  addition under real load, since mail-capability doesn't change per
  request.
- Rate limiting and API-key auth on `/api/verify-email`.
- Batch validation (`POST /api/verify-emails` with an array) for
  CSV-style list cleaning.
- Package the widget for npm/CDN distribution instead of a same-origin
  static file, with a versioned build.

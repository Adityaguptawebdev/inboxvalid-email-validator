# InboxValid.ai — Real-time Email Validation Widget

A signup page built around a lightweight, embeddable email validation
widget that checks an address as the user types — locally where possible,
and against a mock backend where a real check is needed — without ever
blocking signup if that backend is unavailable.

Built as a technical assignment demo for InboxValid.ai / Tvaram Private
Limited.

---

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

The assignment asked for a real-time email validation widget demonstrated
inside a signup form. Rather than one big component with inline checks,
this is built as three independent layers that compose into one pipeline:

1. **Syntax** — a regex, checked locally, instantly.
2. **Disposable domain** — a local list, checked locally, instantly.
3. **Mock MX plausibility** — a debounced call to a small Express API,
   only made once the first two layers already pass.

The React widget (`EmailValidator`) is a self-contained, reusable
component — it's dropped into the signup form with three props and knows
nothing about the form around it. The same three-layer logic is also
reimplemented as a dependency-free vanilla JS file (`public/widget.js`)
so it can be dropped into a plain HTML page with a single `<script>` tag.

## Quick start

Requires Node 18+.

```bash
npm install      # installs frontend deps, then server deps via postinstall
npm run dev      # runs the Vite frontend (:5173) and Express API (:4001) together
```

Open **http://localhost:5173**. No API keys, no database, no paid service.

Other useful commands:

```bash
npm run dev:web       # frontend only
npm run dev:server    # backend only
npm run build          # typecheck + production build of the frontend
npm run build:server   # compile the backend (TypeScript -> server/dist)
npm start               # run the compiled backend — see "Deployment" below
npm test               # runs the unit tests (frontend + backend)
npm run lint            # oxlint across the whole project
```

The backend also has its own scripts if you want to run it standalone
(`cd server && npm run dev`), and its port is configurable via
`server/.env` — see `server/.env.example`.

Try the vanilla embeddable widget at **http://localhost:5173/embed-demo.html**
once `npm run dev` is running — it's a plain HTML file with no React.

## Deployment

In dev, the Vite frontend (`:5173`) and Express API (`:4001`) run as two
separate processes, with Vite proxying `/api/*` to the backend (see
`vite.config.ts`). For deployment, `server.ts` can also serve the built
React app directly — see the `existsSync(...)` check in `server/src/server.ts`
— so **one Node process hosts both the API and the frontend on one port**.
That means one deploy, one URL, and no CORS or cross-origin API base URL to
configure.

**Build command** (installs both projects' deps, then builds both):

```bash
npm install && npm run build && npm run build:server
```

**Start command:**

```bash
npm start
```

The server reads `PORT` from the environment (falling back to `4001`
locally) — every major Node host sets this automatically. Health check
endpoint: `/api/health`.

### Deploying to Render (free tier)

The repo includes a `render.yaml` blueprint, so this is push-button:

1. Push this repo to GitHub.
2. In Render: **New → Blueprint**, point it at the repo. Render reads
   `render.yaml` and creates the service with the build/start commands
   above already filled in.
3. Once deployed, open the service URL — it serves the signup page
   directly. `<service-url>/embed-demo.html` and `<service-url>/api/health`
   should also work.

Any other Node host (Railway, Fly.io, a plain VPS) works the same way
with the same two commands — nothing here is Render-specific.

*Free tiers on platforms like Render typically spin the service down
after a period of inactivity, so the first request after a while can take
a few seconds to wake it back up — expected for a free-tier demo, not a
bug.*

### If you'd rather deploy frontend and backend separately

Nothing stops it — `EmailValidator` only ever calls a relative
`/api/verify-email`, and CORS is already wide open (see
[Security considerations](#security-considerations)), so pointing the
built frontend at a separately-hosted API just needs the frontend build
to be served from behind a proxy/rewrite that forwards `/api/*` to the
backend's URL (e.g. a Vercel/Netlify rewrite rule), or a small
`VITE_API_BASE_URL`-style env var added to `emailApi.ts`. The single-
service setup above is simpler and is what this repo ships with, but the
frontend was written against the API's response shape, not its location,
so this isn't a rewrite — see [Scalability](#scalability).

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
leaves the browser. The **hook** (`useEmailValidation`) owns all the
state-machine and networking logic; **`EmailValidator`** only knows how to
render whatever result the hook gives it and how to notify a parent form.
That split is what makes the validation logic unit-testable independently
of any rendering, and makes `EmailValidator` reusable without dragging
form-specific logic into it.

### Why a custom hook instead of putting this in the component

`EmailValidator.tsx` renders markup and nothing else. All of the
debouncing, cancellation, and fail-open handling lives in
`useEmailValidation.ts`, which takes a string and returns a result — it
has no idea a `<form>` or a signup page exists. That's what "keep
validation logic separate from UI" means in practice here, and it's why
the pure logic (`validateSyntax.ts`, `disposableDomains.ts`, `emailApi.ts`)
is unit-tested directly without needing to render anything.

## Validation logic

### Layer 1 — Syntax (`src/utils/validateSyntax.ts`)

A single regex, not an RFC 5322 parser:

```
^(?!.*\.\.)[a-zA-Z0-9](?:[a-zA-Z0-9._%+-]*[a-zA-Z0-9])?@(?:[a-zA-Z0-9](?:[a-zA-Z0-9-]*[a-zA-Z0-9])?\.)+[a-zA-Z]{2,}$
```

- `(?!.*\.\.)` rejects consecutive dots anywhere (`john..test@gmail.com`).
- The local part and each domain label must start/end with an
  alphanumeric character (rejects `.john@`, `john.@`, etc).
- The domain must have at least one `label.` group followed by a
  letters-only TLD of 2+ characters — this is what rejects `john@gmail`
  (no TLD) and `john@` (no domain at all).

This deliberately doesn't handle quoted local parts, IP-literal domains,
or internationalized domains — real edge cases in the full RFC, but not
things a signup form realistically needs to accept, and supporting them
would make the regex much harder to read and defend.

### Layer 2 — Disposable domain (`src/utils/disposableDomains.ts`)

A `Set` of 12 well-known disposable providers (`mailinator.com`,
`tempmail.com`, `10minutemail.com`, `guerrillamail.com`, `yopmail.com`,
and others). Domain lookup is a case-insensitive `Set.has()` — O(1), no
network call.

### Layer 3 — Mock MX plausibility (`server/src/lib/validateEmail.ts`)

The server doesn't perform a real DNS/MX lookup (see
[Trade-offs](#trade-offs)). Instead `checkMx()` uses a strict allow-list
of known mail-capable providers (`gmail.com`, `yahoo.com`, `outlook.com`,
`hotmail.com`, and a handful of others in `server/src/data/mailDomains.ts`)
— a domain resolves `mx: true` only if it's explicitly on that list.
Everything else resolves `mx: false`, including a domain with an
ordinary-looking TLD that simply isn't a known provider (e.g.
`test@thisdomainprobablydoesnotexist12345.com`). A real MX lookup is a
positive check — "this domain has a mail server" — not a guess based on
how plausible the domain looks, so the mock mirrors that: no match means
no, not "probably."

**The server re-runs all three layers itself** (`validateEmailFull`) —
it never trusts that the client already did this. `/api/verify-email` is
safe to call directly, from anywhere, with any input.

## Performance

The full pipeline: **debounce → local checks → API only if needed.**

- **Debounce: 120ms.** Short by typical debounce standards, and that's
  deliberate — it only needs to absorb the interval between keystrokes,
  not hide network latency, because the two checks that run first
  (syntax, disposable) are synchronous. A syntactically-invalid email
  therefore gets a final answer ~120ms after the user stops typing, well
  under the assignment's ~200ms perceived-latency target.
- **Local checks run before any network call.** Most keystrokes never
  reach the API at all — an in-progress email (`john@gma`) or an obviously
  malformed one never triggers a request. Only an email that's already
  syntactically valid *and* not on the disposable list ever calls
  `/api/verify-email`.
- **One request per settled value, not per keystroke.** The debounce plus
  an `AbortController` per validation run means a superseded request is
  cancelled — typing past an already-valid email doesn't leave a stale
  request running.
- **Tiny payload.** The request body is `{ "email": "..." }`; the
  response is three booleans, a status, and a short reason string.
- **On "perceived latency":** the 200ms target is about *the UI
  acknowledging the user's input*, not the full round trip. Layers 1–2
  resolve within the debounce window (~120ms). When Layer 3 is needed,
  the "Checking email..." state appears at that same ~120ms mark — the
  user sees a response immediately, even though the *final* valid/invalid
  answer depends on the mock API's artificial delay (450ms, so the
  spinner is actually visible in a demo) plus real network time.

## Fail-open strategy

If `/api/verify-email` fails for any reason — network error, timeout,
non-2xx status, malformed JSON, unexpected response shape — the widget
does **not** mark the email invalid. It shows:

> ⓘ Unable to verify right now. You can continue.

and reports `canSubmit: true` to the parent form, exactly like a
successful "valid" result. `SignupForm`'s submit handler checks
`emailValidation.canSubmit`, not `status === "valid"`, so this state
sails through submission without special-casing.

**Why fail open instead of blocking:** the MX check here is a plausibility
signal, not a source of truth — a real inbox can exist behind a domain our
mock (or even a real DNS lookup) fails to reach, and a validation service
outage is not the user's fault. Blocking signups because a third-party
check is down converts an infrastructure problem into lost signups. The
one thing that must never fail open is the two *local* checks (syntax,
disposable) — those have no network dependency to fail, so there's no
ambiguity to resolve in the user's favor.

All of this is implemented in one place: the `catch` block in
`useEmailValidation.ts`'s `runValidation()`, and `EmailApiError` in
`services/emailApi.ts` normalizes every failure mode into a single error
type so that `catch` block doesn't need to branch on cause.

You can see this yourself: throttle or block `/api/verify-email` in
devtools (or just stop the `server` process while the frontend keeps
running) and type a valid-looking email — it fails open instead of
hanging or showing an error.

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

**Response — 200, invalid (no mock MX record)**

```json
{
  "status": "invalid",
  "reason": "Domain does not appear to accept email.",
  "checks": { "syntax": true, "disposable": false, "mx": false }
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

Returns `{ "status": "ok" }`. Used for local readiness checks.

## The embeddable widget (stretch goal)

`public/widget.js` is a dependency-free, vanilla JS reimplementation of
the same three-layer pipeline, for a page that isn't running React at
all:

```html
<input type="email" data-inboxvalid />
<script src="/widget.js" data-api="/api/verify-email"></script>
```

It finds every `[data-inboxvalid]` input on the page, inserts a status
`<p>` after each one, and attaches the same debounce → syntax →
disposable → API pipeline as the React widget, including fail-open on
network failure. `data-api` on the `<script>` tag configures the
endpoint (defaults to `/api/verify-email`).

`public/embed-demo.html` is a working example — a plain HTML page with no
build step, served statically alongside the React app. With `npm run dev`
running, open **http://localhost:5173/embed-demo.html**.

This intentionally duplicates the syntax regex and disposable list from
`src/utils/` rather than importing them — see [Trade-offs](#trade-offs).

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
│       └── server.ts             # Express app, CORS, error handling, optional static frontend serving
├── render.yaml                   # Render blueprint — see "Deployment"
└── README.md
```

## Testing

```bash
npm test                 # frontend + backend unit tests (vitest picks up both)
npm test --prefix server # backend only
```

37 tests total, covering the assignment's required cases and the
service-layer failure modes:

- **`src/utils/validateSyntax.test.ts`** — valid email, missing `@`,
  missing domain (`john@`), missing TLD (`john@gmail`), consecutive dots,
  empty/whitespace input.
- **`src/utils/disposableDomains.test.ts`** — known disposable domain,
  case-insensitivity, non-disposable domain.
- **`src/services/emailApi.test.ts`** — valid 200 response, network
  failure, non-2xx status, malformed response shape (all four map to the
  same `EmailApiError` the fail-open path relies on).
- **`server/src/lib/validateEmail.test.ts`** — the same syntax/disposable
  cases server-side, plus `checkMx`'s allow-list behavior (including a
  regression test for `thisdomainprobablydoesnotexist12345.com`) and the
  combined `validateEmailFull` pipeline end to end.

Testing is scoped to the pure functions and the API service layer, not
component rendering — no `@testing-library/react` or jsdom is pulled in,
since the logic worth unit-testing here (regexes, list lookups, a fetch
wrapper's error handling) doesn't need a DOM. The full flow (typing,
debounce, all five UI states, fail-open, mobile layout) was verified
manually against the running app in a real browser.

## Trade-offs

- **Mock MX validation instead of real DNS lookups.** A real check needs
  an outbound DNS resolver, timeout/retry handling, and ideally caching —
  infrastructure that doesn't fit a self-contained demo with no external
  services. The mock (a strict allow-list of known providers) demonstrates
  the same *shape* of check — and the same fail-open contract — without
  depending on network conditions this demo can't control. It's
  deliberately an allow-list rather than a "plausible TLD" heuristic: a
  real MX lookup only succeeds for domains that actually have a mail
  server, so a heuristic that passes anything with a normal-looking TLD
  would make the mock strictly more permissive than reality, defeating
  the point of the check. See [Scalability](#scalability) for how this
  slots in later.
- **In-memory disposable-domain list (12 entries) instead of a maintained
  database.** Real disposable-domain lists have thousands of entries and
  need regular updates as new throwaway-mail services appear. A short
  hardcoded list proves the mechanism; a production system would swap in
  a maintained source without changing the calling code, since
  `isDisposableDomain()` is a one-line `Set.has()` behind a stable
  interface.
- **Client-side validation logic is duplicated on the server, and again
  (a third time) in `widget.js`.** I considered a shared package so
  syntax/disposable logic lived in one place. I didn't do that here
  because: (1) the server intentionally never trusts the client and must
  be able to validate standalone regardless of what the frontend does;
  (2) `widget.js` has to run in a host page with no bundler, so it can't
  import from `src/`. A monorepo workspace with a shared `@inboxvalid/core`
  package would remove this duplication in a larger project — it's not
  worth the setup cost for ~15 lines of regex/list logic here.
- **120ms debounce, not the more typical 300–500ms.** A longer debounce
  is normally used to smooth out server load or slow endpoints. Since
  Layers 1–2 are synchronous and only Layer 3 is async, a short debounce
  costs nothing extra locally and keeps the UI feeling responsive; the
  actual request-smoothing happens for free because most keystrokes never
  produce a syntactically-complete, non-disposable email to send.
- **A simple Express API instead of a framework like Fastify/NestJS.**
  One route, no auth, no database — Express's minimalism matches the
  scope. Nothing here depends on Express specifically; the route handler
  is a thin wrapper around `validateEmailFull()`, so swapping frameworks
  later touches one file.

## Scalability

The frontend only ever talks to one contract: `POST /api/verify-email`
returning `{ status, reason, checks }`. Everything below that contract
can change without touching `EmailValidator`, the hook, or `widget.js`:

```
Frontend (unchanged)
   |
   v
API Gateway            <- auth, rate limiting, request logging live here
   |
   v
Email Validation Service   <- validateEmailFull() becomes a real service
   |
   +--> DNS/MX Resolver     <- replaces checkMx()'s mock lookup
   |
   +--> Caching Layer       <- domain-level results cached (MX records
                                 don't change per-user or often; a Redis
                                 cache keyed by domain would cut resolver
                                 load dramatically)
```

The disposable-domain list becomes a periodically-refreshed database or
third-party API behind the same `isDisposableDomain()`-shaped call. None
of this requires a frontend redeploy, because the frontend was never
written against the mock data — it was written against the response
shape.

## Security considerations

- **Raw email addresses are never logged.** The server's error handler
  logs error messages, not request bodies; nothing in `verifyEmail.ts`
  writes the email to `console`. Even the fail-open path in the frontend
  logs the *error*, not the address being checked.
- **CORS is currently wide open** (`cors()` with no options) because the
  frontend and backend run on different localhost ports in dev. In
  production this should be locked to the actual frontend origin(s).
- **No rate limiting or API authentication** — appropriate for a local
  demo with no real users, but a real deployment needs both: rate
  limiting (per-IP or per-key) to stop the validation endpoint being used
  for email-list scraping/enumeration, and an API key or signed request
  if the endpoint is meant to be called only by this frontend rather than
  the public internet.
- **Input is validated at the boundary.** `verifyEmail.ts` checks that
  `email` is a non-empty string under 254 characters before it's ever
  passed to validation logic — malformed input gets a `400`, not a crash.
  A single catch-all error handler in `server.ts` guarantees the process
  never crashes on bad JSON or an unexpected exception.
- **Abuse prevention beyond rate limiting** (not implemented here, but
  what a production version needs): CAPTCHA or similar on the signup form
  itself, and monitoring for one IP hammering `/api/verify-email` with
  many distinct addresses — a pattern rate limiting alone doesn't fully
  catch but that combined with request logging would surface.

## What I would improve next

- **Real DNS/MX lookups** (with a sensible timeout) replacing the mocked
  domain lists, behind the same `checkMx()` interface.
- **A maintained disposable-domain database** instead of the 12-entry
  hardcoded list — either a regularly-synced open-source list or a
  third-party API.
- **A caching layer (Redis)** keyed by domain for the MX check — domain
  mail-capability doesn't change per request, so this is the highest-value
  addition for real load.
- **Rate limiting and API-key auth** on `/api/verify-email`, per the
  security section above.
- **Batch validation** (`POST /api/verify-emails` with an array) for
  bulk use cases like CSV list cleaning, which is a natural extension of
  the same validation pipeline.
- **Basic analytics** — aggregate counts of valid/invalid/disposable/
  unreachable results, useful for a real product to show customers what
  the widget is catching.
- **Package the widget for npm/CDN distribution** (`<script
  src="https://cdn.inboxvalid.ai/widget.js">`) instead of a same-origin
  static file, plus a versioned build so integrators aren't stuck to a
  moving `main` branch.

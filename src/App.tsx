import { Mail, Zap, ShieldCheck, Code2, Info } from "lucide-react";
import { SignupForm } from "./components/SignupForm";
import { ValidationState } from "./components/ValidationState";
import type { EmailValidationResult } from "./types/email";

const FEATURE_PILLS = [
  { icon: Zap, label: "Real-time" },
  { icon: ShieldCheck, label: "Smart Checks" },
  { icon: Code2, label: "Easy to Embed" },
];

// Static previews of the widget's own states, reusing the real
// ValidationState component so this panel never drifts from the actual UI.
const EXAMPLE_STATES: EmailValidationResult[] = [
  { status: "checking", message: "Checking email...", canSubmit: false },
  { status: "valid", message: "Email looks good!", canSubmit: true },
  { status: "invalid", message: "Disposable email addresses are not allowed.", canSubmit: false },
];

function App() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-white">
      <div className="mx-auto grid min-h-screen max-w-6xl gap-12 px-6 py-10 lg:grid-cols-2 lg:items-center lg:gap-16 lg:py-16">
        <section className="flex flex-col gap-8">
          <div className="flex items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-600 text-white">
              <Mail className="h-5 w-5" aria-hidden="true" />
            </span>
            <span className="text-lg font-semibold text-slate-900">InboxValid.ai</span>
          </div>

          <div className="flex flex-col gap-4">
            <h1 className="text-4xl font-bold leading-tight tracking-tight text-slate-900 sm:text-5xl">
              Real-time Email Validation Widget
            </h1>
            <p className="max-w-md text-lg text-slate-600">
              A lightweight JavaScript widget that validates email addresses as users type —
              catching typos, disposable inboxes, and unreachable domains before they ever reach
              your database.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            {FEATURE_PILLS.map(({ icon: Icon, label }) => (
              <span
                key={label}
                className="inline-flex items-center gap-1.5 rounded-full border border-indigo-100 bg-indigo-50 px-3 py-1.5 text-sm font-medium text-indigo-700"
              >
                <Icon className="h-3.5 w-3.5" aria-hidden="true" />
                {label}
              </span>
            ))}
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white/70 p-5 shadow-sm backdrop-blur">
            <p className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">
              Validation States
            </p>
            <div className="flex flex-col gap-2.5">
              {EXAMPLE_STATES.map((state) => (
                <ValidationState key={state.status} result={state} />
              ))}
            </div>
          </div>

          <div className="flex gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-5">
            <Info className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" aria-hidden="true" />
            <div>
              <p className="font-semibold text-amber-900">Fail-open by design</p>
              <p className="mt-1 text-sm text-amber-800">
                If the validation service is unreachable, users can continue without being
                blocked.
              </p>
            </div>
          </div>
        </section>

        <section>
          <SignupForm />
        </section>
      </div>
    </div>
  );
}

export default App;

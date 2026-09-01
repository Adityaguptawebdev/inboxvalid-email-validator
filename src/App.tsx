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
    <div className="min-h-screen bg-cream">
      <div className="mx-auto grid min-h-screen max-w-6xl gap-12 px-6 py-10 lg:grid-cols-2 lg:items-center lg:gap-16 lg:py-16">
        <section className="flex flex-col gap-8">
          <div className="flex items-center gap-2.5 animate-fade-in-up">
            <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-forest-700 text-cream">
              <Mail className="h-5 w-5" aria-hidden="true" />
            </span>
            <span className="text-lg font-bold tracking-tight text-stone-900">InboxValid.ai</span>
          </div>

          <div className="flex flex-col gap-4 animate-fade-in-up [animation-delay:60ms]">
            <h1 className="font-serif text-4xl font-bold leading-[1.1] tracking-tight text-stone-900 sm:text-5xl">
              <span className="text-forest-700">Real-time</span> Email Validation Widget
            </h1>
            <p className="max-w-md text-lg leading-relaxed text-stone-600">
              A lightweight JavaScript widget that validates email addresses as users type —
              catching typos, disposable inboxes, and unreachable domains before they ever reach
              your database.
            </p>
          </div>

          <div className="flex flex-wrap gap-2 animate-fade-in-up [animation-delay:120ms]">
            {FEATURE_PILLS.map(({ icon: Icon, label }) => (
              <span
                key={label}
                className="inline-flex items-center gap-2 rounded-lg border border-beige-300 bg-white px-3.5 py-2 text-sm font-medium text-forest-800 shadow-sm transition-transform hover:-translate-y-0.5"
              >
                <span className="flex h-5 w-5 items-center justify-center rounded-md bg-forest-100 text-forest-700">
                  <Icon className="h-3 w-3" aria-hidden="true" />
                </span>
                {label}
              </span>
            ))}
          </div>

          <div className="overflow-hidden rounded-2xl border border-beige-200 bg-white shadow-lg shadow-stone-900/5 animate-fade-in-up [animation-delay:180ms]">
            <div className="flex items-center gap-1.5 border-b border-beige-200 bg-cream-deep/60 px-4 py-2.5">
              <span className="h-2.5 w-2.5 rounded-full bg-red-300" />
              <span className="h-2.5 w-2.5 rounded-full bg-amber-300" />
              <span className="h-2.5 w-2.5 rounded-full bg-forest-300" />
              <span className="ml-2 text-xs font-semibold uppercase tracking-wide text-stone-500">
                Validation States
              </span>
            </div>
            <div className="flex flex-col gap-2.5 p-5">
              {EXAMPLE_STATES.map((state) => (
                <ValidationState key={state.status} result={state} />
              ))}
            </div>
          </div>

          <div className="flex gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-5 shadow-sm animate-fade-in-up [animation-delay:240ms]">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-amber-100 text-amber-700">
              <Info className="h-4 w-4" aria-hidden="true" />
            </span>
            <div>
              <p className="font-semibold text-amber-900">Fail-open by design</p>
              <p className="mt-1 text-sm text-amber-800">
                If the validation service is unreachable, users can continue without being
                blocked.
              </p>
            </div>
          </div>
        </section>

        <section className="animate-fade-in-up [animation-delay:120ms]">
          <SignupForm />
        </section>
      </div>
    </div>
  );
}

export default App;

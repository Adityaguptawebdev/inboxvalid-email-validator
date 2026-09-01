import { useState, type FormEvent } from "react";
import { Eye, EyeOff, AlertCircle, User, Lock, ArrowRight, CheckCircle2 } from "lucide-react";
import { EmailValidator } from "./EmailValidator";
import { Toast } from "./Toast";
import { INITIAL_EMAIL_VALIDATION_RESULT, type EmailValidationResult } from "../types/email";

const MIN_PASSWORD_LENGTH = 8;

const textInputClass =
  "w-full rounded-xl border border-beige-300 bg-white py-2 pl-10 pr-4 text-stone-900 shadow-sm outline-none transition-colors focus:border-forest-600 focus:ring-4 focus:ring-forest-100";

export function SignupForm() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [emailValidation, setEmailValidation] = useState<EmailValidationResult>(
    INITIAL_EMAIL_VALIDATION_RESULT,
  );
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [showSuccessToast, setShowSuccessToast] = useState(false);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!fullName.trim()) {
      setSubmitError("Please enter your full name.");
      return;
    }

    // canSubmit is true for "unreachable" too — that's the fail-open path.
    if (!emailValidation.canSubmit) {
      setSubmitError(
        emailValidation.status === "checking"
          ? "Please wait for email verification to finish."
          : emailValidation.status === "idle"
            ? "Please enter your email address."
            : emailValidation.message,
      );
      return;
    }

    if (password.length < MIN_PASSWORD_LENGTH) {
      setSubmitError(`Password must be at least ${MIN_PASSWORD_LENGTH} characters.`);
      return;
    }
    if (password !== confirmPassword) {
      setSubmitError("Passwords do not match.");
      return;
    }
    if (!agreedToTerms) {
      setSubmitError("Please accept the Terms of Service and Privacy Policy.");
      return;
    }

    // Demo only: no real account is created or persisted.
    setSubmitError(null);
    setShowSuccessToast(true);
  }

  return (
    <div className="relative mx-auto w-full max-w-md">
      <div className="overflow-hidden rounded-2xl border border-beige-200 bg-white shadow-xl shadow-stone-900/10">
        <div className="h-1.5 w-full bg-forest-700" />

        <div className="p-6">
          <div className="mb-4 flex items-center gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-forest-700 text-cream">
              <User className="h-4.5 w-4.5" aria-hidden="true" />
            </span>
            <div>
              <h2 className="font-serif text-xl font-bold tracking-tight text-stone-900">
                Create your account
              </h2>
              <p className="mt-0.5 text-sm text-stone-500">
                Start validating emails in real time — no credit card required.
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-3.5">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="fullName" className="text-sm font-medium text-stone-700">
                Full Name
              </label>
              <div className="relative">
                <User
                  className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-sage-600"
                  aria-hidden="true"
                />
                <input
                  id="fullName"
                  name="fullName"
                  type="text"
                  autoComplete="name"
                  placeholder="Aditya Gupta"
                  value={fullName}
                  onChange={(event) => setFullName(event.target.value)}
                  className={fullName.trim() ? `${textInputClass} pr-10` : textInputClass}
                />
                {fullName.trim() && (
                  <CheckCircle2
                    className="pointer-events-none absolute right-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-forest-600"
                    aria-hidden="true"
                  />
                )}
              </div>
            </div>

            <EmailValidator value={email} onChange={setEmail} onValidationChange={setEmailValidation} />

            <div className="flex flex-col gap-1.5">
              <label htmlFor="password" className="text-sm font-medium text-stone-700">
                Password
              </label>
              <div className="relative">
                <Lock
                  className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-sage-600"
                  aria-hidden="true"
                />
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="new-password"
                  placeholder="********"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  className={`${textInputClass} pr-11`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((visible) => !visible)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  className="absolute inset-y-0 right-0 flex items-center px-3 text-sage-600 hover:text-forest-700"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="confirmPassword" className="text-sm font-medium text-stone-700">
                Confirm Password
              </label>
              <div className="relative">
                <Lock
                  className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-sage-600"
                  aria-hidden="true"
                />
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  autoComplete="new-password"
                  placeholder="********"
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                  className={`${textInputClass} pr-11`}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword((visible) => !visible)}
                  aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                  className="absolute inset-y-0 right-0 flex items-center px-3 text-sage-600 hover:text-forest-700"
                >
                  {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <label className="flex items-start gap-2.5 text-sm text-stone-600">
              <input
                type="checkbox"
                checked={agreedToTerms}
                onChange={(event) => setAgreedToTerms(event.target.checked)}
                className="mt-0.5 h-4 w-4 rounded border-beige-300 accent-forest-700 focus:ring-forest-300"
              />
              <span>
                I agree to the{" "}
                <span className="font-medium text-forest-700 underline decoration-forest-300 underline-offset-2">
                  Terms of Service
                </span>{" "}
                and{" "}
                <span className="font-medium text-forest-700 underline decoration-forest-300 underline-offset-2">
                  Privacy Policy
                </span>
              </span>
            </label>

            {submitError && (
              <p
                role="alert"
                className="flex items-center gap-2 rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700"
              >
                <AlertCircle className="h-4 w-4 shrink-0" aria-hidden="true" />
                {submitError}
              </p>
            )}

            <button
              type="submit"
              className="group flex w-full items-center justify-center gap-2 rounded-xl bg-forest-700 px-4 py-2.5 text-sm font-semibold text-cream shadow-lg shadow-forest-900/20 transition-all hover:-translate-y-0.5 hover:bg-forest-600 hover:shadow-xl hover:shadow-forest-900/25 active:translate-y-0"
            >
              Create Account
              <ArrowRight
                className="h-4 w-4 transition-transform group-hover:translate-x-0.5"
                aria-hidden="true"
              />
            </button>
          </form>

          <div className="my-4 flex items-center gap-3">
            <div className="h-px flex-1 bg-beige-300" />
            <span className="text-xs font-medium uppercase tracking-wide text-stone-400">Or</span>
            <div className="h-px flex-1 bg-beige-300" />
          </div>

          <button
            type="button"
            disabled
            title="Not wired up in this demo — sign up above to try the real flow."
            className="flex w-full cursor-not-allowed items-center justify-center gap-2.5 rounded-xl border border-beige-300 bg-white px-4 py-2.5 text-sm font-semibold text-stone-700 opacity-60"
          >
            <GoogleIcon className="h-4 w-4" />
            Sign up with Google
          </button>

          <p className="mt-4 text-center text-sm text-stone-500">
            Already have an account?{" "}
            <span className="font-medium text-forest-700 underline decoration-forest-300 underline-offset-2">
              Sign in
            </span>
          </p>
        </div>
      </div>

      {showSuccessToast && (
        <Toast message="Account created successfully!" onDismiss={() => setShowSuccessToast(false)} />
      )}
    </div>
  );
}

/** Google's actual brand mark — kept in its real colors, not the app's theme. */
function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M23.52 12.27c0-.79-.07-1.54-.19-2.27H12v4.51h6.44c-.28 1.48-1.13 2.73-2.4 3.58v2.84h3.86c2.26-2.08 3.62-5.33 3.62-8.66Z"
      />
      <path
        fill="#34A853"
        d="M12 24c3.24 0 5.95-1.07 7.93-2.9l-3.86-3c-1.07.72-2.44 1.16-4.07 1.16-3.13 0-5.78-2.11-6.73-4.96H1.28v3.09C3.25 21.3 7.31 24 12 24Z"
      />
      <path
        fill="#FBBC05"
        d="M5.27 14.3c-.25-.72-.38-1.49-.38-2.3s.14-1.58.38-2.3V6.62H1.28A11.96 11.96 0 0 0 0 12c0 1.93.46 3.76 1.28 5.38l3.99-3.08Z"
      />
      <path
        fill="#EA4335"
        d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.94 1.19 15.23 0 12 0 7.31 0 3.25 2.7 1.28 6.62l3.99 3.08C6.22 6.86 8.87 4.75 12 4.75Z"
      />
    </svg>
  );
}

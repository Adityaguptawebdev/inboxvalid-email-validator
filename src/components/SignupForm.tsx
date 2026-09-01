import { useState, type FormEvent } from "react";
import { Eye, EyeOff, AlertCircle } from "lucide-react";
import { EmailValidator } from "./EmailValidator";
import { Toast } from "./Toast";
import { INITIAL_EMAIL_VALIDATION_RESULT, type EmailValidationResult } from "../types/email";

const MIN_PASSWORD_LENGTH = 8;

const textInputClass =
  "w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-slate-900 shadow-sm outline-none transition-colors focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100";

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

    // Locally invalid or explicitly rejected -> block submission. An
    // "unreachable" (network error) result has canSubmit: true, so a
    // failed API call never lands here — that's the fail-open contract.
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
    <div className="mx-auto w-full max-w-md rounded-3xl border border-slate-200 bg-white p-8 shadow-xl shadow-slate-200/50">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-slate-900">Create your account</h2>
        <p className="mt-1 text-sm text-slate-500">
          Start validating emails in real time — no credit card required.
        </p>
      </div>

      <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-5">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="fullName" className="text-sm font-medium text-slate-700">
            Full Name
          </label>
          <input
            id="fullName"
            name="fullName"
            type="text"
            autoComplete="name"
            placeholder="Aditya Gupta"
            value={fullName}
            onChange={(event) => setFullName(event.target.value)}
            className={textInputClass}
          />
        </div>

        <EmailValidator value={email} onChange={setEmail} onValidationChange={setEmailValidation} />

        <div className="flex flex-col gap-1.5">
          <label htmlFor="password" className="text-sm font-medium text-slate-700">
            Password
          </label>
          <div className="relative">
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
              className="absolute inset-y-0 right-0 flex items-center px-3 text-slate-400 hover:text-slate-600"
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="confirmPassword" className="text-sm font-medium text-slate-700">
            Confirm Password
          </label>
          <div className="relative">
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
              className="absolute inset-y-0 right-0 flex items-center px-3 text-slate-400 hover:text-slate-600"
            >
              {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>

        <label className="flex items-start gap-2.5 text-sm text-slate-600">
          <input
            type="checkbox"
            checked={agreedToTerms}
            onChange={(event) => setAgreedToTerms(event.target.checked)}
            className="mt-0.5 h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
          />
          <span>
            I agree to the <span className="font-medium text-indigo-600">Terms of Service</span> and{" "}
            <span className="font-medium text-indigo-600">Privacy Policy</span>
          </span>
        </label>

        {submitError && (
          <p role="alert" className="flex items-center gap-2 rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">
            <AlertCircle className="h-4 w-4 shrink-0" aria-hidden="true" />
            {submitError}
          </p>
        )}

        <button
          type="submit"
          className="w-full rounded-xl bg-indigo-600 px-4 py-3 text-sm font-semibold text-white shadow-sm shadow-indigo-200 transition-colors hover:bg-indigo-700 active:bg-indigo-800"
        >
          Create Account
        </button>
      </form>

      {showSuccessToast && (
        <Toast message="Account created successfully!" onDismiss={() => setShowSuccessToast(false)} />
      )}
    </div>
  );
}

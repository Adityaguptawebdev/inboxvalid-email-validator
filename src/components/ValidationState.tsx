import { CheckCircle2, XCircle, Loader2, Info } from "lucide-react";
import type { EmailValidationResult, EmailValidationStatus } from "../types/email";

interface ValidationStateProps {
  result: EmailValidationResult;
  id?: string;
}

const STATUS_TEXT_CLASS: Record<EmailValidationStatus, string> = {
  idle: "text-slate-400",
  checking: "text-indigo-500",
  valid: "text-emerald-600",
  invalid: "text-red-600",
  unreachable: "text-amber-600",
};

/**
 * Pure presentational mapping from an EmailValidationResult to its visual
 * state. Reused both inside EmailValidator and as a static preview on the
 * marketing panel in App.tsx.
 */
export function ValidationState({ result, id }: ValidationStateProps) {
  const isAlertRole = result.status === "invalid";

  return (
    <p
      id={id}
      role={isAlertRole ? "alert" : "status"}
      className={`flex min-h-5 items-center gap-1.5 text-sm font-medium ${STATUS_TEXT_CLASS[result.status]}`}
    >
      <StatusIcon status={result.status} />
      <span>{result.message}</span>
      {(result.status === "valid" || result.status === "invalid") && (
        <span className="ml-auto shrink-0 text-xs font-semibold uppercase tracking-wide opacity-70">
          {result.status === "valid" ? "Valid" : "Invalid"}
        </span>
      )}
    </p>
  );
}

function StatusIcon({ status }: { status: EmailValidationStatus }) {
  switch (status) {
    case "checking":
      return <Loader2 className="h-4 w-4 shrink-0 animate-spin" aria-hidden="true" />;
    case "valid":
      return <CheckCircle2 className="h-4 w-4 shrink-0" aria-hidden="true" />;
    case "invalid":
      return <XCircle className="h-4 w-4 shrink-0" aria-hidden="true" />;
    case "unreachable":
      return <Info className="h-4 w-4 shrink-0" aria-hidden="true" />;
    case "idle":
      return null;
  }
}

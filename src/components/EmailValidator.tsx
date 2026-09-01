import { useEffect, useId } from "react";
import { Mail, CheckCircle2, XCircle, Loader2, Info } from "lucide-react";
import { useEmailValidation } from "../hooks/useEmailValidation";
import { ValidationState } from "./ValidationState";
import type { EmailValidationResult, EmailValidationStatus } from "../types/email";

export interface EmailValidatorProps {
  value: string;
  onChange: (value: string) => void;
  /** Fired whenever the validation result changes, e.g. to gate a submit button. */
  onValidationChange?: (result: EmailValidationResult) => void;
  id?: string;
  name?: string;
  label?: string;
  placeholder?: string;
  autoFocus?: boolean;
  disabled?: boolean;
}

/**
 * Reusable, embeddable email input: owns the field's markup and delegates
 * the actual three-layer validation pipeline to useEmailValidation, so
 * this component only has to know how to render a result, not compute one.
 */
export function EmailValidator({
  value,
  onChange,
  onValidationChange,
  id,
  name = "email",
  label = "Email Address",
  placeholder = "you@example.com",
  autoFocus,
  disabled,
}: EmailValidatorProps) {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const statusId = `${inputId}-status`;
  const result = useEmailValidation(value);

  useEffect(() => {
    onValidationChange?.(result);
  }, [result, onValidationChange]);

  const borderClass =
    result.status === "invalid"
      ? "border-red-300 focus:border-red-500 focus:ring-red-100"
      : result.status === "valid"
        ? "border-forest-300 focus:border-forest-600 focus:ring-forest-100"
        : "border-beige-300 focus:border-forest-600 focus:ring-forest-100";

  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={inputId} className="text-sm font-medium text-stone-700">
        {label}
      </label>
      <div className="relative">
        <Mail
          className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-sage-600"
          aria-hidden="true"
        />
        <input
          id={inputId}
          name={name}
          type="email"
          inputMode="email"
          autoComplete="email"
          autoFocus={autoFocus}
          disabled={disabled}
          placeholder={placeholder}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          aria-invalid={result.status === "invalid"}
          aria-describedby={statusId}
          className={`w-full rounded-xl border bg-white py-2 pl-10 text-stone-900 shadow-sm outline-none transition-colors focus:ring-4 disabled:cursor-not-allowed disabled:bg-stone-50 disabled:text-stone-400 ${
            result.status === "idle" ? "pr-4" : "pr-10"
          } ${borderClass}`}
        />
        <StatusEndIcon status={result.status} />
      </div>
      <ValidationState id={statusId} result={result} />
    </div>
  );
}

/** Small status icon mirrored inside the input's right edge, next to the mail icon. */
function StatusEndIcon({ status }: { status: EmailValidationStatus }) {
  const baseClass = "pointer-events-none absolute right-3.5 top-1/2 h-4 w-4 -translate-y-1/2";
  switch (status) {
    case "checking":
      return <Loader2 className={`${baseClass} animate-spin text-amber-600`} aria-hidden="true" />;
    case "valid":
      return <CheckCircle2 className={`${baseClass} text-forest-600`} aria-hidden="true" />;
    case "invalid":
      return <XCircle className={`${baseClass} text-red-600`} aria-hidden="true" />;
    case "unreachable":
      return <Info className={`${baseClass} text-amber-700`} aria-hidden="true" />;
    case "idle":
      return null;
  }
}

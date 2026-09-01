import { useEffect, useId } from "react";
import { useEmailValidation } from "../hooks/useEmailValidation";
import { ValidationState } from "./ValidationState";
import type { EmailValidationResult } from "../types/email";

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
        ? "border-emerald-300 focus:border-emerald-500 focus:ring-emerald-100"
        : "border-slate-200 focus:border-indigo-500 focus:ring-indigo-100";

  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={inputId} className="text-sm font-medium text-slate-700">
        {label}
      </label>
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
        className={`w-full rounded-xl border bg-white px-4 py-2.5 text-slate-900 shadow-sm outline-none transition-colors focus:ring-4 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-400 ${borderClass}`}
      />
      <ValidationState id={statusId} result={result} />
    </div>
  );
}

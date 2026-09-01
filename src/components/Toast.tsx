import { useEffect } from "react";
import { CheckCircle2, X } from "lucide-react";

interface ToastProps {
  message: string;
  onDismiss: () => void;
  durationMs?: number;
}

export function Toast({ message, onDismiss, durationMs = 4000 }: ToastProps) {
  useEffect(() => {
    const timer = setTimeout(onDismiss, durationMs);
    return () => clearTimeout(timer);
  }, [onDismiss, durationMs]);

  return (
    <div
      role="status"
      className="animate-fade-in-up mt-4 flex items-center gap-2 rounded-xl bg-forest-800 px-4 py-3 text-sm font-medium text-cream shadow-xl"
    >
      <CheckCircle2 className="h-4 w-4 shrink-0 text-forest-300" aria-hidden="true" />
      <span>{message}</span>
      <button
        type="button"
        onClick={onDismiss}
        aria-label="Dismiss notification"
        className="ml-2 rounded-full p-0.5 text-forest-300 transition-colors hover:bg-white/10 hover:text-cream"
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}

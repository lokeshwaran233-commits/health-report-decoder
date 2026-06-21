import { Link, useRouter } from "@tanstack/react-router";
import { Button } from "@/components/rx/Button";

export interface ErrorBoundaryProps {
  error: Error;
  reset: () => void;
}

export function ErrorBoundary({ error, reset }: ErrorBoundaryProps) {
  const router = useRouter();

  return (
    <div className="min-h-dvh bg-brand-surface flex items-center justify-center px-4 py-16">
      <div className="w-full max-w-md text-center">
        <div className="inline-flex items-center gap-2 justify-center text-brand-teal mb-6">
          <svg
            width="32"
            height="32"
            viewBox="0 0 28 28"
            aria-hidden="true"
          >
            <circle
              cx="14"
              cy="14"
              r="12"
              stroke="currentColor"
              strokeWidth="1.5"
              fill="none"
            />
            <path
              d="M3 14 H9 L11 9 L14 19 L17 12 L19 14 H25"
              stroke="currentColor"
              strokeWidth="1.75"
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="none"
            />
          </svg>
          <span className="text-lg font-semibold text-brand-dark">
            ReportRx
          </span>
        </div>

        <h1 className="text-2xl font-semibold text-brand-dark">
          Something went wrong
        </h1>
        <p className="mt-2 text-sm text-brand-muted">
          We hit an unexpected error rendering this page. Try again — if the
          problem keeps happening, please contact support.
        </p>

        {import.meta.env.DEV && (
          <pre
            className="mt-5 max-h-32 overflow-auto rounded-btn border border-brand-border bg-brand-card p-3 text-left text-xs text-brand-coral font-mono whitespace-pre-wrap break-words"
            role="alert"
            aria-live="polite"
          >
            {error.message || "Unknown error"}
          </pre>
        )}

        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <Link to="/" aria-label="Return to ReportRx home">
            <Button variant="primary" size="md">
              Return to home
            </Button>
          </Link>
          <Button
            variant="ghost"
            size="md"
            onClick={() => {
              void router.invalidate();
              reset();
            }}
          >
            Try again
          </Button>
        </div>
      </div>
    </div>
  );
}

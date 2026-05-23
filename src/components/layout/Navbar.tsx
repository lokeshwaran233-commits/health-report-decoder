import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { Menu, X } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";

function Logo() {
  return (
    <Link
      to="/"
      className="inline-flex items-center gap-2 font-semibold text-brand-dark"
      aria-label="ReportRx home"
    >
      <svg
        width="28"
        height="28"
        viewBox="0 0 28 28"
        aria-hidden="true"
        className="text-brand-teal"
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
      <span className="text-base tracking-tight">ReportRx</span>
    </Link>
  );
}

function scrollToHowItWorks() {
  const el = document.getElementById("how-it-works");
  if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
}

const navLinks = [
  { id: "how-it-works", label: "How it works", scroll: true },
  { id: "privacy", label: "Privacy", scroll: false },
  { id: "about", label: "About", scroll: false },
] as const;

export function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header
      className={cn(
        "fixed top-0 inset-x-0 z-50 bg-white border-b border-brand-border",
      )}
    >
      <div className="mx-auto max-w-6xl h-14 px-4 md:px-6 flex items-center justify-between">
        <Logo />

        <nav
          aria-label="Primary"
          className="hidden md:flex items-center gap-6"
        >
          {navLinks.map((link) =>
            link.scroll ? (
              <button
                key={link.id}
                type="button"
                onClick={scrollToHowItWorks}
                className="text-sm text-brand-muted hover:text-brand-dark transition-colors"
              >
                {link.label}
              </button>
            ) : (
              <span
                key={link.id}
                className="text-sm text-brand-muted cursor-default"
              >
                {link.label}
              </span>
            ),
          )}
        </nav>

        <div className="hidden md:block">
          <Button
            variant="primary"
            size="sm"
            onClick={() =>
              document
                .getElementById("upload-card")
                ?.scrollIntoView({ behavior: "smooth", block: "center" })
            }
          >
            Decode my report
          </Button>
        </div>

        <button
          type="button"
          className="md:hidden inline-flex items-center justify-center h-11 w-11 rounded-btn text-brand-dark"
          aria-label={mobileOpen ? "Close menu" : "Open menu"}
          aria-expanded={mobileOpen}
          aria-controls="mobile-nav"
          onClick={() => setMobileOpen((v) => !v)}
        >
          {mobileOpen ? (
            <X className="h-5 w-5" aria-hidden="true" />
          ) : (
            <Menu className="h-5 w-5" aria-hidden="true" />
          )}
        </button>
      </div>

      {mobileOpen && (
        <div
          id="mobile-nav"
          className="md:hidden border-t border-brand-border bg-white px-4 py-3 flex flex-col gap-2"
        >
          {navLinks.map((link) => (
            <button
              key={link.id}
              type="button"
              onClick={() => {
                setMobileOpen(false);
                if (link.scroll) {
                  // wait a tick so the menu collapses first
                  setTimeout(scrollToHowItWorks, 50);
                }
              }}
              className="text-left text-sm text-brand-dark py-2 min-h-11"
            >
              {link.label}
            </button>
          ))}
          <Button
            variant="primary"
            size="md"
            fullWidth
            onClick={() => {
              setMobileOpen(false);
              setTimeout(() => {
                document
                  .getElementById("upload-card")
                  ?.scrollIntoView({ behavior: "smooth", block: "center" });
              }, 50);
            }}
          >
            Decode my report
          </Button>
        </div>
      )}
    </header>
  );
}

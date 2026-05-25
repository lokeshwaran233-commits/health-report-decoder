import { useEffect, useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Menu, X } from "lucide-react";
import { Button } from "@/components/rx/Button";
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
        <circle cx="14" cy="14" r="12" stroke="currentColor" strokeWidth="1.5" fill="none" />
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

type NavLink =
  | { id: string; label: string; kind: "scroll" }
  | { id: string; label: string; kind: "route"; to: "/history" }
  | { id: string; label: string; kind: "placeholder" };

const navLinks: NavLink[] = [
  { id: "how-it-works", label: "How it works", kind: "scroll" },
  { id: "history", label: "History", kind: "route", to: "/history" },
  { id: "privacy", label: "Privacy", kind: "placeholder" },
  { id: "about", label: "About", kind: "placeholder" },
];

export function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const reduceMotion = useReducedMotion();
  const headerRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 50);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (!mobileOpen) return;
    const onDocClick = (e: MouseEvent) => {
      if (headerRef.current && !headerRef.current.contains(e.target as Node)) {
        setMobileOpen(false);
      }
    };
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, [mobileOpen]);

  const renderDesktopLink = (link: NavLink) => {
    if (link.kind === "scroll") {
      return (
        <button
          key={link.id}
          type="button"
          onClick={scrollToHowItWorks}
          className="text-sm text-brand-muted hover:text-brand-dark transition-colors"
        >
          {link.label}
        </button>
      );
    }
    if (link.kind === "route") {
      return (
        <Link
          key={link.id}
          to={link.to}
          className="text-sm text-brand-muted hover:text-brand-dark transition-colors"
          activeProps={{ className: "text-sm text-brand-dark font-medium" }}
        >
          {link.label}
        </Link>
      );
    }
    return (
      <span key={link.id} className="text-sm text-brand-muted cursor-default">
        {link.label}
      </span>
    );
  };

  const handleMobileNav = (link: NavLink) => {
    setMobileOpen(false);
    if (link.kind === "scroll") setTimeout(scrollToHowItWorks, 50);
  };

  return (
    <header
      ref={headerRef}
      className={cn(
        "fixed top-0 inset-x-0 z-50 backdrop-blur-md transition-all duration-200",
        scrolled
          ? "bg-white/85 border-b border-brand-border shadow-[0_1px_0_rgba(0,0,0,0.04)]"
          : "bg-white/70 border-b border-transparent",
      )}
    >
      <div className="mx-auto max-w-6xl h-14 px-4 md:px-6 flex items-center justify-between">
        <Logo />

        <nav aria-label="Primary" className="hidden md:flex items-center gap-6">
          {navLinks.map(renderDesktopLink)}
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
          {mobileOpen ? <X className="h-5 w-5" aria-hidden="true" /> : <Menu className="h-5 w-5" aria-hidden="true" />}
        </button>
      </div>

      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            id="mobile-nav"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: reduceMotion ? 0 : 0.2 }}
            className="md:hidden overflow-hidden border-t border-brand-border bg-white"
          >
            <div className="px-4 py-3 flex flex-col gap-1">
              {navLinks.map((link) =>
                link.kind === "route" ? (
                  <Link
                    key={link.id}
                    to={link.to}
                    onClick={() => setMobileOpen(false)}
                    className="text-left text-sm text-brand-dark py-2 min-h-11"
                  >
                    {link.label}
                  </Link>
                ) : (
                  <button
                    key={link.id}
                    type="button"
                    onClick={() => handleMobileNav(link)}
                    className="text-left text-sm text-brand-dark py-2 min-h-11"
                  >
                    {link.label}
                  </button>
                ),
              )}
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
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}

export default Navbar;

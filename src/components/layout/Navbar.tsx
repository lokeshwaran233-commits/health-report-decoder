import { useEffect, useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { LogOut, Menu, X } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/rx/Button";
import { AuthModal } from "@/components/auth/AuthModal";
import { LanguageSwitcher } from "@/components/layout/LanguageSwitcher";
import { ThemeToggle } from "@/components/theme/ThemeToggle";
import { useAuth } from "@/hooks/useAuth";
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
  | { id: string; label: string; kind: "route"; to: "/history" | "/scan" | "/zeno" | "/about" | "/privacy" | "/profile" | "/pricing" };

function useNavLinks(): NavLink[] {
  const { t } = useTranslation();
  return [
    { id: "how-it-works", label: t("nav.howItWorks"), kind: "scroll" },
    { id: "scan", label: "Scan Decoder", kind: "route", to: "/scan" },
    { id: "zeno", label: "Zeno AI", kind: "route", to: "/zeno" },
    { id: "pricing", label: "Pricing", kind: "route", to: "/pricing" },
    { id: "history", label: t("nav.history"), kind: "route", to: "/history" },
    { id: "about", label: t("nav.about"), kind: "route", to: "/about" },
    { id: "privacy", label: t("nav.privacy"), kind: "route", to: "/privacy" },
  ];
}

function UserMenu() {
  const { user, signOut } = useAuth();
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);

  if (!user) return null;
  const initial = (user.email ?? "?").charAt(0).toUpperCase();

  return (
    <div className="relative" ref={wrapRef}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label="Account menu"
        aria-expanded={open}
        className="h-9 w-9 rounded-full bg-brand-teal text-white text-sm font-semibold flex items-center justify-center hover:opacity-90 transition-opacity"
      >
        {initial}
      </button>
      {open && (
        <div className="absolute right-0 mt-2 w-56 rounded-card bg-white border border-brand-border shadow-lg py-2 z-50">
          <div className="px-3 py-2 text-xs text-brand-muted truncate">
            {user.email}
          </div>
          <Link
            to="/profile"
            onClick={() => setOpen(false)}
            className="w-full text-left px-3 py-2 text-sm text-brand-dark hover:bg-brand-surface inline-flex items-center gap-2"
          >
            My profile
          </Link>
          <button
            type="button"
            onClick={() => {
              setOpen(false);
              void signOut();
            }}
            className="w-full text-left px-3 py-2 text-sm text-brand-dark hover:bg-brand-surface inline-flex items-center gap-2"
          >
            <LogOut className="h-4 w-4" aria-hidden="true" />
            Sign out
          </button>
        </div>
      )}
    </div>
  );
}

export function Navbar() {
  const { t } = useTranslation();
  const navLinks = useNavLinks();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);
  const [authTab, setAuthTab] = useState<"signin" | "signup">("signin");
  const reduceMotion = useReducedMotion();
  const headerRef = useRef<HTMLElement | null>(null);
  const { user, loading } = useAuth();

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
    return null;
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
      <div className="mx-auto max-w-6xl h-14 px-4 md:px-6 flex items-center justify-between gap-3">
        <Logo />

        <nav aria-label="Primary" className="hidden md:flex items-center gap-6">
          {navLinks.map(renderDesktopLink)}
        </nav>

        <div className="hidden md:flex items-center gap-2">
          <LanguageSwitcher />
          <ThemeToggle />
          {!loading && !user && (
            <>
              <button
                type="button"
                onClick={() => {
                  setAuthTab("signin");
                  setAuthOpen(true);
                }}
                className="text-sm font-medium text-brand-dark hover:text-brand-teal transition-colors px-2"
              >
                {t("nav.signIn")}
              </button>
              <button
                type="button"
                aria-label="Create a free account"
                onClick={() => {
                  setAuthTab("signup");
                  setAuthOpen(true);
                }}
                className="inline-flex items-center justify-center h-9 px-4 rounded-pill border-2 border-brand-teal text-sm font-semibold text-brand-teal bg-white hover:bg-brand-teal hover:text-white transition-colors"
              >
                {t("nav.signUp")}
              </button>
            </>
          )}
          {!loading && user && <UserMenu />}
          <Button
            variant="primary"
            size="sm"
            onClick={() =>
              document
                .getElementById("upload-card")
                ?.scrollIntoView({ behavior: "smooth", block: "center" })
            }
          >
            {t("nav.decodeBtn")}
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
              <div className="py-2 flex items-center gap-2"><LanguageSwitcher /><ThemeToggle /></div>
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
              {!loading && !user && (
                <div className="mt-2 mb-1 rounded-card border border-brand-teal-light bg-brand-teal-light/40 p-3 space-y-2">
                  <p className="text-[12px] text-brand-teal font-medium">
                    New to ReportRx?
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setMobileOpen(false);
                      setAuthTab("signup");
                      setAuthOpen(true);
                    }}
                    className="w-full h-11 rounded-btn bg-brand-teal text-white text-sm font-semibold hover:opacity-90 transition-opacity"
                  >
                    {t("nav.signUp")} — it's free
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setMobileOpen(false);
                      setAuthTab("signin");
                      setAuthOpen(true);
                    }}
                    className="w-full text-center text-[13px] text-brand-teal hover:underline py-1"
                  >
                    Already have an account? {t("nav.signIn")}
                  </button>
                </div>
              )}
              {!loading && user && (
                <button
                  type="button"
                  onClick={async () => {
                    setMobileOpen(false);
                    const { supabase } = await import(
                      "@/integrations/supabase/client"
                    );
                    await supabase.auth.signOut();
                  }}
                  className="text-left text-sm text-brand-dark py-2 min-h-11 inline-flex items-center gap-2"
                >
                  <LogOut className="h-4 w-4" aria-hidden="true" />
                  Sign out ({user.email})
                </button>
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
                {t("nav.decodeBtn")}
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AuthModal open={authOpen} onClose={() => setAuthOpen(false)} initialTab={authTab} />
    </header>
  );
}

export default Navbar;

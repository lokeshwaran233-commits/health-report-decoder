import { useEffect, useState, useCallback, useRef } from "react";
import { AnimatePresence, motion } from "framer-motion";

const STORAGE_KEY = "rrx-splash-seen";

type TargetRect = { top: number; left: number; size: number };

export function SplashIntro() {
  const [visible, setVisible] = useState(false);
  const [exiting, setExiting] = useState(false);
  const [target, setTarget] = useState<TargetRect | null>(null);
  const logoRef = useRef<HTMLDivElement | null>(null);
  const [originRect, setOriginRect] = useState<TargetRect | null>(null);
  const removeTimer = useRef<number | null>(null);

  useEffect(() => {
    try {
      if (sessionStorage.getItem(STORAGE_KEY) !== "1") setVisible(true);
    } catch {
      setVisible(true);
    }
  }, []);

  const dismiss = useCallback(() => {
    if (exiting) return;
    try {
      sessionStorage.setItem(STORAGE_KEY, "1");
    } catch {}
    // Measure origin (current splash logo) and destination (navbar logo).
    if (logoRef.current) {
      const r = logoRef.current.getBoundingClientRect();
      setOriginRect({ top: r.top, left: r.left, size: r.width });
    }
    const navLogo = document.getElementById("rrx-nav-logo");
    if (navLogo) {
      const r = navLogo.getBoundingClientRect();
      setTarget({ top: r.top, left: r.left, size: r.width });
    } else {
      setTarget({ top: 24, left: 24, size: 28 });
    }
    // next frame, kick off the transition
    requestAnimationFrame(() => setExiting(true));
    removeTimer.current = window.setTimeout(() => {
      setVisible(false);
      setExiting(false);
    }, 1100);
  }, [exiting]);

  useEffect(() => {
    return () => {
      if (removeTimer.current) window.clearTimeout(removeTimer.current);
    };
  }, []);

  useEffect(() => {
    if (!visible) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Enter" || e.key === " " || e.key === "Escape") {
        e.preventDefault();
        dismiss();
      }
    };
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [visible, dismiss]);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          key="splash"
          initial={{ opacity: 1 }}
          animate={{ opacity: exiting ? 0 : 1 }}
          transition={{ duration: 0.7, ease: "easeInOut", delay: exiting ? 0.35 : 0 }}
          className="fixed inset-0 z-[100] rrx-splash-bg flex flex-col items-center justify-center overflow-hidden select-none"
          onClick={() => !exiting && dismiss()}
          role="button"
          aria-label="Enter ReportRx"
          tabIndex={0}
          style={{ cursor: exiting ? "default" : "pointer" }}
        >
          {/* Ambient blobs */}
          <div className="rrx-blob rrx-blob-a absolute -top-32 -left-32 w-[520px] h-[520px] rounded-full" />
          <div className="rrx-blob rrx-blob-b absolute -bottom-40 -right-32 w-[600px] h-[600px] rounded-full" />
          <div className="rrx-blob rrx-blob-c absolute top-1/3 left-1/2 w-[420px] h-[420px] rounded-full" />

          {/* ECG sweep line */}
          <svg
            className="absolute inset-x-0 top-1/2 -translate-y-1/2 w-full h-24 opacity-[0.18] pointer-events-none"
            viewBox="0 0 1200 120"
            preserveAspectRatio="none"
            aria-hidden
          >
            <path
              d="M0 60 L260 60 L290 60 L310 30 L330 95 L350 20 L370 75 L390 60 L640 60 L670 60 L690 35 L710 90 L730 25 L750 70 L770 60 L1200 60"
              fill="none"
              stroke="#2dd4a8"
              strokeWidth="1.4"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="rrx-ecg-line"
            />
          </svg>

          {/* Constellation dots */}
          <div className="absolute inset-0 pointer-events-none">
            {Array.from({ length: 36 }).map((_, i) => {
              const top = (i * 113) % 100;
              const left = (i * 197) % 100;
              const delay = (i % 8) * 0.4;
              return (
                <span
                  key={i}
                  className="absolute h-[3px] w-[3px] rounded-full bg-brand-teal/40"
                  style={{
                    top: `${top}%`,
                    left: `${left}%`,
                    animation: `rrx-twinkle 4s ease-in-out ${delay}s infinite`,
                  }}
                />
              );
            })}
          </div>

          {/* Content — everything except the flying logo fades out on exit */}
          <motion.div
            animate={{ opacity: exiting ? 0 : 1, y: exiting ? -10 : 0 }}
            transition={{ duration: 0.35, ease: "easeOut" }}
            className="relative z-10 flex flex-col items-center px-6 text-center"
          >
            <motion.h1
              initial={{ opacity: 0, y: 18, letterSpacing: "0.4em" }}
              animate={{ opacity: 1, y: 0, letterSpacing: "0.08em" }}
              transition={{ duration: 1.1, ease: "easeOut" }}
              className="rrx-wordmark"
              style={{ fontFamily: "Fraunces, Georgia, serif" }}
            >
              ReportRx
            </motion.h1>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6, duration: 0.8 }}
              className="mt-3 text-xs sm:text-sm tracking-[0.35em] uppercase text-brand-teal/80"
            >
              Care, decoded
            </motion.p>

            {/* In-flow placeholder so layout doesn't collapse; flying logo overlays at the same spot */}
            <div
              ref={logoRef}
              className="relative mt-10 sm:mt-14 w-[224px] h-[224px]"
              aria-hidden
            />

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.0, duration: 0.8 }}
              className="mt-10 text-sm sm:text-base text-white/70 max-w-md"
            >
              Your lab report, finally explained.
            </motion.p>

            <motion.button
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.3, duration: 0.6 }}
              onClick={(e) => {
                e.stopPropagation();
                dismiss();
              }}
              disabled={exiting}
              className="rrx-enter-pill mt-7"
            >
              <span className="rrx-enter-dot" />
              Press to enter
            </motion.button>
          </motion.div>

          {/* Flying logo — fixed positioned overlay that travels to navbar */}
          <motion.div
            initial={false}
            animate={
              exiting && target && originRect
                ? {
                    top: target.top,
                    left: target.left,
                    width: target.size,
                    height: target.size,
                  }
                : originRect
                ? {
                    top: originRect.top,
                    left: originRect.left,
                    width: originRect.size,
                    height: originRect.size,
                  }
                : undefined
            }
            transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
            className="pointer-events-none flex items-center justify-center"
            style={{
              position: "fixed",
              zIndex: 30,
              top: originRect?.top,
              left: originRect?.left,
              width: originRect?.size,
              height: originRect?.size,
            }}
          >
            {!exiting && (
              <>
                <span className="rrx-radium-ripple" />
                <span className="rrx-radium-ripple rrx-radium-ripple--late" />
              </>
            )}
            <div
              className={
                exiting
                  ? "w-full h-full flex items-center justify-center transition-shadow duration-700"
                  : "rrx-radium-core w-full h-full flex items-center justify-center"
              }
              style={exiting ? { boxShadow: "none", background: "transparent" } : undefined}
            >
              {exiting ? (
                <svg viewBox="0 0 28 28" className="w-full h-full text-brand-teal" aria-hidden>
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
              ) : (
                <svg viewBox="0 0 64 64" className="w-[58%] h-[58%]" aria-hidden>
                  <defs>
                    <linearGradient id="rrxGlow" x1="0" x2="1" y1="0" y2="1">
                      <stop offset="0%" stopColor="#5be3bf" />
                      <stop offset="100%" stopColor="#2dd4a8" />
                    </linearGradient>
                  </defs>
                  <path
                    d="M20 14h14c7 0 12 4.5 12 11 0 5-3 8.5-7.5 10.2L48 50h-8.5l-8-13H28v13h-8V14zm8 7v9.5h6.5c3.2 0 5.2-1.8 5.2-4.7s-2-4.8-5.2-4.8H28z"
                    fill="url(#rrxGlow)"
                  />
                </svg>
              )}
            </div>
          </motion.div>

          {/* Trust strip */}
          <motion.div
            animate={{ opacity: exiting ? 0 : 1 }}
            transition={{ duration: 0.3 }}
            className="absolute bottom-6 inset-x-0 text-center text-[10px] sm:text-xs tracking-[0.3em] uppercase text-white/35 pointer-events-none"
          >
            Private · Secure · Doctor-ready
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default SplashIntro;

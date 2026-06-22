import { useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";

const DEFAULT_IDLE_MS = 30 * 60 * 1000; // 30 minutes
const DEFAULT_WARN_BEFORE_MS = 2 * 60 * 1000; // warn 2 min before sign-out
const ACTIVITY_EVENTS: (keyof WindowEventMap)[] = [
  "mousemove",
  "mousedown",
  "keydown",
  "scroll",
  "touchstart",
];

/** localStorage flag read by the auth page to display a "session expired" notice. */
export const SESSION_EXPIRED_FLAG = "rx_session_expired";

export interface UseSessionTimeoutOptions {
  enabled: boolean;
  idleMs?: number;
  /** Fire `onWarn` this many ms before sign-out. Set to 0 to disable. */
  warnBeforeMs?: number;
  onWarn?: (msUntilSignout: number) => void;
  onTimeout?: () => void;
}

/**
 * Signs the user out after `idleMs` of inactivity. Fires `onWarn` shortly
 * before the timeout so the UI can show a "you'll be signed out soon" toast.
 * Activity on mouse/keyboard/scroll/touch resets both timers.
 */
export function useSessionTimeout({
  enabled,
  idleMs = DEFAULT_IDLE_MS,
  warnBeforeMs = DEFAULT_WARN_BEFORE_MS,
  onWarn,
  onTimeout,
}: UseSessionTimeoutOptions): void {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const warnRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const onTimeoutRef = useRef(onTimeout);
  const onWarnRef = useRef(onWarn);
  onTimeoutRef.current = onTimeout;
  onWarnRef.current = onWarn;

  useEffect(() => {
    if (!enabled || typeof window === "undefined") return;

    const trigger = async () => {
      try {
        window.localStorage.setItem(SESSION_EXPIRED_FLAG, "1");
      } catch {
        /* ignore */
      }
      try {
        await supabase.auth.signOut();
      } catch {
        /* ignore */
      }
      onTimeoutRef.current?.();
    };

    const reset = () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      if (warnRef.current) clearTimeout(warnRef.current);
      if (warnBeforeMs > 0 && warnBeforeMs < idleMs) {
        warnRef.current = setTimeout(() => {
          onWarnRef.current?.(warnBeforeMs);
        }, idleMs - warnBeforeMs);
      }
      timerRef.current = setTimeout(() => {
        void trigger();
      }, idleMs);
    };

    reset();
    for (const ev of ACTIVITY_EVENTS) {
      window.addEventListener(ev, reset, { passive: true });
    }

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      if (warnRef.current) clearTimeout(warnRef.current);
      for (const ev of ACTIVITY_EVENTS) {
        window.removeEventListener(ev, reset);
      }
    };
  }, [enabled, idleMs, warnBeforeMs]);
}

export default useSessionTimeout;

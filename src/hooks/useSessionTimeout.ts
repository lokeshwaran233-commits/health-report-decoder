import { useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";

const DEFAULT_IDLE_MS = 30 * 60 * 1000; // 30 minutes
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
  onTimeout?: () => void;
}

/**
 * Signs the user out after `idleMs` of inactivity. Activity is detected via
 * mouse, keyboard, scroll, and touch events. A flag is written to
 * localStorage so the next page (e.g. /auth) can show a friendly notice.
 */
export function useSessionTimeout({
  enabled,
  idleMs = DEFAULT_IDLE_MS,
  onTimeout,
}: UseSessionTimeoutOptions): void {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const callbackRef = useRef(onTimeout);
  callbackRef.current = onTimeout;

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
      callbackRef.current?.();
    };

    const reset = () => {
      if (timerRef.current) clearTimeout(timerRef.current);
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
      for (const ev of ACTIVITY_EVENTS) {
        window.removeEventListener(ev, reset);
      }
    };
  }, [enabled, idleMs]);
}

export default useSessionTimeout;

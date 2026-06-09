import { useCallback, useEffect, useState } from "react";

export interface ZenoBus {
  isOpen: boolean;
  preloadedQuery: string | null;
  open: (query?: string) => void;
  close: () => void;
}

export function useZenoEventBus(): ZenoBus {
  const [isOpen, setIsOpen] = useState(false);
  const [preloadedQuery, setPreloadedQuery] = useState<string | null>(null);

  useEffect(() => {
    function handler(e: Event) {
      const detail = (e as CustomEvent<{ query?: string }>).detail;
      setPreloadedQuery(detail?.query ?? null);
      setIsOpen(true);
    }
    window.addEventListener("openZenoWithQuery", handler);
    return () => window.removeEventListener("openZenoWithQuery", handler);
  }, []);

  const open = useCallback((query?: string) => {
    setPreloadedQuery(query ?? null);
    setIsOpen(true);
  }, []);
  const close = useCallback(() => {
    setIsOpen(false);
    setPreloadedQuery(null);
  }, []);

  return { isOpen, preloadedQuery, open, close };
}

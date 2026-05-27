import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
import { SUPPORTED_LANGS, type SupportedLang } from "@/i18n/config";

function normalize(lng: string | undefined): SupportedLang {
  const base = (lng ?? "en").split("-")[0];
  return (SUPPORTED_LANGS as readonly string[]).includes(base)
    ? (base as SupportedLang)
    : "en";
}

export function useLanguage() {
  const { i18n } = useTranslation();
  const [lang, setLangState] = useState<SupportedLang>(() =>
    normalize(i18n.language),
  );

  useEffect(() => {
    const cur = normalize(i18n.language);
    setLangState(cur);
    if (typeof document !== "undefined") {
      document.documentElement.lang = cur;
      document.documentElement.setAttribute("data-lang", cur);
    }
    const onChange = (lng: string) => {
      const next = normalize(lng);
      setLangState(next);
      if (typeof document !== "undefined") {
        document.documentElement.lang = next;
        document.documentElement.setAttribute("data-lang", next);
      }
    };
    i18n.on("languageChanged", onChange);
    return () => i18n.off("languageChanged", onChange);
  }, [i18n]);

  const setLang = useCallback(
    async (next: SupportedLang) => {
      await i18n.changeLanguage(next);
      try {
        localStorage.setItem("reportrx_lang", next);
      } catch {
        /* ignore */
      }
      // Sync to user metadata if signed in (best effort)
      const { data } = await supabase.auth.getSession();
      if (data.session) {
        void supabase.auth.updateUser({ data: { preferred_language: next } });
      }
    },
    [i18n],
  );

  return { lang, setLang };
}

export default useLanguage;

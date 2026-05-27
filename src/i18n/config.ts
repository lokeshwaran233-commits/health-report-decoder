import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";
import en from "./locales/en.json";
import ta from "./locales/ta.json";
import hi from "./locales/hi.json";
import te from "./locales/te.json";

export const SUPPORTED_LANGS = ["en", "ta", "hi", "te"] as const;
export type SupportedLang = (typeof SUPPORTED_LANGS)[number];

export const LANG_LABELS: Record<SupportedLang, { flag: string; name: string }> = {
  en: { flag: "🇬🇧", name: "English" },
  ta: { flag: "🇮🇳", name: "தமிழ்" },
  hi: { flag: "🇮🇳", name: "हिन्दी" },
  te: { flag: "🇮🇳", name: "తెలుగు" },
};

if (!i18n.isInitialized) {
  void i18n
    .use(LanguageDetector)
    .use(initReactI18next)
    .init({
      resources: {
        en: { translation: en },
        ta: { translation: ta },
        hi: { translation: hi },
        te: { translation: te },
      },
      fallbackLng: "en",
      supportedLngs: SUPPORTED_LANGS as unknown as string[],
      interpolation: { escapeValue: false },
      detection: {
        order: ["localStorage", "navigator"],
        lookupLocalStorage: "reportrx_lang",
        caches: ["localStorage"],
      },
    });
}

export default i18n;

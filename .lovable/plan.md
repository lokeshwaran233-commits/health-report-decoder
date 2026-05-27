## Goal

1. Add Google sign-in alongside the existing email/password flow in the auth modal, and surface a clearer sign-up entry point.
2. Implement Phase 4B — Multi-language support (English, Tamil, Hindi, Telugu) for UI strings and AI-generated content.

---

## Part 1 — Google Auth + Sign-up entry

**Provider enablement (server-side)**
- Run `supabase--configure_social_auth` with `providers: ["google"]` (keeps email enabled). This is required — adding the button alone fails with "Unsupported provider".

**AuthModal updates** (`src/components/auth/AuthModal.tsx`)
- Add a "Continue with Google" button at the top of the modal (above the email/password tabs), styled with the Google "G" mark.
- On click, call `lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin })` from `@/integrations/lovable`.
- Add a divider ("or continue with email") between the Google button and the existing tabbed email form.
- Wire all visible strings through `t("auth.*")` (see Part 2).

**Navbar updates** (`src/components/layout/Navbar.tsx`)
- Signed-out state currently shows a single "Sign in" link. Replace with two CTAs: `Sign in` (ghost) + `Sign up` (primary). Both open `AuthModal` with the appropriate initial tab via a new `initialTab?: "signin" | "signup"` prop on the modal.

**Note:** No `/signup` route is added — the modal pattern stays. The user said "sign up page" but the existing pattern is a modal; we'll surface a distinct Sign up button + default the modal to the sign-up tab. If a dedicated route is required, that's a follow-up.

---

## Part 2 — i18n (Phase 4B)

**Dependencies**
- `bun add i18next react-i18next i18next-browser-languagedetector`

**New files**
```
src/i18n/
  config.ts                    # init i18next, register locales, language detector
  locales/
    en.json                    # source of truth (full key set from spec)
    ta.json                    # Tamil — AI-generated translations
    hi.json                    # Hindi — AI-generated translations
    te.json                    # Telugu — AI-generated translations
src/hooks/
  useLanguage.ts               # returns { lang, setLang }, syncs localStorage + supabase user metadata + <html data-lang lang>
src/components/layout/
  LanguageSwitcher.tsx         # pill dropdown (🌐 EN ▾) with 4 options
```

**Init wiring**
- Import `./i18n/config` at the top of `src/router.tsx` so i18n initializes before any route renders.
- `useLanguage` reads `localStorage["reportrx_lang"]` (fallback to browser language detector → `en`); on change, writes localStorage, calls `i18n.changeLanguage`, sets `document.documentElement.lang` + `data-lang`, and (if signed in) `supabase.auth.updateUser({ data: { preferred_language: lang } })`.
- Root `useAuth` effect: when a user signs in, if their `user.user_metadata.preferred_language` exists and differs from current, apply it.

**String migration**
- Replace hardcoded English in: `Navbar`, `LandingPage` / hero, `UploadCard` + `DropZone` + `PasteInput`, `LoadingScreen`, `ResultsHeader`, `BiomarkerCard` (status labels, "Why does this matter?"), `InsightsSection` (summary + questions headings), `ShareModal`, `history.tsx` (incl. empty state + clear-confirm), `AuthModal`, error toasts in `useReportAnalysis`, `MixedContentBanner`. Use `useTranslation()` + `t("group.key")` with interpolation for dynamic values (e.g. file size).

**Language switcher placement**
- Desktop Navbar: between History and the Sign in/up buttons.
- Mobile: first item in the existing menu drawer.

**Fonts & typography** (`src/styles.css`)
- Add `@import url('https://fonts.googleapis.com/css2?family=Noto+Sans+Tamil:wght@400;500;600;700&family=Noto+Sans+Devanagari:wght@400;500;600;700&family=Noto+Sans+Telugu:wght@400;500;600;700&display=swap');`
- Add selectors:
  ```css
  [data-lang="ta"] { font-family: 'Noto Sans Tamil', system-ui, sans-serif; font-size: 15px; line-height: 1.8; }
  [data-lang="hi"] { font-family: 'Noto Sans Devanagari', system-ui, sans-serif; font-size: 15px; line-height: 1.8; }
  [data-lang="te"] { font-family: 'Noto Sans Telugu', system-ui, sans-serif; font-size: 15px; line-height: 1.8; }
  ```

**AI integration** (`src/lib/analyze.functions.ts`)
- Extend `inputSchema` with `language: z.enum(["en","ta","hi","te"]).default("en")` on both variants.
- Add `LANGUAGE_NAMES` map + append the spec's LANGUAGE INSTRUCTION block to `SYSTEM_PROMPT` (interpolate the selected language). Keep biomarker names, units, abbreviations, lab/patient names in English.
- `useReportAnalysis` passes current `i18n.language` when invoking the server fn.

**Out of scope**
- Translating share-page snapshots already created with English content (existing rows stay English; new analyses use the selected language).
- RTL (none of the four langs are RTL).
- Phases 4A polish, 4C audio.

---

## Technical notes

- Translation JSON: I will populate all four locale files in one pass (AI-generated TA/HI/TE), matching the full key set from the spec. The user can refine later — the framework supports hot-swap.
- `LanguageSwitcher` writes to `document.documentElement` so the font/spacing CSS applies globally without re-mounting components.
- Google OAuth uses the Lovable broker (no manual client ID/secret needed).

## Files touched (summary)

Created: `src/i18n/config.ts`, 4 locale JSONs, `src/hooks/useLanguage.ts`, `src/components/layout/LanguageSwitcher.tsx`.
Edited: `AuthModal.tsx`, `Navbar.tsx`, `router.tsx`, `styles.css`, `analyze.functions.ts`, `useReportAnalysis.ts`, `LandingPage.tsx`, `UploadCard.tsx`, `DropZone.tsx`, `PasteInput.tsx`, `LoadingScreen.tsx`, `ResultsHeader.tsx`, `BiomarkerCard.tsx`, `InsightsSection.tsx`, `ShareModal.tsx`, `MixedContentBanner.tsx`, `history.tsx`, `package.json` (deps).
Server: `configure_social_auth` for Google.
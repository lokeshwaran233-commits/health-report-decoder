## Final Build — QR Sharing, Mobile Theme Fix, Multilingual Voice, Tutorial/Demo Modality

Four scoped changes to wrap up the product.

---

### 1. QR Code Sharing Layer (new)

Add a QR code to **ShareModal** and **AudioShareView** so any phone camera can open the recipient's view of the summary or audio.

- Add dependency: `qrcode` (tiny, ~20KB, generates SVG/canvas client-side, no network).
- New component `src/components/share/ShareQRCode.tsx` — renders the share URL as a crisp SVG QR with the app logo in the center, plus a "Download PNG" and "Share image" (Web Share API with `navigator.canShare({ files })` fallback) button.
- Wired into `ShareModal.tsx`: after `ensureSummary()` / `ensureAudio()` returns a token URL, render the QR below the URL box. Same 1-hour TTL inherited from the share token — no backend change.
- Works for both summary share (`/s/$token`) and audio share. Recipient scans → opens existing `s.$token.tsx` route → sees `SharedSummaryView` exactly as before.

### 2. Mobile Dark/Light Mode Fix

Symptom: toggle flips the class but the UI doesn't visibly change on mobile.

Root cause (to verify during build): `ThemeToggle` and most surfaces use hardcoded `bg-white` and `brand-*` tokens that have no `.dark` variant defined in `src/styles.css`. Mobile Safari/Chrome also apply `color-scheme` aggressively, so form controls flip but content panels don't.

Fix:
- Audit `src/styles.css` and add `.dark` overrides for the `--brand-*` CSS variables (surface, border, dark text, muted, hint, card background).
- Replace remaining hardcoded `bg-white` in top-level shells (`Navbar`, `ShareModal`, dropdowns, modals) with `bg-brand-card` token so they respond.
- Ensure `ThemeProvider` writes `color-scheme` early (already does) and add a small inline script in `__root.tsx` `<head>` to apply the saved theme class before first paint (prevents the mobile flash that some users misread as "not working").
- Verify on mobile viewport via session replay / browser screenshot after the change.

### 3. Deep Voice — Reliable Multilingual TTS

Today, language switching for the audio summary is brittle: the language is read from `localStorage` (`rx_audio_lang`) but `LanguageSwitcher` writes to a different key (`useLanguage` hook), and the TTS prompt isn't always rebuilt per-language.

Fix:
- Unify language state: `AudioService.buildScript` and `ShareModal.buildAudioSnapshot` read from the same `useLanguage()` source of truth (not direct `localStorage`).
- Add an inline **Voice & Language picker** inside `ShareModal` audio section and inside `AudioShareView`:
  - Language dropdown: English, Hindi, Tamil, Telugu, Bengali, Marathi, Spanish, French, German, Arabic, Mandarin (already in `i18n/config`).
  - Voice style: Warm / Clinical / Energetic (maps to ElevenLabs voice IDs + `voice_settings`).
  - "Preview 5 seconds" button before generating the full audio.
- Server-side (`audioService` / TTS server fn): pass `language_code` + voice settings explicitly, use `eleven_multilingual_v2` for non-English, `eleven_turbo_v2_5` for English streaming. Surface errors as toasts instead of silent fail.
- Cache generated audio by `(reportId, lang, voice)` hash so re-shares don't re-bill.

### 4. Tutorial & Demo Modality ("How ReportRx Works")

A dedicated, game-tutorial-style page that walks new users through the full pipeline using a real **sample lab report + sample scan**, with Zeno narrating each step.

- New route: `src/routes/tutorial.tsx` (`/tutorial`) — linked from landing CTA ("See how it works") and from the empty-state of `/history`.
- Layout: full-bleed scrollytelling with a left-rail step indicator (Step 1 of 6) and a stage area on the right. On mobile: vertical stepper + sticky "Next" button.
- Six steps, each with rich animated visuals:
  1. **Upload** — sample CBC report PDF appears, drag-drop animation, "we never store raw biomarkers without your consent".
  2. **OCR + Parse** — text extraction highlight, structured biomarkers fly into a table.
  3. **Core Engine Analysis** — biomarkers get tagged Normal / Watch / Flagged with reasoning bubbles.
  4. **UltraGuard Safety Pass** — show the 9 layers as a checklist lighting up (closed-book, evidence link, syndrome cluster, contradiction, confidence, audit). Reinforces trust.
  5. **Zeno Orchestration** — Zeno orb animates, "asks" follow-up questions, suggests doctor questions, generates the plain-English summary. Shown as a fake chat transcript.
  6. **Share / Audio / QR** — final view with sample QR code that scans to a read-only demo page.
- Same flow exists for a scan (X-ray sample): tabs at the top toggle between **Lab Report demo** and **Imaging Scan demo**.
- Built from canned data (no real API calls) so it loads instantly and works offline-ish. Sample data lives in `src/lib/tutorial/sampleData.ts`.
- Add "Try it yourself" CTA on the final step → routes to `/` (upload).

### 5. Final Review & Sign-off Pass

Quick polish sweep alongside the above:
- Verify all routes have unique `head()` metadata (add to `/tutorial`).
- Confirm UltraGuard audit writes are flowing on all 3 surfaces.
- Run security scan one more time; mark intentional findings.
- Smoke-test: signup → upload sample → analyze → share with QR → scan QR on phone → audio playback in 2 languages → tutorial walkthrough → dark/light on mobile.

---

### Technical notes

- **Files created:** `src/components/share/ShareQRCode.tsx`, `src/routes/tutorial.tsx`, `src/components/tutorial/*` (Step components), `src/lib/tutorial/sampleData.ts`, `src/components/share/VoicePicker.tsx`.
- **Files edited:** `src/styles.css` (dark tokens), `src/components/results/ShareModal.tsx`, `src/components/results/AudioShareView.tsx`, `src/components/theme/ThemeToggle.tsx`, `src/routes/__root.tsx` (pre-paint theme script, tutorial nav link), `src/components/layout/Navbar.tsx`, `src/lib/audioService.ts`, audio TTS server fn.
- **Dependencies:** `qrcode` + `@types/qrcode`.
- **No DB migrations.** No new secrets. No schema changes.
- **Out of scope:** payment/auth changes, redesign of existing screens, new AI models.

import type { AnalysisResult } from "@/types/report";

const LANG_CODES: Record<string, string> = {
  en: "en-IN",
  ta: "ta-IN",
  hi: "hi-IN",
  te: "te-IN",
};

const PREFERRED_VOICES: Record<string, string[]> = {
  en: ["Google हिन्दी", "Microsoft Heera", "en-IN", "en-GB"],
  ta: ["ta-IN", "Tamil"],
  hi: ["hi-IN", "Hindi", "Google हिन्दी"],
  te: ["te-IN", "Telugu"],
};

export type AudioState =
  | "idle"
  | "loading"
  | "playing"
  | "paused"
  | "done"
  | "error";

export interface AvailableLanguage {
  code: string;
  label: string;
  available: boolean;
}

const LANGUAGE_LABELS: Array<{ code: string; label: string; voicePattern: string }> = [
  { code: "en", label: "English", voicePattern: "en-IN|en-GB|en-US|en_" },
  { code: "ta", label: "தமிழ்", voicePattern: "ta-|tamil" },
  { code: "hi", label: "हिन्दी", voicePattern: "hi-|hindi" },
  { code: "te", label: "తెలుగు", voicePattern: "te-|telugu" },
];

export class AudioService {
  private utterance: SpeechSynthesisUtterance | null = null;
  private progressInterval: ReturnType<typeof setInterval> | null = null;
  private keepAliveInterval: ReturnType<typeof setInterval> | null = null;
  private startTime = 0;
  private estimatedDurationMs = 0;
  private onStateChange?: (state: AudioState) => void;
  private onProgressUpdate?: (percent: number) => void;

  constructor(callbacks?: {
    onStateChange?: (state: AudioState) => void;
    onProgress?: (percent: number) => void;
  }) {
    this.onStateChange = callbacks?.onStateChange;
    this.onProgressUpdate = callbacks?.onProgress;
  }

  static isSupported(): boolean {
    return typeof window !== "undefined" && "speechSynthesis" in window;
  }

  private getVoice(language: string): SpeechSynthesisVoice | null {
    if (!AudioService.isSupported()) return null;
    const voices = window.speechSynthesis.getVoices();
    const preferred = PREFERRED_VOICES[language] ?? [];

    for (const pref of preferred) {
      const match = voices.find(
        (v) => v.lang.includes(pref) || v.name.includes(pref),
      );
      if (match) return match;
    }

    const langCode = LANG_CODES[language] ?? "en-IN";
    return (
      voices.find((v) => v.lang.startsWith(langCode.split("-")[0])) ?? null
    );
  }

  speak(text: string, language: string): void {
    this.stop();

    if (!AudioService.isSupported()) {
      this.onStateChange?.("error");
      return;
    }

    this.onStateChange?.("loading");

    const startSpeech = () => {
      this.utterance = new SpeechSynthesisUtterance(text);
      this.utterance.lang = LANG_CODES[language] ?? "en-IN";
      this.utterance.rate = 0.88;
      this.utterance.pitch = 1.0;
      this.utterance.volume = 1.0;

      const voice = this.getVoice(language);
      if (voice) this.utterance.voice = voice;

      const wordCount = text.split(/\s+/).filter(Boolean).length;
      this.estimatedDurationMs = Math.max(1500, (wordCount / 2.5) * 1000);
      this.startTime = Date.now();

      this.progressInterval = setInterval(() => {
        const elapsed = Date.now() - this.startTime;
        const progress = Math.min(
          (elapsed / this.estimatedDurationMs) * 100,
          99,
        );
        this.onProgressUpdate?.(progress);
      }, 200);

      // Chrome bug workaround: speech stops after ~15s. Ping every 14s.
      this.keepAliveInterval = setInterval(() => {
        if (
          window.speechSynthesis.speaking &&
          !window.speechSynthesis.paused
        ) {
          window.speechSynthesis.pause();
          window.speechSynthesis.resume();
        }
      }, 14000);

      this.utterance.onstart = () => this.onStateChange?.("playing");

      this.utterance.onend = () => {
        this.clearTimers();
        this.onProgressUpdate?.(100);
        this.onStateChange?.("done");
      };

      this.utterance.onerror = (e) => {
        this.clearTimers();
        // 'interrupted' / 'canceled' are not real errors — user stopped it.
        const err = (e as SpeechSynthesisErrorEvent).error;
        if (err !== "interrupted" && err !== "canceled") {
          this.onStateChange?.("error");
        }
      };

      window.speechSynthesis.speak(this.utterance);
      this.onStateChange?.("playing");
    };

    if (window.speechSynthesis.getVoices().length === 0) {
      const handler = () => {
        window.speechSynthesis.removeEventListener("voiceschanged", handler);
        startSpeech();
      };
      window.speechSynthesis.addEventListener("voiceschanged", handler);
      // Some browsers never fire voiceschanged — start anyway after small delay.
      setTimeout(() => {
        if (!this.utterance) startSpeech();
      }, 250);
    } else {
      startSpeech();
    }
  }

  pause(): void {
    if (!AudioService.isSupported()) return;
    window.speechSynthesis.pause();
    this.onStateChange?.("paused");
  }

  resume(): void {
    if (!AudioService.isSupported()) return;
    window.speechSynthesis.resume();
    this.onStateChange?.("playing");
  }

  stop(): void {
    this.clearTimers();
    if (AudioService.isSupported()) {
      window.speechSynthesis.cancel();
    }
    this.utterance = null;
    this.onStateChange?.("idle");
  }

  private clearTimers(): void {
    if (this.progressInterval) {
      clearInterval(this.progressInterval);
      this.progressInterval = null;
    }
    if (this.keepAliveInterval) {
      clearInterval(this.keepAliveInterval);
      this.keepAliveInterval = null;
    }
  }

  static getAvailableLanguages(): AvailableLanguage[] {
    if (!AudioService.isSupported()) {
      return LANGUAGE_LABELS.map((l) => ({
        code: l.code,
        label: l.label,
        available: false,
      }));
    }
    const voices = window.speechSynthesis.getVoices();
    return LANGUAGE_LABELS.map((l) => ({
      code: l.code,
      label: l.label,
      available: voices.some((v) =>
        new RegExp(l.voicePattern, "i").test(v.lang + " " + v.name),
      ),
    }));
  }

  /** Build the full spoken script from an AnalysisResult. */
  static buildScript(result: AnalysisResult, _language: string): string {
    const flaggedCount = result.biomarkers.filter(
      (b) => b.status === "flagged",
    ).length;
    const watchCount = result.biomarkers.filter(
      (b) => b.status === "watch",
    ).length;
    const normalCount = result.biomarkers.filter(
      (b) => b.status === "normal",
    ).length;
    const totalCount = result.biomarkers.length;

    const sections: string[] = [
      `ReportRx health summary${result.metadata.patientName ? ` for ${result.metadata.patientName}` : ""}.`,
      `Report from ${result.metadata.labName ?? "your laboratory"}, dated ${result.metadata.reportDate ?? "recently"}.`,
      `Out of ${totalCount} tests analysed: ${normalCount} are normal.`,
      watchCount > 0
        ? `${watchCount} value${watchCount > 1 ? "s" : ""} need${watchCount === 1 ? "s" : ""} watching.`
        : "",
      flaggedCount > 0
        ? `${flaggedCount} value${flaggedCount > 1 ? "s are" : " is"} flagged and may need attention.`
        : "",
      "",
      result.summary,
      "",
      result.doctorQuestions.length > 0
        ? `Here are ${result.doctorQuestions.length} questions to discuss with your doctor.`
        : "",
      ...result.doctorQuestions.map((q, i) => `Question ${i + 1}: ${q}`),
      "",
      "This summary is for information only. Always follow your doctor's advice.",
    ];

    return sections.filter(Boolean).join(" ");
  }
}

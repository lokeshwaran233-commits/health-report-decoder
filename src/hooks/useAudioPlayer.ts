import { useEffect, useMemo, useRef, useState } from "react";
import { AudioService, type AudioState } from "@/lib/audioService";
import type { AnalysisResult } from "@/types/report";

const LANG_STORAGE_KEY = "rx_audio_lang";

interface UseAudioPlayerArgs {
  result?: AnalysisResult | null;
  /** Pre-built script (overrides result-derived script — used for share view). */
  script?: string;
  /** Pre-set language (used for share view). */
  initialLanguage?: string;
}

export function useAudioPlayer({
  result = null,
  script: providedScript,
  initialLanguage,
}: UseAudioPlayerArgs = {}) {
  const [state, setState] = useState<AudioState>("idle");
  const [progress, setProgress] = useState(0);
  const [language, setLanguage] = useState<string>(() => {
    if (initialLanguage) return initialLanguage;
    if (typeof window === "undefined") return "en";
    return localStorage.getItem(LANG_STORAGE_KEY) ?? "en";
  });
  const serviceRef = useRef<AudioService | null>(null);

  // Stable callbacks via ref pattern
  useEffect(() => {
    serviceRef.current = new AudioService({
      onStateChange: setState,
      onProgress: setProgress,
    });
    return () => {
      serviceRef.current?.stop();
      serviceRef.current = null;
    };
  }, []);

  const script = useMemo(() => {
    if (providedScript) return providedScript;
    if (result) return AudioService.buildScript(result, language);
    return "";
  }, [providedScript, result, language]);

  const play = () => {
    if (!script) return;
    if (state === "paused") {
      serviceRef.current?.resume();
      return;
    }
    setProgress(0);
    serviceRef.current?.speak(script, language);
  };

  const pause = () => serviceRef.current?.pause();

  const stop = () => {
    serviceRef.current?.stop();
    setProgress(0);
  };

  const changeLanguage = (lang: string) => {
    serviceRef.current?.stop();
    setProgress(0);
    setLanguage(lang);
    if (typeof window !== "undefined") {
      localStorage.setItem(LANG_STORAGE_KEY, lang);
    }
  };

  return {
    state,
    progress,
    language,
    script,
    changeLanguage,
    play,
    pause,
    stop,
    isSupported: AudioService.isSupported(),
  };
}

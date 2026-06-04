import { useEffect, useRef, useState } from "react";
import {
  ChevronDown,
  Pause,
  Play,
  RotateCcw,
  Square,
  Volume2,
  VolumeX,
} from "lucide-react";
import { useAudioPlayer } from "@/hooks/useAudioPlayer";
import { AudioService, type AvailableLanguage } from "@/lib/audioService";
import { WaveformVisualizer } from "./WaveformVisualizer";
import type { AnalysisResult } from "@/types/report";

interface AudioPlayerProps {
  result: AnalysisResult;
}

export function AudioPlayer({ result }: AudioPlayerProps) {
  const { state, progress, language, changeLanguage, play, pause, stop, isSupported } =
    useAudioPlayer({ result });
  const [languages, setLanguages] = useState<AvailableLanguage[]>([]);
  const [langOpen, setLangOpen] = useState(false);
  const langRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const refresh = () => setLanguages(AudioService.getAvailableLanguages());
    refresh();
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.addEventListener("voiceschanged", refresh);
      return () =>
        window.speechSynthesis.removeEventListener("voiceschanged", refresh);
    }
  }, []);

  useEffect(() => {
    if (!langOpen) return;
    const onDoc = (e: MouseEvent) => {
      if (langRef.current && !langRef.current.contains(e.target as Node)) {
        setLangOpen(false);
      }
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [langOpen]);

  if (!isSupported) {
    return (
      <div className="rounded-card border border-dashed border-brand-border bg-brand-surface p-4 flex items-center gap-3">
        <VolumeX className="h-5 w-5 text-brand-muted shrink-0" aria-hidden="true" />
        <p className="text-sm text-brand-muted">
          Audio playback isn't supported in this browser. Try Chrome or Safari.
        </p>
      </div>
    );
  }

  const currentLang = languages.find((l) => l.code === language);
  const statusText = (() => {
    switch (state) {
      case "loading":
        return "Preparing audio…";
      case "playing":
        return "Playing summary…";
      case "paused":
        return "Paused";
      case "done":
        return "Finished — listen again?";
      case "error":
        return "Audio not available in this browser.";
      default:
        return "Listen to your summary";
    }
  })();

  const isPlaying = state === "playing";
  const isPaused = state === "paused";
  const isDone = state === "done";

  return (
    <div
      role="region"
      aria-label="Audio summary player"
      className="rounded-card border border-[#0F6E56] bg-[#111827] p-4 sm:p-5 flex flex-col gap-3"
    >
      <div className="flex items-center gap-3 sm:gap-4">
        <div className="shrink-0">
          <WaveformVisualizer
            playing={isPlaying}
            variant={state === "error" ? "error" : isDone ? "done" : "default"}
          />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <Volume2 className="h-4 w-4 text-[#00D9A3] shrink-0" aria-hidden="true" />
            <p className="text-sm font-medium text-white truncate">
              {statusText}
            </p>
          </div>
          <span aria-live="polite" className="sr-only">
            {state === "playing"
              ? "Playing"
              : state === "paused"
                ? "Paused"
                : state === "done"
                  ? "Finished"
                  : ""}
          </span>
        </div>

        {/* Language selector */}
        <div className="relative" ref={langRef}>
          <button
            type="button"
            onClick={() => setLangOpen((v) => !v)}
            className="inline-flex items-center gap-1 rounded-pill bg-[#0A0E1A] border border-[#1E2D42] px-2.5 py-1 text-xs font-medium text-white/80 hover:border-[#0F6E56] transition-colors"
            aria-label={`Language: ${currentLang?.label ?? language}`}
            aria-expanded={langOpen}
          >
            <span>{currentLang?.label ?? language.toUpperCase()}</span>
            <ChevronDown className="h-3 w-3" aria-hidden="true" />
          </button>
          {langOpen && (
            <div className="absolute right-0 top-full mt-1 min-w-[140px] rounded-xl bg-[#111827] border border-[#1E2D42] shadow-xl py-1 z-20">
              {languages.map((l) => (
                <button
                  key={l.code}
                  type="button"
                  disabled={!l.available}
                  onClick={() => {
                    if (!l.available) return;
                    changeLanguage(l.code);
                    setLangOpen(false);
                  }}
                  title={
                    l.available
                      ? undefined
                      : "Install this voice in your device settings to enable"
                  }
                  className={`w-full text-left px-3 py-2 text-xs flex items-center justify-between gap-2 ${
                    l.available
                      ? "text-white/90 hover:bg-[#1A2235]"
                      : "text-white/30 cursor-not-allowed"
                  } ${l.code === language ? "bg-[#0D4A3A]/40" : ""}`}
                >
                  <span>{l.label}</span>
                  {!l.available && (
                    <span className="text-[10px] uppercase tracking-wide">
                      n/a
                    </span>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Controls */}
        <div className="flex items-center gap-1.5 shrink-0">
          {isPlaying ? (
            <button
              type="button"
              onClick={pause}
              aria-label="Pause audio"
              className="h-9 w-9 inline-flex items-center justify-center rounded-full bg-[#00D9A3] text-[#0A0E1A] hover:opacity-90"
            >
              <Pause className="h-4 w-4" aria-hidden="true" />
            </button>
          ) : isDone ? (
            <button
              type="button"
              onClick={play}
              aria-label="Play summary again"
              className="h-9 w-9 inline-flex items-center justify-center rounded-full bg-[#00D9A3] text-[#0A0E1A] hover:opacity-90"
            >
              <RotateCcw className="h-4 w-4" aria-hidden="true" />
            </button>
          ) : (
            <button
              type="button"
              onClick={play}
              disabled={state === "loading"}
              aria-label={isPaused ? "Resume audio" : "Play audio summary"}
              className="h-9 w-9 inline-flex items-center justify-center rounded-full bg-[#00D9A3] text-[#0A0E1A] hover:opacity-90 disabled:opacity-50"
            >
              <Play className="h-4 w-4" aria-hidden="true" />
            </button>
          )}
          {(isPlaying || isPaused) && (
            <button
              type="button"
              onClick={stop}
              aria-label="Stop audio"
              className="h-9 w-9 inline-flex items-center justify-center rounded-full bg-[#1A2235] text-white/80 hover:bg-[#243047]"
            >
              <Square className="h-3.5 w-3.5" aria-hidden="true" />
            </button>
          )}
        </div>
      </div>

      {/* Progress */}
      <div className="flex items-center gap-3">
        <div
          className="flex-1 h-[3px] rounded-[2px] bg-[#1E2D42] overflow-hidden"
          role="progressbar"
          aria-valuenow={Math.round(progress)}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label="Playback progress"
        >
          <div
            className="h-full transition-[width] duration-200 ease-linear"
            style={{
              width: `${progress}%`,
              background: "linear-gradient(90deg, #0F6E56, #00D9A3)",
            }}
          />
        </div>
        <span className="text-[11px] font-mono text-[#8B9BAE] tabular-nums shrink-0 w-9 text-right">
          {Math.round(progress)}%
        </span>
      </div>
    </div>
  );
}

export default AudioPlayer;

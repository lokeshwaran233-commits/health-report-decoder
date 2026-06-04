import { useEffect, useMemo, useState } from "react";
import { Clock, Pause, Play, RotateCcw } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { useAudioPlayer } from "@/hooks/useAudioPlayer";
import type { AudioShareSnapshot } from "@/lib/share.functions";

interface AudioShareViewProps {
  snapshot: AudioShareSnapshot;
  expiresAt: string;
}

function useCountdown(target: string) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 30 * 1000);
    return () => clearInterval(t);
  }, []);
  const remainingMs = new Date(target).getTime() - now;
  const expired = remainingMs <= 0;
  const minutes = Math.max(0, Math.floor(remainingMs / 60000));
  return { expired, minutes };
}

export function AudioShareView({ snapshot, expiresAt }: AudioShareViewProps) {
  const { state, progress, play, pause, isSupported } = useAudioPlayer({
    script: snapshot.summaryText,
    initialLanguage: snapshot.language,
  });
  const { expired, minutes } = useCountdown(expiresAt);

  const estimate = useMemo(() => {
    const words = snapshot.summaryText.split(/\s+/).filter(Boolean).length;
    const minutesEst = Math.max(1, Math.round(words / 150));
    return `About ${minutesEst} min`;
  }, [snapshot.summaryText]);

  const isPlaying = state === "playing";
  const isDone = state === "done";

  if (expired) {
    return (
      <div className="min-h-dvh bg-[#0A0E1A] flex items-center justify-center px-4">
        <div className="max-w-sm text-center">
          <Clock className="mx-auto h-12 w-12 text-amber-500" aria-hidden="true" />
          <h1 className="mt-4 text-xl font-medium text-white" style={{ fontFamily: "Fraunces, serif" }}>
            This audio link has expired
          </h1>
          <p className="mt-2 text-sm text-[#8B9BAE]">
            Ask the sender to share a new link.
          </p>
          <Link
            to="/"
            className="mt-6 inline-block text-sm text-[#00D9A3] hover:underline"
          >
            ReportRx
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-dvh bg-[#0A0E1A] flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-[400px] text-center">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-white"
          aria-label="ReportRx home"
        >
          <span
            className="inline-flex items-center justify-center h-8 w-8 rounded-pill bg-[#00D9A3] text-[#0A0E1A] text-xs font-bold"
          >
            Rx
          </span>
          <span className="text-sm font-semibold tracking-tight">ReportRx</span>
        </Link>

        <div className="mt-10 space-y-1">
          <p className="text-[15px] text-[#8B9BAE]">
            Health summary shared by{" "}
            <span className="text-white/90">
              {snapshot.metadata.patientName ?? "someone"}
            </span>
          </p>
          {snapshot.metadata.reportDate && (
            <p className="text-[13px] text-[#4A5568]">
              {snapshot.metadata.reportDate}
            </p>
          )}
        </div>

        <div className="mt-8 flex flex-col items-center">
          <button
            type="button"
            onClick={isPlaying ? pause : play}
            disabled={!isSupported || state === "loading"}
            aria-label={isPlaying ? "Pause audio summary" : "Play audio summary"}
            className="relative h-[88px] w-[88px] rounded-full flex items-center justify-center text-white transition-transform active:scale-95 disabled:opacity-50"
            style={{
              background:
                "linear-gradient(135deg, #0F6E56 0%, #00D9A3 100%)",
              boxShadow: "0 0 40px rgba(0,217,163,0.35)",
            }}
          >
            {isPlaying ? (
              <>
                <span
                  className="absolute inset-0 rounded-full border-2 border-[#00D9A3] animate-ping"
                  aria-hidden="true"
                />
                <Pause className="h-7 w-7" aria-hidden="true" />
              </>
            ) : isDone ? (
              <RotateCcw className="h-7 w-7" aria-hidden="true" />
            ) : (
              <Play className="h-7 w-7 ml-1" aria-hidden="true" />
            )}
          </button>
          <span className="mt-3 text-sm font-medium text-[#00D9A3]">
            {isPlaying ? "Playing" : isDone ? "Tap to replay" : "Tap to listen"}
          </span>
        </div>

        <div className="mt-5 space-y-1.5">
          <div
            className="h-[3px] rounded-[2px] bg-[#1E2D42] overflow-hidden"
            role="progressbar"
            aria-valuenow={Math.round(progress)}
            aria-valuemin={0}
            aria-valuemax={100}
          >
            <div
              className="h-full transition-[width] duration-200 ease-linear"
              style={{
                width: `${progress}%`,
                background: "linear-gradient(90deg, #0F6E56, #00D9A3)",
              }}
            />
          </div>
          <p className="text-[12px] text-[#4A5568]">{estimate}</p>
        </div>

        <div className="mt-5">
          <span
            className="inline-flex items-center gap-1.5 rounded-pill bg-[#1A1200] border border-amber-600/60 px-3.5 py-1.5 text-[12px] text-amber-400"
          >
            <Clock className="h-3 w-3" aria-hidden="true" />
            {minutes <= 1
              ? "Expires in less than a minute"
              : `Expires in ${minutes} minutes`}
          </span>
        </div>

        {!isSupported && (
          <p className="mt-5 text-xs text-[#8B9BAE]">
            Audio playback isn't supported in this browser. Try Chrome or Safari.
          </p>
        )}

        <a
          href="/"
          className="mt-8 inline-block text-[13px] text-[#4A5568] hover:text-[#8B9BAE] hover:underline"
        >
          Want your own analysis? →
        </a>
      </div>
    </div>
  );
}

export default AudioShareView;

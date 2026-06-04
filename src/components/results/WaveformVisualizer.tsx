import { useEffect, useRef, useState } from "react";

interface WaveformVisualizerProps {
  playing: boolean;
  /** done shows all bars full; error shows red */
  variant?: "default" | "done" | "error";
}

const BAR_COUNT = 24;

export function WaveformVisualizer({
  playing,
  variant = "default",
}: WaveformVisualizerProps) {
  const [heights, setHeights] = useState<number[]>(() =>
    Array.from({ length: BAR_COUNT }, (_, i) => 20 + Math.sin(i * 0.8) * 15),
  );
  const frameRef = useRef<number | null>(null);
  const offsetRef = useRef(0);

  useEffect(() => {
    if (!playing) {
      setHeights(
        Array.from({ length: BAR_COUNT }, (_, i) => 20 + Math.sin(i * 0.8) * 15),
      );
      return;
    }

    const animate = () => {
      offsetRef.current += 0.08;
      setHeights(
        Array.from({ length: BAR_COUNT }, (_, i) => {
          const base = Math.sin(i * 0.5 + offsetRef.current) * 30;
          const noise = Math.sin(i * 1.3 + offsetRef.current * 2.1) * 12;
          return Math.max(4, Math.min(48, 28 + base + noise));
        }),
      );
      frameRef.current = requestAnimationFrame(animate);
    };

    frameRef.current = requestAnimationFrame(animate);
    return () => {
      if (frameRef.current !== null) cancelAnimationFrame(frameRef.current);
    };
  }, [playing]);

  const colorFor = (h: number) => {
    if (variant === "error") return "rgba(239, 68, 68, 0.75)";
    if (variant === "done") return "rgba(0, 217, 163, 0.85)";
    return playing
      ? `rgba(0, 217, 163, ${0.4 + (h / 48) * 0.6})`
      : "rgba(139, 155, 174, 0.4)";
  };

  return (
    <div
      className="flex items-center gap-[2px] h-[52px]"
      role="presentation"
      aria-hidden="true"
    >
      {heights.map((h, i) => (
        <div
          key={i}
          style={{
            height: `${variant === "done" ? 40 : h}px`,
            width: "3px",
            background: colorFor(h),
            borderRadius: "2px",
            transition: playing ? "none" : "height 0.5s ease",
          }}
        />
      ))}
    </div>
  );
}

export default WaveformVisualizer;

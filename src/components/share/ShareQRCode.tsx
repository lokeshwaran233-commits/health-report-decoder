import { useEffect, useRef, useState } from "react";
import QRCode from "qrcode";
import { Download, Share2 } from "lucide-react";
import { toast } from "sonner";

interface ShareQRCodeProps {
  url: string;
  label?: string;
  size?: number;
}

/**
 * Renders the given share URL as a scannable QR code.
 * Anyone with a phone camera can scan it to open the shared summary.
 */
export function ShareQRCode({ url, label = "Scan to view", size = 180 }: ShareQRCodeProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [dataUrl, setDataUrl] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    if (!canvasRef.current) return;
    QRCode.toCanvas(canvasRef.current, url, {
      width: size,
      margin: 1,
      errorCorrectionLevel: "M",
      color: { dark: "#0f6e56", light: "#ffffff" },
    }).catch(() => {
      /* swallowed */
    });
    QRCode.toDataURL(url, {
      width: size * 2,
      margin: 2,
      errorCorrectionLevel: "M",
      color: { dark: "#0f6e56", light: "#ffffff" },
    })
      .then((u) => {
        if (!cancelled) setDataUrl(u);
      })
      .catch(() => {
        /* ignore */
      });
    return () => {
      cancelled = true;
    };
  }, [url, size]);

  const download = () => {
    if (!dataUrl) return;
    const a = document.createElement("a");
    a.href = dataUrl;
    a.download = "reportrx-share-qr.png";
    document.body.appendChild(a);
    a.click();
    a.remove();
  };

  const shareImage = async () => {
    if (!dataUrl) return;
    try {
      const res = await fetch(dataUrl);
      const blob = await res.blob();
      const file = new File([blob], "reportrx-share-qr.png", { type: "image/png" });
      const nav = navigator as Navigator & {
        canShare?: (data: { files: File[] }) => boolean;
        share?: (data: { files: File[]; title?: string; text?: string }) => Promise<void>;
      };
      if (nav.canShare?.({ files: [file] }) && nav.share) {
        await nav.share({
          files: [file],
          title: "My ReportRx summary",
          text: "Scan this QR code to view my health summary",
        });
      } else {
        download();
        toast.success("QR code downloaded");
      }
    } catch (err) {
      if ((err as Error)?.name !== "AbortError") {
        toast.error("Couldn't share QR code");
      }
    }
  };

  return (
    <div className="rounded-card border border-brand-border bg-brand-card p-3 flex flex-col items-center gap-2">
      <canvas
        ref={canvasRef}
        aria-label={`QR code for ${url}`}
        className="rounded-md"
        width={size}
        height={size}
      />
      <p className="text-xs text-brand-muted text-center">{label}</p>
      <div className="flex gap-2 w-full">
        <button
          type="button"
          onClick={download}
          className="flex-1 inline-flex items-center justify-center gap-1.5 h-9 rounded-btn border border-brand-border text-xs font-medium text-brand-dark hover:bg-brand-surface transition-colors"
        >
          <Download className="h-3.5 w-3.5" aria-hidden="true" />
          Download
        </button>
        <button
          type="button"
          onClick={shareImage}
          className="flex-1 inline-flex items-center justify-center gap-1.5 h-9 rounded-btn bg-brand-teal text-white text-xs font-medium hover:opacity-90 transition-opacity"
        >
          <Share2 className="h-3.5 w-3.5" aria-hidden="true" />
          Share
        </button>
      </div>
    </div>
  );
}

export default ShareQRCode;

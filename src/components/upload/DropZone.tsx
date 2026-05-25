import { useRef, type DragEvent, type KeyboardEvent } from "react";
import { Upload } from "lucide-react";
import { Button } from "@/components/rx/Button";
import { Badge } from "@/components/rx/Badge";
import { cn } from "@/lib/utils";

export interface DropZoneProps {
  isDragging: boolean;
  setIsDragging: (v: boolean) => void;
  onFiles: (files: FileList | File[]) => void;
  onFileInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onLoadSample: () => void;
}

export function DropZone({
  isDragging,
  setIsDragging,
  onFiles,
  onFileInputChange,
  onLoadSample,
}: DropZoneProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  const openPicker = () => inputRef.current?.click();

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      onFiles(e.dataTransfer.files);
    }
  };

  const handleKey = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      openPicker();
    }
  };

  return (
    <div
      role="button"
      tabIndex={0}
      aria-label="Upload your lab report"
      onClick={openPicker}
      onKeyDown={handleKey}
      onDragOver={handleDragOver}
      onDragEnter={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      style={{
        backgroundColor: isDragging
          ? "rgba(15,110,86,0.12)"
          : "rgba(15,110,86,0.06)",
        borderColor: "#1D9E75",
        borderStyle: isDragging ? "solid" : "dashed",
        borderWidth: "1.5px",
      }}
      className={cn(
        "rounded-card transition-[background-color,border-color,border-style] duration-200 cursor-pointer",
        "px-5 py-8 md:px-10 md:py-12 flex flex-col items-center text-center",
        "hover:!bg-[rgba(15,110,86,0.10)] hover:!border-solid",
      )}
    >
      <div
        className="h-13 w-13 rounded-card bg-brand-teal-light flex items-center justify-center mb-4 animate-[rxpulse_2s_ease-in-out_infinite]"
        style={{ height: 52, width: 52 }}
      >
        <Upload className="h-6 w-6 text-brand-teal" aria-hidden="true" />
      </div>
      <h3 className="text-base font-semibold text-brand-dark">
        Drop your lab report here
      </h3>
      <p className="mt-1 text-sm text-brand-muted">
        Drag and drop, or browse to upload
      </p>

      <div className="mt-4 flex flex-wrap items-center justify-center gap-1.5">
        <Badge label="PDF" />
        <Badge label="JPG" />
        <Badge label="PNG" />
        <Badge label="Max 10 MB" />
      </div>

      <div className="my-5 flex items-center w-full max-w-[260px] gap-3 text-brand-hint text-xs">
        <span className="h-px flex-1 bg-brand-border" />
        <span>or</span>
        <span className="h-px flex-1 bg-brand-border" />
      </div>

      <Button
        variant="primary"
        size="md"
        className="w-full max-w-[220px]"
        onClick={(e) => {
          e.stopPropagation();
          openPicker();
        }}
      >
        Browse files
      </Button>

      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onLoadSample();
        }}
        className="mt-4 text-[13px] text-brand-teal font-medium hover:underline min-h-11 px-2"
      >
        Try with a sample CBC report →
      </button>

      <input
        ref={inputRef}
        type="file"
        accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png"
        className="hidden"
        onChange={onFileInputChange}
        aria-label="Choose a lab report file"
      />
    </div>
  );
}

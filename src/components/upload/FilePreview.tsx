import { motion } from "framer-motion";
import { ArrowRight, CheckCircle2, FileText, Image as ImageIcon, Trash2 } from "lucide-react";
import { Button } from "@/components/rx/Button";
import { formatFileSize } from "@/lib/validators";

export interface FilePreviewProps {
  file: File;
  isAnalyzing?: boolean;
  onAnalyze: () => void;
  onRemove: () => void;
}

function truncate(name: string, max = 40): string {
  if (name.length <= max) return name;
  const ext = name.includes(".") ? name.slice(name.lastIndexOf(".")) : "";
  return `${name.slice(0, max - ext.length - 1)}…${ext}`;
}

export function FilePreview({
  file,
  isAnalyzing,
  onAnalyze,
  onRemove,
}: FilePreviewProps) {
  const isPdf = file.type === "application/pdf";
  const Icon = isPdf ? FileText : ImageIcon;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.18, ease: "easeOut" }}
      className="rounded-card border border-brand-border bg-white p-5 md:p-6"
    >
      <div className="flex items-start gap-4">
        <div className="h-12 w-12 rounded-btn bg-brand-teal-light flex items-center justify-center shrink-0">
          <Icon className="h-5 w-5 text-brand-teal" aria-hidden="true" />
        </div>
        <div className="min-w-0 flex-1">
          <p
            className="text-sm font-medium text-brand-dark truncate"
            title={file.name}
          >
            {truncate(file.name)}
          </p>
          <p className="text-xs text-brand-muted mt-0.5">
            {formatFileSize(file.size)}
          </p>
          <div className="mt-2 inline-flex items-center gap-1.5 text-xs text-brand-teal">
            <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
            Ready to analyze
          </div>
        </div>
      </div>

      <div className="mt-5 flex flex-col gap-2">
        <Button
          variant="primary"
          size="lg"
          fullWidth
          isLoading={isAnalyzing}
          onClick={onAnalyze}
          rightIcon={<ArrowRight className="h-4 w-4" aria-hidden="true" />}
        >
          Analyze this report
        </Button>
        <button
          type="button"
          onClick={onRemove}
          className="inline-flex items-center justify-center gap-1.5 text-xs text-brand-coral hover:underline min-h-11"
        >
          <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
          Remove file
        </button>
      </div>
    </motion.div>
  );
}

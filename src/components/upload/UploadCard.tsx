import { useState } from "react";
import { AlertCircle } from "lucide-react";
import { Tabs } from "@/components/rx/Tabs";
import { Button } from "@/components/rx/Button";
import { DropZone } from "@/components/upload/DropZone";
import { FilePreview } from "@/components/upload/FilePreview";
import { PasteInput } from "@/components/upload/PasteInput";
import { ContextQuestionsModal } from "@/components/upload/ContextQuestionsModal";
import { useFileUpload } from "@/hooks/useFileUpload";
import { uploadStore } from "@/lib/uploadStore";

type TabId = "upload" | "paste";

export function UploadCard() {
  const [tab, setTab] = useState<TabId>("upload");
  const {
    uploadState,
    handleFileDrop,
    handleFileSelect,
    handlePasteText,
    loadSampleReport,
    reset,
    isDragging,
    setIsDragging,
    pendingNavigation,
    proceedToResults,
    cancelPending,
  } = useFileUpload();

  const isExtracting = uploadState.status === "extracting";
  const hasError = uploadState.status === "error";
  const hasValidFile =
    !!uploadState.file &&
    (uploadState.status === "extracting" || uploadState.status === "done");

  return (
    <section
      id="upload-card"
      aria-label="Upload your lab report"
      className="w-full max-w-2xl mx-auto"
    >
      <div className="rounded-[16px] bg-white border-[1.5px] border-dashed border-[#9FE1CB] p-5 sm:p-6 md:p-10">
        <div className="flex justify-center mb-5">
          <Tabs
            tabs={[
              { id: "upload", label: "Upload file" },
              { id: "paste", label: "Paste text" },
            ]}
            activeTab={tab}
            onTabChange={(id) => {
              setTab(id as TabId);
              if (hasError) reset();
            }}
            ariaLabel="Choose input method"
          />
        </div>

        {tab === "upload" && (
          <div
            role="tabpanel"
            id="tabpanel-upload"
            aria-labelledby="tab-upload"
          >
            {hasError ? (
              <div
                role="alert"
                aria-live="polite"
                className="rounded-card border border-brand-coral bg-brand-coral-light/40 p-5 text-center"
              >
                <AlertCircle
                  className="mx-auto h-6 w-6 text-brand-coral"
                  aria-hidden="true"
                />
                <p className="mt-2 text-sm text-brand-dark font-medium">
                  We couldn't process that file
                </p>
                <p className="mt-1 text-sm text-brand-muted">
                  {uploadState.error}
                </p>
                <div className="mt-4">
                  <Button variant="ghost" size="md" onClick={reset}>
                    Try again
                  </Button>
                </div>
              </div>
            ) : hasValidFile && uploadState.file ? (
              <FilePreview
                file={uploadState.file}
                isAnalyzing={isExtracting}
                onAnalyze={() => {
                  if (uploadState.file) {
                    handleFileDrop([uploadState.file]);
                  }
                }}
                onRemove={reset}
              />
            ) : (
              <DropZone
                isDragging={isDragging}
                setIsDragging={setIsDragging}
                onFiles={handleFileDrop}
                onFileInputChange={handleFileSelect}
                onLoadSample={loadSampleReport}
              />
            )}
          </div>
        )}

        {tab === "paste" && (
          <div role="tabpanel" id="tabpanel-paste" aria-labelledby="tab-paste">
            <PasteInput onAnalyze={handlePasteText} />
            {hasError && (
              <p
                role="alert"
                aria-live="polite"
                className="mt-3 text-xs text-brand-coral"
              >
                {uploadState.error}
              </p>
            )}
          </div>
        )}
      </div>

      <ContextQuestionsModal
        open={pendingNavigation}
        onSubmit={(ctx) => {
          uploadStore.setClinicalContext(ctx);
          proceedToResults();
        }}
        onSkip={cancelPending}
      />
    </section>
  );
}

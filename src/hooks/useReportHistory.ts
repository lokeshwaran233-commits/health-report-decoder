import { useCallback, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import {
  clearAllReports,
  deleteReport,
  deleteReports,
} from "@/lib/cloudSync.functions";
import { uploadStore } from "@/lib/uploadStore";

export function useReportHistory() {
  const qc = useQueryClient();
  const delOne = useServerFn(deleteReport);
  const delMany = useServerFn(deleteReports);
  const clearAll = useServerFn(clearAllReports);

  const [selecting, setSelecting] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [busy, setBusy] = useState(false);

  const invalidate = useCallback(() => {
    void qc.invalidateQueries({ queryKey: ["cloud-reports"] });
  }, [qc]);

  const toggleSelectionMode = () => {
    setSelected(new Set());
    setSelecting((v) => !v);
  };

  const toggleSelect = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const removeOne = async (id: string, isLocal: boolean) => {
    setBusy(true);
    try {
      uploadStore.deleteHistoryItem(id);
      if (!isLocal) {
        await delOne({ data: { id } });
      }
      invalidate();
      toast.success("Report removed");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not remove");
    } finally {
      setBusy(false);
    }
  };

  const removeSelected = async (allIds: string[], cloudIds: string[]) => {
    if (allIds.length === 0) return;
    setBusy(true);
    try {
      for (const id of allIds) uploadStore.deleteHistoryItem(id);
      if (cloudIds.length > 0) await delMany({ data: { ids: cloudIds } });
      invalidate();
      toast.success(`${allIds.length} report${allIds.length === 1 ? "" : "s"} removed`);
      setSelected(new Set());
      setSelecting(false);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not remove");
    } finally {
      setBusy(false);
    }
  };

  const clearAllHistory = async (hasCloud: boolean) => {
    setBusy(true);
    try {
      uploadStore.clearHistory();
      if (hasCloud) await clearAll();
      invalidate();
      toast.success("All lab reports cleared.");
      setSelected(new Set());
      setSelecting(false);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not clear");
    } finally {
      setBusy(false);
    }
  };

  return {
    selecting,
    selected,
    busy,
    toggleSelectionMode,
    toggleSelect,
    removeOne,
    removeSelected,
    clearAllHistory,
    exitSelection: () => {
      setSelected(new Set());
      setSelecting(false);
    },
  };
}

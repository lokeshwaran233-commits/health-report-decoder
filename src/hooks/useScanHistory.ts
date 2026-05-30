import { useCallback, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import {
  clearAllScans,
  deleteScan,
  deleteScans,
} from "@/lib/scanCloudSync.functions";

export function useScanHistory() {
  const qc = useQueryClient();
  const delOne = useServerFn(deleteScan);
  const delMany = useServerFn(deleteScans);
  const clearAll = useServerFn(clearAllScans);

  const [selecting, setSelecting] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [busy, setBusy] = useState(false);

  const invalidate = useCallback(() => {
    void qc.invalidateQueries({ queryKey: ["cloud-scans"] });
  }, [qc]);

  return {
    selecting,
    selected,
    busy,
    toggleSelectionMode: () => {
      setSelected(new Set());
      setSelecting((v) => !v);
    },
    toggleSelect: (id: string) =>
      setSelected((prev) => {
        const n = new Set(prev);
        if (n.has(id)) n.delete(id);
        else n.add(id);
        return n;
      }),
    exitSelection: () => {
      setSelected(new Set());
      setSelecting(false);
    },
    removeOne: async (id: string) => {
      setBusy(true);
      try {
        await delOne({ data: { id } });
        invalidate();
        toast.success("Scan removed");
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Could not remove");
      } finally {
        setBusy(false);
      }
    },
    removeSelected: async (ids: string[]) => {
      if (ids.length === 0) return;
      setBusy(true);
      try {
        await delMany({ data: { ids } });
        invalidate();
        toast.success(`${ids.length} scan${ids.length === 1 ? "" : "s"} removed`);
        setSelected(new Set());
        setSelecting(false);
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Could not remove");
      } finally {
        setBusy(false);
      }
    },
    clearAllHistory: async () => {
      setBusy(true);
      try {
        await clearAll();
        invalidate();
        toast.success("All scan history cleared.");
        setSelected(new Set());
        setSelecting(false);
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Could not clear");
      } finally {
        setBusy(false);
      }
    },
  };
}

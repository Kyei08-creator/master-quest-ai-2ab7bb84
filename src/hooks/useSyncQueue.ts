import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useOnlineStatus } from "./useOnlineStatus";

interface QueueItem {
  id: string;
  moduleId: string;
  draftType: "assignment" | "quiz";
  quizType?: "quiz" | "final_test";
  data: any;
  timestamp: number;
}

const QUEUE_KEY = "syncQueue";

export const useSyncQueue = () => {
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [processing, setProcessing] = useState(false);
  const isOnline = useOnlineStatus();

  // Load queue from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(QUEUE_KEY);
      if (stored) {
        setQueue(JSON.parse(stored));
      }
    } catch (error) {
      console.error("Failed to load sync queue:", error);
    }
  }, []);

  // Save queue to localStorage whenever it changes
  useEffect(() => {
    try {
      localStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
    } catch (error) {
      console.error("Failed to save sync queue:", error);
    }
  }, [queue]);

  // Process queue when coming back online
  useEffect(() => {
    if (isOnline && queue.length > 0 && !processing) {
      processQueue();
    }
  }, [isOnline, queue.length]);

  const addToQueue = (item: Omit<QueueItem, "id" | "timestamp">) => {
    const queueItem: QueueItem = {
      ...item,
      id: crypto.randomUUID(),
      timestamp: Date.now(),
    };
    setQueue((prev) => [...prev, queueItem]);
  };

  const removeFromQueue = (id: string) => {
    setQueue((prev) => prev.filter((item) => item.id !== id));
  };

  const processQueue = async () => {
    if (processing || queue.length === 0) return;

    setProcessing(true);
    const itemsToProcess = [...queue];
    let successCount = 0;
    let failCount = 0;

    for (const item of itemsToProcess) {
      try {
        const { error } = await supabase
          .from("module_progress_drafts")
          .upsert([{
            module_id: item.moduleId,
            draft_type: item.draftType,
            quiz_type: item.quizType,
            data: item.data as any,
          }]);

        if (error) throw error;

        removeFromQueue(item.id);
        successCount++;
      } catch (error) {
        console.error("Failed to sync queued item:", error);
        failCount++;
      }
    }

    setProcessing(false);

    if (successCount > 0) {
      toast.success(`✅ Synced ${successCount} ${successCount === 1 ? 'item' : 'items'} from queue`, {
        duration: 4000,
      });
    }

    if (failCount > 0) {
      toast.error(`Failed to sync ${failCount} ${failCount === 1 ? 'item' : 'items'}`, {
        duration: 4000,
      });
    }
  };

  return {
    queue,
    addToQueue,
    removeFromQueue,
    processQueue,
    queueSize: queue.length,
    processing,
  };
};

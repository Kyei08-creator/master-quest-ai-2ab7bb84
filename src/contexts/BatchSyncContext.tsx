import { createContext, useContext, ReactNode } from "react";
import { useBatchSync } from "@/hooks/useBatchSync";

interface QueueItem {
  id: string;
  moduleId: string;
  draftType: "assignment" | "quiz" | "flashcards" | "presentations";
  quizType?: "quiz" | "final_test";
  data: any;
  timestamp: number;
  retryCount: number;
  nextRetryAt: number;
  lastSyncAttempt?: number;
}

interface BatchSyncContextType {
  syncing: boolean;
  lastBatchSync: Date | null;
  syncAll: () => Promise<void>;
  register: (key: string, item: {
    draftType: "assignment" | "quiz" | "flashcards" | "presentations";
    quizType?: "quiz" | "final_test";
    getData: () => any;
  }) => void;
  unregister: (key: string) => void;
  queueSize: number;
  queueItems: QueueItem[];
  nextRetryTime: Date | null;
  registeredCount: number;
  syncStats: { success: number; failed: number; total: number };
  onConflict?: (tabName: string) => void;
}

const BatchSyncContext = createContext<BatchSyncContextType | undefined>(undefined);

export const useBatchSyncContext = () => {
  const context = useContext(BatchSyncContext);
  if (!context) {
    throw new Error("useBatchSyncContext must be used within BatchSyncProvider");
  }
  return context;
};

interface BatchSyncProviderProps {
  children: ReactNode;
  moduleId: string;
  onConflict?: (tabName: string) => void;
}

export const BatchSyncProvider = ({ children, moduleId, onConflict }: BatchSyncProviderProps) => {
  const batchSync = useBatchSync(moduleId, onConflict);

  return (
    <BatchSyncContext.Provider value={batchSync}>
      {children}
    </BatchSyncContext.Provider>
  );
};

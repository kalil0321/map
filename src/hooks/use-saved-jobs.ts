import { useState, useEffect, useCallback } from 'react';
import {
  getSavedJobIds,
  saveJobId,
  removeSavedJobId,
  isSaved as checkIsSaved,
  clearAllSavedJobs,
} from '@/utils/saved-jobs-storage';

export interface UseSavedJobsReturn {
  savedJobIds: string[];
  isSaved: (atsId: string) => boolean;
  toggleSave: (atsId: string) => void;
  saveJob: (atsId: string) => void;
  unsaveJob: (atsId: string) => void;
  clearAll: () => void;
}

/**
 * Hook for managing saved jobs in localStorage
 * Provides functions to save, unsave, toggle, and check saved status of jobs
 * Automatically syncs across tabs via storage events
 */
export function useSavedJobs(): UseSavedJobsReturn {
  const [savedJobIds, setSavedJobIds] = useState<string[]>([]);

  // Initialize from localStorage on mount
  useEffect(() => {
    setSavedJobIds(getSavedJobIds());
  }, []);

  // Sync with localStorage changes from other tabs
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'saved-jobs') {
        setSavedJobIds(getSavedJobIds());
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const isSaved = useCallback(
    (atsId: string): boolean => {
      return savedJobIds.includes(atsId);
    },
    [savedJobIds]
  );

  const saveJob = useCallback((atsId: string) => {
    saveJobId(atsId);
    setSavedJobIds(getSavedJobIds());
  }, []);

  const unsaveJob = useCallback((atsId: string) => {
    removeSavedJobId(atsId);
    setSavedJobIds(getSavedJobIds());
  }, []);

  const toggleSave = useCallback(
    (atsId: string) => {
      if (isSaved(atsId)) {
        unsaveJob(atsId);
      } else {
        saveJob(atsId);
      }
    },
    [isSaved, saveJob, unsaveJob]
  );

  const clearAll = useCallback(() => {
    clearAllSavedJobs();
    setSavedJobIds([]);
  }, []);

  return {
    savedJobIds,
    isSaved,
    toggleSave,
    saveJob,
    unsaveJob,
    clearAll,
  };
}

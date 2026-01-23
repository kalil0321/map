import { useState, useEffect, useCallback } from 'react';
import {
  getSavedJobIds,
  getSavedJobs,
  saveJob as saveJobToStorage,
  saveJobId,
  removeSavedJobId,
  isSaved as checkIsSaved,
  clearAllSavedJobs,
  type SavedJob,
} from '@/utils/saved-jobs-storage';

export interface UseSavedJobsReturn {
  savedJobIds: string[];
  savedJobs: SavedJob[];
  isSaved: (atsId: string) => boolean;
  toggleSave: (atsId: string, name?: string, company?: string) => void;
  saveJob: (atsId: string, name?: string, company?: string) => void;
  unsaveJob: (atsId: string) => void;
  clearAll: () => void;
  isLoading: boolean;
}

/**
 * Hook for managing saved jobs in localStorage
 * Provides functions to save, unsave, toggle, and check saved status of jobs
 * Automatically syncs across tabs via storage events
 */
export function useSavedJobs(): UseSavedJobsReturn {
  const [savedJobIds, setSavedJobIds] = useState<string[]>([]);
  const [savedJobs, setSavedJobs] = useState<SavedJob[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Initialize from localStorage on mount
  useEffect(() => {
    const jobs = getSavedJobs();
    setSavedJobs(jobs);
    setSavedJobIds(jobs.map(j => j.ats_id));
    setIsLoading(false);
  }, []);

  // Sync with localStorage changes from other tabs
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'saved-jobs') {
        const jobs = getSavedJobs();
        setSavedJobs(jobs);
        setSavedJobIds(jobs.map(j => j.ats_id));
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

  const saveJob = useCallback((atsId: string, name?: string, company?: string) => {
    if (name && company) {
      saveJobToStorage({ ats_id: atsId, name, company });
    } else {
      // Fallback for backward compatibility
      saveJobId(atsId);
    }
    const jobs = getSavedJobs();
    setSavedJobs(jobs);
    setSavedJobIds(jobs.map(j => j.ats_id));
  }, []);

  const unsaveJob = useCallback((atsId: string) => {
    removeSavedJobId(atsId);
    const jobs = getSavedJobs();
    setSavedJobs(jobs);
    setSavedJobIds(jobs.map(j => j.ats_id));
  }, []);

  const toggleSave = useCallback(
    (atsId: string, name?: string, company?: string) => {
      if (isSaved(atsId)) {
        unsaveJob(atsId);
      } else {
        saveJob(atsId, name, company);
      }
    },
    [isSaved, saveJob, unsaveJob]
  );

  const clearAll = useCallback(() => {
    clearAllSavedJobs();
    setSavedJobs([]);
    setSavedJobIds([]);
  }, []);

  return {
    savedJobIds,
    savedJobs,
    isSaved,
    toggleSave,
    saveJob,
    unsaveJob,
    clearAll,
    isLoading,
  };
}

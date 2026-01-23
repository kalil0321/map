import { useState, useEffect, useCallback } from 'react';
import {
  getAppliedJobIds,
  getAppliedJobs,
  saveAppliedJob as saveAppliedJobToStorage,
  saveAppliedJobId,
  removeAppliedJobId,
  updateAppliedJobDate,
  clearAllAppliedJobs,
  type AppliedJob,
} from '@/utils/applied-jobs-storage';

export interface UseAppliedJobsReturn {
  appliedJobIds: string[];
  appliedJobs: AppliedJob[];
  isApplied: (atsId: string) => boolean;
  toggleApplied: (atsId: string, name?: string, company?: string) => void;
  markApplied: (atsId: string, name?: string, company?: string) => void;
  unmarkApplied: (atsId: string) => void;
  updateAppliedDate: (atsId: string, appliedAt: string | null) => void;
  clearAll: () => void;
  isLoading: boolean;
}

export function useAppliedJobs(): UseAppliedJobsReturn {
  const [appliedJobIds, setAppliedJobIds] = useState<string[]>([]);
  const [appliedJobs, setAppliedJobs] = useState<AppliedJob[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const jobs = getAppliedJobs();
    setAppliedJobs(jobs);
    setAppliedJobIds(jobs.map(j => j.ats_id));
    setIsLoading(false);
  }, []);

  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'applied-jobs') {
        const jobs = getAppliedJobs();
        setAppliedJobs(jobs);
        setAppliedJobIds(jobs.map(j => j.ats_id));
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const isApplied = useCallback(
    (atsId: string): boolean => {
      return appliedJobIds.includes(atsId);
    },
    [appliedJobIds]
  );

  const markApplied = useCallback((atsId: string, name?: string, company?: string) => {
    if (name && company) {
      saveAppliedJobToStorage({
        ats_id: atsId,
        name,
        company,
        applied_at: new Date().toISOString(),
      });
    } else {
      saveAppliedJobId(atsId);
    }
    const jobs = getAppliedJobs();
    setAppliedJobs(jobs);
    setAppliedJobIds(jobs.map(j => j.ats_id));
  }, []);

  const unmarkApplied = useCallback((atsId: string) => {
    removeAppliedJobId(atsId);
    const jobs = getAppliedJobs();
    setAppliedJobs(jobs);
    setAppliedJobIds(jobs.map(j => j.ats_id));
  }, []);

  const updateAppliedDate = useCallback((atsId: string, appliedAt: string | null) => {
    updateAppliedJobDate(atsId, appliedAt);
    const jobs = getAppliedJobs();
    setAppliedJobs(jobs);
    setAppliedJobIds(jobs.map(j => j.ats_id));
  }, []);

  const toggleApplied = useCallback(
    (atsId: string, name?: string, company?: string) => {
      if (isApplied(atsId)) {
        unmarkApplied(atsId);
      } else {
        markApplied(atsId, name, company);
      }
    },
    [isApplied, markApplied, unmarkApplied]
  );

  const clearAll = useCallback(() => {
    clearAllAppliedJobs();
    setAppliedJobs([]);
    setAppliedJobIds([]);
  }, []);

  return {
    appliedJobIds,
    appliedJobs,
    isApplied,
    toggleApplied,
    markApplied,
    unmarkApplied,
    updateAppliedDate,
    clearAll,
    isLoading,
  };
}

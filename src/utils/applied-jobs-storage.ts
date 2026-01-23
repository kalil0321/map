const STORAGE_KEY = 'applied-jobs';

export interface AppliedJob {
  ats_id: string;
  name: string;
  company: string;
  applied_at: string | null;
}

function migrateOldFormat(data: unknown): AppliedJob[] {
  if (Array.isArray(data)) {
    if (data.length > 0 && typeof data[0] === 'string') {
      return (data as string[]).map((atsId) => ({
        ats_id: atsId,
        name: '',
        company: '',
        applied_at: null,
      }));
    }

    return data.filter((item): item is AppliedJob =>
      typeof item === 'object' &&
      item !== null &&
      'ats_id' in item &&
      'name' in item &&
      'company' in item
    ).map((item) => ({
      ...item,
      applied_at: 'applied_at' in item ? (item as AppliedJob).applied_at ?? null : null,
    }));
  }

  return [];
}

export function getAppliedJobs(): AppliedJob[] {
  if (typeof window === 'undefined') {
    return [];
  }

  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) {
      return [];
    }
    const parsed = JSON.parse(stored);
    return migrateOldFormat(parsed);
  } catch (error) {
    console.error('Error reading applied jobs from localStorage:', error);
    return [];
  }
}

export function getAppliedJobIds(): string[] {
  return getAppliedJobs().map(job => job.ats_id);
}

export function saveAppliedJob(job: AppliedJob): void {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    const currentJobs = getAppliedJobs();
    const jobsMap = new Map(currentJobs.map(j => [j.ats_id, j]));
    jobsMap.set(job.ats_id, job);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(Array.from(jobsMap.values())));
  } catch (error) {
    console.error('Error saving applied job to localStorage:', error);
  }
}

export function saveAppliedJobId(atsId: string): void {
  saveAppliedJob({
    ats_id: atsId,
    name: '',
    company: '',
    applied_at: new Date().toISOString(),
  });
}

export function removeAppliedJobId(atsId: string): void {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    const currentJobs = getAppliedJobs();
    const filtered = currentJobs.filter(job => job.ats_id !== atsId);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
  } catch (error) {
    console.error('Error removing applied job from localStorage:', error);
  }
}

export function updateAppliedJobDate(atsId: string, appliedAt: string | null): void {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    const currentJobs = getAppliedJobs();
    const updated = currentJobs.map((job) => (
      job.ats_id === atsId
        ? { ...job, applied_at: appliedAt }
        : job
    ));
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch (error) {
    console.error('Error updating applied job date in localStorage:', error);
  }
}

export function isApplied(atsId: string): boolean {
  if (typeof window === 'undefined') {
    return false;
  }

  try {
    const appliedJobs = getAppliedJobs();
    return appliedJobs.some(job => job.ats_id === atsId);
  } catch (error) {
    console.error('Error checking if job is applied:', error);
    return false;
  }
}

export function getAppliedJob(atsId: string): AppliedJob | null {
  if (typeof window === 'undefined') {
    return null;
  }

  try {
    const appliedJobs = getAppliedJobs();
    return appliedJobs.find(job => job.ats_id === atsId) || null;
  } catch (error) {
    console.error('Error getting applied job from localStorage:', error);
    return null;
  }
}

export function clearAllAppliedJobs(): void {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.error('Error clearing applied jobs from localStorage:', error);
  }
}

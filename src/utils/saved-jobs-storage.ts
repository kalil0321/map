const STORAGE_KEY = 'saved-jobs';

export interface SavedJob {
  ats_id: string;
  name: string;
  company: string;
}

/**
 * Migrate old format (array of strings) to new format (array of objects)
 */
function migrateOldFormat(data: unknown): SavedJob[] {
  if (Array.isArray(data)) {
    // Check if it's the old format (array of strings)
    if (data.length > 0 && typeof data[0] === 'string') {
      // Old format - convert to new format with empty name/company
      // These will be updated when the user interacts with the jobs
      return (data as string[]).map(atsId => ({
        ats_id: atsId,
        name: '',
        company: '',
      }));
    }
    // New format - validate and return
    return data.filter((item): item is SavedJob =>
      typeof item === 'object' &&
      item !== null &&
      'ats_id' in item &&
      'name' in item &&
      'company' in item
    );
  }
  return [];
}

/**
 * Get all saved jobs from localStorage
 * Returns empty array if localStorage is not available or on error
 */
export function getSavedJobs(): SavedJob[] {
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
    console.error('Error reading saved jobs from localStorage:', error);
    return [];
  }
}

/**
 * Get all saved job IDs from localStorage (for backward compatibility)
 * Returns empty array if localStorage is not available or on error
 */
export function getSavedJobIds(): string[] {
  return getSavedJobs().map(job => job.ats_id);
}

/**
 * Save a job to localStorage
 * @param job The job to save (with ats_id, name, and company)
 */
export function saveJob(job: SavedJob): void {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    const currentJobs = getSavedJobs();
    const jobsMap = new Map(currentJobs.map(j => [j.ats_id, j]));
    jobsMap.set(job.ats_id, job);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(Array.from(jobsMap.values())));
  } catch (error) {
    console.error('Error saving job to localStorage:', error);
  }
}

/**
 * Save a job ID to localStorage (for backward compatibility)
 * @param atsId The ats_id of the job to save
 * @deprecated Use saveJob instead with name and company
 */
export function saveJobId(atsId: string): void {
  // For backward compatibility, save with placeholder name and company
  // These will be updated when the job is saved properly
  saveJob({
    ats_id: atsId,
    name: '',
    company: '',
  });
}

/**
 * Remove a job from localStorage
 * @param atsId The ats_id of the job to remove
 */
export function removeSavedJobId(atsId: string): void {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    const currentJobs = getSavedJobs();
    const filtered = currentJobs.filter(job => job.ats_id !== atsId);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
  } catch (error) {
    console.error('Error removing saved job from localStorage:', error);
  }
}

/**
 * Check if a job ID is saved
 * @param atsId The ats_id to check
 * @returns true if saved, false otherwise
 */
export function isSaved(atsId: string): boolean {
  if (typeof window === 'undefined') {
    return false;
  }

  try {
    const savedJobs = getSavedJobs();
    return savedJobs.some(job => job.ats_id === atsId);
  } catch (error) {
    console.error('Error checking if job is saved:', error);
    return false;
  }
}

/**
 * Get a saved job by ats_id
 * @param atsId The ats_id to look up
 * @returns The saved job or null if not found
 */
export function getSavedJob(atsId: string): SavedJob | null {
  if (typeof window === 'undefined') {
    return null;
  }

  try {
    const savedJobs = getSavedJobs();
    return savedJobs.find(job => job.ats_id === atsId) || null;
  } catch (error) {
    console.error('Error getting saved job from localStorage:', error);
    return null;
  }
}

/**
 * Clear all saved jobs from localStorage
 */
export function clearAllSavedJobs(): void {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.error('Error clearing saved jobs from localStorage:', error);
  }
}

const STORAGE_KEY = 'saved-jobs';

/**
 * Get all saved job IDs from localStorage
 * Returns empty array if localStorage is not available or on error
 */
export function getSavedJobIds(): string[] {
  if (typeof window === 'undefined') {
    return [];
  }

  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) {
      return [];
    }
    const parsed = JSON.parse(stored);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    console.error('Error reading saved jobs from localStorage:', error);
    return [];
  }
}

/**
 * Save a job ID to localStorage
 * @param atsId The ats_id of the job to save
 */
export function saveJobId(atsId: string): void {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    const currentIds = getSavedJobIds();
    const idsSet = new Set(currentIds);
    idsSet.add(atsId);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(Array.from(idsSet)));
  } catch (error) {
    console.error('Error saving job to localStorage:', error);
  }
}

/**
 * Remove a job ID from localStorage
 * @param atsId The ats_id of the job to remove
 */
export function removeSavedJobId(atsId: string): void {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    const currentIds = getSavedJobIds();
    const idsSet = new Set(currentIds);
    idsSet.delete(atsId);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(Array.from(idsSet)));
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
    const currentIds = getSavedJobIds();
    return currentIds.includes(atsId);
  } catch (error) {
    console.error('Error checking if job is saved:', error);
    return false;
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

import type { JobMarker } from '@/types';

/**
 * Format job posting date for display
 * Returns "New" if posted today, or time elapsed (days/weeks/+6mo)
 */
export function formatJobDate(job: JobMarker): string | null {
    if (!job.posted_at) {
        return null;
    }

    try {
        const postedDate = new Date(job.posted_at);

        // Check if date is valid
        if (isNaN(postedDate.getTime())) {
            return null;
        }

        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const postedDay = new Date(postedDate.getFullYear(), postedDate.getMonth(), postedDate.getDate());

        // Calculate difference in milliseconds
        const diffMs = today.getTime() - postedDay.getTime();
        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

        // Posted today
        if (diffDays === 0) {
            return 'New';
        }

        // Less than 7 days
        if (diffDays < 7) {
            return `${diffDays} ${diffDays === 1 ? 'day' : 'days'} ago`;
        }

        // Less than 4 weeks
        const diffWeeks = Math.floor(diffDays / 7);
        if (diffWeeks <= 4) {
            return `${diffWeeks} ${diffWeeks === 1 ? 'week' : 'weeks'} ago`;
        }

        // 4 weeks to 6 months - show in months
        const diffMonths = Math.floor(diffDays / 30);
        if (diffMonths < 6) {
            return `${diffMonths} ${diffMonths === 1 ? 'month' : 'months'} ago`;
        }

        // 6 months or more
        return '+6mo';
    } catch (error) {
        return null;
    }
}

/**
 * Check if job was posted today
 */
export function isJobNew(job: JobMarker): boolean {
    if (!job.posted_at) {
        return false;
    }

    try {
        const postedDate = new Date(job.posted_at);

        if (isNaN(postedDate.getTime())) {
            return false;
        }

        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const postedDay = new Date(postedDate.getFullYear(), postedDate.getMonth(), postedDate.getDate());

        return today.getTime() === postedDay.getTime();
    } catch (error) {
        return false;
    }
}

/**
 * Get parsed date for sorting
 */
export function getJobDate(job: JobMarker): Date | null {
    if (!job.posted_at) {
        return null;
    }

    try {
        const postedDate = new Date(job.posted_at);

        if (isNaN(postedDate.getTime())) {
            return null;
        }

        return postedDate;
    } catch (error) {
        return null;
    }
}


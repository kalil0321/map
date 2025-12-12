import { cache } from 'react';
import { eq } from 'drizzle-orm';
import { db } from '@/db/db';
import { mapJobs } from '@/db/schema';

/**
 * Fetch additional job details from the map_jobs PostgreSQL database table
 * This function queries the database for description, ats_type, and posted_at
 * based on the job's url
 * Uses Drizzle ORM for type-safe queries and connection pooling
 */
export const fetchJobDetailsFromDb = cache(async (
    atsId: string,
    url?: string
): Promise<{
    description: string | null;
    ats_type: string | null;
    posted_at: string | null;
} | null> => {
    if (!db) {
        // Silently return null if DATABASE_URL is not configured
        // This allows the page to work without database connection
        return null;
    }

    if (!url) {
        // URL is required to match jobs in the database
        return null;
    }

    try {
        // Query the map_jobs table using Drizzle
        // Matches jobs by url (most reliable identifier)
        const result = await db
            .select({
                description: mapJobs.description,
                ats_type: mapJobs.atsType,
                posted_at: mapJobs.postedAt,
            })
            .from(mapJobs)
            .where(eq(mapJobs.url, url))
            .limit(1);

        if (result.length === 0) {
            return null;
        }

        const row = result[0];
        return {
            description: row.description || null,
            ats_type: row.ats_type || null,
            posted_at: row.posted_at ? new Date(row.posted_at).toISOString() : null,
        };
    } catch (error) {
        console.error('Error fetching job details from PostgreSQL database:', error);
        // Return null on error to allow the page to still render with CSV data
        return null;
    }
});

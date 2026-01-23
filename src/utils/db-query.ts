import { cache } from 'react';
import { unstable_cache } from 'next/cache';
import { eq } from 'drizzle-orm';
import { db } from '@/db/db';
import { mapJobs } from '@/db/schema';

/**
 * Fetch additional job details from the map_jobs PostgreSQL database table
 * This function queries the database for description, ats_type, and posted_at
 * based on the job's url
 * Uses Drizzle ORM for type-safe queries and connection pooling
 * 
 * Optimized with edge caching for better performance in regions like India & Hong Kong
 */
const fetchJobDetailsFromDbInternal = async (
    url: string
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
        // Add timeout handling for better performance in distant regions
        const queryPromise = db
            .select({
                description: mapJobs.description,
                ats_type: mapJobs.atsType,
                posted_at: mapJobs.postedAt,
            })
            .from(mapJobs)
            .where(eq(mapJobs.url, url))
            .limit(1);

        // Increased timeout for regions with higher latency (India, Hong Kong, etc.)
        const timeoutPromise = new Promise<never>((_, reject) =>
            setTimeout(() => reject(new Error('Database query timeout')), 8000)
        );

        const result = await Promise.race([queryPromise, timeoutPromise]);

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
        // Silently handle timeout and other errors to allow page to render with CSV data
        // This is especially important for users in regions with higher latency
        if (error instanceof Error && error.message === 'Database query timeout') {
            console.warn(`Database query timeout for URL: ${url.substring(0, 50)}...`);
        } else {
            console.error('Error fetching job details from PostgreSQL database:', error);
        }
        return null;
    }
};

export const fetchJobDetailsFromDb = cache(async (
    atsId: string,
    url?: string
): Promise<{
    description: string | null;
    ats_type: string | null;
    posted_at: string | null;
} | null> => {
    if (!url) {
        return null;
    }
    
    // Use unstable_cache with URL as part of cache key
    const cachedFetch = unstable_cache(
        async () => fetchJobDetailsFromDbInternal(url),
        ['job-details', url],
        {
            revalidate: 1800, // Cache for 30 minutes
            tags: ['job-details'],
        }
    );
    
    return cachedFetch();
});

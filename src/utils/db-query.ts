import { Client } from 'pg';

/**
 * Fetch additional job details from the map_jobs PostgreSQL database table
 * This function queries the database for description, ats_type, and posted_at
 * based on the job's url
 */
export async function fetchJobDetailsFromDb(
    atsId: string,
    url?: string
): Promise<{
    description: string | null;
    ats_type: string | null;
    posted_at: string | null;
} | null> {
    // Database connection string from environment variable
    const databaseUrl = process.env.DATABASE_URL;

    if (!databaseUrl) {
        // Silently return null if DATABASE_URL is not configured
        // This allows the page to work without database connection
        return null;
    }

    if (!url) {
        // URL is required to match jobs in the database
        return null;
    }

    const client = new Client({
        connectionString: databaseUrl,
    });

    try {
        await client.connect();

        // Query the map_jobs table
        // Matches jobs by url (most reliable identifier)
        const query = `
            SELECT description, ats_type, posted_at
            FROM map_jobs
            WHERE url = $1
            LIMIT 1
        `;

        const result = await client.query(query, [url]);

        if (result.rows.length === 0) {
            return null;
        }

        const row = result.rows[0];
        return {
            description: row.description || null,
            ats_type: row.ats_type || null,
            posted_at: row.posted_at ? new Date(row.posted_at).toISOString() : null,
        };
    } catch (error) {
        console.error('Error fetching job details from PostgreSQL database:', error);
        // Return null on error to allow the page to still render with CSV data
        return null;
    } finally {
        await client.end();
    }
}


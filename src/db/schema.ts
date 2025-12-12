import { pgTable, text, timestamp } from 'drizzle-orm/pg-core';

export const mapJobs = pgTable('map_jobs', {
    url: text('url').primaryKey().notNull(),
    description: text('description'),
    atsType: text('ats_type'),
    postedAt: timestamp('posted_at', { mode: 'string' }),
});

export type MapJob = typeof mapJobs.$inferSelect;
export type NewMapJob = typeof mapJobs.$inferInsert;

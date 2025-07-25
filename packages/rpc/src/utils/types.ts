import type { websites } from '@databuddy/db';

export type Website = typeof websites.$inferSelect;
export type WebsiteInsert = typeof websites.$inferInsert;

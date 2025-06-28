import type { websiteStatus } from "@databuddy/db";
import type { TimezoneInfo } from "./utils/timezone";

export interface AppVariables {
	website?: {
		status: (typeof websiteStatus.enumValues)[number];
		name: string | null;
		id: string;
		domain: string;
		userId: string | null;
		projectId: string | null;
		createdAt: Date;
		updatedAt: Date;
		deletedAt: Date | null;
	};
	timezoneInfo?: TimezoneInfo;
	user?: { id: string; email: string } | null;
	session?: any;
}

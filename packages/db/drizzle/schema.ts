import { pgTable, text, timestamp, integer, index, uniqueIndex, foreignKey, boolean, jsonb, primaryKey, pgEnum } from "drizzle-orm/pg-core"
import { sql } from "drizzle-orm"

export const clientType = pgEnum("ClientType", ['individual', 'company', 'nonprofit'])
export const organizationRole = pgEnum("OrganizationRole", ['admin', 'owner', 'member', 'viewer'])
export const projectStatus = pgEnum("ProjectStatus", ['active', 'completed', 'on_hold', 'cancelled'])
export const projectType = pgEnum("ProjectType", ['website', 'mobile_app', 'desktop_app', 'api'])
export const role = pgEnum("Role", ['ADMIN', 'USER', 'EARLY_ADOPTER', 'INVESTOR', 'BETA_TESTER', 'GUEST'])
export const subscriptionStatus = pgEnum("SubscriptionStatus", ['active', 'trialing', 'past_due', 'canceled', 'paused', 'incomplete'])
export const userStatus = pgEnum("UserStatus", ['ACTIVE', 'SUSPENDED', 'INACTIVE'])
export const verificationStatus = pgEnum("VerificationStatus", ['PENDING', 'VERIFIED', 'FAILED'])
export const websiteStatus = pgEnum("WebsiteStatus", ['ACTIVE', 'HEALTHY', 'UNHEALTHY', 'INACTIVE', 'PENDING'])
export const funnelStepType = pgEnum("FunnelStepType", ['PAGE_VIEW', 'EVENT', 'CUSTOM'])
export const funnelGoalType = pgEnum("FunnelGoalType", ['COMPLETION', 'STEP_CONVERSION', 'TIME_TO_CONVERT'])
export const memberRole = pgEnum("MemberRole", ['owner', 'admin', 'member', 'viewer'])

export const verification = pgTable("verification", {
	id: text('id').primaryKey(),
	identifier: text('identifier').notNull(),
	value: text('value').notNull(),
	expiresAt: timestamp('expires_at').notNull(),
	createdAt: timestamp('created_at').$defaultFn(() => new Date()),
	updatedAt: timestamp('updated_at').$defaultFn(() => new Date()),
});

export const categories = pgTable("categories", {
	id: text().primaryKey().notNull(),
	name: text().notNull(),
	slug: text().notNull(),
	createdAt: timestamp({ precision: 3, mode: 'string' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
	updatedAt: timestamp({ precision: 3, mode: 'string' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
	deletedAt: timestamp({ precision: 3, mode: 'string' }),
}, (table) => [
	uniqueIndex("categories_name_key").using("btree", table.name.asc().nullsLast().op("text_ops")),
	uniqueIndex("categories_slug_key").using("btree", table.slug.asc().nullsLast().op("text_ops")),
]);

export const account = pgTable("account", {
	id: text('id').primaryKey(),
	accountId: text('account_id').notNull(),
	providerId: text('provider_id').notNull(),
	userId: text('user_id').notNull().references(() => user.id, { onDelete: 'cascade' }),
	accessToken: text('access_token'),
	refreshToken: text('refresh_token'),
	idToken: text('id_token'),
	accessTokenExpiresAt: timestamp('access_token_expires_at'),
	refreshTokenExpiresAt: timestamp('refresh_token_expires_at'),
	scope: text('scope'),
	password: text('password'),
	createdAt: timestamp('created_at').notNull(),
	updatedAt: timestamp('updated_at').notNull(),
});

export const websites = pgTable("websites", {
	id: text().primaryKey().notNull(),
	domain: text().notNull(),
	name: text(),
	status: websiteStatus().default('ACTIVE').notNull(),
	userId: text(),
	projectId: text(),
	organizationId: text('organization_id').references(() => organization.id, { onDelete: 'cascade' }),
	createdAt: timestamp({ precision: 3, mode: 'string' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
	updatedAt: timestamp({ precision: 3, mode: 'string' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
	deletedAt: timestamp({ precision: 3, mode: 'string' }),
	domainId: text(),
}, (table) => [
	index("websites_domainId_idx").using("btree", table.domainId.asc().nullsLast().op("text_ops")),
	uniqueIndex("websites_domain_key").using("btree", table.domain.asc().nullsLast().op("text_ops")),
	uniqueIndex("websites_projectId_key").using("btree", table.projectId.asc().nullsLast().op("text_ops")),
	index("websites_userId_idx").using("btree", table.userId.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [user.id],
			name: "websites_userId_fkey"
		}).onUpdate("cascade").onDelete("set null"),
	foreignKey({
			columns: [table.projectId],
			foreignColumns: [projects.id],
			name: "websites_projectId_fkey"
		}).onUpdate("cascade").onDelete("set null"),
	foreignKey({
			columns: [table.organizationId],
			foreignColumns: [organization.id],
			name: "websites_organizationId_fkey"
		}).onUpdate("cascade").onDelete("cascade"),
	foreignKey({
			columns: [table.domainId],
			foreignColumns: [domains.id],
			name: "websites_domainId_fkey"
		}).onUpdate("cascade").onDelete("set null"),
]);

export const user = pgTable("user", {
	id: text('id').primaryKey(),
	name: text('name').notNull(),
	email: text('email').notNull().unique(),
	emailVerified: boolean('email_verified').$defaultFn(() => false).notNull(),
	image: text('image'),
	firstName: text(),
	lastName: text(),
	status: userStatus().default('ACTIVE').notNull(),
	createdAt: timestamp('created_at').$defaultFn(() => new Date()).notNull(),
	updatedAt: timestamp('updated_at').$defaultFn(() => new Date()).notNull(),
	deletedAt: timestamp({ precision: 3, mode: 'string' }),
	role: role().default('USER').notNull(),
	twoFactorEnabled: boolean('two_factor_enabled'),
});

export const eventMeta = pgTable("event_meta", {
	id: text().primaryKey().notNull(),
	projectId: text().notNull(),
	name: text().notNull(),
	description: text(),
	data: jsonb(),
	createdAt: timestamp({ precision: 3, mode: 'string' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
	updatedAt: timestamp({ precision: 3, mode: 'string' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
}, (table) => [
	index("event_meta_projectId_idx").using("btree", table.projectId.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.projectId],
			foreignColumns: [projects.id],
			name: "event_meta_projectId_fkey"
		}).onUpdate("cascade").onDelete("restrict"),
]);

export const subscriptions = pgTable("subscriptions", {
	id: text().primaryKey().notNull(),
	organizationId: text().notNull(),
	customerId: text(),
	priceId: text(),
	productId: text(),
	status: subscriptionStatus().default('active').notNull(),
	startsAt: timestamp({ precision: 3, mode: 'string' }),
	endsAt: timestamp({ precision: 3, mode: 'string' }),
	canceledAt: timestamp({ precision: 3, mode: 'string' }),
	periodEventsCount: integer().default(0).notNull(),
	periodEventsCountExceededAt: timestamp({ precision: 3, mode: 'string' }),
	periodEventsLimit: integer().default(0).notNull(),
	interval: text(),
	createdByUserId: text(),
	createdAt: timestamp({ precision: 3, mode: 'string' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
	updatedAt: timestamp({ precision: 3, mode: 'string' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
}, (table) => [
	uniqueIndex("subscriptions_organizationId_key").using("btree", table.organizationId.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.createdByUserId],
			foreignColumns: [user.id],
			name: "subscriptions_createdByUserId_fkey"
		}).onUpdate("cascade").onDelete("set null"),
]);

export const projects = pgTable("projects", {
	id: text().primaryKey().notNull(),
	name: text().notNull(),
	slug: text().notNull(),
	description: text(),
	type: projectType().default('website').notNull(),
	organizationId: text('organization_id').notNull().references(() => organization.id, { onDelete: 'cascade' }),
	startDate: timestamp({ precision: 3, mode: 'string' }),
	endDate: timestamp({ precision: 3, mode: 'string' }),
	status: projectStatus().default('active').notNull(),
	createdAt: timestamp({ precision: 3, mode: 'string' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
	updatedAt: timestamp({ precision: 3, mode: 'string' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
	deletedAt: timestamp({ precision: 3, mode: 'string' }),
}, (table) => [
	foreignKey({
			columns: [table.organizationId],
			foreignColumns: [organization.id],
			name: "projects_organizationId_fkey"
		}).onUpdate("cascade").onDelete("cascade"),
]);

export const userPreferences = pgTable("user_preferences", {
	id: text().primaryKey().notNull(),
	userId: text().notNull(),
	timezone: text().default('auto').notNull(),
	dateFormat: text().default('MMM D, YYYY').notNull(),
	timeFormat: text().default('h:mm a').notNull(),
	createdAt: timestamp({ precision: 3, mode: 'string' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
	updatedAt: timestamp({ precision: 3, mode: 'string' }).notNull(),
}, (table) => [
	uniqueIndex("user_preferences_userId_key").using("btree", table.userId.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [user.id],
			name: "user_preferences_userId_fkey"
		}).onUpdate("cascade").onDelete("cascade"),
]);

export const twoFactor = pgTable("two_factor", {
	id: text('id').primaryKey(),
	secret: text('secret').notNull(),
	backupCodes: text('backup_codes').notNull(),
	userId: text('user_id').notNull().references(() => user.id, { onDelete: 'cascade' }),
});

export const session = pgTable("session", {
	id: text().primaryKey().notNull(),
	expiresAt: timestamp({ precision: 3, mode: 'string' }).notNull(),
	token: text().notNull(),
	createdAt: timestamp({ precision: 3, mode: 'string' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
	updatedAt: timestamp({ precision: 3, mode: 'string' }).notNull(),
	ipAddress: text(),
	userAgent: text(),
	userId: text(),
	activeOrganizationId: text('active_organization_id'),
}, (table) => [
	uniqueIndex("session_token_key").using("btree", table.token.asc().nullsLast().op("text_ops")),
	index("session_userId_idx").using("btree", table.userId.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [user.id],
			name: "session_userId_fkey"
		}).onUpdate("cascade").onDelete("cascade"),
]);

export const auditLogs = pgTable("audit_logs", {
	id: text().primaryKey().notNull(),
	action: text().notNull(),
	resourceType: text().notNull(),
	resourceId: text().notNull(),
	details: jsonb(),
	ipAddress: text(),
	userAgent: text(),
	userId: text(),
	createdAt: timestamp({ precision: 3, mode: 'string' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
}, (table) => [
	index("audit_logs_resourceType_resourceId_idx").using("btree", table.resourceType.asc().nullsLast().op("text_ops"), table.resourceId.asc().nullsLast().op("text_ops")),
	index("audit_logs_userId_idx").using("btree", table.userId.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [user.id],
			name: "audit_logs_userId_fkey"
		}).onUpdate("cascade").onDelete("set null"),
]);

export const domains = pgTable("domains", {
	id: text().primaryKey().notNull(),
	name: text().notNull(),
	verificationStatus: verificationStatus().default('PENDING').notNull(),
	verificationToken: text(),
	verifiedAt: timestamp({ precision: 3, mode: 'string' }),
	userId: text(),
	projectId: text(),
	organizationId: text('organization_id').references(() => organization.id, { onDelete: 'cascade' }),
	dnsRecords: jsonb(),
	createdAt: timestamp({ precision: 3, mode: 'string' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
	updatedAt: timestamp({ precision: 3, mode: 'string' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
	deletedAt: timestamp({ precision: 3, mode: 'string' }),
}, (table) => [
	uniqueIndex("domains_name_key").using("btree", table.name.asc().nullsLast().op("text_ops")),
	index("domains_projectId_idx").using("btree", table.projectId.asc().nullsLast().op("text_ops")),
	index("domains_userId_idx").using("btree", table.userId.asc().nullsLast().op("text_ops")),
	uniqueIndex("domains_verificationToken_key").using("btree", table.verificationToken.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [user.id],
			name: "domains_userId_fkey"
		}).onUpdate("cascade").onDelete("set null"),
	foreignKey({
			columns: [table.projectId],
			foreignColumns: [projects.id],
			name: "domains_projectId_fkey"
		}).onUpdate("cascade").onDelete("set null"),
	foreignKey({
			columns: [table.organizationId],
			foreignColumns: [organization.id],
			name: "domains_organizationId_fkey"
		}).onUpdate("cascade").onDelete("cascade"),
]);

export const funnelDefinitions = pgTable("funnel_definitions", {
	id: text().primaryKey().notNull(),
	websiteId: text().notNull(),
	name: text().notNull(),
	description: text(),
	steps: jsonb().notNull(), // Array of step definitions with type, target, conditions
	isActive: boolean().default(true).notNull(),
	createdBy: text().notNull(),
	createdAt: timestamp({ precision: 3, mode: 'string' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
	updatedAt: timestamp({ precision: 3, mode: 'string' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
	deletedAt: timestamp({ precision: 3, mode: 'string' }),
}, (table) => [
	index("funnel_definitions_websiteId_idx").using("btree", table.websiteId.asc().nullsLast().op("text_ops")),
	index("funnel_definitions_createdBy_idx").using("btree", table.createdBy.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.websiteId],
			foreignColumns: [websites.id],
			name: "funnel_definitions_websiteId_fkey"
		}).onUpdate("cascade").onDelete("cascade"),
	foreignKey({
			columns: [table.createdBy],
			foreignColumns: [user.id],
			name: "funnel_definitions_createdBy_fkey"
		}).onUpdate("cascade").onDelete("restrict"),
]);

export const funnelGoals = pgTable("funnel_goals", {
	id: text().primaryKey().notNull(),
	funnelId: text().notNull(),
	goalType: funnelGoalType().notNull(),
	targetValue: text(), // Flexible - could be percentage, count, duration
	description: text(),
	isActive: boolean().default(true).notNull(),
	createdAt: timestamp({ precision: 3, mode: 'string' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
	updatedAt: timestamp({ precision: 3, mode: 'string' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
}, (table) => [
	index("funnel_goals_funnelId_idx").using("btree", table.funnelId.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.funnelId],
			foreignColumns: [funnelDefinitions.id],
			name: "funnel_goals_funnelId_fkey"
		}).onUpdate("cascade").onDelete("cascade"),
]);

export const apikey = pgTable("apikey", {
	id: text('id').primaryKey(),
	name: text('name'),
	start: text('start'),
	prefix: text('prefix'),
	key: text('key').notNull(),
	userId: text('user_id').notNull().references(() => user.id, { onDelete: 'cascade' }),
	refillInterval: integer('refill_interval'),
	refillAmount: integer('refill_amount'),
	lastRefillAt: timestamp('last_refill_at'),
	enabled: boolean('enabled').default(true),
	rateLimitEnabled: boolean('rate_limit_enabled').default(true),
	rateLimitTimeWindow: integer('rate_limit_time_window').default(86400000),
	rateLimitMax: integer('rate_limit_max').default(10),
	requestCount: integer('request_count'),
	remaining: integer('remaining'),
	lastRequest: timestamp('last_request'),
	expiresAt: timestamp('expires_at'),
	createdAt: timestamp('created_at').notNull(),
	updatedAt: timestamp('updated_at').notNull(),
	permissions: text('permissions'),
	metadata: text('metadata'),
});

export const organization = pgTable("organization", {
	id: text('id').primaryKey(),
	name: text('name').notNull(),
	slug: text('slug').unique(),
	logo: text('logo'),
	createdAt: timestamp('created_at').notNull(),
	metadata: text('metadata'),
});

export const member = pgTable("member", {
	id: text('id').primaryKey(),
	organizationId: text('organization_id').notNull().references(() => organization.id, { onDelete: 'cascade' }),
	userId: text('user_id').notNull().references(() => user.id, { onDelete: 'cascade' }),
	role: text('role').default('member').notNull(),
	teamId: text('team_id'),
	createdAt: timestamp('created_at').notNull(),
});

export const invitation = pgTable("invitation", {
	id: text('id').primaryKey(),
	organizationId: text('organization_id').notNull().references(() => organization.id, { onDelete: 'cascade' }),
	email: text('email').notNull(),
	role: text('role').default('member'),
	teamId: text('team_id'),
	status: text('status').default('pending').notNull(),
	expiresAt: timestamp('expires_at').notNull(),
	inviterId: text('inviter_id').notNull().references(() => user.id, { onDelete: 'cascade' }),
});

export const team = pgTable("team", {
	id: text('id').primaryKey(),
	name: text('name').notNull(),
	organizationId: text('organization_id').notNull().references(() => organization.id, { onDelete: 'cascade' }),
	createdAt: timestamp('created_at').notNull(),
	updatedAt: timestamp('updated_at'),
});
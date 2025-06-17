import { websites, user, domains, projects, organization } from "@databuddy/db";

export type WebsiteType = typeof websites.$inferSelect;
export type CreateWebsiteType = typeof websites.$inferInsert;

export type UserType = typeof user.$inferSelect;
export type CreateUserType = typeof user.$inferInsert;

export type DomainType = typeof domains.$inferSelect;
export type CreateDomainType = typeof domains.$inferInsert;

export type ProjectType = typeof projects.$inferSelect;
export type CreateProjectType = typeof projects.$inferInsert;

export type OrganizationType = typeof organization.$inferSelect;
export type CreateOrganizationType = typeof organization.$inferInsert;
import { relations } from 'drizzle-orm/relations';
import {
  account,
  apikey,
  auditLogs,
  eventMeta,
  funnelDefinitions,
  funnelGoals,
  invitation,
  member,
  organization,
  projects,
  session,
  subscriptions,
  team,
  twoFactor,
  user,
  userPreferences,
  websites,
} from './schema';

export const auditLogsRelations = relations(auditLogs, ({ one }) => ({
  user: one(user, {
    fields: [auditLogs.userId],
    references: [user.id],
  }),
}));

export const userRelations = relations(user, ({ many }) => ({
  auditLogs: many(auditLogs),
  accounts: many(account),
  subscriptions: many(subscriptions),
  sessions: many(session),
  invitations: many(invitation),
  members: many(member),
  twoFactors: many(twoFactor),
  userPreferences: many(userPreferences),
  websites: many(websites),
  funnelDefinitions: many(funnelDefinitions),
  apikeys: many(apikey),
}));

export const projectsRelations = relations(projects, ({ one, many }) => ({
  eventMetas: many(eventMeta),
  organization_organizationId: one(organization, {
    fields: [projects.organizationId],
    references: [organization.id],
    relationName: 'projects_organizationId_organization_id',
  }),
  websites: many(websites),
}));

export const organizationRelations = relations(organization, ({ many }) => ({
  projects_organizationId: many(projects, {
    relationName: 'projects_organizationId_organization_id',
  }),
  invitations: many(invitation),
  members: many(member),
  websites_organizationId: many(websites, {
    relationName: 'websites_organizationId_organization_id',
  }),
  teams: many(team),
}));

export const eventMetaRelations = relations(eventMeta, ({ one }) => ({
  project: one(projects, {
    fields: [eventMeta.projectId],
    references: [projects.id],
  }),
}));

export const accountRelations = relations(account, ({ one }) => ({
  user: one(user, {
    fields: [account.userId],
    references: [user.id],
  }),
}));

export const subscriptionsRelations = relations(subscriptions, ({ one }) => ({
  user: one(user, {
    fields: [subscriptions.createdByUserId],
    references: [user.id],
  }),
}));

export const sessionRelations = relations(session, ({ one }) => ({
  user: one(user, {
    fields: [session.userId],
    references: [user.id],
  }),
}));

export const invitationRelations = relations(invitation, ({ one }) => ({
  organization: one(organization, {
    fields: [invitation.organizationId],
    references: [organization.id],
  }),
  user: one(user, {
    fields: [invitation.inviterId],
    references: [user.id],
  }),
}));

export const memberRelations = relations(member, ({ one }) => ({
  organization: one(organization, {
    fields: [member.organizationId],
    references: [organization.id],
  }),
  user: one(user, {
    fields: [member.userId],
    references: [user.id],
  }),
}));

export const twoFactorRelations = relations(twoFactor, ({ one }) => ({
  user: one(user, {
    fields: [twoFactor.userId],
    references: [user.id],
  }),
}));

export const userPreferencesRelations = relations(
  userPreferences,
  ({ one }) => ({
    user: one(user, {
      fields: [userPreferences.userId],
      references: [user.id],
    }),
  })
);

export const websitesRelations = relations(websites, ({ one, many }) => ({
  user: one(user, {
    fields: [websites.userId],
    references: [user.id],
  }),
  project: one(projects, {
    fields: [websites.projectId],
    references: [projects.id],
  }),
  organization_organizationId: one(organization, {
    fields: [websites.organizationId],
    references: [organization.id],
    relationName: 'websites_organizationId_organization_id',
  }),
  funnelDefinitions: many(funnelDefinitions),
}));

export const funnelGoalsRelations = relations(funnelGoals, ({ one }) => ({
  funnelDefinition: one(funnelDefinitions, {
    fields: [funnelGoals.funnelId],
    references: [funnelDefinitions.id],
  }),
}));

export const funnelDefinitionsRelations = relations(
  funnelDefinitions,
  ({ one, many }) => ({
    funnelGoals: many(funnelGoals),
    website: one(websites, {
      fields: [funnelDefinitions.websiteId],
      references: [websites.id],
    }),
    user: one(user, {
      fields: [funnelDefinitions.createdBy],
      references: [user.id],
    }),
  })
);

export const teamRelations = relations(team, ({ one }) => ({
  organization: one(organization, {
    fields: [team.organizationId],
    references: [organization.id],
  }),
}));

export const apikeyRelations = relations(apikey, ({ one }) => ({
  user: one(user, {
    fields: [apikey.userId],
    references: [user.id],
  }),
}));

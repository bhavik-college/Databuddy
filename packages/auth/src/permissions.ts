import { createAccessControl } from "better-auth/plugins/access";
import { defaultStatements, ownerAc, adminAc, memberAc } from 'better-auth/plugins/organization/access';

const statement = {
    ...defaultStatements,

    project: ["create", "read", "update", "delete", "archive", "change_status"],

    website: ["create", "read", "update", "delete", "configure", "view_analytics", "manage_tracking"],

    domain: ["create", "read", "update", "delete", "verify", "configure_dns"],

    subscription: ["read", "update", "cancel", "manage_billing", "view_usage"],

    analytics: ["read", "export", "configure_events", "view_funnels", "manage_goals"],

    funnel: ["create", "read", "update", "delete", "configure_goals"],

    apikey: ["create", "read", "update", "delete", "regenerate"],

    audit: ["read"],

    preferences: ["read", "update"],

    invitation: ["create", "cancel"],
} as const;

const ac = createAccessControl(statement);

const viewer = ac.newRole({
    project: ["read"],
    website: ["read", "view_analytics"],
    domain: ["read"],
    analytics: ["read"],
    subscription: ["read"],
    funnel: ["read"],
    audit: ["read"],
    preferences: ["read", "update"],
    // No invitation permissions for viewers
});

const member = ac.newRole({
    project: ["create", "read", "update", "change_status"],
    website: ["create", "read", "update", "configure", "view_analytics", "manage_tracking"],
    domain: ["create", "read", "update", "verify", "configure_dns"],
    analytics: ["read", "export", "configure_events", "view_funnels"],
    funnel: ["create", "read", "update", "configure_goals"],
    subscription: ["read", "view_usage"],
    apikey: ["create", "read", "update", "delete"],
    audit: ["read"],
    preferences: ["read", "update"],
    ...memberAc.statements,
});

const admin = ac.newRole({
    project: ["create", "read", "update", "delete", "archive", "change_status"],
    website: ["create", "read", "update", "delete", "configure", "view_analytics", "manage_tracking"],
    domain: ["create", "read", "update", "delete", "verify", "configure_dns"],
    analytics: ["read", "export", "configure_events", "view_funnels", "manage_goals"],
    funnel: ["create", "read", "update", "delete", "configure_goals"],
    subscription: ["read", "view_usage"],
    apikey: ["create", "read", "update", "delete", "regenerate"],
    audit: ["read"],
    preferences: ["read", "update"],
    invitation: ["create", "cancel"],
    ...adminAc.statements,
});

const owner = ac.newRole({
    project: ["create", "read", "update", "delete", "archive", "change_status"],
    website: ["create", "read", "update", "delete", "configure", "view_analytics", "manage_tracking"],
    domain: ["create", "read", "update", "delete", "verify", "configure_dns"],
    analytics: ["read", "export", "configure_events", "view_funnels", "manage_goals"],
    funnel: ["create", "read", "update", "delete", "configure_goals"],
    subscription: ["read", "update", "cancel", "manage_billing", "view_usage"],
    apikey: ["create", "read", "update", "delete", "regenerate"],
    audit: ["read"],
    preferences: ["read", "update"],
    invitation: ["create", "cancel"],
    ...ownerAc.statements,
});

export { ac, owner, admin, member, viewer };

export const canManageProjects = (role: string) => {
    return ["owner", "admin"].includes(role);
};

export const canManageBilling = (role: string) => {
    return ["owner"].includes(role);
};

export const canInviteMembers = (role: string) => {
    return ["owner", "admin"].includes(role);
};

export const canViewAnalytics = (role: string) => {
    return ["owner", "admin", "member", "viewer", "developer"].includes(role);
};

export const canManageWebsites = (role: string) => {
    return ["owner", "admin", "member"].includes(role);
}; 
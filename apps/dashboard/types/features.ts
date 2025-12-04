/**
 * Plan tiers - ordered from lowest to highest
 */
export const PLAN_IDS = {
    FREE: "free",
    HOBBY: "hobby",
    PRO: "pro",
    SCALE: "scale",
} as const;

export type PlanId = (typeof PLAN_IDS)[keyof typeof PLAN_IDS];

/** Plan tier hierarchy (index = tier level, higher = more features) */
export const PLAN_HIERARCHY: PlanId[] = [
    PLAN_IDS.FREE,
    PLAN_IDS.HOBBY,
    PLAN_IDS.PRO,
    PLAN_IDS.SCALE,
];

/** Usage-based features tracked by Autumn billing */
export const FEATURE_IDS = {
    EVENTS: "events",
    ASSISTANT_MESSAGES: "assistant_message",
} as const;

export type FeatureId = (typeof FEATURE_IDS)[keyof typeof FEATURE_IDS];

/** Gated features - locked behind specific plans (not usage-based) */
export const GATED_FEATURES = {
    // Product Analytics
    FUNNELS: "funnels",
    GOALS: "goals",
    RETENTION: "retention",
    USERS: "users",
    FEATURE_FLAGS: "feature_flags",
    // Web Analytics
    WEB_VITALS: "web_vitals",
    ERROR_TRACKING: "error_tracking",
    GEOGRAPHIC: "geographic",
    // AI
    AI_ASSISTANT: "ai_assistant",
    // Export & API
    DATA_EXPORT: "data_export",
    API_ACCESS: "api_access",
    // Enterprise
    SSO: "sso",
    TEAM_ROLES: "team_roles",
} as const;

export type GatedFeatureId =
    (typeof GATED_FEATURES)[keyof typeof GATED_FEATURES];

/**
 * Plan feature matrix - edit this to control which features are enabled per plan
 */
export const PLAN_FEATURES: Record<PlanId, Record<GatedFeatureId, boolean>> = {
    [PLAN_IDS.FREE]: {
        [GATED_FEATURES.FUNNELS]: false,
        [GATED_FEATURES.GOALS]: false,
        [GATED_FEATURES.RETENTION]: false,
        [GATED_FEATURES.USERS]: true,
        [GATED_FEATURES.FEATURE_FLAGS]: false,
        [GATED_FEATURES.WEB_VITALS]: true,
        [GATED_FEATURES.ERROR_TRACKING]: false,
        [GATED_FEATURES.GEOGRAPHIC]: true,
        [GATED_FEATURES.AI_ASSISTANT]: true,
        [GATED_FEATURES.DATA_EXPORT]: false,
        [GATED_FEATURES.API_ACCESS]: false,
        [GATED_FEATURES.SSO]: false,
        [GATED_FEATURES.TEAM_ROLES]: false,
    },
    [PLAN_IDS.HOBBY]: {
        [GATED_FEATURES.FUNNELS]: false,
        [GATED_FEATURES.GOALS]: true,
        [GATED_FEATURES.RETENTION]: true,
        [GATED_FEATURES.USERS]: true,
        [GATED_FEATURES.FEATURE_FLAGS]: false,
        [GATED_FEATURES.WEB_VITALS]: true,
        [GATED_FEATURES.ERROR_TRACKING]: true,
        [GATED_FEATURES.GEOGRAPHIC]: true,
        [GATED_FEATURES.AI_ASSISTANT]: true,
        [GATED_FEATURES.DATA_EXPORT]: true,
        [GATED_FEATURES.API_ACCESS]: false,
        [GATED_FEATURES.SSO]: false,
        [GATED_FEATURES.TEAM_ROLES]: false,
    },
    [PLAN_IDS.PRO]: {
        [GATED_FEATURES.FUNNELS]: true,
        [GATED_FEATURES.GOALS]: true,
        [GATED_FEATURES.RETENTION]: true,
        [GATED_FEATURES.USERS]: true,
        [GATED_FEATURES.FEATURE_FLAGS]: true,
        [GATED_FEATURES.WEB_VITALS]: true,
        [GATED_FEATURES.ERROR_TRACKING]: true,
        [GATED_FEATURES.GEOGRAPHIC]: true,
        [GATED_FEATURES.AI_ASSISTANT]: true,
        [GATED_FEATURES.DATA_EXPORT]: true,
        [GATED_FEATURES.API_ACCESS]: true,
        [GATED_FEATURES.SSO]: false,
        [GATED_FEATURES.TEAM_ROLES]: true,
    },
    [PLAN_IDS.SCALE]: {
        [GATED_FEATURES.FUNNELS]: true,
        [GATED_FEATURES.GOALS]: true,
        [GATED_FEATURES.RETENTION]: true,
        [GATED_FEATURES.USERS]: true,
        [GATED_FEATURES.FEATURE_FLAGS]: true,
        [GATED_FEATURES.WEB_VITALS]: true,
        [GATED_FEATURES.ERROR_TRACKING]: true,
        [GATED_FEATURES.GEOGRAPHIC]: true,
        [GATED_FEATURES.AI_ASSISTANT]: true,
        [GATED_FEATURES.DATA_EXPORT]: true,
        [GATED_FEATURES.API_ACCESS]: true,
        [GATED_FEATURES.SSO]: true,
        [GATED_FEATURES.TEAM_ROLES]: true,
    },
};

interface FeatureMeta {
    name: string;
    description: string;
    upgradeMessage: string;
    minPlan?: PlanId;
}

/** Feature metadata for UI display */
export const FEATURE_METADATA: Record<FeatureId | GatedFeatureId, FeatureMeta> =
{
    // Usage-based
    [FEATURE_IDS.EVENTS]: {
        name: "Events",
        description: "Track pageviews and custom events",
        upgradeMessage: "Upgrade to track more events",
    },
    [FEATURE_IDS.ASSISTANT_MESSAGES]: {
        name: "AI Messages",
        description: "Chat with your analytics assistant",
        upgradeMessage: "Upgrade for more AI messages",
    },
    // Product Analytics
    [GATED_FEATURES.FUNNELS]: {
        name: "Funnels",
        description: "Create conversion funnels to track user flows",
        upgradeMessage: "Upgrade to Pro to create funnels",
        minPlan: PLAN_IDS.PRO,
    },
    [GATED_FEATURES.GOALS]: {
        name: "Goals",
        description: "Set and track conversion goals",
        upgradeMessage: "Upgrade to Hobby to create goals",
        minPlan: PLAN_IDS.HOBBY,
    },
    [GATED_FEATURES.RETENTION]: {
        name: "Retention",
        description: "Analyze user retention over time",
        upgradeMessage: "Upgrade to Hobby for retention analysis",
        minPlan: PLAN_IDS.HOBBY,
    },
    [GATED_FEATURES.USERS]: {
        name: "Users",
        description: "Track individual user behavior and sessions",
        upgradeMessage: "Users is available on all plans",
    },
    [GATED_FEATURES.FEATURE_FLAGS]: {
        name: "Feature Flags",
        description: "Control feature rollouts with targeting rules",
        upgradeMessage: "Upgrade to Pro for feature flags",
        minPlan: PLAN_IDS.PRO,
    },
    // Web Analytics
    [GATED_FEATURES.WEB_VITALS]: {
        name: "Web Vitals",
        description: "Monitor Core Web Vitals and performance",
        upgradeMessage: "Web Vitals is available on all plans",
    },
    [GATED_FEATURES.ERROR_TRACKING]: {
        name: "Error Tracking",
        description: "Capture and analyze JavaScript errors",
        upgradeMessage: "Error tracking is available on all plans",
        minPlan: PLAN_IDS.HOBBY,
    },
    [GATED_FEATURES.GEOGRAPHIC]: {
        name: "Geographic",
        description: "View visitor locations on a map",
        upgradeMessage: "Geographic is available on all plans",
    },
    // AI
    [GATED_FEATURES.AI_ASSISTANT]: {
        name: "AI Assistant",
        description: "Chat-based analytics assistant",
        upgradeMessage: "AI Assistant is available on all plans",
    },
    // Export & API
    [GATED_FEATURES.DATA_EXPORT]: {
        name: "Data Export",
        description: "Export your analytics data to CSV or JSON",
        upgradeMessage: "Upgrade to Hobby to export data",
        minPlan: PLAN_IDS.HOBBY,
    },
    [GATED_FEATURES.API_ACCESS]: {
        name: "API Access",
        description: "Access your analytics data via REST API",
        upgradeMessage: "Upgrade to Pro for API access",
        minPlan: PLAN_IDS.PRO,
    },
    // Enterprise
    [GATED_FEATURES.SSO]: {
        name: "Single Sign-On",
        description: "SAML/OIDC enterprise authentication",
        upgradeMessage: "Upgrade to Scale for SSO",
        minPlan: PLAN_IDS.SCALE,
    },
    [GATED_FEATURES.TEAM_ROLES]: {
        name: "Team Roles",
        description: "Assign roles and permissions to team members",
        upgradeMessage: "Upgrade to Pro for team roles",
        minPlan: PLAN_IDS.PRO,
    },
};

/** Check if a plan has access to a gated feature */
export function isPlanFeatureEnabled(
    planId: PlanId | string | null,
    feature: GatedFeatureId
): boolean {
    const plan = (planId ?? PLAN_IDS.FREE) as PlanId;
    return PLAN_FEATURES[plan]?.[feature] ?? false;
}

/** Get the minimum plan required for a feature */
export function getMinimumPlanForFeature(
    feature: GatedFeatureId
): PlanId | null {
    for (const plan of PLAN_HIERARCHY) {
        if (PLAN_FEATURES[plan][feature]) {
            return plan;
        }
    }
    return null;
}

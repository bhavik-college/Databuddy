import { WarningCircleIcon, TrendUpIcon, UsersIcon, ActivityIcon } from "@phosphor-icons/react";
import { StatCard } from "@/components/analytics/stat-card";
import type { ErrorSummary } from "./types";

interface ErrorSummaryStatsProps {
    errorSummary: ErrorSummary;
    isLoading: boolean;
}

export const ErrorSummaryStats = ({ errorSummary, isLoading }: ErrorSummaryStatsProps) => {
    return (
        <div className="grid grid-cols-2 gap-3">
            <StatCard
                title="Total Errors"
                value={errorSummary.totalErrors.toLocaleString()}
                icon={WarningCircleIcon}
                isLoading={isLoading}
                variant="danger"
                description="All error occurrences"
            />
            <StatCard
                title="Error Rate"
                value={`${errorSummary.errorRate.toFixed(2)}%`}
                icon={TrendUpIcon}
                isLoading={isLoading}
                variant="danger"
                description="Error sessions"
            />
            <StatCard
                title="Affected Users"
                value={errorSummary.affectedUsers.toLocaleString()}
                icon={UsersIcon}
                isLoading={isLoading}
                variant="warning"
                description="Unique users with errors"
            />
            <StatCard
                title="Affected Sessions"
                value={errorSummary.affectedSessions.toLocaleString()}
                icon={ActivityIcon}
                isLoading={isLoading}
                variant="warning"
                description="Unique sessions with errors"
            />
        </div>
    );
}; 
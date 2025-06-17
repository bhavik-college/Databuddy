import { BugIcon, WarningCircleIcon, UsersIcon } from "@phosphor-icons/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface TopErrorCardProps {
    topError: {
        name: string;
        total_occurrences: number;
        affected_users: number;
    } | null;
}

export const TopErrorCard = ({ topError }: TopErrorCardProps) => {
    if (!topError) return null;

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                    <BugIcon size={16} weight="duotone" className="h-5 w-5 text-yellow-500" />
                    Most Frequent Error
                </CardTitle>
            </CardHeader>
            <CardContent>
                <p className="text-sm font-medium line-clamp-2" title={topError.name}>
                    {topError.name}
                </p>
                <div className="flex items-center justify-between text-xs text-muted-foreground mt-3">
                    <span className="flex items-center gap-1 font-semibold">
                        <WarningCircleIcon size={16} weight="duotone" className="h-3 w-3" />
                        {topError.total_occurrences.toLocaleString()} times
                    </span>
                    <span className="flex items-center gap-1">
                        <UsersIcon size={16} weight="duotone" className="h-3 w-3" />
                        {topError.affected_users.toLocaleString()} users
                    </span>
                </div>
            </CardContent>
        </Card>
    );
}; 
"use client";

import { TeamView } from "./team-view";

export function TeamsTab({ organization }: { organization: any }) {
  if (!(organization && organization.id)) {
    return (
      <div className="rounded border py-12 text-center">
        <p className="text-muted-foreground">
          Please select an active organization to manage teams.
        </p>
      </div>
    );
  }

  return <TeamView organization={organization} />;
}

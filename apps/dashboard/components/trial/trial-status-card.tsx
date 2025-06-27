import { CrownIcon, SparkleIcon, XIcon } from "@phosphor-icons/react";
import { Card, CardContent } from "@/components/ui/card";

export function TrialStatusCard() {
  return (
    <Card className="relative mb-3 overflow-hidden rounded border-amber-200 bg-gradient-to-r from-amber-50 to-orange-50 dark:border-amber-800/30 dark:from-amber-950/20 dark:to-orange-950/20">
      {/* Background decoration */}
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-amber-100/30 to-transparent dark:from-transparent dark:via-amber-400/5 dark:to-transparent" />

      <CardContent className="relative p-3">
        <div className="flex items-center gap-3">
          {/* Icon */}
          <div className="flex-shrink-0 rounded-full bg-amber-100 p-2 dark:bg-amber-900/30">
            <CrownIcon
              className="h-4 w-4 text-amber-600 dark:text-amber-400"
              size={16}
              weight="fill"
            />
          </div>

          {/* Content */}
          <div className="min-w-0 flex-1">
            <div className="mb-1 flex items-center gap-2">
              <h3 className="font-semibold text-amber-900 text-sm dark:text-amber-100">
                Pro Plan Free Trial
              </h3>
              <SparkleIcon
                className="h-4 w-4 text-amber-500 dark:text-amber-400"
                size={16}
                weight="fill"
              />
            </div>
            <p className="text-amber-700 text-xs dark:text-amber-200">
              You're currently enjoying all Pro features free for{" "}
              <span className="font-medium">3 months</span>.
              <span className="hidden sm:inline">
                {" "}
                Track unlimited websites and get advanced analytics.
              </span>
            </p>
          </div>

          {/* CTA and Close */}
          <div className="flex flex-shrink-0 items-center gap-2">
            {/* <Link href="/pricing">
                <Button 
                size="sm" 
                variant="outline"
                disabled
                className="h-7 px-3 text-xs border-amber-300 text-amber-700 hover:bg-amber-100 dark:border-amber-700 dark:text-amber-300 dark:hover:bg-amber-900/30"
                >
                View Plans
                </Button>
            </Link> */}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

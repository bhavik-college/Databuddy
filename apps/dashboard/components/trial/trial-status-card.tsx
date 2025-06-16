import { CrownIcon, XIcon, SparkleIcon } from "@phosphor-icons/react";
import { Card, CardContent } from "@/components/ui/card";


export function TrialStatusCard() {

  return (
    <Card className="mb-3 border-amber-200 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/20 dark:to-orange-950/20 dark:border-amber-800/30 relative overflow-hidden rounded">
      {/* Background decoration */}
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-amber-100/30 to-transparent dark:from-transparent dark:via-amber-400/5 dark:to-transparent" />

      <CardContent className="relative p-3">
        <div className="flex items-center gap-3">
          {/* Icon */}
          <div className="p-2 bg-amber-100 dark:bg-amber-900/30 rounded-full flex-shrink-0">
            <CrownIcon size={16} weight="fill" className="h-4 w-4 text-amber-600 dark:text-amber-400" />
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="text-sm font-semibold text-amber-900 dark:text-amber-100">
                Pro Plan Free Trial
              </h3>
              <SparkleIcon size={16} weight="fill" className="h-4 w-4 text-amber-500 dark:text-amber-400" />
            </div>
            <p className="text-xs text-amber-700 dark:text-amber-200">
              You're currently enjoying all Pro features free for <span className="font-medium">3 months</span>.
              <span className="hidden sm:inline"> Track unlimited websites and get advanced analytics.</span>
            </p>
          </div>

          {/* CTA and Close */}
          <div className="flex items-center gap-2 flex-shrink-0">
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
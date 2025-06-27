"use client";

import {
  CalendarIcon,
  CodeIcon,
  MapPinIcon,
  TerminalIcon,
  UserIcon,
  WarningCircleIcon,
} from "@phosphor-icons/react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getDeviceIcon, getErrorTypeIcon } from "./error-icons";
import type { ProcessedError } from "./types";
import { getSeverityColor, safeFormatDate } from "./utils";

interface RecentErrorsListProps {
  processedRecentErrors: ProcessedError[];
}

export const RecentErrorsList = ({ processedRecentErrors }: RecentErrorsListProps) => {
  if (!processedRecentErrors.length) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Error Types</CardTitle>
        <CardDescription>
          Latest error occurrences grouped by type. Click to see details.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Accordion className="w-full" collapsible type="single">
          {processedRecentErrors.slice(0, 15).map((error, index) => (
            <AccordionItem key={`${error.error_message}-${index}`} value={`item-${index}`}>
              <AccordionTrigger className="rounded-md p-3 text-left transition-colors hover:bg-muted/50">
                <div className="flex w-full items-start gap-3">
                  <div className="mt-1">{getErrorTypeIcon(error.error_type)}</div>
                  <div className="min-w-0 flex-1">
                    <div className="mb-1 flex items-center gap-2">
                      <Badge className={getSeverityColor(error.severity)}>{error.error_type}</Badge>
                      <Badge className="text-xs" variant="outline">
                        {error.category}
                      </Badge>
                    </div>
                    <p className="line-clamp-1 text-muted-foreground text-sm">
                      {error.error_message}
                    </p>
                    <div className="mt-1 flex items-center gap-3 text-muted-foreground text-xs">
                      <span className="flex items-center gap-1">
                        <WarningCircleIcon className="h-3 w-3" size={16} weight="duotone" />
                        {error.count}
                      </span>
                      <span className="flex items-center gap-1">
                        <UserIcon className="h-3 w-3" size={16} weight="duotone" />
                        {error.unique_sessions}
                      </span>
                      <span className="flex items-center gap-1">
                        <CalendarIcon className="h-3 w-3" size={16} weight="duotone" />
                        {safeFormatDate(error.last_occurrence, "MMM d, HH:mm")}
                      </span>
                    </div>
                  </div>
                  <div className="ml-4 text-right">
                    <div className="font-semibold text-sm">{error.count}</div>
                    <div className="text-muted-foreground text-xs">errors</div>
                  </div>
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <div className="space-y-4 border-t p-4">
                  {/* Error Message */}
                  <Card className="p-3">
                    <h4 className="mb-2 flex items-center gap-2 font-medium text-sm">
                      <CodeIcon className="h-4 w-4" size={16} weight="duotone" />
                      Full Error Message
                    </h4>
                    <div className="rounded-md bg-muted/50 p-3">
                      <p className="break-words font-mono text-sm">
                        {error.sample_error?.error_message || "No error message available"}
                      </p>
                    </div>
                  </Card>

                  {/* Stack Trace */}
                  {error.sample_error?.error_stack && (
                    <Card className="p-3">
                      <h4 className="mb-2 flex items-center gap-2 font-medium text-sm">
                        <TerminalIcon className="h-4 w-4" size={16} weight="duotone" />
                        Stack Trace
                      </h4>
                      <div className="max-h-60 overflow-y-auto rounded-md bg-muted/50 p-3">
                        <pre className="whitespace-pre-wrap break-words font-mono text-xs">
                          {error.sample_error?.error_stack || "No stack trace available"}
                        </pre>
                      </div>
                    </Card>
                  )}

                  {/* Error Overview */}
                  <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                    <Card className="p-3">
                      <h4 className="mb-2 flex items-center gap-2 font-medium text-sm">
                        <WarningCircleIcon className="h-4 w-4" size={16} weight="duotone" />
                        Context
                      </h4>
                      <div className="space-y-2">
                        <div>
                          <div className="mb-0.5 font-medium text-muted-foreground text-xs">
                            Last Seen
                          </div>
                          <p className="text-sm">
                            {safeFormatDate(error.sample_error?.time || "", "MMM d, yyyy HH:mm:ss")}
                          </p>
                        </div>
                        <div>
                          <div className="mb-0.5 font-medium text-muted-foreground text-xs">
                            Page URL
                          </div>
                          <p className="break-all text-sm">
                            {error.sample_error?.page_url || "Unknown"}
                          </p>
                        </div>
                      </div>
                    </Card>

                    <Card className="p-3">
                      <h4 className="mb-2 flex items-center gap-2 font-medium text-sm">
                        <UserIcon className="h-4 w-4" size={16} weight="duotone" />
                        User & Device
                      </h4>
                      <div className="space-y-2">
                        <div>
                          <div className="mb-0.5 font-medium text-muted-foreground text-xs">
                            User ID
                          </div>
                          <p className="font-mono text-sm">
                            {error.sample_error?.anonymous_id || "Unknown"}
                          </p>
                        </div>
                        <div>
                          <div className="mb-0.5 font-medium text-muted-foreground text-xs">
                            Device
                          </div>
                          <p className="flex items-center gap-1 text-sm">
                            {getDeviceIcon(error.sample_error?.device_type)}
                            {error.sample_error?.device_type || "Unknown"} •{" "}
                            {error.sample_error?.browser_name || "Unknown"} •{" "}
                            {error.sample_error?.os_name || "Unknown"}
                          </p>
                        </div>
                        <div>
                          <div className="mb-0.5 font-medium text-muted-foreground text-xs">
                            Location
                          </div>
                          <p className="flex items-center gap-1 text-sm">
                            <MapPinIcon className="h-3 w-3" size={16} weight="duotone" />
                            {error.sample_error?.city && error.sample_error?.country
                              ? `${error.sample_error?.city}, ${error.sample_error?.country}`
                              : error.sample_error?.country || "Unknown"}
                          </p>
                        </div>
                      </div>
                    </Card>
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </CardContent>
    </Card>
  );
};

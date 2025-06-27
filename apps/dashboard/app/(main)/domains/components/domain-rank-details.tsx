"use client";

import {
  ActivityIcon,
  ChartLineIcon,
  GlobeIcon,
  MedalIcon,
  TargetIcon,
  TrendUpIcon,
  UsersIcon,
} from "@phosphor-icons/react";
import type React from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { formatRank, getTierInfo } from "../utils";

// Use the correct type from the backend API
interface DomainRankData {
  status_code: number;
  error: string;
  page_rank_integer: number;
  page_rank_decimal: number;
  rank: string | null;
  domain: string;
}

interface DomainRankDetailsProps {
  isOpen: boolean;
  onClose: () => void;
  rankData: DomainRankData | null;
  domainName: string;
}

const StatCard = ({
  icon,
  title,
  value,
  subtitle,
  description,
  className = "",
}: {
  icon: React.ReactNode;
  title: string;
  value: string | number;
  subtitle?: string;
  description?: string;
  className?: string;
}) => (
  <Card className={className}>
    <CardContent className="p-3 sm:p-4">
      <div className="mb-2 flex items-start justify-between sm:mb-3">
        <div className="flex items-center gap-2">
          {icon}
          <span className="font-medium text-xs sm:text-sm">{title}</span>
        </div>
      </div>
      <div className="space-y-1">
        <div className="font-bold text-lg sm:text-2xl">{value}</div>
        {subtitle && <div className="text-muted-foreground text-xs sm:text-sm">{subtitle}</div>}
        {description && <div className="mt-2 text-muted-foreground text-xs">{description}</div>}
      </div>
    </CardContent>
  </Card>
);

const ScoreIndicator = ({ score, maxScore = 100 }: { score: number; maxScore?: number }) => {
  const percentage = (score / maxScore) * 100;
  const getColor = () => {
    if (percentage >= 80) return "bg-green-500";
    if (percentage >= 60) return "bg-blue-500";
    if (percentage >= 40) return "bg-yellow-500";
    if (percentage >= 20) return "bg-orange-500";
    return "bg-red-500";
  };

  return (
    <div className="relative mx-auto h-16 w-16 sm:h-24 sm:w-24">
      <svg className="-rotate-90 h-16 w-16 transform sm:h-24 sm:w-24" viewBox="0 0 36 36">
        <title>Domain Rank Score Indicator</title>
        <path
          className="text-muted/20"
          d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        />
        <path
          className={getColor()}
          d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
          fill="none"
          stroke="currentColor"
          strokeDasharray={`${percentage}, 100`}
          strokeWidth="2"
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="text-center">
          <div className="font-bold text-sm sm:text-xl">{score.toFixed(1)}</div>
          <div className="text-muted-foreground text-xs">/{maxScore}</div>
        </div>
      </div>
    </div>
  );
};

export function DomainRankDetails({
  isOpen,
  onClose,
  rankData,
  domainName,
}: DomainRankDetailsProps) {
  if (!rankData || rankData.status_code !== 200) {
    return (
      <Drawer onOpenChange={onClose} open={isOpen}>
        <DrawerContent className="max-h-[85vh]">
          <div className="mx-auto w-full max-w-4xl">
            <DrawerHeader className="px-4 text-center sm:px-6">
              <DrawerTitle className="flex items-center justify-center gap-2 text-lg sm:text-xl">
                <TrendUpIcon className="h-4 w-4 sm:h-5 sm:w-5" size={16} weight="fill" />
                Domain Rank Details
              </DrawerTitle>
              <DrawerDescription className="text-sm">
                Ranking data for <span className="font-medium font-mono">{domainName}</span>
              </DrawerDescription>
            </DrawerHeader>

            <div className="p-4 text-center sm:p-6">
              <div className="mb-4 text-muted-foreground">
                <GlobeIcon
                  className="mx-auto mb-4 h-12 w-12 opacity-30 sm:h-16 sm:w-16"
                  size={48}
                  weight="duotone"
                />
              </div>
              <h3 className="mb-2 font-medium text-base sm:text-lg">No Ranking Data Available</h3>
              <p className="mb-4 text-muted-foreground text-sm leading-relaxed">
                {rankData?.error ||
                  "Unable to retrieve ranking data for this domain. This may be because the domain is new, not indexed, or not publicly accessible."}
              </p>
              <Button onClick={onClose} variant="outline">
                Close
              </Button>
            </div>
          </div>
        </DrawerContent>
      </Drawer>
    );
  }

  const tierInfo = getTierInfo(rankData.page_rank_decimal);

  return (
    <Drawer onOpenChange={onClose} open={isOpen}>
      <DrawerContent className="max-h-[85vh]">
        <div className="mx-auto w-full max-w-4xl overflow-y-auto">
          <DrawerHeader className="px-4 text-center sm:px-6">
            <DrawerTitle className="flex items-center justify-center gap-2 text-lg sm:text-xl">
              <TrendUpIcon className="h-4 w-4 sm:h-5 sm:w-5" size={16} weight="fill" />
              Domain Rank Analysis
            </DrawerTitle>
            <DrawerDescription className="text-sm">
              Comprehensive ranking metrics for{" "}
              <span className="font-medium font-mono">{domainName}</span>
            </DrawerDescription>
          </DrawerHeader>

          <div className="space-y-4 p-4 sm:space-y-6 sm:p-6">
            {/* Hero Section with Score */}
            <Card className="relative overflow-hidden">
              <div className={`absolute inset-0 ${tierInfo.color} opacity-5`} />
              <CardContent className="relative p-4 text-center sm:p-8">
                <div className="mb-4 sm:mb-6">
                  <ScoreIndicator score={rankData.page_rank_decimal} />
                </div>
                <h2 className="mb-2 font-bold text-xl sm:text-3xl">
                  Domain Rank {rankData.page_rank_decimal.toFixed(1)}
                </h2>
                <Badge className={`${tierInfo.color} mb-2 text-white text-xs sm:mb-3 sm:text-sm`}>
                  {tierInfo.tier}
                </Badge>
                <p className="mx-auto max-w-md text-muted-foreground text-sm">
                  {tierInfo.description}
                </p>
              </CardContent>
            </Card>

            {/* Key Metrics Grid */}
            <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
              <StatCard
                description="Domain strength based on backlink profile analysis"
                icon={
                  <TargetIcon
                    className="h-3 w-3 text-blue-500 sm:h-4 sm:w-4"
                    size={12}
                    weight="fill"
                  />
                }
                subtitle="Authority score"
                title="Domain Authority"
                value={`${rankData.page_rank_decimal.toFixed(1)}/100`}
              />

              <StatCard
                description="Ranking among all indexed websites globally"
                icon={
                  <GlobeIcon
                    className="h-3 w-3 text-green-500 sm:h-4 sm:w-4"
                    size={12}
                    weight="fill"
                  />
                }
                subtitle="Worldwide position"
                title="Global Rank"
                value={`#${formatRank(rankData.rank)}`}
              />

              <StatCard
                description="Percentage-based authority measurement"
                icon={
                  <ChartLineIcon
                    className="h-3 w-3 text-purple-500 sm:h-4 sm:w-4"
                    size={12}
                    weight="fill"
                  />
                }
                subtitle="Domain strength"
                title="Authority Score"
                value={`${Math.round(rankData.page_rank_decimal)}%`}
              />

              <StatCard
                description="Domain is indexed and being tracked"
                icon={
                  <ActivityIcon
                    className="h-3 w-3 text-orange-500 sm:h-4 sm:w-4"
                    size={12}
                    weight="fill"
                  />
                }
                subtitle="Ranking available"
                title="Status"
                value="Active"
              />
            </div>

            {/* Detailed Breakdown */}
            <div className="grid grid-cols-1 gap-4 sm:gap-6 lg:grid-cols-2">
              {/* Score Breakdown */}
              <Card>
                <CardHeader className="pb-3 sm:pb-4">
                  <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                    <ChartLineIcon className="h-3 w-3 sm:h-4 sm:w-4" size={12} weight="fill" />
                    Score Breakdown
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 sm:space-y-4">
                  <div className="space-y-2 sm:space-y-3">
                    <div className="flex items-center justify-between text-sm">
                      <span>Domain Authority</span>
                      <span className="font-medium">
                        {rankData.page_rank_decimal.toFixed(1)}/100
                      </span>
                    </div>
                    <Progress className="h-2" value={Math.min(100, rankData.page_rank_decimal)} />
                  </div>

                  <Separator />

                  <div className="space-y-2 text-xs sm:text-sm">
                    <div className="flex justify-between">
                      <span>Precise Score:</span>
                      <span className="font-mono">{rankData.page_rank_decimal.toFixed(3)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Tier Classification:</span>
                      <Badge className="text-xs" variant="outline">
                        {tierInfo.tier}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Ranking Context */}
              <Card>
                <CardHeader className="pb-3 sm:pb-4">
                  <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                    <UsersIcon className="h-3 w-3 sm:h-4 sm:w-4" size={12} weight="fill" />
                    Ranking Context
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 sm:space-y-4">
                  <div className="rounded-lg bg-muted/50 p-3">
                    <div className="mb-1 font-medium text-xs sm:text-sm">Global Position</div>
                    <div className="font-bold text-xl sm:text-2xl">
                      #{formatRank(rankData.rank)}
                    </div>
                    <div className="text-muted-foreground text-xs">
                      Among all websites worldwide
                    </div>
                  </div>

                  <div className="space-y-1 text-muted-foreground text-xs">
                    <p>• Higher ranks indicate stronger backlink profiles</p>
                    <p>• Rankings are updated periodically based on crawl data</p>
                    <p>• Consider this alongside other SEO metrics</p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* What This Means */}
            <Card>
              <CardHeader className="pb-3 sm:pb-4">
                <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                  <MedalIcon className="h-3 w-3 sm:h-4 sm:w-4" size={12} weight="fill" />
                  Understanding Your Domain Rank
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 gap-4 text-xs sm:text-sm md:grid-cols-2">
                  <div>
                    <h4 className="mb-2 font-medium">What Domain Rank Measures:</h4>
                    <ul className="space-y-1 text-muted-foreground">
                      <li>• Strength of your backlink profile</li>
                      <li>• Quality and quantity of referring domains</li>
                      <li>• Authority passed through link equity</li>
                      <li>• Competitive position in your niche</li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="mb-2 font-medium">How to Improve:</h4>
                    <ul className="space-y-1 text-muted-foreground">
                      <li>• Earn high-quality backlinks from authoritative sites</li>
                      <li>• Create valuable, linkable content</li>
                      <li>• Build relationships with industry publications</li>
                      <li>• Focus on relevant, contextual link building</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Footer Actions */}
            <div className="flex flex-col gap-4 pt-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="text-center text-muted-foreground text-xs sm:text-left">
                Data provided by{" "}
                <a
                  className="underline"
                  href="https://www.domcop.com/openpagerank/what-is-openpagerank"
                  rel="noopener noreferrer"
                  target="_blank"
                >
                  OpenPageRank
                </a>{" "}
                • Updated periodically
              </div>
              <div className="flex justify-center gap-2 sm:justify-end">
                <Button className="w-full sm:w-auto" onClick={onClose} size="sm" variant="outline">
                  Close
                </Button>
              </div>
            </div>
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  );
}

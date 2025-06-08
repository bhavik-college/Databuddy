"use client";

import type React from 'react';
import { Drawer, DrawerContent, DrawerDescription, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Globe, TrendingUp, Target, Award, BarChart3, Users, Activity, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getTierInfo, formatRank } from '../utils';

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
  className = ""
}: { 
  icon: React.ReactNode; 
  title: string; 
  value: string | number; 
  subtitle?: string;
  description?: string;
  className?: string;
}) => (
  <Card className={className}>
    <CardContent className="p-4">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          {icon}
          <span className="text-sm font-medium">{title}</span>
        </div>
      </div>
      <div className="space-y-1">
        <div className="text-2xl font-bold">{value}</div>
        {subtitle && <div className="text-sm text-muted-foreground">{subtitle}</div>}
        {description && <div className="text-xs text-muted-foreground mt-2">{description}</div>}
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
    <div className="relative w-24 h-24 mx-auto">
      <svg className="w-24 h-24 transform -rotate-90" viewBox="0 0 36 36">
        <title>Domain Rank Score Indicator</title>
        <path
          d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          className="text-muted/20"
        />
        <path
          d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeDasharray={`${percentage}, 100`}
          className={getColor()}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="text-center">
          <div className="text-xl font-bold">{score.toFixed(1)}</div>
          <div className="text-xs text-muted-foreground">/{maxScore}</div>
        </div>
      </div>
    </div>
  );
};

export function DomainRankDetails({ isOpen, onClose, rankData, domainName }: DomainRankDetailsProps) {
  if (!rankData || rankData.status_code !== 200) {
    return (
      <Drawer open={isOpen} onOpenChange={onClose}>
        <DrawerContent className="max-h-[85vh]">
          <div className="mx-auto w-full max-w-4xl">
            <DrawerHeader className="text-center">
              <DrawerTitle className="flex items-center justify-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Domain Rank Details
              </DrawerTitle>
              <DrawerDescription>
                Ranking data for <span className="font-mono font-medium">{domainName}</span>
              </DrawerDescription>
            </DrawerHeader>
            
            <div className="p-6 text-center">
              <div className="text-muted-foreground mb-4">
                <Globe className="h-16 w-16 mx-auto mb-4 opacity-30" />
              </div>
              <h3 className="text-lg font-medium mb-2">No Ranking Data Available</h3>
              <p className="text-muted-foreground mb-4">
                {rankData?.error || "Unable to retrieve ranking data for this domain. This may be because the domain is new, not indexed, or not publicly accessible."}
              </p>
              <Button variant="outline" onClick={onClose}>Close</Button>
            </div>
          </div>
        </DrawerContent>
      </Drawer>
    );
  }

  const tierInfo = getTierInfo(rankData.page_rank_decimal);

  return (
    <Drawer open={isOpen} onOpenChange={onClose}>
      <DrawerContent className="max-h-[85vh]">
        <div className="mx-auto w-full max-w-4xl overflow-y-auto">
          <DrawerHeader className="text-center">
            <DrawerTitle className="flex items-center justify-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Domain Rank Analysis
            </DrawerTitle>
            <DrawerDescription>
              Comprehensive ranking metrics for <span className="font-mono font-medium">{domainName}</span>
            </DrawerDescription>
          </DrawerHeader>
          
          <div className="p-6 space-y-6">
            {/* Hero Section with Score */}
            <Card className="relative overflow-hidden">
              <div className={`absolute inset-0 ${tierInfo.color} opacity-5`} />
              <CardContent className="p-8 text-center relative">
                <div className="mb-6">
                  <ScoreIndicator score={rankData.page_rank_decimal} />
                </div>
                <h2 className="text-3xl font-bold mb-2">Domain Rank {rankData.page_rank_decimal.toFixed(1)}</h2>
                <Badge className={`${tierInfo.color} text-white mb-3`}>
                  {tierInfo.tier}
                </Badge>
                <p className="text-muted-foreground max-w-md mx-auto">
                  {tierInfo.description}
                </p>
              </CardContent>
            </Card>

            {/* Key Metrics Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard
                icon={<Target className="h-4 w-4 text-blue-500" />}
                title="Domain Authority"
                value={`${rankData.page_rank_decimal.toFixed(1)}/100`}
                subtitle="Authority score"
                description="Domain strength based on backlink profile analysis"
              />
              
              <StatCard
                icon={<Globe className="h-4 w-4 text-green-500" />}
                title="Global Rank"
                value={`#${formatRank(rankData.rank)}`}
                subtitle="Worldwide position"
                description="Ranking among all indexed websites globally"
              />
              
              <StatCard
                icon={<BarChart3 className="h-4 w-4 text-purple-500" />}
                title="Authority Score"
                value={`${Math.round(rankData.page_rank_decimal)}%`}
                subtitle="Domain strength"
                description="Percentage-based authority measurement"
              />
              
              <StatCard
                icon={<Activity className="h-4 w-4 text-orange-500" />}
                title="Status"
                value="Active"
                subtitle="Ranking available"
                description="Domain is indexed and being tracked"
              />
            </div>

            {/* Detailed Breakdown */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Score Breakdown */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-4 w-4" />
                    Score Breakdown
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Domain Authority</span>
                      <span className="font-medium">{rankData.page_rank_decimal.toFixed(1)}/100</span>
                    </div>
                    <Progress value={Math.min(100, rankData.page_rank_decimal)} className="h-2" />
                  </div>
                  
                  <Separator />
                  
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Precise Score:</span>
                      <span className="font-mono">{rankData.page_rank_decimal.toFixed(3)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Tier Classification:</span>
                      <Badge variant="outline">{tierInfo.tier}</Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Ranking Context */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    Ranking Context
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="p-3 bg-muted/50 rounded-lg">
                    <div className="text-sm font-medium mb-1">Global Position</div>
                    <div className="text-2xl font-bold">#{formatRank(rankData.rank)}</div>
                    <div className="text-xs text-muted-foreground">
                      Among all websites worldwide
                    </div>
                  </div>
                  
                  <div className="text-xs text-muted-foreground space-y-1">
                    <p>• Higher ranks indicate stronger backlink profiles</p>
                    <p>• Rankings are updated periodically based on crawl data</p>
                    <p>• Consider this alongside other SEO metrics</p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* What This Means */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Award className="h-4 w-4" />
                  Understanding Your Domain Rank
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <h4 className="font-medium mb-2">What Domain Rank Measures:</h4>
                    <ul className="space-y-1 text-muted-foreground">
                      <li>• Strength of your backlink profile</li>
                      <li>• Quality and quantity of referring domains</li>
                      <li>• Authority passed through link equity</li>
                      <li>• Competitive position in your niche</li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-medium mb-2">How to Improve:</h4>
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
            <div className="flex justify-between items-center pt-4">
              <div className="text-xs text-muted-foreground">
                Data provided by <a href="https://www.domcop.com/openpagerank/what-is-openpagerank" target="_blank" rel="noopener noreferrer" className="underline">OpenPageRank</a> • Updated periodically
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={onClose}>
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
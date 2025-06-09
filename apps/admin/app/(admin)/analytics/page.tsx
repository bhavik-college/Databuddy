import { getAnalyticsOverviewData } from "./actions";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription
} from "@/components/ui/card";
import {
  Users2,
  Globe2,
  Network,
  ShieldCheck,
  BarChart3,
  TrendingUp,
  Activity,
  Calendar,
  UserPlus,
  MapPin,
  Badge as BadgeIcon,
  ExternalLink,
  Zap,
  Clock,
  TrendingDown,
  Minus,
  ArrowUpRight,
  ArrowDownRight,
  RefreshCw
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import LineChart from "@/components/ui/line-chart";
import BarChart from "@/components/ui/bar-chart";
import BotRequestsWidget from '@/components/BotRequestsWidget';
import { formatDistanceToNow } from "date-fns";
import Link from "next/link";
import { getInitials } from "@/lib/utils";

function formatNumber(val: number | null | undefined) {
  if (typeof val !== 'number' || Number.isNaN(val)) return '0';

  if (val >= 1000000) {
    return `${(val / 1000000).toFixed(1)}M`;
  }
  if (val >= 1000) {
    return `${(val / 1000).toFixed(1)}K`;
  }
  return val.toLocaleString();
}

function formatLargeNumber(val: number | null | undefined) {
  if (typeof val !== 'number' || Number.isNaN(val)) return '0';
  return val.toLocaleString();
}

function getTrendIcon(trend: 'up' | 'down' | 'neutral') {
  switch (trend) {
    case 'up':
      return <ArrowUpRight className="h-3 w-3 text-green-500" />;
    case 'down':
      return <ArrowDownRight className="h-3 w-3 text-red-500" />;
    default:
      return <Minus className="h-3 w-3 text-muted-foreground" />;
  }
}

function MetricCard({
  icon: Icon,
  title,
  value,
  subtitle,
  trend = 'neutral',
  tooltip
}: {
  icon: any;
  title: string;
  value: number;
  subtitle: string;
  trend?: 'up' | 'down' | 'neutral';
  tooltip?: string;
}) {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Card className="hover:shadow-lg transition-all duration-300 hover:-translate-y-1 cursor-help">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <Icon className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <p className="text-xl font-bold">{formatNumber(value)}</p>
                    {getTrendIcon(trend)}
                  </div>
                  <p className="text-xs text-muted-foreground">{subtitle}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TooltipTrigger>
        {tooltip && (
          <TooltipContent>
            <p className="max-w-xs">{tooltip}</p>
          </TooltipContent>
        )}
      </Tooltip>
    </TooltipProvider>
  );
}

export default async function AdminAnalyticsOverviewPage() {
  const { data, error } = await getAnalyticsOverviewData();

  if (error || !data) {
    return (
      <div className="min-h-screen bg-background">
        <div className="space-y-4 max-w-7xl mx-auto p-4 sm:p-6">
          <div className="text-center py-8">
            <h1 className="text-2xl font-bold">Analytics Overview</h1>
            <p className="text-sm text-muted-foreground mt-1">Platform metrics and insights</p>
          </div>
          <Card className="shadow-lg">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-destructive text-base">
                <BarChart3 className="h-5 w-5" />
                Analytics Unavailable
              </CardTitle>
              <CardDescription>Could not load analytics data. Please try again later.</CardDescription>
            </CardHeader>
            {error && (
              <CardContent className="pt-0">
                <div className="bg-destructive/10 p-4 rounded-lg">
                  <p className="text-sm text-destructive font-medium">{error}</p>
                  <Button variant="outline" size="sm" className="mt-3">
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Retry
                  </Button>
                </div>
              </CardContent>
            )}
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="space-y-6 max-w-7xl mx-auto p-4 sm:p-6">
        {/* Enhanced Header */}
        <div className="text-center py-4">
          <div className="flex items-center justify-center gap-3 mb-2">
            <BarChart3 className="h-8 w-8 text-primary" />
            <h1 className="text-3xl font-bold">Analytics Dashboard</h1>
          </div>
          <p className="text-muted-foreground">Real-time platform insights and performance metrics</p>
          <div className="flex items-center justify-center gap-2 mt-3 text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <div className="h-2 w-2 bg-green-500 rounded-full animate-pulse" />
              Live data
            </div>
            <span>•</span>
            <span>Last updated: {new Date().toLocaleTimeString()}</span>
          </div>
        </div>

        {/* Bot Requests Widget */}
        <div className="max-w-4xl mx-auto">
          <BotRequestsWidget />
        </div>

        {/* Main Metrics Grid - Enhanced Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3 sm:gap-4">
          <MetricCard
            icon={Users2}
            title="Total Users"
            value={data.totalUsers}
            subtitle="Total Users"
            tooltip="Total number of registered users on the platform"
          />
          <MetricCard
            icon={Globe2}
            title="Websites"
            value={data.totalWebsites}
            subtitle="Websites"
            tooltip="Total number of websites connected to the platform"
          />
          <MetricCard
            icon={Network}
            title="Domains"
            value={data.totalDomains}
            subtitle="Domains"
            tooltip="Total number of domains registered on the platform"
          />
          <MetricCard
            icon={ShieldCheck}
            title="Verified"
            value={data.verifiedDomains}
            subtitle="Verified"
            tooltip="Number of verified domains out of total domains"
          />
          <MetricCard
            icon={UserPlus}
            title="Users Today"
            value={data.usersToday}
            subtitle="Users Today"
            tooltip="New user registrations in the last 24 hours"
          />
          <MetricCard
            icon={Globe2}
            title="Sites Today"
            value={data.websitesToday}
            subtitle="Sites Today"
            tooltip="New websites added in the last 24 hours"
          />
          <MetricCard
            icon={Zap}
            title="Events 24h"
            value={data.events24h}
            subtitle="Events 24h"
            tooltip="Total analytics events captured in the last 24 hours"
          />
          <MetricCard
            icon={Clock}
            title="Events 30d"
            value={data.eventsMonthly}
            subtitle="Events 30d"
            tooltip="Total analytics events captured in the last 30 days"
          />
        </div>

        {/* Top Websites Chart - Enhanced */}
        <Card className="hover:shadow-lg transition-all duration-300">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <Globe2 className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-lg">Top Websites (30d)</CardTitle>
                  <CardDescription>Website activity and performance metrics</CardDescription>
                </div>
              </div>
              <Badge variant="secondary" className="text-xs">
                {data.topWebsites?.length || 0} sites
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            {data.topWebsites && data.topWebsites.length > 0 ? (
              <div className="h-[280px] sm:h-[320px] bg-muted/10 rounded-lg p-3 sm:p-4">
                <BarChart data={data.topWebsites} />
              </div>
            ) : (
              <div className="h-[280px] sm:h-[320px] flex items-center justify-center bg-muted/20 rounded-lg">
                <div className="text-center p-6">
                  <Globe2 className="h-12 w-12 mx-auto mb-3 text-muted-foreground opacity-50" />
                  <h3 className="text-lg font-medium mb-1">No website data</h3>
                  <p className="text-sm text-muted-foreground mb-4">Website activity will appear here once data is collected</p>
                  <Button variant="outline" size="sm" asChild>
                    <Link href="/websites">
                      <Globe2 className="h-4 w-4 mr-2" />
                      View Websites
                    </Link>
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Events Charts Section - Enhanced */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
          <Card className="hover:shadow-lg transition-all duration-300">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <Zap className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <CardTitle>Events (24h)</CardTitle>
                    <CardDescription>Hourly event distribution</CardDescription>
                  </div>
                </div>
                <Badge variant="outline" className="text-xs">
                  {formatLargeNumber(data.events24h)} total
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              {data.events24hOverTime && data.events24hOverTime.length > 0 ? (
                <div className="h-[200px] sm:h-[220px] bg-muted/10 rounded-lg p-3 sm:p-4">
                  <LineChart data={data.events24hOverTime.map(item => ({
                    date: new Date(item.hour).toLocaleTimeString('en-US', {
                      hour: '2-digit',
                      minute: '2-digit'
                    }),
                    value: item.value
                  }))} />
                </div>
              ) : (
                <div className="h-[200px] sm:h-[220px] flex items-center justify-center bg-muted/20 rounded-lg">
                  <div className="text-center p-4">
                    <Zap className="h-10 w-10 mx-auto mb-2 text-muted-foreground opacity-50" />
                    <p className="text-sm text-muted-foreground">No recent events</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-all duration-300">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <TrendingUp className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <CardTitle>Events Timeline (30d)</CardTitle>
                    <CardDescription>Daily event trends and patterns</CardDescription>
                  </div>
                </div>
                <Badge variant="outline" className="text-xs">
                  {formatLargeNumber(data.eventsMonthly)} total
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              {data.eventsOverTime && data.eventsOverTime.length > 0 ? (
                <div className="h-[200px] sm:h-[220px] bg-muted/10 rounded-lg p-3 sm:p-4">
                  <LineChart data={data.eventsOverTime.map(item => ({
                    date: new Date(item.date).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric'
                    }),
                    value: item.value
                  }))} />
                </div>
              ) : (
                <div className="h-[200px] sm:h-[220px] flex items-center justify-center bg-muted/20 rounded-lg">
                  <div className="text-center p-4">
                    <Calendar className="h-10 w-10 mx-auto mb-2 text-muted-foreground opacity-50" />
                    <p className="text-sm text-muted-foreground">No historical data</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Data Tables Grid - Enhanced */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="hover:shadow-lg transition-all duration-300">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-primary/10 rounded-md">
                    <Activity className="h-4 w-4 text-primary" />
                  </div>
                  Activity (24h)
                </div>
                <Badge variant="secondary" className="text-xs">
                  {data.recentActivity?.length || 0}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              {data.recentActivity && data.recentActivity.length > 0 ? (
                <div className="space-y-2">
                  {data.recentActivity.slice(0, 4).map((activity, index) => (
                    <div key={activity.event_name} className="flex items-center justify-between text-sm p-2 rounded-lg hover:bg-muted/50 transition-colors group">
                      <div className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 bg-primary rounded-full opacity-70" />
                        <span className="capitalize truncate font-medium">{activity.event_name}</span>
                      </div>
                      <span className="font-bold text-primary group-hover:scale-110 transition-transform">
                        {formatNumber(activity.count)}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-6 text-center">
                  <Activity className="h-8 w-8 mx-auto mb-2 text-muted-foreground opacity-50" />
                  <p className="text-xs text-muted-foreground">No recent activity</p>
                  <p className="text-xs text-muted-foreground/70 mt-1">Activity will appear here</p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-all duration-300">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-primary/10 rounded-md">
                    <MapPin className="h-4 w-4 text-primary" />
                  </div>
                  Countries (7d)
                </div>
                <Badge variant="secondary" className="text-xs">
                  {data.topCountries?.length || 0}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              {data.topCountries && data.topCountries.length > 0 ? (
                <div className="space-y-2">
                  {data.topCountries.slice(0, 4).map((country, index) => (
                    <div key={country.country} className="flex items-center justify-between text-sm p-2 rounded-lg hover:bg-muted/50 transition-colors group">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-medium text-muted-foreground w-4">#{index + 1}</span>
                        <span className="truncate font-medium">{country.country}</span>
                      </div>
                      <span className="font-bold text-primary group-hover:scale-110 transition-transform">
                        {formatNumber(country.visitors)}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-6 text-center">
                  <MapPin className="h-8 w-8 mx-auto mb-2 text-muted-foreground opacity-50" />
                  <p className="text-xs text-muted-foreground">No visitor data</p>
                  <p className="text-xs text-muted-foreground/70 mt-1">Geographic data will appear here</p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-all duration-300">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-primary/10 rounded-md">
                    <Users2 className="h-4 w-4 text-primary" />
                  </div>
                  Latest Users
                </div>
                <Badge variant="secondary" className="text-xs">
                  {data.recentUsers?.length || 0}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              {data.recentUsers && data.recentUsers.length > 0 ? (
                <div className="space-y-2">
                  {data.recentUsers.slice(0, 4).map((user) => (
                    <Link key={user.id} href={`/users/${user.id}`} className="block group">
                      <div className="flex items-center gap-3 text-sm hover:bg-muted/50 rounded-lg p-2 transition-all duration-200 hover:scale-[1.02]">
                        <Avatar className="h-6 w-6 ring-2 ring-primary/20">
                          <AvatarImage src={user.image || undefined} alt={user.name || "User"} />
                          <AvatarFallback className="text-[10px]">{getInitials(user.name)}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate group-hover:text-primary transition-colors">
                            {user.name || "Unknown"}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {formatDistanceToNow(new Date(user.createdAt), { addSuffix: true })}
                          </p>
                        </div>
                        <ExternalLink className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="py-6 text-center">
                  <Users2 className="h-8 w-8 mx-auto mb-2 text-muted-foreground opacity-50" />
                  <p className="text-xs text-muted-foreground">No recent users</p>
                  <Button variant="outline" size="sm" className="mt-3" asChild>
                    <Link href="/users">
                      <Users2 className="h-3 w-3 mr-1" />
                      View Users
                    </Link>
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-all duration-300">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-primary/10 rounded-md">
                    <Globe2 className="h-4 w-4 text-primary" />
                  </div>
                  Latest Sites
                </div>
                <Badge variant="secondary" className="text-xs">
                  {data.recentWebsites?.length || 0}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              {data.recentWebsites && data.recentWebsites.length > 0 ? (
                <div className="space-y-2">
                  {data.recentWebsites.slice(0, 4).map((website) => (
                    <Link key={website.id} href={`/websites/${website.id}`} className="block group">
                      <div className="flex items-center gap-3 text-sm hover:bg-muted/50 rounded-lg p-2 transition-all duration-200 hover:scale-[1.02]">
                        <div className="h-6 w-6 bg-primary/10 text-primary rounded-md flex items-center justify-center ring-2 ring-primary/20">
                          <Globe2 className="h-3 w-3" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate group-hover:text-primary transition-colors">
                            {website.name || website.domain || "Unknown"}
                          </p>
                          <div className="flex items-center gap-2">
                            <Badge variant={website.status === 'ACTIVE' ? 'default' : 'secondary'} className="text-[10px] h-4 px-1">
                              {website.status}
                            </Badge>
                            <span className="text-xs text-muted-foreground">
                              {formatDistanceToNow(new Date(website.createdAt), { addSuffix: true })}
                            </span>
                          </div>
                        </div>
                        <ExternalLink className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="py-6 text-center">
                  <Globe2 className="h-8 w-8 mx-auto mb-2 text-muted-foreground opacity-50" />
                  <p className="text-xs text-muted-foreground">No recent sites</p>
                  <Button variant="outline" size="sm" className="mt-3" asChild>
                    <Link href="/websites">
                      <Globe2 className="h-3 w-3 mr-1" />
                      View Sites
                    </Link>
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
} 
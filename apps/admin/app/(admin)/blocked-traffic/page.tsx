// REDESIGNED BLOCKED TRAFFIC PAGE (SSR, MODERN, CONCISE)
import { Suspense } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableHead, TableHeader, TableRow, TableCell } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { fetchBlockedTraffic, fetchBlockedTrafficStats } from "./actions";
import type { BlockedTraffic } from "@databuddy/db";
import BarChart from "@/components/ui/bar-chart";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Info } from "@phosphor-icons/react/ssr";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { redirect } from "next/navigation";

const DEFAULT_PAGE_SIZE = 10;

function Flag({ country }: { country?: string | null }) {
    if (!country) return null;
    // Use emoji flags for simplicity
    const code = country.toUpperCase();
    const flag = code.replace(/./g, char => String.fromCodePoint(127397 + char.charCodeAt(0)));
    return <span title={country} className="mr-1">{flag}</span>;
}

function MetricsRow({ stats }: { stats: Awaited<ReturnType<typeof fetchBlockedTrafficStats>> }) {
    const mostTargeted = stats.top_clients[0];
    return (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <Card><CardContent className="py-4"><div className="text-2xl font-bold">{stats.total_blocked}</div><div className="text-xs text-muted-foreground">Total Blocked</div></CardContent></Card>
            <Card><CardContent className="py-4"><div className="text-2xl font-bold">{stats.total_known_bots}</div><div className="text-xs text-muted-foreground">Known Bots</div></CardContent></Card>
            <Card><CardContent className="py-4"><div className="text-2xl font-bold">{stats.total_unknown_bots}</div><div className="text-xs text-muted-foreground">Unknown Bots</div></CardContent></Card>
            <Card><CardContent className="py-4"><div className="text-2xl font-bold truncate max-w-[120px]">{mostTargeted?.website_name || mostTargeted?.website_domain || '—'}</div><div className="text-xs text-muted-foreground">Most Targeted</div></CardContent></Card>
        </div>
    );
}

function FiltersBar({ websites }: { websites: { id: string; name: string | null; domain: string | null }[] }) {
    // SSR: just render static filters for now (no interactivity)
    return (
        <div className="sticky top-0 z-10 bg-background py-2 border-b flex flex-wrap gap-2 items-center mb-2">
            <div className="flex flex-col"><span className="text-xs text-muted-foreground">Date</span><input type="date" className="border rounded px-2 py-1 text-xs w-[120px]" /></div>
            <div className="flex flex-col"><span className="text-xs text-muted-foreground">Website</span><select className="border rounded px-2 py-1 text-xs w-[120px]">{websites.map(w => <option key={w.id} value={w.id}>{w.name || w.domain || w.id}</option>)}</select></div>
            <div className="flex flex-col"><span className="text-xs text-muted-foreground">Reason</span><select className="border rounded px-2 py-1 text-xs w-[100px]"><option>All</option></select></div>
            <div className="flex flex-col"><span className="text-xs text-muted-foreground">Bot Name</span><select className="border rounded px-2 py-1 text-xs w-[100px]"><option>All</option></select></div>
            <div className="flex flex-col"><span className="text-xs text-muted-foreground">Country</span><select className="border rounded px-2 py-1 text-xs w-[80px]"><option>All</option></select></div>
        </div>
    );
}

function ChartSection({ stats }: { stats: Awaited<ReturnType<typeof fetchBlockedTrafficStats>> }) {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div className="space-y-4">
                <Card><CardHeader><CardTitle>Blocked Requests (24h)</CardTitle></CardHeader><CardContent><BarChart data={stats.hourly_trend.slice(0, 24).map(h => ({ name: h.hour.slice(11, 16), value: h.count, website: h.hour }))} /></CardContent></Card>
                <Card><CardHeader><CardTitle>Blocked by Reason</CardTitle></CardHeader><CardContent><BarChart data={stats.top_reasons.slice(0, 5).map(r => ({ name: r.block_reason, value: r.count, website: r.block_reason }))} /></CardContent></Card>
            </div>
            <div className="space-y-4">
                <Card><CardHeader><CardTitle>Top Blocked Websites</CardTitle></CardHeader><CardContent><BarChart data={stats.top_clients.slice(0, 5).map(c => ({ name: c.website_name || c.website_domain || c.client_id, value: c.count, website: c.client_id }))} /></CardContent></Card>
                <Card><CardHeader><CardTitle>Top Bot Names</CardTitle></CardHeader><CardContent><BarChart data={stats.top_bot_names.slice(0, 5).map(b => ({ name: b.bot_name, value: b.count, website: b.bot_name }))} /></CardContent></Card>
            </div>
        </div>
    );
}

function getWebsiteMeta(clientId: string, websites: { id: string; name: string | null; domain: string | null }[]) {
    const meta = websites.find(w => w.id === clientId);
    return meta || { name: null, domain: null };
}

function BlockedTrafficTable({ data, websites }: { data: BlockedTraffic[], websites: { id: string; name: string | null; domain: string | null }[] }) {
    return (
        <Card className="mb-6">
            <CardHeader><CardTitle>Blocked Traffic Details</CardTitle></CardHeader>
            <CardContent className="p-0 overflow-x-auto">
                <Table className="text-xs min-w-[900px]">
                    <TableHeader>
                        <TableRow>
                            <TableHead>Time</TableHead>
                            <TableHead>Website</TableHead>
                            <TableHead>Reason</TableHead>
                            <TableHead>Bot</TableHead>
                            <TableHead>IP</TableHead>
                            <TableHead>Country</TableHead>
                            <TableHead>User Agent</TableHead>
                            <TableHead />
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {data.map(row => {
                            const meta = getWebsiteMeta(row.client_id || "", websites);
                            const displayName = (meta.name || meta.domain || row.client_id || "");
                            const truncated = displayName.length > 20 ? `${displayName.slice(0, 20)}…` : displayName;
                            return (
                                <TableRow key={row.id} className="group hover:bg-muted/30 transition-colors">
                                    <TableCell>{new Date(row.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</TableCell>
                                    <TableCell className="truncate max-w-[120px] font-semibold">
                                        <TooltipProvider>
                                            <Tooltip>
                                                <TooltipTrigger asChild>
                                                    <span className="cursor-pointer">{truncated}</span>
                                                </TooltipTrigger>
                                                <TooltipContent>{displayName}</TooltipContent>
                                            </Tooltip>
                                        </TooltipProvider>
                                    </TableCell>
                                    <TableCell className="truncate max-w-[80px]">{row.block_reason}</TableCell>
                                    <TableCell className="truncate max-w-[80px]">{row.bot_name || '—'}</TableCell>
                                    <TableCell className="truncate max-w-[80px]">
                                        <TooltipProvider><Tooltip><TooltipTrigger asChild><span className="cursor-pointer">{(row.ip || '').slice(0, 8)}…</span></TooltipTrigger><TooltipContent>{row.ip}</TooltipContent></Tooltip></TooltipProvider>
                                    </TableCell>
                                    <TableCell><Flag country={typeof row.country === 'string' ? row.country : ''} />{row.country || '—'}</TableCell>
                                    <TableCell className="truncate max-w-[120px]">
                                        <TooltipProvider><Tooltip><TooltipTrigger asChild><span className="cursor-pointer">{row.user_agent?.slice(0, 16) || '—'}…</span></TooltipTrigger><TooltipContent>{row.user_agent}</TooltipContent></Tooltip></TooltipProvider>
                                    </TableCell>
                                    <TableCell className="text-center"><button type="button" className="text-xs text-primary underline hover:no-underline px-1 py-0.5">View More</button></TableCell>
                                </TableRow>
                            );
                        })}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    );
}

function getTabAndFilterFromParams(params: any, websites: any[], stats: any) {
    // SSR: parse tab/filter from params
    const tab = params.tab || "all";
    let filterOptions: { value: string; label: string }[] = [];
    if (tab === "website") filterOptions = websites.map(w => ({ value: w.id, label: w.name || w.domain || w.id }));
    if (tab === "bot") filterOptions = stats.top_bot_names.map((b: { bot_name: string }) => ({ value: b.bot_name, label: b.bot_name }));
    if (tab === "reason") filterOptions = stats.top_reasons.map((r: { block_reason: string }) => ({ value: r.block_reason, label: r.block_reason }));
    if (tab === "country") filterOptions = stats.top_countries.map((c: { country: string }) => ({ value: c.country, label: c.country }));
    const filterValue = params.filter || (filterOptions[0]?.value ?? "");
    return { tab, filterOptions, filterValue };
}

function computeStatsFromData(data: BlockedTraffic[]): any {
    const countBy = (arr: any[], key: string) => {
        const map = new Map<string, number>();
        for (const item of arr) {
            const k = item[key] || '—';
            map.set(k, (map.get(k) || 0) + 1);
        }
        return Array.from(map.entries()).map(([k, v]) => ({ [key]: k, count: v }));
    };
    const top_reasons = countBy(data, 'block_reason').sort((a, b) => b.count - a.count).slice(0, 5);
    const top_bot_names = countBy(data, 'bot_name').filter(b => b.bot_name !== '—').sort((a, b) => b.count - a.count).slice(0, 5);
    const top_countries = countBy(data, 'country').sort((a, b) => b.count - a.count).slice(0, 5);
    const top_clients = countBy(data, 'client_id').sort((a, b) => b.count - a.count).slice(0, 5);
    const hourly_trend = (() => {
        const map = new Map<string, number>();
        for (const item of data) {
            const d = new Date(item.timestamp);
            const hour = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:00:00`;
            map.set(hour, (map.get(hour) || 0) + 1);
        }
        return Array.from(map.entries()).map(([hour, count]) => ({ hour, count })).sort((a, b) => a.hour.localeCompare(b.hour));
    })();
    return { top_reasons, top_bot_names, top_countries, top_clients, hourly_trend };
}

export default async function BlockedTrafficPage({ searchParams }: { searchParams: Promise<{ page?: string; pageSize?: string; client_id?: string; ip?: string; block_reason?: string; country?: string; from?: string; to?: string; search?: string; tab?: string; filter?: string; }> }) {
    const params = await searchParams;
    const page = params.page ? Number.parseInt(params.page, 10) : 0;
    const pageSize = params.pageSize ? Number.parseInt(params.pageSize, 10) : DEFAULT_PAGE_SIZE;
    const filters = {
        client_id: params.client_id,
        ip: params.ip,
        block_reason: params.block_reason,
        country: params.country,
        from: params.from,
        to: params.to,
        search: params.search,
    };
    const stats = await fetchBlockedTrafficStats(filters);
    const websites = stats.top_clients.map(c => ({ id: c.client_id, name: c.website_name ?? null, domain: c.website_domain ?? null }));
    const { tab, filterOptions, filterValue } = getTabAndFilterFromParams(params, websites, stats);

    // Filter data for SSR (simulate tab/filter selection)
    const filteredData = await fetchBlockedTraffic({ ...filters, limit: pageSize, offset: page * pageSize });
    if (tab === "website" && filterValue) filteredData.data = filteredData.data.filter(d => d.client_id === filterValue);
    if (tab === "bot" && filterValue) filteredData.data = filteredData.data.filter(d => d.bot_name === filterValue);
    if (tab === "reason" && filterValue) filteredData.data = filteredData.data.filter(d => d.block_reason === filterValue);
    if (tab === "country" && filterValue) filteredData.data = filteredData.data.filter(d => d.country === filterValue);

    const filteredStats = computeStatsFromData(filteredData.data);

    return (
        <div className="w-full max-w-screen-xl mx-auto px-2 md:px-6 py-6 space-y-6">
            <div className="mb-2">
                <h1 className="text-2xl font-bold">Blocked Traffic</h1>
                <p className="text-sm text-muted-foreground">Real-time insights into blocked and bot traffic attempts on your sites.</p>
            </div>
            <MetricsRow stats={stats} />
            <Tabs defaultValue={tab} className="mb-4">
                <TabsList>
                    <TabsTrigger value="all" asChild><a href="?tab=all">All</a></TabsTrigger>
                    <TabsTrigger value="website" asChild><a href="?tab=website">By Website</a></TabsTrigger>
                    <TabsTrigger value="bot" asChild><a href="?tab=bot">By Bot</a></TabsTrigger>
                    <TabsTrigger value="reason" asChild><a href="?tab=reason">By Reason</a></TabsTrigger>
                    <TabsTrigger value="country" asChild><a href="?tab=country">By Country</a></TabsTrigger>
                </TabsList>
                <div className="mt-2">
                    {tab !== "all" && filterOptions.length > 0 && (
                        <form method="get" className="inline-block">
                            <input type="hidden" name="tab" value={tab} />
                            <select name="filter" defaultValue={filterValue} className="border rounded px-2 py-1 text-xs">
                                {filterOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                            </select>
                            <button type="submit" className="ml-2 text-xs text-primary underline">Apply</button>
                        </form>
                    )}
                </div>
            </Tabs>
            <ChartSection stats={{
                ...stats,
                ...filteredStats,
            }} />
            <BlockedTrafficTable data={filteredData.data} websites={websites} />
        </div>
    );
} 
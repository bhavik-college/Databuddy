"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ChevronUp, ChevronDown, ChevronsUpDown, Search, Filter, X, AlertTriangle, TrendingUp, Info } from "lucide-react";
import { getUsers, getCustomers } from "./actions";
import type { CustomerDataWithPricing } from "./types";
import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getInitials } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

type SortField = 'user_name' | 'usage' | 'overage_amount' | 'total_cost' | 'balance' | 'next_reset_at' | 'predicted_usage' | 'risk_level' | 'predicted_overage';
type SortDirection = 'asc' | 'desc';

type FilterType = 'all' | 'with_overage' | 'no_overage' | 'high_usage' | 'at_risk' | 'critical_risk';

export default function IncomePage() {
    const [customers, setCustomers] = useState<CustomerDataWithPricing[]>([]);
    const [loading, setLoading] = useState(true);
    const [sortField, setSortField] = useState<SortField>('total_cost');
    const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
    const [searchTerm, setSearchTerm] = useState('');
    const [filterType, setFilterType] = useState<FilterType>('all');

    useEffect(() => {
        const fetchData = async () => {
            try {
                const dbUsers = await getUsers();
                const customersData = await getCustomers(dbUsers);
                setCustomers(customersData);
            } catch (error) {
                console.error("Error fetching data:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    const handleSort = (field: SortField) => {
        if (sortField === field) {
            setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
        } else {
            setSortField(field);
            setSortDirection('desc');
        }
    };

    const getSortIcon = (field: SortField) => {
        if (sortField !== field) return <ChevronsUpDown className="h-4 w-4" />;
        return sortDirection === 'asc' ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />;
    };

    const getRiskBadge = (riskLevel: string) => {
        const variants = {
            low: "bg-green-100 text-green-800 border-green-200",
            medium: "bg-yellow-100 text-yellow-800 border-yellow-200",
            high: "bg-orange-100 text-orange-800 border-orange-200",
            critical: "bg-red-100 text-red-800 border-red-200"
        };

        return (
            <Badge variant="outline" className={`text-xs ${variants[riskLevel as keyof typeof variants]}`}>
                {riskLevel.charAt(0).toUpperCase() + riskLevel.slice(1)} Risk
            </Badge>
        );
    };

    // Filter customers based on search and filter type
    const filteredCustomers = customers.filter(customer => {
        // Search filter
        const matchesSearch = searchTerm === '' ||
            customer.user_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            customer.user_email?.toLowerCase().includes(searchTerm.toLowerCase());

        if (!matchesSearch) return false;

        // Filter type
        switch (filterType) {
            case 'with_overage':
                return customer.overage_amount > 0;
            case 'no_overage':
                return customer.overage_amount === 0;
            case 'high_usage': {
                const usagePercentage = (customer.usage / customer.included_usage) * 100;
                return usagePercentage >= 80;
            }
            case 'at_risk': {
                return customer.risk_level === 'high' || customer.risk_level === 'critical';
            }
            case 'critical_risk': {
                return customer.risk_level === 'critical';
            }
            default:
                return true;
        }
    });

    const sortedCustomers = [...filteredCustomers].sort((a, b) => {
        let aValue: any = a[sortField];
        let bValue: any = b[sortField];

        if (sortField === 'next_reset_at') {
            aValue = new Date(aValue).getTime();
            bValue = new Date(bValue).getTime();
        }

        if (sortField === 'risk_level') {
            const riskOrder = { low: 0, medium: 1, high: 2, critical: 3 };
            aValue = riskOrder[aValue as keyof typeof riskOrder] || 0;
            bValue = riskOrder[bValue as keyof typeof riskOrder] || 0;
        }

        if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
        if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
        return 0;
    });

    const clearFilters = () => {
        setSearchTerm('');
        setFilterType('all');
    };

    if (loading) {
        return (
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <h1 className="text-3xl font-bold">Income Overview</h1>
                </div>
                <div className="flex items-center justify-center h-64">
                    <div className="text-muted-foreground">Loading...</div>
                </div>
            </div>
        );
    }

    const totalBalance = customers.reduce((sum, customer) => sum + customer.balance, 0);
    const totalUsage = customers.reduce((sum, customer) => sum + customer.usage, 0);
    const totalOverageCost = customers.reduce((sum, customer) => sum + customer.total_cost, 0);
    const activeCustomers = customers.length;

    const filteredOverageCost = filteredCustomers.reduce((sum, customer) => sum + customer.total_cost, 0);
    const paidCustomers = customers.filter(c => !c.is_free_plan);
    const paidFilteredCustomers = filteredCustomers.filter(c => !c.is_free_plan);
    const atRiskCustomers = paidCustomers.filter(c => c.risk_level === 'high' || c.risk_level === 'critical').length;
    const criticalRiskCustomers = paidCustomers.filter(c => c.risk_level === 'critical').length;
    const predictedRevenue = paidCustomers.reduce((sum, c) => sum + (c.predicted_overage || 0) * 0.000035, 0);

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold">Income Overview</h1>
            </div>

            <div className="grid gap-4 md:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Active Customers</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{activeCustomers}</div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Balance</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{totalBalance.toLocaleString()}</div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Usage</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{totalUsage.toLocaleString()}</div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Overage Revenue</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">${totalOverageCost.toFixed(2)}</div>
                    </CardContent>
                </Card>
            </div>

            {/* Risk Overview */}
            <div className="grid gap-4 md:grid-cols-3">
                <Card className="border-orange-200 bg-orange-50">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-orange-800">At Risk</CardTitle>
                        <AlertTriangle className="h-4 w-4 text-orange-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-orange-800">{atRiskCustomers}</div>
                        <p className="text-xs text-orange-600">High or critical risk customers</p>
                    </CardContent>
                </Card>

                <Card className="border-red-200 bg-red-50">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-red-800">Critical Risk</CardTitle>
                        <AlertTriangle className="h-4 w-4 text-red-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-red-800">{criticalRiskCustomers}</div>
                        <p className="text-xs text-red-600">Will likely exceed limits</p>
                    </CardContent>
                </Card>

                <Card className="border-green-200 bg-green-50">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-green-800">Predicted Revenue</CardTitle>
                        <TrendingUp className="h-4 w-4 text-green-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-green-800">
                            ${predictedRevenue.toFixed(2)}
                        </div>
                        <p className="text-xs text-green-600">From predicted overages (paid plans only)</p>
                    </CardContent>
                </Card>
            </div>

            {/* Filter Controls */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Filter className="h-5 w-5" />
                        Filters
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="flex flex-col sm:flex-row gap-4">
                        <div className="flex-1">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder="Search users..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="pl-10"
                                />
                            </div>
                        </div>
                        <div className="flex gap-2">
                            <Select value={filterType} onValueChange={(value: FilterType) => setFilterType(value)}>
                                <SelectTrigger className="w-[180px]">
                                    <SelectValue placeholder="Filter by..." />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Customers</SelectItem>
                                    <SelectItem value="with_overage">With Overage</SelectItem>
                                    <SelectItem value="no_overage">No Overage</SelectItem>
                                    <SelectItem value="high_usage">High Usage (80%+)</SelectItem>
                                    <SelectItem value="at_risk">At Risk</SelectItem>
                                    <SelectItem value="critical_risk">Critical Risk</SelectItem>
                                </SelectContent>
                            </Select>
                            {(searchTerm || filterType !== 'all') && (
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={clearFilters}
                                    className="flex items-center gap-2"
                                >
                                    <X className="h-4 w-4" />
                                    Clear
                                </Button>
                            )}
                        </div>
                    </div>
                    {(searchTerm || filterType !== 'all') && (
                        <div className="mt-4 text-sm text-muted-foreground">
                            Showing {filteredCustomers.length} of {customers.length} customers
                            {filteredOverageCost > 0 && (
                                <span className="ml-4 text-green-600 font-medium">
                                    Filtered Revenue: ${filteredOverageCost.toFixed(2)}
                                </span>
                            )}
                        </div>
                    )}
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Customer Usage & Revenue Details</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="rounded-md border">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>User</TableHead>
                                    <TableHead>
                                        <Button
                                            variant="ghost"
                                            onClick={() => handleSort('usage')}
                                            className="h-auto p-0 font-medium"
                                        >
                                            Usage
                                            {getSortIcon('usage')}
                                        </Button>
                                    </TableHead>
                                    <TableHead>
                                        <Button
                                            variant="ghost"
                                            onClick={() => handleSort('risk_level')}
                                            className="h-auto p-0 font-medium"
                                        >
                                            Risk
                                            {getSortIcon('risk_level')}
                                        </Button>
                                    </TableHead>
                                    <TableHead>
                                        <Button
                                            variant="ghost"
                                            onClick={() => handleSort('total_cost')}
                                            className="h-auto p-0 font-medium"
                                        >
                                            Revenue
                                            {getSortIcon('total_cost')}
                                        </Button>
                                    </TableHead>
                                    <TableHead>
                                        <Button
                                            variant="ghost"
                                            onClick={() => handleSort('predicted_overage')}
                                            className="h-auto p-0 font-medium"
                                        >
                                            Overage
                                            {getSortIcon('predicted_overage')}
                                        </Button>
                                    </TableHead>
                                    <TableHead>Days Left</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {sortedCustomers.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                                            {searchTerm || filterType !== 'all'
                                                ? 'No customers match your filters'
                                                : 'No customers found'
                                            }
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    sortedCustomers.map((customer) => {
                                        const percentage = Math.round((customer.usage / customer.included_usage) * 100);
                                        return (
                                            <TableRow key={customer.customer_id} className="cursor-pointer hover:bg-muted/50">
                                                <TableCell>
                                                    <Link href={`/users/${customer.customer_id}`} className="group">
                                                        <div className="flex items-center gap-3">
                                                            <Avatar className="h-8 w-8 text-xs group-hover:ring-2 group-hover:ring-primary">
                                                                <AvatarImage src={undefined} alt={customer.user_name || "User"} />
                                                                <AvatarFallback>{getInitials(customer.user_name || customer.user_email || "U")}</AvatarFallback>
                                                            </Avatar>
                                                            <div className="flex-1 min-w-0">
                                                                <div className="font-medium text-sm hover:underline truncate">
                                                                    {customer.user_name}
                                                                </div>
                                                                <div className="text-xs text-muted-foreground truncate">
                                                                    {customer.user_email}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </Link>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex items-center gap-2">
                                                        <span className="font-medium">
                                                            {customer.usage.toLocaleString()}
                                                        </span>
                                                        <Badge variant={percentage > 80 ? "destructive" : "secondary"}>
                                                            {percentage}%
                                                        </Badge>
                                                    </div>
                                                    <div className="text-xs text-muted-foreground">
                                                        of {customer.included_usage.toLocaleString()}
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    {customer.risk_level && getRiskBadge(customer.risk_level)}
                                                </TableCell>
                                                <TableCell>
                                                    <div className="font-medium text-green-600">
                                                        ${customer.total_cost.toFixed(4)}
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    {customer.is_over_limit ? (
                                                        <div>
                                                            <Badge variant="destructive">Current Overage</Badge>
                                                            <div className="font-medium text-red-600">
                                                                {customer.overage_amount.toLocaleString()}<span className="text-xs"> events</span>
                                                            </div>
                                                            <div className="text-xs text-muted-foreground">
                                                                ${customer.overage_cost.toFixed(4)}
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        customer.predicted_overage && customer.predicted_overage > 0 ? (
                                                            customer.is_free_plan ? (
                                                                <TooltipProvider>
                                                                    <Tooltip>
                                                                        <TooltipTrigger asChild>
                                                                            <div>
                                                                                <Badge variant="secondary">Predicted Cost if Upgraded <Info className="inline h-3 w-3 ml-1" /></Badge>
                                                                                <div className="font-medium text-orange-600">
                                                                                    {customer.predicted_overage.toLocaleString()}<span className="text-xs"> events</span>
                                                                                </div>
                                                                                <div className="text-xs text-muted-foreground">
                                                                                    ${(customer.predicted_overage * 0.000035).toFixed(4)}
                                                                                </div>
                                                                            </div>
                                                                        </TooltipTrigger>
                                                                        <TooltipContent>
                                                                            This user is on a free plan. This is what their overage would cost if they upgraded to a paid plan.
                                                                        </TooltipContent>
                                                                    </Tooltip>
                                                                </TooltipProvider>
                                                            ) : (
                                                                <div>
                                                                    <Badge variant="secondary">Predicted Overage</Badge>
                                                                    <div className="font-medium text-orange-600">
                                                                        {customer.predicted_overage.toLocaleString()}<span className="text-xs"> events</span>
                                                                    </div>
                                                                    <div className="text-xs text-muted-foreground">
                                                                        ${(customer.predicted_overage * 0.000035).toFixed(4)}
                                                                    </div>
                                                                </div>
                                                            )
                                                        ) : (
                                                            <Badge variant="outline">None</Badge>
                                                        )
                                                    )}
                                                </TableCell>
                                                <TableCell>
                                                    <div className="text-sm font-medium">
                                                        {customer.days_until_reset || 0} days
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
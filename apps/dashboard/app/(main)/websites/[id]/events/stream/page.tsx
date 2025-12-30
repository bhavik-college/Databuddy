"use client";

import {
	ArrowSquareOutIcon,
	CopyIcon,
	FunnelIcon,
	LightningIcon,
	LinkIcon,
	MagnifyingGlassIcon,
} from "@phosphor-icons/react";
import type { ColumnDef } from "@tanstack/react-table";
import {
	flexRender,
	getCoreRowModel,
	useReactTable,
} from "@tanstack/react-table";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import { useAtom } from "jotai";
import Link from "next/link";
import { notFound, useParams } from "next/navigation";
import { parseAsString, useQueryState } from "nuqs";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { useDateFilters } from "@/hooks/use-date-filters";
import { cn } from "@/lib/utils";
import {
	addDynamicFilterAtom,
	dynamicQueryFiltersAtom,
} from "@/stores/jotai/filterAtoms";
import type { RecentCustomEvent } from "../_components/types";
import { useEventsStream } from "./use-events-stream";

dayjs.extend(relativeTime);

function SkeletonRow() {
	return (
		<TableRow className="h-[65px]">
			<TableCell className="py-2">
				<Skeleton className="h-4 w-16" />
			</TableCell>
			<TableCell className="py-2">
				<Skeleton className="h-5 w-24" />
			</TableCell>
			<TableCell className="py-2">
				<Skeleton className="h-4 w-32" />
			</TableCell>
			<TableCell className="py-2">
				<div className="space-y-1">
					<Skeleton className="h-4 w-full" />
					<Skeleton className="h-3 w-2/3" />
				</div>
			</TableCell>
			<TableCell className="py-2">
				<Skeleton className="h-6 w-6" />
			</TableCell>
		</TableRow>
	);
}

export default function EventsStreamPage() {
	const params = useParams();
	const { id: websiteId } = params;

	if (!websiteId || typeof websiteId !== "string") {
		notFound();
	}

	const { dateRange } = useDateFilters();
	const [filters] = useAtom(dynamicQueryFiltersAtom);
	const [, addFilter] = useAtom(addDynamicFilterAtom);

	const [page, setPage] = useState(1);
	const [allEvents, setAllEvents] = useState<RecentCustomEvent[]>([]);
	const [loadMoreRef, setLoadMoreRef] = useState<HTMLTableCellElement | null>(
		null
	);
	const [scrollContainerRef, setScrollContainerRef] =
		useState<HTMLDivElement | null>(null);
	const [isInitialLoad, setIsInitialLoad] = useState(true);
	const [searchQuery, setSearchQuery] = useQueryState(
		"search",
		parseAsString.withDefault("")
	);
	const [selectedEventType, setSelectedEventType] = useQueryState(
		"event",
		parseAsString.withDefault("all")
	);

	const { events, pagination, isLoading, isError, error } = useEventsStream(
		websiteId,
		dateRange,
		50,
		page,
		filters
	);

	useEffect(() => {
		setPage(1);
		setAllEvents([]);
		setIsInitialLoad(true);
	}, [dateRange, filters]);

	const handleIntersection = useCallback(
		(entries: IntersectionObserverEntry[]) => {
			const [entry] = entries;
			if (entry?.isIntersecting && pagination.hasNext && !isLoading) {
				setPage((prev) => prev + 1);
			}
		},
		[pagination.hasNext, isLoading]
	);

	useEffect(() => {
		if (!(loadMoreRef && scrollContainerRef)) {
			return;
		}

		const observer = new IntersectionObserver(handleIntersection, {
			root: scrollContainerRef,
			threshold: 0.1,
			rootMargin: "300px",
		});

		observer.observe(loadMoreRef);

		return () => {
			observer.disconnect();
		};
	}, [loadMoreRef, scrollContainerRef, handleIntersection]);

	useEffect(() => {
		if (!events?.length) {
			return;
		}

		setAllEvents((prev) => {
			const existingKeys = new Set(
				prev.map((e) => `${e.timestamp}-${e.event_name}-${e.session_id}`)
			);
			let hasNewEvents = false;

			const newEvents = [...prev];
			for (const event of events) {
				const key = `${event.timestamp}-${event.event_name}-${event.session_id}`;
				if (!existingKeys.has(key)) {
					newEvents.push(event);
					hasNewEvents = true;
				}
			}

			if (hasNewEvents) {
				return newEvents;
			}

			return prev;
		});
		setIsInitialLoad(false);
	}, [events]);

	const eventTypes = useMemo(() => {
		const types = new Set(allEvents.map((e) => e.event_name));
		return Array.from(types).sort();
	}, [allEvents]);

	const filteredEvents = useMemo(() => {
		let result = allEvents;

		if (selectedEventType !== "all") {
			result = result.filter((e) => e.event_name === selectedEventType);
		}

		if (searchQuery.trim()) {
			const query = searchQuery.toLowerCase();
			result = result.filter(
				(e) =>
					e.event_name.toLowerCase().includes(query) ||
					e.path?.toLowerCase().includes(query) ||
					Object.values(e.properties).some((val) =>
						String(val).toLowerCase().includes(query)
					)
			);
		}

		return result;
	}, [allEvents, selectedEventType, searchQuery]);

	const handleAddFilter = useCallback(
		(eventName: string) => {
			addFilter({ field: "event_name", operator: "eq", value: eventName });
		},
		[addFilter]
	);

	const handleCopyEvent = useCallback((event: RecentCustomEvent) => {
		const data = {
			event_name: event.event_name,
			path: event.path,
			timestamp: event.timestamp,
			properties: event.properties,
		};
		navigator.clipboard.writeText(JSON.stringify(data, null, 2));
	}, []);

	const columns = useMemo<ColumnDef<RecentCustomEvent>[]>(
		() => [
			{
				id: "timestamp",
				header: "Time",
				accessorFn: (row) => row.timestamp,
				cell: ({ row }) => (
					<div className="flex flex-col">
						<span className="text-foreground text-sm">
							{dayjs(row.original.timestamp).fromNow()}
						</span>
						<span className="text-muted-foreground text-xs">
							{dayjs(row.original.timestamp).format("HH:mm:ss")}
						</span>
					</div>
				),
				size: 100,
			},
			{
				id: "event_name",
				header: "Event",
				accessorFn: (row) => row.event_name,
				cell: ({ row }) => (
					<div className="flex items-center gap-1.5">
						<Link
							className="group flex items-center gap-1"
							href={`/websites/${websiteId}/events/${encodeURIComponent(row.original.event_name)}`}
						>
							<span className="rounded bg-primary/10 px-2 py-1 font-medium text-primary text-xs transition-colors group-hover:bg-primary/20">
								{row.original.event_name}
							</span>
							<ArrowSquareOutIcon className="size-3 text-primary opacity-0 transition-opacity group-hover:opacity-100" />
						</Link>
						<button
							className="rounded p-0.5 text-muted-foreground opacity-0 transition-opacity hover:bg-muted hover:text-foreground group-hover/row:opacity-100"
							onClick={() => handleAddFilter(row.original.event_name)}
							title="Filter by this event"
							type="button"
						>
							<FunnelIcon className="size-3.5" weight="duotone" />
						</button>
					</div>
				),
				size: 160,
			},
			{
				id: "path",
				header: "Page",
				accessorFn: (row) => row.path,
				cell: ({ row }) =>
					row.original.path ? (
						<span
							className="flex items-center gap-1.5 text-muted-foreground text-sm"
							title={row.original.path}
						>
							<LinkIcon className="size-3.5 shrink-0" />
							<span className="max-w-[200px] truncate">
								{row.original.path}
							</span>
						</span>
					) : (
						<span className="text-muted-foreground/50 text-sm">—</span>
					),
				size: 200,
			},
			{
				id: "properties",
				header: "Properties",
				cell: ({ row }) => {
					const props = row.original.properties;
					const entries = Object.entries(props);

					if (entries.length === 0) {
						return (
							<span className="text-muted-foreground/50 text-sm">
								No properties
							</span>
						);
					}

					return (
						<div className="flex flex-wrap gap-1.5">
							{entries.slice(0, 3).map(([key, value]) => {
								const strValue = String(value);
								const isLong = strValue.length > 30;
								return (
									<span
										className="inline-flex items-center gap-1 rounded bg-muted px-1.5 py-0.5 text-xs"
										key={key}
										title={isLong ? `${key}: ${strValue}` : undefined}
									>
										<span className="text-muted-foreground">{key}:</span>
										<span className="max-w-[120px] truncate text-foreground">
											{strValue}
										</span>
									</span>
								);
							})}
							{entries.length > 3 && (
								<span className="text-muted-foreground text-xs">
									+{entries.length - 3} more
								</span>
							)}
						</div>
					);
				},
				size: 300,
			},
			{
				id: "actions",
				header: "",
				cell: ({ row }) => (
					<Button
						className="size-7 opacity-0 transition-opacity group-hover/row:opacity-100"
						onClick={() => handleCopyEvent(row.original)}
						size="icon"
						title="Copy event JSON"
						variant="ghost"
					>
						<CopyIcon className="size-3.5" />
					</Button>
				),
				size: 40,
			},
		],
		[handleAddFilter, handleCopyEvent]
	);

	const table = useReactTable({
		data: filteredEvents,
		columns,
		getCoreRowModel: getCoreRowModel(),
		getRowId: (row) => `${row.timestamp}-${row.event_name}-${row.session_id}`,
	});

	if (isLoading && isInitialLoad) {
		return (
			<div className="flex h-full flex-col">
				<div className="border-b px-4 py-3">
					<div className="flex items-center gap-3">
						<Skeleton className="h-8 w-[180px]" />
						<Skeleton className="h-8 w-[200px]" />
					</div>
				</div>
				<div className="flex-1 overflow-auto">
					<Table>
						<TableHeader className="sticky top-0 z-10 bg-accent backdrop-blur-sm">
							<TableRow className="bg-accent shadow-[0_0_0_0.5px_var(--border)]">
								{columns.map((column) => (
									<TableHead
										className="h-[39px]"
										key={column.id}
										style={{ width: column.size }}
									>
										{typeof column.header === "string" ? column.header : null}
									</TableHead>
								))}
							</TableRow>
						</TableHeader>
						<TableBody>
							{Array.from({ length: 10 }).map((_, i) => (
								<SkeletonRow key={`skeleton-${i}`} />
							))}
						</TableBody>
					</Table>
				</div>
			</div>
		);
	}

	if (isError) {
		return (
			<div className="flex h-full flex-col items-center justify-center py-24 text-center text-muted-foreground">
				<LightningIcon className="mb-4 size-12 opacity-50" weight="duotone" />
				<p className="mb-2 font-medium text-lg">Failed to load events</p>
				<p className="text-sm">
					{error?.message || "There was an error loading the events"}
				</p>
			</div>
		);
	}

	if (!allEvents || allEvents.length === 0) {
		return (
			<div className="flex h-full flex-col items-center justify-center py-24 text-center text-muted-foreground">
				<LightningIcon className="mb-4 size-12 opacity-50" weight="duotone" />
				<p className="mb-2 font-medium text-lg">No events yet</p>
				<p className="mx-auto max-w-md text-balance text-sm">
					Events will appear here once your tracker starts collecting them. Use{" "}
					<code className="rounded bg-muted px-1 py-0.5 text-xs">
						databuddy.track()
					</code>{" "}
					to send custom events.
				</p>
			</div>
		);
	}

	return (
		<div className="flex h-full flex-col">
			<div className="border-b px-4 py-3">
				<div className="flex flex-wrap items-center gap-3">
					<Select
						onValueChange={setSelectedEventType}
						value={selectedEventType}
					>
						<SelectTrigger className="h-8 w-[180px]">
							<SelectValue placeholder="All events" />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="all">All events</SelectItem>
							{eventTypes.map((type) => (
								<SelectItem key={type} value={type}>
									{type}
								</SelectItem>
							))}
						</SelectContent>
					</Select>

					<div className="relative">
						<MagnifyingGlassIcon className="absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
						<Input
							className="h-8 w-[200px] pl-8 text-sm"
							onChange={(e) => setSearchQuery(e.target.value)}
							placeholder="Search events…"
							value={searchQuery}
						/>
					</div>

					<span className="text-muted-foreground text-sm">
						{filteredEvents.length} event
						{filteredEvents.length !== 1 ? "s" : ""}
					</span>
				</div>
			</div>

			<div className="min-h-0 flex-1 overflow-auto" ref={setScrollContainerRef}>
				<Table>
					<TableHeader className="sticky top-0 z-10 bg-accent backdrop-blur-sm">
						{table.getHeaderGroups().map((headerGroup) => (
							<TableRow
								className="bg-accent shadow-[0_0_0_0.5px_var(--border)]"
								key={headerGroup.id}
							>
								{headerGroup.headers.map((header) => (
									<TableHead
										className="h-[39px]"
										key={header.id}
										style={{ width: header.column.getSize() }}
									>
										{header.isPlaceholder
											? null
											: flexRender(
													header.column.columnDef.header,
													header.getContext()
												)}
									</TableHead>
								))}
							</TableRow>
						))}
					</TableHeader>
					<TableBody>
						{table.getRowModel().rows.map((row) => (
							<TableRow
								className={cn(
									"group/row h-[65px] transition-colors hover:bg-muted/30"
								)}
								key={row.id}
							>
								{row.getVisibleCells().map((cell) => (
									<TableCell
										className="py-2"
										key={cell.id}
										style={{ width: cell.column.getSize() }}
									>
										{flexRender(cell.column.columnDef.cell, cell.getContext())}
									</TableCell>
								))}
							</TableRow>
						))}

						{pagination.hasNext && (
							<>
								<TableRow>
									<TableCell
										className="h-0 p-0"
										colSpan={columns.length}
										ref={setLoadMoreRef}
									/>
								</TableRow>
								{isLoading && (
									<>
										<SkeletonRow />
										<SkeletonRow />
										<SkeletonRow />
									</>
								)}
							</>
						)}
					</TableBody>
				</Table>
			</div>
		</div>
	);
}

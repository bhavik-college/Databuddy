import type { DateRange } from "@databuddy/shared/types/analytics";
import type {
	DynamicQueryFilter,
	DynamicQueryRequest,
	ParameterWithDates,
} from "@databuddy/shared/types/api";
import { useMemo } from "react";
import { useBatchDynamicQuery } from "@/hooks/use-dynamic-query";
import { resolveDateRange } from "../utils/date-presets";
import { formatWidgetValue, parseNumericValue } from "../utils/formatters";
import type {
	CardFilter,
	DashboardWidgetBase,
	DateRangePreset,
	QueryCell,
	QueryRow,
} from "../utils/types";

interface UseDashboardDataOptions {
	enabled?: boolean;
}

interface ChartDataPoint {
	date: string;
	value: number;
}

interface DashboardDataResult {
	isLoading: boolean;
	isFetching: boolean;
	getValue: (cardId: string, queryType: string, field: string) => string;
	getRawValue: (
		cardId: string,
		queryType: string,
		field: string
	) => QueryCell | undefined;
	getRow: (cardId: string, queryType: string) => QueryRow | undefined;
	getRows: (cardId: string, queryType: string) => QueryRow[];
	getChartData: (
		cardId: string,
		queryType: string,
		field: string
	) => ChartDataPoint[];
	hasData: (cardId: string, queryType: string) => boolean;
}

interface WidgetWithSettings extends DashboardWidgetBase {
	filters?: CardFilter[];
	dateRangePreset?: DateRangePreset;
}

function toQueryFilters(filters?: CardFilter[]): DynamicQueryFilter[] {
	if (!filters || filters.length === 0) {
		return [];
	}
	return filters
		.filter((f) => f.value.trim() !== "")
		.map((f) => ({
			field: f.field,
			operator: f.operator,
			value: f.value,
		}));
}

function createFilterKey(filters?: CardFilter[]): string {
	if (!filters?.length) {
		return "";
	}
	return JSON.stringify(
		filters.map((f) => `${f.field}:${f.operator}:${f.value}`).sort()
	);
}

/**
 * Hook for fetching and accessing dashboard widget data.
 * Groups widgets by filters and uses ParameterWithDates for per-widget date ranges.
 */
export function useDashboardData<T extends WidgetWithSettings>(
	websiteId: string,
	globalDateRange: DateRange,
	widgets: T[],
	options?: UseDashboardDataOptions
): DashboardDataResult {
	// Group widgets by filters (date ranges are handled per-parameter)
	const { queries, cardToQueryMap } = useMemo(() => {
		// Group by filter combination - each unique filter set gets its own query
		const filterGroups = new Map<
			string,
			{
				filters?: DynamicQueryFilter[];
				parameters: Map<string, ParameterWithDates>;
				cardIds: string[];
			}
		>();

		for (const widget of widgets) {
			const filterKey = createFilterKey(widget.filters);
			const resolvedDateRange = resolveDateRange(
				widget.dateRangePreset || "global",
				globalDateRange
			);

			if (!filterGroups.has(filterKey)) {
				filterGroups.set(filterKey, {
					filters:
						widget.filters && widget.filters.length > 0
							? toQueryFilters(widget.filters)
							: undefined,
					parameters: new Map(),
					cardIds: [],
				});
			}

			const group = filterGroups.get(filterKey);
			if (!group) {
				continue;
			}
			group.cardIds.push(widget.id);

			// Create a unique parameter key for this queryType + dateRange combo
			const paramKey = `${widget.queryType}|${resolvedDateRange.start_date}|${resolvedDateRange.end_date}`;

			if (!group.parameters.has(paramKey)) {
				group.parameters.set(paramKey, {
					name: widget.queryType,
					id: paramKey,
					start_date: resolvedDateRange.start_date,
					end_date: resolvedDateRange.end_date,
					granularity: resolvedDateRange.granularity,
				});
			}
		}

		// Build queries - one per filter group
		const batchQueries: DynamicQueryRequest[] = [];
		const cardMap = new Map<string, { queryId: string; paramId: string }>();

		let queryIndex = 0;
		for (const [, group] of filterGroups) {
			const queryId = `query-${queryIndex++}`;

			batchQueries.push({
				id: queryId,
				parameters: [...group.parameters.values()],
				filters: group.filters,
				granularity: globalDateRange.granularity,
			});

			// Map each card to its query and parameter
			for (const cardId of group.cardIds) {
				const widget = widgets.find((w) => w.id === cardId);
				if (widget) {
					const resolvedDateRange = resolveDateRange(
						widget.dateRangePreset || "global",
						globalDateRange
					);
					const paramId = `${widget.queryType}|${resolvedDateRange.start_date}|${resolvedDateRange.end_date}`;
					cardMap.set(cardId, { queryId, paramId });
				}
			}
		}

		return { queries: batchQueries, cardToQueryMap: cardMap };
	}, [widgets, globalDateRange]);

	const { getDataForQuery, isLoading, isFetching } = useBatchDynamicQuery(
		websiteId,
		globalDateRange,
		queries,
		{
			enabled: (options?.enabled ?? true) && queries.length > 0,
		}
	);

	const getValue = useMemo(
		() =>
			(cardId: string, queryType: string, field: string): string => {
				const mapping = cardToQueryMap.get(cardId);
				if (!mapping) {
					return "—";
				}

				// Try to get data using the paramId (which includes date range info)
				let rows = getDataForQuery(mapping.queryId, mapping.paramId);

				// Fallback to queryType if paramId doesn't work
				if (!Array.isArray(rows) || rows.length === 0) {
					rows = getDataForQuery(mapping.queryId, queryType);
				}

				if (!Array.isArray(rows) || rows.length === 0) {
					return "—";
				}

				const firstRow = rows.at(0);
				if (!firstRow) {
					return "—";
				}

				return formatWidgetValue(firstRow[field], field);
			},
		[getDataForQuery, cardToQueryMap]
	);

	const getRawValue = useMemo(
		() =>
			(
				cardId: string,
				queryType: string,
				field: string
			): QueryCell | undefined => {
				const mapping = cardToQueryMap.get(cardId);
				if (!mapping) {
					return undefined;
				}

				let rows = getDataForQuery(mapping.queryId, mapping.paramId);
				if (!Array.isArray(rows) || rows.length === 0) {
					rows = getDataForQuery(mapping.queryId, queryType);
				}

				if (!Array.isArray(rows) || rows.length === 0) {
					return undefined;
				}

				const firstRow = rows.at(0);
				return firstRow?.[field];
			},
		[getDataForQuery, cardToQueryMap]
	);

	const getRow = useMemo(
		() =>
			(cardId: string, queryType: string): QueryRow | undefined => {
				const mapping = cardToQueryMap.get(cardId);
				if (!mapping) {
					return undefined;
				}

				let rows = getDataForQuery(mapping.queryId, mapping.paramId);
				if (!Array.isArray(rows) || rows.length === 0) {
					rows = getDataForQuery(mapping.queryId, queryType);
				}

				if (!Array.isArray(rows) || rows.length === 0) {
					return undefined;
				}
				return rows.at(0);
			},
		[getDataForQuery, cardToQueryMap]
	);

	const getRows = useMemo(
		() =>
			(cardId: string, queryType: string): QueryRow[] => {
				const mapping = cardToQueryMap.get(cardId);
				if (!mapping) {
					return [];
				}

				let rows = getDataForQuery(mapping.queryId, mapping.paramId);
				if (!Array.isArray(rows) || rows.length === 0) {
					rows = getDataForQuery(mapping.queryId, queryType);
				}

				if (!Array.isArray(rows)) {
					return [];
				}
				return rows;
			},
		[getDataForQuery, cardToQueryMap]
	);

	const getChartData = useMemo(
		() =>
			(cardId: string, queryType: string, field: string): ChartDataPoint[] => {
				const mapping = cardToQueryMap.get(cardId);
				if (!mapping) {
					return [];
				}

				let rows = getDataForQuery(mapping.queryId, mapping.paramId);
				if (!Array.isArray(rows) || rows.length === 0) {
					rows = getDataForQuery(mapping.queryId, queryType);
				}

				if (!Array.isArray(rows)) {
					return [];
				}

				return rows
					.map((row) => {
						const rawDate = row.date;
						const rawValue = row[field];
						return {
							date: rawDate ? String(rawDate) : "",
							value: parseNumericValue(rawValue),
						};
					})
					.filter((d) => d.date);
			},
		[getDataForQuery, cardToQueryMap]
	);

	const hasData = useMemo(
		() =>
			(cardId: string, queryType: string): boolean => {
				const mapping = cardToQueryMap.get(cardId);
				if (!mapping) {
					return false;
				}

				let rows = getDataForQuery(mapping.queryId, mapping.paramId);
				if (!Array.isArray(rows) || rows.length === 0) {
					rows = getDataForQuery(mapping.queryId, queryType);
				}

				return Array.isArray(rows) && rows.length > 0;
			},
		[getDataForQuery, cardToQueryMap]
	);

	return {
		isLoading,
		isFetching,
		getValue,
		getRawValue,
		getRow,
		getRows,
		getChartData,
		hasData,
	};
}

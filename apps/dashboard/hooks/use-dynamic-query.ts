import type { DateRange, ProfileData } from "@databuddy/shared/types/analytics";
import type {
	BatchQueryResponse,
	DynamicQueryFilter,
	DynamicQueryRequest,
	DynamicQueryResponse,
} from "@databuddy/shared/types/api";
import type {
	ExtractDataTypes,
	ParameterDataMap,
} from "@databuddy/shared/types/parameters";
import { type UseQueryOptions, useQuery } from "@tanstack/react-query";
import { useCallback, useMemo } from "react";
import { getUserTimezone } from "@/lib/timezone";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

function buildParams(
	websiteId: string,
	dateRange?: DateRange,
	additionalParams?: Record<string, string | number>
): URLSearchParams {
	const params = new URLSearchParams({
		website_id: websiteId,
		...additionalParams,
	});

	if (dateRange?.start_date) {
		params.append("start_date", dateRange.start_date);
	}

	if (dateRange?.end_date) {
		params.append("end_date", dateRange.end_date);
	}

	if (dateRange?.granularity) {
		params.append("granularity", dateRange.granularity);
	}

	params.append("_t", Date.now().toString());

	return params;
}

const defaultQueryOptions = {
	staleTime: 2 * 60 * 1000,
	gcTime: 30 * 60 * 1000,
	refetchOnWindowFocus: false,
	refetchOnMount: true,
	refetchInterval: 10 * 60 * 1000,
	retry: (failureCount: number, error: Error) => {
		if (error instanceof DOMException && error.name === "AbortError") {
			return false;
		}
		return failureCount < 2;
	},
	networkMode: "online" as const,
	refetchIntervalInBackground: false,
	placeholderData: undefined,
};

function transformFilters(filters?: DynamicQueryRequest["filters"]) {
	return filters?.map(({ field, operator, value }) => ({
		field,
		op: operator,
		value,
	}));
}

async function fetchDynamicQuery(
	websiteId: string,
	dateRange: DateRange,
	queryData: DynamicQueryRequest | DynamicQueryRequest[],
	signal?: AbortSignal
): Promise<DynamicQueryResponse | BatchQueryResponse> {
	const timezone = getUserTimezone();
	const params = buildParams(websiteId, dateRange, { timezone });
	const url = `${API_BASE_URL}/v1/query?${params}`;

	const buildQuery = (query: DynamicQueryRequest) => ({
		...query,
		startDate: dateRange.start_date,
		endDate: dateRange.end_date,
		timeZone: timezone,
		limit: query.limit || 100,
		page: query.page || 1,
		filters: transformFilters(query.filters),
		granularity: query.granularity || dateRange.granularity || "daily",
		groupBy: query.groupBy,
	});

	const requestBody = Array.isArray(queryData)
		? queryData.map(buildQuery)
		: buildQuery(queryData);

	const response = await fetch(url, {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
		},
		credentials: "include",
		signal,
		body: JSON.stringify(requestBody),
	});

	if (!response.ok) {
		throw new Error(
			`Failed to fetch dynamic query data: ${response.statusText}`
		);
	}

	const data = await response.json();

	if (!data.success) {
		throw new Error(data.error || "Failed to fetch dynamic query data");
	}

	return data;
}

export function useDynamicQuery<T extends (keyof ParameterDataMap)[]>(
	websiteId: string,
	dateRange: DateRange,
	queryData: DynamicQueryRequest,
	options?: Partial<UseQueryOptions<DynamicQueryResponse>>
) {
	const fetchData = useCallback(
		async ({ signal }: { signal?: AbortSignal }) => {
			const result = await fetchDynamicQuery(
				websiteId,
				dateRange,
				queryData,
				signal
			);
			return result as DynamicQueryResponse;
		},
		[websiteId, dateRange, queryData]
	);

	const query = useQuery({
		queryKey: ["dynamic-query", websiteId, dateRange, queryData],
		queryFn: fetchData,
		...defaultQueryOptions,
		...options,
		enabled:
			options?.enabled !== false &&
			!!websiteId &&
			queryData.parameters.length > 0,
	});

	const processedData = useMemo(
		() =>
			query.data?.data.reduce(
				(acc, result) => {
					if (result.success) {
						acc[result.parameter] = result.data;
					}
					return acc;
				},
				{} as Record<string, any>
			) || {},
		[query.data]
	);

	const errors = useMemo(
		() =>
			query.data?.data
				.filter((result) => !result.success)
				.map((result) => ({
					parameter: result.parameter,
					error: result.error,
				})) || [],
		[query.data]
	);

	return {
		data: processedData as ExtractDataTypes<T>,
		meta: query.data?.meta,
		errors,
		isLoading: query.isLoading || query.isFetching || query.isPending,
		isError: query.isError,
		error: query.error,
		refetch: query.refetch,
		isFetching: query.isFetching,
		isPending: query.isPending,
	};
}

export function useBatchDynamicQuery(
	websiteId: string,
	dateRange: DateRange,
	queries: DynamicQueryRequest[],
	options?: Partial<UseQueryOptions<BatchQueryResponse>>
) {
	const fetchData = useCallback(
		async ({ signal }: { signal?: AbortSignal }) => {
			const result = await fetchDynamicQuery(
				websiteId,
				dateRange,
				queries,
				signal
			);
			return result as BatchQueryResponse;
		},
		[websiteId, dateRange, queries]
	);

	const query = useQuery({
		queryKey: [
			"batch-dynamic-query",
			websiteId,
			dateRange.start_date,
			dateRange.end_date,
			dateRange.granularity,
			dateRange.timezone,
			JSON.stringify(queries),
		],
		queryFn: fetchData,
		...defaultQueryOptions,
		...options,
		enabled: options?.enabled !== false && !!websiteId && queries.length > 0,
	});

	const processedResults = useMemo(() => {
		if (!query.data?.results) {
			return [];
		}

		return query.data.results.map((result) => {
			const processedResult = {
				queryId: result.queryId,
				success: false,
				data: {} as Record<string, any>,
				errors: [] as Array<{ parameter: string; error?: string }>,
				meta: result.meta,
				rawResult: result,
			};

			if (result.data && Array.isArray(result.data)) {
				for (const paramResult of result.data) {
					if (paramResult.success && paramResult.data) {
						processedResult.data[paramResult.parameter] = paramResult.data;
						processedResult.success = true;
					} else {
						processedResult.errors.push({
							parameter: paramResult.parameter,
							error: paramResult.error,
						});
					}
				}
			} else {
				processedResult.errors.push({
					parameter: "query",
					error: "No data array found in response",
				});
			}

			return processedResult;
		});
	}, [query.data]);

	const getDataForQuery = useCallback(
		(queryId: string, parameter: string) => {
			const result = processedResults.find((r) => r.queryId === queryId);
			if (!result?.success) {
				return [];
			}
			const data = result.data[parameter];
			return data || [];
		},
		[processedResults]
	);

	const hasDataForQuery = useCallback(
		(queryId: string, parameter: string) => {
			const result = processedResults.find((r) => r.queryId === queryId);
			return (
				result?.success &&
				result.data[parameter] &&
				Array.isArray(result.data[parameter]) &&
				result.data[parameter].length > 0
			);
		},
		[processedResults]
	);

	const getErrorsForQuery = useCallback(
		(queryId: string) => {
			const result = processedResults.find((r) => r.queryId === queryId);
			return result?.errors || [];
		},
		[processedResults]
	);

	return {
		results: processedResults,
		meta: query.data?.meta,
		isLoading: query.isLoading || query.isFetching || query.isPending,
		isError: query.isError,
		error: query.error,
		refetch: query.refetch,
		isFetching: query.isFetching,
		isPending: query.isPending,
		getDataForQuery,
		hasDataForQuery,
		getErrorsForQuery,
		debugInfo: {
			queryCount: queries.length,
			successfulQueries: processedResults.filter((r) => r.success).length,
			failedQueries: processedResults.filter((r) => !r.success).length,
			totalParameters: processedResults.reduce(
				(sum, r) => sum + Object.keys(r.data).length,
				0
			),
		},
	};
}

export function useMapLocationData(
	websiteId: string,
	dateRange: DateRange,
	filters?: DynamicQueryFilter[],
	options?: Partial<UseQueryOptions<BatchQueryResponse>>
) {
	return useBatchDynamicQuery(
		websiteId,
		dateRange,
		[
			{
				id: "map-countries",
				parameters: ["country"],
				limit: 100,
				filters,
			},
			{
				id: "map-regions",
				parameters: ["region"],
				limit: 100,
				filters,
			},
		],
		options
	);
}

export function useEnhancedErrorData(
	websiteId: string,
	dateRange: DateRange,
	options?: Partial<UseQueryOptions<BatchQueryResponse>> & {
		filters?: DynamicQueryFilter[];
	}
) {
	const filters = options?.filters || [];

	return useBatchDynamicQuery(
		websiteId,
		dateRange,
		[
			{ id: "recent_errors", parameters: ["recent_errors"], filters },
			{ id: "error_types", parameters: ["error_types"], filters },
			{ id: "errors_by_page", parameters: ["errors_by_page"], filters },
			{ id: "error_summary", parameters: ["error_summary"], filters },
			{ id: "error_chart_data", parameters: ["error_chart_data"], filters },
		],
		options
	);
}

function dedupeProfiles(profiles: ProfileData[]): ProfileData[] {
	const seen = new Set<string>();
	return profiles.filter((p) => {
		if (seen.has(p.visitor_id)) {
			return false;
		}
		seen.add(p.visitor_id);
		return true;
	});
}

export function useProfilesData(
	websiteId: string,
	dateRange: DateRange,
	limit = 50,
	page = 1,
	filters?: DynamicQueryFilter[],
	options?: Partial<UseQueryOptions<DynamicQueryResponse>>
) {
	const queryResult = useDynamicQuery(
		websiteId,
		dateRange,
		{
			id: "profiles-list",
			parameters: ["profile_list"],
			limit,
			page,
			filters,
		},
		{
			...options,
			staleTime: 5 * 60 * 1000,
			gcTime: 10 * 60 * 1000,
		}
	);

	const profiles = useMemo(() => {
		const rawProfiles = (queryResult.data as any)?.profile_list || [];
		return dedupeProfiles(rawProfiles);
	}, [queryResult.data]);

	const hasNextPage = useMemo(
		() => profiles.length === limit,
		[profiles.length, limit]
	);

	const hasPrevPage = useMemo(() => page > 1, [page]);

	return {
		...queryResult,
		profiles,
		pagination: {
			page,
			limit,
			hasNext: hasNextPage,
			hasPrev: hasPrevPage,
		},
	};
}

export function useUserProfile(
	websiteId: string,
	userId: string,
	dateRange: DateRange,
	options?: Partial<UseQueryOptions<DynamicQueryResponse>>
) {
	const sharedOptions = {
		...options,
		staleTime: 5 * 60 * 1000,
		gcTime: 10 * 60 * 1000,
		enabled: Boolean(userId && websiteId),
	};

	const profileQuery = useDynamicQuery(
		websiteId,
		dateRange,
		{
			id: `user-profile-${userId}`,
			parameters: ["profile_detail"],
			filters: [
				{
					field: "anonymous_id",
					operator: "eq",
					value: userId,
				},
			],
		},
		sharedOptions
	);

	const sessionsQuery = useDynamicQuery(
		websiteId,
		dateRange,
		{
			id: `user-sessions-${userId}`,
			parameters: ["profile_sessions"],
			filters: [
				{
					field: "anonymous_id",
					operator: "eq",
					value: userId,
				},
			],
			limit: 100,
		},
		sharedOptions
	);

	const userProfile = useMemo(() => {
		const rawProfile = (profileQuery.data as any)?.profile_detail?.[0];
		if (!rawProfile) {
			return null;
		}

		const rawSessions = (sessionsQuery.data as any)?.profile_sessions || [];

		const sessions = Array.isArray(rawSessions)
			? rawSessions.map((session: any) => ({
				session_id: session.session_id,
				session_name: session.session_name || "Session",
				first_visit: session.first_visit,
				last_visit: session.last_visit,
				duration: session.duration || 0,
				duration_formatted: session.duration_formatted || "0s",
				page_views: session.page_views || 0,
				unique_pages: session.unique_pages || 0,
				device: session.device || "",
				browser: session.browser || "",
				os: session.os || "",
				country: session.country || "",
				region: session.region || "",
				referrer: session.referrer || "direct",
				events:
					Array.isArray(session.events) && session.events.length > 0
						? session.events.map((eventTuple: any[]) => {
							let propertiesObj: Record<string, unknown> = {};
							if (eventTuple[4]) {
								try {
									propertiesObj = JSON.parse(eventTuple[4]);
								} catch {
									// Silent fail
								}
							}
							return {
								event_id: eventTuple[0],
								time: eventTuple[1],
								event_name: eventTuple[2],
								path: eventTuple[3],
								properties: propertiesObj,
							};
						})
						: [],
			}))
			: [];

		return {
			visitor_id: rawProfile.visitor_id,
			first_visit: rawProfile.first_visit,
			last_visit: rawProfile.last_visit,
			total_sessions: rawProfile.total_sessions,
			total_pageviews: rawProfile.total_pageviews,
			total_duration: rawProfile.total_duration,
			total_duration_formatted: rawProfile.total_duration_formatted,
			device: rawProfile.device,
			browser: rawProfile.browser,
			os: rawProfile.os,
			country: rawProfile.country,
			region: rawProfile.region,
			sessions,
		};
	}, [profileQuery.data, sessionsQuery.data]);

	return {
		userProfile,
		isLoading: profileQuery.isLoading || sessionsQuery.isLoading,
		isError: profileQuery.isError || sessionsQuery.isError,
		error: profileQuery.error || sessionsQuery.error,
	};
}

export function useRealTimeStats(
	websiteId: string,
	options?: Partial<UseQueryOptions<DynamicQueryResponse>>
) {
	const dateRange = useMemo(() => {
		const now = new Date();
		const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000);
		return {
			start_date: fiveMinutesAgo.toISOString(),
			end_date: now.toISOString(),
		};
	}, []);

	const queryResult = useDynamicQuery(
		websiteId,
		dateRange,
		{
			id: "realtime-active-stats",
			parameters: ["active_stats"],
		},
		{
			...options,
			refetchInterval: 5000,
			staleTime: 0,
			gcTime: 10_000,
			refetchOnWindowFocus: true,
			refetchOnMount: true,
		}
	);

	const activeUsers = useMemo(() => {
		const data = (queryResult.data as any)?.active_stats?.[0];
		return data?.active_users || 0;
	}, [queryResult.data]);

	return { ...queryResult, activeUsers };
}

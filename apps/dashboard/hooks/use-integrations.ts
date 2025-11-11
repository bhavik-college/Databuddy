"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { orpc } from "@/lib/orpc";

export function useIntegrations() {
	const { data, isLoading, isError, refetch, isFetching } = useQuery({
		...orpc.integrations.getIntegrations.queryOptions(),
	});

	return {
		integrations: data?.integrations ?? [],
		totalConnected: data?.totalConnected ?? 0,
		isLoading,
		isFetching,
		isError,
		refetch,
	};
}

export function useIntegration(provider: "vercel") {
	return useQuery({
		...orpc.integrations.getIntegration.queryOptions({ input: { provider } }),
		enabled: !!provider,
	});
}

export function useDisconnectIntegration() {
	const queryClient = useQueryClient();
	return useMutation({
		...orpc.integrations.disconnect.mutationOptions(),
		onSuccess: () => {
			queryClient.invalidateQueries({
				queryKey: orpc.integrations.getIntegrations.key(),
			});
			queryClient.invalidateQueries({
				queryKey: orpc.integrations.getStats.key(),
			});
		},
		onError: (error) => {
			console.error("Failed to disconnect integration:", error);
		},
	});
}

export function useIntegrationStats() {
	return useQuery({
		...orpc.integrations.getStats.queryOptions(),
	});
}

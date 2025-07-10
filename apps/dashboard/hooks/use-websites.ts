"use client";

import { authClient } from "@databuddy/auth/client";
import { trpc } from "@/lib/trpc";
import type { inferRouterInputs, inferRouterOutputs } from "@trpc/server";
import type { AppRouter } from "@databuddy/rpc";

type RouterInput = inferRouterInputs<AppRouter>;
type RouterOutput = inferRouterOutputs<AppRouter>;

export type Website = RouterOutput["websites"]["list"][number];
export type CreateWebsiteData = RouterInput["websites"]["create"];
export type UpdateWebsiteData = RouterInput["websites"]["update"];

export function useWebsites() {
	const { data: activeOrganization, isPending: isLoadingOrganization } =
		authClient.useActiveOrganization();
	const { data, isLoading, isError, refetch } = trpc.websites.list.useQuery(
		{
			organizationId: activeOrganization?.id,
		},
		{
			enabled: !isLoadingOrganization,
		},
	);

	return {
		websites: data || [],
		isLoading: isLoading || isLoadingOrganization,
		isError,
		refetch,
	};
}

export function useWebsite(id: string) {
	return trpc.websites.getById.useQuery(
		{ id },
		{ enabled: !!id }
	);
}

export function useCreateWebsite() {
	const utils = trpc.useUtils();
	return trpc.websites.create.useMutation({
		onSuccess: () => {
			utils.websites.list.invalidate();
		}
	});
}

export function useUpdateWebsite() {
	const utils = trpc.useUtils();
	return trpc.websites.update.useMutation({
		onSuccess: (data) => {
			utils.websites.list.invalidate();
			utils.websites.getById.invalidate({ id: data.id });
		}
	});
}

export function useDeleteWebsite() {
	const utils = trpc.useUtils();
	return trpc.websites.delete.useMutation({
		onSuccess: (_, { id }) => {
			utils.websites.list.invalidate();
			utils.websites.getById.invalidate({ id });
		}
	});
}

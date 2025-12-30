"use client";

import type { InferSelectModel, websites } from "@databuddy/db";
import { createContext, type ReactNode, useContext } from "react";
import { useTrackingSetup } from "@/hooks/use-tracking-setup";
import { useWebsite } from "@/hooks/use-websites";

export type Website = InferSelectModel<typeof websites>;

interface WebsiteContextValue {
	website: Website | undefined;
	websiteId: string;
	isLoading: boolean;
	isError: boolean;
	error: Error | null;
	refetchAction: () => void;
	isTrackingSetup: boolean | null;
	isTrackingSetupLoading: boolean;
	refetchTrackingSetupAction: () => void;
}

const WebsiteContext = createContext<WebsiteContextValue | null>(null);

interface WebsiteProviderProps {
	websiteId: string;
	children: ReactNode;
}

export function WebsiteProvider({ websiteId, children }: WebsiteProviderProps) {
	const {
		data,
		isLoading,
		isError,
		error,
		refetch: refetchWebsite,
	} = useWebsite(websiteId);

	const { isTrackingSetup, isTrackingSetupLoading, refetchTrackingSetup } =
		useTrackingSetup(websiteId);

	return (
		<WebsiteContext.Provider
			value={{
				website: data,
				websiteId,
				isLoading,
				isError,
				error: error as Error | null,
				refetchAction: refetchWebsite,
				isTrackingSetup,
				isTrackingSetupLoading,
				refetchTrackingSetupAction: refetchTrackingSetup,
			}}
		>
			{children}
		</WebsiteContext.Provider>
	);
}

export function useWebsiteContext() {
	const context = useContext(WebsiteContext);
	if (!context) {
		throw new Error("useWebsiteContext must be used within WebsiteProvider");
	}
	return context;
}

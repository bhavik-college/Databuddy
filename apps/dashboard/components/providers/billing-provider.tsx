"use client";

import type { Customer, CustomerFeature, Product } from "autumn-js";
import { useCustomer, usePricingTable } from "autumn-js/react";
import dayjs from "dayjs";
import { createContext, type ReactNode, useContext, useMemo } from "react";
import {
	FEATURE_IDS,
	FEATURE_METADATA,
	type FeatureId,
	GATED_FEATURES,
	type GatedFeatureId,
	getMinimumPlanForFeature,
	isPlanFeatureEnabled,
	PLAN_IDS,
	type PlanId,
} from "@/types/features";

export interface FeatureAccess {
	allowed: boolean;
	balance: number;
	limit: number;
	unlimited: boolean;
	usagePercent: number | null;
}

export interface GatedFeatureAccess {
	allowed: boolean;
	minPlan: PlanId | null;
	upgradeMessage: string | null;
}

export interface BillingContextValue {
	customer: Customer | null;
	products: Product[];
	isLoading: boolean;
	hasActiveSubscription: boolean;
	currentPlanId: PlanId | null;
	isFree: boolean;
	// Usage-based features
	canUse: (featureId: FeatureId | string) => boolean;
	getUsage: (featureId: FeatureId | string) => FeatureAccess;
	getFeature: (featureId: FeatureId | string) => CustomerFeature | null;
	// Gated features
	isFeatureEnabled: (feature: GatedFeatureId) => boolean;
	getGatedFeatureAccess: (feature: GatedFeatureId) => GatedFeatureAccess;
	getUpgradeMessage: (
		featureId: FeatureId | GatedFeatureId | string
	) => string | null;
	refetch: () => void;
}

const BillingContext = createContext<BillingContextValue | null>(null);

export function BillingProvider({ children }: { children: ReactNode }) {
	const {
		customer,
		isLoading: isCustomerLoading,
		refetch: refetchCustomer,
	} = useCustomer();

	const {
		products,
		isLoading: isProductsLoading,
		refetch: refetchProducts,
	} = usePricingTable();

	const value = useMemo<BillingContextValue>(() => {
		const activeProduct = customer?.products?.find(
			(p) =>
				p.status === "active" ||
				(p.canceled_at && dayjs(p.current_period_end).isAfter(dayjs()))
		);

		const currentPlanId = (activeProduct?.id ?? PLAN_IDS.FREE) as PlanId;
		const currentPlan = products?.find((p) => p.id === currentPlanId);
		const isFree =
			currentPlanId === PLAN_IDS.FREE ||
			currentPlan?.properties?.is_free === true ||
			!activeProduct;

		const getFeature = (id: FeatureId | string): CustomerFeature | null =>
			customer?.features?.[id] ?? null;

		const canUse = (id: FeatureId | string): boolean => {
			const feature = customer?.features?.[id];
			if (!feature) return false;
			if (feature.unlimited) return true;
			return (feature.balance ?? 0) > 0;
		};

		const getUsage = (id: FeatureId | string): FeatureAccess => {
			const feature = customer?.features?.[id];
			if (!feature) {
				return {
					allowed: false,
					balance: 0,
					limit: 0,
					unlimited: false,
					usagePercent: null,
				};
			}

			const balance = feature.balance ?? 0;
			const limit = feature.included_usage ?? 0;
			const unlimited = feature.unlimited ?? false;
			const usagePercent =
				!unlimited && limit > 0
					? Math.round(((limit - balance) / limit) * 100)
					: null;

			return {
				allowed: unlimited || balance > 0,
				balance,
				limit,
				unlimited,
				usagePercent,
			};
		};

		const isFeatureEnabled = (feature: GatedFeatureId): boolean =>
			isPlanFeatureEnabled(currentPlanId, feature);

		const getGatedFeatureAccess = (
			feature: GatedFeatureId
		): GatedFeatureAccess => {
			const allowed = isPlanFeatureEnabled(currentPlanId, feature);
			return {
				allowed,
				minPlan: getMinimumPlanForFeature(feature),
				upgradeMessage: allowed
					? null
					: (FEATURE_METADATA[feature]?.upgradeMessage ?? null),
			};
		};

		const getUpgradeMessage = (
			id: FeatureId | GatedFeatureId | string
		): string | null =>
			FEATURE_METADATA[id as FeatureId | GatedFeatureId]?.upgradeMessage ??
			null;

		const refetch = () => {
			refetchCustomer();
			if (typeof refetchProducts === "function") refetchProducts();
		};

		return {
			customer: customer ?? null,
			products: products ?? [],
			isLoading: isCustomerLoading || isProductsLoading,
			hasActiveSubscription: !!activeProduct && !isFree,
			currentPlanId,
			isFree,
			canUse,
			getUsage,
			getFeature,
			isFeatureEnabled,
			getGatedFeatureAccess,
			getUpgradeMessage,
			refetch,
		};
	}, [
		customer,
		products,
		isCustomerLoading,
		isProductsLoading,
		refetchCustomer,
		refetchProducts,
	]);

	return (
		<BillingContext.Provider value={value}>{children}</BillingContext.Provider>
	);
}

export function useBillingContext(): BillingContextValue {
	const context = useContext(BillingContext);
	if (!context) {
		throw new Error("useBillingContext must be used within BillingProvider");
	}
	return context;
}

export function useUsageFeature(featureId: FeatureId) {
	const { canUse, getUsage, getUpgradeMessage, isFree } = useBillingContext();
	return {
		...getUsage(featureId),
		canUse: canUse(featureId),
		upgradeMessage: getUpgradeMessage(featureId),
		isFree,
	};
}

export function useGatedFeature(feature: GatedFeatureId) {
	const { isFeatureEnabled, getGatedFeatureAccess, currentPlanId, isFree } =
		useBillingContext();
	return {
		...getGatedFeatureAccess(feature),
		isEnabled: isFeatureEnabled(feature),
		currentPlanId,
		isFree,
	};
}

export {
	FEATURE_IDS,
	FEATURE_METADATA,
	GATED_FEATURES,
	PLAN_IDS,
	type FeatureId,
	type GatedFeatureId,
	type PlanId,
};

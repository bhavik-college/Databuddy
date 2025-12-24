import { type ComputedRef, computed, ref, watchEffect } from "vue";
import type { FlagState } from "@/core/flags/types";
import { useFlags } from "./flags-plugin";

export interface UseFlagReturn {
	/** Whether the flag is on */
	on: ComputedRef<boolean>;
	/** @deprecated Use `on` instead */
	enabled: ComputedRef<boolean>;
	/** Whether the flag is loading */
	loading: ComputedRef<boolean>;
	/** @deprecated Use `loading` instead */
	isLoading: ComputedRef<boolean>;
	/** @deprecated Use `status === 'ready'` instead */
	isReady: ComputedRef<boolean>;
	/** Full flag state */
	state: ComputedRef<FlagState>;
}

const defaultState: FlagState = {
	on: false,
	enabled: false,
	status: "loading",
	loading: true,
	isLoading: true,
	isReady: false,
};

/**
 * Vue composable for individual flag usage with reactivity
 */
export function useFlag(key: string): UseFlagReturn {
	const { isEnabled } = useFlags();
	const flagState = ref<FlagState>(defaultState);

	// Update flag state reactively
	watchEffect(() => {
		flagState.value = isEnabled(key);
	});

	return {
		on: computed(() => flagState.value.on),
		enabled: computed(() => flagState.value.enabled),
		loading: computed(() => flagState.value.loading),
		isLoading: computed(() => flagState.value.isLoading),
		isReady: computed(() => flagState.value.isReady),
		state: computed(() => flagState.value),
	};
}

/**
 * Vue composable for boolean flag checking
 * @deprecated Use `useFlag(key).on` instead
 */
export function useBooleanFlag(key: string): ComputedRef<boolean> {
	const { on } = useFlag(key);
	return on;
}

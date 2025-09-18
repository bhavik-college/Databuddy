import { formatDuration as baseFormatDuration } from '@/lib/utils';

export const formatCompact = (value: number): string => {
	if (value == null || Number.isNaN(value)) {
		return '0';
	}
	return Intl.NumberFormat(undefined, {
		notation: 'compact',
		maximumFractionDigits: 1,
	}).format(value);
};

export const formatPercent = (value: number, fractionDigits = 1): string => {
	if (value == null || Number.isNaN(value)) {
		return '0%';
	}
	return `${value.toFixed(fractionDigits)}%`;
};

export const formatDuration = (seconds: number): string =>
	baseFormatDuration(seconds);

// Normalizes seconds to a chart-friendly integer value (seconds), rounding small values.
export const normalizeDurationSeconds = (seconds: number): number => {
	if (!seconds || Number.isNaN(seconds)) {
		return 0;
	}
	if (seconds < 60) {
		return Math.round(seconds);
	}
	const minutes = Math.floor(seconds / 60);
	const remainingSeconds = Math.round(seconds % 60);
	return minutes * 60 + remainingSeconds;
};

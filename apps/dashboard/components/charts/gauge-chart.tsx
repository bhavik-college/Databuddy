"use client";

import { motion, useSpring, useTransform } from "motion/react";
import { memo, useMemo } from "react";

type GaugeRating = "good" | "needs-improvement" | "poor";

type GaugeChartProps = {
	/** Current value to display */
	value: number;
	/** Maximum value for the gauge (100% fill) */
	max: number;
	/** Rating determines the color */
	rating: GaugeRating;
	/** Size of the chart in pixels */
	size?: number;
	/** Format the center label value */
	formatValue?: (value: number) => string;
	/** Optional unit to display below the value */
	unit?: string;
	/** Number of tick marks */
	tickCount?: number;
	/** Starting angle in degrees (0 = top, 90 = right) */
	startAngle?: number;
	/** Sweep angle in degrees */
	sweepAngle?: number;
};

const RATING_COLORS: Record<GaugeRating, { base: string; glow: string }> = {
	good: { base: "#10b981", glow: "rgba(16, 185, 129, 0.4)" },
	"needs-improvement": { base: "#f59e0b", glow: "rgba(245, 158, 11, 0.4)" },
	poor: { base: "#ef4444", glow: "rgba(239, 68, 68, 0.4)" },
};

const INACTIVE_COLOR = "hsl(var(--muted))";

type TickProps = {
	index: number;
	tickCount: number;
	cx: number;
	cy: number;
	radius: number;
	tickLength: number;
	tickWidth: number;
	startAngle: number;
	sweepAngle: number;
	activeColor: string;
	glowColor: string;
	progress: ReturnType<typeof useSpring>;
};

const Tick = memo(function Tick({
	index,
	tickCount,
	cx,
	cy,
	radius,
	tickLength,
	tickWidth,
	startAngle,
	sweepAngle,
	activeColor,
	glowColor,
	progress,
}: TickProps) {
	const t = tickCount > 1 ? index / (tickCount - 1) : 0;
	const angle = startAngle + t * sweepAngle;
	const angleRad = (angle * Math.PI) / 180;

	const x1 = cx + (radius - tickLength) * Math.cos(angleRad);
	const y1 = cy + (radius - tickLength) * Math.sin(angleRad);
	const x2 = cx + radius * Math.cos(angleRad);
	const y2 = cy + radius * Math.sin(angleRad);

	const threshold = index / tickCount;
	const stroke = useTransform(progress, (p) =>
		p > threshold ? activeColor : INACTIVE_COLOR
	);
	const strokeOpacity = useTransform(progress, (p) =>
		p > threshold ? 1 : 0.35
	);
	const filter = useTransform(progress, (p) =>
		p > threshold ? `drop-shadow(0 0 3px ${glowColor})` : "none"
	);

	return (
		<motion.line
			strokeLinecap="round"
			strokeWidth={tickWidth}
			style={{ stroke, strokeOpacity, filter }}
			x1={x1}
			x2={x2}
			y1={y1}
			y2={y2}
		/>
	);
});

export const GaugeChart = memo(function GaugeChart({
	value,
	max,
	rating,
	size = 120,
	formatValue,
	unit,
	tickCount = 36,
	startAngle = -135,
	sweepAngle = 270,
}: GaugeChartProps) {
	const targetProgress = Math.max(0, Math.min(value / max, 1));
	const progress = useSpring(targetProgress, { stiffness: 120, damping: 20 });

	const displayValue = formatValue
		? formatValue(value)
		: Math.round(value).toString();

	const colors = RATING_COLORS[rating];

	const padding = 8;
	const cx = size / 2;
	const cy = size / 2;
	const radius = size / 2 - padding;
	const tickLength = size * 0.12;
	const tickWidth = Math.max(2, size * 0.025);

	const tickIndices = useMemo(
		() => Array.from({ length: tickCount }, (_, i) => i),
		[tickCount]
	);

	const innerRadius = radius - tickLength - 4;
	const maxTextWidth = innerRadius * 1.4;
	const charCount = displayValue.length + (unit ? unit.length * 0.6 : 0);
	const baseFontSize = size * 0.22;
	const scaledFontSize = Math.min(
		baseFontSize,
		maxTextWidth / (charCount * 0.55)
	);
	const valueFontSize = Math.round(Math.max(12, scaledFontSize));
	const unitFontSize = Math.round(valueFontSize * 0.5);

	return (
		<div
			className="relative flex items-center justify-center"
			style={{ width: size, height: size }}
		>
			<svg
				aria-hidden="true"
				className="absolute inset-0"
				height={size}
				viewBox={`0 0 ${size} ${size}`}
				width={size}
			>
				{tickIndices.map((i) => (
					<Tick
						activeColor={colors.base}
						cx={cx}
						cy={cy}
						glowColor={colors.glow}
						index={i}
						key={i}
						progress={progress}
						radius={radius}
						startAngle={startAngle}
						sweepAngle={sweepAngle}
						tickCount={tickCount}
						tickLength={tickLength}
						tickWidth={tickWidth}
					/>
				))}
			</svg>
			<div className="relative z-10 flex items-baseline justify-center gap-0.5">
				<span
					className="font-semibold text-foreground tabular-nums tracking-tight"
					style={{ fontSize: valueFontSize, lineHeight: 1 }}
				>
					{displayValue}
				</span>
				{unit ? (
					<span
						className="text-muted-foreground"
						style={{ fontSize: unitFontSize, lineHeight: 1 }}
					>
						{unit}
					</span>
				) : null}
			</div>
		</div>
	);
});

export type { GaugeRating, GaugeChartProps };

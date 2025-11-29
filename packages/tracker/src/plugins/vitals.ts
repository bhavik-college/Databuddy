import { type Metric, onCLS, onFCP, onINP, onLCP, onTTFB } from "web-vitals";
import type { BaseTracker } from "../core/tracker";
import { logger } from "../core/utils";

type WebVitalMetricName = "FCP" | "LCP" | "CLS" | "INP" | "TTFB" | "FPS";

type WebVitalSpan = {
	sessionId: string;
	timestamp: number;
	path: string;
	metricName: WebVitalMetricName;
	metricValue: number;
};

type FPSMetric = {
	name: "FPS";
	value: number;
};

const onFPS = (callback: (metric: FPSMetric) => void) => {
	if (typeof window === "undefined") {
		return;
	}

	let frames = 0;
	const start = performance.now();
	const duration = 2000;

	const countFrame = () => {
		frames += 1;
		if (performance.now() - start < duration) {
			requestAnimationFrame(countFrame);
		} else {
			callback({ name: "FPS", value: Math.round((frames / duration) * 1000) });
		}
	};

	if (document.readyState === "complete") {
		requestAnimationFrame(countFrame);
	} else {
		window.addEventListener("load", () => requestAnimationFrame(countFrame), { once: true });
	}
};

export function initWebVitalsTracking(tracker: BaseTracker) {
	if (tracker.isServer()) {
		return;
	}

	const sentMetrics = new Set<WebVitalMetricName>();

	const sendVitalSpan = (metricName: WebVitalMetricName, metricValue: number) => {
		if (sentMetrics.has(metricName)) {
			return;
		}
		sentMetrics.add(metricName);

		const span: WebVitalSpan = {
			sessionId: tracker.sessionId ?? "",
			timestamp: Date.now(),
			path: window.location.pathname,
			metricName,
			metricValue,
		};

		logger.log(`Sending web vital span: ${metricName}`, span);
		tracker.sendBeacon(span);
	};

	const handleMetric = (metric: Metric | FPSMetric) => {
		const name = metric.name as WebVitalMetricName;
		const value = name === "CLS" ? metric.value : Math.round(metric.value);

		logger.log(`Web Vital captured: ${name}`, value);
		sendVitalSpan(name, value);
	};

	onFCP(handleMetric);
	onLCP(handleMetric);
	onCLS(handleMetric);
	onINP(handleMetric);
	onTTFB(handleMetric);
	onFPS(handleMetric);
}

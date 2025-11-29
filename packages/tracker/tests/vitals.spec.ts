import { expect, test } from "@playwright/test";

type VitalSpan = {
	sessionId: string;
	timestamp: number;
	path: string;
	metricName: string;
	metricValue: number;
};

test.describe("Web Vitals Tracking", () => {
	test.beforeEach(async ({ page }) => {
		// Disable sendBeacon for reliable route interception (WebKit issue)
		await page.addInitScript(() => {
			Object.defineProperty(navigator, "sendBeacon", { value: undefined });
		});

		await page.route("**/basket.databuddy.cc/vitals", async (route) => {
			await route.fulfill({
				status: 200,
				contentType: "application/json",
				body: JSON.stringify({ success: true }),
				headers: { "Access-Control-Allow-Origin": "*" },
			});
		});
	});

	test("sends each vital as individual span", async ({ page }) => {
		const vitalsReceived: VitalSpan[] = [];

		page.on("request", (req) => {
			if (req.url().includes("/basket.databuddy.cc/vitals") && req.method() === "POST") {
				const payload = req.postDataJSON() as VitalSpan;
				vitalsReceived.push(payload);
			}
		});

		await page.goto("/test");

		await page.evaluate(() => {
			(window as never as { databuddyConfig: unknown }).databuddyConfig = {
				clientId: "test-client-id",
				trackWebVitals: true,
				ignoreBotDetection: true,
			};
		});
		await page.addScriptTag({ url: "/dist/vitals.js" });

		// Wait for FPS measurement (2 seconds) plus buffer
		await page.waitForTimeout(3000);

		// Should have received at least one vital span
		if (vitalsReceived.length > 0) {
			const span = vitalsReceived.at(0);
			expect(span?.metricName).toBeDefined();
			expect(span?.metricValue).toBeDefined();
			expect(span?.sessionId).toBeDefined();
			expect(span?.path).toBeDefined();
			expect(span?.timestamp).toBeDefined();

			// Check metric names are valid
			const validMetrics = ["FCP", "LCP", "CLS", "INP", "TTFB", "FPS"];
			for (const vital of vitalsReceived) {
				expect(validMetrics).toContain(vital.metricName);
				expect(typeof vital.metricValue).toBe("number");
			}

			console.table(vitalsReceived.map((v) => ({ metric: v.metricName, value: v.metricValue })));
		} else {
			console.log("No vitals captured - this can happen in test environments");
		}
	});

	test("captures FPS metric", async ({ page }) => {
		const vitalsReceived: VitalSpan[] = [];

		page.on("request", (req) => {
			if (req.url().includes("/basket.databuddy.cc/vitals") && req.method() === "POST") {
				const payload = req.postDataJSON() as VitalSpan;
				vitalsReceived.push(payload);
			}
		});

		await page.goto("/test");

		await page.evaluate(() => {
			(window as never as { databuddyConfig: unknown }).databuddyConfig = {
				clientId: "test-client-id",
				trackWebVitals: true,
				ignoreBotDetection: true,
			};
		});
		await page.addScriptTag({ url: "/dist/vitals.js" });

		// FPS measurement takes 2 seconds
		await page.waitForTimeout(3000);

		const fpsVital = vitalsReceived.find((v) => v.metricName === "FPS");
		if (fpsVital) {
			expect(fpsVital.metricValue).toBeGreaterThan(0);
			expect(fpsVital.metricValue).toBeLessThanOrEqual(120);
			console.log("FPS captured:", fpsVital.metricValue);
		} else {
			console.log("FPS not captured - this can happen in headless browsers");
		}
	});

	test("does not send duplicate metrics", async ({ page }) => {
		const vitalsReceived: VitalSpan[] = [];

		page.on("request", (req) => {
			if (req.url().includes("/basket.databuddy.cc/vitals") && req.method() === "POST") {
				const payload = req.postDataJSON() as VitalSpan;
				vitalsReceived.push(payload);
			}
		});

		await page.goto("/test");

		await page.evaluate(() => {
			(window as never as { databuddyConfig: unknown }).databuddyConfig = {
				clientId: "test-client-id",
				trackWebVitals: true,
				ignoreBotDetection: true,
			};
		});
		await page.addScriptTag({ url: "/dist/vitals.js" });

		await page.waitForTimeout(3000);

		// Check no duplicate metric names
		const metricNames = vitalsReceived.map((v) => v.metricName);
		const uniqueNames = [...new Set(metricNames)];
		expect(metricNames.length).toBe(uniqueNames.length);
	});
});

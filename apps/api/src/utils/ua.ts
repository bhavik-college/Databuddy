import { UAParser } from "ua-parser-js";

export interface ParsedUserAgent {
	browser_name: string;
	browser_version: string;
	os_name: string;
	os_version: string;
	device_type: string;
	device_brand: string;
	device_model: string;
}

export function parseUserAgentDetails(userAgent: string): ParsedUserAgent {
	const parser = new UAParser(userAgent);
	const result = parser.getResult();

	return {
		browser_name: result.browser.name || "Unknown",
		browser_version: result.browser.version || "Unknown",
		os_name: result.os.name || "Unknown",
		os_version: result.os.version || "Unknown",
		device_type: result.device.type || "desktop", // Default to desktop if not detected
		device_brand: result.device.vendor || "Unknown",
		device_model: result.device.model || "Unknown",
	};
}

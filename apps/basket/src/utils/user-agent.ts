/**
 * User Agent Utilities
 *
 * Provides functions for user agent analysis including bot detection
 * and platform identification.
 */

import { UAParser } from "ua-parser-js";
import { bots } from "@databuddy/shared";

export interface UserAgentInfo {
	bot: {
		isBot: boolean;
		name?: string;
		type?: string;
		reason?: string;
		category?: string;
	};
	browser?: string;
	os?: string;
	device?: string;
}

/**
 * Parse user agent to extract useful information, with normalization and fallback logic
 */
export function parseUserAgent(userAgent: string): {
	browser: UAParser.IBrowser;
	os: UAParser.IOS;
	device: UAParser.IDevice;
} {
	if (!userAgent) {
		const parser = new UAParser();
		return {
			browser: parser.getBrowser(),
			os: parser.getOS(),
			device: parser.getDevice(),
		};
	}

	try {
		const parser = new UAParser(userAgent);
		const result = parser.getResult();

		return {
			browser: result.browser,
			os: result.os,
			device: result.device,
		};
	} catch (error) {
		const parser = new UAParser();
		return {
			browser: parser.getBrowser(),
			os: parser.getOS(),
			device: parser.getDevice(),
		};
	}
}

/**
 * Detect bots using known patterns, headless/automation, and suspicious headers
 */
export function detectBot(
	userAgent: string,
	request: Request,
): {
	isBot: boolean;
	reason?: string;
	category?: string;
	botName?: string;
} {
	const ua = userAgent || "";

	// 1. Known bots from list
	const detectedBot = bots.find((bot) => new RegExp(bot.regex, "i").test(ua));
	if (detectedBot) {
		return {
			isBot: true,
			reason: "known_bot_user_agent",
			category: "Known Bot",
			botName: detectedBot.name,
		};
	}

	// 2. Headless/automation detection
	const headlessPatterns = [
		/HeadlessChrome/i,
		/Puppeteer/i,
		/Playwright/i,
		/Selenium/i,
		/WebDriver/i,
		/PhantomJS/i,
		/NightmareJS/i,
		/Node\.js/i,
		/Go-http-client/i,
		/HttpClient/i,
		/curl\//i,
		/wget\//i,
		/python-requests/i,
		/Java\//i,
		/libwww-perl/i,
		/Apache-HttpClient/i,
		/okhttp/i,
		/axios/i,
		/CFNetwork/i,
		/Google-Structured-Data-Testing-Tool/i,
		/Slackbot-LinkExpanding/i,
		/Discordbot/i,
		/TelegramBot/i,
		/WhatsApp/i,
		/SkypeUriPreview/i,
		/bitlybot/i,
		/FacebookExternalHit/i,
		/Twitterbot/i,
		/Applebot/i,
		/BingPreview/i,
		/YandexBot/i,
		/Baiduspider/i,
		/Sogou/i,
		/Exabot/i,
		/facebot/i,
		/ia_archiver/i
	];
	if (headlessPatterns.some((re) => re.test(ua))) {
		return {
			isBot: true,
			reason: "headless_or_automation",
			category: "Automation/Headless",
		};
	}

	// 3. Suspicious headers
	if (!userAgent) {
		return {
			isBot: true,
			reason: "missing_user_agent",
			category: "Missing Headers",
		};
	}
	if (!request.headers.get("accept")) {
		return {
			isBot: true,
			reason: "missing_accept_header",
			category: "Missing Headers",
		};
	}
	if (ua.length < 10) {
		return {
			isBot: true,
			reason: "user_agent_too_short",
			category: "Suspicious Pattern",
		};
	}
	if (/[^\x20-\x7E]/.test(ua)) {
		return {
			isBot: true,
			reason: "non_ascii_characters",
			category: "Suspicious Pattern",
		};
	}
	if (/Mozilla\/5\.0 \(compatible;?\)/i.test(ua) && ua.length < 40) {
		return {
			isBot: true,
			reason: "generic_compatible_user_agent",
			category: "Suspicious Pattern",
		};
	}

	// 4. Heuristics: known bot substrings, very long/short UAs
	const botSubstrings = [
		"bot", "spider", "crawl", "checker", "fetch", "analyzer", "scrape", "monitor", "preview", "scan", "archiver"
	];
	if (botSubstrings.some((s) => ua.toLowerCase().includes(s))) {
		return {
			isBot: true,
			reason: "bot_substring_detected",
			category: "Heuristic",
		};
	}
	if (ua.length > 512) {
		return {
			isBot: true,
			reason: "user_agent_too_long",
			category: "Suspicious Pattern",
		};
	}

	return { isBot: false };
}

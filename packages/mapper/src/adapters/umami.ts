import crypto from 'node:crypto';
import type { AnalyticsEvent, AnalyticsEventAdapter } from '../types';

export interface UmamiCsvRow {
	website_id: string;
	session_id: string;
	visit_id: string;
	event_id: string;
	hostname: string;
	browser: string;
	os: string;
	device: string;
	screen: string;
	language: string;
	country: string;
	region: string;
	city: string;
	url_path: string;
	url_query: string;
	utm_source: string;
	utm_medium: string;
	utm_campaign: string;
	utm_content: string;
	utm_term: string;
	referrer_path: string;
	referrer_query: string;
	referrer_domain: string;
	page_title: string;
	gclid: string;
	fbclid: string;
	msclkid: string;
	ttclid: string;
	li_fat_id: string;
	twclid: string;
	event_type: string;
	event_name: string;
	tag: string;
	distinct_id: string;
	created_at: string;
	job_id: string;
}

const sessionIdMap = new Map<string, string>();
const anonIdMap = new Map<string, string>();

function getOrCreateSessionId(original: string): string {
	if (!original) {
		return '';
	}
	if (!sessionIdMap.has(original)) {
		sessionIdMap.set(original, `sess_${crypto.randomUUID()}`);
	}
	return sessionIdMap.get(original) || '';
}

function getOrCreateAnonId(original: string): string {
	if (!original || original.trim() === '') {
		return `anon_${crypto.randomUUID()}`;
	}
	if (!anonIdMap.has(original)) {
		anonIdMap.set(original, `anon_${crypto.randomUUID()}`);
	}
	return anonIdMap.get(original) || '';
}

export const umamiAdapter = (
	clientId: string
): AnalyticsEventAdapter<UmamiCsvRow> => ({
	mapRowToEvent(row: UmamiCsvRow): AnalyticsEvent {
		return {
			id: crypto.randomUUID(),
			client_id: clientId,
			event_name: 'screen_view',
			anonymous_id: getOrCreateAnonId(row.distinct_id),
			time: new Date(row.created_at).getTime(),
			session_id: getOrCreateSessionId(row.session_id),
			event_type: 'track',
			event_id: row.event_id,
			session_start_time: undefined,
			timestamp: undefined,
			referrer:
				row.referrer_domain && row.referrer_domain.trim() !== ''
					? row.referrer_domain
					: 'direct',
			url: row.url_path,
			path: row.url_path,
			title: row.page_title || '',
			ip: '',
			user_agent: '',
			browser_name: row.browser || '',
			browser_version: undefined,
			os_name: row.os || '',
			os_version: undefined,
			device_type: row.device || '',
			device_brand: undefined,
			device_model: undefined,
			country: row.country || '',
			region: row.region || '',
			city: row.city || '',
			screen_resolution: row.screen || '',
			viewport_size: undefined,
			language: row.language || '',
			timezone: undefined,
			connection_type: undefined,
			rtt: undefined,
			downlink: undefined,
			time_on_page: undefined,
			scroll_depth: undefined,
			interaction_count: undefined,
			exit_intent: 0,
			page_count: 1,
			is_bounce: 0,
			has_exit_intent: undefined,
			page_size: undefined,
			utm_source: row.utm_source || '',
			utm_medium: row.utm_medium || '',
			utm_campaign: row.utm_campaign || '',
			utm_term: row.utm_term || '',
			utm_content: row.utm_content || '',
			load_time: undefined,
			dom_ready_time: undefined,
			dom_interactive: undefined,
			ttfb: undefined,
			connection_time: undefined,
			request_time: undefined,
			render_time: undefined,
			redirect_time: undefined,
			domain_lookup_time: undefined,
			fcp: undefined,
			lcp: undefined,
			cls: undefined,
			fid: undefined,
			inp: undefined,
			href: undefined,
			text: undefined,
			value: undefined,
			error_message: undefined,
			error_filename: undefined,
			error_lineno: undefined,
			error_colno: undefined,
			error_stack: undefined,
			error_type: undefined,
			properties: '',
			created_at: new Date(row.created_at).getTime(),
		};
	},
});

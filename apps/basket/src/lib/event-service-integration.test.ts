import { beforeEach, describe, expect, it, mock } from 'bun:test';
import { randomUUID } from 'node:crypto';
import type { AnalyticsEvent, CustomEvent, ErrorEvent, WebVitalsEvent, CustomOutgoingLink } from '@databuddy/db';

// Mock producer functions
const mockSendEvent = mock(() => Promise.resolve());
const mockSendEventBatch = mock(() => Promise.resolve());

// Mock other dependencies
const mockCheckDuplicate = mock(() => Promise.resolve(false));
const mockGetGeo = mock(() => Promise.resolve({
	anonymizedIP: '192.168.1.0',
	country: 'US',
	region: 'CA',
	city: 'San Francisco',
}));
const mockParseUserAgent = mock(() => ({
	browserName: 'Chrome',
	browserVersion: '120.0',
	osName: 'Windows',
	osVersion: '10',
	deviceType: 'desktop',
	deviceBrand: '',
	deviceModel: '',
}));

// Mock modules
mock.module('./producer', () => ({
	sendEvent: mockSendEvent,
	sendEventBatch: mockSendEventBatch,
	sendEventSync: mock(() => Promise.resolve()),
	disconnectProducer: mock(() => Promise.resolve()),
}));

mock.module('./security', () => ({
	checkDuplicate: mockCheckDuplicate,
}));

mock.module('../utils/ip-geo', () => ({
	getGeo: mockGetGeo,
}));

mock.module('../utils/user-agent', () => ({
	parseUserAgent: mockParseUserAgent,
}));

mock.module('../utils/validation', () => ({
	sanitizeString: (val: string) => val,
	VALIDATION_LIMITS: {
		SHORT_STRING_MAX_LENGTH: 255,
		STRING_MAX_LENGTH: 2000,
		TEXT_MAX_LENGTH: 5000,
		PATH_MAX_LENGTH: 2000,
	},
	validatePerformanceMetric: (val: number) => val,
	validateSessionId: (val: string) => val,
}));

// Import event service functions
const {
	insertError,
	insertWebVitals,
	insertCustomEvent,
	insertOutgoingLink,
	insertTrackEvent,
	insertTrackEventsBatch,
	insertErrorsBatch,
	insertWebVitalsBatch,
	insertCustomEventsBatch,
	insertOutgoingLinksBatch,
} = await import('./event-service');

describe('Event Service Integration with Kafka Fallback', () => {
	const clientId = 'test-client-id';
	const userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36';
	const ip = '192.168.1.100';

	beforeEach(() => {
		mockSendEvent.mockClear();
		mockSendEventBatch.mockClear();
		mockCheckDuplicate.mockClear();
		mockGetGeo.mockClear();
		mockParseUserAgent.mockClear();
		
		// Reset default mock behaviors
		mockCheckDuplicate.mockImplementation(() => Promise.resolve(false));
	});

	describe('insertError', () => {
		it('should process and send error events without throwing', async () => {
			const errorData = {
				payload: {
					eventId: randomUUID(),
					anonymousId: 'anon-1',
					sessionId: 'session-1',
					timestamp: Date.now(),
					path: '/test-page',
					message: 'Test error message',
					filename: 'test.js',
					lineno: 42,
					colno: 10,
					stack: 'Error: Test error\n    at test.js:42:10',
					errorType: 'TypeError',
				},
			};

			await expect(
				insertError(errorData, clientId, userAgent, ip)
			).resolves.not.toThrow();

			expect(mockSendEvent).toHaveBeenCalledWith(
				'analytics-errors',
				expect.objectContaining({
					client_id: clientId,
					message: 'Test error message',
					error_type: 'TypeError',
				})
			);
		});

		it('should skip duplicate error events', async () => {
			const eventId = randomUUID();
			mockCheckDuplicate.mockImplementationOnce(() => Promise.resolve(true));

			const errorData = {
				payload: {
					eventId,
					anonymousId: 'anon-1',
					sessionId: 'session-1',
					timestamp: Date.now(),
					path: '/test-page',
					message: 'Test error',
				},
			};

			await insertError(errorData, clientId, userAgent, ip);

			expect(mockSendEvent).not.toHaveBeenCalled();
		});

		it('should not throw when producer fails', async () => {
			mockSendEvent.mockImplementationOnce(() => {
				throw new Error('Producer failed');
			});

			const errorData = {
				payload: {
					eventId: randomUUID(),
					anonymousId: 'anon-1',
					sessionId: 'session-1',
					timestamp: Date.now(),
					path: '/test-page',
					message: 'Test error',
				},
			};

			await expect(
				insertError(errorData, clientId, userAgent, ip)
			).resolves.not.toThrow();
		});
	});

	describe('insertWebVitals', () => {
		it('should process and send web vitals events without throwing', async () => {
			const vitalsData = {
				payload: {
					eventId: randomUUID(),
					anonymousId: 'anon-1',
					sessionId: 'session-1',
					timestamp: Date.now(),
					path: '/test-page',
					fcp: 1200,
					lcp: 2500,
					cls: 0.1,
					fid: 100,
					inp: 150,
				},
			};

			await expect(
				insertWebVitals(vitalsData, clientId, userAgent, ip)
			).resolves.not.toThrow();

			expect(mockSendEvent).toHaveBeenCalledWith(
				'analytics-web-vitals',
				expect.objectContaining({
					client_id: clientId,
					fcp: 1200,
					lcp: 2500,
					cls: 0.1,
				})
			);
		});

		it('should not throw when producer fails', async () => {
			mockSendEvent.mockImplementationOnce(() => {
				throw new Error('Producer failed');
			});

			const vitalsData = {
				payload: {
					eventId: randomUUID(),
					anonymousId: 'anon-1',
					sessionId: 'session-1',
					timestamp: Date.now(),
					path: '/test-page',
					fcp: 1200,
				},
			};

			await expect(
				insertWebVitals(vitalsData, clientId, userAgent, ip)
			).resolves.not.toThrow();
		});
	});

	describe('insertCustomEvent', () => {
		it('should process and send custom events without throwing', async () => {
			const customData = {
				eventId: randomUUID(),
				name: 'button_click',
				anonymousId: 'anon-1',
				sessionId: 'session-1',
				timestamp: Date.now(),
				properties: {
					button_id: 'signup-btn',
					page: '/home',
				},
			};

			await expect(
				insertCustomEvent(customData, clientId, userAgent, ip)
			).resolves.not.toThrow();

			expect(mockSendEvent).toHaveBeenCalledWith(
				'analytics-custom-events',
				expect.objectContaining({
					client_id: clientId,
					event_name: 'button_click',
					properties: expect.any(String),
				})
			);
		});

		it('should not throw when producer fails', async () => {
			mockSendEvent.mockImplementationOnce(() => {
				throw new Error('Producer failed');
			});

			const customData = {
				eventId: randomUUID(),
				name: 'test_event',
				anonymousId: 'anon-1',
				sessionId: 'session-1',
				timestamp: Date.now(),
			};

			await expect(
				insertCustomEvent(customData, clientId, userAgent, ip)
			).resolves.not.toThrow();
		});
	});

	describe('insertOutgoingLink', () => {
		it('should process and send outgoing link events without throwing', async () => {
			const linkData = {
				eventId: randomUUID(),
				anonymousId: 'anon-1',
				sessionId: 'session-1',
				timestamp: Date.now(),
				href: 'https://external-site.com',
				text: 'External Link',
				properties: {
					section: 'footer',
				},
			};

			await expect(
				insertOutgoingLink(linkData, clientId, userAgent, ip)
			).resolves.not.toThrow();

			expect(mockSendEvent).toHaveBeenCalledWith(
				'analytics-outgoing-links',
				expect.objectContaining({
					client_id: clientId,
					href: 'https://external-site.com',
					text: 'External Link',
				})
			);
		});

		it('should not throw when producer fails', async () => {
			mockSendEvent.mockImplementationOnce(() => {
				throw new Error('Producer failed');
			});

			const linkData = {
				eventId: randomUUID(),
				anonymousId: 'anon-1',
				sessionId: 'session-1',
				timestamp: Date.now(),
				href: 'https://example.com',
				text: 'Link',
			};

			await expect(
				insertOutgoingLink(linkData, clientId, userAgent, ip)
			).resolves.not.toThrow();
		});
	});

	describe('insertTrackEvent', () => {
		it('should process and send track events without throwing', async () => {
			const trackData = {
				eventId: randomUUID(),
				name: 'page_view',
				anonymousId: 'anon-1',
				sessionId: 'session-1',
				sessionStartTime: Date.now() - 10000,
				timestamp: Date.now(),
				referrer: 'https://google.com',
				path: '/products',
				title: 'Products Page',
				screen_resolution: '1920x1080',
				viewport_size: '1920x969',
				language: 'en-US',
				timezone: 'America/New_York',
				connection_type: '4g',
				rtt: 50,
				downlink: 10,
				time_on_page: 5000,
				scroll_depth: 75,
				interaction_count: 5,
				page_count: 1,
				utm_source: 'google',
				utm_medium: 'cpc',
				utm_campaign: 'summer_sale',
				load_time: 1500,
				dom_ready_time: 1200,
				ttfb: 300,
			};

			await expect(
				insertTrackEvent(trackData, clientId, userAgent, ip)
			).resolves.not.toThrow();

			expect(mockSendEvent).toHaveBeenCalledWith(
				'analytics-events',
				expect.objectContaining({
					client_id: clientId,
					event_name: 'page_view',
					event_type: 'track',
					utm_source: 'google',
					utm_campaign: 'summer_sale',
				})
			);
		});

		it('should not throw when producer fails', async () => {
			mockSendEvent.mockImplementationOnce(() => {
				throw new Error('Producer failed');
			});

			const trackData = {
				eventId: randomUUID(),
				name: 'page_view',
				anonymousId: 'anon-1',
				sessionId: 'session-1',
				timestamp: Date.now(),
				path: '/home',
			};

			await expect(
				insertTrackEvent(trackData, clientId, userAgent, ip)
			).resolves.not.toThrow();
		});
	});

	describe('Batch Operations', () => {
		it('should handle track events batch without throwing', async () => {
			const events: AnalyticsEvent[] = Array.from({ length: 5 }, () => ({
				id: randomUUID(),
				client_id: clientId,
				event_name: 'page_view',
				anonymous_id: 'anon-batch',
				time: Date.now(),
				session_id: 'session-batch',
				event_type: 'track' as const,
				event_id: randomUUID(),
				session_start_time: Date.now(),
				timestamp: Date.now(),
				referrer: '',
				url: '/test',
				path: '/test',
				title: 'Test',
				ip: '192.168.1.0',
				user_agent: '',
				browser_name: '',
				browser_version: '',
				os_name: '',
				os_version: '',
				device_type: '',
				device_brand: '',
				device_model: '',
				country: '',
				region: '',
				city: '',
				screen_resolution: '',
				viewport_size: '',
				language: '',
				timezone: null,
				connection_type: '',
				rtt: 0,
				downlink: null,
				time_on_page: null,
				scroll_depth: null,
				interaction_count: null,
				page_count: 1,
				utm_source: null,
				utm_medium: null,
				utm_campaign: null,
				utm_term: null,
				utm_content: null,
				load_time: null,
				dom_ready_time: null,
				dom_interactive: null,
				ttfb: null,
				connection_time: null,
				request_time: null,
				render_time: null,
				redirect_time: null,
				domain_lookup_time: null,
				properties: '{}',
				created_at: Date.now(),
			}));

			await expect(
				insertTrackEventsBatch(events)
			).resolves.not.toThrow();

			expect(mockSendEventBatch).toHaveBeenCalledWith(
				'analytics-events',
				events
			);
		});

		it('should handle errors batch without throwing', async () => {
			const events: ErrorEvent[] = Array.from({ length: 3 }, () => ({
				id: randomUUID(),
				client_id: clientId,
				event_id: randomUUID(),
				anonymous_id: 'anon-batch',
				session_id: 'session-batch',
				timestamp: Date.now(),
				path: '/test',
				message: 'Test error',
				filename: null,
				lineno: null,
				colno: null,
				stack: null,
				error_type: null,
				ip: null,
				user_agent: null,
				browser_name: null,
				browser_version: null,
				os_name: null,
				os_version: null,
				device_type: null,
				country: null,
				region: null,
				created_at: Date.now(),
			}));

			await expect(
				insertErrorsBatch(events)
			).resolves.not.toThrow();

			expect(mockSendEventBatch).toHaveBeenCalledWith(
				'analytics-errors',
				events
			);
		});

		it('should handle web vitals batch without throwing', async () => {
			const events: WebVitalsEvent[] = Array.from({ length: 3 }, () => ({
				id: randomUUID(),
				client_id: clientId,
				event_id: randomUUID(),
				anonymous_id: 'anon-batch',
				session_id: 'session-batch',
				timestamp: Date.now(),
				path: '/test',
				fcp: null,
				lcp: null,
				cls: null,
				fid: null,
				inp: null,
				ip: null,
				user_agent: null,
				browser_name: null,
				browser_version: null,
				os_name: null,
				os_version: null,
				device_type: null,
				country: null,
				region: null,
				created_at: Date.now(),
			}));

			await expect(
				insertWebVitalsBatch(events)
			).resolves.not.toThrow();

			expect(mockSendEventBatch).toHaveBeenCalledWith(
				'analytics-web-vitals',
				events
			);
		});

		it('should handle custom events batch without throwing', async () => {
			const events: CustomEvent[] = Array.from({ length: 3 }, () => ({
				id: randomUUID(),
				client_id: clientId,
				event_name: 'test_event',
				anonymous_id: 'anon-batch',
				session_id: 'session-batch',
				properties: '{}',
				timestamp: Date.now(),
			}));

			await expect(
				insertCustomEventsBatch(events)
			).resolves.not.toThrow();

			expect(mockSendEventBatch).toHaveBeenCalledWith(
				'analytics-custom-events',
				events
			);
		});

		it('should handle outgoing links batch without throwing', async () => {
			const events: CustomOutgoingLink[] = Array.from({ length: 3 }, () => ({
				id: randomUUID(),
				client_id: clientId,
				anonymous_id: 'anon-batch',
				session_id: 'session-batch',
				href: 'https://example.com',
				text: null,
				properties: '{}',
				timestamp: Date.now(),
			}));

			await expect(
				insertOutgoingLinksBatch(events)
			).resolves.not.toThrow();

			expect(mockSendEventBatch).toHaveBeenCalledWith(
				'analytics-outgoing-links',
				events
			);
		});

		it('should not throw when batch producer fails', async () => {
			mockSendEventBatch.mockImplementationOnce(() => {
				throw new Error('Batch producer failed');
			});

			const events: CustomEvent[] = Array.from({ length: 2 }, () => ({
				id: randomUUID(),
				client_id: clientId,
				event_name: 'test_event',
				anonymous_id: 'anon-batch',
				session_id: 'session-batch',
				properties: '{}',
				timestamp: Date.now(),
			}));

			await expect(
				insertCustomEventsBatch(events)
			).resolves.not.toThrow();
		});

		it('should handle empty batches gracefully', async () => {
			await expect(insertTrackEventsBatch([])).resolves.not.toThrow();
			await expect(insertErrorsBatch([])).resolves.not.toThrow();
			await expect(insertWebVitalsBatch([])).resolves.not.toThrow();
			await expect(insertCustomEventsBatch([])).resolves.not.toThrow();
			await expect(insertOutgoingLinksBatch([])).resolves.not.toThrow();

			expect(mockSendEventBatch).not.toHaveBeenCalled();
		});
	});

	describe('Data Enrichment', () => {
		it('should enrich events with geo data', async () => {
			const trackData = {
				eventId: randomUUID(),
				name: 'page_view',
				anonymousId: 'anon-1',
				sessionId: 'session-1',
				timestamp: Date.now(),
				path: '/test',
			};

			await insertTrackEvent(trackData, clientId, userAgent, ip);

			expect(mockGetGeo).toHaveBeenCalledWith(ip);
			expect(mockSendEvent).toHaveBeenCalledWith(
				'analytics-events',
				expect.objectContaining({
					country: 'US',
					region: 'CA',
					city: 'San Francisco',
				})
			);
		});

		it('should enrich events with user agent data', async () => {
			const trackData = {
				eventId: randomUUID(),
				name: 'page_view',
				anonymousId: 'anon-1',
				sessionId: 'session-1',
				timestamp: Date.now(),
				path: '/test',
			};

			await insertTrackEvent(trackData, clientId, userAgent, ip);

			expect(mockParseUserAgent).toHaveBeenCalledWith(userAgent);
			expect(mockSendEvent).toHaveBeenCalledWith(
				'analytics-events',
				expect.objectContaining({
					browser_name: 'Chrome',
					browser_version: '120.0',
					os_name: 'Windows',
					os_version: '10',
					device_type: 'desktop',
				})
			);
		});
	});
});


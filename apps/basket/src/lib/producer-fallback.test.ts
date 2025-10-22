import { afterAll, beforeAll, beforeEach, describe, expect, it, mock } from 'bun:test';
import { randomUUID } from 'node:crypto';

// Mock ClickHouse client
const mockClickHouseInsert = mock(() => Promise.resolve());
const mockClickHouse = {
	insert: mockClickHouseInsert,
	query: mock(() => Promise.resolve({ json: async () => ({ data: [] }) })),
	command: mock(() => Promise.resolve()),
};

// Mock TABLE_NAMES
const mockTableNames = {
	events: 'analytics.events',
	errors: 'analytics.errors',
	web_vitals: 'analytics.web_vitals',
	custom_events: 'analytics.custom_events',
	outgoing_links: 'analytics.outgoing_links',
};

// Mock Kafka - we'll control whether it fails or succeeds
let kafkaConnectShouldFail = false;
let kafkaSendShouldFail = false;

const mockKafkaProducer = {
	connect: mock(async () => {
		if (kafkaConnectShouldFail) {
			throw new Error('Kafka connection failed');
		}
	}),
	send: mock(async () => {
		if (kafkaSendShouldFail) {
			throw new Error('Kafka send failed');
		}
	}),
	disconnect: mock(async () => {}),
};

const mockKafka = mock(() => ({
	producer: mock(() => mockKafkaProducer),
}));

// Mock the modules before importing
mock.module('@databuddy/db', () => ({
	clickHouse: mockClickHouse,
	TABLE_NAMES: mockTableNames,
}));

mock.module('kafkajs', () => ({
	Kafka: mockKafka,
	CompressionTypes: {
		GZIP: 1,
	},
}));

// Now import the modules that depend on mocks
const { sendEvent, sendEventSync, sendEventBatch, disconnectProducer } = await import('./producer');

describe('Producer Kafka Fallback to ClickHouse', () => {
	beforeEach(() => {
		// Reset all mocks
		mockClickHouseInsert.mockClear();
		mockKafkaProducer.connect.mockClear();
		mockKafkaProducer.send.mockClear();
		mockKafkaProducer.disconnect.mockClear();
		
		// Reset failure flags
		kafkaConnectShouldFail = false;
		kafkaSendShouldFail = false;
	});

	afterAll(async () => {
		await disconnectProducer();
	});

	describe('Kafka Unavailable (No BROKER env)', () => {
		it('should buffer events to ClickHouse when KAFKA_BROKERS is not set', async () => {
			const event = {
				id: randomUUID(),
				client_id: 'test-client-1',
				event_name: 'page_view',
				anonymous_id: 'anon-1',
				time: Date.now(),
			};

		await sendEventSync('analytics-events', event);

		// Wait for buffer flush
		await new Promise(resolve => setTimeout(resolve, 6000));

		expect(mockClickHouseInsert).toHaveBeenCalled();
		const insertCall = mockClickHouseInsert.mock.calls[0] as any[];
		expect(insertCall?.[0]).toMatchObject({
			table: 'analytics.events',
		});
		});

		it('should buffer multiple event types correctly', async () => {
			const events = [
				{ topic: 'analytics-events', data: { id: randomUUID(), client_id: 'c1' } },
				{ topic: 'analytics-errors', data: { id: randomUUID(), client_id: 'c2' } },
				{ topic: 'analytics-web-vitals', data: { id: randomUUID(), client_id: 'c3' } },
				{ topic: 'analytics-custom-events', data: { id: randomUUID(), client_id: 'c4' } },
				{ topic: 'analytics-outgoing-links', data: { id: randomUUID(), client_id: 'c5' } },
			];

			for (const { topic, data } of events) {
				await sendEvent(topic, data);
			}

			// Wait for buffer flush
			await new Promise(resolve => setTimeout(resolve, 6000));

		expect(mockClickHouseInsert).toHaveBeenCalled();
		
		// Check that all event types were flushed
		const tables = mockClickHouseInsert.mock.calls.map((call: any[]) => call?.[0]?.table);
		expect(tables).toContain('analytics.events');
		expect(tables).toContain('analytics.errors');
		expect(tables).toContain('analytics.web_vitals');
		expect(tables).toContain('analytics.custom_events');
		expect(tables).toContain('analytics.outgoing_links');
		});

		it('should handle batch operations with ClickHouse fallback', async () => {
			const events = Array.from({ length: 5 }, () => ({
				id: randomUUID(),
				client_id: 'batch-client',
				event_name: 'test_event',
				anonymous_id: 'anon-batch',
				time: Date.now(),
			}));

			await sendEventBatch('analytics-events', events);

		// Wait for buffer flush
		await new Promise(resolve => setTimeout(resolve, 6000));

		expect(mockClickHouseInsert).toHaveBeenCalled();
		const insertCall = mockClickHouseInsert.mock.calls[0] as any[];
		expect(insertCall?.[0]?.table).toBe('analytics.events');
		expect(insertCall?.[0]?.values.length).toBeGreaterThanOrEqual(5);
		});

		it('should force flush when buffer exceeds max size', async () => {
			mockClickHouseInsert.mockClear();

			// Send more than BUFFER_MAX_SIZE (1000) events
			const events = Array.from({ length: 1001 }, () => ({
				id: randomUUID(),
				client_id: 'force-flush-client',
				event_name: 'test_event',
				anonymous_id: 'anon-force',
				time: Date.now(),
			}));

			for (const event of events) {
				await sendEvent('analytics-events', event);
			}

			// Should force flush immediately
			await new Promise(resolve => setTimeout(resolve, 1000));

			expect(mockClickHouseInsert).toHaveBeenCalled();
		});
	});

	describe('Kafka Connection Failure', () => {
		it('should fallback to ClickHouse when Kafka connection fails', async () => {
			kafkaConnectShouldFail = true;

			const event = {
				id: randomUUID(),
				client_id: 'connect-fail-client',
				event_name: 'page_view',
				anonymous_id: 'anon-connect-fail',
				time: Date.now(),
			};

			await sendEventSync('analytics-events', event);

			// Wait for buffer flush
			await new Promise(resolve => setTimeout(resolve, 6000));

			expect(mockKafkaProducer.connect).toHaveBeenCalled();
			expect(mockClickHouseInsert).toHaveBeenCalled();
		});
	});

	describe('Kafka Send Failure', () => {
		it('should fallback to ClickHouse when Kafka send fails', async () => {
			kafkaSendShouldFail = true;

			const event = {
				id: randomUUID(),
				client_id: 'send-fail-client',
				event_name: 'page_view',
				anonymous_id: 'anon-send-fail',
				time: Date.now(),
			};

			await sendEventSync('analytics-events', event);

			// Wait for buffer flush
			await new Promise(resolve => setTimeout(resolve, 6000));

			expect(mockClickHouseInsert).toHaveBeenCalled();
		});

		it('should handle batch send failures gracefully', async () => {
			kafkaSendShouldFail = true;

			const events = Array.from({ length: 3 }, () => ({
				id: randomUUID(),
				client_id: 'batch-fail-client',
				event_name: 'test_event',
				anonymous_id: 'anon-batch-fail',
				time: Date.now(),
			}));

			await sendEventBatch('analytics-events', events);

		// Wait for buffer flush
		await new Promise(resolve => setTimeout(resolve, 6000));

		expect(mockClickHouseInsert).toHaveBeenCalled();
		const insertCall = mockClickHouseInsert.mock.calls[0] as any[];
		expect(insertCall?.[0]?.values.length).toBeGreaterThanOrEqual(3);
		});
	});

	describe('Buffer Flush', () => {
		it('should automatically flush buffer every 5 seconds', async () => {
			mockClickHouseInsert.mockClear();

			const event = {
				id: randomUUID(),
				client_id: 'auto-flush-client',
				event_name: 'page_view',
				anonymous_id: 'anon-auto',
				time: Date.now(),
			};

			await sendEvent('analytics-events', event);

			// Before 5 seconds - should not be flushed yet
			await new Promise(resolve => setTimeout(resolve, 2000));
			expect(mockClickHouseInsert).not.toHaveBeenCalled();

			// After 5 seconds - should be flushed
			await new Promise(resolve => setTimeout(resolve, 4000));
			expect(mockClickHouseInsert).toHaveBeenCalled();
		});

		it('should group events by table when flushing', async () => {
			mockClickHouseInsert.mockClear();

			const events = [
				{ topic: 'analytics-events', data: { id: randomUUID(), client_id: 'g1' } },
				{ topic: 'analytics-events', data: { id: randomUUID(), client_id: 'g2' } },
				{ topic: 'analytics-errors', data: { id: randomUUID(), client_id: 'g3' } },
				{ topic: 'analytics-errors', data: { id: randomUUID(), client_id: 'g4' } },
			];

			for (const { topic, data } of events) {
				await sendEvent(topic, data);
			}

			// Wait for buffer flush
			await new Promise(resolve => setTimeout(resolve, 6000));

		// Should have 2 insert calls (one for events, one for errors)
		expect(mockClickHouseInsert).toHaveBeenCalled();
		const tables = mockClickHouseInsert.mock.calls.map((call: any[]) => call?.[0]?.table);
		expect(tables).toContain('analytics.events');
		expect(tables).toContain('analytics.errors');

		// Find the events insert
		const eventsInsert = mockClickHouseInsert.mock.calls.find(
			(call: any[]) => call?.[0]?.table === 'analytics.events'
		) as any[];
		expect(eventsInsert?.[0]?.values.length).toBe(2);

		// Find the errors insert
		const errorsInsert = mockClickHouseInsert.mock.calls.find(
			(call: any[]) => call?.[0]?.table === 'analytics.errors'
		) as any[];
		expect(errorsInsert?.[0]?.values.length).toBe(2);
		});
	});

	describe('ClickHouse Insert Format', () => {
		it('should use JSONEachRow format when inserting', async () => {
			const event = {
				id: randomUUID(),
				client_id: 'format-test-client',
				event_name: 'page_view',
				anonymous_id: 'anon-format',
				time: Date.now(),
			};

			await sendEvent('analytics-events', event);

		// Wait for buffer flush
		await new Promise(resolve => setTimeout(resolve, 6000));

		expect(mockClickHouseInsert).toHaveBeenCalled();
		const insertCall = mockClickHouseInsert.mock.calls[0] as any[];
		expect(insertCall?.[0]?.format).toBe('JSONEachRow');
		});
	});

	describe('Disconnect and Cleanup', () => {
		it('should flush buffer before disconnecting', async () => {
			mockClickHouseInsert.mockClear();

			const event = {
				id: randomUUID(),
				client_id: 'disconnect-client',
				event_name: 'page_view',
				anonymous_id: 'anon-disconnect',
				time: Date.now(),
			};

			await sendEvent('analytics-events', event);

			// Disconnect immediately (before auto-flush)
			await disconnectProducer();

			expect(mockClickHouseInsert).toHaveBeenCalled();
		});

		it('should stop auto-flush interval when disconnecting', async () => {
			mockClickHouseInsert.mockClear();

			const event = {
				id: randomUUID(),
				client_id: 'interval-stop-client',
				event_name: 'page_view',
				anonymous_id: 'anon-interval',
				time: Date.now(),
			};

			await sendEvent('analytics-events', event);
			await disconnectProducer();

			const initialCallCount = mockClickHouseInsert.mock.calls.length;

			// Wait longer than flush interval
			await new Promise(resolve => setTimeout(resolve, 7000));

			// Should not have any new calls after disconnect
			expect(mockClickHouseInsert.mock.calls.length).toBe(initialCallCount);
		});
	});

	describe('Error Handling', () => {
		it('should retry buffering events if ClickHouse insert fails', async () => {
			// Make first insert fail, second succeed
			let insertAttempts = 0;
			mockClickHouseInsert.mockImplementation(() => {
				insertAttempts++;
				if (insertAttempts === 1) {
					return Promise.reject(new Error('ClickHouse insert failed'));
				}
				return Promise.resolve();
			});

			const event = {
				id: randomUUID(),
				client_id: 'retry-client',
				event_name: 'page_view',
				anonymous_id: 'anon-retry',
				time: Date.now(),
			};

			await sendEvent('analytics-events', event);

			// Wait for first flush attempt
			await new Promise(resolve => setTimeout(resolve, 6000));

			// Wait for retry flush
			await new Promise(resolve => setTimeout(resolve, 6000));

			expect(mockClickHouseInsert).toHaveBeenCalledTimes(2);
		});

		it('should handle unknown topics gracefully', async () => {
			const event = {
				id: randomUUID(),
				client_id: 'unknown-client',
			};

			// Should not throw
			await expect(sendEvent('unknown-topic', event)).resolves.not.toThrow();

			// Wait for potential flush
			await new Promise(resolve => setTimeout(resolve, 6000));

			// Should not have inserted anything for unknown topic
			const unknownInserts = mockClickHouseInsert.mock.calls.filter(
				(call: any) => !Object.values(mockTableNames).includes(call[0].table)
			);
			expect(unknownInserts.length).toBe(0);
		});
	});

	describe('Async vs Sync Behavior', () => {
		it('should handle sendEvent (async) without blocking', async () => {
			const start = Date.now();
			
			await sendEvent('analytics-events', {
				id: randomUUID(),
				client_id: 'async-client',
			});

			const duration = Date.now() - start;
			expect(duration).toBeLessThan(100); // Should return quickly
		});

		it('should handle sendEventSync (sync) properly', async () => {
			const event = {
				id: randomUUID(),
				client_id: 'sync-client',
				event_name: 'test',
			};

			await expect(
				sendEventSync('analytics-events', event)
			).resolves.not.toThrow();
		});
	});
});


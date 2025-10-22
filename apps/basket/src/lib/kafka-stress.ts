import { CompressionTypes, Kafka } from 'kafkajs';
import { randomUUID } from 'node:crypto';

const BROKER = process.env.KAFKA_BROKERS || 'localhost:9092';
const TEST_TOPIC = 'stress-test-events';

type StressTestResult = {
	totalMessages: number;
	duration: number;
	throughput: number;
	success: boolean;
};

class KafkaStressTest {
	private kafka: Kafka;
	private producer: any;
	private connected = false;

	constructor() {
		this.kafka = new Kafka({
			clientId: 'basket-stress-test',
			brokers: [BROKER],
		});

		this.producer = this.kafka.producer({
			allowAutoTopicCreation: true,
			maxInFlightRequests: 10,
			idempotent: true,
			transactionTimeout: 60000,
		});
	}

	async connect() {
		await this.producer.connect();
		this.connected = true;
		console.log('✅ Kafka producer connected for stress testing');
	}

	async disconnect() {
		if (this.connected && this.producer) {
			await this.producer.disconnect();
			this.connected = false;
			console.log('✅ Kafka producer disconnected');
		}
	}

	generateEvent(index: number) {
		const eventId = randomUUID();
		const sessionId = randomUUID();
		const anonymousId = randomUUID();
		const clientId = `client-${Math.floor(Math.random() * 100)}`;

		return {
			id: randomUUID(),
			client_id: clientId,
			event_name: 'pageview',
			anonymous_id: anonymousId,
			time: Date.now(),
			session_id: sessionId,
			event_type: 'track',
			event_id: eventId,
			session_start_time: Date.now() - Math.random() * 300000,
			timestamp: Date.now(),
			referrer: 'https://google.com',
			url: `https://example.com/page-${index % 100}`,
			path: `/page-${index % 100}`,
			title: `Page ${index % 100}`,
			ip: `192.168.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`,
			user_agent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
			browser_name: 'Chrome',
			browser_version: '120.0.0',
			os_name: 'Windows',
			os_version: '10',
			device_type: 'desktop',
			device_brand: '',
			device_model: '',
			country: 'US',
			region: 'CA',
			city: 'San Francisco',
			screen_resolution: '1920x1080',
			viewport_size: '1920x1080',
			language: 'en-US',
			timezone: 'America/Los_Angeles',
			connection_type: '4g',
			rtt: 50,
			downlink: 10,
			time_on_page: Math.floor(Math.random() * 60000),
			scroll_depth: Math.floor(Math.random() * 100),
			interaction_count: Math.floor(Math.random() * 50),
			page_count: 1,
			utm_source: '',
			utm_medium: '',
			utm_campaign: '',
			utm_term: '',
			utm_content: '',
			load_time: Math.floor(Math.random() * 3000),
			dom_ready_time: Math.floor(Math.random() * 2000),
			dom_interactive: Math.floor(Math.random() * 1500),
			ttfb: Math.floor(Math.random() * 500),
			connection_time: Math.floor(Math.random() * 100),
			render_time: Math.floor(Math.random() * 1000),
			redirect_time: 0,
			domain_lookup_time: Math.floor(Math.random() * 50),
			properties: '{}',
			created_at: Date.now(),
		};
	}

	sendBatch(batchSize: number, startIndex: number) {
		const messages = [];
		for (let i = 0; i < batchSize; i++) {
			const event = this.generateEvent(startIndex + i);
			messages.push({
				key: event.client_id,
				value: JSON.stringify(event),
			});
		}

		return this.producer.send({
			topic: TEST_TOPIC,
			messages,
			compression: CompressionTypes.GZIP,
		});
	}

	async runSimpleStressTest(totalMessages: number, batchSize: number): Promise<StressTestResult> {
		console.log(`🚀 Starting stress test: ${totalMessages.toLocaleString()} messages`);
		console.log(`📦 Batch size: ${batchSize}`);

		const startTime = Date.now();
		const promises = [];

		for (let i = 0; i < totalMessages; i += batchSize) {
			const batchPromise = this.sendBatch(batchSize, i);
			promises.push(batchPromise);
		}

		await Promise.all(promises);

		const endTime = Date.now();
		const duration = (endTime - startTime) / 1000;
		const throughput = Math.floor(totalMessages / duration);

		console.log(`✅ Sent ${totalMessages.toLocaleString()} messages in ${duration.toFixed(2)}s`);
		console.log(`📈 Throughput: ${throughput.toLocaleString()} msg/sec`);

		return {
			totalMessages,
			duration,
			throughput,
			success: true,
		};
	}

	async runBurstTest(totalMessages: number, batchSize: number): Promise<StressTestResult> {
		console.log(`💥 Starting burst load test: ${totalMessages.toLocaleString()} messages ASAP`);
		console.log(`📦 Batch size: ${batchSize}`);

		const startTime = Date.now();
		const promises = [];

		for (let i = 0; i < totalMessages; i += batchSize) {
			const batchPromise = this.sendBatch(batchSize, i);
			promises.push(batchPromise);
		}

		await Promise.all(promises);

		const endTime = Date.now();
		const duration = (endTime - startTime) / 1000;
		const throughput = Math.floor(totalMessages / duration);

		console.log(`✅ Sent ${totalMessages.toLocaleString()} messages in ${duration.toFixed(2)}s`);
		console.log(`🔥 Peak throughput: ${throughput.toLocaleString()} msg/sec`);

		return {
			totalMessages,
			duration,
			throughput,
			success: true,
		};
	}

	async runSustainedTest(
		messagesPerSecond: number,
		durationSeconds: number
	): Promise<StressTestResult> {
		const totalMessages = messagesPerSecond * durationSeconds;
		const batchSize = 500;
		const batchesPerSecond = messagesPerSecond / batchSize;
		const delayBetweenBatches = 1000 / batchesPerSecond;

		console.log(`⏳ Starting sustained load test: ${messagesPerSecond.toLocaleString()} msg/sec for ${durationSeconds} seconds`);
		console.log(`📊 Total messages: ${totalMessages.toLocaleString()}`);
		console.log(`📦 Batch size: ${batchSize}`);

		const startTime = Date.now();
		let sentCount = 0;
		const promises = [];

		for (let i = 0; i < totalMessages; i += batchSize) {
			const batchPromise = this.sendBatch(batchSize, i);
			promises.push(batchPromise);
			sentCount += batchSize;

			if (promises.length % batchesPerSecond === 0) {
				await new Promise((resolve) => setTimeout(resolve, delayBetweenBatches));
			}

			if (sentCount % (totalMessages / 10) === 0) {
				const progress = Math.floor((sentCount / totalMessages) * 100);
				console.log(`📊 Progress: ${progress}% (${sentCount.toLocaleString()} messages sent)`);
			}
		}

		await Promise.all(promises);

		const endTime = Date.now();
		const duration = (endTime - startTime) / 1000;
		const throughput = Math.floor(totalMessages / duration);

		console.log(`✅ Sent ${sentCount.toLocaleString()} messages in ${duration.toFixed(2)}s`);
		console.log(`📈 Average throughput: ${throughput.toLocaleString()} msg/sec`);

		return {
			totalMessages: sentCount,
			duration,
			throughput,
			success: true,
		};
	}

	async runConcurrentProducersTest(
		numProducers: number,
		messagesPerProducer: number,
		batchSize: number
	): Promise<StressTestResult> {
		const totalMessages = numProducers * messagesPerProducer;

		console.log(`🔀 Starting concurrent producer test: ${numProducers} producers x ${messagesPerProducer.toLocaleString()} messages`);
		console.log(`📊 Total messages: ${totalMessages.toLocaleString()}`);

		const startTime = Date.now();

		const producerTasks = Array.from({ length: numProducers }, (_, idx) =>
			(async () => {
				const promises = [];
				for (let i = 0; i < messagesPerProducer; i += batchSize) {
					const batchPromise = this.sendBatch(
						batchSize,
						idx * messagesPerProducer + i
					);
					promises.push(batchPromise);
				}
				await Promise.all(promises);
			})()
		);

		await Promise.all(producerTasks);

		const endTime = Date.now();
		const duration = (endTime - startTime) / 1000;
		const throughput = Math.floor(totalMessages / duration);

		console.log(`✅ Sent ${totalMessages.toLocaleString()} messages in ${duration.toFixed(2)}s`);
		console.log(`📈 Combined throughput: ${throughput.toLocaleString()} msg/sec across ${numProducers} producers`);

		return {
			totalMessages,
			duration,
			throughput,
			success: true,
		};
	}
}

// Run stress tests if executed directly
async function main() {
	const stressTest = new KafkaStressTest();

	try {
		await stressTest.connect();

		console.log('\n=== Running Kafka Stress Tests ===\n');

		// Test 1: 10k messages
		await stressTest.runSimpleStressTest(10000, 1000);
		console.log('\n---\n');

		// Test 2: 50k messages
		await stressTest.runSimpleStressTest(50000, 250);
		console.log('\n---\n');

		// Test 3: 100k messages
		await stressTest.runSimpleStressTest(100000, 500);
		console.log('\n---\n');

		// Test 4: 250k messages
		await stressTest.runSimpleStressTest(250000, 1000);
		console.log('\n---\n');

		// Test 5: Burst test
		await stressTest.runBurstTest(50000, 1000);
		console.log('\n---\n');

		// Test 6: Sustained load
		await stressTest.runSustainedTest(10000, 30);
		console.log('\n---\n');

		// Test 7: Concurrent producers
		await stressTest.runConcurrentProducersTest(5, 5000, 250);

		console.log('\n=== All stress tests completed ===\n');
	} catch (error) {
		console.error('❌ Stress test failed:', error);
		process.exit(1);
	} finally {
		await stressTest.disconnect();
	}
}

// Only run if this file is executed directly
if (import.meta.main) {
	main();
}

export { KafkaStressTest, type StressTestResult };


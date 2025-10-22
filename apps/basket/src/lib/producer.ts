import { CompressionTypes, Kafka } from 'kafkajs';
import { Semaphore } from 'async-mutex';
import { clickHouse, TABLE_NAMES } from '@databuddy/db';

const BROKER = process.env.KAFKA_BROKERS as string;
const SEMAPHORE_LIMIT = 15;
const BUFFER_INTERVAL = 5000;
const BUFFER_MAX = 1000;
const MAX_RETRIES = 3;
const RECONNECT_COOLDOWN = 60000;

const semaphore = new Semaphore(SEMAPHORE_LIMIT);
const bufferMutex = new Semaphore(1);

type BufferedEvent = {
	table: string;
	event: any;
	retries: number;
};

const buffer: BufferedEvent[] = [];
let timer: Timer | null = null;
let started = false;

const topicMap: Record<string, string> = {
	'analytics-events': TABLE_NAMES.events,
	'analytics-errors': TABLE_NAMES.errors,
	'analytics-web-vitals': TABLE_NAMES.web_vitals,
	'analytics-custom-events': TABLE_NAMES.custom_events,
	'analytics-outgoing-links': TABLE_NAMES.outgoing_links,
};

let kafka: Kafka | null = null;
let producer: any = null;
let connected = false;
let failed = false;
let lastRetry = 0;

if (BROKER) {
	kafka = new Kafka({ clientId: 'basket', brokers: [BROKER] });
	producer = kafka.producer({ allowAutoTopicCreation: true });
}

async function connect() {
	if (!BROKER || connected) return connected;
	if (failed && Date.now() - lastRetry < RECONNECT_COOLDOWN) return false;

	try {
		await producer.connect();
		connected = true;
		failed = false;
		console.log('Kafka connected');
		return true;
	} catch (err) {
		failed = true;
		lastRetry = Date.now();
		console.error('Kafka connection failed, using ClickHouse fallback', err);
		return false;
	}
}

async function flush() {
	if (buffer.length === 0) return;

	const [, release] = await bufferMutex.acquire();
	const items = buffer.splice(0);
	release();

	const grouped = items.reduce((acc, { table, event, retries }) => {
		if (!acc[table]) acc[table] = [];
		acc[table].push({ event, retries });
		return acc;
	}, {} as Record<string, Array<{ event: any; retries: number }>>);

	await Promise.allSettled(
		Object.entries(grouped).map(async ([table, items]) => {
			try {
				await clickHouse.insert({
					table,
					values: items.map(i => i.event),
					format: 'JSONEachRow',
				});
				console.log(`Flushed ${items.length} to ${table}`);
			} catch (err) {
				console.error(`Flush failed for ${table}`, err);
				const [, release] = await bufferMutex.acquire();
				items.forEach(({ event, retries }) => {
					if (retries < MAX_RETRIES) {
						buffer.push({ table, event, retries: retries + 1 });
					} else {
						console.error(`Dropped event after ${MAX_RETRIES} retries`, { table, event });
					}
				});
				release();
			}
		})
	);
}

function startTimer() {
	if (started) return;
	started = true;
	timer = setInterval(() => flush().catch(console.error), BUFFER_INTERVAL);
}

async function toBuffer(topic: string, event: any) {
	const table = topicMap[topic];
	if (!table) {
		console.error(`Unknown topic: ${topic}`);
		return;
	}

	const [, release] = await bufferMutex.acquire();
	buffer.push({ table, event, retries: 0 });
	const size = buffer.length;
	release();

	if (!timer) startTimer();
	if (size >= BUFFER_MAX) flush().catch(console.error);
}

async function send(topic: string, event: any, key?: string) {
	const [, release] = await semaphore.acquire();

	try {
		if ((await connect()) && producer) {
			try {
				await producer.send({
					topic,
					messages: [{ value: JSON.stringify(event), key: key || event.client_id }],
					timeout: 10000,
					compression: CompressionTypes.GZIP,
				});
				return;
			} catch (err) {
				console.error('Kafka send failed', err);
				failed = true;
			}
		}
		await toBuffer(topic, event);
	} finally {
		release();
	}
}

export const sendEvent = (topic: string, event: any, key?: string) => {
	send(topic, event, key).catch(console.error);
};

export const sendEventSync = async (topic: string, event: any, key?: string) => {
	await send(topic, event, key);
};

export const sendEventBatch = async (topic: string, events: any[]) => {
	if (events.length === 0) return;

	const [, release] = await semaphore.acquire();

	try {
		if ((await connect()) && producer) {
			try {
				await producer.send({
					topic,
					messages: events.map(e => ({
						value: JSON.stringify(e),
						key: e.client_id || e.event_id,
					})),
					timeout: 10000,
					compression: CompressionTypes.GZIP,
				});
				return;
			} catch (err) {
				console.error('Kafka batch failed', err);
				failed = true;
			}
		}
		for (const e of events) {
			await toBuffer(topic, e);
		}
	} finally {
		release();
	}
};

export const disconnectProducer = async () => {
	await flush();

	let checks = 0;
	while (semaphore.getValue() < SEMAPHORE_LIMIT && checks++ < 50) {
		await new Promise(r => setTimeout(r, 100));
	}

	if (timer) {
		clearInterval(timer);
		timer = null;
		started = false;
	}

	if (connected && producer) {
		await producer.disconnect();
		connected = false;
	}
};


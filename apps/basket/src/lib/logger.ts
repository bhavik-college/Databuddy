import pino from 'pino';

const logger = pino({
	level: 'info',
	transport: {
		target: '@logtail/pino',
		options: {
			sourceToken: process.env.LOGTAIL_SOURCE_TOKEN,
			options: { endpoint: 'https://s1447431.eu-nbg-2.betterstackdata.com' },
		},
	},
});

export { logger };

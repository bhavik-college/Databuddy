import { umamiAdapter } from './adapters';
import type { AnalyticsEventAdapter } from './types';

export { mapEvents } from './utils-map-events';

export const adapters = { umami: umamiAdapter };
export type { AnalyticsEventAdapter };

import { CustomEventsBuilders } from './custom-events';
import { DevicesBuilders } from './devices';
import { ErrorsBuilders } from './errors';
import { GeoBuilders } from './geo';
import { PagesBuilders } from './pages';
import { PerformanceBuilders } from './performance';
import { ProfilesBuilders } from './profiles';
import { SessionsBuilders } from './sessions';
import { SummaryBuilders } from './summary';
import { TrafficBuilders } from './traffic';

export const QueryBuilders = {
  ...SummaryBuilders,
  ...PagesBuilders,
  ...TrafficBuilders,
  ...DevicesBuilders,
  ...GeoBuilders,
  ...ErrorsBuilders,
  ...PerformanceBuilders,
  ...SessionsBuilders,
  ...CustomEventsBuilders,
  ...ProfilesBuilders,
};

export type QueryType = keyof typeof QueryBuilders;

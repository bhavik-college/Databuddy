import { Analytics } from '../../types/tables';
import type { SimpleQueryConfig } from '../types';

export const ErrorsBuilders: Record<
  string,
  SimpleQueryConfig<typeof Analytics.errors>
> = {
  recent_errors: {
    table: Analytics.errors,
    fields: [
      'message as error_message',
      'stack as error_stack',
      'path as page_url',
      'anonymous_id',
      'session_id',
      'timestamp as time',
      'browser_name',
      'os_name',
      'country',
    ],
    where: ["message != ''"],
    orderBy: 'timestamp DESC',
    limit: 100,
    timeField: 'timestamp',
    allowedFilters: ['path', 'browser_name', 'os_name', 'country', 'message'],
    customizable: true,
  },

  error_types: {
    table: Analytics.errors,
    fields: [
      'message as name',
      'COUNT(*) as count',
      'uniq(anonymous_id) as users',
      'MAX(timestamp) as last_seen',
    ],
    where: ["message != ''"],
    groupBy: ['message'],
    orderBy: 'count DESC',
    limit: 50,
    timeField: 'timestamp',
    allowedFilters: ['message', 'path', 'browser_name', 'country'],
    customizable: true,
  },

  error_trends: {
    table: Analytics.errors,
    fields: [
      'toDate(timestamp) as date',
      'COUNT(*) as errors',
      'uniq(anonymous_id) as users',
    ],
    where: ["message != ''"],
    groupBy: ['toDate(timestamp)'],
    orderBy: 'date ASC',
    timeField: 'timestamp',
    allowedFilters: ['message', 'path', 'browser_name', 'country'],
  },

  errors_by_page: {
    table: Analytics.errors,
    fields: [
      'path as name',
      'COUNT(*) as errors',
      'uniq(anonymous_id) as users',
    ],
    where: ["message != ''", "path != ''"],
    groupBy: ['path'],
    orderBy: 'errors DESC',
    limit: 25,
    timeField: 'timestamp',
    allowedFilters: ['path', 'message', 'browser_name'],
    customizable: true,
  },

  error_frequency: {
    table: Analytics.errors,
    fields: ['toDate(timestamp) as date', 'COUNT(*) as count'],
    where: ["message != ''"],
    groupBy: ['toDate(timestamp)'],
    orderBy: 'date ASC',
    timeField: 'timestamp',
    allowedFilters: ['message', 'path', 'browser_name', 'country'],
  },
};

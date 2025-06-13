import type { ParameterBuilder } from '../types'
import { escapeSqlString } from '../utils'

export const revenueBuilders: Record<string, ParameterBuilder> = {
  revenue_summary: (websiteId: string, startDate: string, endDate: string, limit: number, offset: number, granularity: 'hourly' | 'daily' = 'daily', timezone?: string, filters?: any[]) => {
    // Build live mode filter if provided
    const liveModeFilter = filters?.find(f => f.field === 'livemode');
    const liveModeCondition = liveModeFilter ? `AND livemode = ${liveModeFilter.value}` : '';
    
    return `
      SELECT 
        SUM(CASE WHEN status = 'succeeded' THEN amount ELSE 0 END) / 100 as total_revenue,
        COUNT(DISTINCT CASE WHEN status = 'succeeded' THEN id END) as total_transactions,
        COUNT(DISTINCT CASE WHEN status = 'succeeded' THEN id END) as successful_transactions,
        (SELECT COUNT(*) FROM analytics.stripe_refunds 
           WHERE created >= parseDateTimeBestEffort(${escapeSqlString(startDate)})
           AND created <= parseDateTimeBestEffort(${escapeSqlString(endDate)})
           AND client_id = ${escapeSqlString(websiteId)}
           ${liveModeCondition}) as total_refunds,
        AVG(CASE WHEN status = 'succeeded' THEN amount ELSE NULL END) / 100 as avg_order_value,
        100.0 as success_rate
      FROM analytics.stripe_payment_intents 
      WHERE created >= parseDateTimeBestEffort(${escapeSqlString(startDate)})
        AND created <= parseDateTimeBestEffort(${escapeSqlString(endDate)})
        AND client_id = ${escapeSqlString(websiteId)}
        AND status = 'succeeded'
        ${liveModeCondition}
    `;
  },

  revenue_trends: (websiteId: string, startDate: string, endDate: string, limit: number, offset: number, granularity: 'hourly' | 'daily' = 'daily', timezone?: string, filters?: any[]) => {
    const timeFormat = granularity === 'hourly' 
      ? 'toDateTime(toStartOfHour(toDateTime(created)))' 
      : 'toDate(toDateTime(created))';
    
    // Build live mode filter if provided
    const liveModeFilter = filters?.find(f => f.field === 'livemode');
    const liveModeCondition = liveModeFilter ? `AND livemode = ${liveModeFilter.value}` : '';
    
    return `
      SELECT 
        ${timeFormat} as time,
        SUM(amount) / 100 as total_revenue,
        COUNT(DISTINCT id) as total_transactions,
        AVG(amount) / 100 as avg_order_value,
        100.0 as success_rate
      FROM analytics.stripe_payment_intents 
      WHERE created >= parseDateTimeBestEffort(${escapeSqlString(startDate)})
        AND created <= parseDateTimeBestEffort(${escapeSqlString(endDate)})
        AND client_id = ${escapeSqlString(websiteId)}
        AND status = 'succeeded'
        ${liveModeCondition}
      GROUP BY time 
      ORDER BY time DESC 
      LIMIT ${offset}, ${limit}
    `;
  },

  recent_transactions: (websiteId: string, startDate: string, endDate: string, limit: number, offset: number, granularity: 'hourly' | 'daily' = 'daily', timezone?: string, filters?: any[]) => {
    // Build live mode filter if provided
    const liveModeFilter = filters?.find(f => f.field === 'livemode');
    const liveModeCondition = liveModeFilter ? `AND livemode = ${liveModeFilter.value}` : '';
    
    return `
      SELECT 
        id,
        toDateTime(created) as created,
        status,
        currency,
        amount / 100 as amount,
        customer_id,
        session_id
      FROM analytics.stripe_payment_intents 
      WHERE created >= parseDateTimeBestEffort(${escapeSqlString(startDate)})
        AND created <= parseDateTimeBestEffort(${escapeSqlString(endDate)})
        AND client_id = ${escapeSqlString(websiteId)}
        ${liveModeCondition}
      ORDER BY created DESC 
      LIMIT ${offset}, ${limit}
    `;
  },

  recent_refunds: (websiteId: string, startDate: string, endDate: string, limit: number, offset: number, granularity: 'hourly' | 'daily' = 'daily', timezone?: string, filters?: any[]) => {
    // Build live mode filter if provided
    const liveModeFilter = filters?.find(f => f.field === 'livemode');
    const liveModeCondition = liveModeFilter ? `AND livemode = ${liveModeFilter.value}` : '';
    
    return `
      SELECT 
        id,
        toDateTime(created) as created,
        status,
        reason,
        currency,
        amount / 100 as amount,
        payment_intent_id,
        session_id
      FROM analytics.stripe_refunds 
      WHERE created >= parseDateTimeBestEffort(${escapeSqlString(startDate)})
        AND created <= parseDateTimeBestEffort(${escapeSqlString(endDate)})
        AND client_id = ${escapeSqlString(websiteId)}
        ${liveModeCondition}
      ORDER BY created DESC 
      LIMIT ${offset}, ${limit}
    `;
  },

  revenue_by_country: (websiteId: string, startDate: string, endDate: string, limit: number, offset: number, granularity: 'hourly' | 'daily' = 'daily', timezone?: string, filters?: any[]) => {
    // Build live mode filter if provided
    const liveModeFilter = filters?.find(f => f.field === 'livemode');
    const liveModeCondition = liveModeFilter ? `AND livemode = ${liveModeFilter.value}` : '';
    
    return `
      SELECT 
        e.country as name,
        SUM(pi.amount) / 100 as total_revenue,
        COUNT(pi.id) as total_transactions,
        AVG(pi.amount) / 100 as avg_order_value
      FROM analytics.stripe_payment_intents pi
      LEFT JOIN analytics.events e ON pi.session_id = e.session_id
      WHERE pi.created >= parseDateTimeBestEffort(${escapeSqlString(startDate)})
        AND pi.created <= parseDateTimeBestEffort(${escapeSqlString(endDate)})
        AND pi.client_id = ${escapeSqlString(websiteId)}
        AND pi.status = 'succeeded'
        ${liveModeCondition}
        AND e.country IS NOT NULL 
        AND e.country != ''
      GROUP BY e.country 
      ORDER BY total_revenue DESC 
      LIMIT ${offset}, ${limit}
    `;
  },

  revenue_by_currency: (websiteId: string, startDate: string, endDate: string, limit: number, offset: number, granularity: 'hourly' | 'daily' = 'daily', timezone?: string, filters?: any[]) => {
    // Build live mode filter if provided
    const liveModeFilter = filters?.find(f => f.field === 'livemode');
    const liveModeCondition = liveModeFilter ? `AND livemode = ${liveModeFilter.value}` : '';
    
    return `
      SELECT 
        currency as name,
        SUM(amount) / 100 as total_revenue,
        COUNT(*) as total_transactions,
        AVG(amount) / 100 as avg_order_value
      FROM analytics.stripe_payment_intents 
      WHERE created >= parseDateTimeBestEffort(${escapeSqlString(startDate)})
        AND created <= parseDateTimeBestEffort(${escapeSqlString(endDate)})
        AND client_id = ${escapeSqlString(websiteId)}
        AND status = 'succeeded'
        ${liveModeCondition}
      GROUP BY currency 
      ORDER BY total_revenue DESC 
      LIMIT ${offset}, ${limit}
    `;
  },

  revenue_by_card_brand: (websiteId: string, startDate: string, endDate: string, limit: number, offset: number, granularity: 'hourly' | 'daily' = 'daily', timezone?: string, filters?: any[]) => {
    // Build live mode filter if provided
    const liveModeFilter = filters?.find(f => f.field === 'livemode');
    const liveModeCondition = liveModeFilter ? `AND livemode = ${liveModeFilter.value}` : '';
    
    return `
      SELECT 
        'card' as name,
        SUM(amount) / 100 as total_revenue,
        COUNT(id) as total_transactions,
        AVG(amount) / 100 as avg_order_value
      FROM analytics.stripe_payment_intents
      WHERE created >= parseDateTimeBestEffort(${escapeSqlString(startDate)})
        AND created <= parseDateTimeBestEffort(${escapeSqlString(endDate)})
        AND client_id = ${escapeSqlString(websiteId)}
        AND status = 'succeeded'
        ${liveModeCondition}
      GROUP BY 'card'
      ORDER BY total_revenue DESC 
      LIMIT ${offset}, ${limit}
    `;
  },

  // New builders that show all events without client filtering
  all_events_summary: (websiteId: string, startDate: string, endDate: string, limit: number, offset: number, granularity: 'hourly' | 'daily' = 'daily') => `
    SELECT 
      COUNT(*) as total_events,
      COUNT(DISTINCT client_id) as unique_clients,
      COUNT(DISTINCT session_id) as unique_sessions,
      COUNT(DISTINCT anonymous_id) as unique_users,
      COUNT(DISTINCT event_name) as unique_event_types,
      COUNT(CASE WHEN event_type = 'error' THEN 1 END) as error_events,
      COUNT(CASE WHEN event_type = 'web_vitals' THEN 1 END) as web_vitals_events,
      COUNT(CASE WHEN event_type = 'track' THEN 1 END) as track_events
    FROM analytics.events 
    WHERE time >= parseDateTimeBestEffort(${escapeSqlString(startDate)})
      AND time <= parseDateTimeBestEffort(${escapeSqlString(endDate)})
  `,

  all_events_by_client: (websiteId: string, startDate: string, endDate: string, limit: number, offset: number, granularity: 'hourly' | 'daily' = 'daily') => `
    SELECT 
      client_id,
      COUNT(*) as total_events,
      COUNT(DISTINCT session_id) as unique_sessions,
      COUNT(DISTINCT anonymous_id) as unique_users,
      COUNT(DISTINCT event_name) as unique_event_types,
      MIN(time) as first_event,
      MAX(time) as last_event
    FROM analytics.events 
    WHERE time >= parseDateTimeBestEffort(${escapeSqlString(startDate)})
      AND time <= parseDateTimeBestEffort(${escapeSqlString(endDate)})
    GROUP BY client_id 
    ORDER BY total_events DESC 
    LIMIT ${offset}, ${limit}
  `,

  all_events_trends: (websiteId: string, startDate: string, endDate: string, limit: number, offset: number, granularity: 'hourly' | 'daily' = 'daily') => {
    const timeFormat = granularity === 'hourly' 
      ? 'toDateTime(toStartOfHour(toDateTime(time)))' 
      : 'toDate(toDateTime(time))';
    
    return `
      SELECT 
        ${timeFormat} as time,
        COUNT(*) as total_events,
        COUNT(DISTINCT client_id) as unique_clients,
        COUNT(DISTINCT session_id) as unique_sessions,
        COUNT(DISTINCT anonymous_id) as unique_users,
        COUNT(CASE WHEN event_type = 'error' THEN 1 END) as error_events,
        COUNT(CASE WHEN event_type = 'web_vitals' THEN 1 END) as web_vitals_events,
        COUNT(CASE WHEN event_type = 'track' THEN 1 END) as track_events
      FROM analytics.events 
      WHERE time >= parseDateTimeBestEffort(${escapeSqlString(startDate)})
        AND time <= parseDateTimeBestEffort(${escapeSqlString(endDate)})
      GROUP BY time 
      ORDER BY time DESC 
      LIMIT ${offset}, ${limit}
    `;
  },

  all_events_by_country: (websiteId: string, startDate: string, endDate: string, limit: number, offset: number, granularity: 'hourly' | 'daily' = 'daily') => `
    SELECT 
      country as name,
      COUNT(*) as total_events,
      COUNT(DISTINCT client_id) as unique_clients,
      COUNT(DISTINCT session_id) as unique_sessions,
      COUNT(DISTINCT anonymous_id) as unique_users
    FROM analytics.events 
    WHERE time >= parseDateTimeBestEffort(${escapeSqlString(startDate)})
      AND time <= parseDateTimeBestEffort(${escapeSqlString(endDate)})
      AND country IS NOT NULL 
      AND country != ''
    GROUP BY country 
    ORDER BY total_events DESC 
    LIMIT ${offset}, ${limit}
  `,

  all_events_by_type: (websiteId: string, startDate: string, endDate: string, limit: number, offset: number, granularity: 'hourly' | 'daily' = 'daily') => `
    SELECT 
      event_name as name,
      COUNT(*) as total_events,
      COUNT(DISTINCT client_id) as unique_clients,
      COUNT(DISTINCT session_id) as unique_sessions,
      COUNT(DISTINCT anonymous_id) as unique_users
    FROM analytics.events 
    WHERE time >= parseDateTimeBestEffort(${escapeSqlString(startDate)})
      AND time <= parseDateTimeBestEffort(${escapeSqlString(endDate)})
    GROUP BY event_name 
    ORDER BY total_events DESC 
    LIMIT ${offset}, ${limit}
  `,

  all_revenue_by_client: (websiteId: string, startDate: string, endDate: string, limit: number, offset: number, granularity: 'hourly' | 'daily' = 'daily') => `
    SELECT 
      client_id,
      SUM(CASE WHEN status = 'succeeded' THEN amount ELSE 0 END) / 100 as total_revenue,
      COUNT(DISTINCT CASE WHEN status = 'succeeded' THEN id END) as total_transactions,
      COUNT(DISTINCT CASE WHEN status = 'succeeded' THEN id END) as successful_transactions,
      AVG(CASE WHEN status = 'succeeded' THEN amount ELSE NULL END) / 100 as avg_order_value,
      100.0 as success_rate,
      MIN(created) as first_transaction,
      MAX(created) as last_transaction
    FROM analytics.stripe_payment_intents 
    WHERE created >= parseDateTimeBestEffort(${escapeSqlString(startDate)})
      AND created <= parseDateTimeBestEffort(${escapeSqlString(endDate)})
      AND status = 'succeeded'
    GROUP BY client_id 
    ORDER BY total_revenue DESC 
    LIMIT ${offset}, ${limit}
  `,
} 
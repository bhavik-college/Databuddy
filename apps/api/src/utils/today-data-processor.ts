/**
 * Utilities for merging today's real-time data with historical data
 */
import { calculateWeightedBounceRate, formatAnalyticsEntry, getCurrentHourFormatted, isToday } from './analytics-helpers';

interface AnalyticsEntry {
  date: string;
  pageviews: number;
  unique_visitors?: number;
  visitors?: number;
  sessions: number;
  bounce_rate: number;
  avg_session_duration?: number;
  [key: string]: any;
}

interface TodayData {
  pageviews: number;
  visitors: number;
  sessions: number;
  bounce_rate: number;
  [key: string]: any;
}

/**
 * Merge today's data into the summary
 */
export function mergeTodayDataIntoSummary(
  summaryData: any,
  todayData: TodayData | null
): any {
  if (!todayData) {
    return summaryData;
  }
  
  const summary = {
    pageviews: (summaryData?.pageviews || 0) + (todayData.pageviews || 0),
    unique_visitors: (summaryData?.unique_visitors || 0) + (todayData.visitors || 0),
    visitors: (summaryData?.unique_visitors || 0) + (todayData.visitors || 0),
    sessions: (summaryData?.sessions || 0) + (todayData.sessions || 0),
    bounce_rate: summaryData?.bounce_rate || 0,
    avg_session_duration: summaryData?.avg_session_duration || 0
  };
  
  // If we have today's sessions and bounce rate data, calculate weighted average
  if (todayData.sessions && todayData.bounce_rate !== undefined) {
    const historicalSessions = summaryData?.sessions || 0;
    const todaySessions = todayData.sessions || 0;
    
    if (historicalSessions + todaySessions > 0) {
      summary.bounce_rate = calculateWeightedBounceRate(
        historicalSessions, 
        summaryData?.bounce_rate || 0,
        todaySessions, 
        todayData.bounce_rate || 0
      );
    }
  }
  
  return summary;
}

/**
 * Update events by date to include today's data
 */
export function updateEventsWithTodayData(
  eventsByDate: AnalyticsEntry[],
  todayData: TodayData | null,
  granularity: 'daily' | 'hourly' = 'daily'
): AnalyticsEntry[] {
  if (!todayData) {
    return eventsByDate;
  }
  
  const updatedEvents = [...eventsByDate];
  const today = new Date().toISOString().split('T')[0];
  
  if (granularity === 'daily') {
    const todayStats = {
      date: today,
      pageviews: todayData.pageviews || 0,
      unique_visitors: todayData.visitors || 0,
      visitors: todayData.visitors || 0,
      sessions: todayData.sessions || 0,
      bounce_rate: todayData.bounce_rate || 0, 
      avg_session_duration: 0 
    };
    
    // Check if today exists in eventsByDate
    const todayIndex = updatedEvents.findIndex(day => day.date === today);
    
    if (todayIndex >= 0) {
      // Calculate weighted bounce rate
      const existingEntry = updatedEvents[todayIndex];
      const historicalSessions = existingEntry.sessions || 0;
      const todaySessions = todayData.sessions || 0;
      
      // Update existing entry with today's data
      updatedEvents[todayIndex] = {
        ...existingEntry,
        pageviews: (existingEntry.pageviews || 0) + todayData.pageviews,
        unique_visitors: (existingEntry.unique_visitors || 0) + todayData.visitors,
        visitors: (existingEntry.visitors || 0) + todayData.visitors,
        sessions: historicalSessions + todaySessions
      };
      
      // Update bounce rate if we have data
      if (todayData.bounce_rate !== undefined && historicalSessions + todaySessions > 0) {
        updatedEvents[todayIndex].bounce_rate = calculateWeightedBounceRate(
          historicalSessions,
          existingEntry.bounce_rate || 0,
          todaySessions,
          todayData.bounce_rate
        );
      }
    } else {
      // Add today if it doesn't exist
      updatedEvents.push(todayStats);
      // Sort by date
      updatedEvents.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    }
  } else if (granularity === 'hourly') {
    // For hourly granularity, update the current hour
    const currentHourFormatted = getCurrentHourFormatted();
    const currentHourIndex = updatedEvents.findIndex(hour => hour.date === currentHourFormatted);
    
    if (currentHourIndex >= 0) {
      const existingEntry = updatedEvents[currentHourIndex];
      const historicalSessions = existingEntry.sessions || 0;
      const todaySessions = todayData.sessions || 0;
      
      // Update existing hour with today's data
      updatedEvents[currentHourIndex] = {
        ...existingEntry,
        pageviews: (existingEntry.pageviews || 0) + todayData.pageviews,
        unique_visitors: (existingEntry.unique_visitors || 0) + todayData.visitors,
        visitors: (existingEntry.visitors || 0) + todayData.visitors,
        sessions: historicalSessions + todaySessions
      };
      
      // Update bounce rate if we have data
      if (todayData.bounce_rate !== undefined && historicalSessions + todaySessions > 0) {
        updatedEvents[currentHourIndex].bounce_rate = calculateWeightedBounceRate(
          historicalSessions,
          existingEntry.bounce_rate || 0,
          todaySessions,
          todayData.bounce_rate
        );
      }
    }
  }
  
  return updatedEvents;
}

/**
 * Merge today's data into trend data results
 */
export function mergeTodayIntoTrends(
  trends: any[],
  todayData: TodayData | null,
  granularity: 'daily' | 'hourly' = 'daily',
  dateField = 'date'
): any[] {
  if (!todayData) {
    return trends;
  }
  
  return trends.map(entry => {
    const entryDate = entry[dateField]?.toString() || '';
    
    // Check if this entry corresponds to today
    if ((granularity === 'daily' && isToday(entryDate)) || 
        (granularity === 'hourly' && entryDate === getCurrentHourFormatted())) {
      
      // Merge today's data
      const pageviews = (entry.pageviews || 0) + (todayData.pageviews || 0);
      const visitors = (entry.unique_visitors || entry.visitors || 0) + (todayData.visitors || 0);
      const sessions = (entry.sessions || 0) + (todayData.sessions || 0);
      
      // Calculate weighted bounce rate
      let bounceRate = entry.bounce_rate || 0;
      if (sessions > 0 && todayData.bounce_rate !== undefined) {
        const historicalSessions = entry.sessions || 0;
        const todaySessions = todayData.sessions || 0;
        
        bounceRate = calculateWeightedBounceRate(
          historicalSessions,
          entry.bounce_rate || 0,
          todaySessions,
          todayData.bounce_rate
        );
      }
      
      return {
        ...entry,
        pageviews,
        visitors: visitors,
        unique_visitors: visitors,
        sessions,
        bounce_rate: Math.round(bounceRate * 10) / 10,
        bounce_rate_pct: `${Math.round(bounceRate * 10) / 10}%`
      };
    }
    
    // If not today, return the original entry
    return entry;
  });
} 
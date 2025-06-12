/**
 * User Agent Utilities
 * 
 * Provides functions for user agent analysis including bot detection
 * and platform identification.
 */

import { isBot } from '../lists';

export interface UserAgentInfo {
  bot: {
    isBot: boolean;
    name?: string;
    type?: string;
  };
  browser?: string;
  os?: string;
  device?: 'desktop' | 'mobile' | 'tablet' | 'unknown';
}

/**
 * Parse user agent to extract useful information
 */
export function parseUserAgent(userAgent: string): UserAgentInfo {
  if (!userAgent) {
    return {
      bot: { isBot: false },
      device: 'unknown'
    };
  }
  
  // Check if it's a bot
  const botInfo = isBot(userAgent);
  
  if (botInfo) {
    return {
      bot: {
        isBot: true,
        name: botInfo.name,
        type: botInfo.category
      },
      device: 'unknown'
    };
  }
  
  // Simple browser detection
  let browser = 'unknown';
  if (userAgent.includes('Chrome') && !userAgent.includes('Edg/')) {
    browser = 'Chrome';
  } else if (userAgent.includes('Firefox')) {
    browser = 'Firefox';
  } else if (userAgent.includes('Safari') && !userAgent.includes('Chrome')) {
    browser = 'Safari';
  } else if (userAgent.includes('Edg/')) {
    browser = 'Edge';
  } else if (userAgent.includes('MSIE') || userAgent.includes('Trident/')) {
    browser = 'Internet Explorer';
  }
  
  // Simple OS detection
  let os = 'unknown';
  if (userAgent.includes('Windows')) {
    os = 'Windows';
  } else if (userAgent.includes('Mac OS')) {
    os = 'macOS';
  } else if (userAgent.includes('Linux')) {
    os = 'Linux';
  } else if (userAgent.includes('Android')) {
    os = 'Android';
  } else if (userAgent.includes('iOS') || userAgent.includes('iPhone') || userAgent.includes('iPad')) {
    os = 'iOS';
  }
  
  // Simple device type detection
  let device: 'desktop' | 'mobile' | 'tablet' | 'unknown' = 'unknown';
  if (userAgent.includes('iPhone') || userAgent.includes('Android') && !userAgent.includes('iPad') && !userAgent.includes('Tablet')) {
    device = 'mobile';
  } else if (userAgent.includes('iPad') || userAgent.includes('Tablet')) {
    device = 'tablet';
  } else if (os === 'Windows' || os === 'macOS' || os === 'Linux') {
    device = 'desktop';
  }
  
  return {
    bot: { isBot: false },
    browser,
    os,
    device
  };
}

/**
 * Detect if a user agent is from a bot/crawler
 */
export function detectBot(userAgent: string): { isBot: boolean; name?: string; type?: string } {
  if (!userAgent) {
    return { isBot: false };
  }
  
  const botInfo = isBot(userAgent);
  return botInfo 
    ? { isBot: true, name: botInfo.name, type: botInfo.category } 
    : { isBot: false };
} 
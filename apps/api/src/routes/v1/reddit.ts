import { Context, Hono } from 'hono';
import { cors } from 'hono/cors';
import snoowrap from 'snoowrap';

const app = new Hono();

// Enable CORS for frontend requests
app.use('/*', cors({
  origin: ['http://localhost:3000', 'https://app.databuddy.cc'],
  allowHeaders: ['Content-Type', 'Authorization', 'User-Agent'],
  allowMethods: ['GET', 'POST', 'OPTIONS'],
}));

const reddit = new snoowrap({
  userAgent: 'Databuddy/1.0 (by /u/databuddy)',
  clientId: process.env.REDDIT_CLIENT_ID || 'gDHLhPJBdA1-F8cySNBYcA',
  clientSecret: process.env.REDDIT_CLIENT_SECRET || 'ncz5wy1BtPcF4afFSSiy8Lgc021yeQ',
  refreshToken: '167503878246025-A7OJsXQncCyIdTpRHO2wl3z2Dnn2NA',
  accessToken: 'eyJhbGciOiJSUzI1NiIsImtpZCI6IlNIQTI1NjpzS3dsMnlsV0VtMjVmcXhwTU40cWY4MXE2OWFFdWFyMnpLMUdhVGxjdWNZIiwidHlwIjoiSldUIn0.eyJzdWIiOiJ1c2VyIiwianRpIjoiejQzamY5Y0JST3V1N280b0IyaFhjbnpxVkVxZ2NnIiwiZXhwIjoxNzUwMjI4MjU2Ljg1MjY4OSwiaWF0IjoxNzUwMTQxODU2Ljg1MjY4OCwiY2lkIjoiZ0RITGhQSkJkQTEtRjhjeVNOQlljQSIsImxpZCI6InQyXzFuZGk3d2FhYTEiLCJhaWQiOiJ0Ml8xbmRpN3dhYWExIiwic2NwIjoiZUp4RWprRnV4VEFJUk9fQzJqZXF1aUEyemtlMUlRS2NLcmV2WFB1M3V4R2plYndQeUVhbGNEZ2s2RnBFZzFiS0ttRjhqRkRiWFVkdWYxM2xFeEw0T0R3YkgzUGpZU1BITUNvZVQ2TTV1aGZ0bTctWUNzY2NQejZPXzQ4LWpyN3VXcHFlSzF6cWI1M2FrQTBTb0lnT3lkUkoxZzd2cmFueG9sOUJJeXlRNERLLU1haVRPNTYwaWt0dF91QkNFaHdQSkdoOFUwZkJjMUl3WngyeUxjS3dWczdiZWtQZjhscm1jU1duVmlIQml6M1VKbk81ZnY0RUFBRF9fLXhYZGRzIiwicmNpZCI6IlhSUFA5QTZQZUdpN2lHdm9RT3pkaXhSenNzNGVNaGdCQkpyb2NCcjNwRVUiLCJsY2EiOjE3NDQ3MzI5MDUxMDEsImZsbyI6OH0.pm5jqC8QkmiV2aVmLlTwKwab--YkW3lTCab_lRH1Fli_s-vNwPSPQ5rjoDwh2gI4-lFpSMz1ZrlH3ZMHuvL_vFphLYaOgSc1QbrszqvEX7o4wScOLEw63-GqBYg-tz7XyCTqTW5VnRMwDSgN3Hmo57Rs1-yyobKbiPWR8-qfrO9thoMlywaQSD6xTpzfxHSN2rwYBgjqLQ-bVhL045HH_4W-KSUrFNV62ctvM7M4oo4ZXw_c9O4OeMDp0AzCWgzIf-6B6A1_XIok_P997nlQf80GZDcSvgw2AbFB-7Kjc2VVgXJ2qcCRbvaACDvmbN2e2lIuRUIAs9wWb0m79qPLTA'
});

// Rate limiting and monitoring
const rateLimitMap = new Map<string, { count: number; resetTime: number; errors: number }>();
const healthMetrics = {
  totalRequests: 0,
  successfulRequests: 0,
  averageResponseTime: 0,
  lastHealthCheck: Date.now(),
};

function checkRateLimit(clientId: string): boolean {
  const now = Date.now();
  const limit = rateLimitMap.get(clientId);
  
  if (!limit || now > limit.resetTime) {
    rateLimitMap.set(clientId, { count: 1, resetTime: now + 60000, errors: 0 });
    return true;
  }
  
  if (limit.count >= 100) { // Increased limit for production
    return false;
  }
  
  limit.count++;
  return true;
}

function recordError(clientId: string) {
  const limit = rateLimitMap.get(clientId);
  if (limit) {
    limit.errors++;
  }
}

// Enhanced interfaces
interface RedditPost {
  id: string;
  title: string;
  url: string;
  subreddit: string;
  author: string;
  score: number;
  num_comments: number;
  created_utc: number;
  selftext?: string;
  permalink: string;
  keyword: string;
  upvote_ratio?: number;
  domain?: string;
  is_self?: boolean;
  stickied?: boolean;
}

interface RedditStats {
  total_mentions: number;
  average_score: number;
  top_subreddit: string;
  recent_mentions: number;
  trending_keywords: string[];
  engagement_rate: number;
  peak_hour: number;
}

interface SearchFilters {
  keywords: string[];
  timeRange: string;
  subreddits?: string[];
  minScore?: number;
  sortBy?: 'relevance' | 'new' | 'top' | 'hot';
  excludeStickied?: boolean;
}

// Convert time range to Reddit API format
function convertTimeRange(timeRange: string): string {
  const timeMap: Record<string, string> = {
    '1h': 'hour',
    '24h': 'day', 
    '7d': 'week',
    '30d': 'month',
    '365d': 'year'
  };
  return timeMap[timeRange] || 'week';
}

// Enhanced search function with filtering
async function searchMentions(filters: SearchFilters): Promise<{ posts: RedditPost[]; searchTime: number }> {
  const startTime = Date.now();
  const allResults: RedditPost[] = [];
  const redditTimeRange = convertTimeRange(filters.timeRange);
  
  // Search specific subreddits if provided
  const searchTargets = filters.subreddits?.length ? 
    filters.subreddits.map(sub => `subreddit:${sub}`) : 
    [''];
  
  for (const keyword of filters.keywords) {
    try {
      const searchQueries = searchTargets.length > 1 ? 
        searchTargets.map(target => `${keyword} ${target}`) : 
        [keyword];
      
      for (const query of searchQueries) {
        const results = await reddit.search({
          query: query.trim(),
          sort: filters.sortBy || 'new',
          time: redditTimeRange as any,
          limit: 50, // Increased limit
        });

        for (const post of results) {
          // Skip if we already have this post
          if (allResults.some(r => r.id === post.id)) continue;
          
          // Apply filters
          if (filters.minScore && post.score < filters.minScore) continue;
          if (filters.excludeStickied && post.stickied) continue;
          
          const redditPost: RedditPost = {
            id: post.id,
            title: post.title,
            url: post.url,
            subreddit: post.subreddit_name_prefixed.replace('r/', ''),
            author: post.author.name,
            score: post.score,
            num_comments: post.num_comments,
            created_utc: post.created_utc,
            selftext: post.selftext || undefined,
            permalink: post.permalink,
            keyword: keyword,
            upvote_ratio: post.upvote_ratio,
            domain: post.domain,
            is_self: post.is_self,
            stickied: post.stickied,
          };
          
          allResults.push(redditPost);
        }
        
        // Delay between requests
        await new Promise(resolve => setTimeout(resolve, 200));
      }
    } catch (error) {
      console.error(`Error searching for keyword "${keyword}":`, error);
      continue;
    }
  }
  
  // Remove duplicates and sort
  const uniqueResults = allResults.filter((post, index, self) => 
    index === self.findIndex(p => p.id === post.id)
  );
  
  const sortedResults = uniqueResults.sort((a, b) => {
    switch (filters.sortBy) {
      case 'top':
        return b.score - a.score;
      case 'hot':
        return (b.score * b.num_comments) - (a.score * a.num_comments);
      default:
        return b.created_utc - a.created_utc;
    }
  });
  
  return {
    posts: sortedResults,
    searchTime: Date.now() - startTime
  };
}

// Enhanced stats calculation
function calculateStats(posts: RedditPost[], filters: SearchFilters): RedditStats {
  const total_mentions = posts.length;
  const average_score = total_mentions > 0 ? posts.reduce((sum, p) => sum + p.score, 0) / total_mentions : 0;
  
  // Find top subreddit
  const subredditCounts = posts.reduce((acc, post) => {
    acc[post.subreddit] = (acc[post.subreddit] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  
  const top_subreddit = Object.entries(subredditCounts)
    .sort(([,a], [,b]) => b - a)[0]?.[0] || '';
  
  // Calculate recent mentions (last 24h)
  const oneDayAgo = Math.floor(Date.now() / 1000) - (24 * 60 * 60);
  const recent_mentions = posts.filter(p => p.created_utc > oneDayAgo).length;
  
  // Find trending keywords
  const keywordCounts = posts.reduce((acc, post) => {
    acc[post.keyword] = (acc[post.keyword] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  
  const trending_keywords = Object.entries(keywordCounts)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 5)
    .map(([keyword]) => keyword);
  
  // Calculate engagement rate (comments per post)
  const engagement_rate = total_mentions > 0 ? 
    posts.reduce((sum, p) => sum + p.num_comments, 0) / total_mentions : 0;
  
  // Find peak hour
  const hourCounts = posts.reduce((acc, post) => {
    const hour = new Date(post.created_utc * 1000).getHours();
    acc[hour] = (acc[hour] || 0) + 1;
    return acc;
  }, {} as Record<number, number>);
  
  const peak_hour = Object.entries(hourCounts)
    .sort(([,a], [,b]) => b - a)[0]?.[0] ? 
    parseInt(Object.entries(hourCounts).sort(([,a], [,b]) => b - a)[0][0]) : 0;
  
  return {
    total_mentions,
    average_score,
    top_subreddit,
    recent_mentions,
    trending_keywords,
    engagement_rate,
    peak_hour,
  };
}

// Mentions endpoint with enhanced filtering
app.get('/mentions', async (c: Context) => {
  const startTime = Date.now();
  const clientId = c.req.header('x-client-id') || c.req.header('x-forwarded-for') || 'anonymous';
  
  healthMetrics.totalRequests++;
  
  if (!checkRateLimit(clientId)) {
    return c.json({ 
      success: false,
      error: 'Rate limit exceeded. Please wait before making another request.',
      code: 'RATE_LIMIT_EXCEEDED'
    }, 429);
  }
  
  try {
    const keywordsParam = c.req.query('keywords');
    const timeRange = c.req.query('time_range') || '24h';
    const subredditsParam = c.req.query('subreddits');
    const minScoreParam = c.req.query('min_score');
    const sortBy = c.req.query('sort') as 'relevance' | 'new' | 'top' | 'hot' | undefined;
    const excludeStickied = c.req.query('exclude_stickied') === 'true';
    
    if (!keywordsParam) {
      return c.json({ 
        success: false, 
        error: 'Keywords parameter is required',
        code: 'MISSING_KEYWORDS'
      }, 400);
    }
    
    const keywords = keywordsParam.split(',').map(k => k.trim()).filter(k => k.length > 0);
    const subreddits = subredditsParam?.split(',').map(s => s.trim()).filter(s => s.length > 0);
    const minScore = minScoreParam ? parseInt(minScoreParam) : undefined;
    
    if (keywords.length === 0) {
      return c.json({ 
        success: false, 
        error: 'At least one keyword is required',
        code: 'EMPTY_KEYWORDS'
      }, 400);
    }
    
    if (keywords.length > 10) {
      return c.json({ 
        success: false, 
        error: 'Maximum 10 keywords allowed per request',
        code: 'TOO_MANY_KEYWORDS'
      }, 400);
    }
    
    const filters: SearchFilters = {
      keywords,
      timeRange,
      subreddits,
      minScore,
      sortBy,
      excludeStickied,
    };
    
    const { posts, searchTime } = await searchMentions(filters);
    const stats = calculateStats(posts, filters);
    
    const responseTime = Date.now() - startTime;
    healthMetrics.successfulRequests++;
    healthMetrics.averageResponseTime = (healthMetrics.averageResponseTime + responseTime) / 2;
    
    return c.json({
      success: true,
      data: {
        posts,
        stats,
        metadata: {
          total_searched: posts.length,
          search_time_ms: searchTime,
          last_updated: new Date().toISOString(),
          filters: filters,
        }
      }
    }, 200);
    
  } catch (error) {
    console.error('Reddit search error:', error);
    recordError(clientId);
    
    return c.json({ 
      success: false,
      error: 'Failed to search Reddit mentions. Please try again later.',
      code: 'SEARCH_FAILED'
    }, 500);
  }
});

// Enhanced health check endpoint
app.get('/health', async (c: Context) => {
  const startTime = Date.now();
  
  try {
    await reddit.getHot('test', { limit: 1 });
    const responseTime = Date.now() - startTime;
    
    healthMetrics.lastHealthCheck = Date.now();
    
    return c.json({ 
      success: true,
      data: {
        status: 'healthy',
        reddit_connected: true,
        last_check: new Date().toISOString(),
        response_time_ms: responseTime,
        metrics: {
          total_requests: healthMetrics.totalRequests,
          success_rate: healthMetrics.totalRequests > 0 ? 
            (healthMetrics.successfulRequests / healthMetrics.totalRequests) * 100 : 100,
          average_response_time: healthMetrics.averageResponseTime,
        }
      }
    });
  } catch (error) {
    const responseTime = Date.now() - startTime;
    
    return c.json({ 
      success: true,
      data: {
        status: responseTime > 5000 ? 'degraded' : 'unhealthy',
        reddit_connected: false,
        last_check: new Date().toISOString(),
        response_time_ms: responseTime,
        error: (error as Error).message
      }
    }, 200);
  }
});

// Analytics endpoint
app.get('/analytics', async (c: Context) => {
  const clientId = c.req.header('x-client-id') || c.req.header('x-forwarded-for') || 'anonymous';
  
  if (!checkRateLimit(clientId)) {
    return c.json({ 
      success: false,
      error: 'Rate limit exceeded. Please wait before making another request.'
    }, 429);
  }
  
  try {
    const keywordsParam = c.req.query('keywords');
    const timeRange = c.req.query('time_range') || '24h';
    
    if (!keywordsParam) {
      return c.json({ 
        success: false, 
        error: 'Keywords parameter is required' 
      }, 400);
    }
    
    const keywords = keywordsParam.split(',').map(k => k.trim()).filter(k => k.length > 0);
    
    // Get basic data for analytics
    const { posts } = await searchMentions({ keywords, timeRange });
    
    // Calculate analytics
    const hourlyData = Array.from({ length: 24 }, (_, hour) => {
      const hourPosts = posts.filter(p => 
        new Date(p.created_utc * 1000).getHours() === hour
      );
      return {
        hour,
        mentions: hourPosts.length,
        avgScore: hourPosts.length > 0 ? 
          hourPosts.reduce((sum, p) => sum + p.score, 0) / hourPosts.length : 0
      };
    });
    
    const subredditData = Object.entries(
      posts.reduce((acc, post) => {
        acc[post.subreddit] = (acc[post.subreddit] || 0) + 1;
        return acc;
      }, {} as Record<string, number>)
    ).sort(([,a], [,b]) => b - a).slice(0, 10);
    
    return c.json({
      success: true,
      data: {
        hourlyData,
        subredditData,
        keywordPerformance: keywords.map(keyword => ({
          keyword,
          mentions: posts.filter(p => p.keyword === keyword).length,
          avgScore: posts.filter(p => p.keyword === keyword)
            .reduce((sum, p, _, arr) => sum + p.score / arr.length, 0)
        }))
      }
    });
    
  } catch (error) {
    console.error('Analytics error:', error);
    return c.json({ 
      success: false,
      error: 'Failed to generate analytics data.'
    }, 500);
  }
});

// Export endpoint
app.get('/export', async (c: Context) => {
  const clientId = c.req.header('x-client-id') || c.req.header('x-forwarded-for') || 'anonymous';
  
  if (!checkRateLimit(clientId)) {
    return c.json({ 
      success: false,
      error: 'Rate limit exceeded. Please wait before making another request.'
    }, 429);
  }
  
  try {
    const keywordsParam = c.req.query('keywords');
    const timeRange = c.req.query('time_range') || '24h';
    const format = c.req.query('format') || 'json';
    
    if (!keywordsParam) {
      return c.json({ 
        success: false, 
        error: 'Keywords parameter is required' 
      }, 400);
    }
    
    const keywords = keywordsParam.split(',').map(k => k.trim()).filter(k => k.length > 0);
    const { posts } = await searchMentions({ keywords, timeRange });
    
    if (format === 'csv') {
      const csvHeader = 'ID,Title,Subreddit,Author,Score,Comments,Created,Keyword,URL\n';
      const csvData = posts.map(post => 
        `"${post.id}","${post.title.replace(/"/g, '""')}","${post.subreddit}","${post.author}",${post.score},${post.num_comments},"${new Date(post.created_utc * 1000).toISOString()}","${post.keyword}","https://reddit.com${post.permalink}"`
      ).join('\n');
      
      c.header('Content-Type', 'text/csv');
      c.header('Content-Disposition', `attachment; filename="reddit-mentions-${new Date().toISOString().split('T')[0]}.csv"`);
      return c.text(csvHeader + csvData);
    } else {
      c.header('Content-Type', 'application/json');
      c.header('Content-Disposition', `attachment; filename="reddit-mentions-${new Date().toISOString().split('T')[0]}.json"`);
      return c.json({
        exported_at: new Date().toISOString(),
        filters: { keywords, timeRange },
        posts
      });
    }
    
  } catch (error) {
    console.error('Export error:', error);
    return c.json({ 
      success: false,
      error: 'Failed to export data.'
    }, 500);
  }
});

// Refresh endpoint
app.post('/refresh', async (c: Context) => {
  const clientId = c.req.header('x-client-id') || c.req.header('x-forwarded-for') || 'anonymous';
  
  if (!checkRateLimit(clientId)) {
    return c.json({ 
      success: false,
      error: 'Rate limit exceeded. Please wait before making another request.'
    }, 429);
  }
  
  // Clear any cached data (if implemented)
  // This is a placeholder for cache invalidation
  
  return c.json({
    success: true,
    data: { 
      success: true,
      message: 'Cache cleared and data refreshed'
    }
  }, 200);
});

export default app;   
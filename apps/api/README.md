# Analytics API

A powerful analytics API for tracking and analyzing website traffic.

## Features

- **Event Collection**: Track page views with rich metadata
- **Data Enrichment**: Automatically enhance events with IP geolocation, device details, and UTM parameters
- **Aggregated Statistics**: Get pre-computed metrics for faster dashboard loading
- **Authentication**: Secure access to analytics data
- **Website Ownership**: Users can only access analytics for websites they own

## API Endpoints

### Public Endpoints

#### Collect Events

```
POST /analytics/collect
```

Collects page view events from websites. Requires a valid tracking ID.

**Headers:**
- `X-Tracking-ID`: The tracking ID of the website (optional, can also be included in the request body)

**Request Body:**
```json
{
  "events": [
    {
      "eventId": "unique-event-id",
      "type": "page_view",
      "timestamp": "2023-06-15T14:22:31.123Z",
      "userId": "anonymous-user-id",
      "sessionId": "session-id",
      "websiteId": "website-id",
      "trackingId": "tracking-id",
      "device": {
        "type": "desktop",
        "os": "Windows",
        "browser": "Chrome",
        "screen": {
          "width": 1920,
          "height": 1080
        },
        "touchSupport": false
      },
      "context": {
        "page": "/products",
        "referrer": "https://google.com",
        "title": "Products | My Store",
        "language": "en-US"
      },
      "privacy": {
        "consentGiven": true,
        "doNotTrack": false
      }
    }
  ]
}
```

### Authenticated Endpoints

#### List User's Websites

```
GET /analytics/dashboard/websites
```

Retrieves all websites owned by the authenticated user.

#### Get Aggregated Website Statistics

```
GET /analytics/dashboard/websites/:websiteId/stats
```

Retrieves aggregated statistics for a specific website.

**Query Parameters:**
- `from`: (Optional) Start date in ISO format (YYYY-MM-DD) or timestamp
- `to`: (Optional) End date in ISO format (YYYY-MM-DD) or timestamp

**Response:**
```json
{
  "website": {
    "id": "website-id",
    "name": "My Website",
    "url": "https://example.com",
    "isActive": true
  },
  "stats": {
    "period": {
      "from": "2023-05-01",
      "to": "2023-05-31",
      "days": 31
    },
    "totals": {
      "pageviews": 12500,
      "uniqueVisitors": 3200,
      "sessions": 4800,
      "bounceRate": 0.42
    },
    "dailyStats": [
      {
        "date": "2023-05-01",
        "pageviews": 450,
        "uniqueVisitors": 120,
        "sessions": 180,
        "bounceRate": 0.38,
        "avgSessionDuration": 125,
        "topPages": ["/", "/products", "/about"],
        "topReferrers": ["google.com", "facebook.com", "direct"]
      },
      // More daily stats...
    ],
    "devices": {
      "desktop": 7500,
      "mobile": 4200,
      "tablet": 800,
      "other": 0
    },
    "browsers": {
      "chrome": 6800,
      "firefox": 2200,
      "safari": 2800,
      "edge": 500,
      "opera": 200,
      "other": 0
    },
    "countries": [
      {
        "country": "US",
        "visits": 5600
      },
      {
        "country": "UK",
        "visits": 1800
      },
      // More countries...
    ],
    "topPages": [
      "/",
      "/products",
      "/about",
      "/contact",
      "/blog"
    ],
    "topReferrers": [
      "google.com",
      "facebook.com",
      "direct",
      "twitter.com",
      "instagram.com"
    ]
  }
}
```

#### Get Raw Events (for debugging)

```
GET /analytics/dashboard/websites/:websiteId/events
```

Retrieves raw event data for a specific website. Limited to 1000 events maximum.

**Query Parameters:**
- `from`: (Optional) Start timestamp in milliseconds
- `to`: (Optional) End timestamp in milliseconds
- `limit`: (Optional) Maximum number of events to return (default: 100, max: 1000)

### Admin Endpoints

#### Initialize ClickHouse Tables

```
POST /admin/init-tables
```

Creates or updates the ClickHouse tables for analytics data.

## Data Aggregation

The system automatically aggregates data daily to provide:

1. **Daily Statistics**:
   - Pageviews, unique visitors, sessions
   - Bounce rate and session duration
   - Top pages and referrers

2. **Device Breakdowns**:
   - Device types (desktop, mobile, tablet)
   - Browsers and operating systems

3. **Geographic Distribution**:
   - Country statistics

## Authentication

The API uses better-auth for authentication with three levels of access:
- **Public**: Endpoints that don't require authentication (e.g., event collection)
- **User**: Endpoints that require user authentication
- **Admin**: Endpoints that require admin privileges

## Data Enrichment

The API automatically enriches events with:

1. **IP-based Geolocation**:
   - Country, region, city, and timezone
   - Respects privacy by using approximate locations

2. **Enhanced Device Information**:
   - Detailed OS and browser versions
   - Device vendor and model when available
   - Browser engine information

3. **UTM Parameter Tracking**:
   - Marketing campaign attribution
   - Source, medium, campaign, term, and content

4. **Query Parameter Extraction**:
   - All URL parameters for custom tracking

## Security Considerations

1. **Authentication**: All dashboard endpoints require authentication
2. **Website Ownership**: Users can only access analytics for websites they own
3. **Tracking ID Validation**: Events are validated against registered tracking IDs
4. **Privacy Compliance**: The system respects Do Not Track and requires consent flags

## Local Development

To run the API locally:

```bash
# Install dependencies
bun install

# Run in development mode
bun run dev
```

## Cloudflare Pages Development

To run with Cloudflare Pages locally:

```bash
# Install dependencies
bun install

# Run in Cloudflare Pages development mode
bun run dev:cf
```

## Deployment

To deploy to Cloudflare Pages:

```bash
# Build the application
bun run build

# Deploy to Cloudflare Pages
bun run deploy
```

## Environment Variables

The following environment variables need to be set in your Cloudflare Pages dashboard:

- `ENVIRONMENT`: Set to "production" for production deployments
- Add any other required environment variables for your specific setup

## Project Structure

- `src/index.ts`: Main application entry point
- `src/routes/`: API routes
- `src/consumers/`: Background services and consumers
- `public/`: Static assets (if any)
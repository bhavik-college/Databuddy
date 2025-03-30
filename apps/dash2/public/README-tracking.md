# Databuddy Tracking Script Documentation

The Databuddy tracking script allows you to collect analytics data from your website or application.

## Quick Start

Add the script to your website with a single line:

```html
<script 
  src="https://api.databuddy.cc/databuddy.js"
  data-client-id="YOUR_CLIENT_ID"
  data-api-url="https://api.databuddy.cc"
  data-track-screen-views="true"
></script>
```

## Configuration Options

The script can be configured using data attributes on the script tag:

| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| `data-client-id` | string | (required) | Your Databuddy client ID |
| `data-api-url` | string | https://api.databuddy.cc | API endpoint for tracking data |
| `data-track-screen-views` | boolean | true | Automatically track page views |
| `data-track-hash-changes` | boolean | false | Track hash changes in URLs as page views |
| `data-track-attributes` | boolean | false | Enable tracking via data attributes |
| `data-track-outgoing-links` | boolean | false | Track clicks on external links |
| `data-track-sessions` | boolean | false | Track user sessions |
| `data-track-performance` | boolean | false | Track page performance metrics |
| `data-track-web-vitals` | boolean | false | Track Core Web Vitals metrics |
| `data-track-engagement` | boolean | false | Track user engagement metrics |
| `data-track-scroll-depth` | boolean | false | Track how far users scroll |
| `data-track-exit-intent` | boolean | false | Track when users show exit intent |
| `data-track-interactions` | boolean | false | Track user interactions |
| `data-track-errors` | boolean | false | Track JavaScript errors |
| `data-track-bounce-rate` | boolean | false | Track bounce rate metrics |
| `data-sampling-rate` | number | 1.0 | Sampling rate (0.0-1.0) where 1.0 = 100% |
| `data-enable-retries` | boolean | true | Enable retrying failed tracking requests |
| `data-max-retries` | number | 3 | Maximum number of retry attempts |
| `data-initial-retry-delay` | number | 500 | Initial delay in ms before first retry |

## Next.js Integration

For Next.js applications, use the Script component:

```jsx
import Script from 'next/script';

export default function Layout({ children }) {
  return (
    <>
      <Script 
        src="https://api.databuddy.cc/databuddy.js"
        data-client-id="YOUR_CLIENT_ID"
        data-api-url="https://api.databuddy.cc"
        data-track-screen-views="true"
        data-sampling-rate="0.5"  // Track 50% of events
        strategy="afterInteractive"
      />
      {children}
    </>
  );
}
```

## Manual Events

Track custom events programmatically:

```javascript
// Track a custom event
window.db('trackCustomEvent', 'button_click', {
  button_id: 'signup',
  page: 'homepage'
});

// Set user properties
window.db('setGlobalProperties', {
  user_type: 'premium',
  theme: 'dark'
});
```

## Advanced Configuration

### Sampling Rate

Control the percentage of events that get tracked using the sampling rate:

```html
<!-- Track only 10% of events -->
<script 
  src="https://api.databuddy.cc/databuddy.js"
  data-client-id="YOUR_CLIENT_ID"
  data-sampling-rate="0.1"
></script>
```

This helps reduce data volume while still providing statistically significant analytics.

### Error Retries

Configure how the script handles network errors:

```html
<!-- Disable retries -->
<script 
  src="https://api.databuddy.cc/databuddy.js"
  data-client-id="YOUR_CLIENT_ID"
  data-enable-retries="false"
></script>

<!-- Configure retry behavior -->
<script 
  src="https://api.databuddy.cc/databuddy.js"
  data-client-id="YOUR_CLIENT_ID"
  data-max-retries="5"
  data-initial-retry-delay="1000"
></script>
```

The script uses exponential backoff with jitter to avoid overwhelming the server.

### Global Configuration Object

You can also set configuration via a global object before loading the script:

```html
<script>
  window.databuddyConfig = {
    clientId: 'YOUR_CLIENT_ID',
    apiUrl: 'https://api.databuddy.cc',
    trackScreenViews: true,
    samplingRate: 0.25, // Track 25% of events
    enableRetries: true,
    maxRetries: 3
  };
</script>
<script src="https://api.databuddy.cc/databuddy.js"></script>
```

## Delivery Methods

The script uses multiple methods to ensure reliable event delivery:

1. **Navigator.sendBeacon API** (default): Designed specifically for analytics, works even during page unload
2. **Fetch API with keepalive** (fallback): Used when sendBeacon is unavailable or fails

This approach maximizes the chance that your analytics data is delivered successfully. 
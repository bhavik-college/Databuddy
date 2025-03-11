# Databuddy Privacy-First Analytics

This directory contains the core types and utilities for Databuddy's privacy-first analytics system.

## Features

- **Privacy-focused**: Anonymizes IP addresses and minimizes personal data collection
- **Comprehensive tracking**: Page views, clicks, form submissions, scroll depth, and performance metrics
- **Declarative tracking**: Use data attributes for easy event tracking
- **User journey tracking**: Automatically tracks user paths through your site
- **Performance monitoring**: Captures key web vitals and performance metrics
- **Engagement metrics**: Measures active time, scroll depth, and bounce rates
- **Opt-out support**: Respects user privacy preferences and Do Not Track signals
- **Batching**: Efficiently sends events in batches to reduce network requests
- **Resilient**: Uses sendBeacon for exit events and includes retry logic

## Usage

### Adding the tracking script

Add the tracking script to your layout or page:

```tsx
import { TrackingScript } from '@/components/analytics/tracking-script';

export default function Layout({ children }) {
  return (
    <html lang="en">
      <body>
        {children}
        <TrackingScript trackingId="your-tracking-id" />
      </body>
    </html>
  );
}
```

### Client-side API

The tracking script exposes a global `databuddy` object with the following methods:

```js
// Track custom events
window.databuddy.trackEvent('button_click', { category: 'engagement' });

// Track page view manually (automatic by default)
window.databuddy.trackPageView('/custom-path', { title: 'Custom Page' });

// Track element clicks
window.databuddy.trackClick(document.getElementById('signup-button'), { category: 'conversion' });

// Track form submissions
window.databuddy.trackFormSubmit(
  document.getElementById('contact-form'), 
  true, // success
  null, // error type (if any)
  { formType: 'contact' }
);

// Set global properties for all events
window.databuddy.setGlobalProps({ plan: 'premium' });

// Opt out of tracking
window.databuddy.optOut();

// Opt in to tracking
window.databuddy.optIn();
```

### React Hook

For React components, use the `useAnalytics` hook:

```tsx
import { useAnalytics } from '@/lib/analytics/use-analytics';

function SignupButton() {
  const { trackEvent } = useAnalytics();
  
  const handleClick = () => {
    trackEvent('signup_click', { location: 'header' });
  };
  
  return <button onClick={handleClick}>Sign Up</button>;
}
```

### Declarative Tracking

You can use data attributes to track events without writing JavaScript:

```html
<button data-track="signup_click" data-plan="free" data-source="homepage">
  Sign Up
</button>
```

When clicked, this will automatically track an event named "signup_click" with properties `{ plan: "free", source: "homepage" }`.

### Queue Support

The script supports a queue for commands that might be called before the script is fully loaded:

```js
// Initialize the queue
window.databuddyq = window.databuddyq || [];

// Queue commands
window.databuddyq.push(['trackEvent', 'early_event', { before: 'load' }]);
```

## Data Types

The analytics system uses a comprehensive event schema that captures various aspects of user behavior while respecting privacy. Key event types include:

- **PageViewEvent**: Tracks page views with title and duration
- **ClickEvent**: Tracks element clicks with element selector and section
- **FormSubmitEvent**: Tracks form submissions with success/failure status
- **ScrollEvent**: Tracks scroll depth and direction
- **CustomEvent**: For any custom events you want to track

See `types.ts` for the full TypeScript interfaces defining the data structure for analytics events.

## Privacy Considerations

- IP addresses are anonymized (last octet removed)
- User IDs are randomly generated and not tied to personal information
- Session IDs are randomly generated and stored in sessionStorage
- Respects Do Not Track browser settings
- Users can opt out at any time
- No cookies are used for tracking (sessionStorage only)
- No personal identifiable information is collected by default

## Debugging

To enable debug mode, add the `debug` parameter to the tracking script:

```tsx
<TrackingScript trackingId="your-tracking-id" debug={true} />
```

This will log errors and other information to the console. 
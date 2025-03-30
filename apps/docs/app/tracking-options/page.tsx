import React from 'react';
import Link from 'next/link';
import styles from '../page.module.css';

export default function TrackingOptionsPage() {
  return (
    <div className={styles.page}>
      <main className={styles.main}>
        <h1>Tracking Configuration Options</h1>
        
        <p>Databuddy.js can be configured with various options to control which tracking features are enabled. This allows you to customize the tracking experience to match your website's needs and your users' privacy requirements.</p>
        
        <h2>Basic Usage</h2>
        
        <p>When initializing the databuddy tracker, you can pass configuration options:</p>
        
        <pre><code>{`const databuddy = new Databuddy({
  clientId: 'your-client-id',
  
  // Disable certain tracking features
  trackWebVitals: false,
  trackExitIntent: false
});`}</code></pre>
        
        <h2>Available Options</h2>
        
        <h3>Core Options</h3>
        
        <table>
          <thead>
            <tr>
              <th>Option</th>
              <th>Type</th>
              <th>Default</th>
              <th>Description</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td><code>disabled</code></td>
              <td>boolean</td>
              <td><code>false</code></td>
              <td>Completely disable all tracking</td>
            </tr>
            <tr>
              <td><code>waitForProfile</code></td>
              <td>boolean</td>
              <td><code>true</code></td>
              <td>Wait for profile identification before sending events</td>
            </tr>
            <tr>
              <td><code>sampleRate</code></td>
              <td>number</td>
              <td><code>1.0</code></td>
              <td>Sample events (1.0 = 100%, 0.5 = 50% of events)</td>
            </tr>
          </tbody>
        </table>
        
        <h3>Feature Toggles</h3>
        
        <table>
          <thead>
            <tr>
              <th>Option</th>
              <th>Type</th>
              <th>Default</th>
              <th>Description</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td><code>trackScreenViews</code></td>
              <td>boolean</td>
              <td><code>true</code></td>
              <td>Track page views automatically</td>
            </tr>
            <tr>
              <td><code>trackHashChanges</code></td>
              <td>boolean</td>
              <td><code>false</code></td>
              <td>Track hash changes as page views (for SPAs)</td>
            </tr>
            <tr>
              <td><code>trackAttributes</code></td>
              <td>boolean</td>
              <td><code>true</code></td>
              <td>Track data attributes for clicks (data-track-*)</td>
            </tr>
            <tr>
              <td><code>trackOutgoingLinks</code></td>
              <td>boolean</td>
              <td><code>true</code></td>
              <td>Track clicks on outbound links</td>
            </tr>
          </tbody>
        </table>
        
        <h3>Enhanced Tracking Features</h3>
        
        <table>
          <thead>
            <tr>
              <th>Option</th>
              <th>Type</th>
              <th>Default</th>
              <th>Description</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td><code>trackSessions</code></td>
              <td>boolean</td>
              <td><code>true</code></td>
              <td>Track user sessions and session metrics</td>
            </tr>
            <tr>
              <td><code>trackPerformance</code></td>
              <td>boolean</td>
              <td><code>true</code></td>
              <td>Track performance metrics (load time, TTFB, etc.)</td>
            </tr>
            <tr>
              <td><code>trackWebVitals</code></td>
              <td>boolean</td>
              <td><code>true</code></td>
              <td>Track Web Vitals (FCP, LCP, CLS)</td>
            </tr>
            <tr>
              <td><code>trackEngagement</code></td>
              <td>boolean</td>
              <td><code>true</code></td>
              <td>Track user engagement (master toggle)</td>
            </tr>
            <tr>
              <td><code>trackScrollDepth</code></td>
              <td>boolean</td>
              <td><code>true</code></td>
              <td>Track how far users scroll on each page</td>
            </tr>
            <tr>
              <td><code>trackExitIntent</code></td>
              <td>boolean</td>
              <td><code>true</code></td>
              <td>Track when users show exit intent</td>
            </tr>
            <tr>
              <td><code>trackInteractions</code></td>
              <td>boolean</td>
              <td><code>true</code></td>
              <td>Track user interactions (clicks, etc.)</td>
            </tr>
            <tr>
              <td><code>trackErrors</code></td>
              <td>boolean</td>
              <td><code>false</code></td>
              <td>Track JavaScript errors</td>
            </tr>
          </tbody>
        </table>
        
        <h2>Example: Minimal Configuration</h2>
        
        <p>If you want to collect only basic analytics with minimal impact:</p>
        
        <pre><code>{`const databuddy = new Databuddy({
  clientId: 'your-client-id',
  
  // Minimal tracking
  trackPerformance: false,
  trackWebVitals: false,
  trackEngagement: false,
  trackScrollDepth: false,
  trackExitIntent: false,
  trackInteractions: false
});`}</code></pre>
        
        <h2>Example: Performance-focused Configuration</h2>
        
        <p>If you're primarily interested in performance metrics:</p>
        
        <pre><code>{`const databuddy = new Databuddy({
  clientId: 'your-client-id',
  
  // Focus only on performance
  trackPerformance: true,
  trackWebVitals: true,
  
  // Disable engagement tracking
  trackEngagement: false,
  trackScrollDepth: false,
  trackExitIntent: false,
  trackInteractions: false
});`}</code></pre>
        
        <h2>Example: GDPR-compliant Configuration</h2>
        
        <p>For a more privacy-friendly configuration:</p>
        
        <pre><code>{`const databuddy = new Databuddy({
  clientId: 'your-client-id',
  
  // Anonymize users
  anonymizeIp: true,
  
  // Reduce data collection
  trackPerformance: true,
  trackWebVitals: false,
  trackEngagement: false,
  trackScrollDepth: false,
  trackExitIntent: false,
  trackInteractions: false,
  
  // Sample only 10% of events for minimal impact
  sampleRate: 0.1
});`}</code></pre>
        
        <h2>Dynamically Enabling/Disabling Tracking</h2>
        
        <p>You can also dynamically enable or disable tracking based on user consent:</p>
        
        <pre><code>{`// Initialize with tracking disabled
const databuddy = new Databuddy({
  clientId: 'your-client-id',
  disabled: true
});

// Enable tracking when user gives consent
function onUserConsent() {
  databuddy.options.disabled = false;
}

// Disable tracking when user revokes consent
function onUserRevokeConsent() {
  databuddy.options.disabled = true;
}`}</code></pre>
        
        <Link href="/" className={styles.secondary}>
          Back to Home
        </Link>
      </main>
    </div>
  );
} 
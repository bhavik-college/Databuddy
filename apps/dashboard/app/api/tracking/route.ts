import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const trackingId = url.searchParams.get("id");

  if (!trackingId) {
    return new NextResponse("Tracking ID is required", { status: 400 });
  }

  // Generate the tracking script with the tracking ID embedded
  const script = `
    // Databuddy Privacy-First Analytics Tracker v2.2
    (function(w, d) {
      "use strict";
      
      // Core HTTP client for reliable API communication
      class ApiClient {
        constructor(endpoint, trackingId) {
          this.endpoint = endpoint;
          this.trackingId = trackingId;
          this.maxRetries = 3;
          this.initialRetryDelay = 500;
        }
        
        async post(data, retryCount = 0) {
          try {
            // Use sendBeacon for exit events when possible
            if (data.metadata?.unload && navigator.sendBeacon) {
              const blob = new Blob([JSON.stringify(data)], { type: 'application/json' });
              const sent = navigator.sendBeacon(this.endpoint, blob);
              return sent ? { success: true } : null;
            }
            
            // Otherwise use fetch with keepalive
            const response = await fetch(this.endpoint, {
              method: 'POST',
              headers: { 
                'Content-Type': 'application/json',
                'X-Tracking-ID': this.trackingId
              },
              body: JSON.stringify(data),
              keepalive: true
            });
            
            if (!response.ok) {
              throw new Error(\`HTTP error! status: \${response.status}\`);
            }
            
            const text = await response.text();
            return text ? JSON.parse(text) : { success: true };
          } catch (error) {
            // Implement exponential backoff for retries
            if (retryCount < this.maxRetries) {
              const delay = this.initialRetryDelay * Math.pow(2, retryCount);
              await new Promise(resolve => setTimeout(resolve, delay));
              return this.post(data, retryCount + 1);
            }
            
            // Only log errors in debug mode
            if (w.location.search.includes('debug=true')) {
              console.error('[Databuddy] Request failed after retries:', error);
            }
            return null;
          }
        }
      }
      
      // Main analytics tracker
      class PrivacyAnalytics {
        constructor(trackingId) {
          this.trackingId = trackingId;
          this.endpoint = 'https://api.databuddy.cc/analytics/collect';
          this.queue = [];
          this.queueTimer = null;
          this.initialized = false;
          this.userId = this.getUserId();
          this.sessionId = this.getSessionId();
          this.client = new ApiClient(this.endpoint, trackingId);
          this.options = {
            batchSize: 25,
            batchTimeout: 5000,
            trackScreenViews: true,
            trackOutboundLinks: true,
            trackAttributes: true,
            trackHashChanges: false,
            trackScrollDepth: true,
            trackPerformance: true
          };
          
          // Store last path to avoid duplicate page views
          this.lastPath = '';
          
          // Global properties to include with all events
          this.globalProps = {};
          
          // User journey tracking
          this.userJourney = {
            entryPage: w.location.pathname,
            steps: [w.location.pathname]
          };
          
          // Performance metrics
          this.performanceMetrics = {};
          
          // Interaction tracking
          this.interactionStartTime = Date.now();
          this.hasInteracted = false;
          this.activeTime = 0;
          this.lastActiveTime = Date.now();
        }
        
        // Generate or retrieve a user ID
        getUserId() {
          // Use localStorage for user ID with fallback to session-only
          let id = null;
          
          try {
            id = localStorage.getItem('db_uid');
          } catch (e) {
            // localStorage might be disabled
          }
          
          if (!id) {
            // Generate a random ID that's not tied to the user
            id = 'anon_' + Math.random().toString(36).substring(2, 15) + 
                 Math.random().toString(36).substring(2, 15);
            
            try {
              localStorage.setItem('db_uid', id);
            } catch (e) {
              // localStorage might be disabled, use session only
              w.sessionStorage.setItem('db_uid', id);
            }
          }
          
          return id;
        }
        
        // Generate or retrieve a session ID
        getSessionId() {
          // Use sessionStorage for session tracking - more private than localStorage
          let id = w.sessionStorage.getItem('db_sid');
          if (!id) {
            // Generate a random ID that's not tied to the user
            id = 'sess_' + Math.random().toString(36).substring(2, 15) + 
                 Math.random().toString(36).substring(2, 15);
            w.sessionStorage.setItem('db_sid', id);
          }
          return id;
        }
        
        // Generate a unique event ID
        generateEventId() {
          return 'evt_' + Math.random().toString(36).substring(2, 15) + 
                 Date.now().toString(36);
        }
        
        // Detect browser
        detectBrowser() {
          const ua = navigator.userAgent;
          if (ua.includes('Chrome') && !ua.includes('Edg')) return 'Chrome';
          if (ua.includes('Firefox')) return 'Firefox';
          if (ua.includes('Safari') && !ua.includes('Chrome')) return 'Safari';
          if (ua.includes('Edg')) return 'Edge';
          if (ua.includes('OPR') || ua.includes('Opera')) return 'Opera';
          return 'Other';
        }
        
        // Detect OS
        detectOS() {
          const ua = navigator.userAgent;
          if (ua.includes('Windows')) return 'Windows';
          if (ua.includes('Mac OS')) return 'macOS';
          if (ua.includes('Linux')) return 'Linux';
          if (ua.includes('Android')) return 'Android';
          if (ua.includes('iOS') || ua.includes('iPhone') || ua.includes('iPad')) return 'iOS';
          return 'Other';
        }
        
        // Detect device type based on viewport
        getDeviceType() {
          const width = w.innerWidth;
          return width < 768 ? 'mobile' : width < 1024 ? 'tablet' : 'desktop';
        }
        
        // Get network information
        getNetworkInfo() {
          const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
          
          if (!connection) return null;
          
          return {
            effectiveType: connection.effectiveType || 'wifi',
            rtt: connection.rtt,
            downlink: connection.downlink
          };
        }
        
        // Get performance metrics
        getPerformanceMetrics() {
          if (!w.performance) return null;
          
          const metrics = {};
          
          // Navigation timing
          const navTiming = w.performance.timing || {};
          if (navTiming.navigationStart) {
            metrics.ttfb = navTiming.responseStart - navTiming.navigationStart;
            metrics.domLoad = navTiming.domContentLoadedEventEnd - navTiming.navigationStart;
            metrics.pageLoad = navTiming.loadEventEnd - navTiming.navigationStart;
          }
          
          // Performance entries
          if (w.performance.getEntriesByType) {
            const navEntries = w.performance.getEntriesByType('navigation');
            if (navEntries && navEntries.length > 0) {
              const nav = navEntries[0];
              metrics.ttfb = nav.responseStart;
              metrics.domLoad = nav.domContentLoadedEventEnd;
              metrics.pageLoad = nav.loadEventEnd;
            }
          }
          
          return metrics;
        }
        
        // Get basic metrics for all events
        getBaseEventData() {
          // Get device info
          const deviceType = this.getDeviceType();
          const browser = this.detectBrowser();
          const os = this.detectOS();
          
          // Check for Do Not Track
          const doNotTrack = navigator.doNotTrack === '1' || 
                            w.doNotTrack === '1' || 
                            navigator.doNotTrack === 'yes';
          
          // Get timezone
          const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
          
          return {
            eventId: this.generateEventId(),
            timestamp: new Date().toISOString(),
            userId: this.userId,
            sessionId: this.sessionId,
            device: {
              type: deviceType,
              os: os,
              browser: browser,
              screen: {
                width: w.screen.width,
                height: w.screen.height
              },
              touchSupport: 'ontouchstart' in w
            },
            location: {
              timezone: timezone
            },
            network: this.getNetworkInfo(),
            context: {
              page: w.location.pathname + w.location.search,
              referrer: d.referrer || null,
              language: navigator.language
            },
            privacy: {
              consentGiven: !this.hasOptedOut(),
              doNotTrack: doNotTrack
            },
            userJourney: {
              entryPage: this.userJourney.entryPage,
              steps: [...this.userJourney.steps]
            }
          };
        }
        
        // Add event to queue
        queueEvent(event) {
          // Skip if user has opted out
          if (this.hasOptedOut()) return;
          
          // Add to queue
          this.queue.push(event);
          
          // Process queue if it's getting full
          if (this.queue.length >= this.options.batchSize) {
            this.processQueue();
          } else if (!this.queueTimer) {
            // Set timer to process queue after delay
            this.queueTimer = setTimeout(() => this.processQueue(), this.options.batchTimeout);
          }
        }
        
        // Process the event queue
        async processQueue() {
          // Clear the timer
          if (this.queueTimer) {
            clearTimeout(this.queueTimer);
            this.queueTimer = null;
          }
          
          // Skip if queue is empty
          if (!this.queue.length) return;
          
          // Take batch from queue
          const batch = this.queue.splice(0, this.options.batchSize);
          
          // Prepare payload
          const payload = {
            trackingId: this.trackingId,
            events: batch,
            metadata: {
              clientTimestamp: new Date().toISOString(),
              clientTimezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
              batchId: 'batch_' + Math.random().toString(36).substring(2, 15),
              version: '2.2'
            }
          };
          
          // Send to server
          await this.client.post(payload);
          
          // Process remaining queue items if any
          if (this.queue.length > 0) {
            setTimeout(() => this.processQueue(), 100);
          }
        }
        
        // Track page view
        trackPageView(path, props = {}) {
          const currentPath = path || w.location.pathname + w.location.search;
          
          // Skip if same as last path (avoid duplicates)
          if (this.lastPath === currentPath) return;
          
          // Update last path
          this.lastPath = currentPath;
          
          // Add to user journey
          if (!this.userJourney.steps.includes(currentPath)) {
            this.userJourney.steps.push(currentPath);
          }
          
          // Reset performance metrics for new page
          this.performanceMetrics = this.getPerformanceMetrics();
          
          // Create page view event
          const event = {
            ...this.getBaseEventData(),
            type: 'page_view',
            context: {
              ...this.getBaseEventData().context,
              title: d.title,
              ...props
            },
            performance: this.performanceMetrics
          };
          
          // Queue event
          this.queueEvent(event);
        }
        
        // Track click event
        trackClick(element, props = {}) {
          // Get element details
          const elementTag = element.tagName.toLowerCase();
          const elementId = element.id ? '#' + element.id : '';
          const elementClasses = Array.from(element.classList).map(c => '.' + c).join('');
          const elementSelector = elementTag + elementId + elementClasses;
          
          // Get section if available
          let section = '';
          let parent = element.parentElement;
          while (parent && !section) {
            if (parent.dataset && parent.dataset.section) {
              section = parent.dataset.section;
            }
            parent = parent.parentElement;
          }
          
          // Create click event
          const event = {
            ...this.getBaseEventData(),
            type: 'click',
            context: {
              ...this.getBaseEventData().context,
              element: elementSelector,
              section: section || undefined
            },
            ...props
          };
          
          // Queue event
          this.queueEvent(event);
        }
        
        // Track custom event
        trackEvent(name, props = {}) {
          // Create custom event
          const event = {
            ...this.getBaseEventData(),
            type: 'custom',
            context: {
              ...this.getBaseEventData().context,
              name: name,
              category: props.category,
              ...props
            },
            attributes: props
          };
          
          // Queue event
          this.queueEvent(event);
        }
        
        // Track form submission
        trackFormSubmit(formElement, success, errorType = null, props = {}) {
          // Get form details
          const formId = formElement.id || 'unknown_form';
          
          // Create form submit event
          const event = {
            ...this.getBaseEventData(),
            type: 'form_submit',
            context: {
              ...this.getBaseEventData().context,
              formId: formId,
              success: success,
              errorType: errorType,
              ...props
            }
          };
          
          // Queue event
          this.queueEvent(event);
        }
        
        // Track scroll depth
        trackScrollDepth(depth, direction) {
          // Create scroll event
          const event = {
            ...this.getBaseEventData(),
            type: 'scroll',
            context: {
              ...this.getBaseEventData().context,
              scrollDepth: depth,
              direction: direction
            }
          };
          
          // Queue event
          this.queueEvent(event);
        }
        
        // Set global properties for all events
        setGlobalProps(props) {
          this.globalProps = {
            ...this.globalProps,
            ...props
          };
        }
        
        // Check if user has opted out
        hasOptedOut() {
          return localStorage.getItem('databuddy_opt_out') === 'true';
        }
        
        // Opt out of tracking
        optOut() {
          localStorage.setItem('databuddy_opt_out', 'true');
          this.queue = [];
        }
        
        // Opt in to tracking
        optIn() {
          localStorage.removeItem('databuddy_opt_out');
          this.trackPageView();
        }
        
        // Track outbound links
        trackOutboundLinks() {
          d.addEventListener('click', (e) => {
            // Find closest link element
            const link = e.target.closest('a');
            if (!link) return;
            
            const href = link.getAttribute('href');
            if (!href || !href.startsWith('http')) return;
            
            // Check if external link
            const isExternal = !href.startsWith(w.location.origin);
            if (!isExternal) return;
            
            // Track outbound link click
            this.trackClick(link, {
              attributes: {
                url: href,
                text: link.innerText || link.getAttribute('title') || ''
              }
            });
          });
        }
        
        // Track data attributes
        trackAttributes() {
          d.addEventListener('click', (e) => {
            // Find element with data-track attribute
            let el = e.target;
            while (el && el !== d) {
              if (el.hasAttribute('data-track')) break;
              el = el.parentElement;
            }
            
            if (!el || !el.hasAttribute('data-track')) return;
            
            // Get event name from data-track
            const eventName = el.getAttribute('data-track');
            if (!eventName) return;
            
            // Collect all data-* attributes as properties
            const props = {};
            for (const attr of el.attributes) {
              if (attr.name.startsWith('data-') && attr.name !== 'data-track') {
                // Convert data-attr-name to attrName
                const key = attr.name.slice(5).replace(/-([a-z])/g, (_, letter) => letter.toUpperCase());
                props[key] = attr.value;
              }
            }
            
            // Track event
            this.trackEvent(eventName, props);
          });
        }
        
        // Track scroll depth
        trackScrollDepth() {
          let lastScrollDepth = 0;
          let scrollDirection = 'down';
          let scrollTimer = null;
          
          const calculateScrollDepth = () => {
            const scrollTop = w.pageYOffset || d.documentElement.scrollTop;
            const documentHeight = Math.max(
              d.body.scrollHeight, 
              d.body.offsetHeight, 
              d.documentElement.clientHeight, 
              d.documentElement.scrollHeight, 
              d.documentElement.offsetHeight
            );
            const windowHeight = w.innerHeight;
            const scrollPercent = Math.floor((scrollTop / (documentHeight - windowHeight)) * 100);
            return Math.min(100, Math.max(0, scrollPercent));
          };
          
          const handleScroll = () => {
            const currentScrollDepth = calculateScrollDepth();
            const newDirection = currentScrollDepth > lastScrollDepth ? 'down' : 'up';
            
            // Only track if direction changed or significant change in depth
            if (newDirection !== scrollDirection || Math.abs(currentScrollDepth - lastScrollDepth) >= 25) {
              scrollDirection = newDirection;
              
              // Debounce scroll tracking
              clearTimeout(scrollTimer);
              scrollTimer = setTimeout(() => {
                this.trackScrollDepth(currentScrollDepth, scrollDirection);
                lastScrollDepth = currentScrollDepth;
              }, 500);
            }
          };
          
          w.addEventListener('scroll', handleScroll, { passive: true });
        }
        
        // Track performance metrics
        trackPerformance() {
          if (!w.performance) return;
          
          // Wait for load event to get accurate metrics
          w.addEventListener('load', () => {
            setTimeout(() => {
              this.performanceMetrics = this.getPerformanceMetrics();
              
              // Update the last page view event with performance data if possible
              const lastPageViewIndex = this.queue.findIndex(event => event.type === 'page_view');
              if (lastPageViewIndex >= 0) {
                this.queue[lastPageViewIndex].performance = this.performanceMetrics;
              }
            }, 0);
          });
        }
        
        // Track user interactions
        trackInteractions() {
          const interactionEvents = ['mousedown', 'keydown', 'scroll', 'touchstart'];
          
          const handleInteraction = () => {
            if (!this.hasInteracted) {
              this.hasInteracted = true;
            }
            
            const now = Date.now();
            this.activeTime += now - this.lastActiveTime;
            this.lastActiveTime = now;
          };
          
          // Add event listeners for user interactions
          interactionEvents.forEach(eventType => {
            d.addEventListener(eventType, handleInteraction, { passive: true });
          });
          
          // Track idle time
          setInterval(() => {
            const now = Date.now();
            // If user has been active in the last 30 seconds, update active time
            if (now - this.lastActiveTime < 30000) {
              this.activeTime += now - this.lastActiveTime;
              this.lastActiveTime = now;
            }
          }, 30000);
        }
        
        // Track screen views (page navigation)
        trackScreenViews() {
          // Track initial page view
          this.trackPageView();
          
          // Override history methods to track navigation
          const originalPushState = history.pushState;
          history.pushState = function() {
            const result = originalPushState.apply(this, arguments);
            w.dispatchEvent(new Event('locationchange'));
            return result;
          };
          
          const originalReplaceState = history.replaceState;
          history.replaceState = function() {
            const result = originalReplaceState.apply(this, arguments);
            w.dispatchEvent(new Event('locationchange'));
            return result;
          };
          
          // Listen for navigation events
          w.addEventListener('popstate', () => {
            w.dispatchEvent(new Event('locationchange'));
          });
          
          // Debounce function for location changes
          let locationTimer;
          const handleLocationChange = () => {
            clearTimeout(locationTimer);
            locationTimer = setTimeout(() => this.trackPageView(), 50);
          };
          
          // Listen for location changes
          w.addEventListener('locationchange', handleLocationChange);
          
          // Track hash changes if enabled
          if (this.options.trackHashChanges) {
            w.addEventListener('hashchange', handleLocationChange);
          }
        }
        
        // Initialize tracking
        init() {
          if (this.initialized) return;
          this.initialized = true;
          
          // Skip if opted out
          if (this.hasOptedOut()) return;
          
          // Set initial referrer as global property
          this.setGlobalProps({
            initialReferrer: d.referrer || null
          });
          
          // Setup automatic tracking
          if (this.options.trackScreenViews) {
            this.trackScreenViews();
          }
          
          if (this.options.trackOutboundLinks) {
            this.trackOutboundLinks();
          }
          
          if (this.options.trackAttributes) {
            this.trackAttributes();
          }
          
          if (this.options.trackScrollDepth) {
            this.trackScrollDepth();
          }
          
          if (this.options.trackPerformance) {
            this.trackPerformance();
          }
          
          // Track user interactions
          this.trackInteractions();
          
          // Process queue on visibility change
          d.addEventListener('visibilitychange', () => {
            if (d.visibilityState === 'hidden' && this.queue.length) {
              // Update engagement metrics before sending
              const timeOnPage = Math.floor((Date.now() - this.interactionStartTime) / 1000);
              
              // Add engagement data to queued events
              this.queue.forEach(event => {
                event.engagement = {
                  ...event.engagement,
                  timeOnPage: timeOnPage,
                  activeTime: Math.floor(this.activeTime / 1000),
                  bounceRate: !this.hasInteracted
                };
              });
              
              this.processQueue();
            }
          });
          
          // Send remaining events on page unload
          w.addEventListener('unload', () => {
            if (!this.queue.length) return;
            
            // Update engagement metrics before sending
            const timeOnPage = Math.floor((Date.now() - this.interactionStartTime) / 1000);
            
            // Add engagement data to queued events
            this.queue.forEach(event => {
              event.engagement = {
                ...event.engagement,
                timeOnPage: timeOnPage,
                activeTime: Math.floor(this.activeTime / 1000),
                bounceRate: !this.hasInteracted
              };
            });
            
            const payload = {
              trackingId: this.trackingId,
              events: this.queue,
              metadata: {
                clientTimestamp: new Date().toISOString(),
                clientTimezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
                batchId: 'batch_' + Math.random().toString(36).substring(2, 15),
                version: '2.2',
                unload: true
              }
            };
            
            // Use sendBeacon for reliability during unload
            if (navigator.sendBeacon) {
              navigator.sendBeacon(this.endpoint, JSON.stringify(payload));
            }
          });
        }
      }
      
      // Initialize analytics
      const analytics = new PrivacyAnalytics("${trackingId}");
      
      // Initialize when DOM is ready
      if (d.readyState === 'loading') {
        d.addEventListener('DOMContentLoaded', () => analytics.init());
      } else {
        analytics.init();
      }
      
      // Expose public API
      w.databuddy = {
        trackEvent: (name, props) => analytics.trackEvent(name, props),
        trackPageView: (path, props) => analytics.trackPageView(path, props),
        trackClick: (element, props) => analytics.trackClick(element, props),
        trackFormSubmit: (form, success, errorType, props) => analytics.trackFormSubmit(form, success, errorType, props),
        trackPurchase: (productId, price, currency, props) => {
          analytics.queueEvent({
            ...analytics.getBaseEventData(),
            type: 'purchase',
            context: {
              ...analytics.getBaseEventData().context,
              productId,
              price,
              currency,
              ...props
            }
          });
        },
        setGlobalProps: (props) => analytics.setGlobalProps(props),
        optOut: () => analytics.optOut(),
        optIn: () => analytics.optIn()
      };
      
      // Support for queued commands before script loaded
      if (Array.isArray(w.databuddyq)) {
        w.databuddyq.forEach(cmd => {
          if (Array.isArray(cmd) && cmd.length > 0 && typeof w.databuddy[cmd[0]] === 'function') {
            w.databuddy[cmd[0]](...cmd.slice(1));
          }
        });
      }
      
      // Replace queue with direct function
      w.databuddyq = {
        push: (cmd) => {
          if (Array.isArray(cmd) && cmd.length > 0 && typeof w.databuddy[cmd[0]] === 'function') {
            w.databuddy[cmd[0]](...cmd.slice(1));
          }
        }
      };
    })(window, document);
  `;

  return new NextResponse(script, {
    headers: {
      "Content-Type": "application/javascript",
      "Cache-Control": "public, max-age=3600",
      "X-Frame-Options": "DENY",
    },
  });
} 
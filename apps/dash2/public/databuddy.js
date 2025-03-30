"use strict";
( () => {
    // HTTP Client
    var c = class {
        constructor(config) {
            this.baseUrl = config.baseUrl;
            this.headers = {
                "Content-Type": "application/json",
                ...config.defaultHeaders
            };
            this.maxRetries = config.maxRetries ?? 3;
            this.initialRetryDelay = config.initialRetryDelay ?? 500;
        }

        async resolveHeaders() {
            // More efficient header resolution with Promise.all
            const headerEntries = Object.entries(this.headers);
            const resolvedEntries = await Promise.all(
                headerEntries.map(async ([key, value]) => {
                    const resolvedValue = await value;
                    return resolvedValue !== null ? [key, resolvedValue] : null;
                })
            );
            return Object.fromEntries(resolvedEntries.filter(Boolean));
        }

        addHeader(key, value) {
            this.headers[key] = value;
        }

        async post(url, data, options = {}, retryCount = 0) {
            try {
                // Ensure keepalive is set consistently
                const fetchOptions = {
                    method: "POST",
                    headers: await this.resolveHeaders(),
                    body: JSON.stringify(data ?? {}),
                    keepalive: true, // Always use keepalive for better reliability
                    ...options
                };
                
                const response = await fetch(url, fetchOptions);

                if (response.status === 401) {
                    return null;
                }

                if (response.status !== 200 && response.status !== 202) {
                    throw new Error(`HTTP error! status: ${response.status} for URL: ${url}`);
                }

                // Try to parse JSON directly if possible
                try {
                    return await response.json();
                } catch (e) {
                    // Fallback to text parsing for non-JSON responses
                    const text = await response.text();
                    return text ? JSON.parse(text) : null;
                }
            } catch (error) {
                const isRetryableError = error.message.includes('HTTP error') || 
                    error.name === 'TypeError' || 
                    error.name === 'NetworkError';
                
                // Only retry if enabled and it's a retryable error
                if (retryCount < this.maxRetries && isRetryableError) {
                    // Add jitter to retry delay to prevent thundering herd
                    const jitter = Math.random() * 0.3 + 0.85; // 0.85-1.15 randomization factor
                    const delay = this.initialRetryDelay * Math.pow(2, retryCount) * jitter;
                    
                    console.debug(`Databuddy: Retrying request (${retryCount+1}/${this.maxRetries}) in ${Math.round(delay)}ms`);
                    await new Promise(resolve => setTimeout(resolve, delay));
                    return this.post(url, data, options, retryCount + 1);
                }
                
                console.error(`Databuddy: ${this.maxRetries > 0 ? `Max retries (${this.maxRetries}) reached for` : `Error with no retries for`} ${url}:`, error);
                return null;
            }
        }

        async fetch(endpoint, data, options = {}) {
            const url = `${this.baseUrl}${endpoint}`;
            return this.post(url, data, options, 0);
        }
    };

    // Base Tracker
    var l = class {
        constructor(options) {
            this.options = {
                disabled: false,
                waitForProfile: false,
                
                trackScreenViews: true,
                trackHashChanges: false,
                trackAttributes: false,
                trackOutgoingLinks: false,
                
                trackSessions: false,
                trackPerformance: false,
                trackWebVitals: false,
                trackEngagement: false,
                trackScrollDepth: false,
                trackExitIntent: false,
                trackInteractions: false,
                trackErrors: false,
                trackBounceRate: false,

                // Sampling and retry configuration
                samplingRate: 1.0, // Default to 100% sampling (1.0 = 100%, 0.1 = 10%)
                enableRetries: true, // Whether to retry failed requests
                maxRetries: 3, // Max retry attempts for failed requests
                initialRetryDelay: 500, // Initial delay before first retry (ms)
                
                ...options
            };
            
            this.queue = [];
            const headers = {
                "databuddy-client-id": this.options.clientId
            };
            
            if (this.options.clientSecret) {
                headers["databuddy-client-secret"] = this.options.clientSecret;
            }
            
            headers["databuddy-sdk-name"] = this.options.sdk || "web";
            // Use directly provided version or fallback to safe default
            headers["databuddy-sdk-version"] = this.options.sdkVersion || "1.0.0";
            
            this.api = new c({
                baseUrl: this.options.apiUrl || "https://api.databuddy.cc",
                defaultHeaders: headers,
                // Pass retry config to HTTP client
                maxRetries: this.options.enableRetries ? (this.options.maxRetries || 3) : 0,
                initialRetryDelay: this.options.initialRetryDelay || 500
            });
            
            this.lastPath = "";
            this.pageCount = 0;
            this.isInternalNavigation = false;
            
            this.anonymousId = this.getOrCreateAnonymousId();
            this.sessionId = this.getOrCreateSessionId();
            this.sessionStartTime = this.getSessionStartTime();
            this.lastActivityTime = Date.now();
            
            // Initialize tracking metrics to avoid undefined values
            this.maxScrollDepth = 0;
            this.interactionCount = 0;
            this.hasExitIntent = false;
            this.pageStartTime = Date.now();
            this.pageEngagementStart = Date.now(); // Ensure this is initialized
            this.utmParams = this.getUtmParams();

            // Always set up exit tracking for page_exit events
            if (typeof window !== 'undefined') {
                this.setupExitTracking();
            }
        }

        getOrCreateAnonymousId() {
            if (typeof window !== 'undefined' && window.localStorage) {
                const storedId = localStorage.getItem('did');
                if (storedId) {
                    return storedId;
                }
                const newId = this.generateAnonymousId();
                localStorage.setItem('did', newId);
                return newId;
            }
            return this.generateAnonymousId();
        }
        
        generateAnonymousId() {
            return 'anon_' + Math.random().toString(36).substring(2, 15) + 
                Math.random().toString(36).substring(2, 15);
        }
        
        getOrCreateSessionId() {
            if (this.isServer()) {
                return this.generateSessionId();
            }

            const storedId = sessionStorage.getItem('did_session');
            if (storedId) {
                return storedId;
            }
            
            const newId = this.generateSessionId();
            sessionStorage.setItem('did_session', newId);
            return newId;
        }
        
        generateSessionId() {
            return 'sess_' + this.anonymousId.substring(5, 10) + '_' + 
                Date.now().toString(36);
        }
        
        getSessionStartTime() {
            if (this.isServer()) {
                return Date.now();
            }

            const storedTime = sessionStorage.getItem('did_session_start');
            if (storedTime) {
                return parseInt(storedTime, 10);
            }
            
            const now = Date.now();
            sessionStorage.setItem('did_session_start', now.toString());
            return now;
        }
        
        init() {
            if (this.isServer()) return;
            
            if (this.options.trackSessions) {
                this.anonymousId = this.getOrCreateAnonymousId();
                this.sessionId = this.getOrCreateSessionId();
                this.sessionStartTime = this.getSessionStartTime();
                this.lastActivityTime = Date.now();
                
                ['mousedown', 'keydown', 'scroll', 'touchstart'].forEach(eventType => {
                    window.addEventListener(eventType, () => {
                        this.lastActivityTime = Date.now();
                        
                        if (this.options.trackInteractions) {
                            this.interactionCount++;
                        }
                    }, { passive: true });
                });
            } else {
                this.anonymousId = this.getOrCreateAnonymousId();
            }
            
            if (this.options.trackEngagement) {
                this.maxScrollDepth = 0;
                this.interactionCount = 0;
                this.hasExitIntent = false;
                
                if (this.options.trackScrollDepth) {
                    window.addEventListener('scroll', () => {
                        this.trackScrollDepth();
                    }, { passive: true });
                }
                
                if (this.options.trackExitIntent) {
                    document.addEventListener('mouseleave', (e) => {
                        if (e.clientY <= 0) {
                            this.hasExitIntent = true;
                        }
                    });
                }
            }
            
            if (this.options.trackErrors) {
                window.addEventListener('error', (event) => {
                    this.track('error', {
                        message: event.message,
                        filename: event.filename,
                        lineno: event.lineno,
                        colno: event.colno,
                        stack: event.error?.stack,
                        __path: window.location.href,
                        __title: document.title,
                        __referrer: document.referrer || 'direct'
                    });
                });
            }
        }

        trackScrollDepth() {
            if (this.isServer()) return;
            
            const scroll_depth = Math.round(this.maxScrollDepth);
            this.track('scroll_depth', { scroll_depth });
        }
        
        ready() {
            this.options.waitForProfile = false;
            this.flush();
        }
        
        async send(event) {
            if (event.payload && (event.payload.profileId || this.profileId)) {
                event.payload.anonymousId = this.anonymousId;
                delete event.payload.profileId;
            }
            
            if (event.payload && event.payload.properties) {
                event.payload.properties.sessionId = this.sessionId;
            }
            
            // Skip sending if disabled or filtered out
            if (this.options.disabled || (this.options.filter && !this.options.filter(event))) {
                return Promise.resolve();
            }
            
            // Queue event if waiting for profile
            if (this.options.waitForProfile && !this.anonymousId) {
                this.queue.push(event);
                return Promise.resolve();
            }
            
            // Add keepalive for more reliable delivery, especially near page unload
            const fetchOptions = {
                keepalive: true,
                credentials: 'omit' // Avoid CORS issues
            };
            
            // Try to send directly to API with keepalive
            return this.api.fetch("/basket", event, fetchOptions);
        }
        
        setGlobalProperties(props) {
            this.global = {
                ...this.global,
                ...props
            };
        }
        
        async track(eventName, properties) {
            // Skip tracking if disabled globally
            if (this.options.disabled) return;
            
            // Apply sampling if configured (skip random events based on sampling rate)
            if (this.options.samplingRate < 1.0) {
                // Generate random number between 0-1
                const samplingValue = Math.random();
                
                // Skip event if random value exceeds sampling rate
                if (samplingValue > this.options.samplingRate) {
                    console.debug(`Databuddy: Skipping ${eventName} event due to sampling (${this.options.samplingRate * 100}%)`);
                    return { sampled: false };
                }
            }
            
            const sessionData = {
                sessionId: this.sessionId,
                sessionStartTime: this.sessionStartTime,
            };
            
            if (eventName === 'screen_view' || eventName === 'page_view') {
                // Add performance metrics for page loads if enabled
                if (!this.isServer() && this.options.trackPerformance) {
                    // Collect performance timing metrics
                    const performanceData = this.collectNavigationTiming();
                    
                    // Add them to properties
                    Object.assign(properties ?? {}, performanceData);
                    
                    // Add vitals if enabled
                    if (this.options.trackWebVitals) {
                        setTimeout(() => {
                            this.collectWebVitals(eventName);
                        }, 1000);
                    }
                }
            }
            
            const payload = {
                type: "track",
                payload: {
                    name: eventName,
                    anonymousId: this.anonymousId,
                    properties: {
                        ...this.global ?? {},
                        ...sessionData,
                        ...properties ?? {}
                    }
                }
            };
            
            // Use sendBeacon for all events by default
            try {
                console.debug(`Databuddy: Tracking ${eventName} event with beacon`);
                const beaconResult = await this.sendBeacon(payload);
                if (beaconResult) {
                    console.debug(`Databuddy: Successfully sent ${eventName} via beacon`);
                    return beaconResult;
                }
            } catch (e) {
                // If beacon fails, fall back to regular send
                console.debug(`Databuddy: Beacon failed for ${eventName}, using fetch fallback`);
            }
            
            // Fallback to regular fetch
            console.debug(`Databuddy: Tracking ${eventName} event with fetch+keepalive`);
            return this.send(payload);
        }
        
        // Special method for sending events using Beacon API (preferred for reliability)
        async sendBeacon(event) {
            if (this.isServer()) return null;
            
            try {
                // Format event data for sending
                if (event.payload && (event.payload.profileId || this.profileId)) {
                    event.payload.anonymousId = this.anonymousId;
                    delete event.payload.profileId;
                }
                
                if (event.payload && event.payload.properties) {
                    event.payload.properties.sessionId = this.sessionId;
                }
                
                // Skip sending if disabled or filtered out
                if (this.options.disabled || (this.options.filter && !this.options.filter(event))) {
                    return null;
                }
                
                // Add client ID and SDK info as URL parameters since Beacon can't set headers
                const baseUrl = this.api.baseUrl;
                const clientId = this.options.clientId;
                const sdkName = this.options.sdk || "web";
                const sdkVersion = this.options.sdkVersion || "1.0.0";
                
                // Build URL with query parameters for authentication
                const url = `${baseUrl}/basket?client_id=${encodeURIComponent(clientId)}&sdk_name=${encodeURIComponent(sdkName)}&sdk_version=${encodeURIComponent(sdkVersion)}`;
                const data = JSON.stringify(event);
                
                // Only try sendBeacon if it's available
                if (navigator.sendBeacon) {
                    try {
                        const blob = new Blob([data], { type: 'application/json' });
                        const success = navigator.sendBeacon(url, blob);
                        
                        if (success) {
                            if (event.payload.name === 'page_exit') {
                                console.log("Databuddy: Successfully sent exit event via Beacon API");
                            }
                            return { success: true };
                        }
                    } catch (e) {
                        console.warn("Databuddy: Error using Beacon API", e);
                    }
                }
                
                // If we got here, Beacon failed or isn't available
                return null;
            } catch (error) {
                console.error("Databuddy: Error in sendBeacon", error);
                return null;
            }
        }
        
        async increment(data) {
            return this.send({
                type: "increment",
                payload: data
            });
        }
        
        async decrement(data) {
            return this.send({
                type: "decrement",
                payload: data
            });
        }
        
        clear() {
            this.anonymousId = this.generateAnonymousId();
            if (typeof window !== 'undefined' && window.localStorage) {
                localStorage.setItem('did', this.anonymousId);
            }
            
            this.sessionId = this.generateSessionId();
            this.sessionStartTime = Date.now();
            this.lastActivityTime = this.sessionStartTime;
            
            if (!this.isServer()) {
                sessionStorage.setItem('did_session', this.sessionId);
                sessionStorage.setItem('did_session_start', this.sessionStartTime.toString());
            }
        }
        
        flush() {
            this.queue.forEach(event => {
                this.send({
                    ...event,
                    payload: {
                        ...event.payload,
                        anonymousId: this.anonymousId
                    }
                });
            });
            this.queue = [];
        }
        
        isServer() {
            return typeof document === "undefined" || typeof window === "undefined" || typeof localStorage === "undefined";
        }
        
        collectNavigationTiming() {
            if (this.isServer() || !this.options.trackPerformance) return {};
            
            try {
                // Prioritize newer Navigation Timing API
                let perfData = {};
                
                if (window.performance && window.performance.getEntriesByType) {
                    const navEntries = window.performance.getEntriesByType('navigation');
                    if (navEntries && navEntries.length > 0) {
                        const navEntry = navEntries[0];
                        return {
                            load_time: Math.round(navEntry.loadEventEnd),
                            dom_ready_time: Math.round(navEntry.domContentLoadedEventEnd),
                            ttfb: Math.round(navEntry.responseStart),
                            request_time: Math.round(navEntry.responseEnd - navEntry.responseStart),
                            render_time: Math.round(navEntry.domComplete - navEntry.domInteractive)
                        };
                    }
                }
                
                // Fallback to older timing API if needed
                if (window.performance && window.performance.timing) {
                    const timing = window.performance.timing;
                    const navigationStart = timing.navigationStart;
                    
                    return {
                        load_time: timing.loadEventEnd - navigationStart,
                        dom_ready_time: timing.domContentLoadedEventEnd - navigationStart,
                        dom_interactive: timing.domInteractive - navigationStart,
                        ttfb: timing.responseStart - timing.requestStart,
                        request_time: timing.responseEnd - timing.requestStart,
                        render_time: timing.domComplete - timing.domInteractive
                    };
                }
                
                return {};
            } catch (e) {
                console.warn("Error collecting performance data:", e);
                return {};
            }
        }

        getUtmParams() {
            if (typeof window === 'undefined') return {};
            
            const urlParams = new URLSearchParams(window.location.search);
            return {
                utm_source: urlParams.get('utm_source'),
                utm_medium: urlParams.get('utm_medium'),
                utm_campaign: urlParams.get('utm_campaign'),
                utm_term: urlParams.get('utm_term'),
                utm_content: urlParams.get('utm_content')
            };
        }

        setupExitTracking() {
            if (typeof window === 'undefined') return;

            console.log("Databuddy: Setting up exit tracking");
            
            window.addEventListener('scroll', () => {
                const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
                const currentScroll = window.scrollY;
                const scrollPercent = Math.round((currentScroll / scrollHeight) * 100);
                this.maxScrollDepth = Math.max(this.maxScrollDepth, scrollPercent);
            });

            const interactionEvents = ['click', 'keypress', 'mousemove', 'touchstart'];
            interactionEvents.forEach(event => {
                window.addEventListener(event, () => {
                    this.interactionCount++;
                }, { once: true });
            });

            window.addEventListener('mouseout', (e) => {
                if (e.clientY <= 0 && !this.hasExitIntent) {
                    this.hasExitIntent = true;
                }
            });

            document.addEventListener('click', (e) => {
                const link = e.target.closest('a[href]');
                if (link && link.href) {
                    try {
                        const linkUrl = new URL(link.href);
                        const isSameOrigin = linkUrl.origin === window.location.origin;
                        if (isSameOrigin) {
                            this.isInternalNavigation = true;
                        }
                    } catch (err) {
                        // Invalid URL, ignore
                    }
                }
            });

            window.addEventListener('popstate', () => {
                this.isInternalNavigation = true;
            });

            window.addEventListener('pushstate', () => {
                this.isInternalNavigation = true;
            });

            window.addEventListener('replacestate', () => {
                this.isInternalNavigation = true;
            });

            // Use the 'pagehide' event as it's more reliable than 'beforeunload'
            window.addEventListener('pagehide', (event) => {
                console.log("Databuddy: pagehide event triggered", {
                    persisted: event.persisted,
                    isInternalNavigation: this.isInternalNavigation
                });
                
                if (!this.isInternalNavigation) {
                    this.trackExitData();
                }
                this.isInternalNavigation = false;
            });
            
            // Also keep beforeunload as a backup
            window.addEventListener('beforeunload', (event) => {
                console.log("Databuddy: beforeunload event triggered", {
                    isInternalNavigation: this.isInternalNavigation
                });
                
                if (!this.isInternalNavigation) {
                    this.trackExitData();
                }
                this.isInternalNavigation = false;
            });

            document.addEventListener('visibilitychange', () => {
                console.log("Databuddy: visibilitychange event", {
                    state: document.visibilityState,
                    isInternalNavigation: this.isInternalNavigation
                });
                
                if (document.visibilityState === 'hidden' && !this.isInternalNavigation) {
                    this.trackExitData();
                }
            });
        }

        trackExitData() {
            if (this.isServer()) return;
            
            console.log("Databuddy: Preparing page_exit event");
            const time_on_page = Math.round((Date.now() - this.pageEngagementStart) / 1000);
            const utm_params = this.getUtmParams();
            const exit_data = {
                time_on_page: time_on_page,
                scroll_depth: Math.round(this.maxScrollDepth),
                interaction_count: this.interactionCount,
                has_exit_intent: this.hasExitIntent,
                page_count: this.pageCount,
                is_bounce: this.pageCount <= 1 ? 1 : 0,
                __path: window.location.href,
                __title: document.title,
                __timestamp_ms: Date.now(),
                utm_source: utm_params.utm_source || "",
                utm_medium: utm_params.utm_medium || "",
                utm_campaign: utm_params.utm_campaign || "",
                utm_term: utm_params.utm_term || "",
                utm_content: utm_params.utm_content || ""
            };
            
            // Track the exit event
            this.track('page_exit', exit_data);
        }

        collectWebVitals(eventName) {
            if (this.isServer() || !this.options.trackWebVitals || 
                typeof window.performance === 'undefined') {
                return;
            }
            
            try {
                // Get FCP (First Contentful Paint)
                const paintEntries = performance.getEntriesByType('paint');
                let fcpTime = null;
                
                for (const entry of paintEntries) {
                    if (entry.name === 'first-contentful-paint') {
                        fcpTime = Math.round(entry.startTime);
                        break;
                    }
                }
                
                // Get LCP (Largest Contentful Paint) if possible
                let lcpTime = null;
                if (PerformanceObserver.supportedEntryTypes && 
                    PerformanceObserver.supportedEntryTypes.includes('largest-contentful-paint')) {
                    const lcpEntries = performance.getEntriesByType('largest-contentful-paint');
                    if (lcpEntries && lcpEntries.length > 0) {
                        lcpTime = Math.round(lcpEntries[lcpEntries.length - 1].startTime);
                    }
                }
                
                // Get CLS (Cumulative Layout Shift) if possible
                let cls = null;
                if (PerformanceObserver.supportedEntryTypes && 
                    PerformanceObserver.supportedEntryTypes.includes('layout-shift')) {
                    const layoutShifts = performance.getEntriesByType('layout-shift');
                    if (layoutShifts && layoutShifts.length > 0) {
                        cls = layoutShifts.reduce((sum, entry) => sum + entry.value, 0).toFixed(3);
                    }
                }
                
                // Get viewport and screen information
                const viewportInfo = {
                    screen_resolution: `${window.screen.width}x${window.screen.height}`,
                    viewport_size: `${window.innerWidth}x${window.innerHeight}`
                };

                // Get timezone information
                const timezoneInfo = {
                    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
                    language: navigator.language
                };

                // Get connection information
                const connectionInfo = this.getConnectionInfo();

                // Get current page context
                const pageContext = {
                    __path: this.lastPath,
                    __title: document.title,
                    __referrer: this.global?.__referrer || document.referrer || 'direct'
                };
                
                // Send vitals if we have at least one metric
                if (fcpTime || lcpTime || cls !== null) {
                    this.track('web_vitals', {
                        __timestamp_ms: Date.now(),
                        fcp: fcpTime,
                        lcp: lcpTime,
                        cls: cls,
                        ...pageContext,
                        ...viewportInfo,
                        ...timezoneInfo,
                        ...connectionInfo,
                    });
                }
            } catch (e) {
                // Ignore errors
            }
        }

        getConnectionInfo() {
            if (!navigator.connection) return {};

            return {
                connection_type: navigator.connection.effectiveType || navigator.connection.type || 'unknown'
            };
        }

        trackCustomEvent(eventName, properties = {}) {
            if (this.isServer()) return;
            
            // Get current page context
            const pageContext = {
                __path: window.location.href,
                __title: document.title,
                __referrer: this.global?.__referrer || document.referrer || 'direct'
            };

            // Get viewport and screen information
            const viewportInfo = {
                screen_resolution: `${window.screen.width}x${window.screen.height}`,
                viewport_size: `${window.innerWidth}x${window.innerHeight}`
            };

            // Get timezone information
            const timezoneInfo = {
                timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
                language: navigator.language
            };

            // Get connection information
            const connectionInfo = this.getConnectionInfo();

            // Track the custom event with all context
            this.track(eventName, {
                __timestamp_ms: Date.now(),
                ...properties,
                ...pageContext,
                ...viewportInfo,
                ...timezoneInfo,
                ...connectionInfo,
            });
        }
    };

    function h(a) {
        return a.replace(/([-_][a-z])/gi, e => e.toUpperCase().replace("-", "").replace("_", ""))
    }
    
    var d = class extends l {
        constructor(t) {
            super({
                sdk: "web",
                sdkVersion: "1.0.2",
                ...t
            });
            
            if (this.isServer()) return;
            
            // Set global properties without default referrer
            this.setGlobalProperties({
                __anonymized: true
            });
            
            // Set up screen view tracking if enabled
            if (this.options.trackScreenViews) {
                this.trackScreenViews();
                setTimeout(() => this.screenView(), 0);
            }
            
            // Set up other tracking capabilities if enabled
            if (this.options.trackOutgoingLinks) {
                this.trackOutgoingLinks();
            }
            
            if (this.options.trackAttributes) {
                this.trackAttributes();
            }
            
            // Initialize the tracker
            this.init();
        }
        debounce(t, r) {
            clearTimeout(this.debounceTimer),
            this.debounceTimer = setTimeout(t, r)
        }
        trackOutgoingLinks() {
            this.isServer() || document.addEventListener("click", t => {
                let r = t.target
                  , i = r.closest("a");
                if (i && r) {
                    let n = i.getAttribute("href");
                    n?.startsWith("http") && this.track("link_out", {
                        href: n,
                        text: i.innerText || i.getAttribute("title") || r.getAttribute("alt") || r.getAttribute("title")
                    })
                }
            })
        }
        trackScreenViews() {
            if (this.isServer()) return;
            
            let t = history.pushState;
            history.pushState = function(...s) {
                let o = t.apply(this, s);
                window.dispatchEvent(new Event("pushstate"));
                window.dispatchEvent(new Event("locationchange"));
                return o;
            };
            
            let r = history.replaceState;
            history.replaceState = function(...s) {
                let o = r.apply(this, s);
                window.dispatchEvent(new Event("replacestate"));
                window.dispatchEvent(new Event("locationchange"));
                return o;
            };
            
            window.addEventListener("popstate", () => {
                window.dispatchEvent(new Event("locationchange"));
            });
            
            this.pageEngagementStart = Date.now();
            
            let i = () => this.debounce(() => {
                const previous_path = this.lastPath || window.location.href;
                this.setGlobalProperties({
                    __referrer: previous_path
                });
                this.isInternalNavigation = true;
                this.screenView();
            }, 50);
            
            this.options.trackHashChanges ? window.addEventListener("hashchange", i) : window.addEventListener("locationchange", i);
        }
        trackAttributes() {
            this.isServer() || document.addEventListener("click", t => {
                let r = t.target
                  , i = r.closest("button")
                  , n = r.closest("a")
                  , s = i?.getAttribute("data-track") ? i : n?.getAttribute("data-track") ? n : null;
                if (s) {
                    let o = {};
                    for (let p of s.attributes)
                        p.name.startsWith("data-") && p.name !== "data-track" && (o[h(p.name.replace(/^data-/, ""))] = p.value);
                    let u = s.getAttribute("data-track");
                    u && this.track(u, o)
                }
            })
        }
        screenView(t, r) {
            if (this.isServer()) return;
            
            let i, n;
            
            if (this.lastPath && this.pageEngagementStart && this.options.trackEngagement) {
                const time_on_page = Math.round((Date.now() - this.pageEngagementStart) / 1000);
                const exit_data = {
                    __path: this.lastPath,
                    time_on_page: time_on_page,
                    scroll_depth: Math.round(this.maxScrollDepth),
                    interaction_count: this.interactionCount,
                    exit_intent: this.hasExitIntent,
                    screen_resolution: `${window.screen.width}x${window.screen.height}`,
                    viewport_size: `${window.innerWidth}x${window.innerHeight}`,
                    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
                    language: navigator.language,
                    ...this.getConnectionInfo(),
                    ...this.getUtmParams()
                };
                
                this.maxScrollDepth = 0;
                this.interactionCount = 0;
                this.hasExitIntent = false;
            }
            
            this.pageEngagementStart = Date.now();
            
            typeof t == "string" ? (i = t, n = r) : (i = window.location.href, n = t);
            
            if (this.lastPath !== i) {
                this.lastPath = i;
                this.pageCount++;
                
                const utm_params = this.getUtmParams();
                const connection_info = this.getConnectionInfo();
                const viewport_info = {
                    screen_resolution: `${window.screen.width}x${window.screen.height}`,
                    viewport_size: `${window.innerWidth}x${window.innerHeight}`
                };
                const timezone_info = {
                    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
                    language: navigator.language
                };
                const referrer_info = {
                    __referrer: this.global?.__referrer || document.referrer || 'direct'
                };

                this.track("screen_view", {
                    ...n ?? {},
                    __path: i,
                    __title: document.title,
                    __timestamp_ms: Date.now(),
                    page_count: this.pageCount,
                    ...utm_params,
                    ...connection_info,
                    ...viewport_info,
                    ...timezone_info,
                    ...referrer_info,
                });
            }
        }
    }
    ;

    function initializeDatabuddy() {
        // Don't run in Node environment
        if (typeof window === 'undefined') return;
            
        // Get current script tag
        const currentScript = document.currentScript || (function() {
            const scripts = document.getElementsByTagName('script');
            return scripts[scripts.length - 1];
        })();
        
        // Get configuration from various sources
        function getConfig() {
            // Check if a global configuration object exists
            const globalConfig = window.databuddyConfig || {};
            
            // If no current script found, return global config
            if (!currentScript) {
                console.warn('Databuddy: Could not identify script tag, using global config only');
                return globalConfig;
            }
            
            // Get all data attributes
            const dataAttributes = {};
            Array.from(currentScript.attributes).forEach(attr => {
                if (attr.name.startsWith('data-')) {
                    // Convert kebab-case to camelCase
                    const key = attr.name.substring(5).replace(/-([a-z])/g, (_, letter) => letter.toUpperCase());
                    
                    // Convert string values to appropriate types
                    let value = attr.value;
                    if (value === 'true') value = true;
                    if (value === 'false') value = false;
                    if (!isNaN(value) && value !== '') value = Number(value);
                    
                    dataAttributes[key] = value;
                }
            });
            
            // Extract URL parameters from script src
            const urlParams = {};
            try {
                const srcUrl = new URL(currentScript.src);
                const params = new URLSearchParams(srcUrl.search);
                
                params.forEach((value, key) => {
                    // Convert string values to appropriate types
                    if (value === 'true') value = true;
                    if (value === 'false') value = false;
                    if (!isNaN(value) && value !== '') value = Number(value);
                    
                    urlParams[key] = value;
                });
            } catch (e) {
                // Ignore URL parsing errors
            }
            
            // Handle specific numeric configurations with range validation
            const config = {
                ...globalConfig,
                ...urlParams,
                ...dataAttributes
            };
            
            // Ensure sampling rate is a valid proportion between 0 and 1
            if (config.samplingRate !== undefined) {
                if (config.samplingRate < 0) config.samplingRate = 0;
                if (config.samplingRate > 1) config.samplingRate = 1;
            }
            
            // Ensure maxRetries is non-negative
            if (config.maxRetries !== undefined && config.maxRetries < 0) {
                config.maxRetries = 0;
            }
            
            // Ensure initialRetryDelay is reasonable (50-10000ms)
            if (config.initialRetryDelay !== undefined) {
                if (config.initialRetryDelay < 50) config.initialRetryDelay = 50;
                if (config.initialRetryDelay > 10000) config.initialRetryDelay = 10000;
            }
            
            return config;
        }
        
        // Extract client ID from config or data-* attributes
        function getClientId(config) {
            // First check for clientId in merged config
            if (config.clientId) {
                return config.clientId;
            }
            
            // Then check for data-client-id attr directly (for backwards compatibility)
            if (currentScript && currentScript.getAttribute('data-client-id')) {
                return currentScript.getAttribute('data-client-id');
            }
            
            console.error('Databuddy: Missing client ID');
            return null;
        }
        
        function init() {
            // Get merged configuration
            const config = getConfig();
            const clientId = getClientId(config);
            
            // Don't initialize without a client ID
            if (!clientId) return;
            
            console.log('Databuddy: Initializing with config', { 
                clientId, 
                apiUrl: config.apiUrl,
                samplingRate: config.samplingRate,
                enableRetries: config.enableRetries,
                // Don't log all config details to keep log cleaner
                // ...config
            });
            
            // Initialize the tracker with the merged configuration
            window.databuddy = new d({
                ...config,
                clientId
            });
            
            // Expose API to window.db function
            window.db = (method, ...args) => {
                if (window.databuddy && typeof window.databuddy[method] === 'function') {
                    return window.databuddy[method](...args);
                } else {
                    console.warn(`Databuddy: ${method} is not a function`);
                }
            };
        }
        
        // Initialize immediately or on DOM ready
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', init);
        } else {
            init();
        }
    }
    
    // Auto-initialize when script is loaded
    initializeDatabuddy();
    
    // Export library for module use cases
    if (typeof window !== 'undefined') {
        window.Databuddy = d;
    } else if (typeof exports === 'object') {
        module.exports = d;
    }
})();

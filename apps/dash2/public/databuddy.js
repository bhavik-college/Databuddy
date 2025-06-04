(() => {
    // HTTP Client
    const c = class {
        constructor(config) {
            this.baseUrl = config.baseUrl;
            this.staticHeaders = {};
            this.dynamicHeaderFns = {};
            const headers = {
                "Content-Type": "application/json",
                ...config.defaultHeaders
            };
            for (const [key, value] of Object.entries(headers)) {
                if (typeof value === 'function' || (value && typeof value.then === 'function')) {
                    this.dynamicHeaderFns[key] = value;
                } else {
                    this.staticHeaders[key] = value;
                }
            }
            this.maxRetries = config.maxRetries ?? 3;
            this.initialRetryDelay = config.initialRetryDelay ?? 500;
        }

        async resolveHeaders() {
            const dynamicEntries = await Promise.all(
                Object.entries(this.dynamicHeaderFns).map(async ([key, fn]) => [key, await (typeof fn === 'function' ? fn() : fn)])
            );
            return { ...this.staticHeaders, ...Object.fromEntries(dynamicEntries) };
        }

        addHeader(key, value) {
            if (typeof value === 'function' || (value && typeof value.then === 'function')) {
                this.dynamicHeaderFns[key] = value;
                delete this.staticHeaders[key];
            } else {
                this.staticHeaders[key] = value;
                delete this.dynamicHeaderFns[key];
            }
        }

        async post(url, data, options = {}, retryCount = 0) {
            try {
                const fetchOptions = {
                    method: "POST",
                    headers: await this.resolveHeaders(),
                    body: JSON.stringify(data ?? {}),
                    keepalive: true,
                    credentials: 'omit',
                    ...options
                };
                
                const response = await fetch(url, fetchOptions);

                if (response.status === 401) {
                    return null;
                }

                if (response.status !== 200 && response.status !== 202) {
                    if ((response.status >= 500 && response.status < 600) || response.status === 429) {
                        if (retryCount < this.maxRetries) {
                            const jitter = Math.random() * 0.3 + 0.85;
                            const delay = this.initialRetryDelay * (2 ** retryCount) * jitter;
                            await new Promise(resolve => setTimeout(resolve, delay));
                            return this.post(url, data, options, retryCount + 1);
                        }
                    }
                    throw new Error(`HTTP error! status: ${response.status} for URL: ${url}`);
                }

                try {
                    return await response.json();
                } catch (e) {
                    const text = await response.text();
                    return text ? JSON.parse(text) : null;
                }
            } catch (error) {
                const isNetworkError = error.name === 'TypeError' || error.name === 'NetworkError';
                if (retryCount < this.maxRetries && isNetworkError) {
                    const jitter = Math.random() * 0.3 + 0.85;
                    const delay = this.initialRetryDelay * (2 ** retryCount) * jitter;
                    await new Promise(resolve => setTimeout(resolve, delay));
                    return this.post(url, data, options, retryCount + 1);
                }
                return null;
            }
        }

        async fetch(endpoint, data, options = {}) {
            const url = `${this.baseUrl}${endpoint}`;
            return this.post(url, data, options, 0);
        }
    };

    // Base Tracker
    const l = class {
        constructor(options) {
            this.options = {
                disabled: false,
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
                samplingRate: 1.0,
                enableRetries: true,
                maxRetries: 3,
                initialRetryDelay: 500,
                enableBatching: false,
                batchSize: 10,
                batchTimeout: 2000,
                ...options
            };
            this.batchQueue = [];
            this.batchTimer = null;
            
            const headers = {
                "databuddy-client-id": this.options.clientId,
                "databuddy-sdk-name": this.options.sdk || "web",
                "databuddy-sdk-version": this.options.sdkVersion || "1.0.0"
            };
            
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
            this.isTemporarilyHidden = false; // Track if we're just tabbed out or actually leaving
            this.visibilityChangeTimer = null; // Timer for tracking visibility changes

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
            return `anon_${Math.random().toString(36).substring(2, 15)}_${Math.random().toString(36).substring(2, 15)}`;
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
            return `sess_${this.anonymousId.substring(5, 10)}_${Date.now().toString(36)}`;
        }
        
        getSessionStartTime() {
            if (this.isServer()) {
                return Date.now();
            }

            const storedTime = sessionStorage.getItem('did_session_start');
            if (storedTime) {
                return Number.parseInt(storedTime, 10);
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
            } else {
                this.anonymousId = this.getOrCreateAnonymousId();
            }

            // Consolidated interaction tracking
            const interactionEvents = ['mousedown', 'keydown', 'scroll', 'touchstart', 'click', 'keypress', 'mousemove'];
            if (this.options.trackInteractions) {
                for (const eventType of interactionEvents) {
                    window.addEventListener(eventType, () => {
                        this.interactionCount++;
                    }, { passive: true });
                }
            } else {
                const handler = () => {
                    this.interactionCount++;
                    for (const eventType of interactionEvents) {
                        window.removeEventListener(eventType, handler);
                    }
                };
                for (const eventType of interactionEvents) {
                    window.addEventListener(eventType, handler, { passive: true });
                }
            }

            if (this.options.trackEngagement) {
                this.maxScrollDepth = 0;
                this.interactionCount = 0;
                this.hasExitIntent = false;
                
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
            const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
            const currentScroll = window.scrollY;
            const scrollPercent = Math.round((currentScroll / scrollHeight) * 100);
            this.maxScrollDepth = Math.max(this.maxScrollDepth, scrollPercent);
        }
        
        async send(event) {
            // Prepare event data
            const pEvent = this.prepareEventData(event);
            // Skip sending if disabled or filtered out
            if (this.options.disabled || (this.options.filter && !this.options.filter(pEvent))) {
                return Promise.resolve();
            }
            // If batching is enabled, add to batch queue
            if (this.options.enableBatching && !event.isForceSend) {
                return this.addToBatch(pEvent);
            }
            // Add keepalive for more reliable delivery, especially near page unload
            const fetchOptions = {
                keepalive: true,
            };
            // Try to send directly to API with keepalive
            return this.api.fetch("/", pEvent, fetchOptions);
        }
        
        addToBatch(event) {
            // Add event to batch queue
            this.batchQueue.push(event);
        
            
            // Set a timer to flush the batch if not already set
            if (this.batchTimer === null) {
                this.batchTimer = setTimeout(() => this.flushBatch(), this.options.batchTimeout);
            }
            
            // If batch queue has reached the max size, flush it immediately
            if (this.batchQueue.length >= this.options.batchSize) {
                this.flushBatch();
            }
            
            return Promise.resolve();
        }
        
        async flushBatch() {
            // Clear the batch timer
            if (this.batchTimer) {
                clearTimeout(this.batchTimer);
                this.batchTimer = null;
            }
            
            // If there are no events in the batch, do nothing
            if (this.batchQueue.length === 0) {
                return;
            }
            
            // Take current batch queue and reset
            const batchEvents = [...this.batchQueue];
            this.batchQueue = [];
            
            try {
                const fetchOptions = {
                    keepalive: true,
                };
                
                const beaconResult = await this.sendBatchBeacon(batchEvents);
                if (beaconResult) {
                    return beaconResult;
                }

                const result = await this.api.fetch("/batch", batchEvents, fetchOptions);
                return result;
            } catch (error) {
                
                const isNetworkError = !error.status && error.name === 'TypeError';
                
                if (isNetworkError) {
                    for (const event of batchEvents) {
                        event.isForceSend = true;
                        this.send(event);
                    }
                } else {
                }
                
                return null;
            }
        }
        
        // Send batch events using Beacon API
        async sendBatchBeacon(events) {
            if (this.isServer() || !navigator.sendBeacon) return null;
            
            try {
                // Build URL with authentication parameters
                const baseUrl = this.api.baseUrl;
                const clientId = this.options.clientId;
                const sdkName = this.options.sdk || "web";
                const sdkVersion = this.options.sdkVersion || "1.0.0";
                
                const url = `${baseUrl}/batch?client_id=${encodeURIComponent(clientId)}&sdk_name=${encodeURIComponent(sdkName)}&sdk_version=${encodeURIComponent(sdkVersion)}`;
                const data = JSON.stringify(events);
                
                const blob = new Blob([data], { type: 'application/json' });
                const success = navigator.sendBeacon(url, blob);
                
                if (success) {
                    return { success: true };
                }
            } catch (e) {
            }
            
            return null;
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
                    return { sampled: false };
                }
            }
            
            const sessionData = {
                sessionId: this.sessionId,
                sessionStartTime: this.sessionStartTime,
            };
            
            if (eventName === 'screen_view' || eventName === 'page_view') {
                if (!this.isServer() && this.options.trackPerformance) {
                    const performanceData = this.collectNavigationTiming();
                    
                    Object.assign(properties ?? {}, performanceData);
                    
                    if (this.options.trackWebVitals) {
                        this.initWebVitalsObservers(eventName);
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

            // If batching is enabled, route through send method which handles batching
            if (this.options.enableBatching) {
                return this.send(payload);
            }
            
            // Otherwise, use sendBeacon for direct sending
            try {
                const beaconResult = await this.sendBeacon(payload);
                if (beaconResult) {
                    return beaconResult;
                }
            } catch (e) {
                // If beacon fails, fall back to regular send
            }
            
            // Fallback to regular fetch
            return this.send(payload);
        }
        
        // Special method for sending events using Beacon API (preferred for reliability)
        async sendBeacon(event) {
            if (this.isServer()) return null;
            
            try {
                // Prepare event data
                const pEvent = this.prepareEventData(event);
                
                // Skip sending if disabled or filtered out
                if (this.options.disabled || (this.options.filter && !this.options.filter(pEvent))) {
                    return null;
                }
                
                // Add client ID and SDK info as URL parameters since Beacon can't set headers
                const baseUrl = this.options.apiUrl;
                if (!baseUrl) {
                    return null;
                }


                const clientId = this.options.clientId;
                const sdkName = this.options.sdk || "web";
                const sdkVersion = this.options.sdkVersion || "1.0.0";
                
                // Build URL with query parameters for authentication
                const url = new URL('/', baseUrl);
                url.searchParams.set('client_id', clientId);
                url.searchParams.set('sdk_name', sdkName);
                url.searchParams.set('sdk_version', sdkVersion);
                
                
                const data = JSON.stringify(pEvent);
                
                if (navigator.sendBeacon) {
                    try {
                        const blob = new Blob([data], { type: 'application/json' });
                        const success = navigator.sendBeacon(url.toString(), blob);
                        
                        if (success) {
                            return { success: true };
                        }
                    } catch (e) {
                    }
                }
                
                return null;
            } catch (error) {
                return null;
            }
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
            // Flush regular queue
                for (const event of this.queue) {
                this.send({
                    ...event,
                    payload: {
                        ...event.payload,
                        anonymousId: this.anonymousId
                    }
                });
            }
            this.queue = [];
            
            // Also flush batch queue if batching is enabled
            if (this.options.enableBatching) {
                this.flushBatch();
            }
        }
        
        isServer() {
            return typeof document === "undefined" || typeof window === "undefined" || typeof localStorage === "undefined";
        }
        
        collectNavigationTiming() {
            if (this.isServer() || !this.options.trackPerformance) return {};
            
            try {
                
                if (window.performance?.getEntriesByType) {
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
                if (window.performance?.timing) {
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
                return {};
            }
        }

        prepareEventData(event) {
            if (event.payload) {
                if (event.payload.properties) {
                    event.payload.properties.sessionId = this.sessionId;
                }
            }
            return event;
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
            
            window.addEventListener('scroll', () => {
                const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
                const currentScroll = window.scrollY;
                const scrollPercent = Math.round((currentScroll / scrollHeight) * 100);
                this.maxScrollDepth = Math.max(this.maxScrollDepth, scrollPercent);
            }, { passive: true });

            window.addEventListener('mouseout', (e) => {
                if (e.clientY <= 0) this.hasExitIntent = true;
            });

            document.addEventListener('click', (e) => {
                const link = e.target.closest('a[href]');
                if (link?.href) {
                    try {   
                        const linkUrl = new URL(link.href);
                        if (linkUrl.origin === window.location.origin) this.isInternalNavigation = true;
                    } catch (err) {}
                }
            });

            for (const event of ['popstate', 'pushstate', 'replacestate']) {
                window.addEventListener(event, () => {
                    this.isInternalNavigation = true;
                });
            }

            const exitHandler = (event) => {
                // Flushes batch but doesn't track exit if we're just temporarily hidden (tabbed out)
                if (this.options.enableBatching) this.flushBatch();
                
                // Only send actual exit event if we're really leaving the page
                // and not just switching tabs or minimizing
                if (!this.isInternalNavigation && !(window.databuddy?.isTemporarilyHidden)) {
                    this.trackExitData();
                }
                
                this.isInternalNavigation = false;
            };

            window.addEventListener('pagehide', () => {
                exitHandler();
            });
            
            window.addEventListener('beforeunload', () => {
                exitHandler();
            });
        }

        trackExitData() {
            if (this.isServer()) return;
            
            const exitData = {
                time_on_page: Math.round((Date.now() - this.pageEngagementStart) / 1000),
                scroll_depth: Math.round(this.maxScrollDepth),
                interaction_count: this.interactionCount,
                has_exit_intent: this.hasExitIntent,
                page_count: this.pageCount,
                is_bounce: this.pageCount <= 1 ? 1 : 0,
                __path: window.location.href,
                __title: document.title,
                __timestamp_ms: Date.now(),
                ...this.getUtmParams()
            };
            
            const exitEvent = {
                type: "track",
                payload: {
                    name: "page_exit",
                    anonymousId: this.anonymousId,
                    properties: {
                        ...this.global ?? {},
                        sessionId: this.sessionId,
                        sessionStartTime: this.sessionStartTime,
                        ...exitData
                    }
                },
                priority: "high"
            };
            
            if (this.options.enableBatching) {
                if (this.batchQueue.length === 0) {
                    this.sendExitEventImmediately(exitEvent);
                } else {
                    this.batchQueue.unshift(exitEvent);
                    this.flushBatch();
                }
            } else {
                this.sendExitEventImmediately(exitEvent);
            }
        }
        
        async sendExitEventImmediately(exitEvent) {
            try {
                const beaconResult = await this.sendBeacon(exitEvent);
                if (beaconResult) return beaconResult;
                
                return this.api.fetch("/", exitEvent, {
                    keepalive: true,
                });
            } catch (e) {
                return null;
            }
        }

        initWebVitalsObservers(eventName) {
            if (this.isServer() || !this.options.trackWebVitals || 
                typeof window.performance === 'undefined' || 
                typeof PerformanceObserver === 'undefined') {
                return;
            }
            
            try {
                // Store metrics data as they come in
                const metrics = {
                    fcp: null,
                    lcp: null,
                    cls: 0,
                    fid: null,
                    ttfb: null
                };

                let hasReportedVitals = false;
                
                const reportWebVitals = () => {
                    if (hasReportedVitals) return;
                    
                    if (metrics.fcp || metrics.lcp || metrics.cls > 0 || metrics.fid || metrics.ttfb) {
                        hasReportedVitals = true;
                        
                        const pageContext = {
                            __path: this.lastPath,
                            __title: document.title,
                            __referrer: this.global?.__referrer || document.referrer || 'direct'
                        };
                        
                        const viewportInfo = {
                            screen_resolution: `${window.screen.width}x${window.screen.height}`,
                            viewport_size: `${window.innerWidth}x${window.innerHeight}`
                        };
                        
                        const timezoneInfo = {
                            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
                            language: navigator.language
                        };
                        
                        const connectionInfo = this.getConnectionInfo();
                        
                        this.track('web_vitals', {
                            __timestamp_ms: Date.now(),
                            fcp: metrics.fcp,
                            lcp: metrics.lcp,
                            cls: metrics.cls ? metrics.cls.toFixed(3) : null,
                            fid: metrics.fid,
                            ttfb: metrics.ttfb,
                            ...pageContext,
                            ...viewportInfo,
                            ...timezoneInfo,
                            ...connectionInfo,
                        });
                    }
                };
                
                // TTFB (Time to First Byte)
                if (window.performance?.getEntriesByType) {
                    const navEntries = window.performance.getEntriesByType('navigation');
                    if (navEntries && navEntries.length > 0) {
                        metrics.ttfb = Math.round(navEntries[0].responseStart);
                    }
                }
                
                // FCP (First Contentful Paint)
                if (PerformanceObserver.supportedEntryTypes?.includes('paint')) {
                    const fcpObserver = new PerformanceObserver((entryList) => {
                        for (const entry of entryList.getEntries()) {
                            if (entry.name === 'first-contentful-paint') {
                                metrics.fcp = Math.round(entry.startTime);
                                // Report after FCP is available
                                setTimeout(reportWebVitals, 0);
                                fcpObserver.disconnect();
                            }
                        }
                    });
                    
                    fcpObserver.observe({ type: 'paint', buffered: true });
                } else {
                    // Fallback for FCP
                    const paintEntries = performance.getEntriesByType('paint');
                    for (const entry of paintEntries) {
                        if (entry.name === 'first-contentful-paint') {
                            metrics.fcp = Math.round(entry.startTime);
                            break;
                        }
                    }
                }
                
                // LCP (Largest Contentful Paint)
                if (PerformanceObserver.supportedEntryTypes?.includes('largest-contentful-paint')) {
                    const lcpObserver = new PerformanceObserver((entryList) => {
                        const entries = entryList.getEntries();
                        // Take the latest LCP entry
                        const lcpEntry = entries[entries.length - 1];
                        if (lcpEntry) {
                            metrics.lcp = Math.round(lcpEntry.startTime);
                            // Report after LCP is available
                            setTimeout(reportWebVitals, 0);
                        }
                    });
                    
                    lcpObserver.observe({ type: 'largest-contentful-paint', buffered: true });
                    
                    // LCP should be finalized when the page is backgrounded or unloaded
                    for (const type of ['visibilitychange', 'pagehide']) {
                        document.addEventListener(type, () => {
                            if (document.visibilityState === 'hidden' || type === 'pagehide') {
                                lcpObserver.disconnect();
                                // Final report when page is hidden
                                reportWebVitals();
                            }
                        }, { once: true, capture: true });
                    }
                }
                
                // CLS (Cumulative Layout Shift)
                if (PerformanceObserver.supportedEntryTypes?.includes('layout-shift')) {
                    let clsValue = 0;
                    let clsEntries = [];
                    let sessionValue = 0;
                    let sessionEntries = [];
                    let sessionStart = 0;
                    
                    const clsObserver = new PerformanceObserver((entryList) => {
                        for (const entry of entryList.getEntries()) {
                            // Only count CLS if the user wasn't interacting
                            if (!entry.hadRecentInput) {
                                const now = entry.startTime;
                                
                                // If this is a new session or continuing the current one
                                if (sessionValue === 0 || now - sessionStart < 1000) {
                                    sessionValue += entry.value;
                                    sessionEntries.push(entry);
                                    sessionStart = now;
                                } else {
                                    // This is a new session
                                    // Check if this session is larger than the current max
                                    if (sessionValue > clsValue) {
                                        clsValue = sessionValue;
                                        clsEntries = sessionEntries;
                                    }
                                    
                                    // Reset for new session
                                    sessionValue = entry.value;
                                    sessionEntries = [entry];
                                    sessionStart = now;
                                }
                            }
                        }
                        
                        // Update current max value
                        if (sessionValue > clsValue) {
                            clsValue = sessionValue;
                            clsEntries = sessionEntries;
                        }
                        
                        metrics.cls = clsValue;
                    });
                    
                    clsObserver.observe({ type: 'layout-shift', buffered: true });
                    
                    // Report final CLS when page is hidden or unloaded
                    for (const type of ['visibilitychange', 'pagehide']) {
                        document.addEventListener(type, () => {
                            if (document.visibilityState === 'hidden' || type === 'pagehide') {
                                clsObserver.disconnect();
                                // Update latest value and report
                                metrics.cls = clsValue;
                                reportWebVitals();
                            }
                        }, { once: true, capture: true });
                    }
                }
                
                // FID (First Input Delay)
                if (PerformanceObserver.supportedEntryTypes?.includes('first-input')) {
                    const fidObserver = new PerformanceObserver((entryList) => {
                        const entry = entryList.getEntries()[0];
                        if (entry) {
                            // FID is the delta between when input received and processing started
                            metrics.fid = Math.round(entry.processingStart - entry.startTime);
                            fidObserver.disconnect();
                            // Report after FID is available
                            setTimeout(reportWebVitals, 0);
                        }
                    });
                    
                    fidObserver.observe({ type: 'first-input', buffered: true });
                }
                
                // Ensure we send a report even if not all metrics are collected
                // Set a final timeout to capture whatever metrics we have
                setTimeout(() => {
                    reportWebVitals();
                }, 10000); // 10 seconds is a reasonable upper limit

            } catch (e) {
                // Silently fail if there's an error with performance monitoring
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
            
            const pageContext = {
                __path: window.location.href,
                __title: document.title,
                __referrer: this.global?.__referrer || document.referrer || 'direct'
            };

            const viewportInfo = {
                screen_resolution: `${window.screen.width}x${window.screen.height}`,
                viewport_size: `${window.innerWidth}x${window.innerHeight}`
            };

            const timezoneInfo = {
                timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
                language: navigator.language
            };

            const connectionInfo = this.getConnectionInfo();

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
    
    const d = class extends l {
        constructor(t) {
            super({
                sdk: "web",
                sdkVersion: "1.0.2",
                ...t
            });
            
            if (this.isServer()) return;
            
            this.setGlobalProperties({
                __anonymized: t.anonymized !== false // Default to true unless explicitly set to false
            });
            
            if (this.options.trackScreenViews) {
                this.trackScreenViews();
                setTimeout(() => this.screenView(), 0);
            }
            
            if (this.options.trackOutgoingLinks) {
                this.trackOutgoingLinks();
            }
            
            if (this.options.trackAttributes) {
                this.trackAttributes();
            }
            
            this.init();
        }
        debounce(t, r) {
            clearTimeout(this.debounceTimer)
            this.debounceTimer = setTimeout(t, r)
        }
        trackOutgoingLinks() {
            this.isServer() || document.addEventListener("click", t => {
                const r = t.target
                const i = r.closest("a"); 
                if (i && r) {
                    const n = i.getAttribute("href");
                    if (n) {
                        try {
                            const url = new URL(n, window.location.origin);
                            const isOutgoing = url.origin !== window.location.origin;
                            
                            if (isOutgoing) {
                                this.track("link_out", {
                                    href: n,
                                    text: i.innerText || i.getAttribute("title") || r.getAttribute("alt") || r.getAttribute("title")
                                });
                            }
                        } catch (e) {
                            // Invalid URL, ignore
                        }
                    }
                }
            })
        }
        trackScreenViews() {
            if (this.isServer()) return;
            
            const t = history.pushState;
            history.pushState = function(...s) {
                const o = t.apply(this, s);
                window.dispatchEvent(new Event("pushstate"));
                window.dispatchEvent(new Event("locationchange"));
                return o;
            };
            
            const r = history.replaceState;
            history.replaceState = function(...s) {
                const o = r.apply(this, s);
                window.dispatchEvent(new Event("replacestate"));
                window.dispatchEvent(new Event("locationchange"));
                return o;
            };
            
            window.addEventListener("popstate", () => {
                window.dispatchEvent(new Event("locationchange"));
            });
            
            this.pageEngagementStart = Date.now();
            
            const i = () => this.debounce(() => {
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
                const r = t.target
                const i = r.closest("button") 
                const n = r.closest("a")
                const s = i?.getAttribute("data-track") ? i : n?.getAttribute("data-track") ? n : null;
                if (s) {
                    const o = {};
                    for (const p of s.attributes) {
                        if (p.name.startsWith("data-") && p.name !== "data-track") {
                            o[h(p.name.replace(/^data-/, ""))] = p.value;
                        }
                    }
                    const u = s.getAttribute("data-track");
                    u && this.track(u, o)
                }
            })
        }
        screenView(t, r) {
            if (this.isServer()) return;
            
            let i;
            let n;
            
            if (this.lastPath && this.pageEngagementStart && this.options.trackEngagement) {
                this.maxScrollDepth = 0;
                this.interactionCount = 0;
                this.hasExitIntent = false;
            }
            
            this.pageEngagementStart = Date.now();
            
            if (typeof t === "string") {
                i = t;
                n = r;
            } else {
                i = window.location.href;
                n = t;
            }
            
            if (this.lastPath !== i) {
                this.lastPath = i;
                this.pageCount++;
                
                const pageData = {
                    ...n ?? {},
                    __path: i,
                    __title: document.title,
                    __timestamp_ms: Date.now(),
                    page_count: this.pageCount,
                    ...this.getUtmParams(),
                    ...this.getConnectionInfo(),
                    screen_resolution: `${window.screen.width}x${window.screen.height}`,
                    viewport_size: `${window.innerWidth}x${window.innerHeight}`,
                    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
                    language: navigator.language,
                    __referrer: this.global?.__referrer || document.referrer || 'direct'
                };

                this.track("screen_view", pageData);
            }
        }
    }
    ;

    function initializeDatabuddy() {
        // Don't run in Node environment
        if (typeof window === 'undefined') return;
            
        // Get current script tag
        const currentScript = document.currentScript || (() => {
            const scripts = document.getElementsByTagName('script');
            return scripts[scripts.length - 1];
        })();
        
        function getConfig() {
            const globalConfig = window.databuddyConfig || {};
            
            if (!currentScript) {
                return globalConfig;
            }
            
            const dataAttributes = {};
            for (const attr of currentScript.attributes) {
                if (attr.name.startsWith('data-')) {
                    const key = attr.name.substring(5).replace(/-([a-z])/g, (_, letter) => letter.toUpperCase());
                    
                    const value = attr.value;
                    
                    if (value === 'true') {
                        dataAttributes[key] = true;
                    } else if (value === 'false') {
                        dataAttributes[key] = false;
                    } else if (/^\d+$/.test(value)) {
                        dataAttributes[key] = Number(value);
                    } else {
                        dataAttributes[key] = value;
                    }
                }
            }
            
            const urlParams = {};
            try {
                const srcUrl = new URL(currentScript.src);
                const params = new URLSearchParams(srcUrl.search);
                
                params.forEach((value, key) => {
                    if (value === 'true') {
                        urlParams[key] = true;
                    } else if (value === 'false') {
                        urlParams[key] = false;
                    } else if (/^\d+$/.test(value)) {
                        urlParams[key] = Number(value);
                    } else {
                        urlParams[key] = value;
                    }
                });
            } catch (e) {
            }
            
            const config = {
                ...globalConfig,
                ...urlParams,
                ...dataAttributes
            };
            
            if (config.samplingRate !== undefined) {
                if (config.samplingRate < 0) config.samplingRate = 0;
                if (config.samplingRate > 1) config.samplingRate = 1;
            }
            
            if (config.maxRetries !== undefined && config.maxRetries < 0) {
                config.maxRetries = 0;
            }
            
            if (config.initialRetryDelay !== undefined) {
                if (config.initialRetryDelay < 50) config.initialRetryDelay = 50;
                if (config.initialRetryDelay > 10000) config.initialRetryDelay = 10000;
            }
            
            if (config.batchSize !== undefined) {
                if (config.batchSize < 1) config.batchSize = 1;
                if (config.batchSize > 50) config.batchSize = 50;
            }
            
            if (config.batchTimeout !== undefined) {
                if (config.batchTimeout < 100) config.batchTimeout = 100;
                if (config.batchTimeout > 30000) config.batchTimeout = 30000;
            }

            if (!config.apiUrl) {
                config.apiUrl = "https://basket.databuddy.cc";
            } else {
                try {
                    new URL(config.apiUrl);
                } catch (e) {
                    config.apiUrl = "https://basket.databuddy.cc";
                }
            }
            
            return config;
        }
        
        function getClientId(config) {
            if (config.clientId) {
                return config.clientId;
            }
            
            if (currentScript?.getAttribute('data-client-id')) {
                return currentScript.getAttribute('data-client-id');
            }
            
            return null;
        }
        
        function init() {
            const config = getConfig();
            const clientId = getClientId(config);
            
            if (!clientId) return;
            const dntEnabled = navigator.doNotTrack === '1' || 
                             navigator.doNotTrack === 'yes' || 
                             navigator.msDoNotTrack === '1' ||
                             window.doNotTrack === '1';
            if (dntEnabled && config.ignoreDnt !== true) {
                return;
            }
            window.databuddy = new d({
                ...config,
                clientId
            });
            
            window.db = (method, ...args) => {
                if (window.databuddy && typeof window.databuddy[method] === 'function') {
                    return window.databuddy[method](...args);
                }
            };
        }
        
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', init);
        } else {
            init();
        }
    }
    
    initializeDatabuddy();
    
    if (typeof window !== 'undefined') {
        window.Databuddy = d;
    } else if (typeof exports === 'object') {
        module.exports = d;
    }
})();
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
                trackSessions: true,
                trackPerformance: true,
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

            this.api = new c({
                baseUrl: this.options.apiUrl || "https://basket.databuddy.cc",
                defaultHeaders: headers,
                maxRetries: this.options.maxRetries,
                initialRetryDelay: this.options.initialRetryDelay
            });
            
            this.lastPath = "";
            this.pageCount = 0;
            this.isInternalNavigation = false;
            
            this.anonymousId = this.getOrCreateAnonymousId();
            this.sessionId = this.getOrCreateSessionId();
            this.sessionStartTime = this.getSessionStartTime();
            this.lastActivityTime = Date.now();
            
            this.maxScrollDepth = 0;
            this.interactionCount = 0;
            this.hasExitIntent = false;
            this.pageStartTime = Date.now();
            this.pageEngagementStart = Date.now();
            this.utmParams = this.getUtmParams();
            this.isTemporarilyHidden = false;
            this.visibilityChangeTimer = null;
            this.webVitalObservers = [];
            this.webVitalsReportTimeoutId = null;
            this.webVitalsVisibilityChangeHandler = null;
            this.webVitalsPageHideHandler = null;

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
            return `anon_${crypto.randomUUID()}`;
        }
        
        getOrCreateSessionId() {
            if (this.isServer()) {
                return this.generateSessionId();
            }

            const storedId = sessionStorage.getItem('did_session');
            const sessionTimestamp = sessionStorage.getItem('did_session_timestamp');
            
            if (storedId && sessionTimestamp) {
                const sessionAge = Date.now() - Number.parseInt(sessionTimestamp, 10);
                const SESSION_TIMEOUT = 30 * 60 * 1000; // 30 minutes
                
                if (sessionAge < SESSION_TIMEOUT) {
                    sessionStorage.setItem('did_session_timestamp', Date.now().toString());
                    return storedId;
                }
                sessionStorage.removeItem('did_session');
                sessionStorage.removeItem('did_session_timestamp');
                sessionStorage.removeItem('did_session_start');
            }
            
            const newId = this.generateSessionId();
            sessionStorage.setItem('did_session', newId);
            sessionStorage.setItem('did_session_timestamp', Date.now().toString());
            return newId;
        }
        
        generateSessionId() {
            return `sess_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 18)}`;
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
                    this.trackError({
                        timestamp: Date.now(),
                        message: event.message,
                        filename: event.filename,
                        lineno: event.lineno,
                        colno: event.colno,
                        stack: event.error?.stack,
                        errorType: event.error?.name || 'Error'
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
            const eventData = (event.type === "track" && event.payload) ? event.payload : event;
            
            if (this.options.disabled || (this.options.filter && !this.options.filter(eventData))) {
                return Promise.resolve();
            }
            if (this.options.enableBatching && !event.isForceSend) {
                return this.addToBatch(eventData);
            }
            const fetchOptions = {
                keepalive: true,
            };
            return this.api.fetch("/", eventData, fetchOptions);
        }
        
        addToBatch(event) {
            this.batchQueue.push(event);
        
            if (this.batchTimer === null) {
                this.batchTimer = setTimeout(() => this.flushBatch(), this.options.batchTimeout);
            }
            
            if (this.batchQueue.length >= this.options.batchSize) {
                this.flushBatch();
            }
            
            return Promise.resolve();
        }
        
        async flushBatch() {
            if (this.batchTimer) {
                clearTimeout(this.batchTimer);
                this.batchTimer = null;
            }
            
            if (this.batchQueue.length === 0) {
                return;
            }
            
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
                        // Re-wrap the event for retry
                        const originalEvent = {
                            type: "track",
                            payload: event,
                            isForceSend: true
                        };
                        this.send(originalEvent);
                    }
                } else {
                }
                
                return null;
            }
        }
        
        async sendBatchBeacon(events) {
            if (this.isServer() || !navigator.sendBeacon) return null;
            
            try {
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
            if (this.options.disabled) return;
            
            if (this.options.samplingRate < 1.0) {
                const samplingValue = Math.random();
                
                if (samplingValue > this.options.samplingRate) {
                    return { sampled: false };
                }
            }

            let finalProperties;
            if (properties === undefined || properties === null) {
                finalProperties = {};
            } else if (typeof properties === 'object') {
                finalProperties = properties;
            } else {
                finalProperties = { value: properties };
            }
            
            // Collect base context data
            const baseContext = this.getBaseContext();
            
            // Collect performance data for page views
            let performanceData = {};
            if (eventName === 'screen_view' || eventName === 'page_view') {
                if (!this.isServer() && this.options.trackPerformance) {
                    performanceData = this.collectNavigationTiming();
                    
                    if (this.options.trackWebVitals) {
                        this.initWebVitalsObservers(eventName);
                    }
                }
            }
            
            const payload = {
                type: "track",
                payload: {
                    eventId: crypto.randomUUID(),
                    name: eventName,
                    anonymousId: this.anonymousId,
                    sessionId: this.sessionId,
                    sessionStartTime: this.sessionStartTime,
                    timestamp: Date.now(),
                    ...baseContext,
                    ...performanceData,
                    ...finalProperties
                }
            };

            if (this.options.enableBatching) {
                return this.send(payload);
            }
            
            try {
                const beaconResult = await this.sendBeacon(payload);
                if (beaconResult) {
                    return beaconResult;
                }
            } catch (e) {
            }
            
            return this.send(payload);
        }
        
        async sendBeacon(event) {
            if (this.isServer()) return null;
            
            try {
                const eventData = (event.type === "track" && event.payload) ? event.payload : event;
                
                if (this.options.disabled || (this.options.filter && !this.options.filter(eventData))) {
                    return null;
                }
                
                const baseUrl = this.options.apiUrl;
                if (!baseUrl) {
                    return null;
                }

                const clientId = this.options.clientId;
                const sdkName = this.options.sdk || "web";
                const sdkVersion = this.options.sdkVersion || "1.0.0";
                
                const url = new URL('/', baseUrl);
                url.searchParams.set('client_id', clientId);
                url.searchParams.set('sdk_name', sdkName);
                url.searchParams.set('sdk_version', sdkVersion);
                
                const data = JSON.stringify(eventData);
                
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

            // Simple exit handler
            const exitHandler = () => {
                if (this.options.enableBatching) this.flushBatch();
                
                if (!this.isInternalNavigation && !(window.databuddy?.isTemporarilyHidden)) {
                    this.trackExitData();
                }
                
                this.isInternalNavigation = false;
            };

            window.addEventListener('pagehide', exitHandler, { once: true });
            
            if (!('onpagehide' in window)) {
                window.addEventListener('beforeunload', exitHandler, { once: true });
            }
        }

        trackExitData() {
            if (this.isServer()) return;
            
            const baseContext = this.getBaseContext();
            
            // Create consistent exit event ID based on session, path, and page start time
            const exitEventId = `exit_${this.sessionId}_${btoa(window.location.pathname)}_${this.pageEngagementStart}`;
            
            const exitEvent = {
                type: "track",
                payload: {
                    eventId: exitEventId,
                    name: "page_exit",
                    anonymousId: this.anonymousId,
                    sessionId: this.sessionId,
                    sessionStartTime: this.sessionStartTime,
                    timestamp: Date.now(),
                    ...baseContext,
                    time_on_page: Math.round((Date.now() - this.pageEngagementStart) / 1000),
                    scroll_depth: Math.round(this.maxScrollDepth),
                    interaction_count: this.interactionCount,
                    has_exit_intent: this.hasExitIntent,
                    page_count: this.pageCount,
                    is_bounce: this.pageCount <= 1 ? 1 : 0,
                }
            };
            
            // Send immediately
            this.sendExitEventImmediately(exitEvent);
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

        cleanupWebVitals() {
            if (this.webVitalObservers) {
                for (const o of this.webVitalObservers) {
                    try {
                        o.disconnect();
                    } catch (e) {
                        console.error(e);
                    }
                }
                this.webVitalObservers = [];
            }
            if (this.webVitalsReportTimeoutId) {
                clearTimeout(this.webVitalsReportTimeoutId);
                this.webVitalsReportTimeoutId = null;
            }
            if (this.webVitalsVisibilityChangeHandler) {
                document.removeEventListener('visibilitychange', this.webVitalsVisibilityChangeHandler);
                this.webVitalsVisibilityChangeHandler = null;
            }
            if (this.webVitalsPageHideHandler) {
                window.removeEventListener('pagehide', this.webVitalsPageHideHandler);
                this.webVitalsPageHideHandler = null;
            }
        }

        initWebVitalsObservers(eventName) {
            if (this.isServer() || !this.options.trackWebVitals ||
                typeof window.performance === 'undefined' ||
                typeof PerformanceObserver === 'undefined') {
                return;
            }

            try {
                const metrics = { fcp: null, lcp: null, cls: 0, fid: null, inp: null };
                let reported = false;

                const report = () => {
                    if (reported || !Object.values(metrics).some(m => m !== null && m !== 0)) return;
                    reported = true;
                    this.trackWebVitals({ timestamp: Date.now(), ...metrics });
                    this.cleanupWebVitals();
                };

                const observe = (type, callback) => {
                    try {
                        if (PerformanceObserver.supportedEntryTypes?.includes(type)) {
                            const observer = new PerformanceObserver(list => callback(list.getEntries()));
                            observer.observe({ type, buffered: true });
                            this.webVitalObservers.push(observer);
                        }
                    } catch (e) {}
                };

                observe('paint', entries => {
                    for (const entry of entries) {
                        if (entry.name === 'first-contentful-paint' && !metrics.fcp) {
                            metrics.fcp = Math.round(entry.startTime);
                        }
                    }
                });

                observe('largest-contentful-paint', entries => {
                    const entry = entries[entries.length - 1];
                    if (entry) metrics.lcp = Math.round(entry.startTime);
                });
                
                observe('layout-shift', entries => {
                    for (const entry of entries) {
                        if (!entry.hadRecentInput) {
                            metrics.cls += entry.value;
                        }
                    }
                });

                observe('first-input', entries => {
                    const entry = entries[0];
                    if (entry && !metrics.fid) {
                        metrics.fid = Math.round(entry.processingStart - entry.startTime);
                    }
                });

                observe('event', entries => {
                    for (const entry of entries) {
                        if (entry.interactionId && entry.duration > (metrics.inp || 0)) {
                            metrics.inp = Math.round(entry.duration);
                        }
                    }
                });

                this.webVitalsVisibilityChangeHandler = () => {
                    if (document.visibilityState === 'hidden') report();
                };
                document.addEventListener('visibilitychange', this.webVitalsVisibilityChangeHandler, { once: true });
                
                this.webVitalsPageHideHandler = report;
                window.addEventListener('pagehide', this.webVitalsPageHideHandler, { once: true });

                this.webVitalsReportTimeoutId = setTimeout(report, 10000);

            } catch (e) {}
        }


        getConnectionInfo() {
            const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
            
            if (!connection) {
                return {
                    connection_type: null,
                    rtt: null,
                    downlink: null
                };
            }

            return {
                connection_type: connection.effectiveType || connection.type || null,
                rtt: connection.rtt || null,
                downlink: connection.downlink || null
            };
        }

        trackCustomEvent(eventName, properties = {}) {
            if (this.isServer()) return;

            let finalProperties;
            if (properties === undefined || properties === null) {
                finalProperties = {};
            } else if (typeof properties === 'object') {
                finalProperties = properties;
            } else {
                finalProperties = { value: properties };
            }
            
            // Use the standard track method with new schema
            this.track(eventName, finalProperties);
        }

        getBaseContext() {
            if (this.isServer()) return {};
            
            const utmParams = this.getUtmParams();
            const connectionInfo = this.getConnectionInfo();
            
            return {
                // Page context
                path: window.location.href,
                title: document.title,
                referrer: this.global?.referrer || document.referrer || 'direct',
                // User context
                screen_resolution: `${window.screen.width}x${window.screen.height}`,
                viewport_size: `${window.innerWidth}x${window.innerHeight}`,
                timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
                language: navigator.language,
                // Connection info
                connection_type: connectionInfo.connection_type,
                rtt: connectionInfo.rtt,
                downlink: connectionInfo.downlink,
                // UTM parameters
                utm_source: utmParams.utm_source,
                utm_medium: utmParams.utm_medium,
                utm_campaign: utmParams.utm_campaign,
                utm_term: utmParams.utm_term,
                utm_content: utmParams.utm_content,
            };
        }

        async trackError(errorData) {
            if (this.isServer()) return;
            
            const errorEvent = {
                type: "error",
                payload: {
                    eventId: crypto.randomUUID(),
                    anonymousId: this.anonymousId,
                    sessionId: this.sessionId,
                    timestamp: errorData.timestamp || Date.now(),
                    path: window.location.pathname,
                    message: errorData.message,
                    filename: errorData.filename,
                    lineno: errorData.lineno,
                    colno: errorData.colno,
                    stack: errorData.stack,
                    errorType: errorData.errorType || 'Error'
                }
            };
            
            if (this.options.enableBatching) {
                return this.send(errorEvent);
            }
            
            try {
                const beaconResult = await this.sendBeacon(errorEvent);
                if (beaconResult) {
                    return beaconResult;
                }
            } catch (e) {
            }
            
            return this.send(errorEvent);
        }

        async trackWebVitals(vitalsData) {
            if (this.isServer()) return;
            
            const webVitalsEvent = {
                type: "web_vitals",
                payload: {
                    eventId: crypto.randomUUID(),
                    anonymousId: this.anonymousId,
                    sessionId: this.sessionId,
                    timestamp: vitalsData.timestamp || Date.now(),
                    path: window.location.pathname,
                    fcp: vitalsData.fcp,
                    lcp: vitalsData.lcp,
                    cls: vitalsData.cls,
                    fid: vitalsData.fid,
                    inp: vitalsData.inp
                }
            };
            
            if (this.options.enableBatching) {
                return this.send(webVitalsEvent);
            }
            
            try {
                const beaconResult = await this.sendBeacon(webVitalsEvent);
                if (beaconResult) {
                    return beaconResult;
                }
            } catch (e) {
            }
            
            return this.send(webVitalsEvent);
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
                    referrer: previous_path
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
                if (this.options.trackWebVitals) {
                    this.cleanupWebVitals();
                }
                this.lastPath = i;
                this.pageCount++;
                
                const pageData = {
                    page_count: this.pageCount,
                    ...n ?? {}
                };

                this.track("screen_view", pageData);
            }
        }
    }
    ;

    function initializeDatabuddy() {
        if (typeof window === 'undefined' || window.databuddy) {
            return;
        }
            
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
            if (window.databuddy) return;
            
            const config = getConfig();
            const clientId = getClientId(config);
            
            if (!clientId) return;
            window.databuddy = new d({
                ...config,
                clientId
            });
            
            window.db = {
                track: (...args) => window.databuddy?.track(...args),
                screenView: (...args) => window.databuddy?.screenView(...args),
                clear: () => window.databuddy?.clear(),
                flush: () => window.databuddy?.flush(),
                setGlobalProperties: (...args) => window.databuddy?.setGlobalProperties(...args),
                trackCustomEvent: (...args) => window.databuddy?.trackCustomEvent(...args)
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
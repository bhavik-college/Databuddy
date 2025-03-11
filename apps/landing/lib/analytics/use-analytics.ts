'use client';

import { useCallback, useEffect, useState } from 'react';
import { 
  AnalyticsEvent, 
  PageViewEvent, 
  ClickEvent, 
  CustomEvent, 
  FormSubmitEvent 
} from './types';

/**
 * React hook for using analytics in client components
 * 
 * @example
 * ```tsx
 * const { trackEvent, trackPageView, trackClick, trackFormSubmit, setGlobalProps, optOut, optIn } = useAnalytics();
 * 
 * // Track a custom event
 * const handleClick = () => {
 *   trackEvent('button_click', { category: 'engagement' });
 * };
 * ```
 */
export function useAnalytics() {
  const [isAvailable, setIsAvailable] = useState(false);

  useEffect(() => {
    // Check if databuddy is available
    if (typeof window !== 'undefined' && window.databuddy) {
      setIsAvailable(true);
    } else {
      // Set up listener for when databuddy becomes available
      const checkInterval = setInterval(() => {
        if (typeof window !== 'undefined' && window.databuddy) {
          setIsAvailable(true);
          clearInterval(checkInterval);
        }
      }, 100);

      // Clean up interval
      return () => clearInterval(checkInterval);
    }
  }, []);

  // Define analytics methods
  const trackEvent = useCallback((name: string, props?: Record<string, any>) => {
    if (typeof window !== 'undefined' && window.databuddy) {
      window.databuddy.trackEvent(name, props);
    } else if (typeof window !== 'undefined' && window.databuddyq) {
      // Queue the event if databuddy isn't loaded yet
      window.databuddyq.push(['trackEvent', name, props]);
    }
  }, []);

  const trackPageView = useCallback((path?: string, props?: Record<string, any>) => {
    if (typeof window !== 'undefined' && window.databuddy) {
      window.databuddy.trackPageView(path, props);
    } else if (typeof window !== 'undefined' && window.databuddyq) {
      // Queue the page view if databuddy isn't loaded yet
      window.databuddyq.push(['trackPageView', path, props]);
    }
  }, []);

  const trackClick = useCallback((element: HTMLElement, props?: Record<string, any>) => {
    if (typeof window !== 'undefined' && window.databuddy) {
      window.databuddy.trackClick(element, props);
    } else if (typeof window !== 'undefined' && window.databuddyq) {
      // Queue the click if databuddy isn't loaded yet
      window.databuddyq.push(['trackClick', element, props]);
    }
  }, []);

  const trackFormSubmit = useCallback((
    form: HTMLFormElement, 
    success: boolean, 
    errorType?: string | null, 
    props?: Record<string, any>
  ) => {
    if (typeof window !== 'undefined' && window.databuddy) {
      window.databuddy.trackFormSubmit(form, success, errorType, props);
    } else if (typeof window !== 'undefined' && window.databuddyq) {
      // Queue the form submission if databuddy isn't loaded yet
      window.databuddyq.push(['trackFormSubmit', form, success, errorType, props]);
    }
  }, []);

  const trackPurchase = useCallback((
    productId: string,
    price: number,
    currency: string,
    props?: Record<string, any>
  ) => {
    if (typeof window !== 'undefined' && window.databuddy) {
      window.databuddy.trackPurchase(productId, price, currency, props);
    } else if (typeof window !== 'undefined' && window.databuddyq) {
      // Queue the purchase if databuddy isn't loaded yet
      window.databuddyq.push(['trackPurchase', productId, price, currency, props]);
    }
  }, []);

  const setGlobalProps = useCallback((props: Record<string, any>) => {
    if (typeof window !== 'undefined' && window.databuddy) {
      window.databuddy.setGlobalProps(props);
    } else if (typeof window !== 'undefined' && window.databuddyq) {
      // Queue setting global props if databuddy isn't loaded yet
      window.databuddyq.push(['setGlobalProps', props]);
    }
  }, []);

  const optOut = useCallback(() => {
    if (typeof window !== 'undefined' && window.databuddy) {
      window.databuddy.optOut();
    } else if (typeof window !== 'undefined' && window.databuddyq) {
      // Queue opt out if databuddy isn't loaded yet
      window.databuddyq.push(['optOut']);
    }
  }, []);

  const optIn = useCallback(() => {
    if (typeof window !== 'undefined' && window.databuddy) {
      window.databuddy.optIn();
    } else if (typeof window !== 'undefined' && window.databuddyq) {
      // Queue opt in if databuddy isn't loaded yet
      window.databuddyq.push(['optIn']);
    }
  }, []);

  return {
    isAvailable,
    trackEvent,
    trackPageView,
    trackClick,
    trackFormSubmit,
    trackPurchase,
    setGlobalProps,
    optOut,
    optIn
  };
}

// Add type definitions for window object
declare global {
  interface Window {
    databuddy?: {
      trackEvent: (name: string, props?: Record<string, any>) => void;
      trackPageView: (path?: string, props?: Record<string, any>) => void;
      trackClick: (element: HTMLElement, props?: Record<string, any>) => void;
      trackFormSubmit: (
        form: HTMLFormElement, 
        success: boolean, 
        errorType?: string | null, 
        props?: Record<string, any>
      ) => void;
      trackPurchase: (
        productId: string,
        price: number,
        currency: string,
        props?: Record<string, any>
      ) => void;
      setGlobalProps: (props: Record<string, any>) => void;
      optOut: () => void;
      optIn: () => void;
    };
    databuddyq?: any[] | { push: (cmd: any[]) => void };
  }
} 
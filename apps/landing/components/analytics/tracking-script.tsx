'use client';

import Script from 'next/script';
import { useEffect, useState } from 'react';

interface TrackingScriptProps {
  trackingId: string;
  debug?: boolean;
}

export function TrackingScript({ trackingId, debug = false }: TrackingScriptProps) {
  const [scriptUrl, setScriptUrl] = useState<string>('');
  
  useEffect(() => {
    // Only set the URL on the client side to avoid hydration issues
    setScriptUrl(`/api/tracking?id=${trackingId}${debug ? '&debug=true' : ''}`);
  }, [trackingId, debug]);
  
  if (!scriptUrl) return null;
  
  return (
    <Script
      src={scriptUrl}
      strategy="afterInteractive"
      data-id={trackingId}
    />
  );
}

/**
 * Component to add tracking script to a website
 * Usage:
 * 
 * ```tsx
 * // In your layout.tsx or page.tsx
 * import { TrackingScript } from '@/components/analytics/tracking-script';
 * 
 * export default function Layout({ children }) {
 *   return (
 *     <html lang="en">
 *       <body>
 *         {children}
 *         <TrackingScript trackingId="your-tracking-id" />
 *       </body>
 *     </html>
 *   );
 * }
 * ```
 */ 
"use client";

import { useState, useEffect } from 'react';
import { Globe } from 'lucide-react';

interface FaviconImageProps {
  domain: string;
  altText?: string;
  size?: number;
  className?: string;
}

export function FaviconImage({
  domain,
  altText,
  size = 20,
  className = ''
}: FaviconImageProps) {
  const [faviconUrl, setFaviconUrl] = useState<string>('');
  const [hasError, setHasError] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [currentSourceIndex, setCurrentSourceIndex] = useState<number>(0);

  useEffect(() => {
    setHasError(false);
    setIsLoading(true);
    setCurrentSourceIndex(0);
    const effectiveDomain = domain;

    if (!effectiveDomain ||
      effectiveDomain.toLowerCase() === 'direct' ||
      effectiveDomain.toLowerCase() === 'unknown' ||
      effectiveDomain.includes('localhost') ||
      effectiveDomain.includes('127.0.0.1')) {
      setHasError(true);
      setFaviconUrl('');
      setIsLoading(false);
      return;
    }

    try {
      // Clean the domain - remove protocol, www, and get just the hostname
      let hostname = effectiveDomain.replace(/^https?:\/\//, '').replace(/^www\./, '');

      // Remove any path, query, or fragment
      hostname = hostname.split('/')[0].split('?')[0].split('#')[0];

      // Validate hostname format
      if (!hostname || hostname.length < 3 || !hostname.includes('.')) {
        setHasError(true);
        setFaviconUrl('');
        setIsLoading(false);
        return;
      }

      // Use better favicon services that don't default to HTTP
      const faviconSources = [
        // DuckDuckGo's service is more reliable and doesn't assume HTTP
        `https://icons.duckduckgo.com/ip3/${hostname}.ico`,
        // Fallback to direct favicon
        `https://${hostname}/favicon.ico`,
        // Last resort: try with www prefix
        `https://www.${hostname}/favicon.ico`
      ];

      // Try the first source
      setFaviconUrl(faviconSources[0]);
      setIsLoading(false);

    } catch (e) {
      console.warn("Error processing domain for favicon URL:", effectiveDomain, e);
      setHasError(true);
      setFaviconUrl('');
      setIsLoading(false);
    }
  }, [domain]);

  const handleImageError = () => {
    const effectiveDomain = domain;

    if (!effectiveDomain) {
      setHasError(true);
      setIsLoading(false);
      return;
    }

    try {
      let hostname = effectiveDomain.replace(/^https?:\/\//, '').replace(/^www\./, '');
      hostname = hostname.split('/')[0].split('?')[0].split('#')[0];

      const faviconSources = [
        `https://icons.duckduckgo.com/ip3/${hostname}.ico`,
        `https://${hostname}/favicon.ico`,
        `https://www.${hostname}/favicon.ico`
      ];

      const nextIndex = currentSourceIndex + 1;

      if (nextIndex < faviconSources.length) {
        setCurrentSourceIndex(nextIndex);
        setFaviconUrl(faviconSources[nextIndex]);
        setIsLoading(true);
      } else {
        setHasError(true);
        setIsLoading(false);
      }
    } catch (e) {
      setHasError(true);
      setIsLoading(false);
    }
  };

  const handleImageLoad = () => {
    setIsLoading(false);
    setHasError(false);
  };

  if (hasError || !faviconUrl) {
    return (
      <div
        className={`${className} flex items-center justify-center rounded-sm`}
        style={{ width: size, height: size }}
      >
        <Globe
          className="text-muted-foreground"
          style={{ width: size * 0.6, height: size * 0.6 }}
          aria-label={altText || 'Website icon'}
        />
      </div>
    );
  }

  return (
    <div
      className={`${className} relative flex items-center justify-center rounded-sm overflow-hidden bg-muted/10`}
      style={{ width: size, height: size }}
    >
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-muted/20">
          <div
            className="animate-pulse bg-muted-foreground/20 rounded-full"
            style={{ width: size * 0.4, height: size * 0.4 }}
          />
        </div>
      )}
      <img
        src={faviconUrl}
        alt={altText || `${domain} favicon`}
        width={size}
        height={size}
        className={`transition-opacity duration-200 ${isLoading ? 'opacity-0' : 'opacity-100'}`}
        onError={handleImageError}
        onLoad={handleImageLoad}
        style={{
          width: size,
          height: size,
          objectFit: 'contain',
          imageRendering: '-webkit-optimize-contrast',
          filter: 'contrast(1.1) saturate(1.1)'
        }}
      />
    </div>
  );
} 
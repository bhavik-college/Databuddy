"use client";

import { GlobeIcon } from "@phosphor-icons/react";
import { useEffect, useState } from "react";

interface FaviconImageProps {
  domain: string;
  altText?: string;
  size?: number;
  className?: string;
}

// Local storage cache key helper
function getFaviconCacheKey(domain: string) {
  return `favicon-cache:${domain.toLowerCase()}`;
}

export function FaviconImage({ domain, altText, size = 20, className = "" }: FaviconImageProps) {
  const [faviconUrl, setFaviconUrl] = useState<string>("");
  const [hasError, setHasError] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [currentSourceIndex, setCurrentSourceIndex] = useState<number>(0);

  useEffect(() => {
    setHasError(false);
    setIsLoading(true);
    setCurrentSourceIndex(0);
    const effectiveDomain = domain;

    if (
      !effectiveDomain ||
      effectiveDomain.toLowerCase() === "direct" ||
      effectiveDomain.toLowerCase() === "unknown" ||
      effectiveDomain.includes("localhost") ||
      effectiveDomain.includes("127.0.0.1")
    ) {
      setHasError(true);
      setFaviconUrl("");
      setIsLoading(false);
      return;
    }

    try {
      // Clean the domain - remove protocol, www, and get just the hostname
      let hostname = effectiveDomain.replace(/^https?:\/\//, "").replace(/^www\./, "");
      hostname = hostname.split("/")[0].split("?")[0].split("#")[0];

      // Validate hostname format
      if (!hostname || hostname.length < 3 || !hostname.includes(".")) {
        setHasError(true);
        setFaviconUrl("");
        setIsLoading(false);
        return;
      }

      // Check localStorage cache
      const cacheKey = getFaviconCacheKey(hostname);
      const cachedUrl = typeof window !== "undefined" ? localStorage.getItem(cacheKey) : null;
      if (cachedUrl) {
        setFaviconUrl(cachedUrl);
        setIsLoading(false);
        return;
      }

      // Use better favicon services that don't default to HTTP
      const faviconSources = [
        `https://icons.duckduckgo.com/ip3/${hostname}.ico`,
        `https://${hostname}/favicon.ico`,
        `https://www.${hostname}/favicon.ico`,
      ];

      setFaviconUrl(faviconSources[0]);
      setIsLoading(false);
    } catch (e) {
      console.warn("Error processing domain for favicon URL:", effectiveDomain, e);
      setHasError(true);
      setFaviconUrl("");
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
      let hostname = effectiveDomain.replace(/^https?:\/\//, "").replace(/^www\./, "");
      hostname = hostname.split("/")[0].split("?")[0].split("#")[0];
      const faviconSources = [
        `https://icons.duckduckgo.com/ip3/${hostname}.ico`,
        `https://${hostname}/favicon.ico`,
        `https://www.${hostname}/favicon.ico`,
      ];
      const nextIndex = currentSourceIndex + 1;
      if (nextIndex < faviconSources.length) {
        setCurrentSourceIndex(nextIndex);
        setFaviconUrl(faviconSources[nextIndex]);
        setIsLoading(true);
      } else {
        // Remove cache entry if all fail
        const cacheKey = getFaviconCacheKey(hostname);
        if (typeof window !== "undefined") {
          localStorage.removeItem(cacheKey);
        }
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
    // Cache the favicon URL for this domain
    try {
      let hostname = domain.replace(/^https?:\/\//, "").replace(/^www\./, "");
      hostname = hostname.split("/")[0].split("?")[0].split("#")[0];
      const cacheKey = getFaviconCacheKey(hostname);
      if (typeof window !== "undefined" && faviconUrl) {
        localStorage.setItem(cacheKey, faviconUrl);
      }
    } catch { }
  };

  if (hasError || !faviconUrl) {
    return (
      <div
        className={`${className} flex items-center justify-center rounded-sm`}
        style={{ width: size, height: size }}
      >
        <GlobeIcon
          aria-label={altText || "Website icon"}
          className="text-muted-foreground"
          size={size}
          weight="fill"
        />
      </div>
    );
  }

  return (
    <div
      className={`${className} relative flex items-center justify-center overflow-hidden rounded-sm bg-muted/10`}
      style={{ width: size, height: size }}
    >
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-muted/20">
          <div
            className="animate-pulse rounded-full bg-muted-foreground/20"
            style={{ width: size * 0.4, height: size * 0.4 }}
          />
        </div>
      )}
      <img
        alt={altText || `${domain} favicon`}
        className={`transition-opacity duration-200 ${isLoading ? "opacity-0" : "opacity-100"}`}
        height={size}
        onError={handleImageError}
        onLoad={handleImageLoad}
        src={faviconUrl}
        style={{
          width: size,
          height: size,
          objectFit: "contain",
          imageRendering: "-webkit-optimize-contrast",
          filter: "contrast(1.1) saturate(1.1)",
        }}
        width={size}
      />
    </div>
  );
}

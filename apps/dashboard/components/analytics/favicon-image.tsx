'use client';

import { GlobeIcon } from '@phosphor-icons/react';
import { useState } from 'react';

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
  className = '',
}: FaviconImageProps) {
  const [error, setError] = useState(false);

  const hostname = domain
    .replace(/^https?:\/\//, '')
    .replace(/^www\./, '')
    .split('/')[0]
    .split('?')[0]
    .split('#')[0];

  const invalid =
    !hostname ||
    hostname.length < 3 ||
    !hostname.includes('.') ||
    hostname === 'direct' ||
    hostname === 'unknown' ||
    hostname.includes('localhost') ||
    hostname.includes('127.0.0.1');

  if (error || invalid) {
    return (
      <div
        className={`${className} flex items-center justify-center rounded-sm`}
        style={{ width: size, height: size }}
      >
        <GlobeIcon
          aria-label={altText || 'Website icon'}
          className="text-muted-foreground"
          size={size}
          weight="duotone"
        />
      </div>
    );
  }

  return (
    <img
      alt={altText || `${domain} favicon`}
      className={className}
      height={size}
      onError={() => setError(true)}
      src={`https://icons.duckduckgo.com/ip3/${hostname}.ico`}
      style={{
        width: size,
        height: size,
        objectFit: 'contain',
        imageRendering: '-webkit-optimize-contrast',
        filter: 'contrast(1.1) saturate(1.1)',
      }}
      width={size}
    />
  );
}

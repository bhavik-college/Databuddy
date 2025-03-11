import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Slugifies a string
 * @param text - The string to slugify
 * @returns The slugified string (e.g. "Hello World" -> "hello-world")
 */
export function slugify(text: string): string {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')        // Replace spaces with -
    .replace(/&/g, '-and-')      // Replace & with 'and'
    .replace(/[^\w\-]+/g, '')    // Remove all non-word characters
    .replace(/\-\-+/g, '-')      // Replace multiple - with single -
    .replace(/^-+/, '')          // Trim - from start of text
    .replace(/-+$/, '')          // Trim - from end of text
}

/**
 * Obfuscates an email address to protect it from spam harvesters
 * Converts the email into HTML entities and adds a no-script fallback
 * @param email - The email address to obfuscate
 * @returns The obfuscated email address
 */
export function obfuscateEmail(email: string): { __html: string } {
  // Convert email to HTML entities
  const obfuscated = Array.from(email)
    .map(char => `&#${char.charCodeAt(0)};`)
    .join('');
  
  // Create a mailto link with the obfuscated email
  const mailtoLink = `<a href="&#109;&#97;&#105;&#108;&#116;&#111;&#58;${obfuscated}" 
    class="text-sky-400 font-medium mb-2 text-wrap break-words hover:text-sky-300 transition-colors">
    ${obfuscated}
    <noscript>[Enable JavaScript to see email]</noscript>
  </a>`;
  
  return { __html: mailtoLink };
}

/**
 * Anonymizes an IP address for privacy with enhanced anonymization
 * For IPv4, removes the last two octets
 * For IPv6, removes the last 96 bits (more than standard anonymization)
 */
export function anonymizeIp(ip: string): string {
  if (!ip) return '0.0.0.0';
  
  // For IPv4, remove last two octets
  if (ip.includes('.')) {
    return ip.split('.').slice(0, 2).join('.') + '.0.0';
  }
  
  // For IPv6, remove last 96 bits (last 24 hex chars)
  if (ip.includes(':')) {
    return ip.split(':').slice(0, 4).join(':') + '::';
  }
  
  return ip;
}

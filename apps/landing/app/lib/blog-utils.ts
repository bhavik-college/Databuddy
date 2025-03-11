/**
 * Calculate the estimated reading time for a given text
 * @param text The text to calculate reading time for
 * @param wordsPerMinute The average reading speed in words per minute
 * @returns The estimated reading time in minutes
 */
export function calculateReadingTime(text: string, wordsPerMinute = 200): number {
  const words = text.trim().split(/\s+/).length;
  const minutes = words / wordsPerMinute;
  return Math.max(1, Math.round(minutes));
}

/**
 * Generate a meta description from the post content
 * @param content The post content
 * @param maxLength The maximum length of the description
 * @returns A truncated description suitable for meta tags
 */
export function generateMetaDescription(content: string, maxLength = 160): string {
  // Remove markdown formatting
  const plainText = content
    .replace(/!\[.*?\]\(.*?\)/g, '') // Remove images
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '$1') // Replace links with just the text
    .replace(/[#*_~`]/g, '') // Remove formatting characters
    .replace(/\n+/g, ' ') // Replace newlines with spaces
    .trim();
  
  // Truncate to maxLength
  if (plainText.length <= maxLength) {
    return plainText;
  }
  
  // Find the last space before maxLength
  const truncated = plainText.substring(0, maxLength);
  const lastSpace = truncated.lastIndexOf(' ');
  
  if (lastSpace === -1) {
    return truncated + '...';
  }
  
  return truncated.substring(0, lastSpace) + '...';
}

/**
 * Analyze keyword density in content
 * @param content The content to analyze
 * @param keyword The keyword or phrase to check
 * @returns The keyword density as a percentage
 */
export function analyzeKeywordDensity(content: string, keyword: string): number {
  // Remove markdown formatting to get plain text
  const plainText = content
    .replace(/!\[.*?\]\(.*?\)/g, '')
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '$1')
    .replace(/[#*_~`]/g, '')
    .trim();
  
  // Count total words
  const totalWords = plainText.split(/\s+/).length;
  
  // Count keyword occurrences (case insensitive)
  const keywordRegex = new RegExp(`\\b${keyword}\\b`, 'gi');
  const keywordMatches = plainText.match(keywordRegex) || [];
  const keywordCount = keywordMatches.length;
  
  // Calculate density
  return (keywordCount / totalWords) * 100;
}

/**
 * Generate SEO-friendly title
 * @param title The original title
 * @param siteName The site name to append
 * @param maxLength Maximum length for the title
 * @returns An SEO-optimized title
 */
export function generateSeoTitle(title: string, siteName: string = 'Databuddy Analytics', maxLength: number = 60): string {
  // If title already includes site name, return it if within length
  if (title.includes(siteName) && title.length <= maxLength) {
    return title;
  }
  
  // If title is too long even without site name, truncate it
  if (title.length > maxLength - 3) {
    const truncated = title.substring(0, maxLength - 3);
    const lastSpace = truncated.lastIndexOf(' ');
    return lastSpace === -1 ? truncated + '...' : truncated.substring(0, lastSpace) + '...';
  }
  
  // If adding site name would make it too long, return just the title
  if (title.length + siteName.length + 3 > maxLength) {
    return title;
  }
  
  // Otherwise, append site name
  return `${title} | ${siteName}`;
} 
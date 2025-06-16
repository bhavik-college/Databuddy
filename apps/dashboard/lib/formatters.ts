// Helper function to format numbers with metric prefixes (K, M, B)
export const formatMetricNumber = (num: number | undefined | null): string => {
  if (num === undefined || num === null) return "0";

  // Handle edge case for non-numeric strings that might have been converted to NaN
  if (Number.isNaN(num)) return "0"; 

  if (Math.abs(num) >= 1000000000) {
    return `${(num / 1000000000).toFixed(1)}B`;
  }
  if (Math.abs(num) >= 1000000) {
    return `${(num / 1000000).toFixed(1)}M`;
  }
  if (Math.abs(num) >= 1000) {
    return `${(num / 1000).toFixed(1)}K`;
  }
  // Ensure small numbers are also returned as strings
  return num.toString(); 
};

// You can add other shared formatting functions here in the future 
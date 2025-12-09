// Helper function to parse date strings as local dates (not UTC)
// This prevents "2025-12-08" from being interpreted as UTC midnight
// which would show as the previous day in PST (UTC-8)
export function parseLocalDate(dateString: string): Date {
  // If the string is in YYYY-MM-DD format, parse it as local time
  const dateMatch = dateString.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (dateMatch) {
    const [, year, month, day] = dateMatch;
    // Month is 0-indexed in Date constructor (0 = January, 11 = December)
    return new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
  }
  // Fallback to standard Date parsing for other formats
  return new Date(dateString);
}

// Helper function to format dates as YYYY-MM-DD for tooltips
export function formatDateForTooltip(date: Date | string | undefined): string {
  if (!date) return "";
  const dateObj = date instanceof Date ? date : new Date(date);
  if (isNaN(dateObj.getTime())) return "";
  const year = dateObj.getFullYear();
  const month = String(dateObj.getMonth() + 1).padStart(2, "0");
  const day = String(dateObj.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

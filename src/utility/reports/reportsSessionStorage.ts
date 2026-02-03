/**
 * Session storage for ClassCharts analysis only.
 * Avoids re-running the get functions on every refresh
 * Cleared on tab close (sessionStorage)
 */

const COURSE_ANALYSIS_KEY = (courseId: string, username: string) => `papyrus_reports_analysis_${courseId}_${username}`;

// Error handling for null or invalid JSON
function safeParse<T>(raw: string | null): T | null {
  if (raw == null) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

// ClassCharts analysis caching
export function getCourseAnalysis(courseId: string, username: string): unknown | null {
  if (typeof sessionStorage === "undefined" || !courseId || !username) return null;
  const raw = sessionStorage.getItem(COURSE_ANALYSIS_KEY(courseId, username));
  return safeParse(raw);
}

export function setCourseAnalysis(courseId: string, username: string, analysis: unknown): void {
  if (typeof sessionStorage === "undefined" || !courseId || !username) return;
  try {
    sessionStorage.setItem(COURSE_ANALYSIS_KEY(courseId, username), JSON.stringify(analysis));
  } catch {
    // ignore
  }
}

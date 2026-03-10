/**
 * Session storage for ClassCharts analysis only.
 * Avoids re-running the get functions on every refresh
 * Cleared on tab close (sessionStorage)
 */

const STORAGE_PREFIX = "papyrus_reports_";
const VALUE_PREFIX = "pr_v1_";
const ENCRYPTION_KEY = "papyrus_reports_encryption_v1"; // used only for XOR, not security

// 53-bit string hash for cache keys (non-crypto, for key derivation only)
// Uses random h1 and h2 seeds and then XOR and multiplication to get a 53-bit hash
// Not entirely secure but might be good enough for our purposes
function hashString(str: string): string {
  let h1 = 0x811c9dc5 | 0;
  let h2 = 0x01000193 | 0;
  for (let i = 0; i < str.length; i++) {
    const ch = str.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 2654435761);
    h2 = Math.imul(h2 ^ ch, 1597334677);
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  return (4294967296 * (2097151 & h2) + (h1 >>> 0)).toString(36);
}

function cacheKey(courseId: string, username: string): string {
  return STORAGE_PREFIX + hashString(`analysis_${courseId}_${username}`);
}

// Encryption for session storage
function encrypt(plain: string): string {
  let out = "";
  for (let i = 0; i < plain.length; i++) {
    out += String.fromCharCode(plain.charCodeAt(i) ^ ENCRYPTION_KEY.charCodeAt(i % ENCRYPTION_KEY.length));
  }
  return VALUE_PREFIX + btoa(out);
}

function decrypt(stored: string): string | null {
  if (!stored.startsWith(VALUE_PREFIX)) return null;
  try {
    const decoded = atob(stored.slice(VALUE_PREFIX.length));
    let out = "";
    for (let i = 0; i < decoded.length; i++) {
      out += String.fromCharCode(decoded.charCodeAt(i) ^ ENCRYPTION_KEY.charCodeAt(i % ENCRYPTION_KEY.length));
    }
    return out;
  } catch {
    return null;
  }
}

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
  const raw = sessionStorage.getItem(cacheKey(courseId, username));
  if (raw == null) return null;
  const decoded = decrypt(raw);
  if (decoded !== null) return safeParse(decoded);
  return safeParse(raw); // backward compat: old entries stored as plain JSON
}

export function setCourseAnalysis(courseId: string, username: string, analysis: unknown): void {
  if (typeof sessionStorage === "undefined" || !courseId || !username) return;
  try {
    const encrypted = encrypt(JSON.stringify(analysis));
    sessionStorage.setItem(cacheKey(courseId, username), encrypted);
  } catch {
    // ignore
  }
}

// Remembering student list popup state when leaving (open/closed)
const popupKey = (courseId: string) => STORAGE_PREFIX + "popup_open_" + hashString(courseId);

export function getStudentListPopupOpen(courseId: string): boolean {
  if (typeof sessionStorage === "undefined" || !courseId) return false;
  return sessionStorage.getItem(popupKey(courseId)) === "1";
}

export function setStudentListPopupOpen(courseId: string, open: boolean): void {
  if (typeof sessionStorage === "undefined" || !courseId) return;
  if (open) {
    sessionStorage.setItem(popupKey(courseId), "1");
  } else {
    sessionStorage.removeItem(popupKey(courseId));
  }
}

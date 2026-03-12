/**
 * Simplified theming system using CSS classes and custom properties
 * Supports light and dark themes via CSS classes applied to document root
 * CSS variables defined in src/index.css handle the actual styling
 */

import { changeLanguage } from "../i18n";

export type Theme = "light" | "dark" | "colorful-light" | "colorful-dark";

export interface UserSettings {
  theme: string;
  textSize: string;
  language: string;
}

export function normalizeUserSettings(user: {
  "custom:theme"?: string;
  "custom:textSize"?: string;
  "custom:language"?: string;
}): UserSettings {
  const theme =
    user["custom:theme"] &&
    ["dark", "colorful-light", "colorful-dark"].includes(user["custom:theme"])
      ? user["custom:theme"]
      : "light";

  const textSize =
    user["custom:textSize"] &&
    ["xs", "sm", "md", "lg", "xl"].includes(user["custom:textSize"])
      ? user["custom:textSize"]
      : "md";

  const language =
    user["custom:language"] &&
    ["english", "spanish"].includes(user["custom:language"])
      ? user["custom:language"]
      : "english";

  return { theme, textSize, language };
}

export function applyUserSettings(settings: UserSettings) {
  const root = document.documentElement;
  changeTheme(root, settings.theme);
  root.setAttribute("data-text-size", settings.textSize);
  const langCode = settings.language === "spanish" ? "es" : "en";
  changeLanguage(langCode as "en" | "es");
  root.setAttribute("lang", langCode);
}

export function changeTheme(root: HTMLElement, theme: string) {
  // Support all theme variants
  const normalizedTheme: Theme = ["dark", "colorful-light", "colorful-dark"].includes(theme)
    ? theme as Theme
    : "light";

  // Remove existing theme classes
  root.classList.remove("light", "dark", "colorful-light", "colorful-dark");

  // Add new theme class
  root.classList.add(normalizedTheme);

  // Set data attribute for compatibility
  root.setAttribute("data-theme", normalizedTheme);
}

// Helper function to get current theme from user preference
export function getUserTheme(userTheme?: string): Theme {
  // Map theme values including both colorful variants
  switch (userTheme) {
    case "dark":
      return "dark";
    case "colorful-light":
      return "colorful-light";
    case "colorful-dark":
      return "colorful-dark";
    case "light":
    case "colorful":
    default:
      return "light";
  }
}


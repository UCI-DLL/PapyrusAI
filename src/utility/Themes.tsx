/**
 * Simplified theming system using CSS classes and custom properties
 * Supports light and dark themes via CSS classes applied to document root
 * CSS variables defined in src/index.css handle the actual styling
 */

export type Theme = "light" | "dark" | "colorful-light" | "colorful-dark";

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


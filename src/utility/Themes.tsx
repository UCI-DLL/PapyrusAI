/**
 * Simplified theming system using CSS classes and custom properties
 * Supports light and dark themes via CSS classes applied to document root
 * CSS variables defined in src/index.css handle the actual styling
 */

export type Theme = "light" | "dark";

export function changeTheme(root: HTMLElement, theme: string) {
  // Normalize theme - colorful themes fallback to light
  const normalizedTheme: Theme = theme === "dark" ? "dark" : "light";
  
  // Remove existing theme classes
  root.classList.remove("light", "dark");
  
  // Add new theme class
  root.classList.add(normalizedTheme);
  
  // Set data attribute for compatibility
  root.setAttribute("data-theme", normalizedTheme);
}

// Helper function to get current theme from user preference
export function getUserTheme(userTheme?: string): Theme {
  // Map old theme values to new simplified themes
  switch (userTheme) {
    case "dark":
      return "dark";
    case "light":
    case "colorful-light": 
    case "colorful-dark":
    default:
      return "light";
  }
}


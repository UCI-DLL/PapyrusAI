import React, { createContext, useContext, useEffect, useState } from "react";

type Theme = "light" | "dark" | "colorful-light" | "colorful-dark";

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>("light");

  useEffect(() => {
    // Apply theme class to document root
    const root = document.documentElement;
    root.classList.remove("light", "dark", "colorful-light", "colorful-dark");
    root.classList.add(theme);

    // Also apply to html element for compatibility
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}
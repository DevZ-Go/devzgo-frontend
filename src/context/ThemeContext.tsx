import React, { useContext, useEffect } from "react";
import { stableContext } from "../utils/stableContext";

export type Theme = "dark" | "light";

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
}

const ThemeContext = stableContext<ThemeContextType | undefined>("ThemeContext", undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const theme: Theme = "light";

  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove("dark");
    root.classList.add("light");
    localStorage.setItem("devzgo_theme", "light");
  }, []);

  const toggleTheme = () => {};
  const setTheme = () => {};

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}

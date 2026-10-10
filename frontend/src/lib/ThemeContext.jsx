/* eslint-disable react-refresh/only-export-components -- context + its hook belong together */
import { createContext, useContext, useEffect, useState } from "react";

const ThemeContext = createContext(null);
// A new key, written only when someone picks a theme themselves. (The old key was filled in automatically from the device's setting,
// so it cannot tell a real choice from a default, and is ignored.)
const STORAGE_KEY = "simple-politics-theme-choice";

// Every visit starts in light mode, whatever the device's own setting says. Dark mode is there for anyone who switches to it, and the
// site remembers that choice.
function getInitialTheme() {
  try {
    return window.localStorage.getItem(STORAGE_KEY) === "dark" ? "dark" : "light";
  } catch {
    return "light";
  }
}

export function ThemeProvider({ children }) {
  const [theme, setThemeState] = useState(getInitialTheme);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

  const setTheme = (next) => {
    setThemeState(next);
    try {
      window.localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // The choice still applies for this visit even if it can't be saved.
    }
  };
  const toggleTheme = () => setTheme(theme === "dark" ? "light" : "dark");

  return <ThemeContext.Provider value={{ theme, setTheme, toggleTheme }}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within a ThemeProvider");
  return ctx;
}

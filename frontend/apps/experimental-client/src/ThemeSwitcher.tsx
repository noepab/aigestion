import React from "react";
import { useTheme } from "./theme";

export const ThemeSwitcher: React.FC = () => {
  const { theme, toggleTheme } = useTheme();
  return (
    <button onClick={toggleTheme} style={{
      padding: "0.5em 1em",
      borderRadius: 6,
      border: "1px solid var(--color-primary)",
      background: "var(--color-bg)",
      color: "var(--color-primary)",
      cursor: "pointer"
    }}>
      {theme === "light" ? "🌞 Modo Claro" : "🌙 Modo Oscuro"}
    </button>
  );
};

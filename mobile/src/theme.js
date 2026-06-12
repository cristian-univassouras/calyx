import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const light = {
  bg:         '#f5ece0',
  panel:      '#fffdf9',
  panel2:     '#f3e8d6',
  border:     '#e3d3bb',
  text:       '#3b2c1d',
  muted:      '#927a60',
  accent:     '#9c6b3f',
  accent2:    '#7d5430',
  accentSoft: '#e9d9c2',
  danger:     '#b23a2e',
  honey:      '#d9a441',
  radius:     14,
};

const dark = {
  bg:         '#1a1510',
  panel:      '#261f18',
  panel2:     '#332a21',
  border:     '#40352a',
  text:       '#e6e0d8',
  muted:      '#a3988e',
  accent:     '#c98a51',
  accent2:    '#d69b65',
  accentSoft: '#5a3d24',
  danger:     '#d9534f',
  honey:      '#e6b85c',
  radius:     14,
};

export const theme = light;

const ThemeContext = createContext({
  isDark: false,
  toggleTheme: () => {},
  theme: light,
});

export function ThemeProvider({ children }) {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem('@app_theme').then((val) => {
      if (val === 'dark') setIsDark(true);
    });
  }, []);

  const toggleTheme = async () => {
    const next = !isDark;
    setIsDark(next);
    await AsyncStorage.setItem('@app_theme', next ? 'dark' : 'light');
  };

  return (
    <ThemeContext.Provider value={{ isDark, toggleTheme, theme: isDark ? dark : light }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useAppTheme() {
  const ctx = useContext(ThemeContext);
  return ctx.theme;
}

export function useThemeToggle() {
  const ctx = useContext(ThemeContext);
  return { isDark: ctx.isDark, toggleTheme: ctx.toggleTheme };
}

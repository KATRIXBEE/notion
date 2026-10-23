"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

interface SettingsContextType {
  textSize: number;
  setTextSize: (v: number) => void;
  pageWidth: number;
  setPageWidth: (v: number) => void;
  darkMode: boolean;
  setDarkMode: (v: boolean) => void;
}

const SettingsContext = createContext<SettingsContextType>({
  textSize: 16,
  setTextSize: () => {},
  pageWidth: 800,
  setPageWidth: () => {},
  darkMode: false,
  setDarkMode: () => {},
});

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [textSize, setTextSize] = useState<number>(16);
  const [pageWidth, setPageWidth] = useState<number>(800);
  const [darkMode, setDarkMode] = useState<boolean>(false);

  useEffect(() => {
    // Check system preference or localStorage
    const savedDark = localStorage.getItem("nl_dark_mode") === "true";
    setDarkMode(savedDark);
    document.documentElement.classList.toggle("dark", savedDark);
  }, []);

  const handleDarkChange = (val: boolean) => {
    setDarkMode(val);
    localStorage.setItem("nl_dark_mode", String(val));
    document.documentElement.classList.toggle("dark", val);
  };

  return (
    <SettingsContext.Provider
      value={{
        textSize,
        setTextSize,
        pageWidth,
        setPageWidth,
        darkMode,
        setDarkMode: handleDarkChange,
      }}
    >
      {children}
    </SettingsContext.Provider>
  );
}

export const useSettings = () => useContext(SettingsContext);

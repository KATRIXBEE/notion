"use client";

import React from "react";
import { AuthProvider } from "@/lib/context/AuthContext";
import { SettingsProvider } from "@/lib/context/SettingsContext";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SettingsProvider>
      <AuthProvider>{children}</AuthProvider>
    </SettingsProvider>
  );
}

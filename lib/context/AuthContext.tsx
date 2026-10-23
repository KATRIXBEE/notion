"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";

export interface UserInfo {
  userId: string;
  email?: string;
  username?: string;
}

interface AuthContextType {
  user: UserInfo | null;
  loading: boolean;
  setUser: (u: UserInfo | null) => void;
  refreshUser: () => Promise<UserInfo | null>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  setUser: () => {},
  refreshUser: async () => null,
  logout: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUserState] = useState<UserInfo | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const router = useRouter();

  const setUser = (u: UserInfo | null) => {
    setUserState(u);
    if (u) {
      try {
        localStorage.setItem("nl_user", JSON.stringify(u));
      } catch {
        // ignore
      }
    } else {
      try {
        localStorage.removeItem("nl_user");
      } catch {
        // ignore
      }
    }
  };

  const refreshUser = useCallback(async (): Promise<UserInfo | null> => {
    try {
      const res = await fetch("/api/auth/me");
      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
        return data.user;
      } else {
        // If 401 and we had a cached local user, keep it in dev mode if cookie is active
        const saved = localStorage.getItem("nl_user");
        if (saved) {
          try {
            const parsed = JSON.parse(saved);
            setUserState(parsed);
            return parsed;
          } catch {
            setUser(null);
          }
        } else {
          setUser(null);
        }
        return null;
      }
    } catch {
      const saved = localStorage.getItem("nl_user");
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          setUserState(parsed);
          return parsed;
        } catch {
          setUser(null);
        }
      }
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // Immediate hydration from localStorage to prevent auth flicker
    try {
      const cached = localStorage.getItem("nl_user");
      if (cached) {
        setUserState(JSON.parse(cached));
      }
    } catch {
      // ignore
    }
    refreshUser();
  }, [refreshUser]);

  const logout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } finally {
      setUser(null);
      router.push("/login");
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, setUser, refreshUser, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);

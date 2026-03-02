"use client";

import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { jwtDecode } from "jwt-decode";
import Cookies from "js-cookie";
import { authApi, saveAuth, clearAuth } from "@/lib/api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user,      setUser]      = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Hydrate user from stored token on mount
  useEffect(() => {
    const token = Cookies.get("access_token");
    if (token) {
      try {
        const decoded = jwtDecode(token);
        if (decoded.exp * 1000 > Date.now()) {
          // Token still valid – fetch fresh profile
          authApi
            .me()
            .then(({ data }) => setUser(data))
            .catch(() => {
              clearAuth();
              setUser(null);
            })
            .finally(() => setIsLoading(false));
          return;
        }
      } catch {
        // Malformed token
      }
    }
    clearAuth();
    setIsLoading(false);
  }, []);

  const login = useCallback(async (username, password) => {
    const { data } = await authApi.login(username, password);
    saveAuth(data.access, data.refresh);
    setUser(data.user);
    return data.user;
  }, []);

  const logout = useCallback(() => {
    const refresh = Cookies.get("refresh_token");
    if (refresh) authApi.logout(refresh).catch(() => {});
    clearAuth();
    setUser(null);
    window.location.href = "/login";
  }, []);

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}

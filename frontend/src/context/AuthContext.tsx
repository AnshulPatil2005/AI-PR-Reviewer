import { createContext, useContext, useState, useEffect, useCallback } from "react";
import type { ReactNode } from "react";
import { authApi } from "../api/endpoints";
import type { UserData } from "../api/endpoints";

interface AuthUser {
  id: number;
  email: string;
  monthly_quota: number;
  analyses_this_month: number;
  quota_resets_on: string | null;
}

interface AuthContextValue {
  user: AuthUser | null;
  token: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function toAuthUser(data: UserData): AuthUser {
  return {
    id: data.id,
    email: data.email,
    monthly_quota: data.monthly_quota ?? 10,
    analyses_this_month: data.analyses_this_month ?? 0,
    quota_resets_on: data.quota_resets_on ?? null,
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(() => {
    const stored = localStorage.getItem("user");
    return stored ? JSON.parse(stored) : null;
  });
  const [token, setToken] = useState<string | null>(() => localStorage.getItem("token"));
  const [isLoading, setIsLoading] = useState(false);

  const refreshUser = useCallback(async () => {
    try {
      const res = await authApi.me();
      const authUser = toAuthUser(res.data);
      localStorage.setItem("user", JSON.stringify(authUser));
      setUser(authUser);
    } catch {
      // silently fail — token may have expired
    }
  }, []);

  useEffect(() => {
    if (token && !user) {
      refreshUser();
    }
  }, []);

  const _saveSession = (accessToken: string, userData: AuthUser) => {
    localStorage.setItem("token", accessToken);
    localStorage.setItem("user", JSON.stringify(userData));
    setToken(accessToken);
    setUser(userData);
  };

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const res = await authApi.login(email, password);
      // Fetch full user data (with quota) after login
      localStorage.setItem("token", res.data.access_token);
      setToken(res.data.access_token);
      const meRes = await authApi.me();
      _saveSession(res.data.access_token, toAuthUser(meRes.data));
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const res = await authApi.register(email, password);
      localStorage.setItem("token", res.data.access_token);
      setToken(res.data.access_token);
      const meRes = await authApi.me();
      _saveSession(res.data.access_token, toAuthUser(meRes.data));
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, login, register, logout, refreshUser, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

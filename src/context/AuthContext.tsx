"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

interface AuthContextType {
  isAuthenticated: boolean;
  user: any | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  fetchUser: () => Promise<void>;
  fetchSidebarPermissions: () => Promise<void>;
  sidebarPermissions: string[];
  permissionsLoading: boolean;
  isLoading: boolean;
  error: string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sidebarPermissions, setSidebarPermissions] = useState<string[]>([]);
  const [permissionsLoading, setPermissionsLoading] = useState(true);

  // Check if user is authenticated on mount
  useEffect(() => {
    const checkAuth = () => {
      const storedUser = localStorage.getItem("user");
      const authToken = localStorage.getItem("authToken");
      const storedSidebarPermissions = localStorage.getItem("sidebarPermissions");

      if (storedUser && authToken) {
        setUser(JSON.parse(storedUser));
        setIsAuthenticated(true);
        if (storedSidebarPermissions) {
          setSidebarPermissions(JSON.parse(storedSidebarPermissions));
          setPermissionsLoading(false);
        } else {
          setPermissionsLoading(true);
        }
        // fetch fresh user from server
        fetchUser().catch(() => {});
      } else {
        setPermissionsLoading(false);
      }
      setIsLoading(false);
    };

    // Small delay to ensure localStorage is ready
    const timer = setTimeout(checkAuth, 100);
    return () => clearTimeout(timer);
  }, []);

  const login = async (email: string, password: string) => {
    try {
      setError(null);
      const response = await fetch('/api/auth/signin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Error al iniciar sesión');
      }

      const data = await response.json();
      
      localStorage.setItem('user', JSON.stringify(data.user));
      localStorage.setItem('authToken', data.token);

      setUser(data.user);
      setIsAuthenticated(true);
      await fetchSidebarPermissions();
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  };

  const fetchUser = async () => {
    try {
      const token = localStorage.getItem('authToken');
      if (!token) return;
      const res = await fetch('/api/user', {
        method: 'GET',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) return;
      const data = await res.json();
      if (data.user) {
        localStorage.setItem('user', JSON.stringify(data.user));
        setUser(data.user);
        setIsAuthenticated(true);
        await fetchSidebarPermissions();
      }
    } catch (e) {
      console.error('fetchUser error', e);
    }
  };

  const fetchSidebarPermissions = async () => {
    try {
      setPermissionsLoading(true);
      const token = localStorage.getItem('authToken');
      if (!token) return;

      const res = await fetch('/api/sidebar-permissions', {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        return;
      }

      const data = await res.json();
      const enabledKeys = Array.isArray(data.enabledKeys) ? data.enabledKeys : [];
      setSidebarPermissions(enabledKeys);
      localStorage.setItem('sidebarPermissions', JSON.stringify(enabledKeys));
    } catch (e) {
      console.error('fetchSidebarPermissions error', e);
    } finally {
      setPermissionsLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem("user");
    localStorage.removeItem("authToken");
    localStorage.removeItem("sidebarPermissions");
    setUser(null);
    setIsAuthenticated(false);
    setSidebarPermissions([]);
    setPermissionsLoading(false);
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, user, login, logout, fetchUser, fetchSidebarPermissions, sidebarPermissions, permissionsLoading, isLoading, error }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { apiRequest } from '../lib/api';
import {
    clearAuthSession,
    getAuthToken,
    getAuthUser,
    saveAuthSession,
    type AuthUser,
} from '../lib/authStorage';

type AuthResponse = {
  token: string;
  user: AuthUser;
};

type AuthContextType = {
  user: AuthUser | null;
  token: string | null;
  loading: boolean;
  isAuthenticated: boolean;
  refreshProfile: () => Promise<void>;
  updateProfile: (updates: { name?: string; avatar_data?: string }) => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const bootstrapAuth = async () => {
      try {
        const [storedToken, storedUser] = await Promise.all([getAuthToken(), getAuthUser()]);

        if (storedToken && storedUser) {
          try {
            const profile = await apiRequest<{ data: AuthUser }>('/auth/me', {
              method: 'GET',
              requiresAuth: true,
            });

            setToken(storedToken);
            setUser(profile.data ?? storedUser);
          } catch {
            await clearAuthSession();
            setToken(null);
            setUser(null);
          }
        }
      } finally {
        setLoading(false);
      }
    };

    bootstrapAuth();
  }, []);

  const persistAuth = useCallback(async (response: AuthResponse) => {
    await saveAuthSession(response.token, response.user);
    setToken(response.token);
    setUser(response.user);
  }, []);

  const refreshProfile = useCallback(async () => {
    const profile = await apiRequest<{ data: AuthUser }>('/auth/me', {
      method: 'GET',
      requiresAuth: true,
    });

    const currentToken = token ?? (await getAuthToken());
    if (!currentToken) {
      throw new Error('Authentication required');
    }

    await saveAuthSession(currentToken, profile.data);
    setUser(profile.data);
  }, [token]);

  const updateProfile = useCallback(async (updates: { name?: string; avatar_data?: string }) => {
    const response = await apiRequest<{ data: AuthUser }>('/auth/me', {
      method: 'PUT',
      body: updates,
      requiresAuth: true,
    });

    const currentToken = token ?? (await getAuthToken());
    if (!currentToken) {
      throw new Error('Authentication required');
    }

    await saveAuthSession(currentToken, response.data);
    setUser(response.data);
  }, [token]);

  const login = useCallback(async (email: string, password: string) => {
    const response = await apiRequest<AuthResponse>('/auth/login', {
      method: 'POST',
      requiresAuth: false,
      body: { email, password },
    });

    await persistAuth(response);
  }, [persistAuth]);

  const register = useCallback(async (name: string, email: string, password: string) => {
    const response = await apiRequest<AuthResponse>('/auth/register', {
      method: 'POST',
      requiresAuth: false,
      body: { name, email, password },
    });

    await persistAuth(response);
  }, [persistAuth]);

  const logout = useCallback(async () => {
    setToken(null);
    setUser(null);

    try {
      await clearAuthSession();
    } catch (error) {
      console.error('Failed to clear auth session from storage:', error);
    }
  }, []);

  const value = useMemo<AuthContextType>(() => ({
    user,
    token,
    loading,
    isAuthenticated: !!token,
    refreshProfile,
    updateProfile,
    login,
    register,
    logout,
  }), [user, token, loading, refreshProfile, updateProfile, login, register, logout]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuthContext = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuthContext must be used within AuthProvider');
  }

  return context;
};

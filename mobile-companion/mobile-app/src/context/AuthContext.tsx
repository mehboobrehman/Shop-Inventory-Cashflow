import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, LoginRequest } from '../types/auth';
import storage from '../services/storage';
import {
  setApiBaseUrl,
  setOnUnauthorized,
  loginApi,
  logoutApi,
  getCurrentUserApi,
  resolveBaseUrl,
} from '../services/api';

interface AuthContextType {
  user: User | null;
  token: string | null;
  serverUrl: string;
  isLoading: boolean;
  isAuthenticated: boolean;
  error: string | null;
  login: (credentials: LoginRequest) => Promise<void>;
  logout: () => Promise<void>;
  updateServerUrl: (url: string) => Promise<string>;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [serverUrl, setServerUrlState] = useState<string>(resolveBaseUrl());
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Initialize Auth State from Secure Store on startup
  useEffect(() => {
    let isMounted = true;

    const initializeAuth = async () => {
      try {
        // Register global 401 unauthorized handler
        setOnUnauthorized(() => {
          if (isMounted) {
            setToken(null);
            setUser(null);
            setError('Session expired. Please log in again.');
          }
        });

        // Restore server URL if previously saved
        const savedServerUrl = await storage.getServerUrl();
        if (savedServerUrl) {
          const resolved = setApiBaseUrl(savedServerUrl);
          if (isMounted) setServerUrlState(resolved);
        } else {
          setApiBaseUrl(serverUrl);
        }

        // Restore token and user
        const savedToken = await storage.getToken();
        const savedUser = await storage.getUser();

        if (savedToken) {
          if (isMounted) {
            setToken(savedToken);
            setUser(savedUser);
          }

          // Verify token validity by calling /auth/me
          try {
            const freshUser = await getCurrentUserApi();
            if (isMounted) {
              setUser(freshUser);
              await storage.saveUser(freshUser);
            }
          } catch (meError: any) {
            console.warn('Token verification failed on startup:', meError?.message);
            // If token is invalid or server rejected, clear session
            if (meError?.response?.status === 401) {
              await storage.clearAuth();
              if (isMounted) {
                setToken(null);
                setUser(null);
              }
            }
          }
        }
      } catch (err: any) {
        console.error('Failed to restore auth state from Secure Store:', err);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    initializeAuth();

    return () => {
      isMounted = false;
      setOnUnauthorized(null);
    };
  }, []);

  const login = async (credentials: LoginRequest): Promise<void> => {
    setError(null);
    try {
      const data = await loginApi(credentials);
      const authToken = data.token;
      const authenticatedUser = data.user;

      if (authToken) {
        await storage.saveToken(authToken);
        setToken(authToken);
      }
      if (authenticatedUser) {
        await storage.saveUser(authenticatedUser);
        setUser(authenticatedUser);
      }
    } catch (err: any) {
      const errMsg = err?.response?.data?.error?.message || err?.message || 'Login failed';
      setError(errMsg);
      throw new Error(errMsg);
    }
  };

  const logout = async (): Promise<void> => {
    try {
      await logoutApi();
    } catch (err) {
      console.warn('Logout error:', err);
    } finally {
      await storage.clearAuth();
      setToken(null);
      setUser(null);
      setError(null);
    }
  };

  const updateServerUrl = async (url: string): Promise<string> => {
    const resolvedUrl = setApiBaseUrl(url);
    await storage.saveServerUrl(resolvedUrl);
    setServerUrlState(resolvedUrl);
    return resolvedUrl;
  };

  const clearError = () => setError(null);

  const value: AuthContextType = {
    user,
    token,
    serverUrl,
    isLoading,
    isAuthenticated: !!token && !!user,
    error,
    login,
    logout,
    updateServerUrl,
    clearError,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;

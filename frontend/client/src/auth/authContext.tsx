import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, LoginCredentials, AuthContextType, Role } from '../types/auth';
import { authApi } from '../services/api';
import { mockAuthService } from './mockAuthService';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Restore authenticated session on mount from server or local storage
  useEffect(() => {
    let isMounted = true;
    async function initAuth() {
      try {
        // 1. Try server session first
        const serverUser = await authApi.getCurrentUser();
        if (serverUser && isMounted) {
          setUser(serverUser);
          setIsLoading(false);
          return;
        }

        // 2. Fallback to local stored dev user
        const stored = mockAuthService.getStoredUser();
        if (stored && isMounted) {
          setUser(stored);
        }
      } catch {
        if (isMounted) setUser(null);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    initAuth();
    return () => {
      isMounted = false;
    };
  }, []);

  const login = async (credentials: LoginCredentials): Promise<User> => {
    setIsLoading(true);
    try {
      // Determine intended role from credentials
      let role: Role = 'MEMBER';
      if (credentials.membershipStatus === 'CORE_MEMBER') {
        role = 'TEAM_LEADER';
      }
      if (credentials.email.toLowerCase().includes('admin')) {
        role = 'ADMIN';
      }

      const name = credentials.email.split('@')[0];

      try {
        // Attempt live backend authentication
        const liveUser = await authApi.loginDev(credentials.email, name, role);
        setUser(liveUser);
        localStorage.setItem('gdgoc_current_user', JSON.stringify(liveUser));
        return liveUser;
      } catch (err) {
        console.warn('[Auth] Live server dev-login unavailable; falling back to local preview session:', err);
        // Fallback to mockAuthService so development preview always works smoothly
        const fallbackUser = await mockAuthService.login(credentials);
        setUser(fallbackUser);
        return fallbackUser;
      }
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      await authApi.logout();
    } catch {
      // ignore
    }
    mockAuthService.logout();
    setUser(null);
  };

  const value: AuthContextType = {
    user,
    isAuthenticated: !!user,
    isLoading,
    login,
    logout,
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
